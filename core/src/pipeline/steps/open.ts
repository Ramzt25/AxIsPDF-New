// Open PDF Step - Opens a PDF document for processing

import { PipelineStep, PipelineContext, PDFError } from '../../types.js';
import { PDFDocument } from '../../pdf/pdfium.js';

export class OpenStep implements PipelineStep {
  type = 'open';

  async execute(context: PipelineContext): Promise<PDFDocument> {
    const filePath = context.currentFile;
    
    if (!filePath) {
      throw new PDFError('No file path provided', 'Set file path in context or use foreach');
    }

    try {
      const doc = await PDFDocument.open(filePath);
      
      // Set document context
      const meta = await doc.meta();
      context.variables.set('doc.pages', meta.pages);
      context.variables.set('doc.title', meta.title);
      context.variables.set('doc.producer', meta.producer);
      
      return doc;
    } catch (error) {
      throw new PDFError(
        `Failed to open PDF: ${filePath}`,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}