import { MapPin, Users, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { STATUS_THEMES } from '../utils/leafletIcons';

export default function HospitalCardsGrid({
  hospitals,
  selectedHospital,
  onSelectHospital,
  onFocusMap
}) {
  return (
    <div className="network-cards-section">
      <div className="section-headline-row">
        <h3 className="section-title">Regional Facilities Overview</h3>
        <span style={{ fontSize: '0.84rem', color: '#66736B', fontWeight: 600 }}>
          {hospitals.length} facilities monitored
        </span>
      </div>

      <div className="network-cards-grid">
        {hospitals.map((h) => {
          const isSelected = selectedHospital?.id === h.id;
          const theme = STATUS_THEMES[h.status] || STATUS_THEMES.healthy;

          return (
            <div
              key={h.id}
              className={`hospital-overview-card ${isSelected ? 'is-selected' : ''}`}
              onClick={() => {
                onSelectHospital(h);
                onFocusMap(h);
              }}
              role="button"
              tabIndex={0}
            >
              {/* Top Row */}
              <div className="card-top-row">
                <div className="card-hospital-identity">
                  <div
                    className="card-icon-avatar"
                    style={{ background: theme.color }}
                  >
                    {h.code || h.name[0]}
                  </div>
                  <div className="card-name-wrap">
                    <h4 className="card-hospital-title">{h.name}</h4>
                    <span className="card-hospital-sub">{h.type}</span>
                  </div>
                </div>

                <span className={`popup-status-badge ${h.status}`}>
                  {theme.label}
                </span>
              </div>

              {/* Occupancy Bar */}
              <div className="card-capacity-bar-wrap">
                <div className="capacity-meta-row">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={12} />
                    <span>Bed Occupancy</span>
                  </span>
                  <span style={{ fontWeight: 700 }}>
                    {h.patientLoad} / {h.patientCapacity} ({h.occupancyRate}%)
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

              {/* Telemetry Metrics */}
              <div className="card-details-grid">
                <div className="spec-cell">
                  <span className="spec-title">Days to Stockout</span>
                  <span className="spec-val" style={{ color: h.daysToStockout <= 3 ? '#DC2626' : '#1F2A24' }}>
                    <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
                    {h.daysToStockout} days
                  </span>
                </div>
                <div className="spec-cell">
                  <span className="spec-title">Risk Priority</span>
                  <span className="spec-val" style={{ color: h.riskLevel === 'CRITICAL' ? '#DC2626' : '#1F2A24' }}>
                    <AlertTriangle size={11} style={{ display: 'inline', marginRight: 3 }} />
                    {h.riskLevel}
                  </span>
                </div>
              </div>

              {/* Critical or Surplus Highlights */}
              {h.criticalMedicines.length > 0 && (
                <div style={{
                  fontSize: '0.74rem',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: '#FDF2F2',
                  color: '#991B1B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontWeight: 600 }}>{h.criticalMedicines[0].name}</span>
                  <span style={{ fontWeight: 800 }}>{h.criticalMedicines[0].daysLeft}d left</span>
                </div>
              )}

              {h.surplusMedicines.length > 0 && (
                <div style={{
                  fontSize: '0.74rem',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: '#EFF6FF',
                  color: '#1E40AF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontWeight: 600 }}>{h.surplusMedicines[0].name}</span>
                  <span style={{ fontWeight: 800 }}>+{h.surplusMedicines[0].surplusQuantity} units</span>
                </div>
              )}

              {/* Bottom address */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.74rem',
                color: '#8E9B93',
                borderTop: '1px solid #EEF3EA',
                paddingTop: '8px',
                marginTop: 'auto'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <MapPin size={12} style={{ flexShrink: 0 }} />
                  {h.address.split(',')[1]?.trim() || h.address}
                </span>
                <span style={{ color: '#1F4D3A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                  Inspect <ArrowUpRight size={13} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
