// src/components/collaboration/CollaborationPanel.tsx
// Main collaboration panel that combines thread list, chat view, and new thread modal

import React, { useState, useEffect } from 'react';
import { collaborationService, Thread } from '../../services/collaboration';
import { ThreadList } from './ThreadList';
import { ChatView } from './ChatView';
import { ThreadPin } from './ThreadPin';
import { NewThreadModal } from './NewThreadModal';
import './CollaborationPanel.css';

interface CollaborationPanelProps {
  projectId: string;
  currentSheet: string;
  currentRevision: string;
  currentUserId: string;
  currentUserName: string;
  canvasContainer?: HTMLElement; // For positioning thread pins
  onThreadRegionClick?: (bbox: [number, number, number, number]) => void;
  selectedRegion?: [number, number, number, number];
  isVisible?: boolean;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  projectId,
  currentSheet,
  currentRevision,
  currentUserId,
  currentUserName,
  canvasContainer,
  onThreadRegionClick,
  selectedRegion,
  isVisible = true
}) => {
  const [service] = useState(() => collaborationService);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | undefined>();
  const [isNewThreadModalOpen, setIsNewThreadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available users for assignment (mock data - replace with real user service)
  const [availableUsers] = useState([
    { id: 'user1', name: 'John Smith' },
    { id: 'user2', name: 'Sarah Johnson' },
    { id: 'user3', name: 'Mike Chen' },
    { id: 'user4', name: 'Lisa Williams' }
  ]);

  // Load threads for current sheet and revision
  useEffect(() => {
    loadThreads();
  }, [projectId, currentSheet, currentRevision]);

  const loadThreads = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const sheetThreads = service.getThreadsBySheet(currentSheet, currentRevision);
      setThreads(sheetThreads);
      
      // If selected thread is not in current sheet/revision, clear selection
      if (selectedThread && !sheetThreads.find(t => t.id === selectedThread.id)) {
        setSelectedThread(undefined);
      }
    } catch (err) {
      console.error('Failed to load threads:', err);
      setError('Failed to load discussions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateThread = async (threadData: {
    title?: string;
    message: string;
    priority?: Thread['priority'];
    assigneeId?: string;
    bbox?: [number, number, number, number];
  }) => {
    try {
      const thread = await service.createThread(
        projectId,
        currentSheet,
        currentRevision,
        threadData.bbox || [0, 0, 100, 100], // Default region if none selected
        currentUserId,
        threadData.message,
        threadData.title
      );

      await loadThreads();
      
      // Select the newly created thread
      const updatedThreads = service.getThreadsBySheet(currentSheet, currentRevision);
      const newThread = updatedThreads.find(t => t.id === thread.id);
      setSelectedThread(newThread);
    } catch (error) {
      console.error('Failed to create thread:', error);
      throw error;
    }
  };

  const handleSendMessage = async (text: string, threadId: string) => {
    await service.addMessage(threadId, currentUserId, text);
    await loadThreads();
    
    // Update selected thread
    if (selectedThread?.id === threadId) {
      const updatedThreads = service.getThreadsBySheet(currentSheet, currentRevision);
      const updatedThread = updatedThreads.find(t => t.id === threadId);
      setSelectedThread(updatedThread);
    }
  };

  const handleUpdateThread = async (threadId: string, updates: Partial<Thread>) => {
    // Use specific update methods based on what's being updated
    if (updates.status) {
      await service.updateThreadStatus(threadId, updates.status, currentUserId);
    }
    // TODO: Add more specific update methods as needed
    
    await loadThreads();
    
    // Update selected thread
    if (selectedThread?.id === threadId) {
      const updatedThreads = service.getThreadsBySheet(currentSheet, currentRevision);
      const updatedThread = updatedThreads.find(t => t.id === threadId);
      setSelectedThread(updatedThread);
    }
  };

  const handlePromoteToTask = async (threadId: string) => {
    try {
      // Use the first message in the thread for promotion
      const thread = threads.find(t => t.id === threadId);
      if (!thread || thread.messages.length === 0) {
        throw new Error('Thread or message not found');
      }
      
      const firstMessage = thread.messages[0];
      await service.promoteToTask(threadId, firstMessage.id, {
        taskTitle: thread.title || `Task from discussion #${thread.id.slice(-4)}`,
        description: firstMessage.text,
        assigneeId: thread.assigneeId || currentUserId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        priority: thread.priority || 'medium',
        category: 'general'
      });
      // TODO: Show success toast
      console.log('Thread promoted to task');
    } catch (error) {
      console.error('Failed to promote to task:', error);
      // TODO: Show error toast
    }
  };

  const handlePromoteToRFI = async (threadId: string) => {
    try {
      // Use the first message in the thread for promotion
      const thread = threads.find(t => t.id === threadId);
      if (!thread || thread.messages.length === 0) {
        throw new Error('Thread or message not found');
      }
      
      const firstMessage = thread.messages[0];
      await service.promoteToRFI(threadId, firstMessage.id, {
        rfiTitle: thread.title || `RFI from discussion #${thread.id.slice(-4)}`,
        description: firstMessage.text,
        recipientId: thread.assigneeId || 'default-recipient',
        urgency: thread.priority === 'critical' ? 'urgent' : thread.priority || 'medium',
        category: 'clarification',
        snapshotRegion: thread.bbox
      });
      // TODO: Show success toast
      console.log('Thread promoted to RFI');
    } catch (error) {
      console.error('Failed to promote to RFI:', error);
      // TODO: Show error toast
    }
  };

  const handleExportThread = async (threadId: string) => {
    try {
      const auditData = await service.exportAudit(
        projectId,
        currentSheet,
        currentRevision
      );
      
      // Create and download the audit file
      const blob = new Blob([JSON.stringify(auditData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `discussion-audit-${currentSheet.split('/').pop()}-${currentRevision}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // TODO: Show success toast
      console.log('Audit trail exported');
    } catch (error) {
      console.error('Failed to export audit trail:', error);
      // TODO: Show error toast
    }
  };

  const handleThreadSelect = (thread: Thread) => {
    setSelectedThread(thread);
    
    // Optionally highlight the thread region on canvas
    if (onThreadRegionClick) {
      onThreadRegionClick(thread.bbox);
    }
  };

  const handleThreadPinClick = (thread: Thread) => {
    setSelectedThread(thread);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="collaboration-panel">
      {/* Thread Pins Overlay */}
      {canvasContainer && (
        <div className="thread-pins-overlay">
          {threads.map(thread => (
            <ThreadPin
              key={thread.id}
              thread={thread}
              position={{ x: thread.bbox[0], y: thread.bbox[1] }}
              onClick={() => handleThreadPinClick(thread)}
              isSelected={selectedThread?.id === thread.id}
            />
          ))}
        </div>
      )}

      {/* Main Panel */}
      <div className="collaboration-main">
        {/* Thread List */}
        <div className="thread-list-panel">
          <ThreadList
            threads={threads}
            selectedThreadId={selectedThread?.id}
            onThreadSelect={handleThreadSelect}
            onNewThread={() => setIsNewThreadModalOpen(true)}
            currentSheet={currentSheet}
            currentRevision={currentRevision}
          />
        </div>

        {/* Chat View */}
        <div className="chat-view-panel">
          <ChatView
            thread={selectedThread}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onSendMessage={handleSendMessage}
            onUpdateThread={handleUpdateThread}
            onPromoteToTask={handlePromoteToTask}
            onPromoteToRFI={handlePromoteToRFI}
            onExportThread={handleExportThread}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* New Thread Modal */}
      <NewThreadModal
        isOpen={isNewThreadModalOpen}
        onClose={() => setIsNewThreadModalOpen(false)}
        onCreateThread={handleCreateThread}
        currentSheet={currentSheet}
        currentRevision={currentRevision}
        selectedRegion={selectedRegion}
        availableUsers={availableUsers}
        isCreating={isLoading}
      />

      {/* Error Display */}
      {error && (
        <div className="error-toast">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
            <button 
              className="error-dismiss"
              onClick={() => setError(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};