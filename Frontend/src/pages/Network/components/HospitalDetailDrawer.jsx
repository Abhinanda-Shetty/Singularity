import {
  X, MapPin, Phone, UserCheck, Truck, CheckCircle2
} from 'lucide-react';
import { STATUS_THEMES } from '../utils/leafletIcons';

export default function HospitalDetailDrawer({
  selectedHospital,
  selectedTransfer,
  onClose,
  transfers = [],
  hospitals = [],
  onSelectHospital
}) {
  if (!selectedHospital && !selectedTransfer) return null;

  // ─────────────────────────────────────────────────────────────
  // Transfer Detail View
  // ─────────────────────────────────────────────────────────────
  if (selectedTransfer) {
    const priorityColors = {
      CRITICAL: '#DC2626',
      HIGH:     '#F59E0B',
      MEDIUM:   '#10B981'
    };
    const accent = priorityColors[selectedTransfer.priority] || '#1F4D3A';

    const donorHospital = hospitals.find(h => h.id === selectedTransfer.donorHospitalId);
    const recipientHospital = hospitals.find(h => h.id === selectedTransfer.recipientHospitalId);

    return (
      <div className="network-side-drawer">
        <div className="drawer-header">
          <div className="drawer-header-left">
            <span style={{
              background: accent,
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              {selectedTransfer.priority}
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1F2A24' }}>
              Transfer {selectedTransfer.id}
            </span>
          </div>
          <button type="button" className="drawer-close-btn" onClick={onClose} aria-label="Close transfer inspector">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Status banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#EDF7EE',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid #DDE8DA'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={18} style={{ color: '#16A34A' }} />
              <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#1F4D3A' }}>
                Status: {selectedTransfer.status}
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#66736B' }}>
              ETA {selectedTransfer.eta}
            </span>
          </div>

          {/* Transfer Corridor Diagram */}
          <div className="transfer-flow-diagram">
            <div
              className="flow-node"
              onClick={() => donorHospital && onSelectHospital(donorHospital)}
              style={{ cursor: donorHospital ? 'pointer' : 'default' }}
              title={donorHospital ? 'Inspect donor hospital' : ''}
            >
              <div className="flow-node-badge donor">C</div>
              <div className="flow-node-info">
                <span className="flow-node-name">{selectedTransfer.donorHospitalName}</span>
                <span className="flow-node-role">Donor Facility (Surplus Batch) ➔</span>
              </div>
            </div>

            <div className="flow-divider">
              <div className="flow-line" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                {selectedTransfer.quantity} units {selectedTransfer.medicine}
              </span>
              <div className="flow-line" />
            </div>

            <div
              className="flow-node"
              onClick={() => recipientHospital && onSelectHospital(recipientHospital)}
              style={{ cursor: recipientHospital ? 'pointer' : 'default' }}
              title={recipientHospital ? 'Inspect recipient hospital' : ''}
            >
              <div className="flow-node-badge recipient">A</div>
              <div className="flow-node-info">
                <span className="flow-node-name">{selectedTransfer.recipientHospitalName}</span>
                <span className="flow-node-role">Recipient Facility (Imminent Depletion) ➔</span>
              </div>
            </div>
          </div>

          {/* Logistics telemetry */}
          <div className="card-details-grid">
            <div className="spec-cell">
              <span className="spec-title">Road Transit Distance</span>
              <span className="spec-val">{selectedTransfer.distance}</span>
            </div>
            <div className="spec-cell">
              <span className="spec-title">Estimated Travel Time</span>
              <span className="spec-val">{selectedTransfer.eta}</span>
            </div>
            <div className="spec-cell">
              <span className="spec-title">Medicine SKU</span>
              <span className="spec-val">{selectedTransfer.medicine}</span>
            </div>
            <div className="spec-cell">
              <span className="spec-title">Allocation Units</span>
              <span className="spec-val" style={{ color: '#1F4D3A' }}>
                {selectedTransfer.quantity} {selectedTransfer.unit}
              </span>
            </div>
          </div>

          {/* Rationale */}
          <div className="transfer-rationale-box">
            <strong style={{ display: 'block', marginBottom: '4px' }}>AI Balancing Rationale:</strong>
            {selectedTransfer.rationale}
          </div>

          {/* Confirmation Notice */}
          <div style={{
            background: '#F8FAF7',
            border: '1px solid #E3EDE0',
            borderRadius: '10px',
            padding: '12px',
            fontSize: '0.78rem',
            color: '#66736B',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
            <span>Optimal transfer calculated by BackendAI. Ready for clinical dispatch.</span>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Hospital Detail View
  // ─────────────────────────────────────────────────────────────
  const h = selectedHospital;
  const theme = STATUS_THEMES[h.status] || STATUS_THEMES.healthy;

  // Find incoming & outgoing transfers for this hospital
  const incoming = transfers.filter(t => t.recipientHospitalId === h.id);
  const outgoing = transfers.filter(t => t.donorHospitalId === h.id);

  return (
    <div className="network-side-drawer">
      {/* Drawer Header */}
      <div className="drawer-header">
        <div className="drawer-header-left">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: theme.color,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.85rem'
          }}>
            {h.code || 'H'}
          </div>
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1F2A24', lineHeight: 1.2 }}>
              {h.name}
            </h4>
            <span style={{ fontSize: '0.72rem', color: '#66736B' }}>{h.type}</span>
          </div>
        </div>
        <button type="button" className="drawer-close-btn" onClick={onClose} aria-label="Close hospital inspector">
          <X size={18} />
        </button>
      </div>

      <div className="drawer-body">
        {/* Status & Risk Pill Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className={`popup-status-badge ${h.status}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
            {theme.label}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: h.riskLevel === 'CRITICAL' ? '#DC2626' : h.riskLevel === 'HIGH' ? '#B45309' : '#15803D'
          }}>
            Risk: {h.riskLevel}
          </span>
        </div>

        {/* Capacity / Bed Occupancy */}
        <div className="card-capacity-bar-wrap" style={{ background: '#F8FAF7', padding: '12px', borderRadius: '10px', border: '1px solid #EEF3EA' }}>
          <div className="capacity-meta-row">
            <span style={{ fontWeight: 600 }}>Clinical Bed Occupancy</span>
            <span style={{ fontWeight: 700, color: '#1F2A24' }}>
              {h.patientLoad} / {h.patientCapacity} beds ({h.occupancyRate}%)
            </span>
          </div>
          <div className="capacity-progress-track">
            <div
              className="capacity-progress-fill"
              style={{
                width: `${Math.min(h.occupancyRate, 100)}%`,
                background: h.occupancyRate > 85 ? '#DC2626' : h.occupancyRate > 75 ? '#F59E0B' : '#1F4D3A'
              }}
            />
          </div>
        </div>

        {/* Stockout Timeline */}
        <div className="card-details-grid">
          <div className="spec-cell">
            <span className="spec-title">Days to Stockout</span>
            <span className="spec-val" style={{ color: h.daysToStockout <= 3 ? '#DC2626' : '#1F2A24' }}>
              {h.daysToStockout} days
            </span>
          </div>
          <div className="spec-cell">
            <span className="spec-title">Surplus Reserve</span>
            <span className="spec-val" style={{ color: h.surplusUnits > 0 ? '#2563EB' : '#66736B' }}>
              {h.surplusUnits > 0 ? `${h.surplusUnits.toLocaleString()} units` : '0 units'}
            </span>
          </div>
        </div>

        {/* Critical Medicine Shortages */}
        {h.criticalMedicines.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Critical Medicine Shortages
            </span>
            {h.criticalMedicines.map((m) => (
              <div key={m.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '8px',
                background: '#FDF2F2',
                border: '1px solid #FEE2E2',
                fontSize: '0.78rem'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#991B1B' }}>{m.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#B91C1C' }}>
                    Stock: {m.currentStock} units (Safety: {m.safetyStock})
                  </div>
                </div>
                <span style={{
                  background: '#DC2626',
                  color: '#fff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {m.daysLeft}d left
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Surplus Medicines */}
        {h.surplusMedicines.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Available Donor Batches
            </span>
            {h.surplusMedicines.map((m) => (
              <div key={m.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '8px',
                background: '#EFF6FF',
                border: '1px solid #DBEAFE',
                fontSize: '0.78rem'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#1E40AF' }}>{m.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#3B82F6' }}>
                    Surplus: +{m.surplusQuantity} units
                  </div>
                </div>
                <span style={{
                  background: '#2563EB',
                  color: '#fff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {m.daysToExpiry}d expiry
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Transfer Links */}
        {(incoming.length > 0 || outgoing.length > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1F4D3A', textTransform: 'uppercase' }}>
              Network Transfer Dispatches
            </span>
            {incoming.map((t) => (
              <div key={t.id} style={{
                padding: '8px 10px',
                borderRadius: '8px',
                background: '#F0FDF4',
                border: '1px solid #DCFCE7',
                fontSize: '0.76rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: '#166534' }}>
                    ↓ Receiving {t.quantity} {t.unit} {t.medicine}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#15803D' }}>{t.eta}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#4ADE80', marginTop: '2px' }}>
                  Dispatched from {t.donorShortName}
                </div>
              </div>
            ))}

            {outgoing.map((t) => (
              <div key={t.id} style={{
                padding: '8px 10px',
                borderRadius: '8px',
                background: '#EFF6FF',
                border: '1px solid #DBEAFE',
                fontSize: '0.76rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: '#1E40AF' }}>
                    ↑ Donating {t.quantity} {t.unit} {t.medicine}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#2563EB' }}>{t.eta}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#60A5FA', marginTop: '2px' }}>
                  En route to {t.recipientShortName}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Location & Contact Info */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '0.78rem',
          color: '#66736B',
          paddingTop: '8px',
          borderTop: '1px solid #EEF3EA'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
            <MapPin size={14} style={{ color: '#8E9B93', marginTop: 2, flexShrink: 0 }} />
            <span>{h.address}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Phone size={14} style={{ color: '#8E9B93', flexShrink: 0 }} />
            <span>{h.phone}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCheck size={14} style={{ color: '#8E9B93', flexShrink: 0 }} />
            <span>{h.contactOfficer}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
