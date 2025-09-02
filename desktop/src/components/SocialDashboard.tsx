import React, { useState, useEffect } from 'react';
import { collaborationService } from '../services/collaboration';
import './SocialDashboard.css';

interface ActivityItem {
  id: string;
  type: 'message' | 'task' | 'rfi' | 'meeting' | 'comment' | 'share';
  projectId: string;
  projectName: string;
  sheetName?: string;
  title: string;
  description: string;
  authorName: string;
  authorAvatar?: string;
  timestamp: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'in-progress' | 'resolved' | 'closed';
  participants?: string[];
  attachments?: number;
  region?: [number, number, number, number];
}

interface MeetingInvite {
  id: string;
  title: string;
  projectName: string;
  scheduledTime: string;
  organizer: string;
  attendees: string[];
  agenda?: string;
  meetingUrl?: string;
  status: 'pending' | 'accepted' | 'declined';
}

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

  // Mock data generation - replace with real API calls
  useEffect(() => {
    loadRecentActivity();
    loadMeetingInvites();
  }, [currentUserId]);

  const loadRecentActivity = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with real API call
      const mockActivities: ActivityItem[] = [
        {
          id: 'act-1',
          type: 'message',
          projectId: 'proj-1',
          projectName: 'Downtown Office Complex',
          sheetName: 'Floor Plan - Level 1',
          title: 'Electrical outlet placement question',
          description: '@john.smith Can you verify the outlet locations on the east wall? The specs seem inconsistent.',
          authorName: 'Sarah Johnson',
          authorAvatar: '👩‍💼',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          priority: 'medium',
          status: 'open',
          participants: ['john.smith', 'sarah.johnson'],
          attachments: 1
        },
        {
          id: 'act-2',
          type: 'task',
          projectId: 'proj-1',
          projectName: 'Downtown Office Complex',
          sheetName: 'HVAC Plan',
          title: 'Review ductwork routing',
          description: 'Task assigned: Review the proposed ductwork routing and provide feedback by EOD.',
          authorName: 'Mike Chen',
          authorAvatar: '👨‍🔧',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          status: 'in-progress',
          participants: [currentUserId, 'mike.chen']
        },
        {
          id: 'act-3',
          type: 'rfi',
          projectId: 'proj-2',
          projectName: 'Residential Development',
          sheetName: 'Site Plan',
          title: 'Storm drain clarification needed',
          description: 'RFI created: Clarification needed on storm drain tie-in points. Drawing shows conflicting information.',
          authorName: 'Lisa Williams',
          authorAvatar: '👩‍🏗️',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          priority: 'critical',
          status: 'open',
          participants: ['lisa.williams', 'city.inspector']
        },
        {
          id: 'act-4',
          type: 'meeting',
          projectId: 'proj-1',
          projectName: 'Downtown Office Complex',
          title: 'Weekly coordination meeting',
          description: 'Meeting completed: Discussed MEP coordination and upcoming milestones. Action items assigned.',
          authorName: 'Project Manager',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          participants: ['john.smith', 'sarah.johnson', 'mike.chen', currentUserId]
        },
        {
          id: 'act-5',
          type: 'comment',
          projectId: 'proj-2',
          projectName: 'Residential Development',
          sheetName: 'Electrical Plan',
          title: 'Load calculation review complete',
          description: 'Reviewed the electrical load calculations. Everything looks good, approved for permit submission.',
          authorName: 'David Rodriguez',
          authorAvatar: '⚡',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'resolved'
        }
      ];

      setActivities(mockActivities);
    } catch (error) {
      console.error('Failed to load activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMeetingInvites = async () => {
    try {
      // TODO: Replace with real API call
      const mockInvites: MeetingInvite[] = [
        {
          id: 'meeting-1',
          title: 'MEP Coordination Review',
          projectName: 'Downtown Office Complex',
          scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          organizer: 'Sarah Johnson',
          attendees: ['john.smith', 'mike.chen', currentUserId],
          agenda: 'Review electrical and plumbing conflicts on levels 3-5',
          meetingUrl: 'teambeam://meeting/abc123',
          status: 'pending'
        },
        {
          id: 'meeting-2',
          title: 'Client Design Review',
          projectName: 'Residential Development',
          scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          organizer: 'Lisa Williams',
          attendees: ['client.rep', 'architect', currentUserId],
          agenda: 'Present updated site plan and address client feedback',
          meetingUrl: 'teambeam://meeting/def456',
          status: 'pending'
        }
      ];

      setMeetingInvites(mockInvites);
    } catch (error) {
      console.error('Failed to load meeting invites:', error);
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (selectedFilter === 'mentions' && !activity.description.includes(`@${currentUserId}`)) {
      return false;
    }
    if (selectedFilter === 'tasks' && activity.type !== 'task') {
      return false;
    }
    if (selectedFilter === 'meetings' && activity.type !== 'meeting') {
      return false;
    }
    if (searchQuery && !activity.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !activity.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
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

  const handleMeetingResponse = async (meetingId: string, response: 'accept' | 'decline') => {
    setMeetingInvites(prev => 
      prev.map(invite => 
        invite.id === meetingId 
          ? { ...invite, status: response === 'accept' ? 'accepted' : 'declined' }
          : invite
      )
    );
    
    if (response === 'accept') {
      const meeting = meetingInvites.find(m => m.id === meetingId);
      if (meeting?.meetingUrl) {
        onJoinMeeting?.(meeting.meetingUrl);
      }
    }
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
                        onClick={() => handleMeetingResponse(invite.id, 'accept')}
                      >
                        ✅ Accept
                      </button>
                      <button 
                        className="decline-btn"
                        onClick={() => handleMeetingResponse(invite.id, 'decline')}
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
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(activity.priority) }}
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