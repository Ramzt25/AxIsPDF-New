// JavaScript Function Executor for TeamBeam Pipelines
// Provides sandboxed execution of custom JavaScript functions

// Enhanced VM implementation with better security
class SecureVM {
  private sandbox: any;
  private timeout: number;
  private startTime: number = 0;
  
  constructor(options: { timeout: number; sandbox: any; allowAsync: boolean; eval: boolean; wasm: boolean }) {
    this.sandbox = { ...options.sandbox };
    this.timeout = options.timeout;
  }
  
  run(code: string): any {
    this.startTime = Date.now();
    
    try {
      // Create a more secure execution environment
      const restrictedGlobals = this.createRestrictedEnvironment();
      
      // Validate code before execution
      this.validateCodeSafety(code);
      
      // Execute with timeout monitoring
      return this.executeWithTimeout(code, restrictedGlobals);
    } catch (error) {
      throw error;
    }
  }
  
  private createRestrictedEnvironment(): any {
    // Create a clean environment without access to dangerous globals
    const restrictedEnv = {
      ...this.sandbox,
      // Override potentially dangerous functions
      eval: undefined,
      Function: undefined,
      constructor: undefined,
      __proto__: undefined,
      prototype: undefined,
      // Prevent access to Node.js globals
      process: undefined,
      global: undefined,
      require: undefined,
      module: undefined,
      exports: undefined,
      __dirname: undefined,
      __filename: undefined,
      Buffer: undefined,
      setInterval: undefined,
      setTimeout: undefined,
      setImmediate: undefined,
      clearInterval: undefined,
      clearTimeout: undefined,
      clearImmediate: undefined
    };
    
    return restrictedEnv;
  }
  
  private validateCodeSafety(code: string): void {
    // Enhanced security validation
    const dangerousPatterns = [
      { pattern: /\b(eval|Function)\s*\(/, message: 'Code generation not allowed' },
      { pattern: /\.(constructor|__proto__|prototype)\b/, message: 'Prototype access not allowed' },
      { pattern: /\bimport\s+/, message: 'Dynamic imports not allowed' },
      { pattern: /\brequire\s*\(/, message: 'Module loading not allowed' },
      { pattern: /\b(process|global|__dirname|__filename)\b/, message: 'Node.js globals not allowed' },
      { pattern: /\b(setTimeout|setInterval|setImmediate)\s*\(/, message: 'Timers not allowed' },
      { pattern: /\bwhile\s*\(\s*true\s*\)/, message: 'Infinite loops not allowed' },
      { pattern: /\bfor\s*\(\s*;\s*;\s*\)/, message: 'Infinite loops not allowed' },
      { pattern: /\.\s*\[\s*["']__proto__["']\s*\]/, message: 'Prototype manipulation not allowed' }
    ];
    
    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(code)) {
        throw new Error(`Security violation: ${message}`);
      }
    }
    
    // Check for excessive complexity
    const lines = code.split('\n');
    if (lines.length > 500) {
      throw new Error('Code too long: maximum 500 lines allowed');
    }
    
    // Check for too many loops (potential DoS)
    const loopCount = (code.match(/\b(for|while|do)\b/g) || []).length;
    if (loopCount > 10) {
      throw new Error('Too many loops: maximum 10 loops allowed');
    }
  }
  
  private executeWithTimeout(code: string, environment: any): any {
    // Add execution monitoring
    const monitoredCode = this.addExecutionMonitoring(code);
    
    try {
      // Create function with restricted scope
      const func = new Function('env', `
        'use strict';
        with(env) {
          ${monitoredCode}
        }
      `);
      
      return func(environment);
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error(`Execution timeout: exceeded ${this.timeout}ms`);
      }
      throw error;
    }
  }
  
  private addExecutionMonitoring(code: string): string {
    // Add timeout checks for long-running operations
    return `
      let __execStart = Date.now();
      let __checkCount = 0;
      function __timeoutCheck() {
        if (++__checkCount % 1000 === 0) {
          if (Date.now() - __execStart > ${this.timeout}) {
            throw new Error('timeout');
          }
        }
      }
      
      // Inject timeout checks in loops
      ${code.replace(
        /\b(for|while)\s*\(/g, 
        (match) => `${match}__timeoutCheck(), `
      )}
    `;
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
  private vm: SecureVM;
  private logs: string[] = [];
  
  constructor(private options: JsFunctionOptions = {}) {
    this.vm = new SecureVM({
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
            return numbers.map(n => parseFloat(n.replace(/,/g, '')));
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
            // Enhanced address parser for construction documents
            const addressRegex = /(\d+)\s+([^,\n]+),?\s*([^,\n]+),?\s*([A-Z]{2})\s*(\d{5}(-\d{4})?)?/;
            const match = text.match(addressRegex);
            if (match) {
              return {
                number: match[1],
                street: match[2].trim(),
                city: match[3].trim(),
                state: match[4],
                zip: match[5],
                full: match[0]
              };
            }
            return null;
          },
          
          extractRoomNumbers: (text: string) => {
            const roomPattern = /(?:ROOM|RM)\s*(?:NO\.?)?\s*(\d{3,4}[A-Z]?)/gi;
            const matches = [];
            let match;
            while ((match = roomPattern.exec(text)) !== null) {
              matches.push(match[1]);
            }
            return [...new Set(matches)]; // Remove duplicates
          },
          
          findDrawingNumbers: (text: string) => {
            const patterns = [
              /[A-Z]-?\d{3,4}/g,  // A-001, A001 format
              /\d{2,3}-[A-Z]\d{2,3}/g,  // 01-A001 format
              /[A-Z]\d{2}\.\d{2}/g   // A01.01 format
            ];
            
            const results = [];
            for (const pattern of patterns) {
              const matches = text.match(pattern) || [];
              results.push(...matches);
            }
            return [...new Set(results)];
          }
        },
        
        // Enhanced calculation utilities
        calc: {
          area: (width: number, height: number) => width * height,
          perimeter: (width: number, height: number) => 2 * (width + height),
          diagonal: (width: number, height: number) => Math.sqrt(width * width + height * height),
          
          // Construction-specific calculations
          concrete: {
            volume: (length: number, width: number, thickness: number) => {
              // Calculate concrete volume in cubic yards
              const cubicFeet = length * width * (thickness / 12);
              return cubicFeet / 27;
            },
            
            reinforcement: (area: number, spacing: number = 12) => {
              // Calculate rebar requirements
              const linearFeet = (area / spacing) * 2; // Both directions
              return {
                linearFeet,
                weight: linearFeet * 0.668 // #4 rebar weight per foot
              };
            }
          },
          
          hvac: {
            ductSize: (cfm: number, velocity: number = 1000) => {
              // Calculate duct diameter for given CFM and velocity
              const area = cfm / velocity / 60; // sq ft
              const diameter = Math.sqrt(area * 4 / Math.PI) * 12; // inches
              return Math.round(diameter);
            },
            
            tonnage: (sqft: number, climate: string = 'moderate') => {
              // Estimate HVAC tonnage
              const multipliers = {
                hot: 600,      // Hot climate
                moderate: 500, // Moderate climate
                cold: 400      // Cold climate
              };
              const multiplier = multipliers[climate as keyof typeof multipliers] || 500;
              return Math.ceil(sqft / multiplier);
            }
          },
          
          electrical: {
            loadCalc: (sqft: number, usage: string = 'office') => {
              // Basic electrical load calculation
              const loadFactors = {
                office: 3.5,      // VA per sq ft
                retail: 3.0,
                warehouse: 0.25,
                residential: 3.0
              };
              const factor = loadFactors[usage as keyof typeof loadFactors] || 3.0;
              return sqft * factor;
            },
            
            circuitCount: (load: number, voltage: number = 120, safety: number = 0.8) => {
              // Calculate number of circuits needed
              const circuitCapacity = voltage * 20 * safety; // 20A circuit with safety factor
              return Math.ceil(load / circuitCapacity);
            }
          },
          
          // Convert between units
          convert: {
            feetToInches: (feet: number) => feet * 12,
            inchesToFeet: (inches: number) => inches / 12,
            feetToMeters: (feet: number) => feet * 0.3048,
            metersToFeet: (meters: number) => meters / 0.3048,
            sqftToSqm: (sqft: number) => sqft * 0.092903,
            sqmToSqft: (sqm: number) => sqm / 0.092903,
            psiToKpa: (psi: number) => psi * 6.895,
            kpaToPsi: (kpa: number) => kpa / 6.895,
            fahrenheitToCelsius: (f: number) => (f - 32) * 5/9,
            celsiusToFahrenheit: (c: number) => c * 9/5 + 32
          }
        },
        
        // Enhanced validation utilities
        validate: {
          drawingNumber: (num: string) => /^[A-Z]-?\d{3,4}$/.test(num),
          projectNumber: (num: string) => /^\d{4}-\d{3,4}$/.test(num),
          revision: (rev: string) => /^[A-Z]$/.test(rev),
          date: (date: string) => !isNaN(Date.parse(date)),
          roomNumber: (room: string) => /^\d{3,4}[A-Z]?$/.test(room),
          
          coordinates: (x: number, y: number) => {
            return !isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y);
          },
          
          dimension: (dim: string) => {
            // Validate dimension format like 12'-6" or 12.5'
            return /^\d+(?:\.\d+)?'(?:-\d+(?:\.\d+)?")?$/.test(dim) || 
                   /^\d+(?:\.\d+)?'$/.test(dim) ||
                   /^\d+(?:\.\d+)?"$/.test(dim);
          }
        },
        
        // Quality control utilities
        qc: {
          checkTitleBlock: (text: string) => {
            const required = ['PROJECT', 'DRAWING', 'DATE', 'REVISION', 'SCALE'];
            const found = required.filter(field => 
              text.toUpperCase().includes(field)
            );
            
            return {
              complete: found.length === required.length,
              missing: required.filter(field => !found.includes(field)),
              completeness: (found.length / required.length) * 100
            };
          },
          
          checkRevisionCloud: (page: any) => {
            // Look for revision indicators
            const revIndicators = ['REVISED', 'REVISION', 'REV', 'CLOUD'];
            const hasRevision = revIndicators.some(indicator => 
              page.text?.toUpperCase().includes(indicator)
            );
            
            return {
              hasRevisionIndicator: hasRevision,
              needsReview: !hasRevision && page.revision !== 'A'
            };
          },
          
          dimensionCheck: (text: string) => {
            const dimensions = text.match(/\d+(?:\.\d+)?['"]/g) || [];
            return {
              count: dimensions.length,
              hasDimensions: dimensions.length > 0,
              samples: dimensions.slice(0, 5) // First 5 dimensions found
            };
          }
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
      
      // Create a new SecureVM instance with the prepared sandbox
      const vm = new SecureVM({
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