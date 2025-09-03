import React, { useEffect, useRef, useState } from 'react';

interface PDFViewerProps {
  file: File;
  selectedTool: string | null;
  zoomLevel: number;
  currentPage: number;
  showGrid: boolean;
  showRulers: boolean;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onDocumentLoad: (totalPages: number) => void;
  className?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  selectedTool,
  zoomLevel,
  currentPage,
  showGrid,
  showRulers,
  onPageChange,
  onZoomChange,
  onDocumentLoad,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<any>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (file) {
      loadPDF();
    }
  }, [file]);

  useEffect(() => {
    // Simulate page count for now
    if (file) {
      // In a real implementation, this would come from PDF.js
      const mockPageCount = Math.floor(Math.random() * 50) + 10;
      onDocumentLoad(mockPageCount);
      setIsLoading(false);
    }
  }, [file, onDocumentLoad]);

  const loadPDF = async () => {
    setIsLoading(true);
    // In a real implementation, you would use PDF.js here
    // For now, we'll simulate the loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!selectedTool) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newAnnotation = {
      id: Date.now(),
      type: selectedTool,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      page: currentPage,
      timestamp: new Date(),
      color: '#FF6B6B',
      strokeWidth: 2
    };

    setCurrentAnnotation(newAnnotation);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCursorPosition({ x, y });

    if (isDrawing && currentAnnotation) {
      setCurrentAnnotation((prev: any) => ({
        ...prev,
        endX: x,
        endY: y
      }));
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentAnnotation) {
      setAnnotations(prev => [...prev, currentAnnotation]);
      setCurrentAnnotation(null);
      setIsDrawing(false);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      onZoomChange(zoomLevel + delta);
    }
  };

  const renderRulers = () => {
    if (!showRulers) return null;

    return (
      <>
        {/* Horizontal Ruler */}
        <div className="ruler horizontal-ruler">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="ruler-tick">
              <span className="ruler-number">{i}</span>
            </div>
          ))}
        </div>
        
        {/* Vertical Ruler */}
        <div className="ruler vertical-ruler">
          {Array.from({ length: 30 }, (_, i) => (
            <div key={i} className="ruler-tick">
              <span className="ruler-number">{i}</span>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderGrid = () => {
    if (!showGrid) return null;

    return (
      <div className="grid-overlay">
        <svg className="grid-svg" style={{ transform: `scale(${zoomLevel / 100})` }}>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    );
  };

  const renderAnnotations = () => {
    return annotations
      .filter(annotation => annotation.page === currentPage)
      .map(annotation => {
        const style = {
          position: 'absolute' as const,
          left: Math.min(annotation.startX, annotation.endX),
          top: Math.min(annotation.startY, annotation.endY),
          width: Math.abs(annotation.endX - annotation.startX),
          height: Math.abs(annotation.endY - annotation.startY),
          border: `${annotation.strokeWidth}px solid ${annotation.color}`,
          pointerEvents: 'none' as const,
          zIndex: 10
        };

        switch (annotation.type) {
          case 'rectangle':
            return <div key={annotation.id} className="annotation rectangle" style={style} />;
          case 'circle':
            return (
              <div 
                key={annotation.id} 
                className="annotation circle" 
                style={{
                  ...style,
                  borderRadius: '50%'
                }} 
              />
            );
          case 'text':
            return (
              <div 
                key={annotation.id} 
                className="annotation text" 
                style={{
                  position: 'absolute',
                  left: annotation.startX,
                  top: annotation.startY,
                  color: annotation.color,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  pointerEvents: 'none',
                  zIndex: 10
                }}
              >
                Sample Text
              </div>
            );
          default:
            return null;
        }
      });
  };

  const renderCurrentAnnotation = () => {
    if (!currentAnnotation) return null;

    const style = {
      position: 'absolute' as const,
      left: Math.min(currentAnnotation.startX, currentAnnotation.endX),
      top: Math.min(currentAnnotation.startY, currentAnnotation.endY),
      width: Math.abs(currentAnnotation.endX - currentAnnotation.startX),
      height: Math.abs(currentAnnotation.endY - currentAnnotation.startY),
      border: `${currentAnnotation.strokeWidth}px dashed ${currentAnnotation.color}`,
      pointerEvents: 'none' as const,
      zIndex: 15
    };

    switch (currentAnnotation.type) {
      case 'rectangle':
        return <div className="annotation rectangle current" style={style} />;
      case 'circle':
        return (
          <div 
            className="annotation circle current" 
            style={{
              ...style,
              borderRadius: '50%'
            }} 
          />
        );
      default:
        return null;
    }
  };

  const getCursorStyle = () => {
    switch (selectedTool) {
      case 'text': return 'text';
      case 'rectangle': 
      case 'circle': return 'crosshair';
      case 'freehand': return 'grab';
      case 'measure': return 'crosshair';
      default: return 'default';
    }
  };

  return (
    <div className={`pdf-viewer ${className || ''}`} ref={viewerRef}>
      {renderRulers()}
      
      <div className="viewer-content">
        {renderGrid()}
        
        <div 
          className="pdf-canvas-container"
          style={{ 
            transform: `scale(${zoomLevel / 100})`,
            cursor: getCursorStyle()
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          {isLoading ? (
            <div className="pdf-loading">
              <div className="loading-spinner"></div>
              <span>Loading PDF...</span>
            </div>
          ) : (
            <>
              {/* PDF Content - In real implementation, this would be rendered by PDF.js */}
              <div className="pdf-page">
                <iframe
                  src={URL.createObjectURL(file)}
                  className="pdf-iframe"
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    border: 'none',
                    pointerEvents: selectedTool ? 'none' : 'auto'
                  }}
                />
              </div>
              
              {/* Annotation Layer */}
              <div className="annotation-layer">
                {renderAnnotations()}
                {renderCurrentAnnotation()}
              </div>
            </>
          )}
        </div>
        
        {/* Tool-specific UI overlays */}
        {selectedTool && (
          <div className="tool-overlay">
            <div className="cursor-coordinates">
              X: {Math.round(cursorPosition.x)}, Y: {Math.round(cursorPosition.y)}
            </div>
            
            {selectedTool === 'measure' && (
              <div className="measurement-display">
                <div className="measurement-tools">
                  <span>📏 Distance Tool Active</span>
                  <span>Click and drag to measure</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Page Navigation Controls */}
        <div className="page-navigation">
          <button 
            className="nav-button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            ⬅️ Previous
          </button>
          
          <div className="page-input">
            <input
              type="number"
              value={currentPage}
              onChange={(e) => onPageChange(Number(e.target.value))}
              min="1"
              className="page-number-input"
            />
          </div>
          
          <button 
            className="nav-button"
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next ➡️
          </button>
        </div>
      </div>
    </div>
  );
};