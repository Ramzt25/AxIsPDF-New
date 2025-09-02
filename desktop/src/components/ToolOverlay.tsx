// src/components/ToolOverlay.tsx
// Component for rendering tool instances as overlays on the PDF canvas

import React, { useMemo } from 'react';
import { ToolInstance, toolPlacementService } from '../services/toolPlacement';
import { Tool, toolboxService } from '../services/toolbox';
import { PDFDocumentInfo } from '../services/pdf';

interface ToolOverlayProps {
  toolInstance: ToolInstance;
  tool: Tool | null;
  scale: number;
  pageHeight: number;
  canvasHeight: number;
  onClick?: (toolInstance: ToolInstance) => void;
}

export const ToolOverlay: React.FC<ToolOverlayProps> = ({
  toolInstance,
  tool,
  scale,
  pageHeight,
  canvasHeight,
  onClick
}) => {
  const bounds = useMemo(() => {
    return toolPlacementService.getToolCanvasBounds(
      toolInstance,
      scale,
      pageHeight,
      canvasHeight
    );
  }, [toolInstance, scale, pageHeight, canvasHeight]);

  const getToolIcon = (toolType: string, toolId: string): string => {
    // Return appropriate emoji/icon based on tool type and content
    if (toolId.includes('receptacle')) return '🔌';
    if (toolId.includes('light')) return '💡';
    if (toolId.includes('panel')) return '⚡';
    
    switch (toolType) {
      case 'symbol': return '⚙️';
      case 'stamp': return '📋';
      case 'callout': return '💬';
      case 'shape': return '⬜';
      case 'measure': return '📏';
      default: return '🔧';
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(toolInstance);
    }
  };

  if (!tool) {
    // Tool definition not found, show placeholder
    return (
      <div
        className="placed-tool-marker tool-missing"
        style={{
          left: `${bounds.centerX}px`,
          top: `${bounds.centerY}px`,
        }}
        title={`Missing tool: ${toolInstance.toolId}`}
        onClick={handleClick}
      >
        <div className="tool-marker">❓</div>
        <div className="tool-label">Missing</div>
      </div>
    );
  }

  return (
    <div
      className="placed-tool-marker"
      style={{
        left: `${bounds.centerX}px`,
        top: `${bounds.centerY}px`,
      }}
      title={`${tool.name} at ${Math.round(toolInstance.pdfPosition.x)}, ${Math.round(toolInstance.pdfPosition.y)}`}
      onClick={handleClick}
    >
      <div className="tool-marker">
        {getToolIcon(tool.type, tool.id)}
      </div>
      <div className="tool-label">{tool.name}</div>
    </div>
  );
};

interface ToolOverlayContainerProps {
  toolInstances: ToolInstance[];
  currentPage: number;
  scale: number;
  pdfInfo: PDFDocumentInfo | null;
  canvasHeight: number;
  onToolClick?: (toolInstance: ToolInstance) => void;
}

export const ToolOverlayContainer: React.FC<ToolOverlayContainerProps> = ({
  toolInstances,
  currentPage,
  scale,
  pdfInfo,
  canvasHeight,
  onToolClick
}) => {
  const pageTools = useMemo(() => {
    return toolPlacementService.getToolsOnPage(toolInstances, currentPage);
  }, [toolInstances, currentPage]);

  const currentPageInfo = pdfInfo?.pages[currentPage - 1];
  
  if (!currentPageInfo) {
    return null;
  }

  return (
    <div className="tool-overlay-container">
      {pageTools.map(toolInstance => {
        const tool = toolboxService.getToolById(toolInstance.toolId);
        
        return (
          <ToolOverlay
            key={toolInstance.id}
            toolInstance={toolInstance}
            tool={tool}
            scale={scale}
            pageHeight={currentPageInfo.height}
            canvasHeight={canvasHeight}
            onClick={onToolClick}
          />
        );
      })}
    </div>
  );
};