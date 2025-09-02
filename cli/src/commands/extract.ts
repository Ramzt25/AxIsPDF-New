// Extract Command - Extract text from PDFs

import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PDFDocument } from '../../../core/src/pdf/pdfium.js';
import { tesseractEngine, shouldUseOCR } from '../../../core/src/ocr/tesseract.js';
import { TextRun } from '../../../core/src/types.js';

export async function extractCommand(
  input: string,
  options: {
    output?: string;
    format: 'json' | 'csv' | 'txt';
    ocr?: boolean;
    lang: string;
  }
): Promise<void> {
  const startTime = Date.now();
  let document: PDFDocument | null = null;
  
  try {
    console.log(chalk.cyan('📖 Starting text extraction...'));
    console.log(chalk.white(`Input: ${input}`));
    console.log(chalk.white(`Format: ${options.format}`));
    console.log(chalk.white(`OCR Language: ${options.lang}`));
    
    // Verify input file exists
    try {
      await fs.access(input);
    } catch (error) {
      throw new Error(`Input file not found: ${input}`);
    }

    console.log(chalk.blue('🔍 Loading PDF document...'));
    document = await PDFDocument.open(input);
    const pages = await document.pages();
    const pageCount = pages.length;
    
    console.log(chalk.white(`   Pages found: ${pageCount}`));

    const extractedPages: Array<{
      pageIndex: number;
      text: string;
      textRuns: TextRun[];
      ocrUsed: boolean;
    }> = [];

    // Process each page
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
      console.log(chalk.blue(`� Processing page ${pageIndex + 1}/${pageCount}...`));
      
      const page = pages[pageIndex];
      const pageSize = await page.size();
      
      // Extract existing text from PDF
      let textRuns = await page.text();
      let pageText = textRuns.map((run: TextRun) => run.text).join(' ');
      let ocrUsed = false;

      // Determine if OCR is needed
      const needsOCR = options.ocr || await shouldUseOCR(textRuns, pageSize);
      
      if (needsOCR) {
        console.log(chalk.yellow(`   🔍 Running OCR on page ${pageIndex + 1}...`));
        
        try {
          // Render page as image for OCR
          const imageBuffer = await page.render({
            x: 0,
            y: 0,
            width: pageSize.width,
            height: pageSize.height,
            scale: 2.0 // Higher resolution for better OCR
          });

          // Perform OCR
          const ocrResult = await tesseractEngine.recognizeImage(imageBuffer, {
            lang: options.lang,
            psm: 1 // Automatic page segmentation
          });

          // If OCR found more text, use it
          if (ocrResult.text.trim().length > pageText.trim().length) {
            textRuns = ocrResult.textRuns;
            pageText = ocrResult.text;
            ocrUsed = true;
            console.log(chalk.green(`   ✅ OCR completed (confidence: ${(ocrResult.confidence * 100).toFixed(1)}%)`));
          } else {
            console.log(chalk.yellow(`   ⚠️ OCR found less text than PDF extraction, using PDF text`));
          }
        } catch (ocrError) {
          console.log(chalk.yellow(`   ⚠️ OCR failed: ${ocrError instanceof Error ? ocrError.message : 'Unknown error'}`));
          console.log(chalk.white(`   📝 Using PDF text extraction only`));
        }
      }

      extractedPages.push({
        pageIndex,
        text: pageText,
        textRuns,
        ocrUsed
      });
    }

    // Generate output
    const outputPath = options.output || `extracted.${options.format}`;
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const extractionData = {
      file: input,
      pages: extractedPages,
      extractionTime: Date.now() - startTime,
      totalPages: pageCount,
      ocrPages: extractedPages.filter(p => p.ocrUsed).length
    };

    let content = '';
    switch (options.format) {
      case 'json':
        content = JSON.stringify(extractionData, null, 2);
        break;
      case 'csv':
        content = 'file,page,text,ocr_used\n';
        content += extractedPages.map(p => 
          `"${input}",${p.pageIndex + 1},"${p.text.replace(/"/g, '""')}",${p.ocrUsed}`
        ).join('\n');
        break;
      case 'txt':
        content = extractedPages.map(p => 
          `=== Page ${p.pageIndex + 1} ${p.ocrUsed ? '(OCR)' : '(PDF)'} ===\n${p.text}`
        ).join('\n\n');
        break;
    }

    await fs.writeFile(outputPath, content);
    
    const duration = Date.now() - startTime;
    console.log(chalk.green(`✅ Extraction completed in ${(duration / 1000).toFixed(1)}s`));
    console.log(chalk.white(`   Output: ${outputPath}`));
    console.log(chalk.white(`   Pages: ${pageCount}`));
    console.log(chalk.white(`   OCR pages: ${extractionData.ocrPages}`));
    console.log(chalk.white(`   Total characters: ${extractedPages.reduce((sum, p) => sum + p.text.length, 0)}`));

  } catch (error) {
    console.error(chalk.red('❌ Extraction failed:'));
    console.error(chalk.red(`   ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  } finally {
    // Cleanup resources
    if (document) {
      await document.close();
    }
    await tesseractEngine.cleanup();
  }
}