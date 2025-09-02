import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';

interface LayoutProps {
  children: ReactNode;
  currentProject: string | null;
}

const Layout: React.FC<LayoutProps> = ({ children, currentProject }) => {
  return (
    <div className="layout">
      <div className="layout-header">
        <div className="title-bar">
          <h1>TeamBeam Desktop</h1>
          {currentProject && (
            <span className="project-indicator">
              Project: {currentProject.split('/').pop() || 'Unknown'}
            </span>
          )}
        </div>
      </div>
      
      <div className="layout-body">
        <Sidebar />
        <main className="layout-content">
          {children}
        </main>
      </div>
      
      <StatusBar />
    </div>
  );
};

export default Layout;