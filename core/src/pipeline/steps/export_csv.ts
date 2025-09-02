// Export CSV Step - Exports data to CSV format

import { PipelineStep, PipelineContext } from '../../types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ExportCSVStep implements PipelineStep {
  type = 'export_csv';

  async execute(context: PipelineContext): Promise<any> {
    const csvPath = context.variables.get('export_csv.path') as string;
    const fields = context.variables.get('export_csv.fields') as string[];
    const append = context.variables.get('export_csv.append') as boolean || false;

    if (!csvPath) {
      throw new Error('CSV export path is required');
    }

    if (!fields || fields.length === 0) {
      throw new Error('CSV fields are required');
    }

    // Collect data from context and results
    const data = this.collectData(context, fields);

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(csvPath), { recursive: true });

      // Generate CSV content
      const csvContent = this.generateCSV(data, fields);

      // Write or append to file
      if (append && await this.fileExists(csvPath)) {
        // Append without header
        const dataRows = csvContent.split('\n').slice(1);
        await fs.appendFile(csvPath, '\n' + dataRows.join('\n'));
      } else {
        // Write full CSV with header
        await fs.writeFile(csvPath, csvContent);
      }

      return {
        path: csvPath,
        rows: data.length,
        fields: fields.length,
        append,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(
        `Failed to export CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private collectData(context: PipelineContext, fields: string[]): any[] {
    const data: any[] = [];
    
    // Create a row with current context values
    const row: any = {};
    
    for (const field of fields) {
      let value = '';
      
      switch (field) {
        case 'file':
          value = context.currentFile || '';
          break;
        case 'page':
          value = context.currentPage || '';
          break;
        case 'label':
          value = context.variables.get('page.label') || context.variables.get('sheet_no') || '';
          break;
        default:
          // Try to get from variables or results
          value = context.variables.get(field) || 
                  context.results[field] || 
                  this.getNestedValue(context.results, field) || '';
      }
      
      row[field] = value;
    }
    
    data.push(row);
    return data;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  }

  private generateCSV(data: any[], fields: string[]): string {
    if (data.length === 0) return '';

    const csvRows = [
      // Header row
      fields.join(','),
      // Data rows
      ...data.map(row =>
        fields.map(field => {
          const value = row[field] || '';
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}