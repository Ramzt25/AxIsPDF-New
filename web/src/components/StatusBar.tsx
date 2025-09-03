import React from 'react';

interface StatusBarProps {
  currentFile: File | null;
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  isLoading: boolean;
  selectedTool: string | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  currentFile,
  currentPage,
  totalPages,
  zoomLevel,
  isLoading,
  selectedTool
}) => {
  const getFileSize = () => {
    if (!currentFile) return 'No file';
    const sizeInMB = (currentFile.size / 1024 / 1024).toFixed(2);
    return `${sizeInMB} MB`;
  };

  const getToolStatus = () => {
    if (!selectedTool) return 'Ready';
    return `${selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)} tool selected`;
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <footer className="status-bar">
      <div className="status-left">
        <div className="status-item">
          <span className="status-icon">📄</span>
          <span className="status-text">
            {currentFile ? currentFile.name : 'No document'}
          </span>
        </div>
        
        <div className="status-separator"></div>
        
        <div className="status-item">
          <span className="status-icon">📊</span>
          <span className="status-text">{getFileSize()}</span>
        </div>
        
        {currentFile && (
          <>
            <div className="status-separator"></div>
            <div className="status-item">
              <span className="status-icon">📑</span>
              <span className="status-text">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          </>
        )}
      </div>
      
      <div className="status-center">
        <div className="status-item">
          <span className="status-icon">🛠️</span>
          <span className="status-text">{getToolStatus()}</span>
        </div>
        
        {isLoading && (
          <>
            <div className="status-separator"></div>
            <div className="status-item loading">
              <span className="loading-spinner-small"></span>
              <span className="status-text">Loading...</span>
            </div>
          </>
        )}
      </div>
      
      <div className="status-right">
        <div className="status-item">
          <span className="status-icon">🔍</span>
          <span className="status-text">{Math.round(zoomLevel)}%</span>
        </div>
        
        <div className="status-separator"></div>
        
        <div className="status-item">
          <span className="status-icon">📐</span>
          <span className="status-text">X: 0, Y: 0</span>
        </div>
        
        <div className="status-separator"></div>
        
        <div className="status-item">
          <span className="status-icon">⏰</span>
          <span className="status-text">{getCurrentTime()}</span>
        </div>
        
        <div className="status-separator"></div>
        
        <div className="status-item connection">
          <span className="status-icon">🌐</span>
          <span className="status-text">Online</span>
          <div className="connection-indicator online"></div>
        </div>
        
        <div className="status-separator"></div>
        
        <div className="status-item user">
          <span className="status-icon">👤</span>
          <span className="status-text">John Doe</span>
        </div>
      </div>
    </footer>
  );
};