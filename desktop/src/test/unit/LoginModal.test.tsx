// Tests for LoginModal component - Desktop Developer Features
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginModal } from '../../components/LoginModal';

describe('LoginModal - Desktop Developer Mode', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onLogin: jest.fn(),
    isDeveloperMode: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login modal when open', () => {
    render(<LoginModal {...defaultProps} />);
    
    expect(screen.getByText('Welcome to TeamBeam')).toBeDefined();
  });

  it('shows developer mode features when enabled', () => {
    render(<LoginModal {...defaultProps} />);
    
    expect(screen.getByText('🚀 Developer Mode')).toBeDefined();
    expect(screen.getByText('Quick Login')).toBeDefined();
  });

  it('handles quick admin login', async () => {
    const user = userEvent.setup();
    render(<LoginModal {...defaultProps} />);
    
    const adminButton = screen.getByText('Admin');
    await user.click(adminButton);
    
    expect(defaultProps.onLogin).toHaveBeenCalledWith({
      id: 'dev-admin',
      name: 'Developer Admin',
      email: 'admin@teambeam.dev',
      role: 'admin'
    });
  });

  it('handles quick user login', async () => {
    const user = userEvent.setup();
    render(<LoginModal {...defaultProps} />);
    
    const userButton = screen.getByText('User');
    await user.click(userButton);
    
    expect(defaultProps.onLogin).toHaveBeenCalledWith({
      id: 'dev-user',
      name: 'Developer User',
      email: 'user@teambeam.dev',
      role: 'user'
    });
  });

  it('shows guest portal access', async () => {
    const user = userEvent.setup();
    render(<LoginModal {...defaultProps} />);
    
    const guestButton = screen.getByText('Try as Guest');
    await user.click(guestButton);
    
    expect(defaultProps.onLogin).toHaveBeenCalledWith({
      id: 'guest-user',
      name: 'Guest User',
      email: 'guest@teambeam.app',
      role: 'guest'
    });
  });

  it('shows regular login form', () => {
    render(<LoginModal {...defaultProps} />);
    
    expect(screen.getByText('Regular Login')).toBeDefined();
    expect(screen.getByPlaceholderText('Email')).toBeDefined();
    expect(screen.getByPlaceholderText('Password')).toBeDefined();
  });

  it('handles regular login form submission', async () => {
    const user = userEvent.setup();
    render(<LoginModal {...defaultProps} />);
    
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);
    
    expect(defaultProps.onLogin).toHaveBeenCalled();
  });

  it('does not show developer mode when disabled', () => {
    render(<LoginModal {...defaultProps} isDeveloperMode={false} />);
    
    expect(screen.queryByText('🚀 Developer Mode')).toBeNull();
    expect(screen.queryByText('Quick Login')).toBeNull();
  });

  it('handles modal close', async () => {
    const user = userEvent.setup();
    render(<LoginModal {...defaultProps} />);
    
    const closeButton = screen.getByText('×');
    await user.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    render(<LoginModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Welcome to TeamBeam')).toBeNull();
  });

  it('shows guest portal explanation', () => {
    render(<LoginModal {...defaultProps} />);
    
    expect(screen.getByText(/Experience TeamBeam's powerful features/)).toBeDefined();
  });

  it('handles keyboard navigation in developer mode', async () => {
    const user = userEvent.setup();
    render(<LoginModal {...defaultProps} />);
    
    // Tab through developer buttons
    await user.tab();
    expect(screen.getByText('Admin')).toBeDefined();
    
    await user.tab();
    expect(screen.getByText('User')).toBeDefined();
  });
});