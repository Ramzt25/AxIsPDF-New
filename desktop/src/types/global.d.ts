// Global type definitions for AxIs Desktop

interface AxIsAPI {
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };
  onMenuAction: (callback: (action: string, data?: any) => void) => void;
  removeMenuListeners: () => void;
  openProject: (path: string) => Promise<void>;
  importPdfs: (paths: string[]) => Promise<void>;
  exportProject: (format: string) => Promise<void>;
  showSaveDialog: (options: any) => Promise<string | undefined>;
  showOpenDialog: (options: any) => Promise<string[] | undefined>;
  readFile: (path: string) => Promise<ArrayBuffer>;
  writeFile: (path: string, data: ArrayBuffer | Uint8Array) => Promise<void>;
  platform: string;
  version: string;
}

declare global {
  interface Window {
    axIs?: AxIsAPI;
    teamBeam?: AxIsAPI; // Backwards compatibility during transition
  }
}

export {};