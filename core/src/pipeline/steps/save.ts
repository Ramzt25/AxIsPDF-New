// Save PDF Step - Saves the current document

import { PipelineStep, PipelineContext, PDFError } from '../../types.js';
import { PDFDocument } from '../../pdf/pdfium.js';

export class SaveStep implements PipelineStep {
  type = 'save';

  async execute(context: PipelineContext): Promise<any> {
    const currentDoc = context.variables.get('currentDoc') as PDFDocument;
    
    if (!currentDoc) {
      throw new PDFError('No document open', 'Use open step first');
    }

    // Get save path from step options or use original path
    const savePath = context.variables.get('save_path') as string;
    
    try {
      await currentDoc.save(savePath);
      
      return {
        path: savePath || currentDoc.path,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new PDFError(
        `Failed to save PDF: ${savePath || currentDoc.path}`,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}