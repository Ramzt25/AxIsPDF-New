import React, { useState, useRef, useEffect } from 'react';
import './PremiumHeader.css';

interface HeaderProps {
  currentDocument?: string;
  isDocumentModified?: boolean;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  shortcut?: string;
  onClick: () => void;
  isActive?: boolean;
  separator?: boolean;
}

export const PremiumHeader: React.FC<HeaderProps> = ({
  currentDocument = 'Untitled Document',
  isDocumentModified = false,
  zoomLevel = 100,
  onZoomChange,
  onSave,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const quickActions: QuickAction[] = [
    {
      id: 'save',
      icon: '💾',
      label: 'Save',
      shortcut: 'Ctrl+S',
      onClick: () => onSave?.()
    },
    {
      id: 'separator-1',
      icon: '',
      label: '',
      separator: true,
      onClick: () => {}
    },
    {
      id: 'undo',
      icon: '↶',
      label: 'Undo',
      shortcut: 'Ctrl+Z',
      onClick: () => onUndo?.()
    },
    {
      id: 'redo',
      icon: '↷',
      label: 'Redo',
      shortcut: 'Ctrl+Y',
      onClick: () => onRedo?.()
    },
    {
      id: 'separator-2',
      icon: '',
      label: '',
      separator: true,
      onClick: () => {}
    },
    {
      id: 'measure',
      icon: '📏',
      label: 'Measure',
      onClick: () => console.log('Measure tool'),
      isActive: false
    },
    {
      id: 'annotate',
      icon: '✏️',
      label: 'Annotate',
      onClick: () => console.log('Annotate tool'),
      isActive: true
    },
    {
      id: 'markup',
      icon: '🖊️',
      label: 'Markup',
      onClick: () => console.log('Markup tool'),
      isActive: false
    },
    {
      id: 'separator-3',
      icon: '',
      label: '',
      separator: true,
      onClick: () => {}
    },
    {
      id: 'share',
      icon: '🔗',
      label: 'Share',
      onClick: () => console.log('Share document')
    },
    {
      id: 'export',
      icon: '📤',
      label: 'Export',
      onClick: () => console.log('Export document')
    }
  ];

  const menuItems = [
    {
      id: 'file',
      label: 'File',
      items: [
        { id: 'new', label: 'New Project', shortcut: 'Ctrl+N' },
        { id: 'open', label: 'Open...', shortcut: 'Ctrl+O' },
        { id: 'save', label: 'Save', shortcut: 'Ctrl+S' },
        { id: 'save-as', label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
        { separator: true },
        { id: 'import', label: 'Import PDF...' },
        { id: 'export', label: 'Export...' },
        { separator: true },
        { id: 'recent', label: 'Recent Files' },
        { separator: true },
        { id: 'exit', label: 'Exit', shortcut: 'Alt+F4' }
      ]
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z' },
        { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Y' },
        { separator: true },
        { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X' },
        { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C' },
        { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V' },
        { separator: true },
        { id: 'select-all', label: 'Select All', shortcut: 'Ctrl+A' },
        { id: 'find', label: 'Find...', shortcut: 'Ctrl+F' }
      ]
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { id: 'zoom-in', label: 'Zoom In', shortcut: 'Ctrl+=' },
        { id: 'zoom-out', label: 'Zoom Out', shortcut: 'Ctrl+-' },
        { id: 'zoom-fit', label: 'Fit to Window', shortcut: 'Ctrl+0' },
        { separator: true },
        { id: 'fullscreen', label: 'Full Screen', shortcut: 'F11' },
        { id: 'sidebar', label: 'Toggle Sidebar', shortcut: 'Ctrl+B' },
        { id: 'toolbar', label: 'Toggle Toolbar', shortcut: 'Ctrl+T' }
      ]
    },
    {
      id: 'tools',
      label: 'Tools',
      items: [
        { id: 'markup-tools', label: 'Markup Tools' },
        { id: 'measurement', label: 'Measurement Tools' },
        { id: 'annotation', label: 'Annotation Tools' },
        { separator: true },
        { id: 'batch-process', label: 'Batch Processing' },
        { id: 'ocr', label: 'OCR Tools' },
        { separator: true },
        { id: 'preferences', label: 'Preferences...', shortcut: 'Ctrl+,' }
      ]
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { id: 'getting-started', label: 'Getting Started' },
        { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts' },
        { id: 'documentation', label: 'Documentation' },
        { separator: true },
        { id: 'support', label: 'Contact Support' },
        { id: 'about', label: 'About TeamBeam' }
      ]
    }
  ];

  const handleMenuClick = (menuId: string) => {
    setActiveDropdown(activeDropdown === menuId ? null : menuId);
  };

  const handleZoomChange = (newZoom: number) => {
    onZoomChange?.(Math.max(10, Math.min(500, newZoom)));
  };

  const formatDocumentTitle = (title: string) => {
    const maxLength = 40;
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength - 3) + '...';
  };

  return (
    <header className="premium-header">
      {/* Main Menu Bar */}
      <div className="header-menu-bar">
        {menuItems.map((menu) => (
          <div key={menu.id} className="menu-item-container">
            <button
              className={`menu-item ${activeDropdown === menu.id ? 'active' : ''}`}
              onClick={() => handleMenuClick(menu.id)}
            >
              {menu.label}
            </button>
            
            {activeDropdown === menu.id && (
              <div className="menu-dropdown">
                {menu.items.map((item, index) => {
                  if (item.separator) {
                    return <div key={index} className="menu-separator" />;
                  }
                  return (
                    <button
                      key={item.id}
                      className="menu-dropdown-item"
                      onClick={() => {
                        console.log(`Menu action: ${item.id}`);
                        setActiveDropdown(null);
                      }}
                    >
                      <span className="menu-item-label">{item.label}</span>
                      {item.shortcut && (
                        <span className="menu-item-shortcut">{item.shortcut}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Header Content */}
      <div className="header-content">
        {/* Document Info */}
        <div className="document-info">
          <div className="document-title">
            <span className="document-name">
              {formatDocumentTitle(currentDocument)}
              {isDocumentModified && <span className="modified-indicator">●</span>}
            </span>
            <div className="document-meta">
              <span className="document-status">Saved 2 minutes ago</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Toolbar */}
        <div className="quick-actions">
          {quickActions.map((action) => {
            if (action.separator) {
              return <div key={action.id} className="action-separator" />;
            }
            
            const isDisabled = 
              (action.id === 'undo' && !canUndo) || 
              (action.id === 'redo' && !canRedo);

            return (
              <button
                key={action.id}
                className={`quick-action ${action.isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
                onClick={action.onClick}
                disabled={isDisabled}
              >
                <span className="action-icon">{action.icon}</span>
                <span className="action-label">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side Controls */}
        <div className="header-controls">
          {/* Search */}
          <div className={`search-container ${showSearch ? 'expanded' : ''}`}>
            {showSearch ? (
              <div className="search-input-container">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search in document..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  onBlur={() => setShowSearch(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowSearch(false);
                      setSearchQuery('');
                    }
                  }}
                />
                <button
                  className="search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearch(false);
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                className="search-toggle"
                onClick={() => setShowSearch(true)}
                title="Search (Ctrl+F)"
              >
                🔍
              </button>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="zoom-controls">
            <button
              className="zoom-btn"
              onClick={() => handleZoomChange(zoomLevel - 25)}
              title="Zoom Out (Ctrl+-)"
            >
              ➖
            </button>
            
            <div className="zoom-display">
              <input
                type="number"
                value={Math.round(zoomLevel)}
                onChange={(e) => handleZoomChange(parseInt(e.target.value) || 100)}
                className="zoom-input"
                min="10"
                max="500"
              />
              <span className="zoom-unit">%</span>
            </div>
            
            <button
              className="zoom-btn"
              onClick={() => handleZoomChange(zoomLevel + 25)}
              title="Zoom In (Ctrl+=)"
            >
              ➕
            </button>
          </div>

          {/* Collaboration Indicator */}
          <div className="collaboration-indicator">
            <div className="collaborators">
              <div className="collaborator-avatar" title="John Doe">
                JD
              </div>
              <div className="collaborator-avatar" title="Sarah Wilson">
                SW
              </div>
              <div className="collaborator-count">+3</div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="connection-status connected" title="Connected to TeamBeam Cloud">
            <div className="status-indicator"></div>
            <span className="status-text">Online</span>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {activeDropdown && (
        <div
          className="dropdown-overlay"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </header>
  );
};