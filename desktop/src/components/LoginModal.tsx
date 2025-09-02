import React, { useState } from 'react';
import './LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: { id: string; name: string; email: string; role: 'admin' | 'user' | 'guest' }) => void;
  isDeveloperMode?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  isDeveloperMode = true
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGuestDemo, setShowGuestDemo] = useState(false);

  if (!isOpen) return null;

  const handleQuickLogin = (userType: 'admin' | 'user' | 'guest') => {
    setIsLoading(true);
    setError('');
    
    // Simulate quick login with mock users
    setTimeout(() => {
      const mockUsers = {
        admin: {
          id: 'admin-001',
          name: 'Developer Admin',
          email: 'admin@axis.dev',
          role: 'admin' as const
        },
        user: {
          id: 'user-001', 
          name: 'John Architect',
          email: 'john@buildcorp.com',
          role: 'user' as const
        },
        guest: {
          id: 'guest-001',
          name: 'Guest User',
          email: 'guest@example.com',
          role: 'guest' as const
        }
      };
      
      onLogin(mockUsers[userType]);
      setIsLoading(false);
    }, 500);
  };

  const handleRegularLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // TODO: Replace with real authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email && password) {
        onLogin({
          id: 'user-real',
          name: email.split('@')[0],
          email,
          role: 'user'
        });
      } else {
        setError('Please enter email and password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAccess = () => {
    setShowGuestDemo(true);
  };

  const handleGuestContinue = () => {
    handleQuickLogin('guest');
  };

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-icon">📐</span>
            <h1>AxIs</h1>
          </div>
          <p className="login-subtitle">Construction Intelligence Platform</p>
        </div>

        {!showGuestDemo ? (
          <div className="login-content">
            {/* Developer Quick Access */}
            {isDeveloperMode && (
              <div className="developer-section">
                <div className="section-header">
                  <h3>🚀 Developer Quick Access</h3>
                  <span className="dev-badge">Dev Mode</span>
                </div>
                
                <div className="quick-login-grid">
                  <button 
                    className="quick-login-btn admin"
                    onClick={() => handleQuickLogin('admin')}
                    disabled={isLoading}
                  >
                    <div className="btn-icon">👑</div>
                    <div className="btn-content">
                      <h4>Admin Console</h4>
                      <p>Full system access & monitoring</p>
                    </div>
                  </button>
                  
                  <button 
                    className="quick-login-btn user"
                    onClick={() => handleQuickLogin('user')}
                    disabled={isLoading}
                  >
                    <div className="btn-icon">👷‍♂️</div>
                    <div className="btn-content">
                      <h4>Power User</h4>
                      <p>Standard collaboration features</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Regular Login Form */}
            <div className="login-form-section">
              <h3>Sign In</h3>
              
              <form onSubmit={handleRegularLogin} className="login-form">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@company.com"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                <button 
                  type="submit" 
                  className="login-btn primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
              
              <div className="login-footer">
                <a href="#" className="forgot-link">Forgot password?</a>
                <div className="divider">or</div>
                <button 
                  className="guest-access-btn"
                  onClick={handleGuestAccess}
                  disabled={isLoading}
                >
                  🎯 Try Guest Access
                </button>
              </div>
            </div>

            {/* Features Preview */}
            <div className="features-preview">
              <h4>What you'll get with AxIs:</h4>
              <div className="features-grid">
                <div className="feature-item">
                  <span className="feature-icon">📝</span>
                  <span>Professional PDF Markup</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📏</span>
                  <span>Precise Measurements</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">👥</span>
                  <span>Real-time Collaboration</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔄</span>
                  <span>Version Comparison</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <span>Construction Intelligence</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🎯</span>
                  <span>RFI Management</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Guest Demo Explanation */
          <div className="guest-demo-content">
            <div className="guest-header">
              <div className="guest-icon">🎯</div>
              <h2>Experience AxIs</h2>
              <p>Get a taste of Construction Intelligence</p>
            </div>
            
            <div className="demo-features">
              <div className="demo-feature">
                <div className="demo-icon">👀</div>
                <div className="demo-text">
                  <h4>View & Navigate</h4>
                  <p>Browse project files and explore the interface</p>
                </div>
              </div>
              
              <div className="demo-feature">
                <div className="demo-icon">💬</div>
                <div className="demo-text">
                  <h4>See Collaboration</h4>
                  <p>View comments, markups, and team activity</p>
                </div>
              </div>
              
              <div className="demo-feature">
                <div className="demo-icon">🔒</div>
                <div className="demo-text">
                  <h4>Limited Access</h4>
                  <p>Read-only access to showcase features</p>
                </div>
              </div>
            </div>
            
            <div className="demo-cta">
              <p className="demo-note">
                <strong>Like what you see?</strong> Sign up for full access to markup tools, 
                real-time collaboration, and project management features.
              </p>
              
              <div className="demo-actions">
                <button 
                  className="demo-btn secondary"
                  onClick={() => setShowGuestDemo(false)}
                >
                  Back to Login
                </button>
                <button 
                  className="demo-btn primary"
                  onClick={handleGuestContinue}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    'Continue as Guest'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;