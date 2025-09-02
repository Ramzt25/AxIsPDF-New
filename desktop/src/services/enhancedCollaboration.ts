import { EventEmitter } from 'events';

// Types for enhanced collaboration
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
  cursor?: {
    x: number;
    y: number;
    sheetId: string;
    timestamp: string;
  };
}

export interface CollaborationSession {
  id: string;
  projectId: string;
  name: string;
  startedBy: string;
  startedAt: string;
  participants: User[];
  isActive: boolean;
  record: SessionEvent[];
  permissions: SessionPermissions;
}

export interface SessionEvent {
  id: string;
  type: 'user_join' | 'user_leave' | 'markup_add' | 'markup_update' | 'markup_delete' | 
        'cursor_move' | 'chat_message' | 'rfi_create' | 'task_assign' | 'meeting_start';
  userId: string;
  timestamp: string;
  data: any;
  metadata?: {
    sheetId?: string;
    markupId?: string;
    undoable?: boolean;
  };
}

export interface SessionPermissions {
  canEdit: string[]; // user IDs
  canView: string[]; // user IDs
  canModerate: string[]; // user IDs
  isPublic: boolean;
  requiresApproval: boolean;
}

export interface TeamsIntegration {
  teamId: string;
  channelId: string;
  webhookUrl: string;
  tabUrl?: string;
  permissions: {
    postMessages: boolean;
    receiveNotifications: boolean;
    embedViewer: boolean;
  };
}

export interface AdaptiveCard {
  type: string;
  version: string;
  body: any[];
  actions?: any[];
}

export interface WebSocketMessage {
  type: string;
  sessionId: string;
  userId: string;
  timestamp: string;
  data: any;
}

// Enhanced Collaboration Service
export class EnhancedCollaborationService extends EventEmitter {
  private sessions: Map<string, CollaborationSession> = new Map();
  private connections: Map<string, any> = new Map(); // Using any for Node.js WebSocket compatibility
  private teamsIntegrations: Map<string, TeamsIntegration> = new Map();
  private activityTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.setupHeartbeat();
  }

  // Session Management
  async createSession(
    projectId: string, 
    name: string, 
    startedBy: string,
    permissions?: Partial<SessionPermissions>
  ): Promise<CollaborationSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: CollaborationSession = {
      id: sessionId,
      projectId,
      name,
      startedBy,
      startedAt: new Date().toISOString(),
      participants: [],
      isActive: true,
      record: [],
      permissions: {
        canEdit: [startedBy],
        canView: [startedBy],
        canModerate: [startedBy],
        isPublic: false,
        requiresApproval: false,
        ...permissions
      }
    };

    this.sessions.set(sessionId, session);
    this.emit('session_created', session);

    // Notify Teams if integration exists
    await this.notifyTeams(projectId, {
      type: 'session_started',
      project: { id: projectId, name: 'Project Name' }, // TODO: Get from database
      data: {
        title: `New Collaboration Session: ${name}`,
        description: `Started by ${startedBy}`,
        axisUrl: `teambeam://session/${sessionId}`
      }
    });

    return session;
  }

  async joinSession(sessionId: string, user: User): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    // Check permissions
    if (!session.permissions.isPublic && 
        !session.permissions.canView.includes(user.id)) {
      if (session.permissions.requiresApproval) {
        await this.requestSessionAccess(sessionId, user);
        return false;
      }
      throw new Error('Access denied');
    }

    // Add user to participants
    const existingParticipant = session.participants.find(p => p.id === user.id);
    if (existingParticipant) {
      existingParticipant.isOnline = true;
      existingParticipant.lastSeen = new Date().toISOString();
    } else {
      session.participants.push({
        ...user,
        isOnline: true,
        lastSeen: new Date().toISOString()
      });
    }

    // Record event
    const joinEvent: SessionEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'user_join',
      userId: user.id,
      timestamp: new Date().toISOString(),
      data: { userName: user.name }
    };

    session.record.push(joinEvent);
    this.emit('user_joined', { sessionId, user, event: joinEvent });

    // Broadcast to other participants
    this.broadcastToSession(sessionId, {
      type: 'user_joined',
      sessionId,
      userId: user.id,
      timestamp: joinEvent.timestamp,
      data: { user }
    });

    return true;
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.find(p => p.id === userId);
    if (participant) {
      participant.isOnline = false;
      participant.lastSeen = new Date().toISOString();
      participant.cursor = undefined;
    }

    // Record event
    const leaveEvent: SessionEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'user_leave',
      userId,
      timestamp: new Date().toISOString(),
      data: {}
    };

    session.record.push(leaveEvent);
    this.emit('user_left', { sessionId, userId, event: leaveEvent });

    // Broadcast to other participants
    this.broadcastToSession(sessionId, {
      type: 'user_left',
      sessionId,
      userId,
      timestamp: leaveEvent.timestamp,
      data: { userId }
    });

    // Clean up if no active participants
    const activeParticipants = session.participants.filter(p => p.isOnline);
    if (activeParticipants.length === 0) {
      await this.pauseSession(sessionId);
    }
  }

  // Real-time Collaboration
  updateCursor(sessionId: string, userId: string, cursor: { x: number; y: number; sheetId: string }): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.find(p => p.id === userId);
    if (participant) {
      participant.cursor = {
        ...cursor,
        timestamp: new Date().toISOString()
      };
    }

    // Broadcast cursor update (debounced)
    this.debouncedBroadcast(`cursor_${userId}`, () => {
      this.broadcastToSession(sessionId, {
        type: 'cursor_update',
        sessionId,
        userId,
        timestamp: new Date().toISOString(),
        data: { cursor: participant?.cursor }
      }, [userId]); // Exclude sender
    }, 50);
  }

  async addMarkup(
    sessionId: string, 
    userId: string, 
    markupData: any
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    // Check edit permissions
    if (!session.permissions.canEdit.includes(userId)) {
      throw new Error('Edit permission denied');
    }

    const markupId = `markup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Record event
    const addEvent: SessionEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'markup_add',
      userId,
      timestamp: new Date().toISOString(),
      data: { ...markupData, id: markupId },
      metadata: {
        sheetId: markupData.sheetId,
        markupId,
        undoable: true
      }
    };

    session.record.push(addEvent);
    this.emit('markup_added', { sessionId, userId, event: addEvent });

    // Broadcast to all participants
    this.broadcastToSession(sessionId, {
      type: 'markup_added',
      sessionId,
      userId,
      timestamp: addEvent.timestamp,
      data: addEvent.data
    });

    // TODO: Persist to database
    await this.persistMarkup(markupData);
  }

  async createRFI(
    sessionId: string,
    userId: string,
    rfiData: {
      title: string;
      description: string;
      assigneeId?: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      sheetId?: string;
      markupId?: string;
    }
  ): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const rfiId = `rfi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Record event
    const rfiEvent: SessionEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'rfi_create',
      userId,
      timestamp: new Date().toISOString(),
      data: { ...rfiData, id: rfiId },
      metadata: {
        sheetId: rfiData.sheetId,
        markupId: rfiData.markupId
      }
    };

    session.record.push(rfiEvent);
    this.emit('rfi_created', { sessionId, userId, event: rfiEvent });

    // Broadcast to session
    this.broadcastToSession(sessionId, {
      type: 'rfi_created',
      sessionId,
      userId,
      timestamp: rfiEvent.timestamp,
      data: rfiEvent.data
    });

    // Notify Teams
    await this.notifyTeams(session.projectId, {
      type: 'rfi_created',
      project: { id: session.projectId, name: 'Project Name' },
      data: {
        title: `New RFI: ${rfiData.title}`,
        description: rfiData.description,
        assignee: rfiData.assigneeId,
        axisUrl: `teambeam://rfi/${rfiId}`
      }
    });

    return rfiId;
  }

  // Teams Integration
  async setupTeamsIntegration(
    projectId: string,
    integration: TeamsIntegration
  ): Promise<void> {
    this.teamsIntegrations.set(projectId, integration);
    
    // Send welcome message to Teams channel
    await this.sendTeamsMessage(integration.webhookUrl, {
      type: 'message',
      summary: 'TeamBeam Integration Active',
      attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: this.createWelcomeAdaptiveCard(projectId)
      }]
    });
  }

  private async notifyTeams(projectId: string, payload: any): Promise<void> {
    const integration = this.teamsIntegrations.get(projectId);
    if (!integration || !integration.permissions.postMessages) return;

    const adaptiveCard = this.createNotificationAdaptiveCard(payload);
    
    await this.sendTeamsMessage(integration.webhookUrl, {
      type: 'message',
      summary: payload.data.title,
      attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: adaptiveCard
      }]
    });
  }

  private createNotificationAdaptiveCard(payload: any): AdaptiveCard {
    const iconMap = {
      'session_started': '🎯',
      'rfi_created': '❓',
      'markup_added': '📝',
      'review_requested': '👀'
    };

    return {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'TextBlock',
          text: `${iconMap[payload.type] || '📋'} ${payload.data.title}`,
          weight: 'Bolder',
          size: 'Medium'
        },
        {
          type: 'TextBlock',
          text: payload.data.description,
          wrap: true,
          spacing: 'Small'
        },
        {
          type: 'FactSet',
          facts: [
            {
              title: 'Project:',
              value: payload.project.name
            },
            ...(payload.data.assignee ? [{
              title: 'Assigned to:',
              value: payload.data.assignee
            }] : []),
            ...(payload.data.dueDate ? [{
              title: 'Due:',
              value: new Date(payload.data.dueDate).toLocaleDateString()
            }] : [])
          ]
        }
      ],
      actions: [
        {
          type: 'Action.OpenUrl',
          title: 'Open in TeamBeam',
          url: payload.data.axisUrl
        },
        ...(payload.type === 'rfi_created' ? [
          {
            type: 'Action.Http',
            title: 'Assign to Me',
            method: 'POST',
            url: `${process.env.API_BASE_URL}/api/rfi/${payload.data.id}/assign`,
            body: JSON.stringify({ assigneeId: '{{user.id}}' })
          }
        ] : [])
      ]
    };
  }

  private createWelcomeAdaptiveCard(projectId: string): AdaptiveCard {
    return {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'TextBlock',
          text: '🚀 TeamBeam Integration Active',
          weight: 'Bolder',
          size: 'Large'
        },
        {
          type: 'TextBlock',
          text: 'Your project is now connected to TeamBeam for real-time collaboration and notifications.',
          wrap: true
        },
        {
          type: 'TextBlock',
          text: 'You\'ll receive updates for:',
          weight: 'Bolder'
        },
        {
          type: 'TextBlock',
          text: '• New RFIs and tasks\n• Markup and review activities\n• Session invitations\n• Project milestones',
          wrap: true
        }
      ],
      actions: [
        {
          type: 'Action.OpenUrl',
          title: 'Open Project',
          url: `teambeam://project/${projectId}`
        }
      ]
    };
  }

  private async sendTeamsMessage(webhookUrl: string, message: any): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        console.error('Failed to send Teams message:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending Teams message:', error);
    }
  }

  // WebSocket Management
  connectWebSocket(sessionId: string, userId: string, ws: any): void { // Using any for Node.js WebSocket compatibility
    const connectionId = `${sessionId}_${userId}`;
    this.connections.set(connectionId, ws);

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        this.handleWebSocketMessage(sessionId, userId, data);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      this.connections.delete(connectionId);
      this.leaveSession(sessionId, userId);
    });

    ws.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      this.connections.delete(connectionId);
    });
  }

  private handleWebSocketMessage(sessionId: string, userId: string, message: WebSocketMessage): void {
    switch (message.type) {
      case 'cursor_update':
        this.updateCursor(sessionId, userId, message.data.cursor);
        break;
      case 'markup_add':
        this.addMarkup(sessionId, userId, message.data);
        break;
      case 'ping':
        this.sendToUser(sessionId, userId, { type: 'pong', timestamp: new Date().toISOString() });
        break;
      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  private broadcastToSession(sessionId: string, message: any, excludeUsers: string[] = []): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.participants
      .filter(p => p.isOnline && !excludeUsers.includes(p.id))
      .forEach(participant => {
        this.sendToUser(sessionId, participant.id, message);
      });
  }

  private sendToUser(sessionId: string, userId: string, message: any): void {
    const connectionId = `${sessionId}_${userId}`;
    const ws = this.connections.get(connectionId);
    
    if (ws && ws.readyState === 1) { // WebSocket.OPEN = 1
      ws.send(JSON.stringify(message));
    }
  }

  // Utility Methods
  private debouncedBroadcast(key: string, fn: () => void, delay: number): void {
    const existingTimer = this.activityTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      fn();
      this.activityTimers.delete(key);
    }, delay);

    this.activityTimers.set(key, timer);
  }

  private setupHeartbeat(): void {
    setInterval(() => {
      this.connections.forEach((ws, connectionId) => {
        if (ws.readyState === 1) { // WebSocket.OPEN = 1
          if (ws.ping) {
            ws.ping(); // Only if ping method exists (Node.js WebSocket)
          }
        } else {
          this.connections.delete(connectionId);
        }
      });
    }, 30000); // 30 seconds
  }

  private async requestSessionAccess(sessionId: string, user: User): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Notify moderators
    const moderators = session.participants.filter(p => 
      session.permissions.canModerate.includes(p.id) && p.isOnline
    );

    moderators.forEach(moderator => {
      this.sendToUser(sessionId, moderator.id, {
        type: 'access_request',
        sessionId,
        userId: user.id,
        timestamp: new Date().toISOString(),
        data: { 
          user,
          message: `${user.name} is requesting access to join the session`
        }
      });
    });
  }

  private async pauseSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.isActive = false;
    
    // TODO: Save session record to database
    await this.persistSessionRecord(session);
    
    this.emit('session_paused', { sessionId, session });
  }

  private async persistMarkup(markupData: any): Promise<void> {
    // TODO: Implement database persistence
    console.log('Persisting markup:', markupData);
  }

  private async persistSessionRecord(session: CollaborationSession): Promise<void> {
    // TODO: Implement database persistence
    console.log('Persisting session record:', session.id);
  }

  // Export and Reporting
  async exportSessionRecord(sessionId: string, format: 'json' | 'pdf' | 'csv'): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    switch (format) {
      case 'json':
        return JSON.stringify(session.record, null, 2);
      case 'csv':
        return this.exportSessionToCSV(session);
      case 'pdf':
        return await this.exportSessionToPDF(session);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private exportSessionToCSV(session: CollaborationSession): string {
    const headers = ['Timestamp', 'User', 'Event Type', 'Details'];
    const rows = session.record.map(event => [
      event.timestamp,
      event.userId,
      event.type,
      JSON.stringify(event.data)
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  private async exportSessionToPDF(session: CollaborationSession): Promise<string> {
    // TODO: Implement PDF generation using puppeteer or similar
    throw new Error('PDF export not yet implemented');
  }

  // Cleanup
  destroy(): void {
    this.activityTimers.forEach(timer => clearTimeout(timer));
    this.activityTimers.clear();
    this.connections.clear();
    this.sessions.clear();
    this.teamsIntegrations.clear();
  }
}

// Singleton instance
export const collaborationService = new EnhancedCollaborationService();
export default collaborationService;