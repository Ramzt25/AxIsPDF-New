// src/components/collaboration/ThreadPin.tsx
// Thread pin component that appears on the drawing canvas

import React from 'react';
import { Thread } from '../../services/collaboration';
import './ThreadPin.css';

interface ThreadPinProps {
  thread: Thread;
  position: { x: number; y: number };
  isActive?: boolean;
  isSelected?: boolean;
  onClick: (thread: Thread) => void;
  onDoubleClick?: (thread: Thread) => void;
}

export const ThreadPin: React.FC<ThreadPinProps> = ({
  thread,
  position,
  isActive = false,
  isSelected = false,
  onClick,
  onDoubleClick
}) => {
  const getStatusIcon = () => {
    switch (thread.status) {
      case 'open':
        return '💬';
      case 'resolved':
        return '✅';
      case 'obsolete':
        return '❌';
      default:
        return '💬';
    }
  };

  const getPriorityClass = () => {
    switch (thread.priority) {
      case 'critical':
        return 'priority-critical';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  const getMessageCount = () => {
    return thread.messages.length;
  };

  const getLastActivity = () => {
    if (thread.messages.length === 0) return 'No messages';
    
    const lastMessage = thread.messages[thread.messages.length - 1];
    const date = new Date(lastMessage.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`thread-pin ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''} ${getPriorityClass()} status-${thread.status}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(thread);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.(thread);
      }}
      title={`Thread: ${thread.title || 'Untitled'} - ${getMessageCount()} messages - ${getLastActivity()}`}
    >
      {/* Pin Icon */}
      <div className="pin-icon">
        <span className="status-icon">{getStatusIcon()}</span>
        {getMessageCount() > 1 && (
          <span className="message-count">{getMessageCount()}</span>
        )}
      </div>

      {/* Pin Body - appears on hover/active */}
      <div className="pin-body">
        <div className="pin-header">
          <div className="thread-title">
            {thread.title || `Thread #${thread.id.slice(-4)}`}
          </div>
          <div className="thread-meta">
            <span className="status-badge">{thread.status}</span>
            {thread.priority && (
              <span className={`priority-badge ${getPriorityClass()}`}>
                {thread.priority}
              </span>
            )}
          </div>
        </div>

        <div className="pin-content">
          <div className="last-message">
            {thread.messages.length > 0 ? (
              <div>
                <strong>{thread.messages[thread.messages.length - 1].authorName}:</strong>{' '}
                {thread.messages[thread.messages.length - 1].text.slice(0, 100)}
                {thread.messages[thread.messages.length - 1].text.length > 100 ? '...' : ''}
              </div>
            ) : (
              <div className="no-messages">No messages yet</div>
            )}
          </div>

          <div className="pin-footer">
            <span className="message-count-text">
              {getMessageCount()} message{getMessageCount() !== 1 ? 's' : ''}
            </span>
            <span className="last-activity">{getLastActivity()}</span>
          </div>
        </div>
      </div>

      {/* Pulse animation for new messages */}
      {isActive && (
        <div className="pin-pulse" />
      )}
    </div>
  );
};