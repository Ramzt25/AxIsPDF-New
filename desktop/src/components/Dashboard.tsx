// TODO[PH-003]: This is a stub component - implement dashboard with project overview, recent activity, and quick actions
import React from 'react';

interface DashboardProps {
  currentProject: string | null;
  recentProjects: string[];
  onOpenProject: (path: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentProject, recentProjects, onOpenProject }) => {
  return (
    <div className="dashboard">
      <h2>TeamBeam Dashboard</h2>
      <p>Local Bluebeam with Brains - Construction Document Intelligence</p>
      
      {currentProject ? (
        <div className="current-project">
          <h3>Current Project</h3>
          <p>{currentProject}</p>
        </div>
      ) : (
        <div className="welcome">
          <h3>Welcome to TeamBeam!</h3>
          <p>Open or create a project to get started.</p>
        </div>
      )}
      
      <div className="recent-projects">
        <h3>Recent Projects</h3>
        {recentProjects.length > 0 ? (
          <ul>
            {recentProjects.map((project, index) => (
              <li key={index}>
                <button onClick={() => onOpenProject(project)}>
                  {project.split('/').pop()}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recent projects</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;