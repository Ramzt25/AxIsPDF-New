// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface for type safety
interface TeamBeamAPI {
  // File operations
  openFile: (options?: any) => Promise<any>;
  saveFile: (options?: any) => Promise<any>;
  openDirectory: () => Promise<any>;
  readFile: (filePath: string) => Promise<Uint8Array>;
  writeFile: (filePath: string, data: Uint8Array) => Promise<void>;

  // Store operations
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };

  // App operations
  app: {
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
    restart: () => Promise<void>;
  };

  // Pipeline operations
  pipeline: {
    execute: (config: any) => Promise<any>;
    validate: (config: any) => Promise<any>;
  };

  // Event listeners for menu actions
  onMenuAction: (callback: (action: string, data?: any) => void) => void;
  removeMenuListeners: () => void;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const teamBeamAPI: TeamBeamAPI = {
  // File operations
  openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('file:write', filePath, data),

  // Store operations
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key),
  },

  // App operations
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
    restart: () => ipcRenderer.invoke('app:restart'),
  },

  // Pipeline operations
  pipeline: {
    execute: (config) => ipcRenderer.invoke('pipeline:execute', config),
    validate: (config) => ipcRenderer.invoke('pipeline:validate', config),
  },

  // Menu event handlers
  onMenuAction: (callback) => {
    const menuHandlers = [
      'menu:newProject',
      'menu:openProject',
      'menu:importPdfs',
      'menu:openPipelineEditor',
      'menu:openBatchProcessor',
      'menu:openFieldBeamMeetings',
      'menu:openPreferences',
    ];

    menuHandlers.forEach((event) => {
      ipcRenderer.on(event, (_, data) => {
        const action = event.replace('menu:', '');
        callback(action, data);
      });
    });
  },

  removeMenuListeners: () => {
    ipcRenderer.removeAllListeners('menu:newProject');
    ipcRenderer.removeAllListeners('menu:openProject');
    ipcRenderer.removeAllListeners('menu:importPdfs');
    ipcRenderer.removeAllListeners('menu:openPipelineEditor');
    ipcRenderer.removeAllListeners('menu:openBatchProcessor');
    ipcRenderer.removeAllListeners('menu:openFieldBeamMeetings');
    ipcRenderer.removeAllListeners('menu:openPreferences');
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('teamBeam', teamBeamAPI);

// Export the interface for TypeScript support in renderer
export type { TeamBeamAPI };