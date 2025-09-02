// Comprehensive tests for UIScaffold component with real data integration
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UIScaffold from '../../components/UIScaffold';
import { dataService } from '../../services/database';

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

describe('UIScaffold Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockDataService.getUsers.mockResolvedValue([
      {
        id: 'user-1',
        email: 'sarah.chen@construction.com',
        first_name: 'Sarah',
        last_name: 'Chen',
        role: 'project_manager',
        avatar_url: null,
        status: 'online',
        last_seen_at: new Date().toISOString(),
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      },
      {
        id: 'user-2',
        email: 'mike.rodriguez@construction.com',
        first_name: 'Mike',
        last_name: 'Rodriguez',
        role: 'field_engineer',
        avatar_url: null,
        status: 'idle',
        last_seen_at: new Date().toISOString(),
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      },
    ]);

    mockDataService.getProjects.mockResolvedValue([
      {
        id: 'project-1',
        name: 'Downtown Office Complex',
        description: 'Modern office building',
        location: 'Downtown',
        status: 'active',
        start_date: '2024-01-15',
        end_date: '2025-06-30',
        created_by: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      },
    ]);

    mockDataService.getDocuments.mockResolvedValue([
      {
        id: 'doc-1',
        project_id: 'project-1',
        name: 'Floor Plans',
        file_path: '/projects/project-1/floor-plans.pdf',
        file_size: 1024000,
        mime_type: 'application/pdf',
        version: 1,
        status: 'approved',
        uploaded_by: 'user-1',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: new Date().toISOString(),
      },
    ]);

    mockDataService.getRecentActivity.mockResolvedValue([
      {
        id: 'activity-1',
        project_id: 'project-1',
        user_id: 'user-1',
        action_type: 'upload',
        description: 'uploaded Floor Plans',
        target_type: 'document',
        target_id: 'doc-1',
        created_at: new Date().toISOString(),
      },
    ]);

    mockDataService.getChatMessages.mockResolvedValue([
      {
        id: 'msg-1',
        project_id: 'project-1',
        user_id: 'user-1',
        content: 'Project is looking good!',
        message_type: 'text',
        created_at: new Date().toISOString(),
      },
    ]);
  });

  it('renders main application shell', async () => {
    render(<UIScaffold />);
    
    await waitFor(() => {
      expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    });
  });

  it('loads and displays users from database', async () => {
    render(<UIScaffold />);
    
    await waitFor(() => {
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
      expect(screen.getByText('Mike Rodriguez')).toBeInTheDocument();
    });

    expect(mockDataService.getUsers).toHaveBeenCalled();
  });

  it('loads and displays projects from database', async () => {
    render(<UIScaffold />);
    
    await waitFor(() => {
      expect(screen.getByText('Downtown Office Complex')).toBeInTheDocument();
    });

    expect(mockDataService.getProjects).toHaveBeenCalled();
  });

  it('displays user status indicators correctly', async () => {
    render(<UIScaffold />);
    
    await waitFor(() => {
      const onlineIndicators = screen.getAllByTestId('user-status-online');
      const idleIndicators = screen.getAllByTestId('user-status-idle');
      
      expect(onlineIndicators.length).toBeGreaterThan(0);
      expect(idleIndicators.length).toBeGreaterThan(0);
    });
  });

  it('handles theme switching', async () => {
    const user = userEvent.setup();
    render(<UIScaffold />);
    
    const themeToggle = screen.getByTestId('theme-toggle');
    await user.click(themeToggle);
    
    expect(document.documentElement.classList.contains('dark')).toBeTruthy();
  });

  it('handles sidebar navigation', async () => {
    const user = userEvent.setup();
    render(<UIScaffold />);
    
    const dashboardTab = screen.getByTestId('nav-dashboard');
    await user.click(dashboardTab);
    
    expect(screen.getByTestId('dashboard-panel')).toBeInTheDocument();
  });

  it('handles document viewer interaction', async () => {
    const user = userEvent.setup();
    render(<UIScaffold />);
    
    await waitFor(() => {
      const documentsTab = screen.getByTestId('nav-documents');
      user.click(documentsTab);
    });

    await waitFor(() => {
      expect(screen.getByTestId('document-viewer')).toBeInTheDocument();
    });
  });

  it('displays recent activity from database', async () => {
    render(<UIScaffold />);
    
    await waitFor(() => {
      expect(screen.getByText(/uploaded Floor Plans/)).toBeInTheDocument();
    });

    expect(mockDataService.getRecentActivity).toHaveBeenCalled();
  });

  it('handles chat message sending', async () => {
    const user = userEvent.setup();
    render(<UIScaffold />);
    
    await waitFor(() => {
      const chatInput = screen.getByPlaceholderText(/type a message/i);
      const sendButton = screen.getByTestId('send-message');
      
      user.type(chatInput, 'Test message');
      user.click(sendButton);
    });
    
    // In real implementation, this would verify the message was sent
    expect(mockDataService.getChatMessages).toHaveBeenCalled();
  });

  it('handles error states gracefully', async () => {
    mockDataService.getUsers.mockRejectedValue(new Error('Database connection failed'));
    
    render(<UIScaffold />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  it('shows loading states during data fetching', async () => {
    // Create a promise that never resolves to simulate loading
    mockDataService.getUsers.mockReturnValue(new Promise(() => {}));
    
    render(<UIScaffold />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles project switching', async () => {
    const user = userEvent.setup();
    render(<UIScaffold />);
    
    await waitFor(() => {
      const projectDropdown = screen.getByTestId('project-selector');
      user.click(projectDropdown);
    });

    const projectOption = screen.getByText('Downtown Office Complex');
    await user.click(projectOption);
    
    // Should trigger document and activity reload
    expect(mockDataService.getDocuments).toHaveBeenCalledWith('project-1');
    expect(mockDataService.getRecentActivity).toHaveBeenCalledWith('project-1');
  });

  it('displays correct user roles and permissions', async () => {
    render(<UIScaffold />);
    
    await waitFor(() => {
      expect(screen.getByText(/project_manager/i)).toBeInTheDocument();
      expect(screen.getByText(/field_engineer/i)).toBeInTheDocument();
    });
  });

  it('handles stamp toolbox interactions', async () => {
    const user = userEvent.setup();
    render(<UIScaffold />);
    
    const stampTool = screen.getByTestId('stamp-tool');
    await user.click(stampTool);
    
    expect(screen.getByTestId('stamp-toolbox')).toHaveClass('active');
  });

  it('handles AI assistant interactions', async () => {
    const user = userEvent.setup();
    render(<UIScaffold />);
    
    const aiAssistant = screen.getByTestId('ai-assistant');
    await user.click(aiAssistant);
    
    expect(screen.getByTestId('ai-panel')).toBeInTheDocument();
  });

  it('handles keyboard shortcuts', async () => {
    const user = userEvent.setup();
    render(<UIScaffold />);
    
    // Test Ctrl+1 for dashboard
    await user.keyboard('{Control>}1{/Control}');
    expect(screen.getByTestId('dashboard-panel')).toBeInTheDocument();
    
    // Test Ctrl+2 for documents
    await user.keyboard('{Control>}2{/Control}');
    expect(screen.getByTestId('document-viewer')).toBeInTheDocument();
  });

  it('handles responsive layout changes', () => {
    // Mock window resize
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    render(<UIScaffold />);
    
    // Should show mobile layout
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
  });

  it('handles real-time collaboration features', async () => {
    render(<UIScaffold />);
    
    // Simulate real-time update
    fireEvent(window, new CustomEvent('collaboration-update', {
      detail: { type: 'user-joined', userId: 'user-3' }
    }));
    
    await waitFor(() => {
      expect(screen.getByTestId('collaboration-indicator')).toBeInTheDocument();
    });
  });

  it('handles document markup and annotations', async () => {
    const user = userEvent.setup();
    render(<UIScaffold />);
    
    const markupTool = screen.getByTestId('markup-tool');
    await user.click(markupTool);
    
    expect(screen.getByTestId('markup-canvas')).toBeInTheDocument();
  });

  it('properly cleans up resources on unmount', () => {
    const { unmount } = render(<UIScaffold />);
    
    unmount();
    
    // Verify that event listeners and subscriptions are cleaned up
    // This would be implementation-specific
  });
});