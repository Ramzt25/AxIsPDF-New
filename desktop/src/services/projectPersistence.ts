// src/services/projectPersistence.ts
// Project Persistence Service - Handles saving and loading of TeamBeam projects

import { ToolInstance } from './toolPlacement';
import { PDFDocumentInfo } from './pdf';

export interface ProjectSettings {
  name: string;
  description?: string;
  created: string;
  modified: string;
  author?: string;
  version: string;
  tags?: string[];
}

export interface ProjectDocument {
  id: string;
  fileName: string;
  filePath: string;
  lastModified: string;
  pageCount: number;
  toolInstances: ToolInstance[];
  annotations?: any[]; // For future annotation support
  bookmarks?: any[]; // For future bookmark support
}

export interface TeamBeamProject {
  settings: ProjectSettings;
  documents: Record<string, ProjectDocument>;
  metadata: {
    fileVersion: string;
    exportedBy: string;
    exportedAt: string;
    originalPath?: string;
  };
}

export interface ProjectExportOptions {
  includeDocuments?: boolean;
  includeToolInstances?: boolean;
  includeAnnotations?: boolean;
  format: 'json' | 'zip';
  compression?: boolean;
}

export class ProjectPersistenceService {
  private readonly FILE_VERSION = '1.0.0';
  private readonly TEAMBEAM_EXTENSION = '.tbproj';

  // Create a new project
  createProject(name: string, author?: string): TeamBeamProject {
    const now = new Date().toISOString();
    
    return {
      settings: {
        name,
        description: '',
        created: now,
        modified: now,
        author: author || 'TeamBeam User',
        version: '1.0.0',
        tags: []
      },
      documents: {},
      metadata: {
        fileVersion: this.FILE_VERSION,
        exportedBy: 'TeamBeam Desktop',
        exportedAt: now
      }
    };
  }

  // Add a document to the project
  addDocumentToProject(
    project: TeamBeamProject, 
    documentId: string, 
    fileName: string, 
    filePath: string, 
    pdfInfo: PDFDocumentInfo
  ): TeamBeamProject {
    const now = new Date().toISOString();
    
    const updatedProject: TeamBeamProject = {
      ...project,
      documents: {
        ...project.documents,
        [documentId]: {
          id: documentId,
          fileName,
          filePath,
          lastModified: now,
          pageCount: pdfInfo.pageCount,
          toolInstances: [],
          annotations: [],
          bookmarks: []
        }
      },
      settings: {
        ...project.settings,
        modified: now
      }
    };

    return updatedProject;
  }

  // Update tool instances for a document
  updateDocumentToolInstances(
    project: TeamBeamProject, 
    documentId: string, 
    toolInstances: ToolInstance[]
  ): TeamBeamProject {
    const document = project.documents[documentId];
    if (!document) {
      throw new Error(`Document ${documentId} not found in project`);
    }

    const now = new Date().toISOString();

    return {
      ...project,
      documents: {
        ...project.documents,
        [documentId]: {
          ...document,
          toolInstances: [...toolInstances],
          lastModified: now
        }
      },
      settings: {
        ...project.settings,
        modified: now
      }
    };
  }

  // Serialize project to JSON
  serializeProject(project: TeamBeamProject): string {
    const serializable = {
      ...project,
      metadata: {
        ...project.metadata,
        exportedAt: new Date().toISOString()
      }
    };

    return JSON.stringify(serializable, null, 2);
  }

  // Deserialize project from JSON
  deserializeProject(jsonData: string): TeamBeamProject {
    try {
      const project = JSON.parse(jsonData) as TeamBeamProject;
      
      // Validate basic structure
      if (!project.settings || !project.documents || !project.metadata) {
        throw new Error('Invalid project file structure');
      }

      // Check file version compatibility
      if (project.metadata.fileVersion !== this.FILE_VERSION) {
        console.warn(`Project file version ${project.metadata.fileVersion} may not be fully compatible with current version ${this.FILE_VERSION}`);
      }

      return project;
    } catch (error) {
      throw new Error(`Failed to parse project file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Save project to file system
  async saveProject(project: TeamBeamProject, filePath?: string): Promise<string> {
    const projectJson = this.serializeProject(project);
    
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Electron environment - use native file system
      const savePath = filePath || await this.showSaveDialog(project.settings.name);
      if (!savePath) {
        throw new Error('Save operation cancelled');
      }

      await window.electronAPI.saveFile(savePath, projectJson);
      return savePath;
    } else {
      // Browser environment - use download
      this.downloadProjectFile(project.settings.name, projectJson);
      return `${project.settings.name}${this.TEAMBEAM_EXTENSION}`;
    }
  }

  // Load project from file system
  async loadProject(filePath?: string): Promise<TeamBeamProject> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Electron environment - use native file system
      const loadPath = filePath || await this.showOpenDialog();
      if (!loadPath) {
        throw new Error('Load operation cancelled');
      }

      const projectJson = await window.electronAPI.readFile(loadPath);
      const project = this.deserializeProject(projectJson);
      
      // Update metadata with file path
      project.metadata.originalPath = loadPath;
      
      return project;
    } else {
      // Browser environment - use file input
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = this.TEAMBEAM_EXTENSION;
        
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) {
            reject(new Error('No file selected'));
            return;
          }

          try {
            const text = await file.text();
            const project = this.deserializeProject(text);
            resolve(project);
          } catch (error) {
            reject(error);
          }
        };

        input.click();
      });
    }
  }

  // Export project with options
  async exportProject(
    project: TeamBeamProject, 
    options: ProjectExportOptions = { format: 'json' }
  ): Promise<void> {
    const exportData = this.prepareExportData(project, options);
    
    if (options.format === 'zip') {
      await this.exportAsZip(project, exportData, options);
    } else {
      await this.exportAsJson(project, exportData);
    }
  }

  // Private helper methods
  private async showSaveDialog(defaultName: string): Promise<string | null> {
    if (window.electronAPI?.showSaveDialog) {
      return await window.electronAPI.showSaveDialog({
        defaultPath: `${defaultName}${this.TEAMBEAM_EXTENSION}`,
        filters: [
          { name: 'TeamBeam Projects', extensions: ['tbproj'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
    }
    return null;
  }

  private async showOpenDialog(): Promise<string | null> {
    if (window.electronAPI?.showOpenDialog) {
      const result = await window.electronAPI.showOpenDialog({
        filters: [
          { name: 'TeamBeam Projects', extensions: ['tbproj'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });
      return result?.[0] || null;
    }
    return null;
  }

  private downloadProjectFile(projectName: string, content: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}${this.TEAMBEAM_EXTENSION}`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  private prepareExportData(project: TeamBeamProject, options: ProjectExportOptions): any {
    const exportData: any = {
      settings: project.settings,
      metadata: project.metadata
    };

    if (options.includeDocuments !== false) {
      exportData.documents = {};
      
      for (const [docId, doc] of Object.entries(project.documents)) {
        exportData.documents[docId] = {
          id: doc.id,
          fileName: doc.fileName,
          filePath: doc.filePath,
          lastModified: doc.lastModified,
          pageCount: doc.pageCount
        };

        if (options.includeToolInstances !== false) {
          exportData.documents[docId].toolInstances = doc.toolInstances;
        }

        if (options.includeAnnotations !== false) {
          exportData.documents[docId].annotations = doc.annotations;
          exportData.documents[docId].bookmarks = doc.bookmarks;
        }
      }
    }

    return exportData;
  }

  private async exportAsJson(project: TeamBeamProject, exportData: any): Promise<void> {
    const jsonString = JSON.stringify(exportData, null, 2);
    this.downloadProjectFile(project.settings.name, jsonString);
  }

  private async exportAsZip(
    project: TeamBeamProject, 
    exportData: any, 
    options: ProjectExportOptions
  ): Promise<void> {
    // TODO: Implement ZIP export with JSZip or similar
    throw new Error('ZIP export not yet implemented');
  }

  // Utility methods
  validateProject(project: TeamBeamProject): boolean {
    try {
      // Check required fields
      if (!project.settings?.name || !project.metadata?.fileVersion) {
        return false;
      }

      // Validate documents
      for (const doc of Object.values(project.documents)) {
        if (!doc.id || !doc.fileName || !Array.isArray(doc.toolInstances)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  getProjectStats(project: TeamBeamProject): {
    documentCount: number;
    totalToolInstances: number;
    lastModified: string;
    projectAge: number;
  } {
    const documentCount = Object.keys(project.documents).length;
    const totalToolInstances = Object.values(project.documents)
      .reduce((sum, doc) => sum + doc.toolInstances.length, 0);
    
    const lastModified = project.settings.modified;
    const created = new Date(project.settings.created);
    const projectAge = Date.now() - created.getTime();

    return {
      documentCount,
      totalToolInstances,
      lastModified,
      projectAge
    };
  }
}

// Global service instance
export const projectPersistenceService = new ProjectPersistenceService();

// Type declarations for Electron API
declare global {
  interface Window {
    electronAPI?: {
      saveFile: (filePath: string, content: string) => Promise<void>;
      readFile: (filePath: string) => Promise<string>;
      showSaveDialog: (options: any) => Promise<string | null>;
      showOpenDialog: (options: any) => Promise<string[] | null>;
    };
  }
}