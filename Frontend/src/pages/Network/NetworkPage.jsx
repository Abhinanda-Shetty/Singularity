import { useState, useEffect, useMemo } from 'react';
import { Loader, AlertCircle } from 'lucide-react';
import { fetchNetworkTelemetry } from '../../services/networkApi';
import NetworkSummaryCards from './components/NetworkSummaryCards';
import NetworkFilters from './components/NetworkFilters';
import HospitalMap from './components/HospitalMap';
import HospitalDetailDrawer from './components/HospitalDetailDrawer';
import HospitalCardsGrid from './components/HospitalCardsGrid';
import './network.css';

export default function NetworkPage() {
  const [hospitals, setHospitals] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [summary, setSummary] = useState({
    totalHospitals: 0,
    criticalHospitals: 0,
    lowStockHospitals: 0,
    surplusHospitals: 0,
    healthyHospitals: 0,
    activeTransfers: 0,
    totalTransferredUnits: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & interaction state
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'critical' | 'low_stock' | 'surplus'
  const [showTransfers, setShowTransfers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [viewMode, setViewMode] = useState('split'); // 'map' | 'split'

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchNetworkTelemetry();
        if (!cancelled) {
          setHospitals(data.hospitals || []);
          setTransfers(data.transfers || []);
          setSummary(data.summary);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load network telemetry');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  // Filtered hospitals based on status filter & search query
  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      // 1. Status Filter
      if (activeFilter !== 'all' && h.status !== activeFilter) {
        return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = h.name.toLowerCase().includes(q);
        const matchesAddress = h.address?.toLowerCase().includes(q);
        const matchesType = h.type?.toLowerCase().includes(q);
        const matchesMed = h.criticalMedicines?.some(m => m.name.toLowerCase().includes(q)) ||
                           h.surplusMedicines?.some(m => m.name.toLowerCase().includes(q));

        if (!matchesName && !matchesAddress && !matchesType && !matchesMed) {
          return false;
        }
      }

      return true;
    });
  }, [hospitals, activeFilter, searchQuery]);

  // Counts for filter pills
  const counts = useMemo(() => ({
    all: hospitals.length,
    critical: hospitals.filter(h => h.status === 'critical').length,
    low_stock: hospitals.filter(h => h.status === 'low_stock').length,
    surplus: hospitals.filter(h => h.status === 'surplus').length,
    healthy: hospitals.filter(h => h.status === 'healthy').length,
    transfers: transfers.length
  }), [hospitals, transfers]);

  // Handlers
  const handleSelectHospital = (hospital) => {
    setSelectedHospital(hospital);
    setSelectedTransfer(null);
  };

  const handleSelectTransfer = (transfer) => {
    setSelectedTransfer(transfer);
    setSelectedHospital(null);
  };

  const handleCloseDrawer = () => {
    setSelectedHospital(null);
    setSelectedTransfer(null);
  };

  const handleResetView = () => {
    setActiveFilter('all');
    setSearchQuery('');
    setSelectedHospital(null);
    setSelectedTransfer(null);
    setResetTrigger(prev => prev + 1);
  };

  const handleFocusFacility = (hospital) => {
    setSelectedHospital(hospital);
  };

  if (loading) {
    return (
      <div className="placeholder-page" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Loader size={36} style={{ animation: 'spin 1s linear infinite', color: '#1F4D3A' }} />
        <h3 style={{ marginTop: '16px', color: '#1F4D3A', fontWeight: 700 }}>
          Initializing Hospital Supply Grid…
        </h3>
        <p style={{ color: '#66736B', fontSize: '0.9rem', marginTop: '6px' }}>
          Loading facility telemetry, risk tiers, and recommended transfer routes
        </p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="placeholder-page" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <AlertCircle size={40} style={{ color: '#DC2626' }} />
        <h2 style={{ marginTop: '16px', color: '#1F2A24', fontWeight: 800 }}>
          Network Connection Error
        </h2>
        <p style={{ color: '#DC2626', marginTop: '6px' }}>{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: '#1F4D3A',
            color: '#fff',
            borderRadius: '8px',
            fontWeight: 600
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="network-page">
      {/* Page Header */}
      <div className="welcome-section">
        <div>
          <h1 className="welcome-title">Hospital Supply Network</h1>
          <p className="welcome-subtitle">
            Regional healthcare inventory risk map &amp; AI-recommended medicine redistribution corridors
          </p>
        </div>
        <div className="system-status-wrap">
          <div className="system-status-pill">
            <span className="status-dot green" />
            <span className="status-text">Network Mesh Live</span>
          </div>
          <span className="last-updated-text">Synced 10 seconds ago</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <NetworkSummaryCards
        summary={summary}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        showTransfers={showTransfers}
        onToggleTransfers={() => setShowTransfers(prev => !prev)}
      />

      {/* Controls & Filter Bar */}
      <NetworkFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
        showTransfers={showTransfers}
        onToggleTransfers={() => setShowTransfers(prev => !prev)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onResetView={handleResetView}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Interactive Map Wrapper */}
      <div style={{ position: 'relative' }}>
        <HospitalMap
          hospitals={hospitals}
          filteredHospitals={filteredHospitals}
          transfers={transfers}
          showTransfers={showTransfers}
          selectedHospital={selectedHospital}
          onSelectHospital={handleSelectHospital}
          selectedTransfer={selectedTransfer}
          onSelectTransfer={handleSelectTransfer}
          resetTrigger={resetTrigger}
          onFocusFacility={handleFocusFacility}
        />

        {/* Detailed Inspector Drawer for Hospital or Transfer */}
        <HospitalDetailDrawer
          selectedHospital={selectedHospital}
          selectedTransfer={selectedTransfer}
          onClose={handleCloseDrawer}
          transfers={transfers}
          hospitals={hospitals}
          onSelectHospital={handleSelectHospital}
        />
      </div>

      {/* Hospital Cards Grid (Split View Mode or below map) */}
      {viewMode === 'split' && (
        <HospitalCardsGrid
          hospitals={filteredHospitals}
          selectedHospital={selectedHospital}
          onSelectHospital={handleSelectHospital}
          onFocusMap={handleFocusFacility}
        />
      )}
    </div>
  );
}
