import React, { useState, useEffect } from 'react';

interface AppSettings {
  general: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    autoSave: boolean;
    confirmDelete: boolean;
    defaultView: 'grid' | 'list';
  };
  processing: {
    ocrLanguage: string;
    ocrConfidence: number;
    maxFileSize: number;
    autoProcess: boolean;
    parallelProcessing: boolean;
    maxConcurrentJobs: number;
  };
  export: {
    defaultFormat: 'pdf' | 'txt' | 'docx' | 'xlsx';
    preserveFormatting: boolean;
    includeMetadata: boolean;
    compressImages: boolean;
    outputQuality: number;
  };
  security: {
    autoLock: boolean;
    lockTimeout: number;
    requirePassword: boolean;
    encryptFiles: boolean;
    clearTempFiles: boolean;
  };
  advanced: {
    enableLogging: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    cacheSize: number;
    experimentalFeatures: boolean;
    hardwareAcceleration: boolean;
  };
}

const defaultSettings: AppSettings = {
  general: {
    theme: 'auto',
    language: 'en',
    autoSave: true,
    confirmDelete: true,
    defaultView: 'grid'
  },
  processing: {
    ocrLanguage: 'eng',
    ocrConfidence: 0.8,
    maxFileSize: 50,
    autoProcess: false,
    parallelProcessing: true,
    maxConcurrentJobs: 3
  },
  export: {
    defaultFormat: 'pdf',
    preserveFormatting: true,
    includeMetadata: true,
    compressImages: false,
    outputQuality: 85
  },
  security: {
    autoLock: false,
    lockTimeout: 15,
    requirePassword: false,
    encryptFiles: false,
    clearTempFiles: true
  },
  advanced: {
    enableLogging: true,
    logLevel: 'info',
    cacheSize: 500,
    experimentalFeatures: false,
    hardwareAcceleration: true
  }
};

const Preferences: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<keyof AppSettings>('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    // Load settings from storage
    const savedSettings = localStorage.getItem('teambeam-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  const updateSetting = (category: keyof AppSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    localStorage.setItem('teambeam-settings', JSON.stringify(settings));
    setHasChanges(false);
    // In a real app, this would sync with the main process
    console.log('Settings saved:', settings);
  };

  const resetSettings = () => {
    if (window.confirm('Reset all settings to defaults? This cannot be undone.')) {
      setSettings(defaultSettings);
      setHasChanges(true);
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'teambeam-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setSettings({ ...defaultSettings, ...imported });
        setHasChanges(true);
        console.log('Settings imported successfully');
      } catch (error) {
        console.error('Failed to import settings:', error);
        alert('Invalid settings file');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const TabButton: React.FC<{ tab: keyof AppSettings; label: string; icon: string }> = ({ tab, label, icon }) => (
    <button
      className={`tab-button ${activeTab === tab ? 'active' : ''}`}
      onClick={() => setActiveTab(tab)}
    >
      <span className="tab-icon">{icon}</span>
      <span className="tab-label">{label}</span>
    </button>
  );

  const SettingRow: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({ 
    label, 
    description, 
    children 
  }) => (
    <div className="setting-row">
      <div className="setting-info">
        <label className="setting-label">{label}</label>
        {description && <p className="setting-description">{description}</p>}
      </div>
      <div className="setting-control">
        {children}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="tab-content">
            <h3>General Settings</h3>
            
            <SettingRow 
              label="Theme" 
              description="Choose the application appearance"
            >
              <select
                value={settings.general.theme}
                onChange={(e) => updateSetting('general', 'theme', e.target.value)}
              >
                <option value="auto">Auto (System)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </SettingRow>

            <SettingRow 
              label="Language" 
              description="Application interface language"
            >
              <select
                value={settings.general.language}
                onChange={(e) => updateSetting('general', 'language', e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </SettingRow>

            <SettingRow 
              label="Auto Save" 
              description="Automatically save documents and settings"
            >
              <input
                type="checkbox"
                checked={settings.general.autoSave}
                onChange={(e) => updateSetting('general', 'autoSave', e.target.checked)}
              />
            </SettingRow>

            <SettingRow 
              label="Confirm Delete" 
              description="Show confirmation dialog before deleting items"
            >
              <input
                type="checkbox"
                checked={settings.general.confirmDelete}
                onChange={(e) => updateSetting('general', 'confirmDelete', e.target.checked)}
              />
            </SettingRow>

            <SettingRow 
              label="Default View" 
              description="Default layout for file listings"
            >
              <select
                value={settings.general.defaultView}
                onChange={(e) => updateSetting('general', 'defaultView', e.target.value)}
              >
                <option value="grid">Grid</option>
                <option value="list">List</option>
              </select>
            </SettingRow>
          </div>
        );

      case 'processing':
        return (
          <div className="tab-content">
            <h3>Document Processing</h3>
            
            <SettingRow 
              label="OCR Language" 
              description="Primary language for optical character recognition"
            >
              <select
                value={settings.processing.ocrLanguage}
                onChange={(e) => updateSetting('processing', 'ocrLanguage', e.target.value)}
              >
                <option value="eng">English</option>
                <option value="spa">Spanish</option>
                <option value="fra">French</option>
                <option value="deu">German</option>
                <option value="jpn">Japanese</option>
                <option value="chi_sim">Chinese (Simplified)</option>
              </select>
            </SettingRow>

            <SettingRow 
              label="OCR Confidence" 
              description="Minimum confidence threshold for text recognition"
            >
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.05"
                value={settings.processing.ocrConfidence}
                onChange={(e) => updateSetting('processing', 'ocrConfidence', parseFloat(e.target.value))}
              />
              <span className="range-value">{Math.round(settings.processing.ocrConfidence * 100)}%</span>
            </SettingRow>

            <SettingRow 
              label="Max File Size" 
              description="Maximum file size for processing (MB)"
            >
              <input
                type="number"
                min="1"
                max="500"
                value={settings.processing.maxFileSize}
                onChange={(e) => updateSetting('processing', 'maxFileSize', parseInt(e.target.value))}
              />
            </SettingRow>

            <SettingRow 
              label="Auto Process" 
              description="Automatically start processing when files are added"
            >
              <input
                type="checkbox"
                checked={settings.processing.autoProcess}
                onChange={(e) => updateSetting('processing', 'autoProcess', e.target.checked)}
              />
            </SettingRow>

            <SettingRow 
              label="Parallel Processing" 
              description="Process multiple files simultaneously"
            >
              <input
                type="checkbox"
                checked={settings.processing.parallelProcessing}
                onChange={(e) => updateSetting('processing', 'parallelProcessing', e.target.checked)}
              />
            </SettingRow>

            <SettingRow 
              label="Max Concurrent Jobs" 
              description="Maximum number of files to process at once"
            >
              <input
                type="number"
                min="1"
                max="10"
                value={settings.processing.maxConcurrentJobs}
                onChange={(e) => updateSetting('processing', 'maxConcurrentJobs', parseInt(e.target.value))}
                disabled={!settings.processing.parallelProcessing}
              />
            </SettingRow>
          </div>
        );

      case 'export':
        return (
          <div className="tab-content">
            <h3>Export Settings</h3>
            
            <SettingRow 
              label="Default Format" 
              description="Default export format for processed documents"
            >
              <select
                value={settings.export.defaultFormat}
                onChange={(e) => updateSetting('export', 'defaultFormat', e.target.value)}
              >
                <option value="pdf">PDF</option>
                <option value="txt">Plain Text</option>
                <option value="docx">Word Document</option>
                <option value="xlsx">Excel Spreadsheet</option>
              </select>
            </SettingRow>

            <SettingRow 
              label="Preserve Formatting" 
              description="Maintain original document formatting when possible"
            >
              <input
                type="checkbox"
                checked={settings.export.preserveFormatting}
                onChange={(e) => updateSetting('export', 'preserveFormatting', e.target.checked)}
              />
            </SettingRow>

            <SettingRow 
              label="Include Metadata" 
              description="Include processing metadata in exported files"
            >
              <input
                type="checkbox"
                checked={settings.export.includeMetadata}
                onChange={(e) => updateSetting('export', 'includeMetadata', e.target.checked)}
              />
            </SettingRow>

            <SettingRow 
              label="Compress Images" 
              description="Reduce image file sizes in exported documents"
            >
              <input
                type="checkbox"
                checked={settings.export.compressImages}
                onChange={(e) => updateSetting('export', 'compressImages', e.target.checked)}
              />
            </SettingRow>

            <SettingRow 
              label="Output Quality" 
              description="Quality level for exported images and documents"
            >
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={settings.export.outputQuality}
                onChange={(e) => updateSetting('export', 'outputQuality', parseInt(e.target.value))}
              />
              <span className="range-value">{settings.export.outputQuality}%</span>
            </SettingRow>
          </div>
        );

      case 'security':
        return (
          <div className="tab-content">
            <h3>Security & Privacy</h3>
            
            <SettingRow 
              label="Auto Lock" 
              description="Automatically lock the application when idle"
            >
              <input
                type="checkbox"
                checked={settings.security.autoLock}
                onChange={(e) => updateSetting('security', 'autoLock', e.target.checked)}
              />
            </SettingRow>

            <SettingRow 
              label="Lock Timeout" 
              description="Minutes of inactivity before auto-lock"
            >
              <input
                type="number"
                min="5"
                max="120"
                value={settings.security.lockTimeout}
                onChange={(e) => updateSetting('security', 'lockTimeout', parseInt(e.target.value))}
                disabled={!settings.security.autoLock}
              />
            </SettingRow>

            <SettingRow 
              label="Require Password" 
              description="Require password to access the application"
            >
              <input
                type="checkbox"
                checked={settings.security.requirePassword}
                onChange={(e) => updateSetting('security', 'requirePassword', e.target.checked)}
              />
            </SettingRow>

            <SettingRow 
              label="Encrypt Files" 
              description="Encrypt processed files for additional security"
            >
              <input
                type="checkbox"
                checked={settings.security.encryptFiles}
                onChange={(e) => updateSetting('security', 'encryptFiles', e.target.checked)}
              />
            </SettingRow>

            <SettingRow 
              label="Clear Temp Files" 
              description="Automatically delete temporary processing files"
            >
              <input
                type="checkbox"
                checked={settings.security.clearTempFiles}
                onChange={(e) => updateSetting('security', 'clearTempFiles', e.target.checked)}
              />
            </SettingRow>
          </div>
        );

      case 'advanced':
        return (
          <div className="tab-content">
            <h3>Advanced Settings</h3>
            
            <SettingRow 
              label="Enable Logging" 
              description="Generate application logs for debugging"
            >
              <input
                type="checkbox"
                checked={settings.advanced.enableLogging}
                onChange={(e) => updateSetting('advanced', 'enableLogging', e.target.checked)}
              />
            </SettingRow>

            <SettingRow 
              label="Log Level" 
              description="Detail level for application logs"
            >
              <select
                value={settings.advanced.logLevel}
                onChange={(e) => updateSetting('advanced', 'logLevel', e.target.value)}
                disabled={!settings.advanced.enableLogging}
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </SettingRow>

            <SettingRow 
              label="Cache Size" 
              description="Maximum cache size in MB"
            >
              <input
                type="number"
                min="100"
                max="2000"
                step="50"
                value={settings.advanced.cacheSize}
                onChange={(e) => updateSetting('advanced', 'cacheSize', parseInt(e.target.value))}
              />
            </SettingRow>

            <SettingRow 
              label="Experimental Features" 
              description="Enable beta features and experimental functionality"
            >
              <input
                type="checkbox"
                checked={settings.advanced.experimentalFeatures}
                onChange={(e) => updateSetting('advanced', 'experimentalFeatures', e.target.checked)}
              />
            </SettingRow>

            <SettingRow 
              label="Hardware Acceleration" 
              description="Use GPU for processing when available"
            >
              <input
                type="checkbox"
                checked={settings.advanced.hardwareAcceleration}
                onChange={(e) => updateSetting('advanced', 'hardwareAcceleration', e.target.checked)}
              />
            </SettingRow>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="preferences">
      <div className="preferences-header">
        <h2>Settings & Preferences</h2>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={() => document.getElementById('import-input')?.click()}
            disabled={isImporting}
          >
            {isImporting ? 'Importing...' : '📥 Import'}
          </button>
          <button className="btn-secondary" onClick={exportSettings}>
            📤 Export
          </button>
          <button className="btn-danger" onClick={resetSettings}>
            🔄 Reset
          </button>
          <button 
            className={`btn-primary ${hasChanges ? 'has-changes' : ''}`}
            onClick={saveSettings}
            disabled={!hasChanges}
          >
            💾 Save Changes
          </button>
        </div>
      </div>

      <div className="preferences-content">
        <div className="sidebar">
          <nav className="tab-navigation">
            <TabButton tab="general" label="General" icon="⚙️" />
            <TabButton tab="processing" label="Processing" icon="🔄" />
            <TabButton tab="export" label="Export" icon="📤" />
            <TabButton tab="security" label="Security" icon="🔒" />
            <TabButton tab="advanced" label="Advanced" icon="🛠️" />
          </nav>
        </div>

        <div className="main-content">
          {renderTabContent()}
        </div>
      </div>

      <input
        id="import-input"
        type="file"
        accept=".json"
        onChange={importSettings}
        style={{ display: 'none' }}
      />

      <style>{`
        .preferences {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .preferences-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .preferences-header h2 {
          margin: 0;
          color: #333;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .preferences-content {
          display: flex;
          flex: 1;
          gap: 30px;
          overflow: hidden;
        }

        .sidebar {
          width: 250px;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 0;
          overflow: hidden;
        }

        .tab-navigation {
          display: flex;
          flex-direction: column;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          border-bottom: 1px solid #e9ecef;
        }

        .tab-button:hover {
          background: #e9ecef;
        }

        .tab-button.active {
          background: #007acc;
          color: white;
        }

        .tab-button:last-child {
          border-bottom: none;
        }

        .tab-icon {
          font-size: 18px;
        }

        .tab-label {
          font-weight: 500;
        }

        .main-content {
          flex: 1;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow-y: auto;
        }

        .tab-content {
          padding: 30px;
        }

        .tab-content h3 {
          margin: 0 0 30px 0;
          color: #333;
          font-size: 24px;
          font-weight: 600;
        }

        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .setting-row:last-child {
          border-bottom: none;
        }

        .setting-info {
          flex: 1;
          margin-right: 20px;
        }

        .setting-label {
          display: block;
          font-weight: 500;
          color: #333;
          margin-bottom: 5px;
          font-size: 16px;
        }

        .setting-description {
          margin: 0;
          font-size: 14px;
          color: #666;
          line-height: 1.4;
        }

        .setting-control {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 200px;
          justify-content: flex-end;
        }

        .setting-control select,
        .setting-control input[type="number"] {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          min-width: 120px;
        }

        .setting-control input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .setting-control input[type="range"] {
          flex: 1;
          min-width: 120px;
        }

        .range-value {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          min-width: 40px;
          text-align: right;
        }

        .btn-primary {
          background: #007acc;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #005fa3;
        }

        .btn-primary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .btn-primary.has-changes {
          background: #28a745;
        }

        .btn-primary.has-changes:hover {
          background: #218838;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
        }

        .btn-secondary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .preferences-content {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
          }

          .tab-navigation {
            flex-direction: row;
            overflow-x: auto;
          }

          .tab-button {
            white-space: nowrap;
          }

          .setting-row {
            flex-direction: column;
            align-items: stretch;
          }

          .setting-info {
            margin-right: 0;
            margin-bottom: 15px;
          }

          .setting-control {
            justify-content: stretch;
          }

          .header-actions {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

export default Preferences;