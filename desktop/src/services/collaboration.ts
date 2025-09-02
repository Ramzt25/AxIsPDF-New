// src/services/collaboration.ts
// Collaboration Review System - Core service for threaded discussions on construction drawings

export interface ThreadMessage {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  attachments: string[]; // file IDs
  markupJson: any; // SVG markup data (circles, arrows, highlights)
  createdAt: string; // ISO8601
}

export interface Thread {
  id: string;
  projectId: string;
  sheetId: string;
  revision: string;
  bbox: [number, number, number, number]; // [x, y, width, height]
  status: 'open' | 'resolved' | 'obsolete';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  messages: ThreadMessage[];
  title?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
  dueDate?: string;
  tags?: string[];
}

export interface RevisionMapping {
  threadId: string;
  oldRevision: string;
  newRevision: string;
  mappingStatus: 'auto-mapped' | 'needs-review' | 'obsolete';
  confidence: number; // 0-1
  aiSuggestion?: string;
}

export interface AuditExport {
  projectId: string;
  sheetId: string;
  revision: string;
  threads: Thread[];
  exportedAt: string;
  exportedBy: string;
  summary: {
    totalThreads: number;
    openThreads: number;
    resolvedThreads: number;
    obsoleteThreads: number;
  };
}

export interface TaskPromotion {
  threadId: string;
  messageId: string;
  taskTitle: string;
  description: string;
  assigneeId: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'general' | 'safety' | 'quality' | 'schedule' | 'rework';
}

export interface RFIPromotion {
  threadId: string;
  messageId: string;
  rfiTitle: string;
  description: string;
  recipientId: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  category: 'clarification' | 'substitution' | 'conflict' | 'missing_info';
  snapshotRegion: [number, number, number, number];
}

class CollaborationService {
  private threads: Map<string, Thread> = new Map();
  private revisionMappings: Map<string, RevisionMapping[]> = new Map();
  private aiServiceUrl?: string;

  constructor(aiServiceUrl?: string) {
    this.aiServiceUrl = aiServiceUrl;
    this.loadThreadsFromStorage();
  }

  // Thread CRUD Operations
  async createThread(
    projectId: string,
    sheetId: string,
    revision: string,
    bbox: [number, number, number, number],
    createdBy: string,
    initialMessage: string,
    title?: string
  ): Promise<Thread> {
    const threadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const thread: Thread = {
      id: threadId,
      projectId,
      sheetId,
      revision,
      bbox,
      status: 'open',
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title,
      messages: [{
        id: messageId,
        authorId: createdBy,
        authorName: await this.getUserName(createdBy),
        text: initialMessage,
        attachments: [],
        markupJson: {},
        createdAt: new Date().toISOString(),
      }],
    };

    this.threads.set(threadId, thread);
    await this.saveThreadsToStorage();
    
    return thread;
  }

  async addMessage(
    threadId: string,
    authorId: string,
    text: string,
    attachments: string[] = [],
    markupJson: any = {}
  ): Promise<ThreadMessage> {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const message: ThreadMessage = {
      id: messageId,
      authorId,
      authorName: await this.getUserName(authorId),
      text,
      attachments,
      markupJson,
      createdAt: new Date().toISOString(),
    };

    thread.messages.push(message);
    thread.updatedAt = new Date().toISOString();
    
    await this.saveThreadsToStorage();
    return message;
  }

  async updateThreadStatus(threadId: string, status: Thread['status'], updatedBy: string): Promise<void> {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    thread.status = status;
    thread.updatedAt = new Date().toISOString();
    
    // Add system message for status change
    await this.addMessage(
      threadId,
      updatedBy,
      `Thread status changed to: ${status}`,
      [],
      { systemMessage: true }
    );
  }

  getThreadsBySheet(sheetId: string, revision?: string): Thread[] {
    return Array.from(this.threads.values()).filter(thread => {
      const matchesSheet = thread.sheetId === sheetId;
      const matchesRevision = !revision || thread.revision === revision;
      return matchesSheet && matchesRevision;
    });
  }

  getThreadsByProject(projectId: string): Thread[] {
    return Array.from(this.threads.values()).filter(thread => 
      thread.projectId === projectId
    );
  }

  // Revision Management
  async processRevisionUpdate(
    sheetId: string,
    oldRevision: string,
    newRevision: string
  ): Promise<RevisionMapping[]> {
    const threadsToMap = this.getThreadsBySheet(sheetId, oldRevision);
    const mappings: RevisionMapping[] = [];

    for (const thread of threadsToMap) {
      const mapping = await this.mapThreadToNewRevision(thread, newRevision);
      mappings.push(mapping);
      
      // Update thread revision if auto-mapped successfully
      if (mapping.mappingStatus === 'auto-mapped' && mapping.confidence > 0.8) {
        thread.revision = newRevision;
        thread.updatedAt = new Date().toISOString();
      } else {
        // Mark thread as needing review
        thread.status = 'open'; // Keep open for review
        await this.addMessage(
          thread.id,
          'system',
          `⚠️ Thread needs review for revision ${newRevision}. ${mapping.aiSuggestion || 'Manual review required.'}`,
          [],
          { systemMessage: true, revisionChange: true }
        );
      }
    }

    this.revisionMappings.set(sheetId, mappings);
    await this.saveThreadsToStorage();
    
    return mappings;
  }

  private async mapThreadToNewRevision(thread: Thread, newRevision: string): Promise<RevisionMapping> {
    const mapping: RevisionMapping = {
      threadId: thread.id,
      oldRevision: thread.revision,
      newRevision,
      mappingStatus: 'needs-review',
      confidence: 0,
    };

    // TODO[PH-022]: Implement AI-based region mapping
    // For now, use simple heuristics
    if (this.aiServiceUrl) {
      try {
        const aiResult = await this.callAIRegionMapper(thread, newRevision);
        mapping.confidence = aiResult.confidence;
        mapping.aiSuggestion = aiResult.suggestion;
        
        if (aiResult.confidence > 0.8) {
          mapping.mappingStatus = 'auto-mapped';
        } else if (aiResult.confidence < 0.3) {
          mapping.mappingStatus = 'obsolete';
          mapping.aiSuggestion = 'Region appears to have been removed or significantly modified.';
        }
      } catch (error) {
        console.warn('AI region mapping failed:', error);
        mapping.aiSuggestion = 'AI mapping unavailable. Manual review required.';
      }
    }

    return mapping;
  }

  // Task and RFI Promotion
  async promoteToTask(
    threadId: string,
    messageId: string,
    promotion: Omit<TaskPromotion, 'threadId' | 'messageId'>
  ): Promise<string> {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    const message = thread.messages.find(m => m.id === messageId);
    if (!message) {
      throw new Error(`Message ${messageId} not found in thread`);
    }

    // TODO[PH-023]: Integrate with project task management system
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add reference message to thread
    await this.addMessage(
      threadId,
      'system',
      `📋 Task created: ${promotion.taskTitle} (ID: ${taskId})`,
      [],
      { 
        systemMessage: true, 
        taskPromotion: { taskId, ...promotion } 
      }
    );

    return taskId;
  }

  async promoteToRFI(
    threadId: string,
    messageId: string,
    promotion: Omit<RFIPromotion, 'threadId' | 'messageId'>
  ): Promise<string> {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    const message = thread.messages.find(m => m.id === messageId);
    if (!message) {
      throw new Error(`Message ${messageId} not found in thread`);
    }

    // TODO[PH-024]: Integrate with RFI management system
    const rfiId = `rfi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add reference message to thread
    await this.addMessage(
      threadId,
      'system',
      `📋 RFI created: ${promotion.rfiTitle} (ID: ${rfiId})`,
      [],
      { 
        systemMessage: true, 
        rfiPromotion: { rfiId, ...promotion } 
      }
    );

    return rfiId;
  }

  // Export and Audit
  async exportAudit(
    projectId: string,
    sheetId?: string,
    revision?: string,
    exportedBy: string = 'system'
  ): Promise<AuditExport> {
    let threads = this.getThreadsByProject(projectId);
    
    if (sheetId) {
      threads = threads.filter(t => t.sheetId === sheetId);
    }
    
    if (revision) {
      threads = threads.filter(t => t.revision === revision);
    }

    const summary = {
      totalThreads: threads.length,
      openThreads: threads.filter(t => t.status === 'open').length,
      resolvedThreads: threads.filter(t => t.status === 'resolved').length,
      obsoleteThreads: threads.filter(t => t.status === 'obsolete').length,
    };

    return {
      projectId,
      sheetId: sheetId || 'all',
      revision: revision || 'all',
      threads,
      exportedAt: new Date().toISOString(),
      exportedBy,
      summary,
    };
  }

  // AI Assistant Functions
  async getAISummary(projectId: string): Promise<string> {
    if (!this.aiServiceUrl) {
      return 'AI assistant not available';
    }

    const threads = this.getThreadsByProject(projectId);
    const openThreads = threads.filter(t => t.status === 'open');

    // TODO[PH-025]: Call AI service for summary
    return `Project has ${threads.length} total threads, ${openThreads.length} unresolved. Key issues: [AI analysis pending]`;
  }

  async detectDuplicates(threadId: string): Promise<Thread[]> {
    const thread = this.threads.get(threadId);
    if (!thread) return [];

    // TODO[PH-026]: Implement AI-based duplicate detection
    // Simple text similarity for now
    const projectThreads = this.getThreadsByProject(thread.projectId);
    return projectThreads.filter(t => 
      t.id !== threadId && 
      t.sheetId === thread.sheetId &&
      this.calculateTextSimilarity(thread.messages[0]?.text || '', t.messages[0]?.text || '') > 0.7
    );
  }

  async suggestResolution(threadId: string): Promise<string> {
    if (!this.aiServiceUrl) {
      return 'AI suggestions not available';
    }

    // TODO[PH-027]: Call AI service for resolution suggestion
    return 'AI-suggested resolution: [Analysis pending]';
  }

  // Helper Methods
  private async getUserName(userId: string): Promise<string> {
    // TODO[PH-028]: Integrate with user management system
    return userId === 'system' ? 'System' : `User ${userId}`;
  }

  private async callAIRegionMapper(thread: Thread, newRevision: string): Promise<{ confidence: number; suggestion: string }> {
    // TODO[PH-029]: Implement AI service call
    return {
      confidence: 0.5,
      suggestion: 'AI region mapping not yet implemented'
    };
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  private async loadThreadsFromStorage(): Promise<void> {
    try {
      // TODO[PH-030]: Implement persistent storage integration
      const stored = localStorage.getItem('teambeam-threads');
      if (stored) {
        const threadsArray = JSON.parse(stored) as Thread[];
        this.threads = new Map(threadsArray.map(t => [t.id, t]));
      }
    } catch (error) {
      console.warn('Failed to load threads from storage:', error);
    }
  }

  private async saveThreadsToStorage(): Promise<void> {
    try {
      const threadsArray = Array.from(this.threads.values());
      localStorage.setItem('teambeam-threads', JSON.stringify(threadsArray));
    } catch (error) {
      console.warn('Failed to save threads to storage:', error);
    }
  }
}

// Global service instance
export const collaborationService = new CollaborationService();
export default collaborationService;