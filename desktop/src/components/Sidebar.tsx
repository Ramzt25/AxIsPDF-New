// TODO[PH-001]: This is a stub component - implement full sidebar with navigation and project tools
import React from 'react';

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        <a href="#/" className="nav-item active">
          📊 Dashboard
        </a>
        <a href="#/pipeline-editor" className="nav-item">
          ⚙️ Pipeline Editor
        </a>
        <a href="#/batch-processor" className="nav-item">
          📦 Batch Processor
        </a>
        <a href="#/fieldbeam-meetings" className="nav-item">
          🎥 FieldBeam Meetings
        </a>
        <a href="#/preferences" className="nav-item">
          ⚙️ Preferences
        </a>
      </nav>
    </div>
  );
};

export default Sidebar;