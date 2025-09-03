import React, { useState, useEffect } from 'react';

interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  participants: Participant[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: 'review' | 'coordination' | 'planning' | 'daily-standup';
  projectId?: string;
  documentId?: string;
  location?: string;
  meetingLink?: string;
  agenda?: AgendaItem[];
  notes?: string;
  recordings?: Recording[];
}

interface Participant {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  status: 'invited' | 'accepted' | 'declined' | 'tentative';
}

interface AgendaItem {
  id: string;
  title: string;
  duration: number;
  presenter?: string;
  type: 'discussion' | 'presentation' | 'decision' | 'review';
}

interface Recording {
  id: string;
  title: string;
  duration: number;
  url: string;
  timestamp: string;
}

interface MeetingPageProps {
  currentFile: File | null;
  className?: string;
}

export const MeetingPage: React.FC<MeetingPageProps> = ({
  currentFile,
  className = ''
}) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeView, setActiveView] = useState<'calendar' | 'list' | 'create'>('calendar');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock meeting data
  useEffect(() => {
    const mockMeetings: Meeting[] = [
      {
        id: '1',
        title: 'Weekly Project Review',
        description: 'Review progress on current project milestones and discuss upcoming deliverables',
        date: '2025-09-05',
        time: '10:00',
        duration: 60,
        status: 'scheduled',
        type: 'review',
        location: 'Conference Room A',
        meetingLink: 'https://meet.example.com/weekly-review',
        participants: [
          { id: '1', name: 'John Smith', email: 'john@company.com', role: 'Project Manager', status: 'accepted' },
          { id: '2', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'Architect', status: 'accepted' },
          { id: '3', name: 'Mike Chen', email: 'mike@company.com', role: 'Engineer', status: 'tentative' },
        ],
        agenda: [
          { id: '1', title: 'Project Status Update', duration: 15, presenter: 'John Smith', type: 'presentation' },
          { id: '2', title: 'Design Review Discussion', duration: 30, presenter: 'Sarah Johnson', type: 'review' },
          { id: '3', title: 'Next Steps Planning', duration: 15, type: 'discussion' },
        ]
      },
      {
        id: '2',
        title: 'Document Review Session',
        description: 'Review and approve construction drawings for Phase 2',
        date: '2025-09-06',
        time: '14:00',
        duration: 90,
        status: 'scheduled',
        type: 'review',
        documentId: currentFile?.name || 'construction-plans.pdf',
        participants: [
          { id: '1', name: 'John Smith', email: 'john@company.com', role: 'Project Manager', status: 'accepted' },
          { id: '4', name: 'Lisa Wang', email: 'lisa@company.com', role: 'Quality Control', status: 'accepted' },
        ],
        agenda: [
          { id: '1', title: 'Document Overview', duration: 20, type: 'presentation' },
          { id: '2', title: 'Page-by-page Review', duration: 60, type: 'review' },
          { id: '3', title: 'Issues & Action Items', duration: 10, type: 'discussion' },
        ]
      },
      {
        id: '3',
        title: 'Daily Standup',
        description: 'Quick daily sync on progress and blockers',
        date: '2025-09-04',
        time: '09:00',
        duration: 15,
        status: 'completed',
        type: 'daily-standup',
        meetingLink: 'https://meet.example.com/daily-standup',
        participants: [
          { id: '1', name: 'John Smith', email: 'john@company.com', role: 'Project Manager', status: 'accepted' },
          { id: '2', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'Architect', status: 'accepted' },
          { id: '3', name: 'Mike Chen', email: 'mike@company.com', role: 'Engineer', status: 'accepted' },
        ],
        notes: 'Discussed foundation progress, identified material delivery delay',
        recordings: [
          { id: '1', title: 'Daily Standup Recording', duration: 12, url: '#', timestamp: '2025-09-04T09:00:00Z' }
        ]
      }
    ];
    setMeetings(mockMeetings);
  }, [currentFile]);

  const formatDate = (dateStr: string, timeStr: string) => {
    const date = new Date(`${dateStr}T${timeStr}`);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-400';
      case 'in-progress': return 'text-green-400';
      case 'completed': return 'text-gray-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review': return '🔍';
      case 'coordination': return '🤝';
      case 'planning': return '📋';
      case 'daily-standup': return '☕';
      default: return '📅';
    }
  };

  const upcomingMeetings = meetings.filter(m => {
    const meetingDate = new Date(`${m.date}T${m.time}`);
    return meetingDate > new Date() && m.status === 'scheduled';
  }).sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

  const recentMeetings = meetings.filter(m => m.status === 'completed')
    .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime())
    .slice(0, 5);

  return (
    <div className={`meeting-page ${className}`}>
      <div className="meeting-page-header">
        <div className="page-title">
          <h2>📅 Meetings & Collaboration</h2>
          <p>Schedule reviews, coordinate projects, and track meeting outcomes</p>
        </div>
        <div className="meeting-controls">
          <div className="view-tabs">
            <button 
              className={`view-tab ${activeView === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveView('calendar')}
            >
              📅 Calendar
            </button>
            <button 
              className={`view-tab ${activeView === 'list' ? 'active' : ''}`}
              onClick={() => setActiveView('list')}
            >
              📋 List
            </button>
          </div>
          <button className="create-meeting-btn" onClick={() => setShowCreateModal(true)}>
            ➕ Schedule Meeting
          </button>
        </div>
      </div>

      <div className="meeting-page-content">
        {activeView === 'calendar' && (
          <div className="calendar-view">
            <div className="calendar-grid">
              <div className="upcoming-section">
                <h3>🔜 Upcoming Meetings</h3>
                <div className="meeting-cards">
                  {upcomingMeetings.map(meeting => (
                    <div key={meeting.id} className="meeting-card upcoming">
                      <div className="meeting-card-header">
                        <span className="meeting-type">{getTypeIcon(meeting.type)}</span>
                        <h4>{meeting.title}</h4>
                        <span className={`meeting-status ${getStatusColor(meeting.status)}`}>
                          {meeting.status}
                        </span>
                      </div>
                      <p className="meeting-time">{formatDate(meeting.date, meeting.time)}</p>
                      <p className="meeting-description">{meeting.description}</p>
                      <div className="meeting-participants">
                        {meeting.participants.slice(0, 3).map(participant => (
                          <div key={participant.id} className="participant-avatar" title={participant.name}>
                            {participant.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        ))}
                        {meeting.participants.length > 3 && (
                          <div className="participant-overflow">+{meeting.participants.length - 3}</div>
                        )}
                      </div>
                      <div className="meeting-actions">
                        <button 
                          className="meeting-action-btn"
                          onClick={() => setSelectedMeeting(meeting)}
                        >
                          View Details
                        </button>
                        {meeting.meetingLink && (
                          <button className="meeting-action-btn primary">Join Meeting</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="recent-section">
                <h3>📈 Recent Meetings</h3>
                <div className="recent-meetings-list">
                  {recentMeetings.map(meeting => (
                    <div key={meeting.id} className="recent-meeting-item">
                      <div className="recent-meeting-info">
                        <span className="meeting-type">{getTypeIcon(meeting.type)}</span>
                        <div className="meeting-details">
                          <h5>{meeting.title}</h5>
                          <p>{formatDate(meeting.date, meeting.time)}</p>
                        </div>
                      </div>
                      <div className="recent-meeting-actions">
                        {meeting.recordings && meeting.recordings.length > 0 && (
                          <button className="action-btn" title="View Recording">🎥</button>
                        )}
                        {meeting.notes && (
                          <button className="action-btn" title="View Notes">📝</button>
                        )}
                        <button 
                          className="action-btn"
                          onClick={() => setSelectedMeeting(meeting)}
                          title="View Details"
                        >
                          👁️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'list' && (
          <div className="list-view">
            <div className="meetings-table">
              <div className="table-header">
                <div className="header-cell">Meeting</div>
                <div className="header-cell">Date & Time</div>
                <div className="header-cell">Participants</div>
                <div className="header-cell">Status</div>
                <div className="header-cell">Actions</div>
              </div>
              {meetings.map(meeting => (
                <div key={meeting.id} className="table-row">
                  <div className="table-cell meeting-info">
                    <span className="meeting-type">{getTypeIcon(meeting.type)}</span>
                    <div>
                      <h5>{meeting.title}</h5>
                      <p>{meeting.description}</p>
                    </div>
                  </div>
                  <div className="table-cell">
                    {formatDate(meeting.date, meeting.time)}
                    <br />
                    <small>{meeting.duration} min</small>
                  </div>
                  <div className="table-cell">
                    <div className="participants-list">
                      {meeting.participants.slice(0, 2).map(p => p.name).join(', ')}
                      {meeting.participants.length > 2 && ` +${meeting.participants.length - 2} more`}
                    </div>
                  </div>
                  <div className="table-cell">
                    <span className={`status-badge ${getStatusColor(meeting.status)}`}>
                      {meeting.status}
                    </span>
                  </div>
                  <div className="table-cell">
                    <button 
                      className="table-action-btn"
                      onClick={() => setSelectedMeeting(meeting)}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <div className="meeting-modal-overlay" onClick={() => setSelectedMeeting(null)}>
          <div className="meeting-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedMeeting.title}</h3>
              <button className="modal-close" onClick={() => setSelectedMeeting(null)}>✕</button>
            </div>
            <div className="modal-content">
              <div className="meeting-details">
                <div className="detail-row">
                  <strong>Date & Time:</strong> {formatDate(selectedMeeting.date, selectedMeeting.time)}
                </div>
                <div className="detail-row">
                  <strong>Duration:</strong> {selectedMeeting.duration} minutes
                </div>
                <div className="detail-row">
                  <strong>Type:</strong> {getTypeIcon(selectedMeeting.type)} {selectedMeeting.type}
                </div>
                {selectedMeeting.location && (
                  <div className="detail-row">
                    <strong>Location:</strong> {selectedMeeting.location}
                  </div>
                )}
                {selectedMeeting.documentId && (
                  <div className="detail-row">
                    <strong>Document:</strong> {selectedMeeting.documentId}
                  </div>
                )}
                <div className="detail-row">
                  <strong>Description:</strong> {selectedMeeting.description}
                </div>
              </div>

              {selectedMeeting.agenda && selectedMeeting.agenda.length > 0 && (
                <div className="agenda-section">
                  <h4>📋 Agenda</h4>
                  <div className="agenda-items">
                    {selectedMeeting.agenda.map(item => (
                      <div key={item.id} className="agenda-item">
                        <strong>{item.title}</strong> ({item.duration} min)
                        {item.presenter && <span> - {item.presenter}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="participants-section">
                <h4>👥 Participants ({selectedMeeting.participants.length})</h4>
                <div className="participants-grid">
                  {selectedMeeting.participants.map(participant => (
                    <div key={participant.id} className="participant-card">
                      <div className="participant-avatar large">
                        {participant.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="participant-info">
                        <strong>{participant.name}</strong>
                        <p>{participant.role}</p>
                        <span className={`participant-status ${participant.status}`}>
                          {participant.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedMeeting.notes && (
                <div className="notes-section">
                  <h4>📝 Notes</h4>
                  <p>{selectedMeeting.notes}</p>
                </div>
              )}

              {selectedMeeting.recordings && selectedMeeting.recordings.length > 0 && (
                <div className="recordings-section">
                  <h4>🎥 Recordings</h4>
                  {selectedMeeting.recordings.map(recording => (
                    <div key={recording.id} className="recording-item">
                      <span>{recording.title}</span>
                      <span>{recording.duration} min</span>
                      <button className="play-btn">▶️ Play</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              {selectedMeeting.meetingLink && selectedMeeting.status === 'scheduled' && (
                <button className="modal-action-btn primary">Join Meeting</button>
              )}
              <button className="modal-action-btn secondary">Edit</button>
              <button className="modal-action-btn secondary" onClick={() => setSelectedMeeting(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="meeting-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="meeting-modal create-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Schedule New Meeting</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Meeting Title</label>
                  <input type="text" placeholder="Enter meeting title" />
                </div>
                <div className="form-group">
                  <label>Meeting Type</label>
                  <select>
                    <option value="review">Review</option>
                    <option value="coordination">Coordination</option>
                    <option value="planning">Planning</option>
                    <option value="daily-standup">Daily Standup</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input type="time" />
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input type="number" placeholder="60" />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" placeholder="Conference room or meeting link" />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea placeholder="Meeting description and objectives"></textarea>
                </div>
                <div className="form-group full-width">
                  <label>Participants (email addresses)</label>
                  <input type="text" placeholder="email1@company.com, email2@company.com" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-action-btn primary">Schedule Meeting</button>
              <button className="modal-action-btn secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};