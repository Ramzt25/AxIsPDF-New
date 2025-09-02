// Dashboard Data Service - Centralized data management for SocialDashboard
import { collaborationService } from './collaboration';

export interface ActivityItem {
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

export interface MeetingInvite {
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

export interface DashboardData {
  activities: ActivityItem[];
  meetingInvites: MeetingInvite[];
  lastUpdated: Date;
}

class DashboardDataService {
  private data: DashboardData = {
    activities: [],
    meetingInvites: [],
    lastUpdated: new Date()
  };

  private subscribers: Array<(data: DashboardData) => void> = [];
  private isInitialized = false;

  // Initialize the service
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load data from multiple sources
      await this.loadActivities(userId);
      await this.loadMeetingInvites(userId);
      
      // Set up real-time updates
      this.setupRealtimeUpdates();
      
      this.isInitialized = true;
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to initialize dashboard data service:', error);
      // Fall back to sample data for development
      this.loadSampleData();
    }
  }

  // Subscribe to data changes
  subscribe(callback: (data: DashboardData) => void): () => void {
    this.subscribers.push(callback);
    // Immediately call with current data
    callback(this.data);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  // Get current data
  getData(): DashboardData {
    return { ...this.data };
  }

  // Load activities from various sources
  private async loadActivities(userId: string): Promise<void> {
    try {
      // In a real implementation, this would aggregate from:
      // - Collaboration service (threads, comments)
      // - Project management API (tasks, RFIs)
      // - Meeting service (meeting activities)
      // - File sharing service (document shares)
      
      const activities: ActivityItem[] = [
        // Sample activities for development - replace with real API calls
        ...this.generateRecentActivities(userId),
        ...await this.loadCollaborationActivities(userId),
        ...await this.loadProjectActivities(userId),
        ...await this.loadMeetingActivities(userId)
      ];

      // Sort by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      this.data.activities = activities;
    } catch (error) {
      console.error('Failed to load activities:', error);
      // Use sample data as fallback
      this.data.activities = this.generateRecentActivities(userId);
    }
  }

  // Load meeting invites
  private async loadMeetingInvites(userId: string): Promise<void> {
    try {
      // In a real implementation, integrate with calendar/meeting services
      const invites: MeetingInvite[] = [
        ...this.generateSampleMeetingInvites(userId),
        // Add real meeting service integration here
      ];

      // Filter for upcoming meetings only
      const now = new Date();
      this.data.meetingInvites = invites.filter(invite => 
        new Date(invite.scheduledTime) > now
      );
    } catch (error) {
      console.error('Failed to load meeting invites:', error);
      this.data.meetingInvites = this.generateSampleMeetingInvites(userId);
    }
  }

  // Load activities from collaboration service
  private async loadCollaborationActivities(userId: string): Promise<ActivityItem[]> {
    try {
      // Use existing collaboration service methods
      // In the real implementation, add methods to get recent activities
      console.log('Loading collaboration activities for user:', userId);
      return [];
    } catch (error) {
      console.warn('Failed to load collaboration activities:', error);
      return [];
    }
  }

  // Load activities from project management
  private async loadProjectActivities(userId: string): Promise<ActivityItem[]> {
    try {
      // Integrate with project management API for tasks, RFIs, etc.
      // This would typically call a project management service
      return [];
    } catch (error) {
      console.warn('Failed to load project activities:', error);
      return [];
    }
  }

  // Load activities from meeting service
  private async loadMeetingActivities(userId: string): Promise<ActivityItem[]> {
    try {
      // Integrate with meeting service for recent meeting activities
      return [];
    } catch (error) {
      console.warn('Failed to load meeting activities:', error);
      return [];
    }
  }

  // Generate sample activities for development
  private generateRecentActivities(userId: string): ActivityItem[] {
    const baseTime = Date.now();
    return [
      {
        id: 'sample-1',
        type: 'message',
        projectId: 'proj-1',
        projectName: 'Downtown Office Complex',
        sheetName: 'Floor Plan - Level 1',
        title: 'Electrical outlet placement question',
        description: `@${userId} Can you verify the outlet locations on the east wall? The specs seem inconsistent.`,
        authorName: 'Sarah Johnson',
        authorAvatar: '👩‍💼',
        timestamp: new Date(baseTime - 15 * 60 * 1000).toISOString(),
        priority: 'medium',
        status: 'open',
        participants: [userId, 'sarah.johnson'],
        attachments: 1
      },
      {
        id: 'sample-2',
        type: 'task',
        projectId: 'proj-1',
        projectName: 'Downtown Office Complex',
        sheetName: 'HVAC Plan',
        title: 'Review ductwork routing',
        description: 'Task assigned: Review the proposed ductwork routing and provide feedback by EOD.',
        authorName: 'Mike Chen',
        authorAvatar: '👨‍🔧',
        timestamp: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        status: 'in-progress',
        participants: [userId, 'mike.chen'],
        attachments: 3
      },
      {
        id: 'sample-3',
        type: 'rfi',
        projectId: 'proj-2',
        projectName: 'Riverside Apartments',
        sheetName: 'Structural Plans',
        title: 'Beam specification clarification',
        description: 'RFI #2024-015: Please clarify the beam specifications for the lobby area.',
        authorName: 'David Wilson',
        authorAvatar: '👨‍💼',
        timestamp: new Date(baseTime - 4 * 60 * 60 * 1000).toISOString(),
        priority: 'critical',
        status: 'open',
        participants: ['david.wilson', userId],
        attachments: 2
      }
    ];
  }

  // Generate sample meeting invites
  private generateSampleMeetingInvites(userId: string): MeetingInvite[] {
    const baseTime = Date.now();
    return [
      {
        id: 'meeting-1',
        title: 'Site Progress Review - Building A',
        projectName: 'Downtown Office Complex',
        scheduledTime: new Date(baseTime + 60 * 60 * 1000).toISOString(), // 1 hour from now
        organizer: 'John Smith',
        attendees: [userId, 'sarah.johnson', 'mike.chen'],
        agenda: 'Weekly progress review for the main construction building',
        meetingUrl: 'https://meet.teambeam.com/room/building-a-progress',
        status: 'pending'
      },
      {
        id: 'meeting-2',
        title: 'Safety Briefing - Q3',
        projectName: 'Multiple Projects',
        scheduledTime: new Date(baseTime + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        organizer: 'Lisa Anderson',
        attendees: [userId, 'all-staff'],
        agenda: 'Quarterly safety review and incident prevention',
        meetingUrl: 'https://meet.teambeam.com/room/safety-q3',
        status: 'pending'
      }
    ];
  }

  // Set up real-time updates
  private setupRealtimeUpdates(): void {
    // In a real implementation, this would integrate with a real-time service
    // For now, use periodic refresh
    setInterval(() => {
      this.refreshData();
    }, 5 * 60 * 1000); // Refresh every 5 minutes
  }

  // Handle thread updates
  private handleThreadUpdate(thread: any): void {
    const activity: ActivityItem = {
      id: `collab-${thread.id}`,
      type: 'message',
      projectId: thread.projectId || 'unknown',
      projectName: thread.projectName || 'Unknown Project',
      sheetName: thread.sheetName,
      title: thread.title,
      description: thread.lastMessage || thread.description,
      authorName: thread.lastAuthor || thread.authorName,
      timestamp: new Date().toISOString(),
      priority: thread.priority as ActivityItem['priority'],
      status: thread.status === 'resolved' ? 'resolved' : 'open',
      participants: thread.participants?.map((p: any) => p.name) || [],
      attachments: thread.attachmentCount || 0
    };

    // Update or add activity
    const existingIndex = this.data.activities.findIndex(a => a.id === activity.id);
    if (existingIndex >= 0) {
      this.data.activities[existingIndex] = activity;
    } else {
      this.data.activities.unshift(activity);
    }

    // Keep only recent activities (last 50)
    this.data.activities = this.data.activities.slice(0, 50);
    this.data.lastUpdated = new Date();
    this.notifySubscribers();
  }

  // Handle new messages
  private handleNewMessage(message: any): void {
    // Create activity for new message if it's relevant to current user
    this.handleThreadUpdate(message.thread);
  }

  // Refresh data periodically
  private async refreshData(): Promise<void> {
    try {
      // Refresh activities and meeting invites
      await this.loadActivities('current-user'); // In real implementation, get from auth service
      await this.loadMeetingInvites('current-user');
      this.data.lastUpdated = new Date();
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
    }
  }

  // Load sample data as fallback
  private loadSampleData(): void {
    this.data.activities = this.generateRecentActivities('current-user');
    this.data.meetingInvites = this.generateSampleMeetingInvites('current-user');
    this.data.lastUpdated = new Date();
  }

  // Notify all subscribers of data changes
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.data);
      } catch (error) {
        console.error('Error in dashboard data subscriber:', error);
      }
    });
  }

  // Filter activities
  filterActivities(filter: 'all' | 'mentions' | 'tasks' | 'meetings', userId: string): ActivityItem[] {
    let filtered = this.data.activities;

    switch (filter) {
      case 'mentions':
        filtered = filtered.filter(activity => 
          activity.description.includes(`@${userId}`) ||
          activity.participants?.includes(userId)
        );
        break;
      case 'tasks':
        filtered = filtered.filter(activity => activity.type === 'task');
        break;
      case 'meetings':
        filtered = filtered.filter(activity => activity.type === 'meeting');
        break;
      case 'all':
      default:
        // No filtering
        break;
    }

    return filtered;
  }

  // Search activities
  searchActivities(query: string): ActivityItem[] {
    if (!query.trim()) return this.data.activities;

    const searchTerm = query.toLowerCase();
    return this.data.activities.filter(activity =>
      activity.title.toLowerCase().includes(searchTerm) ||
      activity.description.toLowerCase().includes(searchTerm) ||
      activity.projectName.toLowerCase().includes(searchTerm) ||
      activity.authorName.toLowerCase().includes(searchTerm)
    );
  }

  // Mark activity as read/handled
  markActivityHandled(activityId: string): void {
    const activity = this.data.activities.find(a => a.id === activityId);
    if (activity && activity.status === 'open') {
      activity.status = 'in-progress';
      this.notifySubscribers();
    }
  }

  // Respond to meeting invite
  respondToMeetingInvite(inviteId: string, response: 'accepted' | 'declined'): void {
    const invite = this.data.meetingInvites.find(i => i.id === inviteId);
    if (invite) {
      invite.status = response;
      this.notifySubscribers();
    }
  }

  // Clean up resources
  cleanup(): void {
    this.subscribers = [];
    this.isInitialized = false;
    // Cleanup other resources as needed
  }
}

// Export singleton instance
export const dashboardDataService = new DashboardDataService();