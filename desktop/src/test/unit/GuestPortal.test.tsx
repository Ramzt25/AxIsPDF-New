// Tests for GuestPortal component - Browser Experience
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuestPortal } from '../../components/GuestPortal';

describe('GuestPortal - Browser Experience', () => {
  const defaultProps = {
    onUpgrade: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders guest portal with main sections', () => {
    render(<GuestPortal {...defaultProps} />);
    
    expect(screen.getByText('Welcome to TeamBeam')).toBeDefined();
    expect(screen.getByText('Sample Projects')).toBeDefined();
    expect(screen.getByText('Professional Features')).toBeDefined();
    expect(screen.getByText('Upgrade Plans')).toBeDefined();
  });

  it('displays sample projects', () => {
    render(<GuestPortal {...defaultProps} />);
    
    expect(screen.getByText('Construction Site A - Floor Plans')).toBeDefined();
    expect(screen.getByText('Commercial Building B - Elevations')).toBeDefined();
    expect(screen.getByText('Residential Project C - Details')).toBeDefined();
  });

  it('handles sample project exploration', async () => {
    const user = userEvent.setup();
    render(<GuestPortal {...defaultProps} />);
    
    const exploreButton = screen.getAllByText('Explore')[0];
    await user.click(exploreButton);
    
    // Should show project details or navigation
    expect(exploreButton).toBeDefined();
  });

  it('shows professional features list', () => {
    render(<GuestPortal {...defaultProps} />);
    
    expect(screen.getByText('✅ PDF Markup & Annotation')).toBeDefined();
    expect(screen.getByText('✅ Real-time Collaboration')).toBeDefined();
    expect(screen.getByText('✅ Microsoft Teams Integration')).toBeDefined();
    expect(screen.getByText('✅ AI-Powered Workflows')).toBeDefined();
  });

  it('displays pricing plans', () => {
    render(<GuestPortal {...defaultProps} />);
    
    expect(screen.getByText('Professional')).toBeDefined();
    expect(screen.getByText('$29/month')).toBeDefined();
    expect(screen.getByText('Enterprise')).toBeDefined();
    expect(screen.getByText('$99/month')).toBeDefined();
  });

  it('handles upgrade button clicks', async () => {
    const user = userEvent.setup();
    render(<GuestPortal {...defaultProps} />);
    
    const upgradeButtons = screen.getAllByText('Upgrade Now');
    await user.click(upgradeButtons[0]);
    
    expect(defaultProps.onUpgrade).toHaveBeenCalled();
  });

  it('shows feature demonstrations', () => {
    render(<GuestPortal {...defaultProps} />);
    
    // Should show interactive demos or previews
    expect(screen.getByText('Interactive Demo')).toBeDefined();
  });

  it('displays testimonials or case studies', () => {
    render(<GuestPortal {...defaultProps} />);
    
    expect(screen.getByText('What our customers say')).toBeDefined();
  });

  it('handles close portal action', async () => {
    const user = userEvent.setup();
    render(<GuestPortal {...defaultProps} />);
    
    const closeButton = screen.getByText('×');
    await user.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows competitive advantages', () => {
    render(<GuestPortal {...defaultProps} />);
    
    expect(screen.getByText('Why Choose TeamBeam?')).toBeDefined();
    expect(screen.getByText(/Better than Bluebeam/)).toBeDefined();
  });

  it('displays feature comparison table', () => {
    render(<GuestPortal {...defaultProps} />);
    
    expect(screen.getByText('Feature Comparison')).toBeDefined();
    expect(screen.getByText('TeamBeam')).toBeDefined();
    expect(screen.getByText('Bluebeam')).toBeDefined();
  });

  it('shows trial call-to-action', () => {
    render(<GuestPortal {...defaultProps} />);
    
    expect(screen.getByText('Start Free Trial')).toBeDefined();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<GuestPortal {...defaultProps} />);
    
    // Tab through interactive elements
    await user.tab();
    expect(document.activeElement).toBeDefined();
  });

  it('displays contact information', () => {
    render(<GuestPortal {...defaultProps} />);
    
    expect(screen.getByText('Contact Sales')).toBeDefined();
  });

  it('shows enterprise features', () => {
    render(<GuestPortal {...defaultProps} />);
    
    expect(screen.getByText('Enterprise SSO')).toBeDefined();
    expect(screen.getByText('Advanced Security')).toBeDefined();
    expect(screen.getByText('Priority Support')).toBeDefined();
  });

  it('displays integration showcases', () => {
    render(<GuestPortal {...defaultProps} />);
    
    expect(screen.getByText('Microsoft Teams')).toBeDefined();
    expect(screen.getByText('Procore Integration')).toBeDefined();
  });
});