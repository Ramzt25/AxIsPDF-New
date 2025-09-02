import React, { useState, useEffect } from 'react';

interface StatusBarProps {
  pipelineStatus?: 'idle' | 'running' | 'success' | 'error';
  currentOperation?: string;
  progress?: number;
  notifications?: number;
  projectPath?: string;
}

const StatusBar: React.FC<StatusBarProps> = ({
  pipelineStatus = 'idle',
  currentOperation,
  progress,
  notifications = 0,
  projectPath
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getStatusIcon = () => {
    switch (pipelineStatus) {
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  const getStatusText = () => {
    switch (pipelineStatus) {
      case 'running': return currentOperation || 'Processing...';
      case 'success': return 'Pipeline completed successfully';
      case 'error': return 'Pipeline failed';
      default: return 'Ready';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="status-bar">
      <div className="status-left">
        <div className="status-item pipeline-status">
          <span className="status-icon">{getStatusIcon()}</span>
          <span className="status-text">{getStatusText()}</span>
          {pipelineStatus === 'running' && typeof progress === 'number' && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="progress-text">{Math.round(progress)}%</span>
            </div>
          )}
        </div>

        {projectPath && (
          <div className="status-item project-info">
            <span className="status-icon">📁</span>
            <span className="status-text" title={projectPath}>
              {projectPath.split('/').pop() || 'Untitled Project'}
            </span>
          </div>
        )}
      </div>

      <div className="status-right">
        {notifications > 0 && (
          <div className="status-item notifications">
            <span className="status-icon">🔔</span>
            <span className="notification-badge">{notifications}</span>
          </div>
        )}

        <div className="status-item time">
          <span className="status-icon">🕐</span>
          <span className="status-text">{formatTime(currentTime)}</span>
        </div>

        <div className="status-item version">
          <span className="status-text">TeamBeam v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;