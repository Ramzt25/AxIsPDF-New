import React, { useState } from 'react';

interface PropertiesPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedTool: string | null;
  currentFile: File | null;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  isOpen,
  onToggle,
  selectedTool,
  currentFile
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'markups' | 'comments' | 'collaboration'>('properties');

  const panelTabs = [
    { id: 'properties', label: 'Properties', icon: '⚙️' },
    { id: 'markups', label: 'Markups', icon: '✏️' },
    { id: 'comments', label: 'Comments', icon: '💬' },
    { id: 'collaboration', label: 'Team', icon: '👥' }
  ];

  const mockMarkups = [
    { id: 1, type: 'rectangle', page: 1, author: 'John Doe', timestamp: '2024-01-15 10:30', status: 'open' },
    { id: 2, type: 'text', page: 1, author: 'Jane Smith', timestamp: '2024-01-15 09:15', status: 'resolved' },
    { id: 3, type: 'circle', page: 2, author: 'Mike Johnson', timestamp: '2024-01-14 16:45', status: 'open' },
    { id: 4, type: 'measurement', page: 3, author: 'Sarah Wilson', timestamp: '2024-01-14 14:20', status: 'verified' }
  ];

  const mockComments = [
    { id: 1, author: 'John Doe', content: 'This dimension needs verification', timestamp: '2024-01-15 10:30', page: 1, replies: 2 },
    { id: 2, author: 'Jane Smith', content: 'Material specification looks correct', timestamp: '2024-01-15 09:15', page: 1, replies: 0 },
    { id: 3, author: 'Mike Johnson', content: 'Consider alternative routing for MEP', timestamp: '2024-01-14 16:45', page: 2, replies: 1 }
  ];

  const mockTeamMembers = [
    { id: 1, name: 'John Doe', role: 'Project Manager', status: 'online', avatar: '👨‍💼' },
    { id: 2, name: 'Jane Smith', role: 'Architect', status: 'online', avatar: '👩‍🎨' },
    { id: 3, name: 'Mike Johnson', role: 'Engineer', status: 'away', avatar: '👨‍🔧' },
    { id: 4, name: 'Sarah Wilson', role: 'Contractor', status: 'offline', avatar: '👩‍🏭' }
  ];

  const renderPropertiesTab = () => (
    <div className="properties-tab">
      <div className="section">
        <h3 className="section-title">Tool Properties</h3>
        {selectedTool ? (
          <div className="tool-properties">
            <div className="property-group">
              <label className="property-label">Tool: {selectedTool}</label>
            </div>
            
            {(selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'line') && (
              <>
                <div className="property-group">
                  <label className="property-label">Stroke Color</label>
                  <input type="color" defaultValue="#FF6B6B" className="color-input" />
                </div>
                <div className="property-group">
                  <label className="property-label">Stroke Width</label>
                  <input type="range" min="1" max="10" defaultValue="2" className="range-input" />
                </div>
                <div className="property-group">
                  <label className="property-label">Fill Color</label>
                  <input type="color" defaultValue="#FF6B6B" className="color-input" />
                </div>
                <div className="property-group">
                  <label className="property-label">Opacity</label>
                  <input type="range" min="0" max="100" defaultValue="80" className="range-input" />
                </div>
              </>
            )}
            
            {selectedTool === 'text' && (
              <>
                <div className="property-group">
                  <label className="property-label">Font Family</label>
                  <select className="select-input">
                    <option>Arial</option>
                    <option>Helvetica</option>
                    <option>Times New Roman</option>
                    <option>Courier New</option>
                  </select>
                </div>
                <div className="property-group">
                  <label className="property-label">Font Size</label>
                  <input type="number" defaultValue="14" min="8" max="72" className="number-input" />
                </div>
                <div className="property-group">
                  <label className="property-label">Text Color</label>
                  <input type="color" defaultValue="#000000" className="color-input" />
                </div>
                <div className="property-group">
                  <label className="property-label">Font Style</label>
                  <div className="button-group">
                    <button className="style-button">B</button>
                    <button className="style-button">I</button>
                    <button className="style-button">U</button>
                  </div>
                </div>
              </>
            )}
            
            {selectedTool === 'measure' && (
              <>
                <div className="property-group">
                  <label className="property-label">Units</label>
                  <select className="select-input">
                    <option>Feet & Inches</option>
                    <option>Inches</option>
                    <option>Millimeters</option>
                    <option>Centimeters</option>
                    <option>Meters</option>
                  </select>
                </div>
                <div className="property-group">
                  <label className="property-label">Precision</label>
                  <select className="select-input">
                    <option>1/16"</option>
                    <option>1/8"</option>
                    <option>1/4"</option>
                    <option>1/2"</option>
                    <option>1"</option>
                  </select>
                </div>
                <div className="property-group">
                  <label className="property-label">Scale</label>
                  <select className="select-input">
                    <option>1" = 1'</option>
                    <option>1/4" = 1'</option>
                    <option>1/8" = 1'</option>
                    <option>Custom...</option>
                  </select>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="no-tool-selected">
            <span>Select a tool to view properties</span>
          </div>
        )}
      </div>
      
      <div className="section">
        <h3 className="section-title">Document Info</h3>
        {currentFile ? (
          <div className="document-info">
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">{currentFile.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Size:</span>
              <span className="info-value">{(currentFile.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div className="info-item">
              <span className="info-label">Type:</span>
              <span className="info-value">PDF Document</span>
            </div>
            <div className="info-item">
              <span className="info-label">Modified:</span>
              <span className="info-value">{new Date(currentFile.lastModified).toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="no-document">
            <span>No document loaded</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderMarkupsTab = () => (
    <div className="markups-tab">
      <div className="markups-header">
        <h3 className="section-title">Markups ({mockMarkups.length})</h3>
        <div className="markup-controls">
          <button className="icon-button" title="Export Markups">📤</button>
          <button className="icon-button" title="Clear All">🗑️</button>
        </div>
      </div>
      
      <div className="markups-list">
        {mockMarkups.map(markup => (
          <div key={markup.id} className="markup-item">
            <div className="markup-icon">
              {markup.type === 'rectangle' ? '⬜' :
               markup.type === 'circle' ? '⭕' :
               markup.type === 'text' ? '📝' :
               markup.type === 'measurement' ? '📏' : '✏️'}
            </div>
            <div className="markup-info">
              <div className="markup-title">{markup.type} on Page {markup.page}</div>
              <div className="markup-meta">
                <span className="author">{markup.author}</span>
                <span className="timestamp">{markup.timestamp}</span>
              </div>
            </div>
            <div className={`markup-status ${markup.status}`}>
              {markup.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCommentsTab = () => (
    <div className="comments-tab">
      <div className="comments-header">
        <h3 className="section-title">Comments ({mockComments.length})</h3>
        <button className="add-comment-button">💬 Add Comment</button>
      </div>
      
      <div className="comments-list">
        {mockComments.map(comment => (
          <div key={comment.id} className="comment-item">
            <div className="comment-avatar">👤</div>
            <div className="comment-content">
              <div className="comment-header">
                <span className="comment-author">{comment.author}</span>
                <span className="comment-timestamp">{comment.timestamp}</span>
              </div>
              <div className="comment-text">{comment.content}</div>
              <div className="comment-footer">
                <span className="comment-page">Page {comment.page}</span>
                {comment.replies > 0 && (
                  <span className="comment-replies">{comment.replies} replies</span>
                )}
                <button className="reply-button">Reply</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="comment-input">
        <input 
          type="text" 
          placeholder="Add a comment..." 
          className="comment-text-input"
        />
        <button className="send-button">📤</button>
      </div>
    </div>
  );

  const renderCollaborationTab = () => (
    <div className="collaboration-tab">
      <div className="collaboration-header">
        <h3 className="section-title">Team Members</h3>
        <button className="invite-button">➕ Invite</button>
      </div>
      
      <div className="team-list">
        {mockTeamMembers.map(member => (
          <div key={member.id} className="team-member">
            <div className="member-avatar">{member.avatar}</div>
            <div className="member-info">
              <div className="member-name">{member.name}</div>
              <div className="member-role">{member.role}</div>
            </div>
            <div className={`member-status ${member.status}`}>
              <div className="status-indicator"></div>
              {member.status}
            </div>
          </div>
        ))}
      </div>
      
      <div className="section">
        <h3 className="section-title">Activity Feed</h3>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-time">2 min ago</span>
            <span className="activity-text">Jane Smith added a comment</span>
          </div>
          <div className="activity-item">
            <span className="activity-time">5 min ago</span>
            <span className="activity-text">Mike Johnson marked measurement as verified</span>
          </div>
          <div className="activity-item">
            <span className="activity-time">10 min ago</span>
            <span className="activity-text">John Doe uploaded new revision</span>
          </div>
        </div>
      </div>
      
      <div className="section">
        <h3 className="section-title">Quick Actions</h3>
        <div className="quick-actions">
          <button className="action-button">📧 Email Summary</button>
          <button className="action-button">📊 Generate Report</button>
          <button className="action-button">🔄 Sync Changes</button>
          <button className="action-button">💾 Create Backup</button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'properties': return renderPropertiesTab();
      case 'markups': return renderMarkupsTab();
      case 'comments': return renderCommentsTab();
      case 'collaboration': return renderCollaborationTab();
      default: return null;
    }
  };

  return (
    <aside className={`properties-panel ${isOpen ? 'open' : 'closed'}`}>
      <div className="panel-header">
        <div className="panel-tabs">
          {panelTabs.map(tab => (
            <button
              key={tab.id}
              className={`panel-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
              title={tab.label}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
        
        <button className="panel-toggle" onClick={onToggle} title="Toggle Panel">
          {isOpen ? '▶️' : '◀️'}
        </button>
      </div>
      
      {isOpen && (
        <div className="panel-content">
          {renderTabContent()}
        </div>
      )}
    </aside>
  );
};