import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  RefreshCw, 
  Search, 
  ArrowRight, 
  TrendingDown, 
  Boxes, 
  Zap,
  Building
} from 'lucide-react';
import { fetchRisks, fetchHospitals } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function RisksPage() {
  const navigate = useNavigate();
  const [riskData, setRiskData] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [error, setError] = useState(null);

  const loadRisks = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rRes, hospRes] = await Promise.all([
        fetchRisks({
          hospital_id: selectedHospital || undefined,
          lead_time_days: 7,
          safety_horizon: 14,
        }),
        fetchHospitals({ limit: 50 }).catch(() => ({ data: [] })),
      ]);

      setRiskData(rRes);
      if (hospRes.data) {
        setHospitals(hospRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch risk analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRisks();
  }, [selectedHospital]);

  const rawRecords = riskData?.risk_records || [];
  const summary = riskData?.summary || { tier_counts: {}, total_shortage: 0 };
  const tierCounts = summary.tier_counts || {};

  const filteredRecords = rawRecords.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      (item.medicine_name && item.medicine_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.medicine_category && item.medicine_category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.hospital_name && item.hospital_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTier = tierFilter === 'ALL' || item.risk_tier === tierFilter;

    return matchesSearch && matchesTier;
  });

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'CRITICAL':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', label: 'CRITICAL' };
      case 'HIGH':
        return { bg: '#ffedd5', text: '#c2410c', border: '#fdba74', label: 'HIGH' };
      case 'MEDIUM':
        return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d', label: 'MEDIUM' };
      default:
        return { bg: '#dcfce7', text: '#166534', border: '#86efac', label: 'LOW' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: '#1F4D3A' }}>
              Supply Shortage &amp; Risk Intelligence
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: '#FEF3C7',
              color: '#B45309',
              border: '1px solid #FCD34D'
            }}>
              <Zap size={12} />
              AI Risk Classifier
            </span>
          </div>
          <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: '0.9rem' }}>
            Multi-tier shortage classification computing stockout horizons, safety stock deficits, and clinical urgency.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadRisks}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#334155'
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => navigate('/transfers')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              background: '#1F4D3A',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(31,77,58,0.2)'
            }}
          >
            <Boxes size={16} />
            <span>Resolve Deficits in Transfers</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #fecdd3',
          borderLeft: '5px solid #e11d48',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9f1239', fontSize: '0.85rem' }}>
            <span>Critical Shortages</span>
            <AlertTriangle size={18} color="#e11d48" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px', color: '#be123c' }}>
            {tierCounts.CRITICAL || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#e11d48' }}>
            Stockout projected in &lt; 7 days
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #fed7aa',
          borderLeft: '5px solid #f97316',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9a3412', fontSize: '0.85rem' }}>
            <span>High Risk Warnings</span>
            <ShieldAlert size={18} color="#ea580c" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px', color: '#c2410c' }}>
            {tierCounts.HIGH || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#c2410c' }}>
            Runway within 7 to 14 days
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #fde68a',
          borderLeft: '5px solid #f59e0b',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#92400e', fontSize: '0.85rem' }}>
            <span>Medium / Monitor</span>
            <TrendingDown size={18} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px', color: '#b45309' }}>
            {tierCounts.MEDIUM || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#b45309' }}>
            Approaching reorder threshold
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          borderLeft: '5px solid #1F4D3A',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85rem' }}>
            <span>Total Units Deficit</span>
            <Boxes size={18} color="#1F4D3A" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px', color: '#0f172a' }}>
            {Math.round(summary.total_shortage || 0)} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>units</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Cumulative supply gap
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#ffffff',
        padding: '14px 18px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          {/* Search bar */}
          <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search risk by medicine, hospital, or category..."
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

          {/* Hospital Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building size={16} color="#64748b" />
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                outline: 'none',
                background: '#ffffff',
                color: '#334155'
              }}
            >
              <option value="">All Hospitals</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tier Filter Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { label: 'All', value: 'ALL' },
            { label: 'Critical', value: 'CRITICAL' },
            { label: 'High', value: 'HIGH' },
            { label: 'Medium', value: 'MEDIUM' },
            { label: 'Low', value: 'LOW' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setTierFilter(item.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: tierFilter === item.value ? '1px solid #0f172a' : '1px solid #e2e8f0',
                background: tierFilter === item.value ? '#0f172a' : '#f8fafc',
                color: tierFilter === item.value ? '#ffffff' : '#64748b',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Risks Data Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Medicine &amp; Category</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Hospital Facility</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Risk Tier</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Current Stock</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Safety Stock</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Days to Stockout</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Shortage Deficit</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <RefreshCw size={18} className="animate-spin" color="#1F4D3A" />
                      <span>Computing risk scoring on live database inventory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No risk records match your search filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, idx) => {
                  const tierBadge = getTierBadge(item.risk_tier);
                  const isDeficit = item.shortage_quantity > 0;

                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {item.medicine_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {item.medicine_category} (ID: {item.medicine_id})
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: '#334155', fontWeight: 500 }}>
                          {item.hospital_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {item.hospital_id} • {item.region_type}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: tierBadge.bg,
                          color: tierBadge.text,
                          border: `1px solid ${tierBadge.border}`,
                        }}>
                          {tierBadge.label}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 600, color: item.current_stock <= item.safety_stock ? '#dc2626' : '#0f172a' }}>
                          {item.current_stock}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '4px' }}>units</span>
                      </td>

                      <td style={{ padding: '14px 16px', color: '#64748b' }}>
                        {item.safety_stock} units
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontWeight: 600,
                          color: item.days_to_stockout < 7 ? '#dc2626' : item.days_to_stockout <= 14 ? '#d97706' : '#16a34a'
                        }}>
                          {item.days_to_stockout} days
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {isDeficit ? (
                          <span style={{ fontWeight: 700, color: '#dc2626' }}>
                            -{Math.round(item.shortage_quantity)} units
                          </span>
                        ) : (
                          <span style={{ color: '#16a34a', fontWeight: 500 }}>
                            Surplus / Adequate
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {isDeficit ? (
                          <button
                            onClick={() => navigate('/transfers')}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid #fca5a5',
                              backgroundColor: '#fff1f2',
                              color: '#be123c',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <span>Trigger Redistribution</span>
                            <ArrowRight size={12} />
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 500 }}>
                            No Action Needed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
