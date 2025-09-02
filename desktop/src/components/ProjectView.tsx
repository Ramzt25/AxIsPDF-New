// ProjectView.tsx - Main project workspace with drawing canvas and toolbox
import React, { useState, useCallback, useEffect } from 'react';
import { Toolbox } from './toolbox';
import { PDFViewer } from './PDFViewer';
import { ToolOverlayContainer } from './ToolOverlay';
import { ToolPropertyPanel } from './ToolPropertyPanel';
import { Tool } from '../services/toolbox';
import { PDFDocumentInfo } from '../services/pdf';
import { ToolInstance, toolPlacementService } from '../services/toolPlacement';
import { projectPersistenceService, TeamBeamProject } from '../services/projectPersistence';
import './ProjectView.css';

interface ProjectViewProps {
  project: string | null;
}

interface PlacedTool {
  id: string;
  tool: Tool;
  position: { x: number; y: number };
  parameters: Record<string, any>;
  timestamp: string;
}

const ProjectView: React.FC<ProjectViewProps> = ({ project }) => {
  const [isToolboxOpen, setIsToolboxOpen] = useState(true);
  const [placedTools, setPlacedTools] = useState<ToolInstance[]>([]);
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  const [currentPDF, setCurrentPDF] = useState<string | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PDFDocumentInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [toolPlacementMode, setToolPlacementMode] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  
  // Property panel state
  const [selectedToolInstance, setSelectedToolInstance] = useState<ToolInstance | null>(null);
  const [isPropertyPanelOpen, setIsPropertyPanelOpen] = useState(false);

  // Project persistence state
  const [currentProject, setCurrentProject] = useState<TeamBeamProject | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  // Initialize project when component mounts
  useEffect(() => {
    if (project && !currentProject) {
      // Create a new project if none exists
      const newProject = projectPersistenceService.createProject(
        project.split(/[/\\]/).pop() || 'Untitled Project',
        'TeamBeam User'
      );
      setCurrentProject(newProject);
      console.log('Initialized new project:', newProject.settings.name);
    }
  }, [project, currentProject]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges || !currentProject) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        await handleSaveProject();
        console.log('Auto-save completed at', new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [autoSaveEnabled, hasUnsavedChanges, currentProject]);

  // Update project when tool instances change
  useEffect(() => {
    if (currentProject && selectedDrawing && currentPDF && placedTools.length > 0) {
      const documentId = selectedDrawing;
      const updatedProject = projectPersistenceService.updateDocumentToolInstances(
        currentProject,
        documentId,
        placedTools
      );
      setCurrentProject(updatedProject);
      setHasUnsavedChanges(true);
    }
  }, [placedTools, currentProject, selectedDrawing, currentPDF]);

  const handleToolPlace = useCallback((tool: Tool, position: { x: number; y: number }) => {
    // Set the tool as selected for placement mode
    setSelectedTool(tool);
    setToolPlacementMode(true);
    console.log('Tool selected for placement:', tool.name);
  }, []);

  const handleToolSelection = useCallback((tool: Tool) => {
    setSelectedTool(tool);
    setToolPlacementMode(true);
    console.log('Tool selected:', tool.name);
  }, []);

  const handleCanvasToolPlace = useCallback((canvasX: number, canvasY: number, pageNumber: number, pdfCoords: { x: number; y: number }) => {
    if (!selectedTool || !toolPlacementMode) return;

    // Create a new tool instance using the tool placement service
    const toolInstance = toolPlacementService.createToolInstance(
      selectedTool.id,
      pageNumber,
      pdfCoords,
      Object.fromEntries(
        Object.entries(selectedTool.params || {}).map(([key, param]) => [key, param.default])
      )
    );

    setPlacedTools(prev => [...prev, toolInstance]);
    
    // Keep tool selected for multiple placements, or exit mode
    // For now, exit placement mode after each tool
    setToolPlacementMode(false);
    setSelectedTool(null);
    
    console.log('Tool placed at PDF coords:', pdfCoords, toolInstance);
  }, [selectedTool, toolPlacementMode]);

  // Tool editing handlers
  const handleToolInstanceClick = useCallback((toolInstance: ToolInstance) => {
    setSelectedToolInstance(toolInstance);
    setIsPropertyPanelOpen(true);
    console.log('Tool instance selected for editing:', toolInstance);
  }, []);

  const handleToolInstanceUpdate = useCallback((updatedInstance: ToolInstance) => {
    setPlacedTools(prev => prev.map(tool => 
      tool.id === updatedInstance.id ? updatedInstance : tool
    ));
    setSelectedToolInstance(updatedInstance);
    console.log('Tool instance updated:', updatedInstance);
  }, []);

  const handleToolInstanceDelete = useCallback((toolInstanceId: string) => {
    setPlacedTools(prev => prev.filter(tool => tool.id !== toolInstanceId));
    setSelectedToolInstance(null);
    setIsPropertyPanelOpen(false);
    console.log('Tool instance deleted:', toolInstanceId);
  }, []);

  const handlePropertyPanelClose = useCallback(() => {
    setIsPropertyPanelOpen(false);
    setSelectedToolInstance(null);
  }, []);

  // Project persistence handlers
  const handleSaveProject = useCallback(async () => {
    if (!currentProject) {
      console.warn('No project to save');
      return;
    }

    try {
      const savedPath = await projectPersistenceService.saveProject(currentProject);
      setLastSaveTime(new Date());
      setHasUnsavedChanges(false);
      console.log('Project saved to:', savedPath);
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  }, [currentProject]);

  const handleLoadProject = useCallback(async () => {
    try {
      const loadedProject = await projectPersistenceService.loadProject();
      setCurrentProject(loadedProject);
      setHasUnsavedChanges(false);
      
      // Load tool instances from the first document
      const firstDoc = Object.values(loadedProject.documents)[0];
      if (firstDoc) {
        setPlacedTools(firstDoc.toolInstances);
        setSelectedDrawing(firstDoc.fileName);
        setCurrentPDF(firstDoc.filePath);
      }
      
      console.log('Project loaded:', loadedProject.settings.name);
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  }, []);

  const handleNewProject = useCallback(() => {
    const projectName = prompt('Enter project name:') || 'New Project';
    const newProject = projectPersistenceService.createProject(projectName);
    setCurrentProject(newProject);
    setPlacedTools([]);
    setHasUnsavedChanges(false);
    setLastSaveTime(null);
    console.log('Created new project:', projectName);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S to save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges) {
          handleSaveProject();
        }
      }
      
      // Ctrl+N for new project
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        handleNewProject();
      }
      
      // Ctrl+O to open project
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        handleLoadProject();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, handleSaveProject, handleNewProject, handleLoadProject]);

  const handleDocumentLoad = useCallback((info: PDFDocumentInfo) => {
    setPdfInfo(info);
    setCurrentPage(1);
    
    // Add document to current project
    if (currentProject && selectedDrawing && currentPDF) {
      const documentId = selectedDrawing;
      const updatedProject = projectPersistenceService.addDocumentToProject(
        currentProject,
        documentId,
        selectedDrawing,
        currentPDF,
        info
      );
      setCurrentProject(updatedProject);
      setHasUnsavedChanges(true);
      
      // Load existing tool instances for this document
      const document = updatedProject.documents[documentId];
      if (document?.toolInstances) {
        setPlacedTools(document.toolInstances);
      }
      
      console.log('Document added to project:', selectedDrawing);
    }
    
    console.log('PDF loaded:', info);
  }, [currentProject, selectedDrawing, currentPDF]);

  const handlePageChange = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  const handleCanvasClick = useCallback((x: number, y: number, pageNumber: number, pdfCoords: { x: number; y: number }) => {
    handleCanvasToolPlace(x, y, pageNumber, pdfCoords);
  }, [handleCanvasToolPlace]);

  const handleDrawingSelect = useCallback((drawing: string) => {
    setSelectedDrawing(drawing);
    // For demo, use a mock PDF path - in real app this would load actual file
    setCurrentPDF(drawing);
  }, []);

  const mockDrawings = [
    'Floor Plan - Level 1.pdf',
    'Electrical Plan - Level 1.pdf', 
    'Mechanical Plan - Level 1.pdf',
    'Site Plan.pdf'
  ];

  return (
    <div className="project-view">
      {/* Project Header */}
      <div className="project-header">
        <div className="project-info">
          <h1>{currentProject?.settings.name || 'FieldBeam Project'}</h1>
          <p className="project-path">
            {project || 'No project loaded'}
            {hasUnsavedChanges && <span className="unsaved-indicator"> • Unsaved changes</span>}
            {lastSaveTime && <span className="last-save"> • Last saved: {lastSaveTime.toLocaleTimeString()}</span>}
          </p>
        </div>
        
        <div className="project-actions">
          <button 
            className="project-btn"
            onClick={handleNewProject}
            title="New Project"
          >
            📄 New
          </button>
          
          <button 
            className="project-btn"
            onClick={handleLoadProject}
            title="Open Project"
          >
            📂 Open
          </button>
          
          <button 
            className="project-btn"
            onClick={handleSaveProject}
            disabled={!hasUnsavedChanges}
            title="Save Project"
          >
            💾 Save
          </button>
          
          <button 
            className={`toolbox-toggle ${isToolboxOpen ? 'active' : ''}`}
            onClick={() => setIsToolboxOpen(!isToolboxOpen)}
            title="Toggle Toolbox"
          >
            🧰 Toolbox
          </button>
        </div>
      </div>

      <div className="project-content">
        {/* Drawing Browser Sidebar */}
        <div className="drawing-browser">
          <div className="browser-header">
            <h3>📋 Drawings</h3>
            <button className="refresh-btn" title="Refresh drawings">↻</button>
          </div>
          
          <div className="drawings-list">
            {mockDrawings.map(drawing => (
              <div
                key={drawing}
                className={`drawing-item ${selectedDrawing === drawing ? 'selected' : ''}`}
                onClick={() => handleDrawingSelect(drawing)}
              >
                <div className="drawing-icon">📄</div>
                <div className="drawing-name">{drawing}</div>
              </div>
            ))}
          </div>
          
          <div className="browser-footer">
            <button className="import-btn">+ Import PDFs</button>
          </div>
        </div>

        {/* Main Drawing Canvas */}
        <div className="drawing-canvas-container">
          {selectedDrawing ? (
            <div className="drawing-canvas">
              <div className="canvas-header">
                <h2>{selectedDrawing}</h2>
                <div className="canvas-tools">
                  <button className="zoom-btn">🔍 Fit</button>
                  <button className="measure-btn">📏 Measure</button>
                  <button className="markup-btn">✏️ Markup</button>
                </div>
              </div>
              
              {/* PDF Viewer */}
              <div className="drawing-viewport">
                <PDFViewer
                  filePath={currentPDF}
                  selectedTool={selectedTool}
                  onDocumentLoad={handleDocumentLoad}
                  onPageChange={handlePageChange}
                  onCanvasClick={handleCanvasClick}
                  className="project-pdf-viewer"
                />
                
                {/* Tool placement overlay using new component */}
                <ToolOverlayContainer
                  toolInstances={placedTools}
                  currentPage={currentPage}
                  scale={scale}
                  pdfInfo={pdfInfo}
                  canvasHeight={canvasHeight}
                  onToolClick={handleToolInstanceClick}
                />
              </div>
            </div>
          ) : (
            <div className="no-drawing-selected">
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h2>Select a Drawing</h2>
                <p>Choose a drawing from the sidebar to start marking up with FieldBeam tools</p>
              </div>
            </div>
          )}
        </div>

        {/* Toolbox Panel */}
        {isToolboxOpen && (
          <div className="toolbox-panel">
            <Toolbox 
              onToolPlace={handleToolSelection}
              className="project-toolbox"
            />
          </div>
        )}
      </div>

      {/* Tool Property Panel */}
      <ToolPropertyPanel
        toolInstance={selectedToolInstance}
        isOpen={isPropertyPanelOpen}
        onClose={handlePropertyPanelClose}
        onUpdate={handleToolInstanceUpdate}
        onDelete={handleToolInstanceDelete}
      />

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          {project && <span>📁 {project.split(/[/\\]/).pop()}</span>}
          {selectedDrawing && <span>📄 {selectedDrawing}</span>}
          {pdfInfo && <span>📄 Page {currentPage} of {pdfInfo.pageCount}</span>}
        </div>
        <div className="status-right">
          <span>🧰 {placedTools.length} tools placed</span>
          <span>⚡ FieldBeam Ready</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectView;