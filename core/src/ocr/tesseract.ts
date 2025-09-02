// OCR Engine using Tesseract.js
// Provides text recognition for scanned PDFs

import { OCROptions, OCRResult, TextRun, OCRError } from '../types.js';
import Tesseract from 'tesseract.js';
import * as fs from 'fs/promises';

export class TesseractEngine {
  private workers = new Map<string, Tesseract.Worker>();
  private maxWorkers = 4;
  
  constructor() {
    // Initialize worker pool
  }

  async initializeWorker(lang: string = 'eng'): Promise<Tesseract.Worker> {
    if (this.workers.has(lang) && this.workers.size < this.maxWorkers) {
      return this.workers.get(lang)!;
    }

    try {
      const worker = await Tesseract.createWorker(lang);
      this.workers.set(lang, worker);
      return worker;
    } catch (error) {
      throw new OCRError(
        `Failed to initialize OCR worker for language: ${lang}`,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async recognizeImage(
    imageBuffer: Uint8Array,
    options: OCROptions = { lang: 'eng' }
  ): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      const worker = await this.initializeWorker(options.lang);
      
      // Configure Tesseract options
      if (options.psm !== undefined) {
        await worker.setParameters({ tessedit_pageseg_mode: options.psm });
      }
      
      if (options.oem !== undefined) {
        await worker.setParameters({ tessedit_ocr_engine_mode: options.oem });
      }

      if (options.whitelist) {
        await worker.setParameters({ tessedit_char_whitelist: options.whitelist });
      }

      if (options.blacklist) {
        await worker.setParameters({ tessedit_char_blacklist: options.blacklist });
      }

      // Perform OCR
      const result = await worker.recognize(Buffer.from(imageBuffer));
      
      // Convert Tesseract result to our format
      const textRuns: TextRun[] = result.data.words.map(word => ({
        text: word.text,
        x: word.bbox.x0,
        y: word.bbox.y0,
        width: word.bbox.x1 - word.bbox.x0,
        height: word.bbox.y1 - word.bbox.y0,
        fontSize: word.fontSize || 12,
        fontName: word.fontName || 'Unknown',
        confidence: word.confidence / 100 // Convert to 0-1 range
      }));

      const processingTime = Date.now() - startTime;

      return {
        pageIndex: 0, // Will be set by caller
        text: result.data.text,
        textRuns,
        confidence: result.data.confidence / 100,
        processingTime
      };

    } catch (error) {
      throw new OCRError(
        'OCR recognition failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async recognizePages(
    pageImages: Uint8Array[],
    options: OCROptions = { lang: 'eng' }
  ): Promise<OCRResult[]> {
    const results: OCRResult[] = [];
    
    // Process pages in parallel (up to maxWorkers)
    const batchSize = Math.min(this.maxWorkers, pageImages.length);
    
    for (let i = 0; i < pageImages.length; i += batchSize) {
      const batch = pageImages.slice(i, i + batchSize);
      const batchPromises = batch.map(async (imageBuffer, batchIndex) => {
        const result = await this.recognizeImage(imageBuffer, options);
        result.pageIndex = i + batchIndex;
        return result;
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  async detectScannedPages(pageImages: Uint8Array[]): Promise<number[]> {
    // Simple heuristic to detect scanned pages
    // More sophisticated detection could analyze image characteristics
    const scannedPages: number[] = [];
    
    for (let i = 0; i < pageImages.length; i++) {
      const imageBuffer = pageImages[i];
      
      // Quick OCR test with low confidence threshold
      try {
        const result = await this.recognizeImage(imageBuffer, {
          lang: 'eng',
          psm: 1 // Automatic page segmentation with OSD
        });
        
        // If confidence is very low, likely a scanned page
        if (result.confidence < 0.3) {
          scannedPages.push(i);
        }
      } catch {
        // If OCR fails, assume it's scanned
        scannedPages.push(i);
      }
    }
    
    return scannedPages;
  }

  async cleanup(): Promise<void> {
    // Terminate all workers
    const terminatePromises = Array.from(this.workers.values()).map(
      worker => worker.terminate()
    );
    
    await Promise.all(terminatePromises);
    this.workers.clear();
  }
}

// Singleton instance
export const tesseractEngine = new TesseractEngine();

// Helper function to auto-detect if OCR is needed
export async function shouldUseOCR(
  textRuns: TextRun[],
  pageSize: { width: number; height: number }
): Promise<boolean> {
  // Calculate text density
  const totalTextArea = textRuns.reduce((sum, run) => 
    sum + (run.width * run.height), 0
  );
  
  const pageArea = pageSize.width * pageSize.height;
  const textDensity = totalTextArea / pageArea;
  
  // If text density is very low, likely needs OCR
  const LOW_TEXT_DENSITY_THRESHOLD = 0.01; // 1% of page area
  const MIN_TEXT_RUNS = 10;
  
  return textDensity < LOW_TEXT_DENSITY_THRESHOLD || textRuns.length < MIN_TEXT_RUNS;
}