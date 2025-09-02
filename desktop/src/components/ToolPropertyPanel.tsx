import React, { useState, useEffect, useCallback } from 'react';
import { ToolInstance } from '../services/toolPlacement';
import { Tool, ToolboxService } from '../services/toolbox';
import './ToolPropertyPanel.css';

interface ToolPropertyPanelProps {
  toolInstance: ToolInstance | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (toolInstance: ToolInstance) => void;
  onDelete: (toolInstanceId: string) => void;
}

export const ToolPropertyPanel: React.FC<ToolPropertyPanelProps> = ({
  toolInstance,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [localParams, setLocalParams] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [tool, setTool] = useState<Tool | null>(null);

  // Get tool definition when tool instance changes
  useEffect(() => {
    if (toolInstance) {
      const toolboxService = new ToolboxService();
      const toolDef = toolboxService.getToolById(toolInstance.toolId);
      setTool(toolDef || null);
      setLocalParams({ ...toolInstance.parameters });
      setHasChanges(false);
    }
  }, [toolInstance]);

  const handleParameterChange = useCallback((paramName: string, value: any) => {
    setLocalParams(prev => ({
      ...prev,
      [paramName]: value
    }));
    setHasChanges(true);
  }, []);

  const handleApply = useCallback(() => {
    if (toolInstance && hasChanges) {
      const updatedInstance: ToolInstance = {
        ...toolInstance,
        parameters: { ...localParams }
      };
      onUpdate(updatedInstance);
      setHasChanges(false);
    }
  }, [toolInstance, localParams, hasChanges, onUpdate]);

  const handleReset = useCallback(() => {
    if (toolInstance) {
      setLocalParams({ ...toolInstance.parameters });
      setHasChanges(false);
    }
  }, [toolInstance]);

  const handleDelete = useCallback(() => {
    if (toolInstance && tool) {
      if (window.confirm(`Delete ${tool.name}?`)) {
        onDelete(toolInstance.id);
        onClose();
      }
    }
  }, [toolInstance, tool, onDelete, onClose]);

  const renderParameterControl = (param: any, value: any) => {
    const paramName = param.name;
    const paramValue = value !== undefined ? value : param.default;

    switch (param.type) {
      case 'number':
        return (
          <div key={paramName} className="property-control">
            <label className="property-label">{param.label || paramName}</label>
            <input
              type="number"
              className="property-input"
              value={paramValue || ''}
              min={param.min}
              max={param.max}
              step={param.step || 'any'}
              onChange={(e) => handleParameterChange(paramName, parseFloat(e.target.value) || 0)}
            />
            {param.unit && <span className="property-unit">{param.unit}</span>}
          </div>
        );

      case 'text':
        return (
          <div key={paramName} className="property-control">
            <label className="property-label">{param.label || paramName}</label>
            <input
              type="text"
              className="property-input"
              value={paramValue || ''}
              placeholder={param.placeholder}
              onChange={(e) => handleParameterChange(paramName, e.target.value)}
            />
          </div>
        );

      case 'select':
        return (
          <div key={paramName} className="property-control">
            <label className="property-label">{param.label || paramName}</label>
            <select
              className="property-select"
              value={paramValue || ''}
              onChange={(e) => handleParameterChange(paramName, e.target.value)}
            >
              {param.options?.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'color':
        return (
          <div key={paramName} className="property-control">
            <label className="property-label">{param.label || paramName}</label>
            <div className="color-picker-container">
              <input
                type="color"
                className="property-color-picker"
                value={paramValue || '#000000'}
                onChange={(e) => handleParameterChange(paramName, e.target.value)}
              />
              <input
                type="text"
                className="property-color-text"
                value={paramValue || '#000000'}
                onChange={(e) => handleParameterChange(paramName, e.target.value)}
              />
            </div>
          </div>
        );

      case 'boolean':
        return (
          <div key={paramName} className="property-control">
            <label className="property-checkbox-label">
              <input
                type="checkbox"
                className="property-checkbox"
                checked={!!paramValue}
                onChange={(e) => handleParameterChange(paramName, e.target.checked)}
              />
              {param.label || paramName}
            </label>
          </div>
        );

      case 'range':
        return (
          <div key={paramName} className="property-control">
            <label className="property-label">
              {param.label || paramName}: {paramValue}{param.unit || ''}
            </label>
            <input
              type="range"
              className="property-range"
              value={paramValue || param.min || 0}
              min={param.min || 0}
              max={param.max || 100}
              step={param.step || 1}
              onChange={(e) => handleParameterChange(paramName, parseFloat(e.target.value))}
            />
          </div>
        );

      default:
        return (
          <div key={paramName} className="property-control">
            <label className="property-label">{param.label || paramName}</label>
            <input
              type="text"
              className="property-input"
              value={String(paramValue || '')}
              onChange={(e) => handleParameterChange(paramName, e.target.value)}
            />
          </div>
        );
    }
  };

  if (!isOpen || !toolInstance || !tool) {
    return null;
  }

  return (
    <div className="tool-property-panel">
      <div className="property-panel-header">
        <div className="property-panel-title">
          <div className="tool-icon">
            🔧
          </div>
          <div className="tool-info">
            <h3>{tool.name}</h3>
            <p>{tool.data?.description || tool.type}</p>
          </div>
        </div>
        <button className="property-panel-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="property-panel-content">
        <div className="property-section">
          <h4>Position</h4>
          <div className="property-control">
            <label className="property-label">X</label>
            <input
              type="number"
              className="property-input"
              value={Math.round(toolInstance.pdfPosition.x * 100) / 100}
              step="0.01"
              onChange={(e) => {
                const newPosition = {
                  ...toolInstance.pdfPosition,
                  x: parseFloat(e.target.value) || 0
                };
                const updatedInstance = { ...toolInstance, pdfPosition: newPosition };
                onUpdate(updatedInstance);
              }}
            />
          </div>
          <div className="property-control">
            <label className="property-label">Y</label>
            <input
              type="number"
              className="property-input"
              value={Math.round(toolInstance.pdfPosition.y * 100) / 100}
              step="0.01"
              onChange={(e) => {
                const newPosition = {
                  ...toolInstance.pdfPosition,
                  y: parseFloat(e.target.value) || 0
                };
                const updatedInstance = { ...toolInstance, pdfPosition: newPosition };
                onUpdate(updatedInstance);
              }}
            />
          </div>
        </div>

        {tool.params && Object.keys(tool.params).length > 0 && (
          <div className="property-section">
            <h4>Tool Properties</h4>
            {Object.entries(tool.params).map(([paramName, param]) => 
              renderParameterControl({ ...param, name: paramName }, localParams[paramName])
            )}
          </div>
        )}

        <div className="property-actions">
          <button 
            className="property-btn property-btn-apply"
            onClick={handleApply}
            disabled={!hasChanges}
          >
            Apply Changes
          </button>
          <button 
            className="property-btn property-btn-reset"
            onClick={handleReset}
            disabled={!hasChanges}
          >
            Reset
          </button>
          <button 
            className="property-btn property-btn-delete"
            onClick={handleDelete}
          >
            Delete Tool
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolPropertyPanel;