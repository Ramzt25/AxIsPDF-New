// JavaScript Function Executor for TeamBeam Pipelines
// Provides sandboxed execution of custom JavaScript functions

// Note: vm2 will be installed as dependency
// import { VM } from 'vm2';

// Mock VM implementation for now
class VM {
  private sandbox: any;
  private timeout: number;
  
  constructor(options: { timeout: number; sandbox: any; allowAsync: boolean; eval: boolean; wasm: boolean }) {
    this.sandbox = options.sandbox;
    this.timeout = options.timeout;
  }
  
  run(code: string): any {
    // This is a mock implementation
    // Real implementation would use vm2 for secure sandboxing
    try {
      const func = new Function('sandbox', `
        with(sandbox) {
          ${code}
        }
      `);
      return func(this.sandbox);
    } catch (error) {
      throw error;
    }
  }
}

export interface JsFunctionContext {
  // Document and page data
  doc?: any;
  page?: any;
  results?: Record<string, any>;
  
  // File information
  file?: {
    path: string;
    name: string;
    extension: string;
    size: number;
  };
  
  // Pipeline variables
  variables?: Record<string, any>;
  
  // Utility functions available to scripts
  utils?: {
    Math: typeof Math;
    Date: typeof Date;
    JSON: typeof JSON;
    RegExp: typeof RegExp;
  };
}

export interface JsFunctionResult {
  success: boolean;
  result?: any;
  error?: string;
  logs?: string[];
  executionTime: number;
}

export interface JsFunctionOptions {
  timeout?: number;          // Execution timeout in ms (default: 5000)
  allowAsync?: boolean;      // Allow async/await (default: false)
  memoryLimit?: number;      // Memory limit in MB (default: 8)
  allowedModules?: string[]; // Whitelisted Node modules (default: none)
}

export class JavaScriptExecutor {
  private vm: VM;
  private logs: string[] = [];
  
  constructor(private options: JsFunctionOptions = {}) {
    this.vm = new VM({
      timeout: options.timeout || 5000,
      sandbox: this.createSandbox(),
      allowAsync: options.allowAsync || false,
      eval: false,
      wasm: false
    });
  }
  
  private createSandbox() {
    const logs: string[] = [];
    
    const sandbox: any = {
      // Safe console for logging
      console: {
        log: (...args: any[]) => logs.push(args.map(a => String(a)).join(' ')),
        error: (...args: any[]) => logs.push(`ERROR: ${args.map(a => String(a)).join(' ')}`),
        warn: (...args: any[]) => logs.push(`WARN: ${args.map(a => String(a)).join(' ')}`),
        info: (...args: any[]) => logs.push(`INFO: ${args.map(a => String(a)).join(' ')}`),
        _logs: logs
      },
      
      // Safe utilities
      Math,
      Date,
      JSON,
      RegExp,
      Array,
      Object,
      String,
      Number,
      Boolean,
      
      // PDF/Construction specific utilities
      TeamBeam: {
        // Text processing utilities
        text: {
          extractNumbers: (text: string) => {
            const numbers = text.match(/[\d,\.]+/g) || [];
            return numbers.map(n => parseFloat(n.replace(',', '')));
          },
          
          findDimensions: (text: string) => {
            const dimRegex = /(\d+(?:\.\d+)?)["\s]*[xX×]\s*(\d+(?:\.\d+)?)["]?/g;
            const matches = [];
            let match;
            while ((match = dimRegex.exec(text)) !== null) {
              matches.push({
                width: parseFloat(match[1]),
                height: parseFloat(match[2]),
                original: match[0]
              });
            }
            return matches;
          },
          
          parseAddress: (text: string) => {
            // Simple address parser for construction documents
            const addressRegex = /(\d+)\s+([^,\n]+),?\s*([^,\n]+),?\s*([A-Z]{2})\s*(\d{5}(-\d{4})?)?/;
            const match = text.match(addressRegex);
            if (match) {
              return {
                number: match[1],
                street: match[2].trim(),
                city: match[3].trim(),
                state: match[4],
                zip: match[5]
              };
            }
            return null;
          }
        },
        
        // Calculation utilities
        calc: {
          area: (width: number, height: number) => width * height,
          perimeter: (width: number, height: number) => 2 * (width + height),
          diagonal: (width: number, height: number) => Math.sqrt(width * width + height * height),
          
          // Convert between units
          convert: {
            feetToInches: (feet: number) => feet * 12,
            inchesToFeet: (inches: number) => inches / 12,
            feetToMeters: (feet: number) => feet * 0.3048,
            metersToFeet: (meters: number) => meters / 0.3048,
            sqftToSqm: (sqft: number) => sqft * 0.092903,
            sqmToSqft: (sqm: number) => sqm / 0.092903
          }
        },
        
        // Validation utilities
        validate: {
          drawingNumber: (num: string) => /^[A-Z]-?\d{3,4}$/.test(num),
          projectNumber: (num: string) => /^\d{4}-\d{3,4}$/.test(num),
          revision: (rev: string) => /^[A-Z]$/.test(rev),
          date: (date: string) => !isNaN(Date.parse(date))
        }
      }
    };
    
    return sandbox;
  }
  
  public async executeFunction(
    functionCode: string, 
    context: JsFunctionContext = {}
  ): Promise<JsFunctionResult> {
    const startTime = Date.now();
    this.logs = [];
    
    try {
      // Prepare the execution context
      const sandbox = this.createSandbox();
      
      // Add context variables to sandbox
      if (context.doc) sandbox.doc = context.doc;
      if (context.page) sandbox.page = context.page;
      if (context.results) sandbox.results = context.results;
      if (context.file) sandbox.file = context.file;
      if (context.variables) sandbox.variables = context.variables;
      
      // Create a new VM instance with the prepared sandbox
      const vm = new VM({
        timeout: this.options.timeout || 5000,
        sandbox,
        allowAsync: this.options.allowAsync || false,
        eval: false,
        wasm: false
      });
      
      // Wrap the function code to capture return value
      const wrappedCode = `
        (function() {
          ${functionCode}
        })()
      `;
      
      // Execute the function
      const result = vm.run(wrappedCode);
      
      return {
        success: true,
        result,
        logs: sandbox.console._logs || [],
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        logs: this.logs,
        executionTime: Date.now() - startTime
      };
    }
  }
  
  public validateFunction(functionCode: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      // Basic syntax validation
      new Function(functionCode);
      
      // Check for dangerous patterns
      const dangerousPatterns = [
        /require\s*\(/,
        /import\s+/,
        /process\./,
        /global\./,
        /__dirname/,
        /__filename/,
        /eval\s*\(/,
        /Function\s*\(/,
        /setTimeout/,
        /setInterval/
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(functionCode)) {
          errors.push(`Dangerous pattern detected: ${pattern.source}`);
        }
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
      
    } catch (syntaxError: any) {
      errors.push(`Syntax error: ${syntaxError?.message || 'Unknown syntax error'}`);
      return {
        valid: false,
        errors
      };
    }
  }
}

// Example custom functions that users might create
export const exampleFunctions = {
  // Extract room information from text
  extractRooms: `
    const roomPattern = /ROOM\\s+(\\d+)\\s*[:-]?\\s*([^\\n]+)/gi;
    const rooms = [];
    let match;
    
    while ((match = roomPattern.exec(page.text)) !== null) {
      rooms.push({
        number: match[1],
        name: match[2].trim(),
        page: page.number
      });
    }
    
    return rooms;
  `,
  
  // Calculate total square footage from room schedule
  calculateTotalArea: `
    let totalArea = 0;
    const areaPattern = /(\\d+(?:\\.\\d+)?)\\s*(?:SF|SQ\\s*FT)/gi;
    let match;
    
    while ((match = areaPattern.exec(page.text)) !== null) {
      totalArea += parseFloat(match[1]);
    }
    
    console.log(\`Found total area: \${totalArea} SF\`);
    return totalArea;
  `,
  
  // Validate title block completeness
  validateTitleBlock: `
    const required = ['PROJECT NO', 'DRAWING NO', 'DATE', 'REVISION'];
    const missing = [];
    
    for (const field of required) {
      if (!page.text.includes(field)) {
        missing.push(field);
      }
    }
    
    return {
      valid: missing.length === 0,
      missing: missing,
      completeness: ((required.length - missing.length) / required.length) * 100
    };
  `,
  
  // Count specific symbols or elements
  countElements: `
    // Count electrical outlets
    const outletPattern = /\\b(?:OUTLET|RECEPTACLE)\\b/gi;
    const outlets = (page.text.match(outletPattern) || []).length;
    
    // Count doors
    const doorPattern = /\\b(?:DOOR|DR)\\s*\\d+/gi;
    const doors = (page.text.match(doorPattern) || []).length;
    
    // Count windows
    const windowPattern = /\\b(?:WINDOW|WIN)\\s*\\d+/gi;
    const windows = (page.text.match(windowPattern) || []).length;
    
    return {
      outlets,
      doors,
      windows,
      total: outlets + doors + windows
    };
  `
};

// Export the executor for use in pipeline steps
export { JavaScriptExecutor as JsExecutor };