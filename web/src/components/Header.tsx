import React, { useState } from 'react';

interface HeaderProps {
  currentFile: File | null;
  currentView: 'document' | 'meetings' | 'dashboard';
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onViewChange: (view: 'document' | 'meetings' | 'dashboard') => void;
  activeToolCategory: string;
  onToolCategoryChange: (category: string) => void;
  selectedTool: string | null;
  onToolSelect: (tool: string) => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showRulers: boolean;
  onToggleRulers: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentFile,
  currentView,
  onFileSelect,
  onViewChange,
  activeToolCategory,
  onToolCategoryChange,
  selectedTool,
  onToolSelect,
  zoomLevel,
  onZoomChange,
  showGrid,
  onToggleGrid,
  showRulers,
  onToggleRulers,
  darkMode,
  onToggleDarkMode
}) => {
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);

  const toolCategories = [
    { id: 'markup', label: 'Markup', icon: '✏️' },
    { id: 'measure', label: 'Measure', icon: '📏' },
    { id: 'compare', label: 'Compare', icon: '🔄' },
    { id: 'review', label: 'Review', icon: '👥' },
    { id: 'forms', label: 'Forms', icon: '📋' },
    { id: 'stamps', label: 'Stamps', icon: '🔖' }
  ];

  const markupTools = [
    { id: 'text', label: 'Text', icon: 'T' },
    { id: 'highlight', label: 'Highlight', icon: '🖍️' },
    { id: 'rectangle', label: 'Rectangle', icon: '⬜' },
    { id: 'circle', label: 'Circle', icon: '⭕' },
    { id: 'arrow', label: 'Arrow', icon: '➡️' },
    { id: 'line', label: 'Line', icon: '📏' },
    { id: 'freehand', label: 'Freehand', icon: '✏️' },
    { id: 'note', label: 'Note', icon: '📝' }
  ];

  const measureTools = [
    { id: 'distance', label: 'Distance', icon: '📏' },
    { id: 'area', label: 'Area', icon: '⬜' },
    { id: 'volume', label: 'Volume', icon: '📦' },
    { id: 'count', label: 'Count', icon: '#️⃣' },
    { id: 'calibrate', label: 'Calibrate', icon: '🎯' }
  ];

  const getCurrentTools = () => {
    switch (activeToolCategory) {
      case 'markup': return markupTools;
      case 'measure': return measureTools;
      default: return [];
    }
  };

  return (
    <header className="header">
      {/* Top Menu Bar */}
      <div className="menu-bar">
        <div className="menu-left">
          <div className="app-logo">
            <span className="logo-icon">📄</span>
            <span className="logo-text">TeamBeam</span>
          </div>
          
          {/* View Navigation */}
          <div className="view-navigation">
            <button 
              className={`nav-tab ${currentView === 'document' ? 'active' : ''}`}
              onClick={() => onViewChange('document')}
            >
              📄 Documents
            </button>
            <button 
              className={`nav-tab ${currentView === 'meetings' ? 'active' : ''}`}
              onClick={() => onViewChange('meetings')}
            >
              📅 Meetings
            </button>
            <button 
              className={`nav-tab ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => onViewChange('dashboard')}
            >
              📊 Dashboard
            </button>
          </div>
          
          <div className="menu-items">
            <div className="menu-item" onClick={() => setShowFileMenu(!showFileMenu)}>
              File
              {showFileMenu && (
                <div className="dropdown-menu">
                  <label className="menu-option">
                    📂 Open...
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={onFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <div className="menu-option">💾 Save</div>
                  <div className="menu-option">📤 Export</div>
                  <div className="menu-separator"></div>
                  <div className="menu-option">🖨️ Print</div>
                  <div className="menu-option">📧 Email</div>
                  <div className="menu-separator"></div>
                  <div className="menu-option">🔄 Recent Files</div>
                </div>
              )}
            </div>
            
            <div className="menu-item">Edit</div>
            
            <div className="menu-item" onClick={() => setShowViewMenu(!showViewMenu)}>
              View
              {showViewMenu && (
                <div className="dropdown-menu">
                  <div className={`menu-option ${showRulers ? 'checked' : ''}`} onClick={onToggleRulers}>
                    📏 Rulers
                  </div>
                  <div className={`menu-option ${showGrid ? 'checked' : ''}`} onClick={onToggleGrid}>
                    🔢 Grid
                  </div>
                  <div className="menu-separator"></div>
                  <div className="menu-option">🔍 Zoom In</div>
                  <div className="menu-option">🔍 Zoom Out</div>
                  <div className="menu-option">📐 Fit to Page</div>
                  <div className="menu-option">📏 Fit to Width</div>
                  <div className="menu-separator"></div>
                  <div className={`menu-option ${darkMode ? 'checked' : ''}`} onClick={onToggleDarkMode}>
                    🌙 Dark Mode
                  </div>
                </div>
              )}
            </div>
            
            <div className="menu-item">Tools</div>
            <div className="menu-item">Window</div>
            
            <div className="menu-item" onClick={() => setShowHelpMenu(!showHelpMenu)}>
              Help
              {showHelpMenu && (
                <div className="dropdown-menu">
                  <div className="menu-option">📖 User Guide</div>
                  <div className="menu-option">💡 Tips & Tricks</div>
                  <div className="menu-option">🎯 Tutorials</div>
                  <div className="menu-separator"></div>
                  <div className="menu-option">🔧 Support</div>
                  <div className="menu-option">ℹ️ About TeamBeam</div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="menu-right">
          <div className="current-file">
            {currentFile ? (
              <>
                <span className="file-icon">📄</span>
                <span className="file-name">{currentFile.name}</span>
              </>
            ) : (
              <span className="no-file">No document open</span>
            )}
          </div>
          
          <div className="user-menu">
            <div className="user-avatar">👤</div>
            <span className="user-name">User</span>
          </div>
        </div>
      </div>

      {/* Tool Category Tabs */}
      <div className="tool-categories">
        {toolCategories.map(category => (
          <button
            key={category.id}
            className={`category-tab ${activeToolCategory === category.id ? 'active' : ''}`}
            onClick={() => onToolCategoryChange(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-label">{category.label}</span>
          </button>
        ))}
      </div>

      {/* Tool Ribbon */}
      <div className="tool-ribbon">
        <div className="tool-groups">
          {/* Quick Actions */}
          <div className="tool-group">
            <div className="group-label">Quick Actions</div>
            <div className="tools">
              <button className="tool-button" title="Undo">
                <span className="tool-icon">↶</span>
                <span className="tool-label">Undo</span>
              </button>
              <button className="tool-button" title="Redo">
                <span className="tool-icon">↷</span>
                <span className="tool-label">Redo</span>
              </button>
              <button className="tool-button" title="Copy">
                <span className="tool-icon">📋</span>
                <span className="tool-label">Copy</span>
              </button>
              <button className="tool-button" title="Paste">
                <span className="tool-icon">📄</span>
                <span className="tool-label">Paste</span>
              </button>
            </div>
          </div>

          {/* Category Tools */}
          <div className="tool-group">
            <div className="group-label">{activeToolCategory.charAt(0).toUpperCase() + activeToolCategory.slice(1)} Tools</div>
            <div className="tools">
              {getCurrentTools().map(tool => (
                <button
                  key={tool.id}
                  className={`tool-button ${selectedTool === tool.id ? 'active' : ''}`}
                  onClick={() => onToolSelect(tool.id)}
                  title={tool.label}
                >
                  <span className="tool-icon">{tool.icon}</span>
                  <span className="tool-label">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* View Controls */}
          <div className="tool-group">
            <div className="group-label">View</div>
            <div className="tools">
              <button 
                className="tool-button" 
                onClick={() => onZoomChange(zoomLevel - 10)}
                title="Zoom Out"
              >
                <span className="tool-icon">🔍-</span>
                <span className="tool-label">Zoom Out</span>
              </button>
              
              <div className="zoom-display">
                <input
                  type="number"
                  value={Math.round(zoomLevel)}
                  onChange={(e) => onZoomChange(Number(e.target.value))}
                  className="zoom-input"
                  min="10"
                  max="1000"
                />
                <span className="zoom-percent">%</span>
              </div>
              
              <button 
                className="tool-button" 
                onClick={() => onZoomChange(zoomLevel + 10)}
                title="Zoom In"
              >
                <span className="tool-icon">🔍+</span>
                <span className="tool-label">Zoom In</span>
              </button>
              
              <button className="tool-button" title="Fit to Page">
                <span className="tool-icon">📐</span>
                <span className="tool-label">Fit Page</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};