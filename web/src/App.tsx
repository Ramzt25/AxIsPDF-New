import React, { useState, useCallback } from 'react';
import './App.css';

interface AppState {
  currentFile: File | null;
  isLoading: boolean;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentFile: null,
    isLoading: false,
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setState(prev => ({ ...prev, currentFile: file }));
    } else {
      alert('Please select a PDF file');
    }
  }, []);

  const handleFileDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setState(prev => ({ ...prev, currentFile: file }));
    } else {
      alert('Please drop a PDF file');
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">📄 TeamBeam PDF Viewer</h1>
        </div>
        
        <div className="header-center">
          {state.currentFile && (
            <span className="current-file">
              📁 {state.currentFile.name}
            </span>
          )}
        </div>
        
        <div className="header-right">
          <label className="file-input-label">
            📂 Open PDF
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="file-input"
            />
          </label>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {state.currentFile ? (
          <div className="pdf-viewer-container">
            <div className="pdf-viewer">
              <iframe
                src={URL.createObjectURL(state.currentFile)}
                title="PDF Viewer"
                className="pdf-iframe"
                onLoad={() => setState(prev => ({ ...prev, isLoading: false }))}
              />
            </div>
          </div>
        ) : (
          <div 
            className="drop-zone"
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
          >
            <div className="drop-zone-content">
              <div className="drop-zone-icon">📄</div>
              <h2>Drop a PDF file here</h2>
              <p>Or click "Open PDF" to browse for a file</p>
              <label className="drop-zone-button">
                Choose PDF File
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="file-input"
                />
              </label>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;