// src/components/collaboration/NewThreadModal.tsx
// Modal for creating new discussion threads with region selection

import React, { useState } from 'react';
import { Thread } from '../../services/collaboration';
import './NewThreadModal.css';

interface NewThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateThread: (threadData: {
    title?: string;
    message: string;
    priority?: Thread['priority'];
    assigneeId?: string;
    bbox?: [number, number, number, number];
  }) => Promise<void>;
  currentSheet: string;
  currentRevision: string;
  selectedRegion?: [number, number, number, number]; // [x, y, width, height]
  availableUsers?: { id: string; name: string; }[];
  isCreating?: boolean;
}

export const NewThreadModal: React.FC<NewThreadModalProps> = ({
  isOpen,
  onClose,
  onCreateThread,
  currentSheet,
  currentRevision,
  selectedRegion,
  availableUsers = [],
  isCreating = false
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<Thread['priority']>('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [useSelectedRegion, setUseSelectedRegion] = useState(!!selectedRegion);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    try {
      await onCreateThread({
        title: title.trim() || undefined,
        message: message.trim(),
        priority: priority,
        assigneeId: assigneeId || undefined,
        bbox: useSelectedRegion ? selectedRegion : undefined
      });
      
      // Reset form
      setTitle('');
      setMessage('');
      setPriority('medium');
      setAssigneeId('');
      setUseSelectedRegion(!!selectedRegion);
      
      onClose();
    } catch (error) {
      console.error('Failed to create thread:', error);
      // TODO: Show error toast
    }
  };

  const handleClose = () => {
    setTitle('');
    setMessage('');
    setPriority('medium');
    setAssigneeId('');
    setUseSelectedRegion(!!selectedRegion);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="new-thread-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💬 Start New Discussion</h2>
          <button 
            className="close-btn"
            onClick={handleClose}
            disabled={isCreating}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Context Info */}
          <div className="context-info">
            <div className="context-item">
              <span className="context-label">📄 Sheet:</span>
              <span className="context-value">
                {currentSheet.split('/').pop()?.replace('.pdf', '') || currentSheet}
              </span>
            </div>
            <div className="context-item">
              <span className="context-label">🔄 Revision:</span>
              <span className="context-value">{currentRevision}</span>
            </div>
            {selectedRegion && (
              <div className="context-item">
                <span className="context-label">📍 Region:</span>
                <span className="context-value">
                  ({selectedRegion[0]}, {selectedRegion[1]}) 
                  {selectedRegion[2]}×{selectedRegion[3]}
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="thread-form">
            {/* Title */}
            <div className="form-group">
              <label htmlFor="thread-title" className="form-label">
                Title (optional)
              </label>
              <input
                id="thread-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the issue or question..."
                className="form-input"
                disabled={isCreating}
                maxLength={100}
              />
              <div className="field-hint">
                Leave blank to auto-generate based on message content
              </div>
            </div>

            {/* Message */}
            <div className="form-group">
              <label htmlFor="thread-message" className="form-label">
                Message *
              </label>
              <textarea
                id="thread-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue, ask a question, or start the discussion..."
                className="form-textarea"
                disabled={isCreating}
                rows={4}
                required
              />
              <div className="char-counter">
                {message.length}/1000
              </div>
            </div>

            {/* Priority */}
            <div className="form-group">
              <label htmlFor="thread-priority" className="form-label">
                Priority
              </label>
              <select
                id="thread-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Thread['priority'])}
                className="form-select"
                disabled={isCreating}
              >
                <option value="low">🔵 Low - General discussion or minor issue</option>
                <option value="medium">🟡 Medium - Standard review or question</option>
                <option value="high">🟠 High - Important issue needing attention</option>
                <option value="critical">🔴 Critical - Blocking issue or safety concern</option>
              </select>
            </div>

            {/* Assignee */}
            {availableUsers.length > 0 && (
              <div className="form-group">
                <label htmlFor="thread-assignee" className="form-label">
                  Assign to (optional)
                </label>
                <select
                  id="thread-assignee"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="form-select"
                  disabled={isCreating}
                >
                  <option value="">No specific assignee</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Region Selection */}
            {selectedRegion && (
              <div className="form-group">
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={useSelectedRegion}
                      onChange={(e) => setUseSelectedRegion(e.target.checked)}
                      disabled={isCreating}
                    />
                    <span className="checkbox-text">
                      📍 Attach to selected region 
                      ({selectedRegion[0]}, {selectedRegion[1]})
                    </span>
                  </label>
                </div>
                <div className="field-hint">
                  Uncheck to create a general discussion not tied to a specific area
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={handleClose}
            className="cancel-btn"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="create-btn"
            disabled={!message.trim() || isCreating}
          >
            {isCreating ? (
              <>
                ⏳ Creating...
              </>
            ) : (
              <>
                💬 Start Discussion
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};