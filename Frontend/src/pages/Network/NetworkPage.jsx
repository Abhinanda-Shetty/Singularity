import { useState, useEffect } from 'react';
import { Network, MapPin, Users, Building2, Loader } from 'lucide-react';
import { fetchHospitals } from '../../services/api';

export default function NetworkPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchHospitals({ limit: 100 });
        if (!cancelled) setHospitals(res.data || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="placeholder-page">
        <Loader size={28} style={{ animation: 'spin 1s linear infinite' }} />
        <p>Loading hospital network…</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="placeholder-page">
        <Network size={32} />
        <h2>Hospital Network</h2>
        <p style={{ color: '#b91c1c' }}>⚠️ {error}</p>
      </div>
    );
  }

  const typeColors = {
    'District Hospital':    '#2E7D52',
    'Referral Hospital':    '#1565C0',
    'Health Center':        '#F57C00',
    'Teaching Hospital':    '#7B1FA2',
    'Private Hospital':     '#00838F',
    'Community Clinic':     '#C62828',
    'Specialized Hospital': '#AD1457',
  };

  return (
    <div>
      {/* Page header */}
      <div className="welcome-section">
        <div>
          <h1 className="welcome-title">Hospital Network</h1>
          <p className="welcome-subtitle">{hospitals.length} hospitals in the supply network</p>
        </div>
      </div>

      {/* Hospital cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '16px',
        marginTop: '8px',
      }}>
        {hospitals.map((h) => (
          <div key={h.id} className="analysis-card" style={{ padding: '20px' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: typeColors[h.type] || '#2E7D52',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '16px', fontWeight: 700,
              }}>
                {h.name?.[0]?.toUpperCase() || 'H'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {h.name}
                </div>
                <div style={{
                  display: 'inline-block', marginTop: '3px',
                  padding: '2px 10px', borderRadius: '20px',
                  fontSize: '0.72rem', fontWeight: 600,
                  background: (typeColors[h.type] || '#2E7D52') + '18',
                  color: typeColors[h.type] || '#2E7D52',
                }}>
                  {h.type || 'Hospital'}
                </div>
              </div>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: '#555' }}>
              {h.address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} style={{ flexShrink: 0, color: '#888' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.address}</span>
                </div>
              )}
              {h.patient_capacity > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={14} style={{ flexShrink: 0, color: '#888' }} />
                  <span>{h.patient_capacity} beds</span>
                </div>
              )}
              {(h.latitude && h.longitude) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={14} style={{ flexShrink: 0, color: '#888' }} />
                  <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                    {parseFloat(h.latitude).toFixed(4)}, {parseFloat(h.longitude).toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {hospitals.length === 0 && !loading && (
        <div className="placeholder-page" style={{ marginTop: '40px' }}>
          <Network size={32} />
          <p>No hospitals found in the database.</p>
        </div>
      )}
    </div>
  );
}
