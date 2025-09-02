// OCR Step - Performs OCR on document pages

import { PipelineStep, PipelineContext, OCRError, OCROptions } from '../../types.js';
import { PDFDocument } from '../../pdf/pdfium.js';

export class OCRStep implements PipelineStep {
  type = 'ocr';

  async execute(context: PipelineContext): Promise<any> {
    const currentDoc = context.variables.get('currentDoc') as PDFDocument;
    
    if (!currentDoc) {
      throw new OCRError('No document open', 'Use open step first');
    }

    // Get OCR options from context
    const options: OCROptions = {
      lang: context.variables.get('ocr.lang') as string || 'eng',
      psm: context.variables.get('ocr.psm') as number || 3,
      oem: context.variables.get('ocr.oem') as number || 3
    };

    const pages = await currentDoc.pages();
    const pagesOption = context.variables.get('ocr.pages') as string || 'auto';
    
    try {
      let pagesToProcess: number[] = [];
      
      if (pagesOption === 'all') {
        pagesToProcess = pages.map((_, index) => index);
      } else if (pagesOption === 'auto' || pagesOption === 'scanned') {
        // Auto-detect which pages need OCR
        pagesToProcess = await this.detectScannedPages(pages);
      } else if (Array.isArray(pagesOption)) {
        pagesToProcess = pagesOption;
      }

      const results = [];
      
      for (const pageIndex of pagesToProcess) {
        if (pageIndex >= pages.length) continue;
        
        const page = pages[pageIndex];
        const imageBuffer = await page.render({
          x: 0,
          y: 0,
          width: 612,
          height: 792,
          scale: 2.0 // Higher resolution for better OCR
        });

        // Mock OCR result for now - replace with actual Tesseract.js call
        const mockResult = {
          pageIndex,
          text: 'Mock OCR text for page ' + pageIndex,
          textRuns: [],
          confidence: 0.85,
          processingTime: 1000
        };

        results.push(mockResult);
        
        // Set page context
        context.variables.set('page.index', pageIndex);
        context.variables.set('page.text', mockResult.text);
      }

      return {
        pages: results,
        totalPages: pagesToProcess.length,
        averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
        totalTime: results.reduce((sum, r) => sum + r.processingTime, 0)
      };

    } catch (error) {
      throw new OCRError(
        'OCR processing failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async detectScannedPages(pages: any[]): Promise<number[]> {
    // Simple heuristic: if a page has very few text runs, it might be scanned
    const scannedPages: number[] = [];
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const textRuns = await page.text();
      
      // If very few text runs, likely scanned
      if (textRuns.length < 10) {
        scannedPages.push(i);
      }
    }
    
    return scannedPages;
  }
}