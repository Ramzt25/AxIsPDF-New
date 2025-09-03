import React, { useState, useEffect } from 'react';
import { dashboardDataService, type ActivityItem, type MeetingInvite, type DashboardData } from '../services/dashboardData';
import './SocialDashboard.css';

interface SocialDashboardProps {
  currentUserId: string;
  currentUserName: string;
  onOpenProject?: (projectId: string) => void;
  onJoinMeeting?: (meetingUrl: string) => void;
  onViewThread?: (threadId: string) => void;
}

export const SocialDashboard: React.FC<SocialDashboardProps> = ({
  currentUserId,
  currentUserName,
  onOpenProject,
  onJoinMeeting,
  onViewThread
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [meetingInvites, setMeetingInvites] = useState<MeetingInvite[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'mentions' | 'tasks' | 'meetings'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize dashboard data service and subscribe to updates
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeData = async () => {
      setIsLoading(true);
      try {
        // Initialize the data service
        await dashboardDataService.initialize(currentUserId);
        
        // Subscribe to data updates
        unsubscribe = dashboardDataService.subscribe((data: DashboardData) => {
          setActivities(data.activities);
          setMeetingInvites(data.meetingInvites);
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Failed to initialize dashboard data:', error);
        setIsLoading(false);
      }
    };

    initializeData();

    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUserId]);

  // Get filtered activities using the data service
  const filteredActivities = searchQuery 
    ? dashboardDataService.searchActivities(searchQuery)
    : dashboardDataService.filterActivities(selectedFilter, currentUserId);

  const handleActivityClick = (activity: ActivityItem) => {
    // Mark activity as handled
    dashboardDataService.markActivityHandled(activity.id);
    
    // Navigate based on activity type
    if (activity.type === 'meeting' && onJoinMeeting) {
      onJoinMeeting(activity.projectId);
    } else if (onViewThread) {
      onViewThread(activity.id);
    }
  };

  const handleMeetingResponse = (inviteId: string, response: 'accepted' | 'declined') => {
    dashboardDataService.respondToMeetingInvite(inviteId, response);
    
    if (response === 'accepted') {
      const invite = meetingInvites.find(i => i.id === inviteId);
      if (invite?.meetingUrl && onJoinMeeting) {
        onJoinMeeting(invite.meetingUrl);
      }
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message': return '💬';
      case 'task': return '✅';
      case 'rfi': return '❓';
      case 'meeting': return '🎥';
      case 'comment': return '💭';
      case 'share': return '📤';
      default: return '📋';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  };

  const scheduleNewMeeting = () => {
    // TODO: Open meeting scheduler modal
    console.log('Opening meeting scheduler...');
  };

  return (
    <div className="social-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>
            <span className="greeting">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}</span>
            <span className="user-name">{currentUserName}</span>
          </h1>
          <p className="header-subtitle">AxIs Construction Intelligence - Here's what's happening on your projects</p>
        </div>
        
        <div className="header-actions">
          <button className="action-btn primary" onClick={scheduleNewMeeting}>
            📅 Schedule Meeting
          </button>
          <button className="action-btn secondary">
            🚀 Start Quick Review
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Mock Design Showcase */}
        <div className="mock-showcase-section">
          <h2>🎨 Design Prototypes & Mockups</h2>
          <div className="mock-gallery">
            <div className="mock-item">
              <img src="./assets/SocialMainHub.png" alt="Social Main Hub Design" className="mock-image" />
              <div className="mock-info">
                <h3>Social Main Hub</h3>
                <p>Central collaboration interface with real-time updates</p>
              </div>
            </div>
            <div className="mock-item">
              <img src="./assets/Mockup main screen.png" alt="Main Screen Mockup" className="mock-image" />
              <div className="mock-info">
                <h3>Main Screen Layout</h3>
                <p>Professional PDF viewer with enhanced controls</p>
              </div>
            </div>
            <div className="mock-item">
              <img src="./assets/Modal base.png" alt="Modal Base Design" className="mock-image" />
              <div className="mock-info">
                <h3>Modal Components</h3>
                <p>Flexible modal system for various interactions</p>
              </div>
            </div>
            <div className="mock-item">
              <img src="./assets/toolbox.png" alt="Toolbox Interface" className="mock-image" />
              <div className="mock-info">
                <h3>Advanced Toolbox</h3>
                <p>Professional tools for markup and annotation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Meeting Invites Section */}
        {meetingInvites.length > 0 && (
          <div className="meeting-invites-section">
            <h2>📅 Upcoming Meetings</h2>
            <div className="meeting-invites">
              {meetingInvites.map(invite => (
                <div key={invite.id} className={`meeting-invite ${invite.status}`}>
                  <div className="meeting-info">
                    <h3>{invite.title}</h3>
                    <p className="meeting-project">{invite.projectName}</p>
                    <div className="meeting-details">
                      <span className="meeting-time">
                        🕒 {new Date(invite.scheduledTime).toLocaleString()}
                      </span>
                      <span className="meeting-organizer">
                        👤 {invite.organizer}
                      </span>
                      <span className="meeting-attendees">
                        👥 {invite.attendees.length} attendees
                      </span>
                    </div>
                    {invite.agenda && (
                      <p className="meeting-agenda">{invite.agenda}</p>
                    )}
                  </div>
                  
                  {invite.status === 'pending' && (
                    <div className="meeting-actions">
                      <button 
                        className="accept-btn"
                        onClick={() => handleMeetingResponse(invite.id, 'accepted')}
                      >
                        ✅ Accept
                      </button>
                      <button 
                        className="decline-btn"
                        onClick={() => handleMeetingResponse(invite.id, 'declined')}
                      >
                        ❌ Decline
                      </button>
                    </div>
                  )}
                  
                  {invite.status === 'accepted' && (
                    <button 
                      className="join-btn"
                      onClick={() => invite.meetingUrl && onJoinMeeting?.(invite.meetingUrl)}
                    >
                      🎥 Join Meeting
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Feed Section */}
        <div className="activity-section">
          <div className="activity-header">
            <h2>🔄 Recent Activity</h2>
            
            <div className="activity-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search activity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
              
              <div className="filter-tabs">
                <button 
                  className={`filter-tab ${selectedFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`filter-tab ${selectedFilter === 'mentions' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('mentions')}
                >
                  @Mentions
                </button>
                <button 
                  className={`filter-tab ${selectedFilter === 'tasks' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('tasks')}
                >
                  Tasks
                </button>
                <button 
                  className={`filter-tab ${selectedFilter === 'meetings' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('meetings')}
                >
                  Meetings
                </button>
              </div>
            </div>
          </div>

          <div className="activity-feed">
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading activity...</p>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No activity found</h3>
                <p>Try adjusting your filters or check back later</p>
              </div>
            ) : (
              filteredActivities.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-avatar">
                    {activity.authorAvatar || '👤'}
                  </div>
                  
                  <div className="activity-content">
                    <div className="activity-header">
                      <div className="activity-meta">
                        <span className="activity-icon">{getActivityIcon(activity.type)}</span>
                        <span className="activity-author">{activity.authorName}</span>
                        <span className="activity-project">{activity.projectName}</span>
                        {activity.sheetName && (
                          <span className="activity-sheet">• {activity.sheetName}</span>
                        )}
                        <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
                      </div>
                      
                      <div className="activity-status">
                        {activity.priority && (
                          <span 
                            className={`priority-badge priority-${activity.priority}`}
                          >
                            {activity.priority}
                          </span>
                        )}
                        {activity.status && (
                          <span className={`status-badge ${activity.status}`}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="activity-title">{activity.title}</h3>
                    <p className="activity-description">{activity.description}</p>
                    
                    <div className="activity-footer">
                      <div className="activity-stats">
                        {activity.participants && (
                          <span className="stat">
                            👥 {activity.participants.length} participants
                          </span>
                        )}
                        {activity.attachments && (
                          <span className="stat">
                            📎 {activity.attachments} attachment{activity.attachments > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      
                      <div className="activity-actions">
                        <button 
                          className="action-link"
                          onClick={() => onViewThread?.(activity.id)}
                        >
                          View Details
                        </button>
                        <button 
                          className="action-link"
                          onClick={() => onOpenProject?.(activity.projectId)}
                        >
                          Open Project
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>12</h3>
              <p>Active Tasks</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">❓</div>
            <div className="stat-content">
              <h3>3</h3>
              <p>Open RFIs</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎥</div>
            <div className="stat-content">
              <h3>2</h3>
              <p>Meetings Today</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>8</h3>
              <p>Team Members</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialDashboard;