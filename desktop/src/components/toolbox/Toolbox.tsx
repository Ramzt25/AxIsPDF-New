// src/components/toolbox/Toolbox.tsx
// Main Toolbox component that orchestrates the palette and builder

import React, { useState, useCallback } from 'react';
import { Tool } from '../../services/toolbox';
import { ToolboxPalette } from './ToolboxPalette';
import { ToolBuilder } from './ToolBuilder';
import './Toolbox.css';

interface ToolboxProps {
  onToolPlace: (tool: Tool, position: { x: number; y: number }) => void;
  className?: string;
}

export const Toolbox: React.FC<ToolboxProps> = ({ onToolPlace, className = '' }) => {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const handleToolSelect = useCallback((tool: Tool) => {
    setSelectedTool(tool);
    // Call the parent's onToolPlace to activate placement mode
    onToolPlace(tool, { x: 0, y: 0 }); // Position will be set by canvas click
    console.log('Tool selected for placement:', tool.name);
  }, [onToolPlace]);

  const handleToolBuilder = useCallback(() => {
    setEditingTool(null);
    setIsBuilderOpen(true);
  }, []);

  const handleEditTool = useCallback((tool: Tool) => {
    setEditingTool(tool);
    setIsBuilderOpen(true);
  }, []);

  const handleSaveTool = useCallback((tool: Tool) => {
    // TODO[PH-021]: Integrate with toolboxService to save tool
    console.log('Saving tool:', tool);
    setIsBuilderOpen(false);
    setEditingTool(null);
    
    // If this was a new tool, add it to the active palette
    // If editing, update the existing tool
  }, []);

  const handleCloseBuilder = useCallback(() => {
    setIsBuilderOpen(false);
    setEditingTool(null);
  }, []);

  // Handle tool placement from canvas interactions
  const handleCanvasToolPlace = useCallback((position: { x: number; y: number }) => {
    if (selectedTool) {
      onToolPlace(selectedTool, position);
      // Keep tool selected for multiple placements unless user clicks elsewhere
    }
  }, [selectedTool, onToolPlace]);

  return (
    <div className={`toolbox ${className}`}>
      {/* Main Toolbox Palette */}
      <ToolboxPalette
        onToolSelect={handleToolSelect}
        onToolBuilder={handleToolBuilder}
      />

      {/* Tool Builder Modal */}
      <ToolBuilder
        isOpen={isBuilderOpen}
        onClose={handleCloseBuilder}
        editingTool={editingTool}
        onSave={handleSaveTool}
      />

      {/* Selected Tool Indicator */}
      {selectedTool && (
        <div className="selected-tool-indicator">
          <div className="indicator-content">
            <span className="indicator-icon">🎯</span>
            <span className="indicator-text">
              Placing: <strong>{selectedTool.name}</strong>
            </span>
            <button 
              className="indicator-close"
              onClick={() => setSelectedTool(null)}
              title="Cancel tool placement"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};