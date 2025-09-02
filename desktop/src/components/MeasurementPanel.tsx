import React, { useState, useCallback, useEffect } from 'react';
import { measurementToolsService, Measurement, MeasurementSettings, MeasurementPoint } from '../services/measurementTools';
import './MeasurementPanel.css';

interface MeasurementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  measurements: Measurement[];
  onMeasurementUpdate: (measurements: Measurement[]) => void;
  selectedMeasurementTool: 'linear' | 'area' | 'angle' | 'volume' | null;
  onMeasurementCreate: (type: string, points: MeasurementPoint[]) => void;
}

export const MeasurementPanel: React.FC<MeasurementPanelProps> = ({
  isOpen,
  onClose,
  measurements,
  onMeasurementUpdate,
  selectedMeasurementTool,
  onMeasurementCreate
}) => {
  const [settings, setSettings] = useState<MeasurementSettings>(measurementToolsService.getSettings());
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('csv');

  useEffect(() => {
    if (isOpen) {
      setSettings(measurementToolsService.getSettings());
    }
  }, [isOpen]);

  const handleSettingsUpdate = useCallback((newSettings: Partial<MeasurementSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    measurementToolsService.updateSettings(newSettings);
    
    // Update measurements to reflect new settings
    const updatedMeasurements = measurementToolsService.getAllMeasurements();
    onMeasurementUpdate(updatedMeasurements);
  }, [settings, onMeasurementUpdate]);

  const handleMeasurementDelete = useCallback((measurementId: string) => {
    if (window.confirm('Delete this measurement?')) {
      measurementToolsService.deleteMeasurement(measurementId);
      const updatedMeasurements = measurementToolsService.getAllMeasurements();
      onMeasurementUpdate(updatedMeasurements);
      
      if (selectedMeasurement?.id === measurementId) {
        setSelectedMeasurement(null);
      }
    }
  }, [selectedMeasurement, onMeasurementUpdate]);

  const handleMeasurementLabelUpdate = useCallback((measurementId: string, label: string) => {
    measurementToolsService.updateMeasurementLabel(measurementId, label);
    const updatedMeasurements = measurementToolsService.getAllMeasurements();
    onMeasurementUpdate(updatedMeasurements);
  }, [onMeasurementUpdate]);

  const handleExport = useCallback(async () => {
    try {
      const exportData = measurementToolsService.exportMeasurements(exportFormat);
      
      if (typeof exportData === 'string') {
        // Text format - download as file
        const blob = new Blob([exportData], { 
          type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `measurements.${exportFormat}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }, [exportFormat]);

  const getMeasurementIcon = (type: string) => {
    switch (type) {
      case 'linear': return '📏';
      case 'area': return '⬜';
      case 'angle': return '📐';
      case 'volume': return '📦';
      default: return '📏';
    }
  };

  const formatMeasurementInfo = (measurement: Measurement) => {
    switch (measurement.type) {
      case 'linear':
        return `${measurement.startPoint.x.toFixed(1)}, ${measurement.startPoint.y.toFixed(1)} → ${measurement.endPoint.x.toFixed(1)}, ${measurement.endPoint.y.toFixed(1)}`;
      case 'area':
        return `${measurement.points.length} points`;
      case 'angle':
        return `Vertex: ${measurement.vertex.x.toFixed(1)}, ${measurement.vertex.y.toFixed(1)}`;
      case 'volume':
        return `Base: ${measurement.baseArea.length} points, Height: ${measurement.height.toFixed(2)}${measurement.result.unit.replace('³', '')}`;
      default:
        return '';
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="measurement-panel">
      <div className="measurement-panel-header">
        <h3>📏 Measurements</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="measurement-panel-content">
        {/* Measurement Tools */}
        <div className="measurement-tools">
          <h4>Measurement Tools</h4>
          <div className="tool-buttons">
            <button 
              className={`measurement-tool-btn ${selectedMeasurementTool === 'linear' ? 'active' : ''}`}
              title="Linear Measurement"
            >
              📏 Linear
            </button>
            <button 
              className={`measurement-tool-btn ${selectedMeasurementTool === 'area' ? 'active' : ''}`}
              title="Area Measurement"
            >
              ⬜ Area
            </button>
            <button 
              className={`measurement-tool-btn ${selectedMeasurementTool === 'angle' ? 'active' : ''}`}
              title="Angle Measurement"
            >
              📐 Angle
            </button>
            <button 
              className={`measurement-tool-btn ${selectedMeasurementTool === 'volume' ? 'active' : ''}`}
              title="Volume Measurement"
            >
              📦 Volume
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="measurement-settings">
          <h4>Settings</h4>
          
          <div className="setting-group">
            <label>Primary Unit:</label>
            <select 
              value={settings.primaryUnit} 
              onChange={(e) => handleSettingsUpdate({ primaryUnit: e.target.value as any })}
            >
              <option value="ft">Feet (ft)</option>
              <option value="m">Meters (m)</option>
              <option value="in">Inches (in)</option>
              <option value="cm">Centimeters (cm)</option>
              <option value="mm">Millimeters (mm)</option>
            </select>
          </div>

          <div className="setting-group">
            <label>Precision:</label>
            <select 
              value={settings.precision} 
              onChange={(e) => handleSettingsUpdate({ precision: parseInt(e.target.value) })}
            >
              <option value={0}>0 decimal places</option>
              <option value={1}>1 decimal place</option>
              <option value={2}>2 decimal places</option>
              <option value={3}>3 decimal places</option>
              <option value={4}>4 decimal places</option>
            </select>
          </div>

          <div className="setting-group">
            <label>Angle Unit:</label>
            <select 
              value={settings.angleUnit} 
              onChange={(e) => handleSettingsUpdate({ angleUnit: e.target.value as any })}
            >
              <option value="degrees">Degrees (°)</option>
              <option value="radians">Radians (rad)</option>
            </select>
          </div>

          <div className="setting-group">
            <label>Default Scale:</label>
            <input
              type="number"
              value={settings.defaultScale}
              onChange={(e) => handleSettingsUpdate({ defaultScale: parseFloat(e.target.value) || 1 })}
              step="0.1"
              min="0.01"
            />
          </div>

          <div className="setting-checkbox">
            <label>
              <input
                type="checkbox"
                checked={settings.showFormulas}
                onChange={(e) => handleSettingsUpdate({ showFormulas: e.target.checked })}
              />
              Show Formulas
            </label>
          </div>
        </div>

        {/* Measurements List */}
        <div className="measurements-list">
          <div className="measurements-header">
            <h4>Active Measurements ({measurements.length})</h4>
            {measurements.length > 0 && (
              <div className="export-controls">
                <select 
                  value={exportFormat} 
                  onChange={(e) => setExportFormat(e.target.value as any)}
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
                <button className="export-btn" onClick={handleExport}>
                  📤 Export
                </button>
              </div>
            )}
          </div>

          {measurements.length === 0 ? (
            <div className="no-measurements">
              <p>No measurements yet</p>
              <p>Select a measurement tool and click on the drawing to start measuring</p>
            </div>
          ) : (
            <div className="measurements-scroll">
              {measurements.map((measurement) => (
                <div 
                  key={measurement.id} 
                  className={`measurement-item ${selectedMeasurement?.id === measurement.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMeasurement(measurement)}
                >
                  <div className="measurement-header">
                    <span className="measurement-icon">{getMeasurementIcon(measurement.type)}</span>
                    <div className="measurement-info">
                      <div className="measurement-value">
                        {measurement.result.displayValue}
                      </div>
                      <div className="measurement-type">
                        {measurement.type.charAt(0).toUpperCase() + measurement.type.slice(1)}
                      </div>
                    </div>
                    <button 
                      className="delete-measurement-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMeasurementDelete(measurement.id);
                      }}
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="measurement-details">
                    <div className="measurement-coords">
                      {formatMeasurementInfo(measurement)}
                    </div>
                    
                    {measurement.label && (
                      <div className="measurement-label">
                        Label: {measurement.label}
                      </div>
                    )}

                    {settings.showFormulas && measurement.result.formula && (
                      <div className="measurement-formula">
                        Formula: {measurement.result.formula}
                      </div>
                    )}

                    <div className="measurement-meta">
                      Created: {new Date(measurement.created).toLocaleString()}
                    </div>
                  </div>

                  {selectedMeasurement?.id === measurement.id && (
                    <div className="measurement-actions">
                      <input
                        type="text"
                        placeholder="Add label..."
                        value={measurement.label || ''}
                        onChange={(e) => handleMeasurementLabelUpdate(measurement.id, e.target.value)}
                        className="measurement-label-input"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeasurementPanel;