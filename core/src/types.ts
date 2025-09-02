// Core TypeScript types and interfaces for TeamBeam

export interface PdfDoc {
  path: string;
  meta(): Promise<{
    pages: number;
    title?: string;
    producer?: string;
    creator?: string;
    creationDate?: Date;
    modificationDate?: Date;
  }>;
  pages(): Promise<Page[]>;
  save(path?: string): Promise<void>;
  close(): Promise<void>;
}

export interface Page {
  index: number;
  size(): Promise<{
    width: number;
    height: number;
    dpi: number;
  }>;
  text(): Promise<TextRun[]>;
  render(tile?: TileOptions): Promise<Uint8Array>;
  stamp(imgPathOrText: string, opts: StampOptions): Promise<void>;
  rotate(degrees: 90 | 180 | 270): Promise<void>;
}

export interface TextRun {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName?: string;
  confidence?: number; // For OCR results
}

export interface TileOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface StampOptions {
  anchor?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  dx?: number; // offset from anchor
  dy?: number;
  opacity?: number; // 0-1
  rotation?: number; // degrees
  scale?: number; // 1.0 = original size
}

export interface OCROptions {
  lang: string;
  psm?: number; // Page segmentation mode
  oem?: number; // OCR Engine mode
  whitelist?: string; // Character whitelist
  blacklist?: string; // Character blacklist
}

export interface OCRResult {
  pageIndex: number;
  text: string;
  textRuns: TextRun[];
  confidence: number;
  processingTime: number;
}

export interface PipelineContext {
  variables: Map<string, any>;
  currentFile?: string;
  currentPage?: number;
  results: Record<string, any>;
}

export interface PipelineStep {
  type: string;
  execute(context: PipelineContext): Promise<any>;
}

export interface Pipeline {
  open(path: string): Promise<PdfDoc>;
  saveAs(path: string): Promise<void>;
  exportCSV(path: string, rows: any[], append?: boolean): Promise<void>;
  exportJSON(path: string, data: any): Promise<void>;
  setVar(key: string, value: any): void;
  getVar<T>(key: string): T | undefined;
}

export interface SymbolTemplate {
  name: string;
  imagePath: string;
  threshold: number;
  minScale: number;
  maxScale: number;
  description?: string;
}

export interface SymbolHit {
  template: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  pageIndex: number;
}

export interface RegionOptions {
  anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  width: number; // relative to page (0-1) or absolute pixels
  height: number;
  dx?: number; // offset from anchor
  dy?: number;
  relative?: boolean; // default true
}

export interface FindTextOptions {
  query: string | string[]; // Text to search for
  region?: RegionOptions; // Limit search to region
  regex?: string; // Apply regex after finding text
  caseSensitive?: boolean; // Default false
  wholeWords?: boolean; // Default false
}

export interface FindTextResult {
  matches: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    pageIndex: number;
  }>;
}

// Error types
export class TeamBeamError extends Error {
  constructor(
    public code: string,
    message: string,
    public hint?: string,
    public action?: string
  ) {
    super(message);
    this.name = 'TeamBeamError';
  }
}

export class PDFError extends TeamBeamError {
  constructor(message: string, hint?: string) {
    super('E-PDF-OPEN', message, hint, 'Check file path and permissions');
  }
}

export class OCRError extends TeamBeamError {
  constructor(message: string, hint?: string) {
    super('E-OCR-TIMEOUT', message, hint, 'Try reducing page count or adjusting OCR settings');
  }
}

export class PipelineError extends TeamBeamError {
  constructor(message: string, hint?: string) {
    super('E-PIPE-SCHEMA', message, hint, 'Validate YAML schema and fix syntax errors');
  }
}