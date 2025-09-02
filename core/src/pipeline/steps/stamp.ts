// Stamp Step - Places text or image stamps on pages

import { PipelineStep, PipelineContext, StampOptions } from '../../types.js';
import { PDFDocument } from '../../pdf/pdfium.js';

export class StampStep implements PipelineStep {
  type = 'stamp';

  async execute(context: PipelineContext): Promise<any> {
    const currentDoc = context.variables.get('currentDoc') as PDFDocument;
    
    if (!currentDoc) {
      throw new Error('No document open');
    }

    // Get stamp options from context
    const template = context.variables.get('stamp.template') as string;
    const text = context.variables.get('stamp.text') as string;
    const position = context.variables.get('stamp.position') as any;
    const pagesOption = context.variables.get('stamp.pages') as string | number[] || 'all';
    const opacity = context.variables.get('stamp.opacity') as number || 1.0;

    if (!template && !text) {
      throw new Error('Either template (image) or text is required for stamp');
    }

    const stampOptions: StampOptions = {
      anchor: position?.anchor || 'bottom-right',
      dx: position?.dx || -36,
      dy: position?.dy || -36,
      opacity,
      rotation: context.variables.get('stamp.rotation') as number || 0,
      scale: context.variables.get('stamp.scale') as number || 1.0
    };

    const pages = await currentDoc.pages();
    let pagesToStamp: number[] = [];

    // Determine which pages to stamp
    if (pagesOption === 'all') {
      pagesToStamp = pages.map((_, index) => index);
    } else if (Array.isArray(pagesOption)) {
      pagesToStamp = pagesOption;
    } else if (typeof pagesOption === 'number') {
      pagesToStamp = [pagesOption];
    }

    const results = [];

    for (const pageIndex of pagesToStamp) {
      if (pageIndex >= pages.length) continue;

      const page = pages[pageIndex];
      const stampContent = template || text;

      try {
        await page.stamp(stampContent, stampOptions);
        
        results.push({
          pageIndex,
          stampContent,
          position: stampOptions,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        throw new Error(
          `Failed to stamp page ${pageIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return {
      stamped: results,
      totalPages: pagesToStamp.length,
      stampContent: template || text
    };
  }
}