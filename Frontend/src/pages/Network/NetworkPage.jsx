import { useState, useEffect, useMemo } from 'react';
import {
  Network, MapPin, Users, Building2, Loader, Search,
  ArrowLeftRight, CheckCircle2, ShieldAlert,
  Navigation, Database, Sparkles, Truck, Play,
  Activity, AlertTriangle, TrendingUp, Plus, X, Check
} from 'lucide-react';
import { fetchHospitals, createHospital } from '../../services/api';
import { mockHospitals } from '../../data/mockData';
import DispatchSimulationModal from '../../components/DispatchSimulationModal/DispatchSimulationModal';
import './NetworkPage.css';

/* ── Status config ───────────────────────────────── */
const STATUS_CONFIG = {
  Critical: {
    bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', dot: '#DC2626',
    label: 'Critical Shortage', pill: 'pulse-ring-red',
  },
  Warning: {
    bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', dot: '#D97706',
    label: 'Low Stock Warning', pill: '',
  },
  Healthy: {
    bg: '#EDF7EE', border: '#C6E2C9', text: '#1F4D3A', dot: '#16A34A',
    label: 'Healthy Supply', pill: '',
  },
  Surplus: {
    bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB', dot: '#2563EB',
    label: 'Surplus Reserve', pill: 'pulse-ring-blue',
  },
};

/* ── GPS → SVG projection (India bounds) ─────────── */
function toSvgXY(lat, lng) {
  const minLat = 11.0, maxLat = 30.5;
  const minLng = 71.0, maxLng = 87.0;
  const validLat = typeof lat === 'number' && !isNaN(lat) ? lat : 19.076;
  const validLng = typeof lng === 'number' && !isNaN(lng) ? lng : 72.877;
  const clampedLat = Math.max(minLat, Math.min(maxLat, validLat));
  const clampedLng = Math.max(minLng, Math.min(maxLng, validLng));
  const x = 90 + ((clampedLng - minLng) / (maxLng - minLng)) * 620;
  const y = 380 - ((clampedLat - minLat) / (maxLat - minLat)) * 310;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

export default function NetworkPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoutesOnly, setShowRoutesOnly] = useState(false);
  const [dispatchModalData, setDispatchModalData] = useState(null);

  // New facility modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHospData, setNewHospData] = useState({
    name: '',
    type: 'general',
    address: 'Hyderabad, Telangana',
    patient_capacity: '350',
  });
  const [submittingHosp, setSubmittingHosp] = useState(false);
  const [hospToast, setHospToast] = useState(null);

  /* Load hospitals */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchHospitals({ limit: 100 });
        if (cancelled) return;

        const raw = res.data?.length > 0 ? res.data : mockHospitals;
        if (res.data?.length > 0) setIsLive(true);

        const enriched = raw.map((h, idx) => {
          let status = 'Healthy';
          if      (h.id === 3 || idx === 2) status = 'Critical';
          else if (h.id === 1 || idx === 0) status = 'Surplus';
          else if (h.id === 5 || idx === 4) status = 'Warning';
          else if (h.id === 4 || idx === 3) status = 'Surplus';
          else if (h.id > 5) status = h.id % 2 === 0 ? 'Surplus' : 'Healthy';

          return {
            ...h,
            latitude:  parseFloat(h.latitude) || (18.5 + (idx * 2) % 10),
            longitude: parseFloat(h.longitude) || (74.0 + (idx * 3) % 12),
            status: h.status || status,
            isNew: h.id > 5,
          };
        });

        setHospitals(enriched);
        if (enriched.length > 0) setSelectedHospital(enriched[0]);
      } catch {
        if (cancelled) return;
        const fallback = mockHospitals.map((h, idx) => ({
          ...h,
          status: idx === 0 ? 'Surplus' : idx === 2 ? 'Critical' : idx === 4 ? 'Warning' : 'Healthy',
        }));
        setHospitals(fallback);
        setSelectedHospital(fallback[0]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleAddHospitalSubmit = async (e) => {
    e.preventDefault();
    if (!newHospData.name.trim()) return;
    setSubmittingHosp(true);
    try {
      const res = await createHospital({
        name: newHospData.name.trim(),
        type: newHospData.type,
        address: newHospData.address.trim(),
        patient_capacity: parseInt(newHospData.patient_capacity, 10) || 300,
      });
      const created = res.data;
      if (created) {
        const enrichedNew = {
          ...created,
          latitude: parseFloat(created.latitude) || 17.3850,
          longitude: parseFloat(created.longitude) || 78.4867,
          status: 'Surplus',
          isNew: true,
        };
        setHospitals((prev) => [enrichedNew, ...prev]);
        setSelectedHospital(enrichedNew);
        setShowAddModal(false);
        setNewHospData({
          name: '',
          type: 'general',
          address: 'Hyderabad, Telangana',
          patient_capacity: '350',
        });
        setHospToast(`Facility "${created.name}" registered and mapped into network grid!`);
        setTimeout(() => setHospToast(null), 4500);
      }
    } catch (err) {
      alert(`Error registering facility: ${err.message}`);
    } finally {
      setSubmittingHosp(false);
    }
  };


  /* Derived lists */
  const filteredHospitals = useMemo(() => {
    return hospitals.filter(h => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        h.name?.toLowerCase().includes(q) ||
        h.address?.toLowerCase().includes(q) ||
        h.type?.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'ALL' || h.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [hospitals, searchQuery, filterStatus]);

  const transferCorridors = useMemo(() => {
    const surplus = hospitals.filter(h => h.status === 'Surplus');
    const needy   = hospitals.filter(h => h.status === 'Critical' || h.status === 'Warning');
    return surplus.flatMap((s, i) => {
      if (!needy[i]) return [];
      return [{
        id: `route-${s.id}-${needy[i].id}`,
        from: s,
        to: needy[i],
        medicine: i === 0 ? 'Amoxicillin 500mg' : 'Ceftriaxone 1g Injection',
        units: i === 0 ? 450 : 180,
        urgency: needy[i].status === 'Critical' ? 'Critical' : 'Urgent',
        eta: i === 0 ? '18 hrs' : '6 hrs',
      }];
    });
  }, [hospitals]);

  /* SVG node coordinates */
  const nodeCoords = useMemo(() => {
    const map = {};
    hospitals.forEach((h, i) => {
      if (!isNaN(h.latitude) && !isNaN(h.longitude)) {
        map[h.id] = toSvgXY(h.latitude, h.longitude);
      } else {
        const fallbacks = [
          { x: 200, y: 220 }, { x: 390, y: 90 }, { x: 630, y: 150 },
          { x: 390, y: 345 }, { x: 500, y: 335 },
        ];
        map[h.id] = fallbacks[i % fallbacks.length];
      }
    });
    return map;
  }, [hospitals]);

  /* Counts */
  const counts = useMemo(() => ({
    healthy:  hospitals.filter(h => h.status === 'Healthy').length,
    warning:  hospitals.filter(h => h.status === 'Warning').length,
    critical: hospitals.filter(h => h.status === 'Critical').length,
    surplus:  hospitals.filter(h => h.status === 'Surplus').length,
  }), [hospitals]);

  /* ── Loading ──────────────────────────────────── */
  if (loading) {
    return (
      <div className="placeholder-page">
        <Loader size={28} className="spinner-icon" />
        <p>Loading hospital network data...</p>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────── */
  return (
    <div className="network-command-page">

      {/* Header */}
      <div className="network-page-header">
        <div className="network-header-left">
          <div className={`network-badge ${isLive ? 'live' : 'offline'}`}>
            <Database size={12} />
            <span>{isLive ? 'Live Network Connected' : 'Offline — Cached Data'}</span>
          </div>
          <h1 className="network-page-title">Hospital Supply Network</h1>
          <p className="network-page-subtitle">
            Real-time geospatial supply monitoring across all connected facilities and redistribution corridors.
          </p>
        </div>

        <div className="network-header-right">
          <button
            type="button"
            className="net-add-facility-btn"
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '9999px',
              backgroundColor: '#1F4D3A',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(31, 77, 58, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={15} />
            <span>+ Register Facility</span>
          </button>
          <div className="net-pill-stat">
            <span className="pulse-indicator" />
            {hospitals.length} Connected Facilities
          </div>
          <div className="net-pill-stat">
            <ArrowLeftRight size={14} color="#1F4D3A" />
            {transferCorridors.length} Active Corridors
          </div>
        </div>
      </div>

      {hospToast && (
        <div
          style={{
            margin: '0 0 16px 0',
            padding: '12px 18px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '10px',
            color: '#065F46',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <CheckCircle2 size={18} color="#059669" />
          <span>{hospToast}</span>
        </div>
      )}


      {/* Metrics strip */}
      <div className="network-metrics-strip">
        <div className="net-metric-card green">
          <div className="net-metric-icon">
            <CheckCircle2 size={18} />
          </div>
          <span className="net-metric-num">{counts.healthy}</span>
          <span className="net-metric-label">Healthy Nodes</span>
        </div>

        <div className="net-metric-card amber">
          <div className="net-metric-icon">
            <AlertTriangle size={18} />
          </div>
          <span className="net-metric-num">{counts.warning}</span>
          <span className="net-metric-label">Low Stock Warnings</span>
        </div>

        <div className="net-metric-card red">
          <div className="net-metric-icon">
            <ShieldAlert size={18} />
          </div>
          <span className="net-metric-num">{counts.critical}</span>
          <span className="net-metric-label">Critical Shortages</span>
        </div>

        <div className="net-metric-card blue">
          <div className="net-metric-icon">
            <TrendingUp size={18} />
          </div>
          <span className="net-metric-num">{counts.surplus}</span>
          <span className="net-metric-label">Surplus Hubs</span>
        </div>
      </div>

      {/* Search + filters */}
      <div className="network-control-bar">
        <div className="network-search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by hospital name, city, or facility type..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="network-search-input"
          />
        </div>

        <div className="status-filter-pills">
          {[
            { key: 'ALL',      label: `All (${hospitals.length})` },
            { key: 'Critical', label: 'Critical', color: 'red'   },
            { key: 'Warning',  label: 'Warning',  color: 'amber' },
            { key: 'Healthy',  label: 'Healthy',  color: 'green' },
            { key: 'Surplus',  label: 'Surplus',  color: 'blue'  },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              className={`filter-pill ${color || ''} ${filterStatus === key ? 'active' : ''}`}
              onClick={() => setFilterStatus(key)}
            >
              {color && <span className={`mini-dot ${color}`} />}
              {label}
            </button>
          ))}
        </div>

        <button
          className={`toggle-routes-btn ${showRoutesOnly ? 'active' : ''}`}
          onClick={() => setShowRoutesOnly(v => !v)}
        >
          <ArrowLeftRight size={14} />
          <span>{showRoutesOnly ? 'All Nodes' : 'Show Corridors'}</span>
        </button>
      </div>

      {/* Interactive Map */}
      <div className="network-map-card">
        <div className="map-card-header">
          <div className="map-title-group">
            <Navigation size={17} className="text-forest" />
            <span className="map-title-text">National Medical Logistics Map</span>
            <span className="map-badge">{hospitals.length} Facilities Mapped</span>
          </div>

          <div className="map-legend-strip">
            <div className="legend-item"><span className="legend-swatch green" /> Healthy</div>
            <div className="legend-item"><span className="legend-swatch amber" /> Warning</div>
            <div className="legend-item"><span className="legend-swatch red" /> Critical</div>
            <div className="legend-item"><span className="legend-swatch blue" /> Surplus</div>
            <div className="legend-item" style={{ color: '#1F4D3A', fontWeight: 700 }}>
              · Click corridor to simulate dispatch
            </div>
          </div>
        </div>

        <div className="map-svg-viewport">
          <svg viewBox="0 0 800 420" className="network-interactive-svg">
            <defs>
              <pattern id="mapGridNet" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2EADE" strokeWidth="0.7" opacity="0.55" />
              </pattern>
              <linearGradient id="corridorGradNet" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#2563EB" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
              <filter id="nodeDropShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000020" />
              </filter>
            </defs>

            {/* Background */}
            <rect width="100%" height="100%" fill="#F8FAF6" />
            <rect width="100%" height="100%" fill="url(#mapGridNet)" />

            {/* Mesh lines */}
            {hospitals.map((hA, i) => {
              const pA = nodeCoords[hA.id];
              if (!pA) return null;
              return hospitals.slice(i + 1).map(hB => {
                const pB = nodeCoords[hB.id];
                if (!pB) return null;
                return (
                  <line
                    key={`mesh-${hA.id}-${hB.id}`}
                    x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y}
                    stroke="#D9E4D6" strokeWidth="1.2"
                    strokeDasharray="4 4"
                    opacity={showRoutesOnly ? 0.15 : 0.6}
                  />
                );
              });
            })}

            {/* Active corridors */}
            {transferCorridors.map(route => {
              const pFrom = nodeCoords[route.from.id];
              const pTo   = nodeCoords[route.to.id];
              if (!pFrom || !pTo) return null;
              const mx = (pFrom.x + pTo.x) / 2;
              const my = (pFrom.y + pTo.y) / 2 - 35;
              return (
                <g
                  key={route.id}
                  className="transfer-corridor-group"
                  onClick={() => setDispatchModalData({
                    donor_hospital_id:     route.from.id,
                    donor_hospital_name:   route.from.name,
                    recipient_hospital_id: route.to.id,
                    recipient_hospital_name: route.to.name,
                    medicine_name: route.medicine,
                    transfer_qty: route.units,
                  })}
                >
                  <path
                    d={`M ${pFrom.x} ${pFrom.y} Q ${mx} ${my} ${pTo.x} ${pTo.y}`}
                    stroke="url(#corridorGradNet)"
                    strokeWidth="3.5"
                    fill="none"
                    className="animated-transfer-corridor"
                  />
                  <rect
                    x={mx - 54} y={my - 13}
                    width="108" height="22"
                    rx="11" fill="#1F4D3A" opacity="0.93"
                  />
                  <text
                    x={mx} y={my + 1}
                    fill="#FFFFFF" fontSize="9" fontWeight="700"
                    textAnchor="middle" alignmentBaseline="middle"
                  >
                    ▶ Dispatch · {route.units}u
                  </text>
                </g>
              );
            })}

            {/* Hospital nodes */}
            {hospitals.map(h => {
              const pos  = nodeCoords[h.id];
              if (!pos) return null;
              const cfg  = STATUS_CONFIG[h.status] || STATUS_CONFIG.Healthy;
              const isSel = selectedHospital?.id === h.id;
              return (
                <g
                  key={h.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedHospital(h)}
                  className={`hospital-map-node ${isSel ? 'selected' : ''}`}
                  style={{ cursor: 'pointer' }}
                  filter={isSel ? 'url(#nodeDropShadow)' : undefined}
                >
                  {/* Pulse halo for critical/surplus */}
                  {(h.status === 'Critical' || h.status === 'Surplus') && (
                    <circle r="28" fill={cfg.bg} opacity="0.6"
                      className={cfg.pill}
                    />
                  )}
                  {/* NEW facility beacon badge */}
                  {h.isNew && (
                    <g transform="translate(0, -22)">
                      <rect x="-18" y="-8" width="36" height="15" rx="4" fill="#059669" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))" />
                      <text x="0" y="3" fontSize="8" fontWeight="800" fill="#FFFFFF" textAnchor="middle">★ NEW</text>
                    </g>
                  )}
                  {/* Outer ring */}
                  <circle
                    r={isSel ? 22 : 18}
                    fill="#FFFFFF"
                    stroke={cfg.dot}
                    strokeWidth={isSel ? 3 : 2}
                  />
                  {/* Inner dot */}
                  <circle r={isSel ? 9 : 7} fill={cfg.dot} />

                  {/* Label */}
                  <text
                    x="0" y="34"
                    fontSize="10.5" fontWeight="700"
                    fill="#1F2A24" textAnchor="middle"
                    className="node-svg-label"
                  >
                    {h.name?.split(' ').slice(0, 2).join(' ')}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Selected hospital inspector */}
          {selectedHospital && (() => {
            const cfg = STATUS_CONFIG[selectedHospital.status] || STATUS_CONFIG.Healthy;
            return (
              <div className="map-selected-card">
                <div className="selected-card-top">
                  <div>
                    <span className={`status-badge-inline ${selectedHospital.status?.toLowerCase()}`}>
                      {cfg.label}
                    </span>
                    <h4 className="selected-h-name">{selectedHospital.name}</h4>
                    <p className="selected-h-addr">{selectedHospital.address}</p>
                  </div>
                  <button
                    onClick={() => setSelectedHospital(null)}
                    className="close-inspector-btn"
                    aria-label="Close"
                  >✕</button>
                </div>

                <div className="selected-card-grid">
                  <div className="sel-stat-item">
                    <span className="sel-label">Bed Capacity</span>
                    <span className="sel-val">{selectedHospital.patient_capacity || 500} Beds</span>
                  </div>
                  <div className="sel-stat-item">
                    <span className="sel-label">Facility Type</span>
                    <span className="sel-val" style={{ textTransform: 'capitalize' }}>
                      {selectedHospital.type || 'General'}
                    </span>
                  </div>
                  <div className="sel-stat-item">
                    <span className="sel-label">Coordinates</span>
                    <span className="sel-val font-mono">
                      {selectedHospital.latitude
                        ? `${parseFloat(selectedHospital.latitude).toFixed(3)}°N, ${parseFloat(selectedHospital.longitude).toFixed(3)}°E`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="sel-stat-item">
                    <span className="sel-label">Network Status</span>
                    <span className="sel-val" style={{ color: '#15803d' }}>✓ Online</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="facility-dispatch-btn"
                  style={{ marginTop: '14px' }}
                  onClick={() => setDispatchModalData({
                    donor_hospital_id: selectedHospital.status === 'Surplus' ? selectedHospital.id : (hospitals[0]?.id || 1),
                    recipient_hospital_id: selectedHospital.status !== 'Surplus' ? selectedHospital.id : (hospitals[2]?.id || 3),
                    donor_hospital_name: selectedHospital.status === 'Surplus' ? selectedHospital.name : (hospitals[0]?.name || 'City General Hospital'),
                    recipient_hospital_name: selectedHospital.status !== 'Surplus' ? selectedHospital.name : (hospitals[2]?.name || 'Rural Health Centre East'),
                    medicine_name: 'Amoxicillin 500mg',
                    transfer_qty: 350,
                  })}
                >
                  <Play size={13} />
                  Simulate Dispatch from This Facility
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Facility Directory */}
      <div className="network-facility-list-section">
        <div className="net-section-header">
          <div className="net-section-title-wrap">
            <Building2 size={18} className="text-forest" />
            <span className="net-section-title">Facility Directory</span>
          </div>
          <span className="net-section-meta">
            Showing {filteredHospitals.length} of {hospitals.length} facilities
          </span>
        </div>

        <div className="network-cards-grid">
          {filteredHospitals.map(h => {
            const cfg = STATUS_CONFIG[h.status] || STATUS_CONFIG.Healthy;
            return (
              <div
                key={h.id}
                className={`facility-card ${selectedHospital?.id === h.id ? 'active-card' : ''}`}
                onClick={() => setSelectedHospital(h)}
              >
                <div className="facility-card-header">
                  <div
                    className="facility-avatar"
                    style={{ backgroundColor: cfg.bg, color: cfg.text, border: `1.5px solid ${cfg.border}` }}
                  >
                    {h.name?.[0]?.toUpperCase() || 'H'}
                  </div>
                  <div className="facility-identity">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h3 className="facility-name">{h.name}</h3>
                      {h.isNew && (
                        <span
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            backgroundColor: '#DCFCE7',
                            color: '#15803D',
                            padding: '1px 6px',
                            borderRadius: '9999px',
                            border: '1px solid #86EFAC',
                            letterSpacing: '0.02em',
                          }}
                        >
                          NEW
                        </span>
                      )}
                    </div>
                    <span className="facility-type-tag" style={{ textTransform: 'capitalize' }}>
                      {h.type} Facility · ID #{h.id}
                    </span>
                  </div>

                  <span
                    className="facility-status-pill"
                    style={{ backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
                  >
                    <span className="status-mini-dot" style={{ backgroundColor: cfg.dot }} />
                    {h.status}
                  </span>
                </div>

                <div className="facility-card-meta">
                  {h.address && (
                    <div className="facility-meta-row">
                      <MapPin size={13} className="meta-icon" />
                      <span>{h.address}</span>
                    </div>
                  )}
                  <div className="facility-meta-row">
                    <Users size={13} className="meta-icon" />
                    <span>{h.patient_capacity} Beds Capacity</span>
                  </div>
                  {h.latitude && h.longitude && (
                    <div className="facility-meta-row font-mono">
                      <Navigation size={13} className="meta-icon" />
                      <span>
                        {parseFloat(h.latitude).toFixed(4)}°N,&nbsp;
                        {parseFloat(h.longitude).toFixed(4)}°E
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="facility-dispatch-btn"
                  onClick={e => {
                    e.stopPropagation();
                    setDispatchModalData({
                      donor_hospital_id:     h.status === 'Surplus' ? h.id : (hospitals[0]?.id || 1),
                      recipient_hospital_id: h.status !== 'Surplus' ? h.id : (hospitals[2]?.id || 3),
                      donor_hospital_name:   h.status === 'Surplus' ? h.name : (hospitals[0]?.name || 'City General Hospital'),
                      recipient_hospital_name: h.status !== 'Surplus' ? h.name : (hospitals[2]?.name || 'Rural Health Centre'),
                      medicine_name: 'Amoxicillin 500mg',
                      transfer_qty: 300,
                    });
                  }}
                >
                  <Truck size={13} />
                  Simulate Transfer Dispatch
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dispatch Simulation Modal */}
      <DispatchSimulationModal
        isOpen={!!dispatchModalData}
        onClose={() => setDispatchModalData(null)}
        initialData={dispatchModalData || {}}
        hospitals={hospitals}
      />

      {/* Add Facility to Network Grid Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.15s ease-out',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#DCFCE7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 size={20} color="#15803D" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                    Register Network Facility
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Onboard new hospital node into live telemetry grid
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddHospitalSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Hospital / Health Facility Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Multispecialty Hospital"
                  value={newHospData.name}
                  onChange={(e) => setNewHospData({ ...newHospData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Facility Type
                  </label>
                  <select
                    value={newHospData.type}
                    onChange={(e) => setNewHospData({ ...newHospData, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="general">General Hospital</option>
                    <option value="specialty">Super Specialty</option>
                    <option value="urban">Urban Medical Centre</option>
                    <option value="rural">Rural Health Centre</option>
                    <option value="trauma">Trauma &amp; Emergency</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Bed Capacity
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="3000"
                    value={newHospData.patient_capacity}
                    onChange={(e) => setNewHospData({ ...newHospData, patient_capacity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  City / Location (India Bounds) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyderabad, Telangana or Pune, Maharashtra"
                  value={newHospData.address}
                  onChange={(e) => setNewHospData({ ...newHospData, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#ffffff',
                    color: '#64748B',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingHosp}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#1F4D3A',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {submittingHosp ? 'Mapping Node...' : 'Map Facility to Network'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

