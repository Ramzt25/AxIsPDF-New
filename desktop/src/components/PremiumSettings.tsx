import React, { useState } from 'react';
import './PremiumSettings.css';

interface SettingsCategory {
  id: string;
  title: string;
  icon: string;
  component: React.ComponentType;
}

interface SettingItem {
  id: string;
  title: string;
  description?: string;
  type: 'toggle' | 'select' | 'input' | 'slider' | 'color';
  value: any;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: any) => void;
}

const GeneralSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    autoSave: true,
    saveInterval: 300,
    showWelcomeScreen: true,
    theme: 'system',
    language: 'en-US'
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const settingItems: SettingItem[] = [
    {
      id: 'autoSave',
      title: 'Auto-save documents',
      description: 'Automatically save changes to prevent data loss',
      type: 'toggle',
      value: settings.autoSave,
      onChange: (value) => handleSettingChange('autoSave', value)
    },
    {
      id: 'saveInterval',
      title: 'Auto-save interval',
      description: 'Time between automatic saves (in seconds)',
      type: 'slider',
      value: settings.saveInterval,
      min: 30,
      max: 600,
      step: 30,
      onChange: (value) => handleSettingChange('saveInterval', value)
    },
    {
      id: 'showWelcomeScreen',
      title: 'Show welcome screen',
      description: 'Display welcome screen on startup',
      type: 'toggle',
      value: settings.showWelcomeScreen,
      onChange: (value) => handleSettingChange('showWelcomeScreen', value)
    },
    {
      id: 'theme',
      title: 'Theme',
      description: 'Choose your preferred theme',
      type: 'select',
      value: settings.theme,
      options: [
        { label: 'System', value: 'system' },
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'Blue', value: 'blue' }
      ],
      onChange: (value) => handleSettingChange('theme', value)
    },
    {
      id: 'language',
      title: 'Language',
      description: 'Interface language',
      type: 'select',
      value: settings.language,
      options: [
        { label: 'English (US)', value: 'en-US' },
        { label: 'English (UK)', value: 'en-GB' },
        { label: 'Spanish', value: 'es-ES' },
        { label: 'French', value: 'fr-FR' },
        { label: 'German', value: 'de-DE' }
      ],
      onChange: (value) => handleSettingChange('language', value)
    }
  ];

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3>General Settings</h3>
        <p>Configure basic application preferences</p>
      </div>
      
      <div className="settings-grid">
        {settingItems.map(item => (
          <SettingControl key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

const EditorSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    defaultZoom: 100,
    snapToGrid: true,
    gridSize: 10,
    showRulers: true,
    showGrid: false,
    annotationColor: '#3b82f6',
    strokeWidth: 2
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const settingItems: SettingItem[] = [
    {
      id: 'defaultZoom',
      title: 'Default zoom level',
      description: 'Initial zoom when opening documents',
      type: 'slider',
      value: settings.defaultZoom,
      min: 25,
      max: 400,
      step: 25,
      onChange: (value) => handleSettingChange('defaultZoom', value)
    },
    {
      id: 'snapToGrid',
      title: 'Snap to grid',
      description: 'Snap tool placement to grid points',
      type: 'toggle',
      value: settings.snapToGrid,
      onChange: (value) => handleSettingChange('snapToGrid', value)
    },
    {
      id: 'gridSize',
      title: 'Grid size',
      description: 'Size of grid squares in pixels',
      type: 'slider',
      value: settings.gridSize,
      min: 5,
      max: 50,
      step: 5,
      onChange: (value) => handleSettingChange('gridSize', value)
    },
    {
      id: 'showRulers',
      title: 'Show rulers',
      description: 'Display measurement rulers around the canvas',
      type: 'toggle',
      value: settings.showRulers,
      onChange: (value) => handleSettingChange('showRulers', value)
    },
    {
      id: 'showGrid',
      title: 'Show grid',
      description: 'Display grid overlay on canvas',
      type: 'toggle',
      value: settings.showGrid,
      onChange: (value) => handleSettingChange('showGrid', value)
    },
    {
      id: 'annotationColor',
      title: 'Default annotation color',
      description: 'Default color for new annotations',
      type: 'color',
      value: settings.annotationColor,
      onChange: (value) => handleSettingChange('annotationColor', value)
    },
    {
      id: 'strokeWidth',
      title: 'Default stroke width',
      description: 'Default line thickness for annotations',
      type: 'slider',
      value: settings.strokeWidth,
      min: 1,
      max: 10,
      step: 1,
      onChange: (value) => handleSettingChange('strokeWidth', value)
    }
  ];

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3>Editor Settings</h3>
        <p>Customize the PDF editor behavior and appearance</p>
      </div>
      
      <div className="settings-grid">
        {settingItems.map(item => (
          <SettingControl key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

const CollaborationSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    realTimeCollaboration: true,
    shareByDefault: false,
    allowGuestAccess: true,
    notifyOnComments: true,
    notifyOnChanges: false,
    presenceVisibility: 'team'
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const settingItems: SettingItem[] = [
    {
      id: 'realTimeCollaboration',
      title: 'Real-time collaboration',
      description: 'Enable live collaboration features',
      type: 'toggle',
      value: settings.realTimeCollaboration,
      onChange: (value) => handleSettingChange('realTimeCollaboration', value)
    },
    {
      id: 'shareByDefault',
      title: 'Share new projects by default',
      description: 'Automatically make new projects collaborative',
      type: 'toggle',
      value: settings.shareByDefault,
      onChange: (value) => handleSettingChange('shareByDefault', value)
    },
    {
      id: 'allowGuestAccess',
      title: 'Allow guest access',
      description: 'Let people without accounts view shared documents',
      type: 'toggle',
      value: settings.allowGuestAccess,
      onChange: (value) => handleSettingChange('allowGuestAccess', value)
    },
    {
      id: 'notifyOnComments',
      title: 'Notify on new comments',
      description: 'Get notifications when someone comments',
      type: 'toggle',
      value: settings.notifyOnComments,
      onChange: (value) => handleSettingChange('notifyOnComments', value)
    },
    {
      id: 'notifyOnChanges',
      title: 'Notify on document changes',
      description: 'Get notifications when documents are modified',
      type: 'toggle',
      value: settings.notifyOnChanges,
      onChange: (value) => handleSettingChange('notifyOnChanges', value)
    },
    {
      id: 'presenceVisibility',
      title: 'Show presence to',
      description: 'Who can see when you are online',
      type: 'select',
      value: settings.presenceVisibility,
      options: [
        { label: 'Everyone', value: 'everyone' },
        { label: 'Team members only', value: 'team' },
        { label: 'No one', value: 'none' }
      ],
      onChange: (value) => handleSettingChange('presenceVisibility', value)
    }
  ];

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3>Collaboration Settings</h3>
        <p>Manage team collaboration and sharing preferences</p>
      </div>
      
      <div className="settings-grid">
        {settingItems.map(item => (
          <SettingControl key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

const SettingControl: React.FC<{ item: SettingItem }> = ({ item }) => {
  const renderControl = () => {
    switch (item.type) {
      case 'toggle':
        return (
          <label className="toggle-control">
            <input
              type="checkbox"
              checked={item.value}
              onChange={(e) => item.onChange(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        );
      
      case 'select':
        return (
          <select
            className="select-control"
            value={item.value}
            onChange={(e) => item.onChange(e.target.value)}
          >
            {item.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'input':
        return (
          <input
            type="text"
            className="input-control"
            value={item.value}
            onChange={(e) => item.onChange(e.target.value)}
          />
        );
      
      case 'slider':
        return (
          <div className="slider-control">
            <input
              type="range"
              min={item.min}
              max={item.max}
              step={item.step}
              value={item.value}
              onChange={(e) => item.onChange(parseInt(e.target.value))}
              className="slider-input"
            />
            <span className="slider-value">{item.value}</span>
          </div>
        );
      
      case 'color':
        return (
          <input
            type="color"
            className="color-control"
            value={item.value}
            onChange={(e) => item.onChange(e.target.value)}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="setting-control">
      <div className="setting-info">
        <label className="setting-title">{item.title}</label>
        {item.description && (
          <p className="setting-description">{item.description}</p>
        )}
      </div>
      <div className="setting-input">
        {renderControl()}
      </div>
    </div>
  );
};

export const PremiumSettings: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('general');

  const categories: SettingsCategory[] = [
    {
      id: 'general',
      title: 'General',
      icon: '⚙️',
      component: GeneralSettings
    },
    {
      id: 'editor',
      title: 'Editor',
      icon: '✏️',
      component: EditorSettings
    },
    {
      id: 'collaboration',
      title: 'Collaboration',
      icon: '👥',
      component: CollaborationSettings
    }
  ];

  const ActiveComponent = categories.find(cat => cat.id === activeCategory)?.component || GeneralSettings;

  return (
    <div className="premium-settings">
      <div className="settings-header">
        <div className="settings-title-section">
          <h1>Settings</h1>
          <p>Customize TeamBeam to match your workflow</p>
        </div>
        
        <div className="settings-actions">
          <button className="btn btn-secondary">Reset to Defaults</button>
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </div>

      <div className="settings-body">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            {categories.map(category => (
              <button
                key={category.id}
                className={`settings-nav-item ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                <span className="nav-icon">{category.icon}</span>
                <span className="nav-title">{category.title}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="settings-content">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};