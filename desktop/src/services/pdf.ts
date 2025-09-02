// src/services/pdf.ts
// PDF Service - Handles PDF loading, rendering, and basic manipulation

import { PDFDocument, PDFPage } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
}

export interface PDFDocumentInfo {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount: number;
  pages: PDFPageInfo[];
}

export interface RenderOptions {
  scale: number;
  rotation?: number;
  viewport?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AnnotationData {
  id: string;
  type: 'markup' | 'text' | 'stamp' | 'tool';
  pageNumber: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  data: any;
  created: string;
  modified: string;
}

export class PDFService {
  private loadedDocument: pdfjsLib.PDFDocumentProxy | null = null;
  private pdfLibDocument: PDFDocument | null = null;
  private documentPath: string | null = null;
  private annotations: Map<string, AnnotationData> = new Map();

  constructor() {
    this.setupWorker();
  }

  private setupWorker(): void {
    // Ensure PDF.js worker is properly configured
    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }
  }

  async loadDocument(filePath: string): Promise<PDFDocumentInfo> {
    try {
      // Close any existing document
      await this.closeDocument();

      this.documentPath = filePath;

      // Load with PDF.js for rendering
      const fileData = await window.teamBeam?.readFile(filePath);
      if (!fileData) {
        throw new Error('Failed to read PDF file');
      }

      this.loadedDocument = await pdfjsLib.getDocument({
        data: fileData,
        cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true
      }).promise;

      // Also load with pdf-lib for editing capabilities
      this.pdfLibDocument = await PDFDocument.load(fileData);

      // Extract document info
      const metadata = await this.loadedDocument.getMetadata();
      const pages: PDFPageInfo[] = [];

      for (let i = 1; i <= this.loadedDocument.numPages; i++) {
        const page = await this.loadedDocument.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        
        pages.push({
          pageNumber: i,
          width: viewport.width,
          height: viewport.height,
          rotation: viewport.rotation
        });
      }

      const documentInfo: PDFDocumentInfo = {
        title: (metadata.info as any)?.Title || undefined,
        author: (metadata.info as any)?.Author || undefined,
        subject: (metadata.info as any)?.Subject || undefined,
        creator: (metadata.info as any)?.Creator || undefined,
        producer: (metadata.info as any)?.Producer || undefined,
        creationDate: (metadata.info as any)?.CreationDate || undefined,
        modificationDate: (metadata.info as any)?.ModDate || undefined,
        pageCount: this.loadedDocument.numPages,
        pages
      };

      return documentInfo;
    } catch (error) {
      console.error('Failed to load PDF document:', error);
      throw new Error(`Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async renderPage(pageNumber: number, canvas: HTMLCanvasElement, options: RenderOptions): Promise<void> {
    if (!this.loadedDocument) {
      throw new Error('No document loaded');
    }

    if (pageNumber < 1 || pageNumber > this.loadedDocument.numPages) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    try {
      const page = await this.loadedDocument.getPage(pageNumber);
      const viewport = page.getViewport({ 
        scale: options.scale,
        rotation: options.rotation || 0
      });

      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      };

      await page.render(renderContext).promise;

      // Render annotations on top
      await this.renderAnnotations(pageNumber, context, viewport, options.scale);

    } catch (error) {
      console.error('Failed to render page:', error);
      throw new Error(`Failed to render page ${pageNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async renderPageToImageData(pageNumber: number, options: RenderOptions): Promise<ImageData> {
    if (!this.loadedDocument) {
      throw new Error('No document loaded');
    }

    const canvas = document.createElement('canvas');
    await this.renderPage(pageNumber, canvas, options);
    
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    return context.getImageData(0, 0, canvas.width, canvas.height);
  }

  getPageInfo(pageNumber: number): PDFPageInfo | null {
    if (!this.loadedDocument || pageNumber < 1 || pageNumber > this.loadedDocument.numPages) {
      return null;
    }

    // This should be cached from loadDocument
    return {
      pageNumber,
      width: 0, // Will be calculated during render
      height: 0,
      rotation: 0
    };
  }

  // Annotation Management
  addAnnotation(annotation: Omit<AnnotationData, 'id' | 'created' | 'modified'>): string {
    const id = `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const fullAnnotation: AnnotationData = {
      ...annotation,
      id,
      created: now,
      modified: now
    };

    this.annotations.set(id, fullAnnotation);
    return id;
  }

  updateAnnotation(id: string, updates: Partial<AnnotationData>): boolean {
    const annotation = this.annotations.get(id);
    if (!annotation) {
      return false;
    }

    const updated = {
      ...annotation,
      ...updates,
      id, // Preserve ID
      created: annotation.created, // Preserve creation time
      modified: new Date().toISOString()
    };

    this.annotations.set(id, updated);
    return true;
  }

  removeAnnotation(id: string): boolean {
    return this.annotations.delete(id);
  }

  getAnnotations(pageNumber?: number): AnnotationData[] {
    const annotations = Array.from(this.annotations.values());
    
    if (pageNumber !== undefined) {
      return annotations.filter(ann => ann.pageNumber === pageNumber);
    }
    
    return annotations;
  }

  private async renderAnnotations(
    pageNumber: number, 
    context: CanvasRenderingContext2D, 
    viewport: any, 
    scale: number
  ): Promise<void> {
    const pageAnnotations = this.getAnnotations(pageNumber);
    
    for (const annotation of pageAnnotations) {
      await this.renderAnnotation(annotation, context, viewport, scale);
    }
  }

  private async renderAnnotation(
    annotation: AnnotationData,
    context: CanvasRenderingContext2D,
    viewport: any,
    scale: number
  ): Promise<void> {
    const { bounds } = annotation;
    
    // Transform coordinates from PDF space to canvas space
    const x = bounds.x * scale;
    const y = viewport.height - (bounds.y + bounds.height) * scale;
    const width = bounds.width * scale;
    const height = bounds.height * scale;

    context.save();

    switch (annotation.type) {
      case 'markup':
        // Render markup annotation (highlight, etc.)
        context.fillStyle = annotation.data.color || 'rgba(255, 255, 0, 0.3)';
        context.fillRect(x, y, width, height);
        break;

      case 'text':
        // Render text annotation
        context.fillStyle = annotation.data.color || '#000000';
        context.font = `${annotation.data.fontSize || 12}px ${annotation.data.fontFamily || 'Arial'}`;
        context.fillText(annotation.data.text || '', x, y + height);
        break;

      case 'stamp':
        // Render stamp annotation
        context.strokeStyle = annotation.data.color || '#ff0000';
        context.lineWidth = 2;
        context.strokeRect(x, y, width, height);
        if (annotation.data.text) {
          context.fillStyle = annotation.data.color || '#ff0000';
          context.font = 'bold 12px Arial';
          context.textAlign = 'center';
          context.fillText(annotation.data.text, x + width/2, y + height/2);
        }
        break;

      case 'tool':
        // Render tool instance (will be implemented with toolbox integration)
        context.strokeStyle = '#0066cc';
        context.lineWidth = 1;
        context.strokeRect(x, y, width, height);
        break;
    }

    context.restore();
  }

  // Document manipulation
  async saveDocument(outputPath?: string): Promise<void> {
    if (!this.pdfLibDocument) {
      throw new Error('No document loaded for saving');
    }

    try {
      const pdfBytes = await this.pdfLibDocument.save();
      const savePath = outputPath || this.documentPath;
      
      if (!savePath) {
        throw new Error('No save path specified');
      }

      await window.teamBeam?.writeFile(savePath, pdfBytes);
    } catch (error) {
      console.error('Failed to save document:', error);
      throw new Error(`Failed to save document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exportAnnotations(): Promise<any> {
    return {
      documentPath: this.documentPath,
      annotations: Array.from(this.annotations.values()),
      exportedAt: new Date().toISOString()
    };
  }

  async importAnnotations(data: any): Promise<void> {
    if (data.annotations && Array.isArray(data.annotations)) {
      this.annotations.clear();
      
      for (const annotation of data.annotations) {
        if (annotation.id) {
          this.annotations.set(annotation.id, annotation);
        }
      }
    }
  }

  async closeDocument(): Promise<void> {
    if (this.loadedDocument) {
      await this.loadedDocument.destroy();
      this.loadedDocument = null;
    }
    
    this.pdfLibDocument = null;
    this.documentPath = null;
    this.annotations.clear();
  }

  // Utility methods
  isDocumentLoaded(): boolean {
    return this.loadedDocument !== null;
  }

  getDocumentPath(): string | null {
    return this.documentPath;
  }

  getPageCount(): number {
    return this.loadedDocument?.numPages || 0;
  }

  // Convert coordinates from canvas to PDF space
  canvasToPDFCoords(canvasX: number, canvasY: number, scale: number, pageHeight: number): { x: number; y: number } {
    return {
      x: canvasX / scale,
      y: pageHeight - (canvasY / scale)
    };
  }

  // Convert coordinates from PDF to canvas space
  pdfToCanvasCoords(pdfX: number, pdfY: number, scale: number, pageHeight: number): { x: number; y: number } {
    return {
      x: pdfX * scale,
      y: (pageHeight - pdfY) * scale
    };
  }
}

// Global PDF service instance
export const pdfService = new PDFService();
export default pdfService;