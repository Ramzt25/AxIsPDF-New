// electron/main.ts
import { app, BrowserWindow, Menu, dialog, ipcMain, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import path = require('path');
import fs = require('fs');
import { promises as fsPromises } from 'fs';

// Simple file-based storage to replace electron-store
class SimpleStore {
  private storePath: string;
  private data: any;
  private defaults: any;

  constructor(defaults: any = {}) {
    this.storePath = path.join(app.getPath('userData'), 'app-settings.json');
    this.defaults = defaults;
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.storePath)) {
        const fileContent = fs.readFileSync(this.storePath, 'utf8');
        this.data = { ...this.defaults, ...JSON.parse(fileContent) };
      } else {
        this.data = { ...this.defaults };
      }
    } catch (error) {
      console.error('Error loading store:', error);
      this.data = { ...this.defaults };
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.storePath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving store:', error);
    }
  }

  get(key: string): any {
    return key.split('.').reduce((obj, k) => obj?.[k], this.data);
  }

  set(key: string, value: any): void {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((obj, k) => {
      if (!(k in obj)) obj[k] = {};
      return obj[k];
    }, this.data);
    target[lastKey] = value;
    this.save();
  }

  delete(key: string): void {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((obj, k) => obj?.[k], this.data);
    if (target) {
      delete target[lastKey];
      this.save();
    }
  }
}

// Initialize store with defaults - will be created after app is ready
let store: SimpleStore;

class TeamBeamApp {
  private mainWindow: BrowserWindow | null = null;
  private isDev = process.env.NODE_ENV === 'development';

  constructor() {
    this.setupApp();
    this.setupIPC();
    this.setupAutoUpdater();
  }

  private setupApp(): void {
    // Single instance enforcement
    if (!app.requestSingleInstanceLock()) {
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.focus();
      }
    });

    app.whenReady().then(() => {
      // Initialize store after app is ready
      store = new SimpleStore({
        windowBounds: { width: 1400, height: 900 },
        recentProjects: [],
        userPreferences: {
          theme: 'system',
          autoSave: true,
          backupLocation: '',
          defaultStampSet: 'construction',
        },
      });
      
      this.createMainWindow();
      this.createMenu();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  private createMainWindow(): void {
    const bounds = store.get('windowBounds') as { width: number; height: number };

    this.mainWindow = new BrowserWindow({
      ...bounds,
      minWidth: 1200,
      minHeight: 700,
      show: false,
      icon: path.join(__dirname, '../assets/icon.png'),
      titleBarStyle: 'default',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: !this.isDev,
        allowRunningInsecureContent: false,
      },
    });

    // Load app content
    if (this.isDev) {
      this.mainWindow.loadURL('http://localhost:5176');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Window event handlers
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      
      if (this.isDev) {
        this.mainWindow?.webContents.openDevTools();
      }
    });

    this.mainWindow.on('close', () => {
      if (this.mainWindow) {
        const bounds = this.mainWindow.getBounds();
        store.set('windowBounds', bounds);
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  private createMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Project',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.handleNewProject(),
          },
          {
            label: 'Open Project',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.handleOpenProject(),
          },
          {
            label: 'Recent Projects',
            submenu: this.createRecentProjectsMenu(),
          },
          { type: 'separator' },
          {
            label: 'Import PDFs',
            accelerator: 'CmdOrCtrl+I',
            click: () => this.handleImportPdfs(),
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit(),
          },
        ],
      },
      {
        label: 'Tools',
        submenu: [
          {
            label: 'Pipeline Editor',
            accelerator: 'CmdOrCtrl+P',
            click: () => this.openPipelineEditor(),
          },
          {
            label: 'Batch Processor',
            accelerator: 'CmdOrCtrl+B',
            click: () => this.openBatchProcessor(),
          },
          { type: 'separator' },
          {
            label: 'FieldBeam Meetings',
            accelerator: 'CmdOrCtrl+M',
            click: () => this.openFieldBeamMeetings(),
          },
          { type: 'separator' },
          {
            label: 'Preferences',
            accelerator: 'CmdOrCtrl+,',
            click: () => this.openPreferences(),
          },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About TeamBeam',
            click: () => this.showAbout(),
          },
          {
            label: 'Documentation',
            click: () => shell.openExternal('https://docs.teambeam.app'),
          },
          {
            label: 'Support',
            click: () => shell.openExternal('https://support.teambeam.app'),
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIPC(): void {
    // File operations
    ipcMain.handle('dialog:openFile', async (_, options) => {
      const result = await dialog.showOpenDialog(this.mainWindow!, options);
      return result;
    });

    ipcMain.handle('dialog:saveFile', async (_, options) => {
      const result = await dialog.showSaveDialog(this.mainWindow!, options);
      return result;
    });

    ipcMain.handle('dialog:openDirectory', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openDirectory'],
      });
      return result;
    });

    // Store operations
    ipcMain.handle('store:get', (_, key) => store.get(key));
    ipcMain.handle('store:set', (_, key, value) => store.set(key, value));
    ipcMain.handle('store:delete', (_, key) => store.delete(key));

    // File read/write operations
    ipcMain.handle('file:read', async (_, filePath: string) => {
      try {
        const data = await fsPromises.readFile(filePath);
        return new Uint8Array(data);
      } catch (error) {
        console.error('Failed to read file:', error);
        throw error;
      }
    });

    ipcMain.handle('file:write', async (_, filePath: string, data: Uint8Array) => {
      try {
        await fsPromises.writeFile(filePath, Buffer.from(data));
      } catch (error) {
        console.error('Failed to write file:', error);
        throw error;
      }
    });

    // App operations
    ipcMain.handle('app:getVersion', () => app.getVersion());
    ipcMain.handle('app:getPlatform', () => process.platform);
    ipcMain.handle('app:restart', () => {
      app.relaunch();
      app.exit();
    });

    // Pipeline operations (TODO: Integrate with Phase 1 pipeline engine)
    ipcMain.handle('pipeline:execute', async (_, pipelineConfig) => {
      // STUB: Integration point for Phase 1 pipeline engine
      console.log('Executing pipeline:', pipelineConfig);
      return { success: true, message: 'Pipeline executed successfully' };
    });

    ipcMain.handle('pipeline:validate', async (_, pipelineConfig) => {
      // STUB: Validation logic
      return { isValid: true, errors: [] };
    });
  }

  private setupAutoUpdater(): void {
    if (!this.isDev) {
      autoUpdater.checkForUpdatesAndNotify();
      
      autoUpdater.on('update-available', () => {
        console.log('Update available');
      });

      autoUpdater.on('update-downloaded', () => {
        console.log('Update downloaded');
        // Notify user and offer to restart
      });
    }
  }

  // Menu handlers
  private async handleNewProject(): Promise<void> {
    this.mainWindow?.webContents.send('menu:newProject');
  }

  private async handleOpenProject(): Promise<void> {
    const result = await dialog.showOpenDialog(this.mainWindow!, {
      properties: ['openDirectory'],
      title: 'Select TeamBeam Project Folder',
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const projectPath = result.filePaths[0];
      this.addToRecentProjects(projectPath);
      this.mainWindow?.webContents.send('menu:openProject', projectPath);
    }
  }

  private async handleImportPdfs(): Promise<void> {
    const result = await dialog.showOpenDialog(this.mainWindow!, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      title: 'Import PDF Documents',
    });

    if (!result.canceled && result.filePaths.length > 0) {
      this.mainWindow?.webContents.send('menu:importPdfs', result.filePaths);
    }
  }

  private openPipelineEditor(): void {
    this.mainWindow?.webContents.send('menu:openPipelineEditor');
  }

  private openBatchProcessor(): void {
    this.mainWindow?.webContents.send('menu:openBatchProcessor');
  }

  private openFieldBeamMeetings(): void {
    this.mainWindow?.webContents.send('menu:openFieldBeamMeetings');
  }

  private openPreferences(): void {
    this.mainWindow?.webContents.send('menu:openPreferences');
  }

  private showAbout(): void {
    dialog.showMessageBox(this.mainWindow!, {
      type: 'info',
      title: 'About TeamBeam',
      message: 'TeamBeam Desktop',
      detail: `Version: ${app.getVersion()}\nLocal Bluebeam with Brains for Construction Teams`,
      buttons: ['OK'],
    });
  }

  private createRecentProjectsMenu(): Electron.MenuItemConstructorOptions[] {
    const recent = store.get('recentProjects') as string[];
    
    if (recent.length === 0) {
      return [{ label: 'No recent projects', enabled: false }];
    }

    return recent.slice(0, 10).map((projectPath) => ({
      label: path.basename(projectPath),
      click: () => {
        this.mainWindow?.webContents.send('menu:openProject', projectPath);
      },
    }));
  }

  private addToRecentProjects(projectPath: string): void {
    const recent = store.get('recentProjects') as string[];
    const filtered = recent.filter((p) => p !== projectPath);
    filtered.unshift(projectPath);
    store.set('recentProjects', filtered.slice(0, 10));
  }
}

// Initialize the application
new TeamBeamApp();