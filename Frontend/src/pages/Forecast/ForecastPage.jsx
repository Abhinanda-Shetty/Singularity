import { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Cpu, 
  RefreshCw, 
  AlertTriangle, 
  Search, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Building, 
  Database,
  ArrowRight
} from 'lucide-react';
import { fetchForecast, fetchHospitals } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function ForecastPage() {
  const navigate = useNavigate();
  const [forecasts, setForecasts] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningModel, setRunningModel] = useState(false);
  const [error, setError] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [horizonDays, setHorizonDays] = useState(7);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [aiSource, setAiSource] = useState('database');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fcRes, hospRes] = await Promise.all([
        fetchForecast({
          hospital_id: selectedHospital || undefined,
          days_per_period: horizonDays,
        }),
        fetchHospitals({ limit: 50 }).catch(() => ({ data: [] })),
      ]);

      setForecasts(fcRes.forecasts || []);
      setAiSource(fcRes.ai_service === 'connected' ? 'FastAPI XGBoost Engine' : 'Database Inference Engine');
      if (hospRes.data) {
        setHospitals(hospRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate forecast from database parameters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedHospital, horizonDays]);

  const handleRunModel = async () => {
    setRunningModel(true);
    try {
      await loadData();
    } finally {
      setRunningModel(false);
    }
  };

  // Filtered forecast list
  const filtered = forecasts.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      (item.medicine_name && item.medicine_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.medicine_category && item.medicine_category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.hospital_name && item.hospital_name.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesRisk = true;
    if (filterRisk === 'CRITICAL') matchesRisk = item.days_to_stockout < 7;
    if (filterRisk === 'WARNING') matchesRisk = item.days_to_stockout >= 7 && item.days_to_stockout <= 14;
    if (filterRisk === 'HEALTHY') matchesRisk = item.days_to_stockout > 14;

    return matchesSearch && matchesRisk;
  });

  // KPI Calculations
  const totalItems = forecasts.length;
  const criticalCount = forecasts.filter((f) => f.days_to_stockout < 7).length;
  const avgDemand = totalItems > 0 
    ? Math.round(forecasts.reduce((acc, curr) => acc + (curr.predicted_future_demand || 0), 0) / totalItems)
    : 0;
  const avgStockoutDays = totalItems > 0
    ? (forecasts.reduce((acc, curr) => acc + (curr.days_to_stockout || 0), 0) / totalItems).toFixed(1)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: '#1F4D3A' }}>
              Demand Forecasting &amp; Prediction
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: '#E8F5E9',
              color: '#2E7D32',
              border: '1px solid #A5D6A7'
            }}>
              <Database size={12} />
              Live DB Parameters
            </span>
          </div>
          <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: '0.9rem' }}>
            Machine learning forecast powered by XGBoost, consuming live hospital inventory, capacity &amp; consumption parameters.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadData}
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
            onClick={handleRunModel}
            disabled={runningModel || loading}
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
            <Cpu size={16} />
            <span>{runningModel ? 'Running ML Inference...' : 'Run Prediction on Live DB'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85rem' }}>
            <span>Active Medicines</span>
            <BarChart2 size={18} color="#1F4D3A" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px', color: '#0f172a' }}>
            {totalItems}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>
            Pulled from database catalogue
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85rem' }}>
            <span>Avg {horizonDays}-Day Forecast</span>
            <TrendingUp size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px', color: '#0f172a' }}>
            {avgDemand} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>units</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            XGBoost model horizon projection
          </div>
        </div>

        <div style={{
          background: criticalCount > 0 ? '#fff1f2' : '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: criticalCount > 0 ? '1px solid #fecdd3' : '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: criticalCount > 0 ? '#9f1239' : '#64748b', fontSize: '0.85rem' }}>
            <span>Stockout Risk (&lt; 7 Days)</span>
            <AlertTriangle size={18} color={criticalCount > 0 ? '#e11d48' : '#64748b'} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px', color: criticalCount > 0 ? '#be123c' : '#0f172a' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: criticalCount > 0 ? '#e11d48' : '#16a34a', fontWeight: 500 }}>
            {criticalCount > 0 ? 'Urgent attention required' : 'All stocks healthy'}
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85rem' }}>
            <span>Average Runway</span>
            <Clock size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px', color: '#0f172a' }}>
            {avgStockoutDays} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>days</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Inventory days remaining
          </div>
        </div>
      </div>

      {/* Control Filters Toolbar */}
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
              placeholder="Search medicine or category..."
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

          {/* Horizon Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Horizon:</span>
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setHorizonDays(days)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: horizonDays === days ? '1px solid #1F4D3A' : '1px solid #cbd5e1',
                  background: horizonDays === days ? '#1F4D3A' : '#ffffff',
                  color: horizonDays === days ? '#ffffff' : '#475569',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>

        {/* Risk Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { label: 'All', value: 'ALL' },
            { label: 'Critical (<7d)', value: 'CRITICAL' },
            { label: 'Warning (7-14d)', value: 'WARNING' },
            { label: 'Healthy (>14d)', value: 'HEALTHY' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilterRisk(item.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: filterRisk === item.value ? '1px solid #0f172a' : '1px solid #e2e8f0',
                background: filterRisk === item.value ? '#0f172a' : '#f8fafc',
                color: filterRisk === item.value ? '#ffffff' : '#64748b',
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

      {/* Model Parameter Notice */}
      <div style={{
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: '10px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.85rem',
        color: '#166534',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="#16a34a" />
          <span>
            <strong>Model Feature Pipeline Active:</strong> Inputs are extracted on-the-fly from the database schema: 
            <code> current_stock</code>, <code> safety_stock</code>, <code> consumption</code>, <code> patient_load</code>, <code> region_type</code>, and calendar features.
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>
          Engine: {aiSource}
        </span>
      </div>

      {/* Forecast Data Table */}
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
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Current Stock</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Safety Stock</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Pred. Daily Demand</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Pred. {horizonDays}-Day Demand</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Days to Stockout</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <RefreshCw size={18} className="animate-spin" color="#1F4D3A" />
                      <span>Loading predictions from database parameters...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No medicine forecasts match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const days = item.days_to_stockout;
                  let badgeStyle = { bg: '#dcfce7', text: '#15803d', border: '#86efac', label: 'Healthy' };
                  if (days < 7) {
                    badgeStyle = { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5', label: 'Critical Shortage' };
                  } else if (days <= 14) {
                    badgeStyle = { bg: '#fef3c7', text: '#b45309', border: '#fcd34d', label: 'Low Stock' };
                  }

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
                        <span style={{ fontWeight: 600, color: item.current_stock <= item.safety_stock ? '#dc2626' : '#0f172a' }}>
                          {item.current_stock}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '4px' }}>units</span>
                      </td>

                      <td style={{ padding: '14px 16px', color: '#64748b' }}>
                        {item.safety_stock} units
                      </td>

                      <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 500 }}>
                        {item.predicted_daily_demand} / day
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 600, color: '#1F4D3A' }}>
                          {item.predicted_future_demand}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '4px' }}>units</span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: badgeStyle.bg,
                            color: badgeStyle.text,
                            border: `1px solid ${badgeStyle.border}`,
                          }}>
                            {days} days
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {days < 14 ? (
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
                            <span>Request Transfer</span>
                            <ArrowRight size={12} />
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 500 }}>
                            Sufficient
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
