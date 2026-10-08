import { useState, useEffect } from 'react';
import { ArrowLeftRight, Clock, CheckCircle, Search, RefreshCw, Loader } from 'lucide-react';
import { fetchRequests } from '../../services/api';

export default function TransfersPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterUrgency, setFilterUrgency] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRequests({ limit: 50 });
      setRequests(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchRequests({ limit: 50 })
      .then((res) => {
        if (active) {
          setRequests(res.data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Failed to fetch requests');
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  const filteredRequests = requests.filter((req) => {
    const matchesUrgency = filterUrgency === 'All' || req.urgency === filterUrgency;
    const matchesSearch = searchQuery === '' || 
      (req.medicine_name && req.medicine_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (req.notes && req.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesUrgency && matchesSearch;
  });

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'Critical':
        return { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' };
      case 'Urgent':
        return { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' };
      default:
        return { bg: '#e0f2fe', color: '#075985', border: '#bae6fd' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Stock Transfers & Requests</h1>
          <p style={{ color: 'var(--text-secondary, #64748b)', margin: '4px 0 0', fontSize: '0.875rem' }}>
            View and track medicine supply requests across network hospitals
          </p>
        </div>

        <button
          onClick={loadRequests}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search request by medicine or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Urgency Filter Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['All', 'Critical', 'Urgent', 'Normal'].map((urg) => (
            <button
              key={urg}
              onClick={() => setFilterUrgency(urg)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: filterUrgency === urg ? '1px solid #2563eb' : '1px solid #e2e8f0',
                background: filterUrgency === urg ? '#eff6ff' : '#ffffff',
                color: filterUrgency === urg ? '#1d4ed8' : '#64748b',
              }}
            >
              {urg}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <Loader size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <p style={{ margin: 0 }}>Loading requests...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ padding: '16px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredRequests.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <ArrowLeftRight size={32} style={{ color: '#94a3b8', marginBottom: '8px' }} />
          <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#334155' }}>No Requests Found</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
            {searchQuery || filterUrgency !== 'All' ? 'Try adjusting your search or filters.' : 'Submit a request via the inventory page to track it here.'}
          </p>
        </div>
      )}

      {/* Table / List */}
      {!loading && !error && filteredRequests.length > 0 && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '12px 16px' }}>Request ID</th>
                <th style={{ padding: '12px 16px' }}>Medicine</th>
                <th style={{ padding: '12px 16px' }}>Quantity Required</th>
                <th style={{ padding: '12px 16px' }}>Needed By</th>
                <th style={{ padding: '12px 16px' }}>Urgency</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => {
                const badge = getUrgencyBadge(req.urgency);
                return (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>#{req.id}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: '#0f172a' }}>{req.medicine_name || `Medicine #${req.medicine_id}`}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>
                      {parseFloat(req.quantity_required).toLocaleString()} {req.medicine_unit || 'units'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      {req.needed_by ? new Date(req.needed_by).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {req.urgency}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: req.status === 'fulfilled' ? '#ecfdf5' : '#fffbeb',
                          color: req.status === 'fulfilled' ? '#047857' : '#b45309',
                        }}
                      >
                        {req.status === 'fulfilled' ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {req.status || 'pending'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {req.created_at ? new Date(req.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
