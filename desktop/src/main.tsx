import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Extend the global Window interface to include our TeamBeam API
declare global {
  interface Window {
    teamBeam: import('../electron/preload').TeamBeamAPI;
  }
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);