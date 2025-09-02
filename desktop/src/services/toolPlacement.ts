// src/services/toolPlacement.ts
// Tool Placement Service - Handles tool positioning and rendering on PDF canvas

import { PDFDocumentInfo } from './pdf';

export interface ToolInstance {
  id: string;
  toolId: string;
  pageNumber: number;
  pdfPosition: { x: number; y: number }; // Position in PDF coordinate space
  parameters: Record<string, any>;
  created: string;
  modified: string;
}

export interface CanvasPosition {
  x: number;
  y: number;
}

export interface PDFPosition {
  x: number;
  y: number;
}

export class ToolPlacementService {
  // Convert PDF coordinates to canvas coordinates for rendering
  pdfToCanvasCoords(
    pdfX: number, 
    pdfY: number, 
    scale: number, 
    pageHeight: number,
    canvasHeight: number
  ): CanvasPosition {
    return {
      x: pdfX * scale,
      y: canvasHeight - (pdfY * scale) // PDF Y is bottom-up, Canvas Y is top-down
    };
  }

  // Convert canvas coordinates to PDF coordinates for storage
  canvasToPDFCoords(
    canvasX: number, 
    canvasY: number, 
    scale: number, 
    pageHeight: number,
    canvasHeight: number
  ): PDFPosition {
    return {
      x: canvasX / scale,
      y: pageHeight - (canvasY / scale) // Convert from top-down to bottom-up
    };
  }

  // Calculate tool bounds in canvas space for rendering overlays
  getToolCanvasBounds(
    tool: ToolInstance,
    scale: number,
    pageHeight: number,
    canvasHeight: number,
    toolSize: { width: number; height: number } = { width: 24, height: 24 }
  ) {
    const canvasPos = this.pdfToCanvasCoords(
      tool.pdfPosition.x,
      tool.pdfPosition.y,
      scale,
      pageHeight,
      canvasHeight
    );

    return {
      x: canvasPos.x - toolSize.width / 2,
      y: canvasPos.y - toolSize.height / 2,
      width: toolSize.width,
      height: toolSize.height,
      centerX: canvasPos.x,
      centerY: canvasPos.y
    };
  }

  // Check if a point is within a tool's clickable area
  isPointInTool(
    point: CanvasPosition,
    tool: ToolInstance,
    scale: number,
    pageHeight: number,
    canvasHeight: number,
    tolerance: number = 12
  ): boolean {
    const bounds = this.getToolCanvasBounds(tool, scale, pageHeight, canvasHeight);
    
    const dx = point.x - bounds.centerX;
    const dy = point.y - bounds.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= tolerance;
  }

  // Get all tools on a specific page
  getToolsOnPage(tools: ToolInstance[], pageNumber: number): ToolInstance[] {
    return tools.filter(tool => tool.pageNumber === pageNumber);
  }

  // Create a new tool instance
  createToolInstance(
    toolId: string,
    pageNumber: number,
    pdfPosition: PDFPosition,
    parameters: Record<string, any> = {}
  ): ToolInstance {
    return {
      id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      toolId,
      pageNumber,
      pdfPosition,
      parameters,
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
  }

  // Update tool position
  updateToolPosition(tool: ToolInstance, newPdfPosition: PDFPosition): ToolInstance {
    return {
      ...tool,
      pdfPosition: newPdfPosition,
      modified: new Date().toISOString()
    };
  }

  // Update tool parameters
  updateToolParameters(tool: ToolInstance, parameters: Record<string, any>): ToolInstance {
    return {
      ...tool,
      parameters: { ...tool.parameters, ...parameters },
      modified: new Date().toISOString()
    };
  }

  // Export tools to JSON for persistence
  exportTools(tools: ToolInstance[]): string {
    const exportData = {
      version: '1.0',
      tools,
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(exportData, null, 2);
  }

  // Import tools from JSON
  importTools(jsonData: string): ToolInstance[] {
    try {
      const data = JSON.parse(jsonData);
      if (data.tools && Array.isArray(data.tools)) {
        return data.tools;
      }
      return [];
    } catch (error) {
      console.error('Failed to import tools:', error);
      return [];
    }
  }

  // Calculate snap positions for alignment
  getSnapPositions(
    targetPosition: PDFPosition,
    existingTools: ToolInstance[],
    snapDistance: number = 10
  ): PDFPosition[] {
    const snapPositions: PDFPosition[] = [];

    // Add grid snap positions (every 10 units)
    const gridSize = 10;
    const snappedX = Math.round(targetPosition.x / gridSize) * gridSize;
    const snappedY = Math.round(targetPosition.y / gridSize) * gridSize;
    snapPositions.push({ x: snappedX, y: snappedY });

    // Add alignment snaps to existing tools
    for (const tool of existingTools) {
      const dx = Math.abs(tool.pdfPosition.x - targetPosition.x);
      const dy = Math.abs(tool.pdfPosition.y - targetPosition.y);

      // Horizontal alignment
      if (dx < snapDistance) {
        snapPositions.push({ x: tool.pdfPosition.x, y: targetPosition.y });
      }

      // Vertical alignment
      if (dy < snapDistance) {
        snapPositions.push({ x: targetPosition.x, y: tool.pdfPosition.y });
      }

      // Perfect alignment
      if (dx < snapDistance && dy < snapDistance) {
        snapPositions.push({ x: tool.pdfPosition.x, y: tool.pdfPosition.y });
      }
    }

    return snapPositions;
  }

  // Find the best snap position
  getBestSnapPosition(
    targetPosition: PDFPosition,
    snapPositions: PDFPosition[],
    snapThreshold: number = 5
  ): PDFPosition {
    let bestPosition = targetPosition;
    let minDistance = snapThreshold;

    for (const snapPos of snapPositions) {
      const dx = snapPos.x - targetPosition.x;
      const dy = snapPos.y - targetPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        bestPosition = snapPos;
      }
    }

    return bestPosition;
  }
}

// Global service instance
export const toolPlacementService = new ToolPlacementService();
export default toolPlacementService;