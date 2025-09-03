import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PDFViewer } from './components/PDFViewer';
import { PropertiesPanel } from './components/PropertiesPanel';
import { StatusBar } from './components/StatusBar';
import { AIContextBar } from './components/AIContextBar';
import { MeetingPage } from './components/MeetingPage';
import './App.css';

interface AppState {
  currentFile: File | null;
  currentView: 'document' | 'meetings' | 'dashboard';
  isLoading: boolean;
  sidebarCollapsed: boolean;
  propertiesPanelOpen: boolean;
  activeToolCategory: string;
  selectedTool: string | null;
  zoomLevel: number;
  currentPage: number;
  totalPages: number;
  showGrid: boolean;
  showRulers: boolean;
  darkMode: boolean;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentFile: null,
    currentView: 'document',
    isLoading: false,
    sidebarCollapsed: false,
    propertiesPanelOpen: true,
    activeToolCategory: 'markup',
    selectedTool: null,
    zoomLevel: 100,
    currentPage: 1,
    totalPages: 0,
    showGrid: false,
    showRulers: true,
    darkMode: true, // Default to dark mode
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setState(prev => ({ ...prev, currentFile: file, isLoading: true }));
    } else {
      alert('Please select a PDF file');
    }
  }, []);

  const handleFileDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setState(prev => ({ ...prev, currentFile: file, isLoading: true }));
    } else {
      alert('Please drop a PDF file');
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleToolSelect = useCallback((tool: string) => {
    setState(prev => ({ ...prev, selectedTool: tool }));
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoomLevel: Math.max(10, Math.min(1000, zoom)) }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  }, []);

  const togglePropertiesPanel = useCallback(() => {
    setState(prev => ({ ...prev, propertiesPanelOpen: !prev.propertiesPanelOpen }));
  }, []);

  const toggleGrid = useCallback(() => {
    setState(prev => ({ ...prev, showGrid: !prev.showGrid }));
  }, []);

  const toggleRulers = useCallback(() => {
    setState(prev => ({ ...prev, showRulers: !prev.showRulers }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setState(prev => ({ ...prev, darkMode: !prev.darkMode }));
    document.documentElement.setAttribute('data-theme', state.darkMode ? 'light' : 'dark');
  }, [state.darkMode]);

  const handleAISuggestion = useCallback((action: string) => {
    switch (action) {
      case 'view_analysis':
        // Open analysis panel
        setState(prev => ({ ...prev, propertiesPanelOpen: true }));
        break;
      case 'select_measure':
        setState(prev => ({ ...prev, selectedTool: 'measure' }));
        break;
      case 'add_markup':
        setState(prev => ({ ...prev, selectedTool: 'markup' }));
        break;
      case 'view_activity':
        // Show activity sidebar
        break;
      case 'send_update':
        // Open collaboration panel
        break;
      default:
        console.log('AI Suggestion:', action);
    }
  }, []);

  const handleViewChange = useCallback((view: 'document' | 'meetings' | 'dashboard') => {
    setState(prev => ({ ...prev, currentView: view }));
  }, []);

  // Set dark theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  return (
    <div className={`app ${state.darkMode ? 'dark' : 'light'}`}>
      {/* Professional Header with Tool Ribbons */}
      <Header
        currentFile={state.currentFile}
        currentView={state.currentView}
        onFileSelect={handleFileSelect}
        onViewChange={handleViewChange}
        activeToolCategory={state.activeToolCategory}
        onToolCategoryChange={(category: string) => setState(prev => ({ ...prev, activeToolCategory: category }))}
        selectedTool={state.selectedTool}
        onToolSelect={handleToolSelect}
        zoomLevel={state.zoomLevel}
        onZoomChange={handleZoomChange}
        showGrid={state.showGrid}
        onToggleGrid={toggleGrid}
        showRulers={state.showRulers}
        onToggleRulers={toggleRulers}
        darkMode={state.darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      <div className={`app-body ${state.sidebarCollapsed ? 'sidebar-collapsed' : ''} ${!state.propertiesPanelOpen ? 'properties-closed' : ''}`}>
        {/* Left Sidebar - Document Navigation */}
        <Sidebar
          isCollapsed={state.sidebarCollapsed}
          onToggle={toggleSidebar}
          currentFile={state.currentFile}
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          onPageChange={handlePageChange}
        />

        {/* Main Content Area */}
        <main className="app-main">
          {state.currentView === 'meetings' ? (
            <MeetingPage currentFile={state.currentFile} />
          ) : state.currentView === 'dashboard' ? (
            <div className="dashboard-placeholder">
              <h2>📊 Dashboard</h2>
              <p>Dashboard functionality coming soon...</p>
            </div>
          ) : state.currentFile ? (
            <PDFViewer
              file={state.currentFile}
              selectedTool={state.selectedTool}
              zoomLevel={state.zoomLevel}
              currentPage={state.currentPage}
              showGrid={state.showGrid}
              showRulers={state.showRulers}
              onPageChange={handlePageChange}
              onZoomChange={handleZoomChange}
              onDocumentLoad={(totalPages: number) => setState(prev => ({ ...prev, totalPages, isLoading: false }))}
              className="main-pdf-viewer"
            />
          ) : (
            <div 
              className="drop-zone"
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
            >
              <div className="drop-zone-content">
                <div className="drop-zone-icon">📄</div>
                <h2>TeamBeam PDF Platform</h2>
                <p>Drop a PDF file here or use File → Open to get started</p>
                <div className="drop-zone-features">
                  <div className="feature">
                    <span className="feature-icon">🛠️</span>
                    <span>Professional markup tools</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">📏</span>
                    <span>Precise measurements</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">👥</span>
                    <span>Real-time collaboration</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">🔄</span>
                    <span>Version control</span>
                  </div>
                </div>
                <label className="drop-zone-button">
                  Open PDF File
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          )}
        </main>

        {/* Right Properties Panel */}
        <PropertiesPanel
          isOpen={state.propertiesPanelOpen}
          onToggle={togglePropertiesPanel}
          selectedTool={state.selectedTool}
          currentFile={state.currentFile}
        />
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        currentFile={state.currentFile}
        currentPage={state.currentPage}
        totalPages={state.totalPages}
        zoomLevel={state.zoomLevel}
        isLoading={state.isLoading}
        selectedTool={state.selectedTool}
      />

      {/* AI Context Review Bar */}
      <AIContextBar
        currentFile={state.currentFile}
        selectedTool={state.selectedTool}
        onSuggestAction={handleAISuggestion}
      />
    </div>
  );
};

export default App;