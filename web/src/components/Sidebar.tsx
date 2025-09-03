import React, { useState } from 'react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  currentFile: File | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  currentFile,
  currentPage,
  totalPages,
  onPageChange
}) => {
  const [activeTab, setActiveTab] = useState<'pages' | 'bookmarks' | 'layers' | 'files'>('pages');

  const sidebarTabs = [
    { id: 'pages', label: 'Pages', icon: '📄' },
    { id: 'bookmarks', label: 'Bookmarks', icon: '🔖' },
    { id: 'layers', label: 'Layers', icon: '📚' },
    { id: 'files', label: 'Files', icon: '📁' }
  ];

  const mockBookmarks = [
    { id: 1, title: 'Title Page', page: 1, level: 0 },
    { id: 2, title: 'Site Plan', page: 3, level: 0 },
    { id: 3, title: 'Floor Plans', page: 5, level: 0 },
    { id: 4, title: 'Level 1', page: 6, level: 1 },
    { id: 5, title: 'Level 2', page: 8, level: 1 },
    { id: 6, title: 'Elevations', page: 10, level: 0 },
    { id: 7, title: 'North Elevation', page: 11, level: 1 },
    { id: 8, title: 'South Elevation', page: 12, level: 1 },
    { id: 9, title: 'Details', page: 15, level: 0 },
    { id: 10, title: 'Specifications', page: 20, level: 0 }
  ];

  const mockLayers = [
    { id: 1, name: 'Architectural', visible: true, locked: false, color: '#FF6B6B' },
    { id: 2, name: 'Structural', visible: true, locked: false, color: '#4ECDC4' },
    { id: 3, name: 'MEP', visible: false, locked: false, color: '#45B7D1' },
    { id: 4, name: 'Landscape', visible: true, locked: false, color: '#96CEB4' },
    { id: 5, name: 'Markups', visible: true, locked: false, color: '#FECA57' },
    { id: 6, name: 'Comments', visible: true, locked: false, color: '#FF9FF3' }
  ];

  const mockFiles = [
    { id: 1, name: 'Architectural Plans.pdf', type: 'pdf', size: '25.3 MB', modified: '2024-01-15' },
    { id: 2, name: 'Structural Drawings.pdf', type: 'pdf', size: '18.7 MB', modified: '2024-01-14' },
    { id: 3, name: 'MEP Plans.pdf', type: 'pdf', size: '31.2 MB', modified: '2024-01-13' },
    { id: 4, name: 'Site Survey.dwg', type: 'dwg', size: '12.1 MB', modified: '2024-01-12' },
    { id: 5, name: 'Project Photos', type: 'folder', size: '156 MB', modified: '2024-01-15' }
  ];

  const renderPagesTab = () => (
    <div className="pages-tab">
      <div className="pages-header">
        <span className="pages-info">
          {currentFile ? `${totalPages} pages` : 'No document'}
        </span>
        <div className="pages-controls">
          <button className="icon-button" title="Previous Page">⬅️</button>
          <span className="page-indicator">{currentPage}/{totalPages}</span>
          <button className="icon-button" title="Next Page">➡️</button>
        </div>
      </div>
      
      {currentFile && (
        <div className="pages-grid">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <div
              key={pageNum}
              className={`page-thumbnail ${currentPage === pageNum ? 'active' : ''}`}
              onClick={() => onPageChange(pageNum)}
            >
              <div className="page-preview">
                <div className="page-number">{pageNum}</div>
              </div>
              <div className="page-label">Page {pageNum}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBookmarksTab = () => (
    <div className="bookmarks-tab">
      <div className="bookmarks-header">
        <span className="tab-title">Document Outline</span>
        <button className="icon-button" title="Expand All">📖</button>
      </div>
      
      <div className="bookmarks-list">
        {mockBookmarks.map(bookmark => (
          <div
            key={bookmark.id}
            className={`bookmark-item level-${bookmark.level}`}
            onClick={() => onPageChange(bookmark.page)}
          >
            <span className="bookmark-icon">🔖</span>
            <span className="bookmark-title">{bookmark.title}</span>
            <span className="bookmark-page">p.{bookmark.page}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLayersTab = () => (
    <div className="layers-tab">
      <div className="layers-header">
        <span className="tab-title">Layers</span>
        <div className="layer-controls">
          <button className="icon-button" title="Show All">👁️</button>
          <button className="icon-button" title="Hide All">🚫</button>
          <button className="icon-button" title="Add Layer">➕</button>
        </div>
      </div>
      
      <div className="layers-list">
        {mockLayers.map(layer => (
          <div key={layer.id} className="layer-item">
            <div className="layer-controls">
              <button 
                className={`visibility-button ${layer.visible ? 'visible' : 'hidden'}`}
                title={layer.visible ? 'Hide Layer' : 'Show Layer'}
              >
                {layer.visible ? '👁️' : '🚫'}
              </button>
              <button 
                className={`lock-button ${layer.locked ? 'locked' : 'unlocked'}`}
                title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
              >
                {layer.locked ? '🔒' : '🔓'}
              </button>
            </div>
            <div 
              className="layer-color" 
              style={{ backgroundColor: layer.color }}
            ></div>
            <span className="layer-name">{layer.name}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFilesTab = () => (
    <div className="files-tab">
      <div className="files-header">
        <span className="tab-title">Project Files</span>
        <div className="file-controls">
          <button className="icon-button" title="Refresh">🔄</button>
          <button className="icon-button" title="Upload">⬆️</button>
          <button className="icon-button" title="New Folder">📁➕</button>
        </div>
      </div>
      
      <div className="files-list">
        {mockFiles.map(file => (
          <div key={file.id} className="file-item">
            <div className="file-icon">
              {file.type === 'pdf' ? '📄' : 
               file.type === 'dwg' ? '📐' : 
               file.type === 'folder' ? '📁' : '📄'}
            </div>
            <div className="file-info">
              <div className="file-name">{file.name}</div>
              <div className="file-details">
                <span className="file-size">{file.size}</span>
                <span className="file-modified">{file.modified}</span>
              </div>
            </div>
            <div className="file-actions">
              <button className="icon-button" title="More Options">⋮</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pages': return renderPagesTab();
      case 'bookmarks': return renderBookmarksTab();
      case 'layers': return renderLayersTab();
      case 'files': return renderFilesTab();
      default: return null;
    }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="sidebar-toggle" onClick={onToggle}>
          {isCollapsed ? '▶️' : '◀️'}
        </button>
        
        {!isCollapsed && (
          <div className="sidebar-tabs">
            {sidebarTabs.map(tab => (
              <button
                key={tab.id}
                className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as any)}
                title={tab.label}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {!isCollapsed && (
        <div className="sidebar-content">
          {renderTabContent()}
        </div>
      )}
    </aside>
  );
};