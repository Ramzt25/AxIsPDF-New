import React, { useState, useEffect } from 'react';
import './GuestPortal.css';

interface GuestPortalProps {
  projectId?: string;
  onUpgrade?: () => void;
  onClose?: () => void;
}

interface ProjectSample {
  id: string;
  name: string;
  type: string;
  preview: string;
  description: string;
  features: string[];
  stats: {
    sheets: number;
    markups: number;
    participants: number;
    lastActivity: string;
  };
}

export const GuestPortal: React.FC<GuestPortalProps> = ({
  projectId,
  onUpgrade,
  onClose
}) => {
  const [selectedProject, setSelectedProject] = useState<ProjectSample | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'demo' | 'features'>('overview');

  const sampleProjects: ProjectSample[] = [
    {
      id: 'commercial-office',
      name: 'Downtown Office Complex',
      type: 'Commercial Building',
      preview: '🏢',
      description: 'A 12-story office building with mixed-use retail on ground floor. Featuring advanced MEP coordination and sustainable design elements.',
      features: ['Architectural Plans', 'MEP Coordination', 'RFI Management', 'Progress Tracking'],
      stats: {
        sheets: 127,
        markups: 342,
        participants: 8,
        lastActivity: '2 hours ago'
      }
    },
    {
      id: 'residential-dev',
      name: 'Residential Development',
      type: 'Multi-Family Housing',
      preview: '🏘️',
      description: 'A 64-unit residential development with community amenities. Focus on efficient unit layouts and sustainable construction methods.',
      features: ['Site Plans', 'Unit Layouts', 'Landscaping', 'Utility Coordination'],
      stats: {
        sheets: 89,
        markups: 156,
        participants: 6,
        lastActivity: '5 hours ago'
      }
    },
    {
      id: 'healthcare-facility',
      name: 'Medical Center Renovation',
      type: 'Healthcare Facility',
      preview: '🏥',
      description: 'Renovation of existing medical center with new surgical suites and updated HVAC systems for improved air quality.',
      features: ['Renovation Plans', 'HVAC Design', 'Medical Equipment', 'Code Compliance'],
      stats: {
        sheets: 203,
        markups: 567,
        participants: 12,
        lastActivity: '1 hour ago'
      }
    }
  ];

  useEffect(() => {
    if (projectId) {
      const project = sampleProjects.find(p => p.id === projectId);
      setSelectedProject(project || null);
      setViewMode('demo');
    }
  }, [projectId]);

  const handleProjectSelect = (project: ProjectSample) => {
    setSelectedProject(project);
    setViewMode('demo');
  };

  const handleFeatureClick = (feature: string) => {
    // Show upgrade prompt for protected features
    setShowUpgradeModal(true);
  };

  const renderOverview = () => (
    <div className="guest-overview">
      <div className="guest-hero">
        <div className="hero-content">
          <h1>
            <span className="hero-icon">🚀</span>
            Experience Construction Intelligence
          </h1>
          <p className="hero-subtitle">
            Explore how AxIs transforms construction document management with 
            real-time collaboration, precise markup tools, and intelligent workflows.
          </p>
        </div>
        
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">50M+</div>
            <div className="stat-label">Documents Processed</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Uptime</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">2.5x</div>
            <div className="stat-label">Faster Reviews</div>
          </div>
        </div>
      </div>

      <div className="sample-projects">
        <h2>Explore Sample Projects</h2>
        <p className="section-subtitle">
          Get hands-on experience with real construction projects and see how teams collaborate.
        </p>
        
        <div className="projects-grid">
          {sampleProjects.map(project => (
            <div 
              key={project.id} 
              className="project-card"
              onClick={() => handleProjectSelect(project)}
            >
              <div className="project-preview">
                <span className="project-icon">{project.preview}</span>
                <div className="project-type">{project.type}</div>
              </div>
              
              <div className="project-content">
                <h3>{project.name}</h3>
                <p>{project.description}</p>
                
                <div className="project-features">
                  {project.features.slice(0, 2).map(feature => (
                    <span key={feature} className="feature-tag">{feature}</span>
                  ))}
                  {project.features.length > 2 && (
                    <span className="feature-tag more">+{project.features.length - 2} more</span>
                  )}
                </div>
                
                <div className="project-stats">
                  <span className="stat">📄 {project.stats.sheets} sheets</span>
                  <span className="stat">💬 {project.stats.markups} markups</span>
                  <span className="stat">👥 {project.stats.participants} people</span>
                </div>
              </div>
              
              <button className="explore-btn">
                Explore Project →
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="features-showcase">
        <h2>Why Teams Choose AxIs</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Professional Markup</h3>
            <p>Industry-standard markup tools with custom stamps, measurements, and annotation libraries.</p>
            <ul>
              <li>Vector-precise drawing tools</li>
              <li>Custom tool sets and stamps</li>
              <li>Measurement and takeoff tools</li>
              <li>Status-based workflows</li>
            </ul>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Real-time Collaboration</h3>
            <p>Work together seamlessly with live cursors, instant updates, and comprehensive activity tracking.</p>
            <ul>
              <li>Live collaborative sessions</li>
              <li>Activity feeds and notifications</li>
              <li>Role-based permissions</li>
              <li>Meeting integration</li>
            </ul>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Version Management</h3>
            <p>Advanced document comparison, slip-sheeting, and markup preservation across revisions.</p>
            <ul>
              <li>Intelligent document comparison</li>
              <li>Automatic markup migration</li>
              <li>Change tracking and reporting</li>
              <li>Revision history</li>
            </ul>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Project Intelligence</h3>
            <p>AI-powered insights, automated RFI generation, and comprehensive reporting tools.</p>
            <ul>
              <li>AI-assisted workflows</li>
              <li>Automated reporting</li>
              <li>Progress analytics</li>
              <li>Integration ecosystem</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your Workflow?</h2>
          <p>Join thousands of construction professionals who trust AxIs for their critical projects.</p>
          
          <div className="cta-actions">
            <button className="cta-btn primary" onClick={onUpgrade}>
              Start Free Trial
            </button>
            <button className="cta-btn secondary" onClick={() => setViewMode('features')}>
              View All Features
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDemo = () => {
    if (!selectedProject) return null;

    return (
      <div className="project-demo">
        <div className="demo-header">
          <button className="back-btn" onClick={() => setViewMode('overview')}>
            ← Back to Projects
          </button>
          
          <div className="project-info">
            <div className="project-title">
              <span className="project-icon">{selectedProject.preview}</span>
              <div>
                <h1>{selectedProject.name}</h1>
                <p className="project-type">{selectedProject.type}</p>
              </div>
            </div>
            
            <div className="project-actions">
              <button className="demo-action-btn" onClick={() => setShowUpgradeModal(true)}>
                📝 Add Markup
              </button>
              <button className="demo-action-btn" onClick={() => setShowUpgradeModal(true)}>
                📏 Measure
              </button>
              <button className="demo-action-btn upgrade" onClick={() => setShowUpgradeModal(true)}>
                🚀 Upgrade for Full Access
              </button>
            </div>
          </div>
        </div>

        <div className="demo-content">
          <div className="demo-viewer">
            <div className="viewer-placeholder">
              <div className="placeholder-content">
                <div className="placeholder-icon">📋</div>
                <h3>Interactive PDF Viewer</h3>
                <p>In the full version, you'd see:</p>
                <ul>
                  <li>High-fidelity PDF rendering</li>
                  <li>Real-time collaborative cursors</li>
                  <li>Interactive markup tools</li>
                  <li>Precision measurement tools</li>
                  <li>Comments and annotations</li>
                </ul>
                
                <button 
                  className="upgrade-viewer-btn"
                  onClick={() => setShowUpgradeModal(true)}
                >
                  Upgrade to View Documents
                </button>
              </div>
            </div>
          </div>

          <div className="demo-sidebar">
            <div className="demo-activity">
              <h3>🔄 Recent Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-avatar">👩‍💼</div>
                  <div className="activity-text">
                    <strong>Sarah Johnson</strong> added markup on Sheet A1.1
                    <span className="activity-time">2 hours ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-avatar">👨‍🔧</div>
                  <div className="activity-text">
                    <strong>Mike Chen</strong> completed task review
                    <span className="activity-time">4 hours ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-avatar">👩‍🏗️</div>
                  <div className="activity-text">
                    <strong>Lisa Williams</strong> created new RFI
                    <span className="activity-time">6 hours ago</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="demo-stats">
              <h3>📊 Project Stats</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{selectedProject.stats.sheets}</div>
                  <div className="stat-label">Total Sheets</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{selectedProject.stats.markups}</div>
                  <div className="stat-label">Active Markups</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{selectedProject.stats.participants}</div>
                  <div className="stat-label">Team Members</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">94%</div>
                  <div className="stat-label">Complete</div>
                </div>
              </div>
            </div>

            <div className="demo-tools">
              <h3>🔧 Available Tools</h3>
              <div className="tools-list">
                {['Rectangle', 'Circle', 'Arrow', 'Text', 'Measure', 'Area'].map(tool => (
                  <button 
                    key={tool}
                    className="tool-btn locked"
                    onClick={() => handleFeatureClick(tool)}
                  >
                    🔒 {tool}
                  </button>
                ))}
              </div>
              <p className="tools-note">
                🔒 Markup tools require an AxIs subscription
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUpgradeModal = () => {
    if (!showUpgradeModal) return null;

    return (
      <div className="upgrade-modal-overlay" onClick={() => setShowUpgradeModal(false)}>
        <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setShowUpgradeModal(false)}>×</button>
          
          <div className="upgrade-content">
            <div className="upgrade-icon">🚀</div>
            <h2>Unlock Full AxIs Experience</h2>
            <p>Get access to all professional markup tools, collaboration features, and construction intelligence capabilities.</p>
            
            <div className="pricing-cards">
              <div className="pricing-card popular">
                <div className="plan-badge">Most Popular</div>
                <h3>Professional</h3>
                <div className="plan-price">
                  <span className="price">$29</span>
                  <span className="period">/month</span>
                </div>
                <ul className="plan-features">
                  <li>✅ Unlimited markups and annotations</li>
                  <li>✅ Real-time collaboration</li>
                  <li>✅ Advanced measurement tools</li>
                  <li>✅ Version comparison</li>
                  <li>✅ RFI and task management</li>
                  <li>✅ Microsoft Teams integration</li>
                </ul>
                <button className="plan-btn primary" onClick={onUpgrade}>
                  Start Free Trial
                </button>
              </div>
              
              <div className="pricing-card">
                <h3>Team</h3>
                <div className="plan-price">
                  <span className="price">$79</span>
                  <span className="period">/month</span>
                </div>
                <ul className="plan-features">
                  <li>✅ Everything in Professional</li>
                  <li>✅ Advanced reporting</li>
                  <li>✅ Custom tool sets</li>
                  <li>✅ API access</li>
                  <li>✅ Priority support</li>
                  <li>✅ Single Sign-On (SSO)</li>
                </ul>
                <button className="plan-btn secondary" onClick={onUpgrade}>
                  Contact Sales
                </button>
              </div>
            </div>
            
            <div className="upgrade-footer">
              <p>🎯 <strong>14-day free trial</strong> • No credit card required • Cancel anytime</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="guest-portal">
      <div className="guest-header">
        <div className="header-brand">
          <span className="brand-icon">📐</span>
          <span className="brand-name">AxIs</span>
          <span className="guest-badge">Guest Mode</span>
        </div>
        
        <div className="header-actions">
          <button className="header-btn" onClick={() => setViewMode('features')}>
            Features
          </button>
          <button className="header-btn" onClick={() => setViewMode('overview')}>
            Projects
          </button>
          <button className="header-btn upgrade" onClick={() => setShowUpgradeModal(true)}>
            Upgrade
          </button>
          {onClose && (
            <button className="header-btn close" onClick={onClose}>×</button>
          )}
        </div>
      </div>

      <div className="guest-content">
        {viewMode === 'overview' && renderOverview()}
        {viewMode === 'demo' && renderDemo()}
        {viewMode === 'features' && renderOverview()} {/* For now, redirect to overview */}
      </div>

      {renderUpgradeModal()}
    </div>
  );
};

export default GuestPortal;