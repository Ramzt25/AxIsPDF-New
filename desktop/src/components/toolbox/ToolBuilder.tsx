// src/components/toolbox/ToolBuilder.tsx
// The Tool Builder modal - create and edit parametric tools with AI assistance

import React, { useState, useRef, useCallback } from 'react';
import { Tool, ToolParameter, toolboxService } from '../../services/toolbox';
import './ToolBuilder.css';

interface ToolBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  editingTool?: Tool | null;
  onSave: (tool: Tool) => void;
}

interface ParameterDraft extends ToolParameter {
  id: string;
}

export const ToolBuilder: React.FC<ToolBuilderProps> = ({
  isOpen,
  onClose,
  editingTool,
  onSave
}) => {
  const [toolName, setToolName] = useState(editingTool?.name || '');
  const [toolType, setToolType] = useState<Tool['type']>(editingTool?.type || 'symbol');
  const [svgContent, setSvgContent] = useState(editingTool?.svg || '');
  const [parameters, setParameters] = useState<ParameterDraft[]>([]);
  const [discipline, setDiscipline] = useState(editingTool?.data?.discipline || 'General');
  const [category, setCategory] = useState(editingTool?.data?.category || 'Custom');
  const [description, setDescription] = useState(editingTool?.data?.description || '');
  const [handles, setHandles] = useState<any[]>(editingTool?.handles || []);
  
  const [activeTab, setActiveTab] = useState<'basic' | 'svg' | 'parameters' | 'handles' | 'preview'>('basic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const svgFileRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens/closes or editing tool changes
  React.useEffect(() => {
    if (isOpen) {
      if (editingTool) {
        setToolName(editingTool.name);
        setToolType(editingTool.type);
        setSvgContent(editingTool.svg);
        setDiscipline(editingTool.data?.discipline || 'General');
        setCategory(editingTool.data?.category || 'Custom');
        setDescription(editingTool.data?.description || '');
        setHandles(editingTool.handles || []);
        
        // Convert parameters to draft format
        const paramDrafts: ParameterDraft[] = Object.entries(editingTool.params || {}).map(([key, param]) => ({
          id: key,
          ...param
        }));
        setParameters(paramDrafts);
      } else {
        // Reset to defaults
        setToolName('');
        setToolType('symbol');
        setSvgContent('');
        setParameters([]);
        setDiscipline('General');
        setCategory('Custom');
        setDescription('');
        setHandles([]);
      }
      setActiveTab('basic');
      setErrors([]);
    }
  }, [isOpen, editingTool]);

  const handleSvgFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSvgContent(content);
        // Auto-detect potential parameters from SVG
        autoDetectParameters(content);
      };
      reader.readAsText(file);
    }
  }, []);

  const autoDetectParameters = (svg: string) => {
    // TODO[PH-017]: Analyze SVG for text elements, groups, and other parametric opportunities
    const detectedParams: ParameterDraft[] = [];
    
    // Look for text elements that could be parameters
    const textMatches = svg.match(/<text[^>]*>(.*?)<\/text>/gi);
    if (textMatches) {
      textMatches.forEach((match, index) => {
        const content = match.replace(/<[^>]*>/g, '').trim();
        if (content && content.length < 20) {
          detectedParams.push({
            id: `text_${index}`,
            type: 'string',
            default: content,
            label: `Text ${index + 1}`,
            description: `Text element: "${content}"`
          });
        }
      });
    }

    // Look for groups that might represent rotatable elements
    if (svg.includes('<g ') || svg.includes('<group')) {
      detectedParams.push({
        id: 'rotation',
        type: 'angle',
        default: 0,
        min: 0,
        max: 359,
        label: 'Rotation',
        description: 'Rotation angle in degrees'
      });
    }

    setParameters(prev => [...prev, ...detectedParams]);
  };

  const addParameter = () => {
    const newParam: ParameterDraft = {
      id: `param_${Date.now()}`,
      type: 'string',
      default: '',
      label: 'New Parameter'
    };
    setParameters(prev => [...prev, newParam]);
  };

  const updateParameter = (index: number, updates: Partial<ParameterDraft>) => {
    setParameters(prev => prev.map((param, i) => 
      i === index ? { ...param, ...updates } : param
    ));
  };

  const removeParameter = (index: number) => {
    setParameters(prev => prev.filter((_, i) => i !== index));
  };

  const generateWithAI = async (prompt: string) => {
    setIsGenerating(true);
    try {
      // TODO[PH-018]: Implement AI tool generation
      // This would integrate with OpenAI/Claude to generate SVG and parameters
      console.log('AI Generation requested:', prompt);
      
      // Mock response for now
      setTimeout(() => {
        setSvgContent(`<!-- AI Generated SVG for: ${prompt} -->\n<svg width="100" height="100" viewBox="0 0 100 100">\n  <circle cx="50" cy="50" r="30" fill="blue" />\n  <text x="50" y="55" text-anchor="middle" fill="white">${prompt.slice(0, 2).toUpperCase()}</text>\n</svg>`);
        setIsGenerating(false);
      }, 2000);
      
    } catch (error) {
      console.error('AI generation failed:', error);
      setErrors(['AI generation failed. Please try again.']);
      setIsGenerating(false);
    }
  };

  const validateTool = (): string[] => {
    const validationErrors: string[] = [];
    
    if (!toolName.trim()) {
      validationErrors.push('Tool name is required');
    }
    
    if (!svgContent.trim()) {
      validationErrors.push('SVG content is required');
    } else if (!svgContent.includes('<svg')) {
      validationErrors.push('Invalid SVG content');
    }
    
    // Validate parameter IDs are unique
    const paramIds = parameters.map(p => p.id);
    const duplicateIds = paramIds.filter((id, index) => paramIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      validationErrors.push(`Duplicate parameter IDs: ${duplicateIds.join(', ')}`);
    }
    
    return validationErrors;
  };

  const handleSave = () => {
    const validationErrors = validateTool();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Convert parameters to Tool format
    const toolParams: Record<string, ToolParameter> = {};
    parameters.forEach(param => {
      const { id, ...paramData } = param;
      toolParams[id] = paramData;
    });

    const tool: Tool = {
      id: editingTool?.id || `tool-${Date.now()}`,
      name: toolName,
      version: (editingTool?.version || 0) + 1,
      type: toolType,
      svg: svgContent,
      params: toolParams,
      handles,
      data: {
        discipline,
        category,
        description,
        created: editingTool?.data?.created || new Date().toISOString(),
        modified: new Date().toISOString()
      }
    };

    onSave(tool);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="tool-builder-overlay">
      <div className="tool-builder-modal">
        {/* Header */}
        <div className="tool-builder-header">
          <h2>{editingTool ? 'Edit Tool' : 'Create New Tool'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-nav">
          {(['basic', 'svg', 'parameters', 'handles', 'preview'] as const).map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="basic-tab">
              <div className="form-row">
                <label>Tool Name</label>
                <input
                  type="text"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  placeholder="Enter tool name"
                />
              </div>

              <div className="form-row">
                <label>Tool Type</label>
                <select value={toolType} onChange={(e) => setToolType(e.target.value as Tool['type'])}>
                  <option value="symbol">Symbol</option>
                  <option value="stamp">Stamp</option>
                  <option value="callout">Callout</option>
                  <option value="shape">Shape</option>
                  <option value="measure">Measure</option>
                </select>
              </div>

              <div className="form-row">
                <label>Discipline</label>
                <select value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
                  <option value="General">General</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Architectural">Architectural</option>
                  <option value="Structural">Structural</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="form-row">
                <label>Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Enter category"
                />
              </div>

              <div className="form-row">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this tool does"
                  rows={3}
                />
              </div>

              {/* AI Generation */}
              <div className="ai-section">
                <h3>🤖 AI Tool Generator</h3>
                <div className="ai-prompt">
                  <input
                    type="text"
                    placeholder="Describe the tool you want to create (e.g., 'electrical outlet symbol with label')"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        generateWithAI(e.currentTarget.value);
                      }
                    }}
                  />
                  <button 
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      generateWithAI(input.value);
                    }}
                    disabled={isGenerating}
                  >
                    {isGenerating ? '⏳ Generating...' : '✨ Generate'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SVG Tab */}
          {activeTab === 'svg' && (
            <div className="svg-tab">
              <div className="svg-upload">
                <input
                  type="file"
                  accept=".svg"
                  onChange={handleSvgFileUpload}
                  ref={svgFileRef}
                  style={{ display: 'none' }}
                />
                <button onClick={() => svgFileRef.current?.click()}>
                  📁 Upload SVG File
                </button>
              </div>

              <div className="svg-editor">
                <label>SVG Content</label>
                <textarea
                  value={svgContent}
                  onChange={(e) => setSvgContent(e.target.value)}
                  placeholder="Paste or edit SVG content here"
                  rows={15}
                  className="svg-textarea"
                />
              </div>

              {svgContent && (
                <div className="svg-preview">
                  <label>Preview</label>
                  <div 
                    className="svg-preview-container"
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Parameters Tab */}
          {activeTab === 'parameters' && (
            <div className="parameters-tab">
              <div className="parameters-header">
                <h3>Tool Parameters</h3>
                <button onClick={addParameter} className="add-param-btn">
                  + Add Parameter
                </button>
              </div>

              <div className="parameters-list">
                {parameters.map((param, index) => (
                  <div key={param.id} className="parameter-item">
                    <div className="param-header">
                      <input
                        type="text"
                        value={param.id}
                        onChange={(e) => updateParameter(index, { id: e.target.value })}
                        placeholder="Parameter ID"
                        className="param-id"
                      />
                      <button 
                        onClick={() => removeParameter(index)}
                        className="remove-param-btn"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="param-fields">
                      <div className="field">
                        <label>Label</label>
                        <input
                          type="text"
                          value={param.label || ''}
                          onChange={(e) => updateParameter(index, { label: e.target.value })}
                        />
                      </div>

                      <div className="field">
                        <label>Type</label>
                        <select
                          value={param.type}
                          onChange={(e) => updateParameter(index, { type: e.target.value as ToolParameter['type'] })}
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="angle">Angle</option>
                          <option value="color">Color</option>
                          <option value="date">Date</option>
                          <option value="select">Select</option>
                          <option value="point">Point</option>
                          <option value="polyline">Polyline</option>
                        </select>
                      </div>

                      <div className="field">
                        <label>Default</label>
                        <input
                          type="text"
                          value={String(param.default || '')}
                          onChange={(e) => updateParameter(index, { default: e.target.value })}
                        />
                      </div>
                    </div>

                    {param.description && (
                      <div className="param-description">
                        <textarea
                          value={param.description}
                          onChange={(e) => updateParameter(index, { description: e.target.value })}
                          placeholder="Parameter description"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TODO[PH-019]: Implement Handles and Preview tabs */}
          {activeTab === 'handles' && (
            <div className="handles-tab">
              <p>Handle editing coming soon...</p>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="preview-tab">
              <p>Live preview coming soon...</p>
            </div>
          )}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="errors">
            {errors.map((error, index) => (
              <div key={index} className="error">{error}</div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="tool-builder-footer">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={handleSave} className="btn-save">
            {editingTool ? 'Update Tool' : 'Create Tool'}
          </button>
        </div>
      </div>
    </div>
  );
};