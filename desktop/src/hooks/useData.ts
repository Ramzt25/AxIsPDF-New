// React hooks for data management with real database integration
import { useState, useEffect, useCallback } from 'react';
import { dataService, User, Project, Document, Activity, ChatMessage } from '../services/database';

// Custom hook for users
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
}

// Custom hook for projects
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, error, refetch: fetchProjects };
}

// Custom hook for documents
export function useDocuments(projectId: string | null) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!projectId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getDocuments(projectId);
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return { documents, loading, error, refetch: fetchDocuments };
}

// Custom hook for recent activity
export function useRecentActivity(projectId: string | null) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    if (!projectId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getRecentActivity(projectId);
      setActivities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return { activities, loading, error, refetch: fetchActivity };
}

// Custom hook for chat messages
export function useChatMessages(projectId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!projectId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await dataService.getChatMessages(projectId);
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = useCallback(async (content: string, messageType: 'text' | 'ai_response' = 'text') => {
    if (!projectId) return;

    // Add optimistic update
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      project_id: projectId,
      user_id: 'current-user', // This would come from auth context
      content,
      message_type: messageType,
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [tempMessage, ...prev]);

    try {
      // In real implementation, this would make an API call
      // await dataService.sendMessage(projectId, content, messageType);
      // Then refetch to get the real message with proper ID
      fetchMessages();
    } catch (err) {
      // Remove optimistic update on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  }, [projectId, fetchMessages]);

  return { messages, loading, error, refetch: fetchMessages, sendMessage };
}

// Custom hook for current user context
export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In development, use mock current user
    const mockCurrentUser: User = {
      id: 'current-user',
      email: 'current@teambeam.app',
      first_name: 'Current',
      last_name: 'User',
      role: 'project_manager',
      avatar_url: null,
      status: 'online',
      last_seen_at: new Date().toISOString(),
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    };

    setCurrentUser(mockCurrentUser);
    setLoading(false);
  }, []);

  return { currentUser, loading };
}

// Helper function to format user display name
export function formatUserName(user: User): string {
  return `${user.first_name} ${user.last_name}`;
}

// Helper function to format relative time
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return time.toLocaleDateString();
}

// Helper function to get user status color
export function getUserStatusColor(status: User['status']): string {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'idle': return 'bg-yellow-500';
    case 'offline': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
}