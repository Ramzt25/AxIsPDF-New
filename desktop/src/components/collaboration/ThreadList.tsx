// src/components/collaboration/ThreadList.tsx
// Left panel component for browsing and filtering threads

import React, { useState, useMemo } from 'react';
import { Thread } from '../../services/collaboration';
import './ThreadList.css';

interface ThreadListProps {
  threads: Thread[];
  selectedThreadId?: string;
  onThreadSelect: (thread: Thread) => void;
  onNewThread: () => void;
  currentSheet?: string;
  currentRevision?: string;
}

export const ThreadList: React.FC<ThreadListProps> = ({
  threads,
  selectedThreadId,
  onThreadSelect,
  onNewThread,
  currentSheet,
  currentRevision
}) => {
  const [filterStatus, setFilterStatus] = useState<Thread['status'] | 'all'>('all');
  const [filterSheet, setFilterSheet] = useState<string>('all');
  const [filterRevision, setFilterRevision] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'priority'>('updated');

  // Get unique sheets and revisions for filters
  const uniqueSheets = useMemo(() => {
    return [...new Set(threads.map(t => t.sheetId))].sort();
  }, [threads]);

  const uniqueRevisions = useMemo(() => {
    return [...new Set(threads.map(t => t.revision))].sort();
  }, [threads]);

  // Filter and sort threads
  const filteredThreads = useMemo(() => {
    let filtered = threads.filter(thread => {
      // Status filter
      const matchesStatus = filterStatus === 'all' || thread.status === filterStatus;
      
      // Sheet filter
      const matchesSheet = filterSheet === 'all' || thread.sheetId === filterSheet;
      
      // Revision filter
      const matchesRevision = filterRevision === 'all' || thread.revision === filterRevision;
      
      // Search query
      const matchesSearch = !searchQuery || 
        thread.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesStatus && matchesSheet && matchesRevision && matchesSearch;
    });

    // Sort threads
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority || 'low'];
          const bPriority = priorityOrder[b.priority || 'low'];
          return bPriority - aPriority;
        default:
          return 0;
      }
    });

    return filtered;
  }, [threads, filterStatus, filterSheet, filterRevision, searchQuery, sortBy]);

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

  const getStatusIcon = (status: Thread['status']) => {
    switch (status) {
      case 'open': return '💬';
      case 'resolved': return '✅';
      case 'obsolete': return '❌';
      default: return '💬';
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

  const threadStats = useMemo(() => {
    return {
      total: threads.length,
      open: threads.filter(t => t.status === 'open').length,
      resolved: threads.filter(t => t.status === 'resolved').length,
      obsolete: threads.filter(t => t.status === 'obsolete').length,
    };
  }, [threads]);

  return (
    <div className="thread-list">
      {/* Header */}
      <div className="thread-list-header">
        <div className="header-title">
          <h2>💬 Discussions</h2>
          <div className="thread-stats">
            <span className="stat-badge">{threadStats.total} total</span>
            <span className="stat-badge open">{threadStats.open} open</span>
          </div>
        </div>
        
        <button 
          className="new-thread-btn"
          onClick={onNewThread}
          title="Start new discussion"
        >
          ➕ New
        </button>
      </div>

      {/* Filters */}
      <div className="thread-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="search-clear"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-row">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Thread['status'] | 'all')}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="obsolete">Obsolete</option>
          </select>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'updated' | 'created' | 'priority')}
            className="filter-select"
          >
            <option value="updated">Latest Activity</option>
            <option value="created">Date Created</option>
            <option value="priority">Priority</option>
          </select>
        </div>

        {uniqueSheets.length > 1 && (
          <div className="filter-row">
            <select 
              value={filterSheet}
              onChange={(e) => setFilterSheet(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Sheets</option>
              {uniqueSheets.map(sheet => (
                <option key={sheet} value={sheet}>
                  {sheet.split('/').pop()?.replace('.pdf', '') || sheet}
                </option>
              ))}
            </select>

            <select 
              value={filterRevision}
              onChange={(e) => setFilterRevision(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Revisions</option>
              {uniqueRevisions.map(revision => (
                <option key={revision} value={revision}>{revision}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Thread List */}
      <div className="threads-container">
        {filteredThreads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <div className="empty-message">
              {searchQuery ? 'No discussions match your search' : 'No discussions yet'}
            </div>
            {!searchQuery && (
              <button onClick={onNewThread} className="empty-action-btn">
                Start first discussion
              </button>
            )}
          </div>
        ) : (
          <div className="threads-list">
            {filteredThreads.map(thread => (
              <div
                key={thread.id}
                className={`thread-item ${selectedThreadId === thread.id ? 'selected' : ''} status-${thread.status}`}
                onClick={() => onThreadSelect(thread)}
              >
                <div className="thread-item-header">
                  <div className="thread-status">
                    <span className="status-icon">{getStatusIcon(thread.status)}</span>
                    {thread.priority && (
                      <div 
                        className="priority-indicator"
                        style={{ backgroundColor: getPriorityColor(thread.priority) }}
                        title={`Priority: ${thread.priority}`}
                      />
                    )}
                  </div>
                  
                  <div className="thread-info">
                    <div className="thread-title">
                      {thread.title || `Thread #${thread.id.slice(-4)}`}
                    </div>
                    <div className="thread-meta">
                      <span className="sheet-name">
                        {thread.sheetId.split('/').pop()?.replace('.pdf', '') || thread.sheetId}
                      </span>
                      <span className="revision-badge">{thread.revision}</span>
                    </div>
                  </div>

                  <div className="thread-activity">
                    <div className="message-count">
                      {thread.messages.length}
                    </div>
                    <div className="last-activity">
                      {getRelativeTime(thread.updatedAt)}
                    </div>
                  </div>
                </div>

                <div className="thread-preview">
                  {thread.messages.length > 0 ? (
                    <div className="last-message">
                      <strong>{thread.messages[thread.messages.length - 1].authorName}:</strong>{' '}
                      {thread.messages[thread.messages.length - 1].text.slice(0, 80)}
                      {thread.messages[thread.messages.length - 1].text.length > 80 ? '...' : ''}
                    </div>
                  ) : (
                    <div className="no-messages">No messages yet</div>
                  )}
                </div>

                {thread.assigneeId && (
                  <div className="thread-assignee">
                    Assigned to: {thread.assigneeId}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with current filters info */}
      {filteredThreads.length > 0 && (
        <div className="thread-list-footer">
          <div className="results-count">
            Showing {filteredThreads.length} of {threads.length} discussions
          </div>
          {(filterStatus !== 'all' || filterSheet !== 'all' || filterRevision !== 'all' || searchQuery) && (
            <button 
              className="clear-filters-btn"
              onClick={() => {
                setFilterStatus('all');
                setFilterSheet('all');
                setFilterRevision('all');
                setSearchQuery('');
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};