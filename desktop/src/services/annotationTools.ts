// src/services/annotationTools.ts
// Smart Annotation System - Rich text annotations, callouts, and markup tools

export interface AnnotationPoint {
  x: number;
  y: number;
  pageNumber: number;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  backgroundColor?: string;
  textDecoration?: 'none' | 'underline' | 'strikethrough';
  textAlign: 'left' | 'center' | 'right' | 'justify';
}

export interface BorderStyle {
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  radius: number;
}

export interface CalloutLeader {
  startPoint: AnnotationPoint;
  endPoint: AnnotationPoint;
  style: 'straight' | 'elbow' | 'curved';
  arrowhead: 'none' | 'arrow' | 'circle' | 'square';
  lineWidth: number;
  lineColor: string;
}

export interface TextAnnotation {
  id: string;
  type: 'text';
  position: AnnotationPoint;
  content: string;
  style: TextStyle;
  border?: BorderStyle;
  padding: number;
  width?: number;
  height?: number;
  rotation: number;
  created: string;
  modified: string;
  author: string;
  locked: boolean;
}

export interface CalloutAnnotation {
  id: string;
  type: 'callout';
  position: AnnotationPoint;
  content: string;
  style: TextStyle;
  border?: BorderStyle;
  leader: CalloutLeader;
  padding: number;
  width?: number;
  height?: number;
  rotation: number;
  created: string;
  modified: string;
  author: string;
  locked: boolean;
}

export interface ShapeAnnotation {
  id: string;
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'polygon' | 'line' | 'arrow';
  points: AnnotationPoint[];
  fillColor?: string;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  opacity: number;
  created: string;
  modified: string;
  author: string;
  locked: boolean;
}

export interface HighlightAnnotation {
  id: string;
  type: 'highlight';
  boundingBox: {
    topLeft: AnnotationPoint;
    bottomRight: AnnotationPoint;
  };
  color: string;
  opacity: number;
  blendMode: 'multiply' | 'overlay' | 'normal';
  created: string;
  modified: string;
  author: string;
  locked: boolean;
}

export interface StampAnnotation {
  id: string;
  type: 'stamp';
  position: AnnotationPoint;
  stampType: 'approved' | 'rejected' | 'reviewed' | 'confidential' | 'draft' | 'custom';
  customText?: string;
  color: string;
  size: number;
  rotation: number;
  created: string;
  modified: string;
  author: string;
  locked: boolean;
}

export type Annotation = TextAnnotation | CalloutAnnotation | ShapeAnnotation | HighlightAnnotation | StampAnnotation;

export interface AnnotationTemplate {
  id: string;
  name: string;
  type: Annotation['type'];
  defaultProperties: Partial<Annotation>;
  category: string;
  description?: string;
}

export interface AnnotationSettings {
  defaultAuthor: string;
  defaultTextStyle: TextStyle;
  defaultBorderStyle: BorderStyle;
  autoSave: boolean;
  showAuthorNames: boolean;
  enableCollaboration: boolean;
  annotationOpacity: number;
}

export class AnnotationToolsService {
  private annotations: Map<string, Annotation> = new Map();
  private templates: Map<string, AnnotationTemplate> = new Map();
  private settings: AnnotationSettings = {
    defaultAuthor: 'TeamBeam User',
    defaultTextStyle: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#000000',
      backgroundColor: '#ffffff',
      textAlign: 'left'
    },
    defaultBorderStyle: {
      width: 1,
      color: '#000000',
      style: 'solid',
      radius: 0
    },
    autoSave: true,
    showAuthorNames: true,
    enableCollaboration: false,
    annotationOpacity: 0.8
  };

  constructor() {
    this.initializeDefaultTemplates();
  }

  // Text annotations
  createTextAnnotation(
    position: AnnotationPoint,
    content: string,
    style?: Partial<TextStyle>,
    options?: Partial<TextAnnotation>
  ): TextAnnotation {
    const annotation: TextAnnotation = {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      position,
      content,
      style: { ...this.settings.defaultTextStyle, ...style },
      border: options?.border || this.settings.defaultBorderStyle,
      padding: options?.padding || 8,
      width: options?.width,
      height: options?.height,
      rotation: options?.rotation || 0,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      author: options?.author || this.settings.defaultAuthor,
      locked: options?.locked || false
    };

    this.annotations.set(annotation.id, annotation);
    return annotation;
  }

  // Callout annotations
  createCalloutAnnotation(
    position: AnnotationPoint,
    targetPoint: AnnotationPoint,
    content: string,
    options?: Partial<CalloutAnnotation>
  ): CalloutAnnotation {
    const leader: CalloutLeader = {
      startPoint: position,
      endPoint: targetPoint,
      style: 'straight',
      arrowhead: 'arrow',
      lineWidth: 2,
      lineColor: '#000000',
      ...options?.leader
    };

    const annotation: CalloutAnnotation = {
      id: `callout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'callout',
      position,
      content,
      style: { ...this.settings.defaultTextStyle, ...options?.style },
      border: options?.border || this.settings.defaultBorderStyle,
      leader,
      padding: options?.padding || 8,
      width: options?.width,
      height: options?.height,
      rotation: options?.rotation || 0,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      author: options?.author || this.settings.defaultAuthor,
      locked: options?.locked || false
    };

    this.annotations.set(annotation.id, annotation);
    return annotation;
  }

  // Shape annotations
  createShapeAnnotation(
    shapeType: ShapeAnnotation['shapeType'],
    points: AnnotationPoint[],
    options?: Partial<ShapeAnnotation>
  ): ShapeAnnotation {
    const annotation: ShapeAnnotation = {
      id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'shape',
      shapeType,
      points,
      fillColor: options?.fillColor,
      strokeColor: options?.strokeColor || '#000000',
      strokeWidth: options?.strokeWidth || 2,
      strokeStyle: options?.strokeStyle || 'solid',
      opacity: options?.opacity || 1,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      author: options?.author || this.settings.defaultAuthor,
      locked: options?.locked || false
    };

    this.annotations.set(annotation.id, annotation);
    return annotation;
  }

  // Highlight annotations
  createHighlightAnnotation(
    topLeft: AnnotationPoint,
    bottomRight: AnnotationPoint,
    options?: Partial<HighlightAnnotation>
  ): HighlightAnnotation {
    const annotation: HighlightAnnotation = {
      id: `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'highlight',
      boundingBox: { topLeft, bottomRight },
      color: options?.color || '#ffff00',
      opacity: options?.opacity || 0.3,
      blendMode: options?.blendMode || 'multiply',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      author: options?.author || this.settings.defaultAuthor,
      locked: options?.locked || false
    };

    this.annotations.set(annotation.id, annotation);
    return annotation;
  }

  // Stamp annotations
  createStampAnnotation(
    position: AnnotationPoint,
    stampType: StampAnnotation['stampType'],
    options?: Partial<StampAnnotation>
  ): StampAnnotation {
    const annotation: StampAnnotation = {
      id: `stamp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'stamp',
      position,
      stampType,
      customText: options?.customText,
      color: options?.color || '#ff0000',
      size: options?.size || 24,
      rotation: options?.rotation || 0,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      author: options?.author || this.settings.defaultAuthor,
      locked: options?.locked || false
    };

    this.annotations.set(annotation.id, annotation);
    return annotation;
  }

  // Annotation management
  getAnnotation(id: string): Annotation | null {
    return this.annotations.get(id) || null;
  }

  getAllAnnotations(): Annotation[] {
    return Array.from(this.annotations.values());
  }

  getAnnotationsByPage(pageNumber: number): Annotation[] {
    return Array.from(this.annotations.values()).filter(annotation => {
      switch (annotation.type) {
        case 'text':
        case 'callout':
        case 'stamp':
          return annotation.position.pageNumber === pageNumber;
        case 'shape':
          return annotation.points.some(point => point.pageNumber === pageNumber);
        case 'highlight':
          return annotation.boundingBox.topLeft.pageNumber === pageNumber;
        default:
          return false;
      }
    });
  }

  getAnnotationsByType<T extends Annotation>(type: T['type']): T[] {
    return Array.from(this.annotations.values())
      .filter((annotation): annotation is T => annotation.type === type);
  }

  updateAnnotation(id: string, updates: Partial<Annotation>): boolean {
    const annotation = this.annotations.get(id);
    if (!annotation || annotation.locked) {
      return false;
    }

    const updatedAnnotation = {
      ...annotation,
      ...updates,
      id: annotation.id, // Preserve original ID
      type: annotation.type, // Preserve original type
      modified: new Date().toISOString()
    } as Annotation;

    this.annotations.set(id, updatedAnnotation);
    return true;
  }

  deleteAnnotation(id: string): boolean {
    const annotation = this.annotations.get(id);
    if (!annotation || annotation.locked) {
      return false;
    }

    return this.annotations.delete(id);
  }

  lockAnnotation(id: string, locked: boolean = true): boolean {
    const annotation = this.annotations.get(id);
    if (!annotation) {
      return false;
    }

    annotation.locked = locked;
    annotation.modified = new Date().toISOString();
    return true;
  }

  // Template management
  createTemplate(
    name: string,
    type: Annotation['type'],
    defaultProperties: Partial<Annotation>,
    category: string = 'Custom'
  ): AnnotationTemplate {
    const template: AnnotationTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      defaultProperties,
      category,
      description: `Custom ${type} template`
    };

    this.templates.set(template.id, template);
    return template;
  }

  getTemplate(id: string): AnnotationTemplate | null {
    return this.templates.get(id) || null;
  }

  getAllTemplates(): AnnotationTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: string): AnnotationTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.category === category);
  }

  applyTemplate(templateId: string, position: AnnotationPoint, content?: string): Annotation | null {
    const template = this.templates.get(templateId);
    if (!template) {
      return null;
    }

    switch (template.type) {
      case 'text':
        const textProps = template.defaultProperties as Partial<TextAnnotation>;
        return this.createTextAnnotation(
          position,
          content || 'New Text',
          textProps.style,
          textProps
        );
      
      case 'callout':
        const calloutProps = template.defaultProperties as Partial<CalloutAnnotation>;
        const targetPoint = { ...position, x: position.x + 50, y: position.y + 50 };
        return this.createCalloutAnnotation(
          position,
          targetPoint,
          content || 'New Callout',
          calloutProps
        );
      
      case 'stamp':
        const stampProps = template.defaultProperties as Partial<StampAnnotation>;
        return this.createStampAnnotation(
          position,
          'custom',
          {
            ...stampProps,
            customText: content || 'STAMP'
          }
        );
      
      default:
        return null;
    }
  }

  // Settings management
  updateSettings(newSettings: Partial<AnnotationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): AnnotationSettings {
    return { ...this.settings };
  }

  // Text formatting utilities
  formatText(text: string, style: TextStyle): string {
    // Apply basic text formatting
    // This would be expanded to handle rich text formatting
    return text;
  }

  calculateTextDimensions(text: string, style: TextStyle): { width: number; height: number } {
    // Calculate text dimensions based on style
    // This is a simplified implementation
    const avgCharWidth = style.fontSize * 0.6;
    const lineHeight = style.fontSize * 1.2;
    const lines = text.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    
    return {
      width: maxLineLength * avgCharWidth,
      height: lines.length * lineHeight
    };
  }

  // Export and import
  exportAnnotations(format: 'json' | 'pdf-annotations' | 'csv'): string {
    const annotations = this.getAllAnnotations();
    
    switch (format) {
      case 'json':
        return JSON.stringify({
          annotations,
          templates: Array.from(this.templates.values()),
          settings: this.settings,
          exportedAt: new Date().toISOString()
        }, null, 2);
        
      case 'csv':
        return this.exportToCSV(annotations);
        
      case 'pdf-annotations':
        // TODO: Export as PDF annotation format
        throw new Error('PDF annotation export not yet implemented');
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  importAnnotations(data: string, format: 'json'): boolean {
    try {
      if (format === 'json') {
        const imported = JSON.parse(data);
        
        if (imported.annotations) {
          imported.annotations.forEach((annotation: Annotation) => {
            this.annotations.set(annotation.id, annotation);
          });
        }
        
        if (imported.templates) {
          imported.templates.forEach((template: AnnotationTemplate) => {
            this.templates.set(template.id, template);
          });
        }
        
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  private exportToCSV(annotations: Annotation[]): string {
    const headers = ['ID', 'Type', 'Author', 'Content', 'Page', 'X', 'Y', 'Created', 'Modified'];
    const rows = annotations.map(annotation => {
      let content = '';
      let page = 0;
      let x = 0;
      let y = 0;
      
      switch (annotation.type) {
        case 'text':
        case 'callout':
          content = annotation.content;
          page = annotation.position.pageNumber;
          x = annotation.position.x;
          y = annotation.position.y;
          break;
        case 'stamp':
          content = annotation.customText || annotation.stampType;
          page = annotation.position.pageNumber;
          x = annotation.position.x;
          y = annotation.position.y;
          break;
        case 'shape':
          content = annotation.shapeType;
          if (annotation.points.length > 0) {
            page = annotation.points[0].pageNumber;
            x = annotation.points[0].x;
            y = annotation.points[0].y;
          }
          break;
        case 'highlight':
          content = 'highlight';
          page = annotation.boundingBox.topLeft.pageNumber;
          x = annotation.boundingBox.topLeft.x;
          y = annotation.boundingBox.topLeft.y;
          break;
      }
      
      return [
        annotation.id,
        annotation.type,
        annotation.author,
        content,
        page.toString(),
        x.toFixed(2),
        y.toFixed(2),
        annotation.created,
        annotation.modified
      ];
    });
    
    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }

  // Initialize default templates
  private initializeDefaultTemplates(): void {
    // Construction-specific templates
    const constructionTemplates: Array<Omit<AnnotationTemplate, 'id'>> = [
      {
        name: 'RFI Note',
        type: 'callout',
        defaultProperties: {
          style: {
            fontFamily: 'Arial, sans-serif',
            fontSize: 12,
            fontWeight: 'bold',
            fontStyle: 'normal',
            color: '#ff0000',
            backgroundColor: '#ffeeee',
            textAlign: 'left'
          },
          border: {
            width: 2,
            color: '#ff0000',
            style: 'solid',
            radius: 4
          }
        },
        category: 'Construction',
        description: 'Request for Information callout'
      },
      {
        name: 'Field Note',
        type: 'text',
        defaultProperties: {
          style: {
            fontFamily: 'Arial, sans-serif',
            fontSize: 10,
            fontWeight: 'normal',
            fontStyle: 'normal',
            color: '#0066cc',
            backgroundColor: '#eef6ff',
            textAlign: 'left'
          },
          border: {
            width: 1,
            color: '#0066cc',
            style: 'solid',
            radius: 2
          }
        },
        category: 'Construction',
        description: 'General field observation note'
      },
      {
        name: 'Approved Stamp',
        type: 'stamp',
        defaultProperties: {
          stampType: 'approved',
          color: '#00aa00',
          size: 32
        },
        category: 'Stamps',
        description: 'Approval stamp for documents'
      }
    ];

    constructionTemplates.forEach(template => {
      const fullTemplate: AnnotationTemplate = {
        ...template,
        id: `default-${template.name.toLowerCase().replace(/\s+/g, '-')}`
      };
      this.templates.set(fullTemplate.id, fullTemplate);
    });
  }
}

// Global service instance
export const annotationToolsService = new AnnotationToolsService();