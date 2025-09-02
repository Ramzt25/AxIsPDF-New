import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  currentProject: string | null;
  recentProjects: string[];
  onOpenProject: (path: string) => void;
  onNewProject?: () => void;
  onImportPdfs?: () => void;
}

interface ProjectStats {
  totalDocuments: number;
  totalPages: number;
  lastActivity: Date | null;
  pipelineRuns: number;
}

interface RecentActivity {
  id: string;
  type: 'pipeline' | 'document' | 'annotation' | 'export';
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
}

const Dashboard: React.FC<DashboardProps> = ({ 
  currentProject, 
  recentProjects, 
  onOpenProject,
  onNewProject,
  onImportPdfs 
}) => {
  const navigate = useNavigate();
  const [projectStats, setProjectStats] = useState<ProjectStats>({
    totalDocuments: 0,
    totalPages: 0,
    lastActivity: null,
    pipelineRuns: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentProject) {
      loadProjectStats();
      loadRecentActivity();
    }
  }, [currentProject]);

  const loadProjectStats = async () => {
    setIsLoading(true);
    try {
      // Load project statistics from storage
      if (window.teamBeam?.store) {
        const stats = await window.teamBeam.store.get(`project-stats-${currentProject}`);
        if (stats) {
          setProjectStats({
            ...stats,
            lastActivity: stats.lastActivity ? new Date(stats.lastActivity) : null
          });
        }
      }
    } catch (error) {
      console.error('Failed to load project stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      // Load recent activity from storage
      if (window.teamBeam?.store) {
        const activity = await window.teamBeam.store.get(`recent-activity-${currentProject}`);
        if (activity && Array.isArray(activity)) {
          setRecentActivity(activity.map(item => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })).slice(0, 10)); // Show last 10 activities
        }
      }
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    }
  };

  const quickActions = [
    {
      title: 'Pipeline Editor',
      description: 'Create and edit processing pipelines',
      icon: '⚙️',
      action: () => navigate('/pipeline-editor'),
      color: 'primary'
    },
    {
      title: 'Batch Processor',
      description: 'Process multiple documents at once',
      icon: '📦',
      action: () => navigate('/batch-processor'),
      color: 'secondary'
    },
    {
      title: 'Import PDFs',
      description: 'Add new documents to project',
      icon: '📄',
      action: onImportPdfs,
      color: 'accent'
    },
    {
      title: 'FieldBeam Meetings',
      description: 'Start video collaboration session',
      icon: '🎥',
      action: () => navigate('/fieldbeam-meetings'),
      color: 'warning'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'pipeline': return '⚙️';
      case 'document': return '📄';
      case 'annotation': return '✏️';
      case 'export': return '📤';
      default: return '📋';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>TeamBeam Dashboard</h1>
        <p className="dashboard-subtitle">Construction Document Intelligence Platform</p>
      </div>

      {currentProject ? (
        <div className="dashboard-content">
          {/* Project Overview */}
          <div className="dashboard-section project-overview">
            <h2>Current Project</h2>
            <div className="project-card">
              <div className="project-info">
                <h3 title={currentProject}>
                  📁 {currentProject.split('/').pop() || 'Untitled Project'}
                </h3>
                <p className="project-path">{currentProject}</p>
              </div>
              
              {isLoading ? (
                <div className="project-stats loading">
                  <div className="loading-spinner">Loading...</div>
                </div>
              ) : (
                <div className="project-stats">
                  <div className="stat-item">
                    <span className="stat-value">{projectStats.totalDocuments}</span>
                    <span className="stat-label">Documents</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{projectStats.totalPages}</span>
                    <span className="stat-label">Pages</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{projectStats.pipelineRuns}</span>
                    <span className="stat-label">Pipeline Runs</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">
                      {projectStats.lastActivity ? formatTimeAgo(projectStats.lastActivity) : 'Never'}
                    </span>
                    <span className="stat-label">Last Activity</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-section quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-grid">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className={`action-card ${action.color}`}
                  onClick={action.action}
                  disabled={!action.action}
                >
                  <div className="action-icon">{action.icon}</div>
                  <div className="action-content">
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="dashboard-section recent-activity">
            <h2>Recent Activity</h2>
            {recentActivity.length > 0 ? (
              <div className="activity-list">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">{getActivityIcon(activity.type)}</div>
                    <div className="activity-content">
                      <p className="activity-description">{activity.description}</p>
                      <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                    <div className={`activity-status ${getStatusColor(activity.status)}`}>
                      {activity.status === 'success' && '✓'}
                      {activity.status === 'warning' && '⚠'}
                      {activity.status === 'error' && '✗'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No recent activity</p>
                <span className="empty-subtitle">Activity will appear here as you work with your project</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="dashboard-content no-project">
          <div className="welcome-section">
            <div className="welcome-icon">🏗️</div>
            <h2>Welcome to TeamBeam!</h2>
            <p>Your intelligent construction document processing platform</p>
            
            <div className="welcome-actions">
              <button className="btn-primary" onClick={onNewProject}>
                <span className="btn-icon">+</span>
                Create New Project
              </button>
              <button className="btn-secondary" onClick={() => onOpenProject('')}>
                <span className="btn-icon">📂</span>
                Open Existing Project
              </button>
            </div>
          </div>

          <div className="getting-started">
            <h3>Getting Started</h3>
            <div className="feature-highlights">
              <div className="feature-item">
                <div className="feature-icon">📄</div>
                <h4>PDF Processing</h4>
                <p>Advanced text extraction and OCR capabilities</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚙️</div>
                <h4>Pipeline Automation</h4>
                <p>Create custom workflows for document processing</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🎥</div>
                <h4>Video Collaboration</h4>
                <p>Real-time meetings with document sharing</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <h4>Analytics & Reports</h4>
                <p>Track progress and generate insights</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Projects Sidebar */}
      {recentProjects.length > 0 && (
        <div className="dashboard-sidebar">
          <h3>Recent Projects</h3>
          <div className="recent-projects-list">
            {recentProjects.slice(0, 5).map((project, index) => (
              <button
                key={index}
                className="recent-project-item"
                onClick={() => onOpenProject(project)}
                title={project}
              >
                <div className="project-icon">📁</div>
                <span className="project-name">
                  {project.split('/').pop() || 'Untitled'}
                </span>
              </button>
            ))}
            {recentProjects.length > 5 && (
              <div className="more-projects">
                +{recentProjects.length - 5} more projects
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;