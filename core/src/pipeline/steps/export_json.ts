// Export JSON Step - Exports data to JSON format

import { PipelineStep, PipelineContext } from '../../types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ExportJSONStep implements PipelineStep {
  type = 'export_json';

  async execute(context: PipelineContext): Promise<any> {
    const jsonPath = context.variables.get('export_json.path') as string;
    const data = context.variables.get('export_json.data') || this.collectAllData(context);

    if (!jsonPath) {
      throw new Error('JSON export path is required');
    }

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(jsonPath), { recursive: true });

      // Generate JSON content
      const jsonContent = JSON.stringify(data, null, 2);

      // Write to file
      await fs.writeFile(jsonPath, jsonContent);

      return {
        path: jsonPath,
        size: jsonContent.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(
        `Failed to export JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private collectAllData(context: PipelineContext): any {
    return {
      file: {
        path: context.currentFile,
        name: context.variables.get('file.name'),
        dir: context.variables.get('file.dir'),
        ext: context.variables.get('file.ext')
      },
      document: {
        pages: context.variables.get('doc.pages'),
        title: context.variables.get('doc.title'),
        producer: context.variables.get('doc.producer')
      },
      page: {
        index: context.currentPage,
        text: context.variables.get('page.text'),
        label: context.variables.get('page.label')
      },
      results: context.results,
      timestamp: new Date().toISOString()
    };
  }
}