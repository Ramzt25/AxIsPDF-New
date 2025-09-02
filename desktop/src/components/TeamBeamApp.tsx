import React, { useState, useEffect } from 'react';
import { SocialDashboard } from './SocialDashboard';
import { LoginModal } from './LoginModal';
import { GuestPortal } from './GuestPortal';
import { collaborationService } from '../services/enhancedCollaboration';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

interface AppState {
  currentUser: AppUser | null;
  showLogin: boolean;
  currentView: 'login' | 'dashboard' | 'guest-portal';
  isDeveloperMode: boolean;
}

export const TeamBeamApp: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    showLogin: true,
    currentView: 'login',
    isDeveloperMode: true // Enable developer features
  });

  useEffect(() => {
    // Initialize collaboration service
    collaborationService.on('session_created', (session) => {
      console.log('New session created:', session);
    });

    collaborationService.on('user_joined', (data) => {
      console.log('User joined session:', data);
    });

    return () => {
      collaborationService.removeAllListeners();
    };
  }, []);

  const handleLogin = (user: AppUser) => {
    setState(prev => ({
      ...prev,
      currentUser: user,
      showLogin: false,
      currentView: user.role === 'guest' ? 'guest-portal' : 'dashboard'
    }));

    // Initialize user session
    if (user.role !== 'guest') {
      // Set up real user session
      console.log('Setting up user session for:', user);
    }
  };

  const handleLogout = () => {
    setState(prev => ({
      ...prev,
      currentUser: null,
      showLogin: true,
      currentView: 'login'
    }));
  };

  const handleOpenProject = (projectId: string) => {
    console.log('Opening project:', projectId);
    // TODO: Navigate to project view
  };

  const handleJoinMeeting = (meetingUrl: string) => {
    console.log('Joining meeting:', meetingUrl);
    // TODO: Open meeting interface
  };

  const handleViewThread = (threadId: string) => {
    console.log('Viewing thread:', threadId);
    // TODO: Open thread/conversation view
  };

  const handleUpgrade = () => {
    console.log('Upgrade requested');
    // TODO: Open subscription/upgrade flow
    setState(prev => ({
      ...prev,
      currentView: 'login',
      showLogin: true
    }));
  };

  const renderCurrentView = () => {
    if (!state.currentUser) {
      return (
        <LoginModal
          isOpen={state.showLogin}
          onClose={() => setState(prev => ({ ...prev, showLogin: false }))}
          onLogin={handleLogin}
          isDeveloperMode={state.isDeveloperMode}
        />
      );
    }

    switch (state.currentView) {
      case 'dashboard':
        return (
          <SocialDashboard
            currentUserId={state.currentUser.id}
            currentUserName={state.currentUser.name}
            onOpenProject={handleOpenProject}
            onJoinMeeting={handleJoinMeeting}
            onViewThread={handleViewThread}
          />
        );
      
      case 'guest-portal':
        return (
          <GuestPortal
            onUpgrade={handleUpgrade}
            onClose={() => setState(prev => ({ ...prev, currentView: 'login', showLogin: true }))}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="teambeam-app">
      {/* Developer Mode Indicator */}
      {state.isDeveloperMode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4)',
          color: 'white',
          padding: '4px 0',
          textAlign: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 9999,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          🚀 DEVELOPER MODE ACTIVE - Quick Login & Admin Features Enabled
        </div>
      )}

      {/* Main Application Content */}
      <div style={{ 
        paddingTop: state.isDeveloperMode ? '28px' : '0',
        height: '100vh'
      }}>
        {renderCurrentView()}
      </div>

      {/* User Info Bar (for non-guest users) */}
      {state.currentUser && state.currentUser.role !== 'guest' && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--tb-surface-primary)',
          borderTop: '1px solid var(--tb-border-primary)',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--tb-text-secondary)',
          zIndex: 100
        }}>
          <div>
            Logged in as: <strong>{state.currentUser.name}</strong> 
            {state.currentUser.role === 'admin' && (
              <span style={{
                marginLeft: '8px',
                background: '#dc2626',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px'
              }}>
                ADMIN
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: '1px solid var(--tb-border-primary)',
              color: 'var(--tb-text-secondary)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default TeamBeamApp;