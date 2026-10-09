import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, X, Play, Pause, RotateCcw, FastForward, Check, 
  MapPin, ShieldCheck, Thermometer, Radio, ArrowRight, 
  Building2, CheckCircle2, Navigation, Activity, Sparkles
} from 'lucide-react';
import { explainRedistribution } from '../../services/api';
import './DispatchSimulationModal.css';


// Haversine geodesic distance in kilometers between two GPS coordinates
function calcHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2 || isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return 650;
  }
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Convert real India GPS bounds to SVG viewBox (0 0 620 270)
function projectIndiaGeoToSvg(lat, lng) {
  const minLat = 10.5;
  const maxLat = 30.5;
  const minLng = 71.0;
  const maxLng = 87.0;

  const validLat = typeof lat === 'number' && !isNaN(lat) ? lat : 19.076;
  const validLng = typeof lng === 'number' && !isNaN(lng) ? lng : 72.877;

  const clampedLat = Math.max(minLat, Math.min(maxLat, validLat));
  const clampedLng = Math.max(minLng, Math.min(maxLng, validLng));

  const x = 70 + ((clampedLng - minLng) / (maxLng - minLng)) * 480;
  const y = 240 - ((clampedLat - minLat) / (maxLat - minLat)) * 200;

  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

export default function DispatchSimulationModal({
  isOpen,
  onClose,
  initialData = {},
  hospitals = [],
  medicines = [],
  onComplete,
}) {
  if (!isOpen) return null;

  // Find default donor hospital from real Supabase hospitals
  const defaultDonor = useMemo(() => {
    if (!hospitals || hospitals.length === 0) return null;
    if (initialData.donor_hospital_id) {
      const found = hospitals.find(h => h.id === initialData.donor_hospital_id);
      if (found) return found;
    }
    if (initialData.donor_hospital_name) {
      const found = hospitals.find(h => h.name.toLowerCase().includes(initialData.donor_hospital_name.toLowerCase()));
      if (found) return found;
    }
    return hospitals[0]; // Default to City General Hospital (Mumbai)
  }, [hospitals, initialData]);

  // Find default recipient hospital from real Supabase hospitals
  const defaultRecipient = useMemo(() => {
    if (!hospitals || hospitals.length === 0) return null;
    if (initialData.recipient_hospital_id) {
      const found = hospitals.find(h => h.id === initialData.recipient_hospital_id);
      if (found) return found;
    }
    if (initialData.recipient_hospital_name) {
      const found = hospitals.find(h => h.name.toLowerCase().includes(initialData.recipient_hospital_name.toLowerCase()));
      if (found) return found;
    }
    if (initialData.hospital_name) {
      const found = hospitals.find(h => h.name.toLowerCase().includes(initialData.hospital_name.toLowerCase()));
      if (found) return found;
    }
    // Pick different hospital from donor
    const diff = hospitals.find(h => h.id !== (defaultDonor?.id || 1));
    return diff || hospitals[1] || hospitals[0];
  }, [hospitals, initialData, defaultDonor]);

  // Selected entities for simulation
  const [selectedDonorId, setSelectedDonorId] = useState(defaultDonor?.id || 1);
  const [selectedRecipientId, setSelectedRecipientId] = useState(defaultRecipient?.id || 3);
  const [selectedMedName, setSelectedMedName] = useState(initialData.medicine_name || 'Amoxicillin 500mg');
  const [transferQty, setTransferQty] = useState(initialData.transfer_qty || initialData.quantity_required || 250);

  // Simulation controls
  const [progress, setProgress] = useState(15);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackingId] = useState(initialData.trackingId || `MED-EXP-${Math.floor(100000 + Math.random() * 900000)}`);
  const [aiExplanation, setAiExplanation] = useState('');
  const [loadingAiExplain, setLoadingAiExplain] = useState(false);

  // Active Donor and Recipient objects
  const donor = useMemo(() => {
    return hospitals.find(h => h.id === Number(selectedDonorId)) || defaultDonor || hospitals[0] || {};
  }, [hospitals, selectedDonorId, defaultDonor]);

  const recipient = useMemo(() => {
    return hospitals.find(h => h.id === Number(selectedRecipientId)) || defaultRecipient || hospitals[1] || {};
  }, [hospitals, selectedRecipientId, defaultRecipient]);

  // Real geodesic distance in KM between the two Supabase hospital locations
  const distanceKm = useMemo(() => {
    const lat1 = parseFloat(donor.latitude) || 19.076;
    const lon1 = parseFloat(donor.longitude) || 72.877;
    const lat2 = parseFloat(recipient.latitude) || 25.594;
    const lon2 = parseFloat(recipient.longitude) || 85.137;
    return calcHaversineDistanceKm(lat1, lon1, lat2, lon2);
  }, [donor, recipient]);

  // Estimated highway transit duration
  const estHours = useMemo(() => {
    return Math.max(1, (distanceKm / 65)).toFixed(1);
  }, [distanceKm]);

  // Svg Coordinates
  const donorPos = useMemo(() => {
    return projectIndiaGeoToSvg(parseFloat(donor.latitude), parseFloat(donor.longitude));
  }, [donor]);

  const recipientPos = useMemo(() => {
    return projectIndiaGeoToSvg(parseFloat(recipient.latitude), parseFloat(recipient.longitude));
  }, [recipient]);

  // Bezier curve calculations
  const { midX, midY, pathD, truckPos, currentLat, currentLng } = useMemo(() => {
    const p0 = donorPos;
    const p2 = recipientPos;
    const mx = (p0.x + p2.x) / 2;
    const dx = p2.x - p0.x;
    const dy = p2.y - p0.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const my = (p0.y + p2.y) / 2 - Math.min(50, Math.max(25, dist * 0.22));

    const path = `M ${p0.x} ${p0.y} Q ${mx} ${my} ${p2.x} ${p2.y}`;

    // Interpolate current position along quadratic Bezier
    const t = progress / 100;
    const tx = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * mx + t * t * p2.x;
    const ty = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * my + t * t * p2.y;

    // Interpolate GPS coordinates
    const dLat = parseFloat(donor.latitude) || 19.076;
    const dLng = parseFloat(donor.longitude) || 72.877;
    const rLat = parseFloat(recipient.latitude) || 25.594;
    const rLng = parseFloat(recipient.longitude) || 85.137;

    const curLat = ((1 - t) * dLat + t * rLat).toFixed(4);
    const curLng = ((1 - t) * dLng + t * rLng).toFixed(4);

    return {
      midX: mx,
      midY: my,
      pathD: path,
      truckPos: { x: tx, y: ty },
      currentLat: curLat,
      currentLng: curLng
    };
  }, [donorPos, recipientPos, progress, donor, recipient]);

  // Real-time telemetry calculations
  const remainingKm = Math.max(0, Math.round(distanceKm * (1 - progress / 100)));
  const remainingHours = (remainingKm / 65).toFixed(1);
  const coldChainTemp = (3.6 + Math.sin((progress / 100) * Math.PI * 4) * 0.3).toFixed(1);

  // Play simulation ticker
  useEffect(() => {
    let interval = null;
    if (isPlaying && progress < 100) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return Math.min(100, prev + 10);
        });
      }, 600);
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress]);

  const handleTogglePlay = () => {
    if (progress >= 100) {
      setProgress(10);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setProgress(5);
  };

  const handleFastForward = () => {
    setProgress((prev) => Math.min(100, prev + 25));
  };

  // Query Gemini AI reasoning for this specific redistribution pair
  useEffect(() => {
    let isMounted = true;
    async function loadAiReasoning() {
      if (!donor?.name || !recipient?.name) return;
      setLoadingAiExplain(true);
      try {
        const res = await explainRedistribution({
          targetHospital: recipient.name,
          targetStock: initialData.current_stock || 12,
          dailyUsage: initialData.daily_usage || 6,
          daysLeft: initialData.days_left || 2,
          sourceHospital: donor.name,
          sourceStock: initialData.donor_stock || 140,
          expiryDays: initialData.expiry_days || 45,
          medicine: selectedMedName,
          transferQty,
        });
        if (isMounted && res.explanation) {
          setAiExplanation(res.explanation);
        }
      } catch {
        if (isMounted) {
          setAiExplanation(`Reallocating ${transferQty} units of ${selectedMedName} from ${donor.name} to ${recipient.name} prevents imminent stockout exhaustion while preventing shelf-life expiration.`);
        }
      } finally {
        if (isMounted) setLoadingAiExplain(false);
      }
    }
    loadAiReasoning();
    return () => { isMounted = false; };
  }, [donor?.name, recipient?.name, selectedMedName, transferQty, initialData]);

  const handleCompleteDispatch = () => {

    setProgress(100);
    setIsPlaying(false);
    if (onComplete) {
      onComplete({
        donor,
        recipient,
        medicine: selectedMedName,
        quantity: transferQty,
        trackingId,
        distanceKm,
      });
    }
  };

  return (
    <div className="dispatch-sim-overlay" role="dialog" aria-modal="true">
      <div className="dispatch-sim-modal">
        {/* Modal Header */}
        <div className="sim-modal-header">
          <div className="sim-header-title-group">
            <div className="sim-header-icon-badge">
              <Truck size={22} className="sim-header-icon" />
            </div>
            <div>
              <div className="sim-header-tagline">
                <span className="live-dot" /> LIVE DISPATCH SIMULATION &amp; GEODESIC ROUTING
              </div>
              <h2 className="sim-header-title">
                {donor?.name?.split(' ')?.[0]} <ArrowRight size={15} className="inline-arrow" /> {recipient?.name?.split(' ')?.[0]} Corridor
              </h2>
            </div>
          </div>

          <div className="sim-header-right">
            <div className="tracking-code-badge">
              <Radio size={13} className="telemetry-pulse" />
              <span>{trackingId}</span>
            </div>
            <button className="sim-close-btn" onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="sim-modal-body">
          {/* Real Supabase Corridor Selectors */}
          <div className="sim-controls-panel">
            <div className="sim-form-group">
              <label className="sim-label">
                <Building2 size={13} color="#166534" /> Donor Hospital
              </label>
              <select
                className="sim-select"
                value={selectedDonorId}
                onChange={(e) => {
                  setSelectedDonorId(Number(e.target.value));
                  setProgress(10);
                }}
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    Node #{h.id}: {h.name} ({h.address?.split(', ')?.[1] || 'Hub'}) · {h.patient_capacity || 500} Beds
                  </option>
                ))}
              </select>
            </div>

            <div className="sim-form-group">
              <label className="sim-label">
                <MapPin size={13} color="#2563EB" /> Recipient Hospital
              </label>
              <select
                className="sim-select"
                value={selectedRecipientId}
                onChange={(e) => {
                  setSelectedRecipientId(Number(e.target.value));
                  setProgress(10);
                }}
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    Node #{h.id}: {h.name} ({h.address?.split(', ')?.[1] || 'Hub'}) · {h.patient_capacity || 300} Beds
                  </option>
                ))}
              </select>
            </div>

            <div className="sim-form-group med-col">
              <label className="sim-label">
                <Activity size={13} color="#D97706" /> Medicine &amp; Cargo
              </label>
              <select
                className="sim-select"
                value={selectedMedName}
                onChange={(e) => setSelectedMedName(e.target.value)}
              >
                {medicines.length > 0 ? (
                  medicines.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.category})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Amoxicillin 500mg">Amoxicillin 500mg (Antibiotics)</option>
                    <option value="Ceftriaxone 1g Injection">Ceftriaxone 1g Injection (Injectables)</option>
                    <option value="Salbutamol 100mcg Inhaler">Salbutamol 100mcg (Respiratory)</option>
                    <option value="Paracetamol 650mg">Paracetamol 650mg (Analgesic)</option>
                    <option value="Meropenem 1g IV">Meropenem 1g IV (Critical Care)</option>
                  </>
                )}
              </select>
            </div>

            <div className="sim-form-group qty-col">
              <label className="sim-label">Units</label>
              <input
                type="number"
                min="10"
                max="5000"
                step="10"
                className="sim-input"
                value={transferQty}
                onChange={(e) => setTransferQty(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Gemini AI Clinical Redistribution Reasoning */}
          <div className="sim-ai-reasoning-card">
            <div className="sim-ai-reasoning-header">
              <div className="sim-ai-title-left">
                <Sparkles size={15} className="sim-sparkle-spin" />
                <span className="sim-ai-title">Gemini Supply Intelligence Reasoning</span>
              </div>
              <span className="sim-ai-model-tag">Gemini 3.8 Flash • RAG</span>
            </div>
            <p className="sim-ai-text">
              {loadingAiExplain ? (
                <span className="sim-ai-loading">
                  <span className="sim-inline-dot" /> Synthesizing clinical redistribution rationale across facilities...
                </span>
              ) : (
                aiExplanation || 'Analyzing regional hospital demand and inventory expiration horizons...'
              )}
            </p>
          </div>

          {/* Interactive Geographic India SVG Map Visualizer */}
          <div className="sim-gis-map-card">

            {/* Real GIS Telemetry Overlay Top */}
            <div className="map-hud-top">
              <div className="hud-pill cold-chain">
                <Thermometer size={13} />
                <span>Cold-Chain: <strong>{coldChainTemp}°C</strong> (Nominal 2-8°C)</span>
              </div>
              <div className="hud-pill transit-telemetry">
                <Navigation size={13} />
                <span>GPS: <strong>{currentLat}°N, {currentLng}°E</strong></span>
              </div>
              <div className="hud-pill speed-telemetry">
                <Truck size={13} />
                <span>Speed: <strong>72 km/h</strong></span>
              </div>
            </div>

            <svg viewBox="0 0 620 270" className="sim-svg-viewport" preserveAspectRatio="xMidYMid meet">
              <defs>
                <pattern id="simMapGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#D3DFCE" strokeWidth="0.8" opacity="0.5" />
                </pattern>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#16A34A" />
                  <stop offset="50%" stopColor="#D97706" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
                <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Geo Background Grid */}
              <rect width="100%" height="100%" fill="#F2F6F1" />
              <rect width="100%" height="100%" fill="url(#simMapGrid)" />

              {/* Faint Background Network Lines between all Supabase Hospitals */}
              {hospitals.map((hA, i) => {
                const pA = projectIndiaGeoToSvg(parseFloat(hA.latitude), parseFloat(hA.longitude));
                return hospitals.slice(i + 1).map((hB) => {
                  const pB = projectIndiaGeoToSvg(parseFloat(hB.latitude), parseFloat(hB.longitude));
                  return (
                    <line
                      key={`bgmesh-${hA.id}-${hB.id}`}
                      x1={pA.x}
                      y1={pA.y}
                      x2={pB.x}
                      y2={pB.y}
                      stroke="#CBD5E1"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      opacity="0.5"
                    />
                  );
                });
              })}

              {/* Active Route Baseline */}
              <path
                d={pathD}
                fill="none"
                stroke="#94A3B8"
                strokeWidth="4"
                strokeDasharray="6 6"
                opacity="0.6"
              />

              {/* Active Route Animated Flow */}
              <path
                d={pathD}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="5"
                strokeDasharray="8 6"
                className="sim-animated-path"
              />

              {/* All Supabase Hospital Nodes */}
              {hospitals.map((h) => {
                const pos = projectIndiaGeoToSvg(parseFloat(h.latitude), parseFloat(h.longitude));
                const isDonor = h.id === donor.id;
                const isRecipient = h.id === recipient.id;

                if (isDonor || isRecipient) return null; // rendered separately on top

                return (
                  <g key={`node-${h.id}`} transform={`translate(${pos.x}, ${pos.y})`} className="passive-node">
                    <circle r="6" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
                    <text x="0" y="16" fontSize="9" fontWeight="600" fill="#64748B" textAnchor="middle">
                      {h.name?.split(' ')?.[0]}
                    </text>
                  </g>
                );
              })}

              {/* Donor Supabase Hospital Node */}
              <g transform={`translate(${donorPos.x}, ${donorPos.y})`} className="donor-node-group">
                <circle r="22" fill="#DCFCE7" opacity="0.6" className="pulse-ring-green" />
                <circle r="15" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2.5" filter="url(#nodeGlow)" />
                <Building2 size={14} color="#FFFFFF" x="-7" y="-7" />
                <g transform="translate(0, 26)">
                  <rect x="-65" y="0" width="130" height="18" rx="5" fill="#14532D" opacity="0.9" />
                  <text x="0" y="12" fontSize="9.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
                    Origin: {donor?.name?.split(' ')?.[0]}
                  </text>
                </g>
              </g>

              {/* Recipient Supabase Hospital Node */}
              <g transform={`translate(${recipientPos.x}, ${recipientPos.y})`} className="recipient-node-group">
                <circle r="22" fill="#DBEAFE" opacity="0.6" className="pulse-ring-blue" />
                <circle r="15" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" filter="url(#nodeGlow)" />
                <MapPin size={14} color="#FFFFFF" x="-7" y="-7" />
                <g transform="translate(0, 26)">
                  <rect x="-65" y="0" width="130" height="18" rx="5" fill="#1E3A8A" opacity="0.9" />
                  <text x="0" y="12" fontSize="9.5" fontWeight="700" fill="#FFFFFF" textAnchor="middle">
                    Dest: {recipient?.name?.split(' ')?.[0]}
                  </text>
                </g>
              </g>

              {/* Moving Delivery Truck along Quadratic Bezier */}
              <g transform={`translate(${truckPos.x}, ${truckPos.y})`} className="moving-vehicle-group">
                <circle r="18" fill="#1F4D3A" stroke="#FDE047" strokeWidth="2" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.35))" />
                <Truck size={16} color="#FFFFFF" x="-8" y="-8" />
              </g>
            </svg>

            {/* Bottom Status Ribbon */}
            <div className="map-hud-bottom">
              <div className="hud-metric">
                <span className="hud-label">TOTAL DISTANCE</span>
                <span className="hud-value font-mono">{distanceKm.toLocaleString()} KM</span>
              </div>
              <div className="hud-metric">
                <span className="hud-label">EST. TRANSIT</span>
                <span className="hud-value font-mono">~{estHours} HRS</span>
              </div>
              <div className="hud-metric">
                <span className="hud-label">REMAINING TO DOCK</span>
                <span className="hud-value font-mono" style={{ color: progress >= 100 ? '#15803D' : '#D97706' }}>
                  {remainingKm} KM ({remainingHours}h)
                </span>
              </div>
              <div className="hud-metric right-status">
                <span className="hud-label">STATUS</span>
                <span className="hud-value" style={{ color: progress >= 100 ? '#15803D' : '#B45309' }}>
                  {progress >= 100 ? '✅ DELIVERED & INGESTED' : `IN-FLIGHT (${progress}%)`}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar & Step Slider */}
          <div className="sim-progress-container">
            <div className="sim-progress-header">
              <span className="progress-title">Dispatch Corridor Progression</span>
              <span className="progress-percentage font-mono">{progress}% COMPLETED</span>
            </div>
            <div className="sim-progress-track">
              <div 
                className="sim-progress-fill" 
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: progress >= 100 ? '#16A34A' : '#1F4D3A' 
                }} 
              />
            </div>
          </div>

          {/* 4-Stage Clinical Verification Flow */}
          <div className="sim-stages-grid">
            <div className={`sim-stage-card ${progress >= 25 ? 'stage-active' : ''}`}>
              <CheckCircle2 size={16} className="stage-icon" />
              <div>
                <div className="stage-name">1. Warehouse Dispatch</div>
                <div className="stage-desc">Cold-chain logged, batch QA signed</div>
              </div>
            </div>

            <div className={`sim-stage-card ${progress >= 50 ? 'stage-active' : ''}`}>
              <CheckCircle2 size={16} className="stage-icon" />
              <div>
                <div className="stage-name">2. Highway Transit</div>
                <div className="stage-desc">GPS ping active, 3.7°C telemetry</div>
              </div>
            </div>

            <div className={`sim-stage-card ${progress >= 75 ? 'stage-active' : ''}`}>
              <CheckCircle2 size={16} className="stage-icon" />
              <div>
                <div className="stage-name">3. Dock Geofence</div>
                <div className="stage-desc">Approached hospital receiving bay</div>
              </div>
            </div>

            <div className={`sim-stage-card ${progress >= 100 ? 'stage-active' : ''}`}>
              <CheckCircle2 size={16} className="stage-icon" />
              <div>
                <div className="stage-name">4. Ingest &amp; Ward Refill</div>
                <div className="stage-desc">Stock updated and ward inventory refreshed</div>
              </div>
            </div>
          </div>

          {/* Action Button Strip */}
          <div className="sim-actions-strip">
            <button type="button" className="sim-btn-outline" onClick={onClose}>
              Close Tracker
            </button>

            <div className="sim-action-controls">
              <button 
                type="button" 
                className="sim-btn-sec" 
                onClick={handleReset} 
                title="Reset to Origin"
              >
                <RotateCcw size={15} />
                <span>Reset</span>
              </button>

              <button 
                type="button" 
                className={`sim-btn-play ${isPlaying ? 'is-playing' : ''}`}
                onClick={handleTogglePlay}
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                <span>{isPlaying ? 'Pause Transit' : progress >= 100 ? 'Replay Simulation' : '▶️ Step-by-Step Transit'}</span>
              </button>

              <button 
                type="button" 
                className="sim-btn-sec" 
                onClick={handleFastForward}
                disabled={progress >= 100}
                title="Fast Forward +25%"
              >
                <FastForward size={15} />
                <span>+25%</span>
              </button>

              <button 
                type="button" 
                className="sim-btn-primary" 
                onClick={handleCompleteDispatch}
              >
                <Check size={16} />
                <span>Instant Ingest &amp; Complete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
