import { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw, Building2 } from 'lucide-react';
import KpiCard from '../../components/KpiCard';
import DemandChart from '../../components/DemandChart';
import StockDonutChart from '../../components/StockDonutChart';
import InsightCard from '../../components/InsightCard';
import { fetchDashboardSummary, fetchHospitals, getUser } from '../../services/api';

// Fallback mock profile shown while data loads or if API is unavailable
const FALLBACK_PROFILE = { name: 'Hospital', systemStatus: 'System running' };

export default function DashboardPage() {
  const user = getUser();
  const [selectedHospitalId, setSelectedHospitalId] = useState(user?.hospital_id || 1);
  const [hospitalsList, setHospitalsList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [hospital, setHospital] = useState(FALLBACK_PROFILE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState('Just now');
  const [error, setError] = useState(null);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [data, hospRes] = await Promise.all([
        fetchDashboardSummary(selectedHospitalId),
        fetchHospitals({ limit: 50 }).catch(() => ({ data: [] })),
      ]);
      setSummary(data);
      if (data.hospital) setHospital(data.hospital);
      if (hospRes?.data?.length > 0) setHospitalsList(hospRes.data);
      const now = new Date();
      setLastUpdatedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, [selectedHospitalId]);



  // Build KPI cards from live data (or show placeholders while loading)
  const kpiCards = [
    {
      id: 'total-types',
      title: 'Total medicine types',
      value: loading ? '—' : String(summary?.medicineTotal ?? 0),
      change: 'across all categories',
      isPositive: true,
      type: 'medicine',
      colorTheme: 'green',
      sparklineColor: '#2E7D52',
      sparklinePoints: [20, 26, 24, 30, 27, 36, 42, 48],
    },
    {
      id: 'total-stock',
      title: 'Total stock (units)',
      value: loading ? '—' : summary?.inventoryTotal?.toLocaleString() ?? '0',
      change: 'across all inventory rows',
      isPositive: true,
      type: 'stock',
      colorTheme: 'green',
      sparklineColor: '#2E7D52',
      sparklinePoints: [48, 44, 40, 42, 38, 35, 30, 26],
    },
    {
      id: 'at-risk',
      title: 'At risk (low stock)',
      value: loading ? '—' : String(summary?.atRiskCount ?? 0),
      change: 'items at or below safety stock',
      isPositive: (summary?.atRiskCount ?? 0) === 0,
      type: 'risk',
      colorTheme: 'amber',
      sparklineColor: '#F59E0B',
      sparklinePoints: [18, 22, 28, 24, 32, 28, 38, 44],
    },
    {
      id: 'expiring-soon',
      title: 'Expiring within 30 days',
      value: loading ? '—' : String(summary?.expiringTotal ?? 0),
      change: 'batches expiring soon',
      isPositive: (summary?.expiringTotal ?? 0) === 0,
      type: 'expiring',
      colorTheme: 'rose',
      sparklineColor: '#E11D48',
      sparklinePoints: [20, 22, 30, 28, 36, 32, 42, 48],
    },
  ];

  // Build insights from live data
  const insights = summary
    ? [
        {
          id: 1,
          title: `${summary.medicineTotal} medicine types tracked`,
          description: `${summary.inventoryTotal?.toLocaleString()} total units in inventory across all hospitals.`,
          icon: 'chart',
          variant: 'default',
        },
        {
          id: 2,
          title: summary.atRiskCount > 0
            ? `${summary.atRiskCount} medicines need attention`
            : 'All stock levels are healthy',
          description: summary.atRiskCount > 0
            ? 'Review items at or below their safety stock threshold.'
            : 'No items are currently below safety stock.',
          icon: summary.atRiskCount > 0 ? 'warning' : 'chart',
          variant: summary.atRiskCount > 0 ? 'default' : 'default',
        },
        {
          id: 3,
          title: summary.expiringTotal > 0
            ? `${summary.expiringTotal} batches expiring within 30 days`
            : 'No batches expiring soon',
          description: summary.expiringTotal > 0
            ? 'Consider redistributing or using these batches within the network.'
            : 'All batch expiry dates are beyond 30 days.',
          icon: summary.expiringTotal > 0 ? 'alert' : 'chart',
          variant: summary.expiringTotal > 0 ? 'urgent' : 'default',
        },
      ]
    : [];

  const displayName = hospital?.name ?? 'Hospital';
  const lastUpdated = loading ? 'Loading…' : error ? 'Unavailable' : 'Just now';

  return (
    <div>
      {/* Welcome Section */}
      <div className="welcome-section">
        <div>
          <h1 className="welcome-title">Welcome, {displayName}</h1>
          <p className="welcome-subtitle">Here&apos;s the current status of your medicine supply.</p>
        </div>

        <div className="system-status-wrap">
          {hospitalsList.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={15} color="#1F4D3A" />
              <select
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(Number(e.target.value))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #C6E2C9',
                  backgroundColor: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#1F4D3A',
                  cursor: 'pointer',
                  outline: 'none',
                }}
                title="Switch active facility view"
              >
                {hospitalsList.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.address?.split(', ')?.[1] || 'Node'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="system-status-pill">
            <span className="status-dot-pulse" />
            <span>{error ? 'Backend unavailable' : 'System running'}</span>
          </div>
          <span className="status-last-updated">Last updated {lastUpdated}</span>
        </div>

      </div>

      {/* API Error Banner */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '10px',
          padding: '12px 16px',
          color: '#b91c1c',
          fontSize: '0.875rem',
          marginBottom: '20px',
        }}>
          ⚠️ Could not load live data: {error}. Showing placeholder values.
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="kpi-cards-grid">
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.id} data={kpi} />
        ))}
      </div>

      {/* Analysis Grid: Demand Trend & Stock Status */}
      <div className="analysis-grid">
        <DemandChart />
        <StockDonutChart inventoryRows={summary?.inventoryRows} loading={loading} />
      </div>

      {/* Quick Insights Section */}
      {!loading && insights.length > 0 && (
        <section className="quick-insights-section">
          <div className="section-label">
            <Lightbulb className="section-label-icon" size={19} strokeWidth={2.2} />
            <span>Quick insights</span>
          </div>

          <div className="insights-grid">
            {insights.map((item) => (
              <InsightCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
