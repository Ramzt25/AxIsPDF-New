import React, { useState, useEffect } from 'react';
import { SocialDashboard } from './SocialDashboard';
import { LoginModal } from './LoginModal';
import { GuestPortal } from './GuestPortal';
import ProjectView from './ProjectView';
import FieldBeamMeetings from './FieldBeamMeetings';
import { CollaborationPanel } from './collaboration/CollaborationPanel';
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
  currentView: 'login' | 'dashboard' | 'guest-portal' | 'project' | 'meetings' | 'threads' | 'subscription';
  isDeveloperMode: boolean;
  currentProjectId: string | null;
  currentMeetingUrl: string | null;
  currentThreadId: string | null;
  navigationHistory: string[];
}

export const TeamBeamApp: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    showLogin: true,
    currentView: 'login',
    isDeveloperMode: true, // Enable developer features
    currentProjectId: null,
    currentMeetingUrl: null,
    currentThreadId: null,
    navigationHistory: []
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
    setState(prev => ({
      ...prev,
      currentView: 'project',
      currentProjectId: projectId,
      navigationHistory: [...prev.navigationHistory, prev.currentView]
    }));
  };

  const handleJoinMeeting = (meetingUrl: string) => {
    console.log('Joining meeting:', meetingUrl);
    setState(prev => ({
      ...prev,
      currentView: 'meetings',
      currentMeetingUrl: meetingUrl,
      navigationHistory: [...prev.navigationHistory, prev.currentView]
    }));
  };

  const handleViewThread = (threadId: string) => {
    console.log('Viewing thread:', threadId);
    setState(prev => ({
      ...prev,
      currentView: 'threads',
      currentThreadId: threadId,
      navigationHistory: [...prev.navigationHistory, prev.currentView]
    }));
  };

  const handleUpgrade = () => {
    console.log('Upgrade requested');
    setState(prev => ({
      ...prev,
      currentView: 'subscription',
      navigationHistory: [...prev.navigationHistory, prev.currentView]
    }));
  };

  const handleNavigateBack = () => {
    const previousView = state.navigationHistory[state.navigationHistory.length - 1];
    if (previousView) {
      setState(prev => ({
        ...prev,
        currentView: previousView as AppState['currentView'],
        navigationHistory: prev.navigationHistory.slice(0, -1),
        // Clear context-specific data when navigating back
        currentProjectId: previousView === 'project' ? prev.currentProjectId : null,
        currentMeetingUrl: previousView === 'meetings' ? prev.currentMeetingUrl : null,
        currentThreadId: previousView === 'threads' ? prev.currentThreadId : null
      }));
    } else {
      // Default back to dashboard
      setState(prev => ({
        ...prev,
        currentView: 'dashboard',
        currentProjectId: null,
        currentMeetingUrl: null,
        currentThreadId: null,
        navigationHistory: []
      }));
    }
  };

  const handleNavigateToDashboard = () => {
    setState(prev => ({
      ...prev,
      currentView: 'dashboard',
      currentProjectId: null,
      currentMeetingUrl: null,
      currentThreadId: null,
      navigationHistory: []
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

    // Navigation header for non-dashboard views
    const renderNavigationHeader = (title: string) => (
      <div style={{
        background: 'var(--tb-surface-primary)',
        borderBottom: '1px solid var(--tb-border-primary)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleNavigateBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--tb-text-primary)',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '18px'
            }}
            title="Go back"
          >
            ←
          </button>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{title}</h2>
        </div>
        <button
          onClick={handleNavigateToDashboard}
          style={{
            background: 'var(--tb-accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Dashboard
        </button>
      </div>
    );

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
      
      case 'project':
        return (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {renderNavigationHeader(`Project: ${state.currentProjectId || 'Unknown'}`)}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ProjectView project={state.currentProjectId} />
            </div>
          </div>
        );
      
      case 'meetings':
        return (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {renderNavigationHeader('FieldBeam Meetings')}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <FieldBeamMeetings />
            </div>
          </div>
        );
      
      case 'threads':
        return (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {renderNavigationHeader(`Thread: ${state.currentThreadId || 'Discussion'}`)}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <CollaborationPanel
                projectId={state.currentProjectId || 'default-project'}
                currentSheet={state.currentThreadId || 'general'}
                currentRevision="latest"
                currentUserId={state.currentUser.id}
                currentUserName={state.currentUser.name}
              />
            </div>
          </div>
        );
      
      case 'subscription':
        return (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {renderNavigationHeader('Subscription & Upgrade')}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <GuestPortal
                onUpgrade={() => {
                  console.log('Subscription upgrade completed');
                  handleNavigateToDashboard();
                }}
                onClose={handleNavigateBack}
              />
            </div>
          </div>
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