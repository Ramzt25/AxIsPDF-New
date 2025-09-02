// YAML Pipeline DSL Parser and Executor
// Executes automation pipelines defined in YAML

import { PdfDoc, PipelineStep, OCRResult, PipelineContext } from '../types';
import { JavaScriptExecutor, JsFunctionContext } from '../scripting/js-executor';
import { PDFDocument } from '../pdf/pdfium.js';
import * as yaml from 'yaml';
import * as fs from 'fs/promises';
import * as path from 'path';
import Ajv from 'ajv';

// Pipeline step implementations
import { OpenStep } from './steps/open.js';
import { SaveStep } from './steps/save.js';
import { OCRStep } from './steps/ocr.js';
import { FindTextStep } from './steps/find_text.js';
import { StampStep } from './steps/stamp.js';
import { ExportCSVStep } from './steps/export_csv.js';
import { ExportJSONStep } from './steps/export_json.js';

export interface PipelineConfig {
  version?: number;
  name?: string;
  description?: string;
  open?: string;
  foreach?: {
    files: string;
    steps: any[];
  };
  steps?: any[];
  variables?: Record<string, any>;
}

export class PipelineExecutor implements IPipeline {
  private context: PipelineContext;
  private stepRegistry: Map<string, new() => PipelineStep>;
  private currentDoc?: PDFDocument;
  private validator: Ajv;
  private jsExecutor: JavaScriptExecutor;

  constructor() {
    this.context = {
      variables: new Map(),
      results: {}
    };

    this.stepRegistry = new Map([
      ['open', OpenStep],
      ['save', SaveStep],
      ['save_as', SaveStep],
      ['ocr', OCRStep],
      ['find_text', FindTextStep],
      ['stamp', StampStep],
      ['export_csv', ExportCSVStep],
      ['export_json', ExportJSONStep]
    ]);

    this.validator = new Ajv();
    this.jsExecutor = new JavaScriptExecutor();
    this.setupValidation();
  }

  private setupValidation(): void {
    // JSON Schema for pipeline validation
    const pipelineSchema = {
      type: 'object',
      properties: {
        version: { type: 'number', default: 1 },
        name: { type: 'string' },
        description: { type: 'string' },
        open: { type: 'string' },
        foreach: {
          type: 'object',
          properties: {
            files: { type: 'string' },
            steps: {
              type: 'array',
              items: { type: 'object' }
            }
          },
          required: ['files', 'steps']
        },
        steps: {
          type: 'array',
          items: { type: 'object' }
        },
        variables: { type: 'object' }
      }
    };

    this.validator.addSchema(pipelineSchema, 'pipeline');
  }

  async loadPipeline(filePath: string): Promise<PipelineConfig> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const config = yaml.parse(content) as PipelineConfig;
      
      // Validate schema
      const isValid = this.validator.validate('pipeline', config);
      if (!isValid) {
        const errors = this.validator.errors?.map(err => 
          `${err.instancePath}: ${err.message}`
        ).join(', ');
        throw new PipelineError(
          `Invalid pipeline configuration: ${errors}`,
          'Check YAML syntax and required fields'
        );
      }

      return config;
    } catch (error) {
      if (error instanceof PipelineError) throw error;
      
      throw new PipelineError(
        `Failed to load pipeline: ${filePath}`,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async executePipeline(config: PipelineConfig): Promise<void> {
    // Initialize variables
    if (config.variables) {
      for (const [key, value] of Object.entries(config.variables)) {
        this.setVar(key, value);
      }
    }

    // Set built-in variables
    this.setVar('now', new Date().toISOString());
    
    // Handle foreach pattern
    if (config.foreach) {
      await this.executeForeach(config.foreach);
    }
    
    // Handle single file open
    if (config.open) {
      await this.open(this.resolveVariables(config.open));
    }

    // Execute steps
    if (config.steps) {
      await this.executeSteps(config.steps);
    }
  }

  private async executeForeach(foreach: { files: string; steps: any[] }): Promise<void> {
    const { glob } = await import('glob');
    const filePattern = this.resolveVariables(foreach.files);
    const files = await glob(filePattern);

    for (const filePath of files) {
      // Set file context variables
      this.setVar('file.path', filePath);
      this.setVar('file.name', path.basename(filePath, path.extname(filePath)));
      this.setVar('file.dir', path.dirname(filePath));
      this.setVar('file.ext', path.extname(filePath));

      // Open the file
      await this.open(filePath);

      // Execute steps for this file
      await this.executeSteps(foreach.steps);

      // Close the file
      if (this.currentDoc) {
        await this.currentDoc.close();
        this.currentDoc = undefined;
      }
    }
  }

  private async executeSteps(steps: any[]): Promise<void> {
    for (const stepConfig of steps) {
      const stepType = Object.keys(stepConfig)[0];
      const stepOptions = stepConfig[stepType];

      if (!this.stepRegistry.has(stepType)) {
        throw new PipelineError(
          `Unknown step type: ${stepType}`,
          `Available steps: ${Array.from(this.stepRegistry.keys()).join(', ')}`
        );
      }

      const StepClass = this.stepRegistry.get(stepType)!;
      const step = new StepClass();
      
      // Resolve variables in step options
      const resolvedOptions = this.resolveVariables(stepOptions);
      
      // Execute step
      try {
        const result = await step.execute(this.context);
        
        // Store result for reference by later steps
        this.context.results[stepType] = result;
      } catch (error) {
        throw new PipelineError(
          `Step '${stepType}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'Check step configuration and input data'
        );
      }
    }
  }

  private resolveVariables(value: any): any {
    if (typeof value === 'string') {
      return value.replace(/\$\{([^}]+)\}/g, (match, varPath) => {
        return this.getVariableByPath(varPath) || match;
      });
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.resolveVariables(item));
    }
    
    if (typeof value === 'object' && value !== null) {
      const resolved: any = {};
      for (const [key, val] of Object.entries(value)) {
        resolved[key] = this.resolveVariables(val);
      }
      return resolved;
    }
    
    return value;
  }

  private getVariableByPath(path: string): any {
    // Handle dot notation: file.name, page.index, etc.
    const parts = path.split('.');
    let value: any = this.context.variables.get(parts[0]);
    
    for (let i = 1; i < parts.length && value !== undefined; i++) {
      value = value[parts[i]];
    }
    
    // Handle environment variables
    if (path.startsWith('env.')) {
      return process.env[path.substring(4)];
    }
    
    return value;
  }

  // Pipeline interface implementation
  async open(path: string): Promise<PDFDocument> {
    this.currentDoc = await PDFDocument.open(path);
    this.context.currentFile = path;
    return this.currentDoc;
  }

  async saveAs(path: string): Promise<void> {
    if (!this.currentDoc) {
      throw new PipelineError('No document open', 'Use open step first');
    }
    await this.currentDoc.save(path);
  }

  async exportCSV(path: string, rows: any[], append = false): Promise<void> {
    const csvContent = this.arrayToCSV(rows);
    const mode = append ? 'a' : 'w';
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(path), { recursive: true });
    
    if (append) {
      await fs.appendFile(path, '\n' + csvContent);
    } else {
      await fs.writeFile(path, csvContent);
    }
  }

  async exportJSON(path: string, data: any): Promise<void> {
    const jsonContent = JSON.stringify(data, null, 2);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(path), { recursive: true });
    
    await fs.writeFile(path, jsonContent);
  }

  setVar(key: string, value: any): void {
    this.context.variables.set(key, value);
  }

  getVar<T>(key: string): T | undefined {
    return this.context.variables.get(key) as T;
  }

  private arrayToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  }

  // JavaScript Function Execution Step
  private async executeJavaScriptStep(step: any): Promise<void> {
    const functionCode = step.code || step.function || step.js;
    const name = step.name || 'custom_function';
    
    if (!functionCode) {
      throw new Error('JavaScript step requires "code", "function", or "js" property');
    }

    // Validate function before execution
    const validation = this.jsExecutor.validateFunction(functionCode);
    if (!validation.valid) {
      throw new Error(`JavaScript validation failed: ${validation.errors.join(', ')}`);
    }

    // Prepare execution context
    const context: JsFunctionContext = {
      doc: this.currentDoc ? {
        pages: this.currentDoc.pages,
        metadata: this.currentDoc.metadata
      } : undefined,
      results: this.context.results,
      variables: Object.fromEntries(this.context.variables),
      file: this.context.currentFile,
      utils: {
        Math,
        Date,
        JSON,
        RegExp
      }
    };

    // Execute the function
    const result = await this.jsExecutor.executeFunction(functionCode, context);
    
    if (!result.success) {
      throw new Error(`JavaScript execution failed: ${result.error}`);
    }

    // Store result in context
    this.context.results[name] = {
      result: result.result,
      logs: result.logs,
      executionTime: result.executionTime
    };

    // Log execution details
    console.log(`✅ JavaScript function "${name}" executed in ${result.executionTime}ms`);
    if (result.logs && result.logs.length > 0) {
      console.log(`📝 Function logs:`, result.logs);
    }
  }
}