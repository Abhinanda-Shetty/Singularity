import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('pass');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim() === 'admin' && password === 'pass') {
      setError('');
      navigate('/dashboard');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="login-page">
      {/* Decorative leaf motifs */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '320px',
          height: '320px',
          pointerEvents: 'none',
          opacity: 0.45,
          zIndex: 0
        }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0C80 40 180 30 240 100C160 160 80 140 0 100V0Z" fill="#DDE8DA" />
        </svg>
      </div>

      <div className="login-card" style={{ zIndex: 1 }}>
        <div className="login-brand-header">
          <div className="sidebar-logo-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M8.5 2.5C8.5 2.5 8.5 3 8.5 3.5V7.5C8.5 7.8 8.2 8 8 8H4C3.2 8 2.5 8.7 2.5 9.5V14.5C2.5 15.3 3.2 16 4 16H8C8.2 16 8.5 16.2 8.5 16.5V20.5C8.5 21.3 9.2 22 10 22H14C14.8 22 15.5 21.3 15.5 20.5V16.5C15.5 16.2 15.8 16 16 16H20C20.8 16 21.5 15.3 21.5 14.5V9.5C21.5 8.7 20.8 8 20 8H16C15.8 8 15.5 7.8 15.5 7.5V3.5C15.5 2.7 14.8 2 14 2H10C9.2 2 8.5 2.5 8.5 2.5Z" 
                stroke="#1F4D3A" 
                strokeWidth="2.5" 
                strokeLinejoin="round" 
                strokeLinecap="round" 
              />
            </svg>
          </div>
          <h1>Hospital Portal Login</h1>
          <p>MedSupply Intelligence</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            Sign In
          </button>
        </form>

        <div className="login-hint">
          Prototype credentials:<br />
          Username: <strong>admin</strong> &nbsp;|&nbsp; Password: <strong>pass</strong>
        </div>
      </div>
    </div>
  );
}
