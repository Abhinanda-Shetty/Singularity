import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader, UserPlus, LogIn, Building2, MapPin } from 'lucide-react';
import { login, signup } from '../../services/api';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Hospital registration fields for signup
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalType, setHospitalType] = useState('general');
  const [hospitalAddress, setHospitalAddress] = useState('Hyderabad, Telangana');
  const [patientCapacity, setPatientCapacity] = useState('350');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Username is required.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    if (mode === 'signup') {
      if (cleanUsername.length < 3) {
        setError('Username must be at least 3 characters.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!hospitalName.trim()) {
        setError('Hospital or medical center name is required.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await login(cleanUsername, password);
      } else {
        await signup({
          username: cleanUsername,
          password,
          email: email.trim() || undefined,
          hospital_name: hospitalName.trim(),
          hospital_type: hospitalType,
          hospital_address: hospitalAddress.trim(),
          patient_capacity: parseInt(patientCapacity, 10) || 300,
        });
      }
      navigate('/network');
    } catch (err) {

      if (err.status === 401) {
        setError('Invalid username or password.');
      } else if (err.status === 409) {
        setError('Username or email is already taken. Please choose another.');
      } else if (err.message?.includes('Cannot reach')) {
        setError('Backend is unavailable. Please ensure the server is running.');
      } else {
        setError(err.message || `${mode === 'login' ? 'Login' : 'Registration'} failed. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
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
          zIndex: 0,
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
          <h1>{mode === 'login' ? 'Hospital Portal Login' : 'Create Hospital Account'}</h1>
          <p>MedSupply Intelligence</p>
        </div>

        {/* Tab Switcher for Sign In / Sign Up */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#eaf7ed',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => switchMode('login')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'all 0.2s',
              backgroundColor: mode === 'login' ? '#ffffff' : 'transparent',
              color: mode === 'login' ? '#023625' : '#414944',
              boxShadow: mode === 'login' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <LogIn size={15} />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'all 0.2s',
              backgroundColor: mode === 'signup' ? '#ffffff' : 'transparent',
              color: mode === 'signup' ? '#023625' : '#414944',
              boxShadow: mode === 'signup' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <UserPlus size={15} />
            Sign Up
          </button>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. dr_sharma or city_hospital"
              required
              autoComplete="username"
              disabled={loading}
            />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="email">Email Address (optional)</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hospital.org"
                autoComplete="email"
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              disabled={loading}
            />
          </div>

          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>

              {/* Hospital Facility Registration Section */}
              <div
                className="signup-facility-panel"
                style={{
                  margin: '16px 0 10px 0',
                  padding: '14px',
                  backgroundColor: '#F3F8F3',
                  borderRadius: '12px',
                  border: '1px solid #D1E5D3',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Building2 size={16} color="#1F4D3A" />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F291E' }}>
                    Register Your Hospital / Health Facility
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label htmlFor="hospitalName" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    Hospital Name *
                  </label>
                  <input
                    id="hospitalName"
                    type="text"
                    className="form-input"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="e.g. Apex Multispecialty Hospital"
                    required={mode === 'signup'}
                    disabled={loading}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="hospitalType" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                      Facility Type
                    </label>
                    <select
                      id="hospitalType"
                      className="form-input"
                      value={hospitalType}
                      onChange={(e) => setHospitalType(e.target.value)}
                      disabled={loading}
                      style={{ height: '38px' }}
                    >
                      <option value="general">General Hospital</option>
                      <option value="specialty">Super Specialty</option>
                      <option value="urban">Urban Medical Centre</option>
                      <option value="rural">Rural Health Centre</option>
                      <option value="trauma">Trauma &amp; Emergency</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="patientCapacity" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                      Bed Capacity
                    </label>
                    <input
                      id="patientCapacity"
                      type="number"
                      min="20"
                      max="3000"
                      className="form-input"
                      value={patientCapacity}
                      onChange={(e) => setPatientCapacity(e.target.value)}
                      placeholder="e.g. 350"
                      disabled={loading}
                      style={{ height: '38px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="hospitalAddress" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    City / Location (India) *
                  </label>
                  <input
                    id="hospitalAddress"
                    type="text"
                    className="form-input"
                    value={hospitalAddress}
                    onChange={(e) => setHospitalAddress(e.target.value)}
                    placeholder="e.g. Hyderabad, Telangana or Pune, Maharashtra"
                    required={mode === 'signup'}
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          )}


          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '16px',
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                {mode === 'login' ? 'Signing in…' : 'Creating account…'}
              </>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="login-hint" style={{ marginTop: '16px', textAlign: 'center' }}>
          {mode === 'login' ? (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1f4d3a',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Sign up here
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1f4d3a',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Sign in here
              </button>
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
