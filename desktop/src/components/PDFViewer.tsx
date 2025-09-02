// src/components/PDFViewer.tsx
// PDF Viewer component that integrates with the PDF service

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { pdfService, PDFDocumentInfo, RenderOptions } from '../services/pdf';
import './PDFViewer.css';

interface PDFViewerProps {
  filePath?: string;
  onDocumentLoad?: (info: PDFDocumentInfo) => void;
  onPageChange?: (pageNumber: number) => void;
  onCanvasClick?: (x: number, y: number, pageNumber: number, pdfCoords: { x: number; y: number }) => void;
  selectedTool?: any; // Current tool selected for placement
  className?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  filePath,
  onDocumentLoad,
  onPageChange,
  onCanvasClick,
  selectedTool,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [documentInfo, setDocumentInfo] = useState<PDFDocumentInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load document when filePath changes
  useEffect(() => {
    if (filePath) {
      loadDocument(filePath);
    } else {
      clearDocument();
    }
  }, [filePath]);

  // Render current page when page or scale changes
  useEffect(() => {
    if (documentInfo && currentPage) {
      renderCurrentPage();
    }
  }, [documentInfo, currentPage, scale]);

  const loadDocument = async (path: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const info = await pdfService.loadDocument(path);
      setDocumentInfo(info);
      setCurrentPage(1);
      onDocumentLoad?.(info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF';
      setError(errorMessage);
      console.error('Failed to load PDF:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearDocument = () => {
    setDocumentInfo(null);
    setCurrentPage(1);
    setError(null);
    pdfService.closeDocument();
    
    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const renderCurrentPage = async () => {
    if (!documentInfo || !canvasRef.current) return;

    setIsLoading(true);
    
    try {
      const renderOptions: RenderOptions = {
        scale: scale,
        rotation: 0
      };

      await pdfService.renderPage(currentPage, canvasRef.current, renderOptions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to render page';
      setError(errorMessage);
      console.error('Failed to render page:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const goToPage = useCallback((pageNumber: number) => {
    if (!documentInfo || pageNumber < 1 || pageNumber > documentInfo.pageCount) {
      return;
    }
    
    setCurrentPage(pageNumber);
    onPageChange?.(pageNumber);
  }, [documentInfo, onPageChange]);

  const previousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.25, 5.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev / 1.25, 0.1));
  }, []);

  const zoomToFit = useCallback(() => {
    if (!documentInfo || !containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const currentPageInfo = documentInfo.pages[currentPage - 1];
    
    if (currentPageInfo) {
      const containerWidth = container.clientWidth - 40; // Account for padding
      const containerHeight = container.clientHeight - 80; // Account for controls
      
      const scaleX = containerWidth / currentPageInfo.width;
      const scaleY = containerHeight / currentPageInfo.height;
      
      setScale(Math.min(scaleX, scaleY, 2.0));
    }
  }, [documentInfo, currentPage]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!documentInfo || !onCanvasClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert canvas coordinates to PDF coordinates
    const currentPageInfo = documentInfo.pages[currentPage - 1];
    if (currentPageInfo) {
      const pdfCoords = pdfService.canvasToPDFCoords(
        x, 
        y, 
        scale, 
        currentPageInfo.height
      );
      
      onCanvasClick(x, y, currentPage, pdfCoords);
    }
  }, [documentInfo, currentPage, onCanvasClick, scale]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
      case 'PageUp':
        event.preventDefault();
        previousPage();
        break;
      case 'ArrowRight':
      case 'PageDown':
        event.preventDefault();
        nextPage();
        break;
      case '+':
      case '=':
        event.preventDefault();
        zoomIn();
        break;
      case '-':
        event.preventDefault();
        zoomOut();
        break;
      case '0':
        event.preventDefault();
        zoomToFit();
        break;
    }
  }, [previousPage, nextPage, zoomIn, zoomOut, zoomToFit]);

  // Keyboard event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  if (error) {
    return (
      <div className={`pdf-viewer pdf-viewer--error ${className}`}>
        <div className="pdf-viewer__error">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
          <button 
            className="error-retry"
            onClick={() => filePath && loadDocument(filePath)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!documentInfo && !isLoading) {
    return (
      <div className={`pdf-viewer pdf-viewer--empty ${className}`}>
        <div className="pdf-viewer__empty">
          <div className="empty-icon">📄</div>
          <div className="empty-message">No PDF loaded</div>
          <div className="empty-help">Open a PDF file to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`pdf-viewer ${className}`}
      tabIndex={0}
    >
      {/* PDF Controls */}
      <div className="pdf-viewer__controls">
        <div className="controls-group">
          <button
            className="control-btn"
            onClick={previousPage}
            disabled={!documentInfo || currentPage <= 1}
            title="Previous page (←)"
          >
            ←
          </button>
          
          <div className="page-info">
            <input
              type="number"
              className="page-input"
              value={currentPage}
              min={1}
              max={documentInfo?.pageCount || 1}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
            />
            <span className="page-total">/ {documentInfo?.pageCount || 0}</span>
          </div>
          
          <button
            className="control-btn"
            onClick={nextPage}
            disabled={!documentInfo || currentPage >= (documentInfo?.pageCount || 0)}
            title="Next page (→)"
          >
            →
          </button>
        </div>

        <div className="controls-group">
          <button
            className="control-btn"
            onClick={zoomOut}
            disabled={scale <= 0.1}
            title="Zoom out (-)"
          >
            −
          </button>
          
          <span className="zoom-info">{Math.round(scale * 100)}%</span>
          
          <button
            className="control-btn"
            onClick={zoomIn}
            disabled={scale >= 5.0}
            title="Zoom in (+)"
          >
            +
          </button>
          
          <button
            className="control-btn"
            onClick={zoomToFit}
            title="Fit to window (0)"
          >
            📐
          </button>
        </div>

        {documentInfo && (
          <div className="controls-group document-info">
            <span className="doc-title">{documentInfo.title || 'Untitled'}</span>
          </div>
        )}
      </div>

      {/* PDF Canvas */}
      <div className="pdf-viewer__canvas-container">
        {isLoading && (
          <div className="pdf-viewer__loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading...</div>
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          className="pdf-viewer__canvas"
          onClick={handleCanvasClick}
          style={{ 
            opacity: isLoading ? 0.5 : 1,
            cursor: selectedTool ? 'crosshair' : (onCanvasClick ? 'pointer' : 'default')
          }}
        />
      </div>
    </div>
  );
};