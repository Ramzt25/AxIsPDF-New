import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PipelineEditor from './components/PipelineEditor';
import BatchProcessor from './components/BatchProcessor';
import FieldBeamMeetings from './components/FieldBeamMeetings';
import Preferences from './components/Preferences';
import ProjectView from './components/ProjectView';
import { PremiumSidebar } from './components/PremiumSidebar';
import { PremiumHeader } from './components/PremiumHeader';
import { SocialDashboard } from './components/SocialDashboard';
import { LoginModal } from './components/LoginModal';
import { GuestPortal } from './components/GuestPortal';
import './App.css';
import './styles/design-system.css';

// Future flags for React Router to prevent warnings
const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

interface AppState {
  currentProject: string | null;
  recentProjects: string[];
  isLoading: boolean;
  sidebarCollapsed: boolean;
  zoomLevel: number;
  documentModified: boolean;
  currentUser: { id: string; name: string; email: string; role: 'admin' | 'user' | 'guest' } | null;
  showLogin: boolean;
  isFirstRun: boolean;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentProject: null,
    recentProjects: [],
    isLoading: true,
    sidebarCollapsed: false,
    zoomLevel: 100,
    documentModified: false,
    currentUser: null,
    showLogin: true,
    isFirstRun: true,
  });

  useEffect(() => {
    // Initialize app state from electron store
    const initializeApp = async () => {
      try {
        // Check if we're in Electron environment (with AxIs or legacy TeamBeam API)
        const electronAPI = window.axIs || window.teamBeam;
        if (electronAPI && electronAPI.store) {
          const recentProjects = await electronAPI.store.get('recentProjects') || [];
          const sidebarCollapsed = await electronAPI.store.get('sidebarCollapsed') || false;
          
          setState(prev => ({
            ...prev,
            recentProjects,
            sidebarCollapsed,
            isLoading: false,
          }));
        } else {
          // Web fallback - use localStorage
          const recentProjects = JSON.parse(localStorage.getItem('axis_recentProjects') || 
                                          localStorage.getItem('teambeam_recentProjects') || '[]');
          const sidebarCollapsed = localStorage.getItem('axis_sidebarCollapsed') === 'true' ||
                                 localStorage.getItem('teambeam_sidebarCollapsed') === 'true';
          
          setState(prev => ({
            ...prev,
            recentProjects,
            sidebarCollapsed,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeApp();

    // Set up menu action handlers (only in Electron)
    const electronAPI = window.axIs || window.teamBeam;
    if (electronAPI && electronAPI.onMenuAction) {
      electronAPI.onMenuAction((action, data) => {
      switch (action) {
        case 'newProject':
          handleNewProject();
          break;
        case 'openProject':
          handleOpenProject(data);
          break;
        case 'importPdfs':
          handleImportPdfs(data);
          break;
        case 'save':
          handleSave();
          break;
        case 'undo':
          handleUndo();
          break;
        case 'redo':
          handleRedo();
          break;
        case 'zoomIn':
          handleZoomChange(state.zoomLevel + 25);
          break;
        case 'zoomOut':
          handleZoomChange(state.zoomLevel - 25);
          break;
        case 'toggleSidebar':
          handleToggleSidebar();
          break;
        case 'openPipelineEditor':
          window.location.hash = '#/pipeline-editor';
          break;
        case 'openBatchProcessor':
          window.location.hash = '#/batch-processor';
          break;
        case 'openFieldBeamMeetings':
          window.location.hash = '#/fieldbeam-meetings';
          break;
        case 'openPreferences':
          window.location.hash = '#/preferences';
          break;
      }
    });
    }

    return () => {
      const electronAPI = window.axIs || window.teamBeam;
      if (electronAPI && electronAPI.removeMenuListeners) {
        electronAPI.removeMenuListeners();
      }
    };
  }, [state.zoomLevel]);

  const handleNewProject = async () => {
    console.log('Creating new project...');
  };

  const handleOpenProject = async (projectPath: string) => {
    if (projectPath) {
      setState(prev => ({
        ...prev,
        currentProject: projectPath,
      }));
      
      const updatedRecent = [projectPath, ...state.recentProjects.filter(p => p !== projectPath)].slice(0, 10);
      
      // Use appropriate storage based on environment
      const electronAPI = window.axIs || window.teamBeam;
      if (electronAPI && electronAPI.store) {
        await electronAPI.store.set('recentProjects', updatedRecent);
      } else {
        localStorage.setItem('axis_recentProjects', JSON.stringify(updatedRecent));
      }
      
      setState(prev => ({
        ...prev,
        recentProjects: updatedRecent,
      }));
    }
  };

  const handleImportPdfs = async (filePaths: string[]) => {
    console.log('Importing PDFs:', filePaths);
  };

  const handleSave = async () => {
    console.log('Saving document...');
    setState(prev => ({ ...prev, documentModified: false }));
  };

  const handleUndo = () => {
    console.log('Undo action');
  };

  const handleRedo = () => {
    console.log('Redo action');
  };

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(10, Math.min(500, newZoom));
    setState(prev => ({ ...prev, zoomLevel: clampedZoom }));
  };

  const handleToggleSidebar = async () => {
    const newCollapsed = !state.sidebarCollapsed;
    setState(prev => ({ ...prev, sidebarCollapsed: newCollapsed }));
    
    // Use appropriate storage based on environment
    const electronAPI = window.axIs || window.teamBeam;
    if (electronAPI && electronAPI.store) {
      await electronAPI.store.set('sidebarCollapsed', newCollapsed);
    } else {
      localStorage.setItem('axis_sidebarCollapsed', newCollapsed.toString());
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setState(prev => ({ ...prev, currentProject: projectId }));
  };

  const handleLogin = (user: { id: string; name: string; email: string; role: 'admin' | 'user' | 'guest' }) => {
    setState(prev => ({
      ...prev,
      currentUser: user,
      showLogin: false,
      isFirstRun: false
    }));
  };

  const handleLogout = () => {
    setState(prev => ({
      ...prev,
      currentUser: null,
      showLogin: true
    }));
  };

  if (state.isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <h2>Loading AxIs...</h2>
      </div>
    );
  }

  // Show login modal if no user is logged in
  if (!state.currentUser && state.showLogin) {
    return (
      <div className="teambeam-app">
        <LoginModal
          isOpen={state.showLogin}
          onClose={() => setState(prev => ({ ...prev, showLogin: false }))}
          onLogin={handleLogin}
          isDeveloperMode={true}
        />
      </div>
    );
  }

  const getCurrentDocumentName = () => {
    if (state.currentProject) {
      return state.currentProject.split('/').pop() || 'Unknown Document';
    }
    return 'Welcome to TeamBeam';
  };

  return (
    <Router future={routerFuture}>
      <div className="teambeam-app">
        <PremiumHeader
          currentDocument={getCurrentDocumentName()}
          isDocumentModified={state.documentModified}
          zoomLevel={state.zoomLevel}
          onZoomChange={handleZoomChange}
          onSave={handleSave}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={true}
          canRedo={false}
        />
        
        <div className="app-body">
          <PremiumSidebar
            isCollapsed={state.sidebarCollapsed}
            onToggle={handleToggleSidebar}
            activeProject={state.currentProject}
            onProjectSelect={handleProjectSelect}
          />
          
          <main className={`app-main ${state.sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
            <Layout currentProject={state.currentProject}>
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <Dashboard 
                      currentProject={state.currentProject}
                      recentProjects={state.recentProjects}
                      onOpenProject={handleOpenProject}
                    />
                  } 
                />
                <Route 
                  path="/social" 
                  element={
                    <SocialDashboard
                      currentUserId={state.currentUser?.id || ''}
                      currentUserName={state.currentUser?.name || 'User'}
                      onOpenProject={(projectId) => console.log('Opening project:', projectId)}
                      onJoinMeeting={(url) => console.log('Joining meeting:', url)}
                      onViewThread={(threadId) => console.log('Viewing thread:', threadId)}
                    />
                  } 
                />
                <Route 
                  path="/guest-portal" 
                  element={
                    <GuestPortal
                      onUpgrade={() => console.log('Upgrade requested')}
                      onClose={() => window.location.hash = '#/'}
                    />
                  } 
                />
                <Route path="/pipeline-editor" element={<PipelineEditor />} />
                <Route path="/batch-processor" element={<BatchProcessor />} />
                <Route path="/fieldbeam-meetings" element={<FieldBeamMeetings />} />
                <Route path="/preferences" element={<Preferences />} />
                <Route 
                  path="/project/:projectId" 
                  element={<ProjectView project={state.currentProject} />} 
                />
              </Routes>
            </Layout>
          </main>
        </div>

        {/* User Status Bar */}
        {state.currentUser && (
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
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <a href="#/social" style={{ textDecoration: 'none', color: 'var(--tb-text-secondary)' }}>
                📱 Social
              </a>
              <a href="#/guest-portal" style={{ textDecoration: 'none', color: 'var(--tb-text-secondary)' }}>
                🎯 Guest Portal
              </a>
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
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;