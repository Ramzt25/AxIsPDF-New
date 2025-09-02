import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  currentProject?: string | null;
  onNewProject?: () => void;
  onOpenProject?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentProject, 
  onNewProject, 
  onOpenProject 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    { path: '/', icon: '📊', label: 'Dashboard', key: 'dashboard' },
    { path: '/pipeline-editor', icon: '⚙️', label: 'Pipeline Editor', key: 'pipeline' },
    { path: '/batch-processor', icon: '📦', label: 'Batch Processor', key: 'batch' },
    { path: '/fieldbeam-meetings', icon: '🎥', label: 'FieldBeam Meetings', key: 'meetings' },
    { path: '/preferences', icon: '⚙️', label: 'Preferences', key: 'preferences' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActivePath = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">⚡</span>
          {!isCollapsed && <span className="logo-text">TeamBeam</span>}
        </div>
        <button 
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '»' : '«'}
        </button>
      </div>

      {currentProject && !isCollapsed && (
        <div className="sidebar-project">
          <div className="project-info">
            <span className="project-icon">📁</span>
            <span className="project-name" title={currentProject}>
              {currentProject.split('/').pop() || 'Untitled Project'}
            </span>
          </div>
        </div>
      )}

      <div className="sidebar-actions">
        {!isCollapsed && (
          <>
            <button 
              className="sidebar-btn primary"
              onClick={onNewProject}
              title="Create new project"
            >
              <span className="btn-icon">+</span>
              <span className="btn-text">New Project</span>
            </button>
            <button 
              className="sidebar-btn secondary"
              onClick={onOpenProject}
              title="Open existing project"
            >
              <span className="btn-icon">📂</span>
              <span className="btn-text">Open Project</span>
            </button>
          </>
        )}
        {isCollapsed && (
          <>
            <button 
              className="sidebar-btn icon-only"
              onClick={onNewProject}
              title="Create new project"
            >
              +
            </button>
            <button 
              className="sidebar-btn icon-only"
              onClick={onOpenProject}
              title="Open existing project"
            >
              📂
            </button>
          </>
        )}
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${isActivePath(item.path) ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path)}
            title={isCollapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="version-info">
            <small>TeamBeam v1.0.0</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;