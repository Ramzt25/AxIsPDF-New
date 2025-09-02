// src/components/toolbox/ToolboxPalette.tsx
// The main toolbox palette component - FieldBeam's "smart tool chest"

import React, { useState, useEffect } from 'react';
import { Tool, toolboxService } from '../../services/toolbox';
import './ToolboxPalette.css';

interface ToolboxPaletteProps {
  onToolSelect: (tool: Tool) => void;
  onToolBuilder: () => void;
  className?: string;
}

export const ToolboxPalette: React.FC<ToolboxPaletteProps> = ({ 
  onToolSelect, 
  onToolBuilder, 
  className = '' 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [tools, setTools] = useState<Tool[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load default tools or user's active palette
    loadDefaultTools();
  }, []);

  const loadDefaultTools = () => {
    // Load tools from the toolbox service - either from loaded packs or default tools
    const loadedTools = toolboxService.getDefaultTools();
    setTools(loadedTools);
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.data?.discipline?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || 
                           tool.data?.category === selectedCategory ||
                           tool.type === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(tools.map(t => t.data?.category || t.type).filter(Boolean))];

  const toggleFavorite = (toolId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newFavorites = new Set(favorites);
    if (favorites.has(toolId)) {
      newFavorites.delete(toolId);
    } else {
      newFavorites.add(toolId);
    }
    setFavorites(newFavorites);
  };

  const getToolIcon = (tool: Tool): string => {
    // Return appropriate emoji/icon based on tool type and content
    switch (tool.type) {
      case 'symbol':
        if (tool.id.includes('receptacle')) return '🔌';
        if (tool.id.includes('light')) return '💡';
        if (tool.id.includes('panel')) return '⚡';
        return '⚙️';
      case 'stamp':
        return '📋';
      case 'callout':
        return '💬';
      case 'shape':
        return '⬜';
      case 'measure':
        return '📏';
      default:
        return '🔧';
    }
  };

  return (
    <div className={`toolbox-palette ${className}`}>
      {/* Header with search and actions */}
      <div className="toolbox-header">
        <div className="toolbox-search">
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button 
            className="search-clear" 
            onClick={() => setSearchQuery('')}
            style={{ display: searchQuery ? 'block' : 'none' }}
          >
            ✕
          </button>
        </div>

        <div className="toolbox-actions">
          <button 
            className="btn-tool-builder"
            onClick={onToolBuilder}
            title="Open Tool Builder"
          >
            🎨 Builder
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="category-filter">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Tools grid */}
      <div className="tools-grid">
        {filteredTools.map(tool => (
          <div
            key={tool.id}
            className="tool-item"
            onClick={() => onToolSelect(tool)}
            title={`${tool.name} - ${tool.type}`}
          >
            <div className="tool-icon">
              {getToolIcon(tool)}
            </div>
            
            <div className="tool-info">
              <div className="tool-name">{tool.name}</div>
              <div className="tool-meta">
                <span className="tool-type">{tool.type}</span>
                {tool.data?.discipline && (
                  <span className="tool-discipline">{tool.data.discipline}</span>
                )}
              </div>
            </div>

            <button
              className={`favorite-btn ${favorites.has(tool.id) ? 'favorited' : ''}`}
              onClick={(e) => toggleFavorite(tool.id, e)}
              title={favorites.has(tool.id) ? 'Remove from favorites' : 'Add to favorites'}
            >
              ⭐
            </button>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredTools.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-message">
            {searchQuery ? 'No tools match your search' : 'No tools available'}
          </div>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="btn-clear-search">
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Quick stats */}
      <div className="toolbox-footer">
        <div className="tool-count">
          {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
          {searchQuery && ` found`}
        </div>
      </div>
    </div>
  );
};