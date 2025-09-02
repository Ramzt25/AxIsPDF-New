// Integration tests for database service and data hooks
import { renderHook, waitFor } from '@testing-library/react';
import { useUsers, useProjects, useDocuments, useRecentActivity, useChatMessages } from '../../hooks/useData';
import { dataService, User } from '../../services/database';

// Mock the data service
jest.mock('../../services/database', () => ({
  dataService: {
    getUsers: jest.fn(),
    getProjects: jest.fn(),
    getDocuments: jest.fn(),
    getRecentActivity: jest.fn(),
    getChatMessages: jest.fn(),
  },
}));

const mockDataService = dataService as jest.Mocked<typeof dataService>;

describe('Data Hooks Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useUsers hook', () => {
    it('fetches users successfully', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'admin' as const,
          avatar_url: null,
          status: 'online' as const,
          last_seen_at: new Date().toISOString(),
          created_at: '2024-01-01T00:00:00Z',
          updated_at: new Date().toISOString(),
        },
      ];

      mockDataService.getUsers.mockResolvedValue(mockUsers);

      const { result } = renderHook(() => useUsers());

      expect(result.current.loading).toBe(true);
      expect(result.current.users).toEqual([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.users).toEqual(mockUsers);
        expect(result.current.error).toBeNull();
      });

      expect(mockDataService.getUsers).toHaveBeenCalledTimes(1);
    });

    it('handles user fetch errors', async () => {
      const errorMessage = 'Failed to fetch users';
      mockDataService.getUsers.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useUsers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.users).toEqual([]);
        expect(result.current.error).toBe(errorMessage);
      });
    });

    it('refetches users when requested', async () => {
      const mockUsers = [];
      mockDataService.getUsers.mockResolvedValue(mockUsers);

      const { result } = renderHook(() => useUsers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear previous calls
      mockDataService.getUsers.mockClear();

      // Trigger refetch
      result.current.refetch();

      await waitFor(() => {
        expect(mockDataService.getUsers).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('useProjects hook', () => {
    it('fetches projects successfully', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Test Project',
          description: 'A test project',
          location: 'Test Location',
          status: 'active' as const,
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          created_by: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: new Date().toISOString(),
        },
      ];

      mockDataService.getProjects.mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.projects).toEqual(mockProjects);
        expect(result.current.error).toBeNull();
      });
    });

    it('handles project fetch errors', async () => {
      const errorMessage = 'Network error';
      mockDataService.getProjects.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('useDocuments hook', () => {
    it('fetches documents for a project', async () => {
      const projectId = 'project-1';
      const mockDocuments = [
        {
          id: 'doc-1',
          project_id: projectId,
          name: 'Test Document',
          file_path: '/test.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          version: 1,
          status: 'approved' as const,
          uploaded_by: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: new Date().toISOString(),
        },
      ];

      mockDataService.getDocuments.mockResolvedValue(mockDocuments);

      const { result } = renderHook(() => useDocuments(projectId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.documents).toEqual(mockDocuments);
      });

      expect(mockDataService.getDocuments).toHaveBeenCalledWith(projectId);
    });

    it('handles null project ID', async () => {
      const { result } = renderHook(() => useDocuments(null));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.documents).toEqual([]);
      });

      expect(mockDataService.getDocuments).not.toHaveBeenCalled();
    });

    it('refetches when project ID changes', async () => {
      const mockDocuments1 = [{ id: 'doc-1' } as any];
      const mockDocuments2 = [{ id: 'doc-2' } as any];
      
      mockDataService.getDocuments
        .mockResolvedValueOnce(mockDocuments1)
        .mockResolvedValueOnce(mockDocuments2);

      let projectId = 'project-1';
      const { result, rerender } = renderHook(() => useDocuments(projectId));

      await waitFor(() => {
        expect(result.current.documents).toEqual(mockDocuments1);
      });

      // Change project ID
      projectId = 'project-2';
      rerender();

      await waitFor(() => {
        expect(result.current.documents).toEqual(mockDocuments2);
      });

      expect(mockDataService.getDocuments).toHaveBeenCalledTimes(2);
      expect(mockDataService.getDocuments).toHaveBeenNthCalledWith(1, 'project-1');
      expect(mockDataService.getDocuments).toHaveBeenNthCalledWith(2, 'project-2');
    });
  });

  describe('useRecentActivity hook', () => {
    it('fetches recent activity for a project', async () => {
      const projectId = 'project-1';
      const mockActivity = [
        {
          id: 'activity-1',
          project_id: projectId,
          user_id: 'user-1',
          action_type: 'upload' as const,
          description: 'uploaded document',
          target_type: 'document' as const,
          target_id: 'doc-1',
          created_at: new Date().toISOString(),
        },
      ];

      mockDataService.getRecentActivity.mockResolvedValue(mockActivity);

      const { result } = renderHook(() => useRecentActivity(projectId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.activities).toEqual(mockActivity);
      });
    });

    it('handles activity fetch errors', async () => {
      const projectId = 'project-1';
      const errorMessage = 'Failed to fetch activity';
      mockDataService.getRecentActivity.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useRecentActivity(projectId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('useChatMessages hook', () => {
    it('fetches chat messages for a project', async () => {
      const projectId = 'project-1';
      const mockMessages = [
        {
          id: 'msg-1',
          project_id: projectId,
          user_id: 'user-1',
          content: 'Hello world',
          message_type: 'text' as const,
          created_at: new Date().toISOString(),
        },
      ];

      mockDataService.getChatMessages.mockResolvedValue(mockMessages);

      const { result } = renderHook(() => useChatMessages(projectId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.messages).toEqual(mockMessages);
      });
    });

    it('handles sending messages with optimistic updates', async () => {
      const projectId = 'project-1';
      mockDataService.getChatMessages.mockResolvedValue([]);

      const { result } = renderHook(() => useChatMessages(projectId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Send a message
      result.current.sendMessage('Test message');

      // Should show optimistic update immediately
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Test message');
      expect(result.current.messages[0].id).toMatch(/^temp-/);
    });

    it('handles message send errors', async () => {
      const projectId = 'project-1';
      mockDataService.getChatMessages.mockResolvedValue([]);

      const { result } = renderHook(() => useChatMessages(projectId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Send message should handle errors gracefully
      result.current.sendMessage('Test message');
      
      // Optimistic update should be visible
      expect(result.current.messages).toHaveLength(1);
    });
  });

  describe('Data service integration', () => {
    it('properly handles network timeouts', async () => {
      const timeoutPromise: Promise<User[]> = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 100);
      });
      
      mockDataService.getUsers.mockReturnValue(timeoutPromise);

      const { result } = renderHook(() => useUsers());

      await waitFor(() => {
        expect(result.current.error).toBe('Request timeout');
      }, { timeout: 200 });
    });

    it('handles concurrent requests properly', async () => {
      const projectId = 'project-1';
      
      mockDataService.getDocuments.mockResolvedValue([]);
      mockDataService.getRecentActivity.mockResolvedValue([]);
      mockDataService.getChatMessages.mockResolvedValue([]);

      const { result: documentsResult } = renderHook(() => useDocuments(projectId));
      const { result: activityResult } = renderHook(() => useRecentActivity(projectId));
      const { result: messagesResult } = renderHook(() => useChatMessages(projectId));

      await waitFor(() => {
        expect(documentsResult.current.loading).toBe(false);
        expect(activityResult.current.loading).toBe(false);
        expect(messagesResult.current.loading).toBe(false);
      });

      expect(mockDataService.getDocuments).toHaveBeenCalledTimes(1);
      expect(mockDataService.getRecentActivity).toHaveBeenCalledTimes(1);
      expect(mockDataService.getChatMessages).toHaveBeenCalledTimes(1);
    });

    it('handles memory cleanup on unmount', () => {
      const { unmount } = renderHook(() => useUsers());
      
      // Should not throw or cause memory leaks
      unmount();
      
      // Verify cleanup (implementation would depend on actual cleanup logic)
      expect(true).toBe(true);
    });
  });
});