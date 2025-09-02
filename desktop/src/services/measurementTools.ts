// src/services/measurementTools.ts
// Advanced Measurement Tools - Precision calculation tools for construction

export interface MeasurementPoint {
  x: number;
  y: number;
  pageNumber: number;
}

export interface MeasurementResult {
  value: number;
  unit: string;
  precision: number;
  displayValue: string;
  formula?: string;
  notes?: string;
}

export interface LinearMeasurement {
  id: string;
  type: 'linear';
  startPoint: MeasurementPoint;
  endPoint: MeasurementPoint;
  result: MeasurementResult;
  scale: number; // PDF units to real world units
  created: string;
  label?: string;
}

export interface AreaMeasurement {
  id: string;
  type: 'area';
  points: MeasurementPoint[];
  result: MeasurementResult;
  scale: number;
  created: string;
  label?: string;
}

export interface AngleMeasurement {
  id: string;
  type: 'angle';
  vertex: MeasurementPoint;
  point1: MeasurementPoint;
  point2: MeasurementPoint;
  result: MeasurementResult;
  created: string;
  label?: string;
}

export interface VolumeMeasurement {
  id: string;
  type: 'volume';
  baseArea: MeasurementPoint[];
  height: number;
  result: MeasurementResult;
  scale: number;
  created: string;
  label?: string;
}

export type Measurement = LinearMeasurement | AreaMeasurement | AngleMeasurement | VolumeMeasurement;

export interface MeasurementSettings {
  primaryUnit: 'ft' | 'm' | 'in' | 'cm' | 'mm';
  precision: number; // decimal places
  showFormulas: boolean;
  autoCalculateArea: boolean;
  defaultScale: number; // PDF units per real world unit
  angleUnit: 'degrees' | 'radians';
}

export class MeasurementToolsService {
  private measurements: Map<string, Measurement> = new Map();
  private settings: MeasurementSettings = {
    primaryUnit: 'ft',
    precision: 2,
    showFormulas: true,
    autoCalculateArea: true,
    defaultScale: 1,
    angleUnit: 'degrees'
  };

  // Unit conversion factors (to meters)
  private unitFactors = {
    'ft': 0.3048,
    'm': 1,
    'in': 0.0254,
    'cm': 0.01,
    'mm': 0.001
  };

  // Linear measurement tools
  createLinearMeasurement(
    startPoint: MeasurementPoint,
    endPoint: MeasurementPoint,
    scale: number = this.settings.defaultScale,
    label?: string
  ): LinearMeasurement {
    const distance = this.calculateDistance(startPoint, endPoint);
    const realWorldDistance = distance * scale;
    const result = this.formatMeasurementResult(realWorldDistance, this.settings.primaryUnit);

    const measurement: LinearMeasurement = {
      id: `linear-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'linear',
      startPoint,
      endPoint,
      result: {
        ...result,
        formula: this.settings.showFormulas ? `√[(x₂-x₁)² + (y₂-y₁)²] × scale` : undefined
      },
      scale,
      created: new Date().toISOString(),
      label
    };

    this.measurements.set(measurement.id, measurement);
    return measurement;
  }

  // Area measurement tools
  createAreaMeasurement(
    points: MeasurementPoint[],
    scale: number = this.settings.defaultScale,
    label?: string
  ): AreaMeasurement {
    if (points.length < 3) {
      throw new Error('Area measurement requires at least 3 points');
    }

    const area = this.calculatePolygonArea(points);
    const realWorldArea = area * scale * scale; // Scale factor squared for area
    const result = this.formatAreaResult(realWorldArea, this.settings.primaryUnit);

    const measurement: AreaMeasurement = {
      id: `area-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'area',
      points: [...points],
      result: {
        ...result,
        formula: this.settings.showFormulas ? 'Shoelace formula: ½|∑(xᵢyᵢ₊₁ - xᵢ₊₁yᵢ)|' : undefined
      },
      scale,
      created: new Date().toISOString(),
      label
    };

    this.measurements.set(measurement.id, measurement);
    return measurement;
  }

  // Angle measurement tools
  createAngleMeasurement(
    vertex: MeasurementPoint,
    point1: MeasurementPoint,
    point2: MeasurementPoint,
    label?: string
  ): AngleMeasurement {
    const angle = this.calculateAngle(vertex, point1, point2);
    const result = this.formatAngleResult(angle);

    const measurement: AngleMeasurement = {
      id: `angle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'angle',
      vertex,
      point1,
      point2,
      result: {
        ...result,
        formula: this.settings.showFormulas ? 'arccos[(u·v)/(|u||v|)]' : undefined
      },
      created: new Date().toISOString(),
      label
    };

    this.measurements.set(measurement.id, measurement);
    return measurement;
  }

  // Volume measurement tools
  createVolumeMeasurement(
    basePoints: MeasurementPoint[],
    height: number,
    scale: number = this.settings.defaultScale,
    label?: string
  ): VolumeMeasurement {
    const baseArea = this.calculatePolygonArea(basePoints);
    const realWorldArea = baseArea * scale * scale;
    const realWorldHeight = height * scale;
    const volume = realWorldArea * realWorldHeight;
    
    const result = this.formatVolumeResult(volume, this.settings.primaryUnit);

    const measurement: VolumeMeasurement = {
      id: `volume-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'volume',
      baseArea: [...basePoints],
      height: realWorldHeight,
      result: {
        ...result,
        formula: this.settings.showFormulas ? 'Volume = Base Area × Height' : undefined
      },
      scale,
      created: new Date().toISOString(),
      label
    };

    this.measurements.set(measurement.id, measurement);
    return measurement;
  }

  // Calculation methods
  private calculateDistance(point1: MeasurementPoint, point2: MeasurementPoint): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculatePolygonArea(points: MeasurementPoint[]): number {
    if (points.length < 3) return 0;

    let area = 0;
    const n = points.length;

    // Shoelace formula
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    return Math.abs(area) / 2;
  }

  private calculateAngle(vertex: MeasurementPoint, point1: MeasurementPoint, point2: MeasurementPoint): number {
    // Create vectors from vertex to each point
    const v1 = { x: point1.x - vertex.x, y: point1.y - vertex.y };
    const v2 = { x: point2.x - vertex.x, y: point2.y - vertex.y };

    // Calculate dot product and magnitudes
    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    const magnitude1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const magnitude2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    // Calculate angle in radians
    const angleRad = Math.acos(dotProduct / (magnitude1 * magnitude2));
    
    return this.settings.angleUnit === 'degrees' ? (angleRad * 180) / Math.PI : angleRad;
  }

  // Formatting methods
  private formatMeasurementResult(value: number, unit: string): MeasurementResult {
    const convertedValue = this.convertFromMeters(value, unit);
    const roundedValue = Number(convertedValue.toFixed(this.settings.precision));
    
    return {
      value: roundedValue,
      unit: unit,
      precision: this.settings.precision,
      displayValue: `${roundedValue} ${unit}`
    };
  }

  private formatAreaResult(area: number, unit: string): MeasurementResult {
    const convertedArea = this.convertFromMeters(area, unit);
    const roundedArea = Number(convertedArea.toFixed(this.settings.precision));
    
    return {
      value: roundedArea,
      unit: `${unit}²`,
      precision: this.settings.precision,
      displayValue: `${roundedArea} ${unit}²`
    };
  }

  private formatAngleResult(angle: number): MeasurementResult {
    const roundedAngle = Number(angle.toFixed(this.settings.precision));
    const unit = this.settings.angleUnit === 'degrees' ? '°' : 'rad';
    
    return {
      value: roundedAngle,
      unit: unit,
      precision: this.settings.precision,
      displayValue: `${roundedAngle}${unit}`
    };
  }

  private formatVolumeResult(volume: number, unit: string): MeasurementResult {
    const convertedVolume = this.convertFromMeters(volume, unit);
    const roundedVolume = Number(convertedVolume.toFixed(this.settings.precision));
    
    return {
      value: roundedVolume,
      unit: `${unit}³`,
      precision: this.settings.precision,
      displayValue: `${roundedVolume} ${unit}³`
    };
  }

  private convertFromMeters(value: number, targetUnit: string): number {
    const factor = this.unitFactors[targetUnit as keyof typeof this.unitFactors];
    return value / factor;
  }

  // Management methods
  getMeasurement(id: string): Measurement | null {
    return this.measurements.get(id) || null;
  }

  getAllMeasurements(): Measurement[] {
    return Array.from(this.measurements.values());
  }

  getMeasurementsByType<T extends Measurement>(type: T['type']): T[] {
    return Array.from(this.measurements.values())
      .filter((m): m is T => m.type === type);
  }

  deleteMeasurement(id: string): boolean {
    return this.measurements.delete(id);
  }

  updateMeasurementLabel(id: string, label: string): boolean {
    const measurement = this.measurements.get(id);
    if (measurement) {
      measurement.label = label;
      return true;
    }
    return false;
  }

  // Settings management
  updateSettings(newSettings: Partial<MeasurementSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    // Recalculate all measurements with new settings
    this.recalculateAllMeasurements();
  }

  getSettings(): MeasurementSettings {
    return { ...this.settings };
  }

  private recalculateAllMeasurements(): void {
    // Recalculate display values for all measurements
    for (const measurement of this.measurements.values()) {
      switch (measurement.type) {
        case 'linear':
          const distance = this.calculateDistance(measurement.startPoint, measurement.endPoint);
          const realDistance = distance * measurement.scale;
          measurement.result = this.formatMeasurementResult(realDistance, this.settings.primaryUnit);
          break;
          
        case 'area':
          const area = this.calculatePolygonArea(measurement.points);
          const realArea = area * measurement.scale * measurement.scale;
          measurement.result = this.formatAreaResult(realArea, this.settings.primaryUnit);
          break;
          
        case 'angle':
          const angle = this.calculateAngle(measurement.vertex, measurement.point1, measurement.point2);
          measurement.result = this.formatAngleResult(angle);
          break;
          
        case 'volume':
          const baseArea = this.calculatePolygonArea(measurement.baseArea);
          const realBaseArea = baseArea * measurement.scale * measurement.scale;
          const volume = realBaseArea * measurement.height;
          measurement.result = this.formatVolumeResult(volume, this.settings.primaryUnit);
          break;
      }
    }
  }

  // Export measurements
  exportMeasurements(format: 'json' | 'csv' | 'excel'): string | Blob {
    const measurements = this.getAllMeasurements();
    
    switch (format) {
      case 'json':
        return JSON.stringify({
          measurements,
          settings: this.settings,
          exportedAt: new Date().toISOString()
        }, null, 2);
        
      case 'csv':
        return this.exportToCSV(measurements);
        
      case 'excel':
        throw new Error('Excel export not yet implemented');
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private exportToCSV(measurements: Measurement[]): string {
    const headers = ['ID', 'Type', 'Label', 'Value', 'Unit', 'Created', 'Formula'];
    const rows = measurements.map(m => [
      m.id,
      m.type,
      m.label || '',
      m.result.value.toString(),
      m.result.unit,
      m.created,
      m.result.formula || ''
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }
}

// Global service instance
export const measurementToolsService = new MeasurementToolsService();