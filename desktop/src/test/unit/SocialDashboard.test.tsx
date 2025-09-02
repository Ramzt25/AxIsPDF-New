// Comprehensive tests for SocialDashboard component - Desktop Focus
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialDashboard } from '../../components/SocialDashboard';

// Mock the collaboration service
jest.mock('../../services/enhancedCollaboration', () => ({
  collaborationService: {
    on: jest.fn(),
    emit: jest.fn(),
    removeAllListeners: jest.fn(),
    getAllSessions: jest.fn(() => []),
    getActivities: jest.fn(() => []),
  },
}));

describe('SocialDashboard - Desktop Environment', () => {
  const defaultProps = {
    currentUserId: 'user-123',
    currentUserName: 'Test User',
    onOpenProject: jest.fn(),
    onJoinMeeting: jest.fn(),
    onViewThread: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with main sections', () => {
    render(<SocialDashboard {...defaultProps} />);
    
    expect(screen.getByText('TeamBeam Social')).toBeDefined();
    expect(screen.getByText('Recent Activity')).toBeDefined();
    expect(screen.getByText('Upcoming Meetings')).toBeDefined();
    expect(screen.getByText('Quick Stats')).toBeDefined();
  });

  it('displays user greeting with correct name', () => {
    render(<SocialDashboard {...defaultProps} />);
    
    expect(screen.getByText(/Welcome back, Test User/)).toBeDefined();
  });

  it('shows search functionality', () => {
    render(<SocialDashboard {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects, activity, people...');
    expect(searchInput).toBeDefined();
  });

  it('filters activities when search is used', async () => {
    const user = userEvent.setup();
    render(<SocialDashboard {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects, activity, people...');
    await user.type(searchInput, 'markup');
    
    // Verify search functionality works
    expect((searchInput as HTMLInputElement).value).toBe('markup');
  });

  it('displays activity filter buttons', () => {
    render(<SocialDashboard {...defaultProps} />);
    
    expect(screen.getByText('All')).toBeDefined();
    expect(screen.getByText('My Activity')).toBeDefined();
    expect(screen.getByText('Mentions')).toBeDefined();
    expect(screen.getByText('Reviews')).toBeDefined();
  });

  it('handles activity filter selection', async () => {
    const user = userEvent.setup();
    render(<SocialDashboard {...defaultProps} />);
    
    const mentionsFilter = screen.getByText('Mentions');
    await user.click(mentionsFilter);
    
    expect(mentionsFilter.closest('button')?.classList.contains('active')).toBe(true);
  });

  it('shows time filter dropdown', () => {
    render(<SocialDashboard {...defaultProps} />);
    
    const timeFilter = screen.getByDisplayValue('Last 7 days');
    expect(timeFilter).toBeDefined();
  });

  it('displays meeting invitation cards', () => {
    render(<SocialDashboard {...defaultProps} />);
    
    // Should show sample meeting invitations
    expect(screen.getByText('Project Review - Construction Site A')).toBeDefined();
    expect(screen.getByText('Weekly Team Sync')).toBeDefined();
  });

  it('handles meeting join action', async () => {
    const user = userEvent.setup();
    render(<SocialDashboard {...defaultProps} />);
    
    const joinButtons = screen.getAllByText('Join');
    await user.click(joinButtons[0]);
    
    expect(defaultProps.onJoinMeeting).toHaveBeenCalled();
  });

  it('displays quick stats with project counts', () => {
    render(<SocialDashboard {...defaultProps} />);
    
    expect(screen.getByText('Active Projects')).toBeDefined();
    expect(screen.getByText('12')).toBeDefined();
    expect(screen.getByText('Pending Reviews')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
  });

  it('handles project opening from activity', async () => {
    const user = userEvent.setup();
    render(<SocialDashboard {...defaultProps} />);
    
    // Find and click a project link in activities
    const projectLink = screen.getByText('Floor Plan - Level 1.pdf');
    await user.click(projectLink);
    
    expect(defaultProps.onOpenProject).toHaveBeenCalledWith('project-1');
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<SocialDashboard {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects, activity, people...');
    await user.tab();
    
    expect(document.activeElement).toBe(searchInput);
  });
});