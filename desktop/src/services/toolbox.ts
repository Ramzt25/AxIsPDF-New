// src/services/toolbox.ts
// Tool Generator Service - Core engine for FieldBeam's parametric toolbox system

export interface ToolParameter {
  type: 'string' | 'number' | 'angle' | 'boolean' | 'color' | 'date' | 'select' | 'point' | 'polyline';
  default: any;
  min?: number;
  max?: number;
  values?: any[]; // for select type
  regex?: string; // for string validation
  label?: string;
  description?: string;
}

export interface ToolHandle {
  id: string;
  kind: 'rotation' | 'move' | 'resize' | 'polyline-extend';
  center?: string; // e.g., "bbox.center"
  axis?: 'x' | 'y' | 'both';
}

export interface ToolConstraints {
  snap?: ('grid' | 'vector' | 'angle(90)' | 'intersections')[];
  minSizeMm?: number;
  lockAspectRatio?: boolean;
}

export interface ToolBehavior {
  on: 'place' | 'edit' | 'select' | 'delete';
  action: 'autoNumber' | 'promptFor' | 'setField' | 'calcScale' | 'lockRotation' | 'stampDateUserProject';
  field?: string;
  prefix?: string;
  scope?: 'project' | 'discipline' | 'sheet';
  label?: string;
}

export interface ToolDataConfig {
  discipline?: string;
  scheduleKey?: string;
  export?: string[];
  category?: string;
  description?: string;
  created?: string;
  modified?: string;
}

export interface Tool {
  id: string;
  name: string;
  version: number;
  type: 'symbol' | 'stamp' | 'shape' | 'callout' | 'measure';
  svg: string; // relative path in pack
  params: Record<string, ToolParameter>;
  handles?: ToolHandle[];
  constraints?: ToolConstraints;
  data?: ToolDataConfig;
  behaviors?: ToolBehavior[];
  preview?: string; // preview image path
}

export interface Toolbox {
  id: string;
  name: string;
  version: number;
  tools: string[]; // tool IDs
  categories: Record<string, string[]>; // category name -> tool IDs
  description?: string;
  author?: string;
  tags?: string[];
}

export interface ToolPack {
  manifest: {
    id: string;
    name: string;
    version: number;
    description?: string;
    author?: string;
    created: string;
    toolbox: Toolbox;
  };
  tools: Record<string, Tool>;
  svgFiles: Record<string, string>; // path -> SVG content
  previewFiles?: Record<string, string>; // path -> base64 image
}

export class ToolboxService {
  private loadedPacks: Map<string, ToolPack> = new Map();
  private activePalette: string[] = []; // active tool IDs

  // Pack management
  async loadPack(packData: ArrayBuffer): Promise<ToolPack> {
    // TODO[PH-010]: Implement ZIP parsing for .fbtoolpack files
    throw new Error('Pack loading not implemented yet');
  }

  async savePack(pack: ToolPack): Promise<Uint8Array> {
    // TODO[PH-011]: Implement ZIP creation for .fbtoolpack export
    throw new Error('Pack saving not implemented yet');
  }

  // Tool creation and editing
  createTool(type: Tool['type']): Tool {
    const baseId = `tool-${type}-${Date.now()}`;
    
    const baseTool: Tool = {
      id: baseId,
      name: `New ${type}`,
      version: 1,
      type,
      svg: `svg/${baseId}.svg`,
      params: {
        rotation: { type: 'angle', default: 0, min: 0, max: 359 }
      }
    };

    // Add type-specific defaults
    switch (type) {
      case 'symbol':
        baseTool.params.label = { type: 'string', default: '' };
        baseTool.handles = [
          { id: 'h-rotate', kind: 'rotation', center: 'bbox.center' }
        ];
        baseTool.constraints = {
          snap: ['grid', 'vector'],
          minSizeMm: 3
        };
        break;
      
      case 'stamp':
        baseTool.params.text = { type: 'string', default: 'APPROVED' };
        baseTool.params.date = { type: 'date', default: '$today' };
        baseTool.params.user = { type: 'string', default: '$user.name' };
        baseTool.behaviors = [
          { on: 'place', action: 'stampDateUserProject' }
        ];
        break;
      
      case 'callout':
        baseTool.params.text = { type: 'string', default: 'Note' };
        baseTool.params.leader = { type: 'polyline', default: [] };
        baseTool.handles = [
          { id: 'head', kind: 'move' },
          { id: 'tail', kind: 'polyline-extend' }
        ];
        break;
      
      case 'shape':
        baseTool.params.width = { type: 'number', default: 10, min: 1 };
        baseTool.params.height = { type: 'number', default: 10, min: 1 };
        baseTool.handles = [
          { id: 'resize-se', kind: 'resize' }
        ];
        break;
      
      case 'measure':
        baseTool.params.units = { type: 'select', values: ['mm', 'in', 'ft'], default: 'ft' };
        baseTool.params.precision = { type: 'number', default: 2, min: 0, max: 4 };
        break;
    }

    return baseTool;
  }

  validateTool(tool: Tool): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!tool.id || !tool.name || !tool.type || !tool.svg) {
      errors.push('Missing required fields: id, name, type, svg');
    }

    // Validate parameters
    for (const [paramName, param] of Object.entries(tool.params)) {
      if (!['string', 'number', 'angle', 'bool', 'enum', 'date', 'polyline'].includes(param.type)) {
        errors.push(`Invalid parameter type for ${paramName}: ${param.type}`);
      }
      
      if (param.type === 'select' && (!param.values || param.values.length === 0)) {
        errors.push(`Enum parameter ${paramName} must have values array`);
      }
      
      if (param.type === 'number' || param.type === 'angle') {
        if (typeof param.default !== 'number') {
          errors.push(`Parameter ${paramName} default must be a number`);
        }
      }
    }

    // Validate behaviors
    if (tool.behaviors) {
      for (const behavior of tool.behaviors) {
        const validActions = ['autoNumber', 'promptFor', 'setField', 'calcScale', 'lockRotation', 'stampDateUserProject'];
        if (!validActions.includes(behavior.action)) {
          errors.push(`Invalid behavior action: ${behavior.action}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // AI Tool Generation
  async generateToolFromDescription(description: string): Promise<{ tool: Tool; svg: string }> {
    // TODO[PH-012]: Implement AI tool generation from text description
    // This would integrate with an AI service to:
    // 1. Parse the description to understand tool type and requirements
    // 2. Generate appropriate parameters and behaviors
    // 3. Create a basic SVG representation
    // 4. Return both the tool definition and SVG content

    // MOCK implementation for now
    const tool = this.createTool('symbol');
    tool.name = 'AI Generated Tool';
    tool.params.label = { type: 'string', default: 'AI' };
    
    const mockSvg = `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="none" stroke="#000" stroke-width="2"/>
        <text x="12" y="16" text-anchor="middle" font-size="12" fill="#000">AI</text>
      </svg>
    `;

    return { tool, svg: mockSvg };
  }

  async generateToolFromRegion(imageData: ImageData, bounds: DOMRect): Promise<{ tool: Tool; svg: string }> {
    // TODO[PH-013]: Implement AI tool generation from selected region
    // This would:
    // 1. Process the image data to extract vector shapes
    // 2. Analyze the region to determine tool type and likely parameters
    // 3. Generate SVG from the vectorized content
    // 4. Propose smart defaults for parameters and behaviors

    throw new Error('Region-based tool generation not implemented yet');
  }

  // Palette management
  setActivePalette(toolIds: string[]): void {
    this.activePalette = toolIds;
  }

  getActivePalette(): string[] {
    return [...this.activePalette];
  }

  getToolById(toolId: string): Tool | null {
    for (const pack of this.loadedPacks.values()) {
      if (pack.tools[toolId]) {
        return pack.tools[toolId];
      }
    }
    return null;
  }

  // Tool instance management (for placed tools on drawings)
  createToolInstance(toolId: string, position: { x: number; y: number }, params?: Record<string, any>) {
    const tool = this.getToolById(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    const instance = {
      id: `inst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      toolId,
      position,
      params: { ...this.getDefaultParams(tool), ...params },
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    // Execute placement behaviors
    this.executeBehaviors(tool, instance, 'place');

    return instance;
  }

  private getDefaultParams(tool: Tool): Record<string, any> {
    const defaults: Record<string, any> = {};
    
    for (const [key, param] of Object.entries(tool.params)) {
      defaults[key] = param.default;
    }
    
    return defaults;
  }

  private executeBehaviors(tool: Tool, instance: any, event: ToolBehavior['on']): void {
    if (!tool.behaviors) return;

    for (const behavior of tool.behaviors) {
      if (behavior.on === event) {
        switch (behavior.action) {
          case 'autoNumber':
            if (behavior.field && behavior.prefix && behavior.scope) {
              // TODO[PH-014]: Implement auto-numbering logic
              instance.params[behavior.field] = `${behavior.prefix}001`;
            }
            break;
          
          case 'stampDateUserProject':
            instance.params.date = new Date().toISOString().split('T')[0];
            instance.params.user = 'Current User'; // TODO: Get from user service
            instance.params.project = 'Current Project'; // TODO: Get from project service
            break;
          
          case 'promptFor':
            // TODO[PH-015]: Show parameter input dialog
            break;
        }
      }
    }
  }

  // Search and filtering
  // Get all loaded tools across all packs
  getAllTools(packIds?: string[]): Tool[] {
    const tools: Tool[] = [];
    
    for (const [packId, pack] of this.loadedPacks.entries()) {
      if (packIds && !packIds.includes(packId)) continue;
      
      for (const tool of Object.values(pack.tools)) {
        tools.push(tool);
      }
    }
    
    return tools;
  }

  // Get the default toolpack if no packs are loaded
  getDefaultTools(): Tool[] {
    // If we have loaded packs, return tools from them
    if (this.loadedPacks.size > 0) {
      return this.getAllTools();
    }

    // Otherwise return built-in default tools for basic functionality
    const defaultTools: Tool[] = [
      {
        id: 'tool-receptacle-duplex',
        name: 'Receptacle - Duplex',
        version: 1,
        type: 'symbol',
        svg: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxyZWN0IHg9IjQiIHk9IjgiIHdpZHRoPSIxNiIgaGVpZ2h0PSI4IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjEwIiBjeT0iMTIiIHI9IjEiIGZpbGw9ImN1cnJlbnRDb2xvciIvPgo8Y2lyY2xlIGN4PSIxNCIgY3k9IjEyIiByPSIxIiBmaWxsPSJjdXJyZW50Q29sb3IiLz4KPC9zdmc+',
        params: {
          rotation: { type: 'angle', default: 0, min: 0, max: 359 },
          label: { type: 'string', default: 'R' },
          circuit: { type: 'string', default: '' }
        },
        data: {
          discipline: 'Electrical',
          category: 'Devices'
        }
      },
      {
        id: 'tool-light-fixture',
        name: 'Light Fixture',
        version: 1,
        type: 'symbol',
        svg: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjgiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiLz4KPGV4dCB4PSIxMiIgeT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9ImN1cnJlbnRDb2xvciI+TDwvdGV4dD4KPC9zdmc+',
        params: {
          rotation: { type: 'angle', default: 0 },
          label: { type: 'string', default: 'L' },
          wattage: { type: 'number', default: 100, min: 10, max: 1000 }
        },
        data: {
          discipline: 'Electrical',
          category: 'Lighting'
        }
      },
      {
        id: 'stamp-approved',
        name: 'Approved Stamp',
        version: 1,
        type: 'stamp',
        svg: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCA2NCAzMiIgZmlsbD0ibm9uZSI+CjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSIyOCIgc3Ryb2tlPSJyZWQiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8dGV4dCB4PSIzMiIgeT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9InJlZCIgZm9udC13ZWlnaHQ9ImJvbGQiPkFQUFJPVkVEPC90ZXh0Pgo8L3N2Zz4=',
        params: {
          approvedBy: { type: 'string', default: '' },
          date: { type: 'date', default: '$today' },
          project: { type: 'string', default: '$project.name' }
        },
        data: {
          discipline: 'Admin',
          category: 'Stamps'
        }
      },
      {
        id: 'callout-standard',
        name: 'Standard Callout',
        version: 1,
        type: 'callout',
        svg: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA4MCA0MCIgZmlsbD0ibm9uZSI+CjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSI3NiIgaGVpZ2h0PSIzNiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0id2hpdGUiLz4KPHR4dCB4PSI0MCIgeT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9ImN1cnJlbnRDb2xvciI+Tm90ZTwvdGV4dD4KPC9zdmc+',
        params: {
          text: { type: 'string', default: 'Note' },
          leader: { type: 'polyline', default: [] }
        },
        data: {
          discipline: 'General',
          category: 'Annotations'
        }
      }
    ];

    return defaultTools;
  }

  searchTools(query: string, loadedPackIds?: string[]): Tool[] {
    const results: Tool[] = [];
    const searchTerm = query.toLowerCase();

    for (const [packId, pack] of this.loadedPacks.entries()) {
      if (loadedPackIds && !loadedPackIds.includes(packId)) continue;

      for (const tool of Object.values(pack.tools)) {
        const matchesName = tool.name.toLowerCase().includes(searchTerm);
        const matchesType = tool.type.toLowerCase().includes(searchTerm);
        const matchesCategory = tool.data?.discipline?.toLowerCase().includes(searchTerm);
        
        if (matchesName || matchesType || matchesCategory) {
          results.push(tool);
        }
      }
    }

    return results;
  }
}

// Global toolbox service instance
export const toolboxService = new ToolboxService();