import { useState, useEffect } from 'react';
import { Server, Database, User, Shield, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchHealth, getUser } from '../../services/api';

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = getUser();

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchHealth();
      setHealth(res);
    } catch (err) {
      setError(err.message || 'Backend unreachable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchHealth()
      .then((res) => {
        if (active) {
          setHealth(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Backend unreachable');
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>System & Hospital Settings</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>
          Overview of system connection status, active user session, and environment configuration
        </p>
      </div>

      {/* Backend Status Card */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Server size={20} style={{ color: '#2563eb' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Backend Connection Status</h3>
          </div>
          <button
            onClick={checkHealth}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.8125rem',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Check Health</span>
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.875rem' }}>Checking backend health...</p>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontSize: '0.875rem' }}>
            <AlertCircle size={16} />
            <span>Connection Error: {error}</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>API Server</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontWeight: 600, color: '#047857' }}>
                <CheckCircle size={14} />
                <span>Connected (200 OK)</span>
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Database Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontWeight: 600, color: health?.data?.db === 'connected' ? '#047857' : '#dc2626' }}>
                <Database size={14} />
                <span>{health?.data?.db === 'connected' ? 'PostgreSQL Active' : 'Disconnected'}</span>
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Environment Mode</div>
              <div style={{ fontWeight: 600, color: '#334155', marginTop: '4px' }}>
                {health?.data?.environment || 'development'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Session Profile Card */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <User size={20} style={{ color: '#059669' }} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Active User Session</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748b' }}>Username</span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>{user?.username || 'admin'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748b' }}>Role</span>
            <span style={{ fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>{user?.role || 'Hospital Manager'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748b' }}>Assigned Hospital ID</span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>{user?.hospital_id || 1}</span>
          </div>
        </div>
      </div>

      {/* AI Module Status */}
      <div style={{ background: '#faf5ff', borderRadius: '12px', border: '1px solid #e9d5ff', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Shield size={20} style={{ color: '#7c3aed' }} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#6b21a8' }}>AI Integration Module</h3>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#7e22ce' }}>
          BackendAI endpoints (XGBoost forecasting, PuLP redistribution optimization, n8n workflows) are pending integration by the AI engineering team.
        </p>
      </div>
    </div>
  );
}
