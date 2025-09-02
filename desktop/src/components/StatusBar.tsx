// TODO[PH-002]: This is a stub component - implement status bar with pipeline status, system info, and notifications
import React from 'react';

const StatusBar: React.FC = () => {
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item">Ready</span>
      </div>
      <div className="status-right">
        <span className="status-item">TeamBeam v1.0.0</span>
      </div>
    </div>
  );
};

export default StatusBar;