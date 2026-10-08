import { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw, Loader, ArrowDownLeft, ArrowUpRight, PlusCircle } from 'lucide-react';
import { fetchRecentEntries } from '../../services/api';

export default function ReportsPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('All');

  const loadEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRecentEntries({ limit: 100 });
      setEntries(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch activity report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchRecentEntries({ limit: 100 })
      .then((res) => {
        if (active) {
          setEntries(res.data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Failed to fetch activity report');
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  const filteredEntries = entries.filter((item) => {
    if (filterType === 'All') return true;
    return item.type === filterType;
  });

  const exportCSV = () => {
    if (!entries.length) return;
    const headers = ['ID', 'Date', 'Hospital', 'Medicine', 'Type', 'Quantity', 'Notes'];
    const rows = entries.map((e) => [
      e.id,
      new Date(e.created_at).toLocaleString(),
      `"${e.hospital_name || ''}"`,
      `"${e.medicine_name || ''}"`,
      e.type,
      e.quantity,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_audit_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Inventory Audit & Activity Logs</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>
            Detailed audit trails of stock received, daily usage, and supply adjustments
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={exportCSV}
            disabled={loading || entries.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              cursor: entries.length ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={loadEntries}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #2563eb',
              background: '#eff6ff',
              color: '#1d4ed8',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { label: 'All Activities', value: 'All' },
          { label: 'Stock Received', value: 'stock_received' },
          { label: 'Daily Usage', value: 'usage' },
          { label: 'Adjustments', value: 'adjustment' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterType(tab.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: filterType === tab.value ? '1px solid #2563eb' : '1px solid #e2e8f0',
              background: filterType === tab.value ? '#eff6ff' : '#ffffff',
              color: filterType === tab.value ? '#1d4ed8' : '#64748b',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <Loader size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <p style={{ margin: 0 }}>Loading audit logs...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ padding: '16px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Audit List Table */}
      {!loading && !error && filteredEntries.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <FileText size={32} style={{ color: '#94a3b8', marginBottom: '8px' }} />
          <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#334155' }}>No Activity Logged</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
            No transaction records match the selected filter.
          </p>
        </div>
      )}

      {!loading && !error && filteredEntries.length > 0 && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '12px 16px' }}>Timestamp</th>
                <th style={{ padding: '12px 16px' }}>Type</th>
                <th style={{ padding: '12px 16px' }}>Medicine</th>
                <th style={{ padding: '12px 16px' }}>Hospital</th>
                <th style={{ padding: '12px 16px' }}>Quantity</th>
                <th style={{ padding: '12px 16px' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((e) => {
                const isUsage = e.type === 'usage';
                const isStock = e.type === 'stock_received';
                return (
                  <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8125rem' }}>
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: isStock ? '#ecfdf5' : isUsage ? '#fff1f2' : '#f1f5f9',
                          color: isStock ? '#047857' : isUsage ? '#be123c' : '#475569',
                        }}
                      >
                        {isStock ? <ArrowDownLeft size={12} /> : isUsage ? <ArrowUpRight size={12} /> : <PlusCircle size={12} />}
                        {e.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: '#0f172a' }}>{e.medicine_name || `Medicine #${e.medicine_id}`}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{e.hospital_name || `Hospital #${e.hospital_id}`}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: isUsage ? '#be123c' : '#047857' }}>
                      {isUsage ? `-${e.quantity}` : `+${e.quantity}`}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8125rem' }}>
                      {e.notes || '—'}
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
