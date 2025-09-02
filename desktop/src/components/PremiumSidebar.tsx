import React, { useState, useRef, useEffect } from 'react';
import './PremiumSidebar.css';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeProject?: string;
  onProjectSelect?: (projectId: string) => void;
}

interface SidebarSection {
  id: string;
  title: string;
  icon: string;
  items?: SidebarItem[];
  expanded?: boolean;
}

interface SidebarItem {
  id: string;
  title: string;
  icon?: string;
  count?: number;
  type?: 'project' | 'folder' | 'document' | 'tool';
  children?: SidebarItem[];
  actions?: SidebarAction[];
}

interface SidebarAction {
  id: string;
  icon: string;
  tooltip: string;
  onClick: () => void;
}

const MOCK_SIDEBAR_DATA: SidebarSection[] = [
  {
    id: 'projects',
    title: 'Projects',
    icon: '📁',
    expanded: true,
    items: [
      {
        id: 'project-1',
        title: 'Construction Site A',
        icon: '🏗️',
        type: 'project',
        count: 24,
        children: [
          { id: 'plans', title: 'Architectural Plans', icon: '📐', count: 8 },
          { id: 'elevations', title: 'Elevations', icon: '🏢', count: 6 },
          { id: 'details', title: 'Construction Details', icon: '🔧', count: 10 }
        ]
      },
      {
        id: 'project-2',
        title: 'Office Renovation',
        icon: '🏢',
        type: 'project',
        count: 12,
        children: [
          { id: 'floor-plans', title: 'Floor Plans', icon: '📋', count: 4 },
          { id: 'electrical', title: 'Electrical', icon: '⚡', count: 8 }
        ]
      }
    ]
  },
  {
    id: 'tools',
    title: 'Toolbox',
    icon: '🛠️',
    expanded: true,
    items: [
      { id: 'markup', title: 'Markup Tools', icon: '✏️', count: 12 },
      { id: 'measure', title: 'Measurement', icon: '📏', count: 8 },
      { id: 'annotations', title: 'Annotations', icon: '💬', count: 16 },
      { id: 'stamps', title: 'Stamps', icon: '🔖', count: 24 }
    ]
  },
  {
    id: 'recent',
    title: 'Recent Files',
    icon: '⏰',
    expanded: false,
    items: [
      { id: 'doc-1', title: 'Site Plan Rev 3.pdf', icon: '📄', type: 'document' },
      { id: 'doc-2', title: 'Foundation Detail.pdf', icon: '📄', type: 'document' },
      { id: 'doc-3', title: 'Elevation South.pdf', icon: '📄', type: 'document' }
    ]
  }
];

export const PremiumSidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  activeProject,
  onProjectSelect
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['projects', 'tools'])
  );
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCollapsed && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isCollapsed]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const filteredSections = MOCK_SIDEBAR_DATA.map(section => ({
    ...section,
    items: section.items?.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => 
    section.items && section.items.length > 0 || searchQuery === ''
  );

  const renderSidebarItem = (item: SidebarItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isHovered = hoveredItem === item.id;

    return (
      <div key={item.id} className="sidebar-item-container">
        <div
          className={`sidebar-item ${activeProject === item.id ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => {
            if (hasChildren) {
              toggleItem(item.id);
            } else if (onProjectSelect) {
              onProjectSelect(item.id);
            }
          }}
        >
          {hasChildren && (
            <button
              className={`sidebar-expand-btn ${isExpanded ? 'expanded' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleItem(item.id);
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M4.5 3L7.5 6L4.5 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          
          <div className="sidebar-item-icon">
            {item.icon || '📄'}
          </div>
          
          {!isCollapsed && (
            <>
              <div className="sidebar-item-content">
                <span className="sidebar-item-title">{item.title}</span>
                {item.count && (
                  <span className="sidebar-item-count">{item.count}</span>
                )}
              </div>
              
              {item.actions && (
                <div className="sidebar-item-actions">
                  {item.actions.map(action => (
                    <button
                      key={action.id}
                      className="sidebar-action-btn"
                      title={action.tooltip}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick();
                      }}
                    >
                      {action.icon}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="sidebar-children">
            {item.children!.map(child => renderSidebarItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderSection = (section: SidebarSection) => {
    const isExpanded = expandedSections.has(section.id);
    
    return (
      <div key={section.id} className="sidebar-section">
        <button
          className={`sidebar-section-header ${isExpanded ? 'expanded' : ''}`}
          onClick={() => toggleSection(section.id)}
        >
          <div className="sidebar-section-icon">
            {section.icon}
          </div>
          
          {!isCollapsed && (
            <>
              <span className="sidebar-section-title">{section.title}</span>
              <svg 
                className={`sidebar-section-chevron ${isExpanded ? 'expanded' : ''}`}
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none"
              >
                <path
                  d="M6 12L10 8L6 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </>
          )}
        </button>
        
        {isExpanded && !isCollapsed && (
          <div className="sidebar-section-content">
            {section.items?.map(item => renderSidebarItem(item))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`premium-sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          {!isCollapsed && (
            <>
              <div className="sidebar-logo">
                <span className="logo-icon">⚡</span>
                <span className="logo-text">TeamBeam</span>
              </div>
              <div className="sidebar-tagline">Professional PDF Markup</div>
            </>
          )}
        </div>
        
        <button
          className="sidebar-toggle"
          onClick={onToggle}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none"
            className={isCollapsed ? 'rotated' : ''}
          >
            <path
              d="M8 4L14 10L8 16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="sidebar-search">
          <div className="search-input-container">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search projects, files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery('')}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sidebar Content */}
      <div className="sidebar-content">
        {filteredSections.map(renderSection)}
      </div>

      {/* Sidebar Footer */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              <span>TR</span>
            </div>
            <div className="user-info">
              <div className="user-name">Tyler Ramsey</div>
              <div className="user-status">Online</div>
            </div>
            <button className="user-menu-btn" title="User Menu">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM8 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};