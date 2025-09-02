// src/components/collaboration/ChatView.tsx
// Right panel component for viewing and replying to thread messages

import React, { useState, useRef, useEffect } from 'react';
import { Thread, ThreadMessage } from '../../services/collaboration';
import './ChatView.css';

interface ChatViewProps {
  thread?: Thread;
  currentUserId: string;
  currentUserName: string;
  onSendMessage: (text: string, threadId: string) => Promise<void>;
  onUpdateThread: (threadId: string, updates: Partial<Thread>) => Promise<void>;
  onPromoteToTask: (threadId: string) => Promise<void>;
  onPromoteToRFI: (threadId: string) => Promise<void>;
  onExportThread: (threadId: string) => Promise<void>;
  isLoading?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  thread,
  currentUserId,
  currentUserName,
  onSendMessage,
  onUpdateThread,
  onPromoteToTask,
  onPromoteToRFI,
  onExportThread,
  isLoading = false
}) => {
  const [messageText, setMessageText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  // Update title value when thread changes
  useEffect(() => {
    setTitleValue(thread?.title || '');
  }, [thread?.title]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = messageInputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [messageText]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !thread || isLoading) return;

    try {
      setIsComposing(true);
      await onSendMessage(messageText.trim(), thread.id);
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error toast
    } finally {
      setIsComposing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStatusChange = async (newStatus: Thread['status']) => {
    if (!thread) return;
    try {
      await onUpdateThread(thread.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update thread status:', error);
    }
  };

  const handlePriorityChange = async (newPriority: Thread['priority']) => {
    if (!thread) return;
    try {
      await onUpdateThread(thread.id, { priority: newPriority });
    } catch (error) {
      console.error('Failed to update thread priority:', error);
    }
  };

  const handleTitleSave = async () => {
    if (!thread || titleValue === thread.title) {
      setEditingTitle(false);
      return;
    }

    try {
      await onUpdateThread(thread.id, { title: titleValue });
      setEditingTitle(false);
    } catch (error) {
      console.error('Failed to update thread title:', error);
      setTitleValue(thread.title || '');
      setEditingTitle(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: Thread['status']) => {
    switch (status) {
      case 'open': return '#28a745';
      case 'resolved': return '#6c757d';
      case 'obsolete': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getPriorityColor = (priority?: Thread['priority']) => {
    switch (priority) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#6c757d';
      default: return '#6c757d';
    }
  };

  if (!thread) {
    return (
      <div className="chat-view-empty">
        <div className="empty-icon">💬</div>
        <div className="empty-title">Select a discussion</div>
        <div className="empty-subtitle">
          Choose a discussion from the list to view messages and replies
        </div>
      </div>
    );
  }

  return (
    <div className="chat-view">
      {/* Thread Header */}
      <div className="chat-header">
        <div className="chat-header-main">
          <div className="thread-title-section">
            {editingTitle ? (
              <div className="title-edit">
                <input
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyPress={(e) => e.key === 'Enter' && handleTitleSave()}
                  className="title-input"
                  autoFocus
                />
              </div>
            ) : (
              <h3 
                className="thread-title"
                onClick={() => setEditingTitle(true)}
                title="Click to edit title"
              >
                {thread.title || `Discussion #${thread.id.slice(-4)}`}
                <span className="edit-icon">✏️</span>
              </h3>
            )}
            
            <div className="thread-metadata">
              <span className="sheet-info">
                📄 {thread.sheetId.split('/').pop()?.replace('.pdf', '')} 
                (Rev {thread.revision})
              </span>
              <span className="location-info">
                📍 Region ({thread.bbox[0]}, {thread.bbox[1]})
              </span>
            </div>
          </div>

          <div className="thread-controls">
            <div className="status-controls">
              <select
                value={thread.status}
                onChange={(e) => handleStatusChange(e.target.value as Thread['status'])}
                className="status-select"
                style={{ borderColor: getStatusColor(thread.status) }}
              >
                <option value="open">🟢 Open</option>
                <option value="resolved">✅ Resolved</option>
                <option value="obsolete">❌ Obsolete</option>
              </select>

              <select
                value={thread.priority || 'low'}
                onChange={(e) => handlePriorityChange(e.target.value as Thread['priority'])}
                className="priority-select"
                style={{ borderColor: getPriorityColor(thread.priority) }}
              >
                <option value="low">🔵 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="critical">🔴 Critical</option>
              </select>
            </div>

            <div className="action-controls">
              <button
                onClick={() => onPromoteToTask(thread.id)}
                className="action-btn task-btn"
                title="Promote to Task"
              >
                📋 Task
              </button>
              <button
                onClick={() => onPromoteToRFI(thread.id)}
                className="action-btn rfi-btn"
                title="Promote to RFI"
              >
                ❓ RFI
              </button>
              <button
                onClick={() => onExportThread(thread.id)}
                className="action-btn export-btn"
                title="Export Discussion"
              >
                📤 Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {thread.messages.length === 0 ? (
          <div className="no-messages">
            <div className="no-messages-icon">💭</div>
            <div className="no-messages-text">No messages yet</div>
            <div className="no-messages-subtitle">Start the conversation below</div>
          </div>
        ) : (
          <div className="messages-list">
            {thread.messages.map((message, index) => {
              const isCurrentUser = message.authorId === currentUserId;
              const showAvatar = index === 0 || 
                thread.messages[index - 1].authorId !== message.authorId;
              
              return (
                <div
                  key={message.id}
                  className={`message ${isCurrentUser ? 'own-message' : 'other-message'}`}
                >
                  {showAvatar && (
                    <div className="message-avatar">
                      <div className="avatar-circle">
                        {message.authorName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                  
                  <div className="message-content">
                    {showAvatar && (
                      <div className="message-header">
                        <span className="author-name">{message.authorName}</span>
                        <span className="message-time">
                          {getRelativeTime(message.createdAt)}
                        </span>
                      </div>
                    )}
                    
                    <div className="message-bubble">
                      <div className="message-text">{message.text}</div>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="message-attachments">
                          {message.attachments.map((attachmentId, i) => (
                            <div key={i} className="attachment">
                              📎 {attachmentId}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Composer */}
      <div className="message-composer">
        <div className="composer-input">
          <textarea
            ref={messageInputRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            className="message-textarea"
            disabled={isLoading || isComposing}
            rows={1}
          />
          
          <div className="composer-actions">
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || isLoading || isComposing}
              className="send-btn"
              title="Send message"
            >
              {isComposing ? '⏳' : '➤'}
            </button>
          </div>
        </div>
        
        <div className="composer-footer">
          <div className="typing-indicator">
            {isComposing ? 'Sending message...' : ''}
          </div>
          <div className="composer-hint">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};