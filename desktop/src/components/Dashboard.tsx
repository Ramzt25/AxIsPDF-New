import React, { useState, useEffect } from 'react';
import {
  Plus,
  FolderOpen,
  FileText,
  Zap,
  Eye,
  CheckCircle,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  RotateCw,
  HelpCircle,
  Layers,
  MousePointer,
  Square,
  Circle,
  Triangle,
  Ruler,
  Lightbulb,
  Archive,
  Minus,
  Maximize2,
  Settings,
  Users,
  Home
} from 'lucide-react';
import { SocialDashboard } from './SocialDashboard';
import './Dashboard.pro.css';

interface DashboardProps {
  currentProject: string | null;
  recentProjects: string[];
  onOpenProject: (path: string) => void;
  onNewProject: () => void;
}

interface ProjectStats {
  totalDocuments: number;
  totalPages: number;
  pipelineRuns: number;
}

interface ActivityItem {
  id: string;
  type: 'upload' | 'annotation' | 'measurement' | 'collaboration' | 'pipeline';
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error' | 'info';
}

const Dashboard: React.FC<DashboardProps> = ({
  currentProject,
  recentProjects,
  onOpenProject,
  onNewProject
}) => {
  // State for different dashboard views
  const [currentView, setCurrentView] = useState<'pdf' | 'social'>('pdf');
  const [isLoading, setIsLoading] = useState(false);
  const [projectStats, setProjectStats] = useState<ProjectStats>({
    totalDocuments: 0,
    totalPages: 0,
    pipelineRuns: 0
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('annotation');
  const [currentDocument, setCurrentDocument] = useState<string>('A200.pdf');
  const [zoomLevel, setZoomLevel] = useState<number>(71);

  // Navigation tools for left sidebar
  const navigationTools = [
    { id: 'annotation', icon: MousePointer, label: 'Annotation', active: true },
    { id: 'annotations', icon: FileText, label: 'Annotations' },
    { id: 'measurements', icon: Ruler, label: 'Measurements' },
    { id: 'layers', icon: Layers, label: 'Layers' },
    { id: 'insights', icon: Lightbulb, label: 'Insights' },
    { id: 'archive', icon: Archive, label: 'Archive' }
  ];

  // Drawing tools for toolbar
  const drawingTools = [
    { id: 'select', icon: MousePointer, name: 'Select' },
    { id: 'pen', icon: FileText, name: 'Pen' },
    { id: 'text', icon: FileText, name: 'Text' },
    { id: 'square', icon: Square, name: 'Rectangle' },
    { id: 'circle', icon: Circle, name: 'Circle' },
    { id: 'arrow', icon: Triangle, name: 'Arrow' }
  ];

  // AI Insights data
  const aiInsights = {
    extractedInfo: {
      room: 'OFFICE',
      ceiling: '8.50"',
      length: '20.35',
      door: '3\' - 0"'
    },
    missingDimensions: ['8\' - 5"'],
    potentialMarkups: [
      { type: 'dimension', color: 'orange' },
      { type: 'annotation', color: 'blue' }
    ]
  };

  useEffect(() => {
    if (currentProject) {
      setIsLoading(true);
      // Simulate loading project stats
      setTimeout(() => {
        setProjectStats({
          totalDocuments: 15,
          totalPages: 247,
          pipelineRuns: 12
        });
        
        setRecentActivity([
          {
            id: '1',
            type: 'annotation',
            description: 'Added dimension markup to OFFICE room',
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            status: 'success'
          },
          {
            id: '2',
            type: 'measurement',
            description: 'Measured hallway width: 10.87"',
            timestamp: new Date(Date.now() - 1000 * 60 * 15),
            status: 'success'
          },
          {
            id: '3',
            type: 'upload',
            description: 'Uploaded A200.pdf to project',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            status: 'success'
          }
        ]);
        
        setIsLoading(false);
      }, 1000);
    }
  }, [currentProject]);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="professional-dashboard">
      {/* Professional Header - Enhanced for Desktop */}
      <div className="dashboard-header-pro">
        <div className="header-left">
          <div className="logo-section">
            <div className="logo-icon">📄</div>
            <span className="app-title">AxIs PDF Intelligence</span>
          </div>
          
          <div className="project-selector">
            <FolderOpen size={16} />
            <span className="project-label">Project A</span>
            <ChevronDown size={16} />
          </div>
          
          <div className="document-selector">
            <FileText size={16} />
            <span className="document-name">{currentDocument}</span>
            <ChevronDown size={16} />
          </div>
        </div>

        <div className="header-center">
          <div className="zoom-controls">
            <button className="zoom-btn" title="Zoom Out">
              <ZoomOut size={16} />
            </button>
            <span className="zoom-level">{zoomLevel}%</span>
            <button className="zoom-btn" title="Zoom In">
              <ZoomIn size={16} />
            </button>
          </div>
          
          <div className="view-controls">
            <button className="view-btn" title="Rotate">
              <RotateCw size={16} />
            </button>
            <button className="view-btn active" title="Fit to Window">
              <Square size={16} />
            </button>
          </div>
        </div>

        <div className="header-right">
          {/* View Navigation */}
          <div className="view-navigation">
            <button 
              className={`view-nav-btn ${currentView === 'pdf' ? 'active' : ''}`}
              onClick={() => setCurrentView('pdf')}
              title="PDF Viewer"
            >
              <FileText size={16} />
              PDF
            </button>
            <button 
              className={`view-nav-btn ${currentView === 'social' ? 'active' : ''}`}
              onClick={() => setCurrentView('social')}
              title="Social Dashboard"
            >
              <Users size={16} />
              Social
            </button>
          </div>
          
          <button className="header-btn" title="Settings">
            <HelpCircle size={16} />
          </button>
          <button className="header-btn ai-btn" title="AI Assistant">
            <Lightbulb size={16} />
            AI
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-main-pro">
        {/* Left Navigation Sidebar */}
        <div className="nav-sidebar">
          {navigationTools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <div
                key={tool.id}
                className={`nav-tool ${selectedTool === tool.id ? 'active' : ''}`}
                onClick={() => setSelectedTool(tool.id)}
                title={tool.label}
              >
                <IconComponent size={20} />
                <span className="nav-label">{tool.label}</span>
              </div>
            );
          })}
        </div>

        {/* Central Content Area */}
        <div className="content-area">
          {currentView === 'social' ? (
            /* Social Dashboard View */
            <SocialDashboard 
              currentUserId="user123"
              currentUserName="Sarah Johnson"
            />
          ) : currentProject ? (
            <>
              {/* Drawing Toolbar */}
              <div className="drawing-toolbar">
                {drawingTools.map((tool) => {
                  const IconComponent = tool.icon;
                  return (
                    <button key={tool.id} className="drawing-tool" title={tool.name}>
                      <IconComponent size={16} />
                    </button>
                  );
                })}
              </div>

              {/* Main Canvas/Content */}
              <div className="canvas-area">
                <div className="document-preview">
                  <div className="blueprint-mockup">
                    <div className="room-label office">OFFICE</div>
                    <div className="room-label hallway">HALLWAY</div>
                    <div className="dimension-line">4.08"</div>
                    <div className="dimension-line vertical">10.87"</div>
                    <div className="dimension-arrow orange"></div>
                    <div className="dimension-arrow blue"></div>
                    <div className="office-highlight">OFFICE</div>
                  </div>
                </div>
              </div>

              {/* Bottom Status Bar */}
              <div className="status-bar">
                <div className="status-left">
                  <span className="markups-count">3 unresolved markups</span>
                  <div className="markup-indicators">
                    <div className="markup-dot active"></div>
                    <div className="markup-dot"></div>
                    <div className="markup-dot"></div>
                  </div>
                </div>
                
                <div className="status-right">
                  <span className="comments-label">Comments</span>
                </div>
              </div>
            </>
          ) : (
            /* Welcome State */
            <div className="welcome-professional">
              <div className="welcome-content">
                <div className="welcome-icon-pro">📄</div>
                <h2>Welcome to AxIs PDF Intelligence</h2>
                <p>Professional construction document processing platform</p>
                
                <div className="welcome-actions-pro">
                  <button className="btn-pro primary" onClick={onNewProject}>
                    <Plus size={16} />
                    Create New Project
                  </button>
                  <button className="btn-pro secondary" onClick={() => onOpenProject('')}>
                    <FolderOpen size={16} />
                    Open Project
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right AI Insights Panel */}
        <div className="ai-insights-panel">
          <div className="panel-header">
            <Lightbulb size={16} />
            <span>AI Insights</span>
          </div>
          
          <div className="insights-content">
            <div className="extracted-info">
              <h4>Extracted information</h4>
              <div className="info-items">
                <div className="info-item">
                  <span className="info-label">Room:</span>
                  <span className="info-value">{aiInsights.extractedInfo.room}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Ceiling:</span>
                  <span className="info-value">{aiInsights.extractedInfo.ceiling}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Length:</span>
                  <span className="info-value">{aiInsights.extractedInfo.length}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Door:</span>
                  <span className="info-value">{aiInsights.extractedInfo.door}</span>
                </div>
              </div>
            </div>

            <div className="missing-dimensions">
              <div className="missing-header">
                <CheckCircle size={16} />
                <span>Missing dimension</span>
              </div>
              <div className="missing-item">
                {aiInsights.missingDimensions[0]}
                <button className="expand-btn">→</button>
              </div>
            </div>

            <div className="potential-markups">
              <h4>Potential markups</h4>
              <div className="markup-suggestions">
                {aiInsights.potentialMarkups.map((markup, index) => (
                  <div key={index} className={`markup-suggestion ${markup.color}`}>
                    <div className="markup-line"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;