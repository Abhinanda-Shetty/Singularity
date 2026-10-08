import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createHospitalMarkerIcon, createTransferMidpointIcon, STATUS_THEMES } from '../utils/leafletIcons';
import MapLegend from './MapLegend';
import { AlertTriangle, Clock, Users, Package, ArrowRight, ExternalLink } from 'lucide-react';

/**
 * Controller component inside MapContainer to smoothly pan/zoom and resize.
 */
function MapController({
  hospitals,
  selectedHospital,
  selectedTransfer,
  resetTrigger
}) {
  const map = useMap();
  const hasFittedInitial = useRef(false);

  // Invalidate size on mount to eliminate Leaflet tile loading glitches
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  // Fit initial bounds to show all hospitals
  useEffect(() => {
    if (!hasFittedInitial.current && hospitals.length > 0) {
      const bounds = L.latLngBounds(hospitals.map(h => [h.latitude, h.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      hasFittedInitial.current = true;
    }
  }, [hospitals, map]);

  // Reset view when trigger changes
  useEffect(() => {
    if (resetTrigger && hospitals.length > 0) {
      const bounds = L.latLngBounds(hospitals.map(h => [h.latitude, h.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [resetTrigger, hospitals, map]);

  // Pan to selected hospital
  useEffect(() => {
    if (selectedHospital) {
      map.flyTo([selectedHospital.latitude, selectedHospital.longitude], 12.5, {
        duration: 0.9
      });
    }
  }, [selectedHospital, map]);

  // Zoom to selected transfer corridor
  useEffect(() => {
    if (selectedTransfer) {
      const bounds = L.latLngBounds([
        selectedTransfer.donorCoords,
        selectedTransfer.recipientCoords
      ]);
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 12 });
    }
  }, [selectedTransfer, map]);

  return null;
}

export default function HospitalMap({
  hospitals,
  filteredHospitals,
  transfers,
  showTransfers,
  selectedHospital,
  onSelectHospital,
  selectedTransfer,
  onSelectTransfer,
  resetTrigger,
  onFocusFacility
}) {
  const defaultCenter = [18.98, 73.20];
  const defaultZoom = 10;

  return (
    <div className="network-map-wrapper">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="leaflet-map-element"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />

        <MapController
          hospitals={hospitals}
          selectedHospital={selectedHospital}
          selectedTransfer={selectedTransfer}
          resetTrigger={resetTrigger}
        />

        {/* ─────────────────────────────────────────────────────────────
            Transfer Route Polylines
           ───────────────────────────────────────────────────────────── */}
        {showTransfers && transfers.map((transfer) => {
          const isSelected = selectedTransfer?.id === transfer.id;
          const priorityColors = {
            CRITICAL: '#DC2626',
            HIGH:     '#F59E0B',
            MEDIUM:   '#059669'
          };
          const strokeColor = priorityColors[transfer.priority] || '#1F4D3A';

          const midpoint = [
            (transfer.donorCoords[0] + transfer.recipientCoords[0]) / 2,
            (transfer.donorCoords[1] + transfer.recipientCoords[1]) / 2
          ];

          return (
            <div key={transfer.id}>
              {/* Outer halo line if selected */}
              {isSelected && (
                <Polyline
                  positions={[transfer.donorCoords, transfer.recipientCoords]}
                  pathOptions={{
                    color: strokeColor,
                    weight: 8,
                    opacity: 0.25,
                    lineCap: 'round'
                  }}
                />
              )}

              {/* Main dashed transfer line */}
              <Polyline
                positions={[transfer.donorCoords, transfer.recipientCoords]}
                pathOptions={{
                  color: strokeColor,
                  weight: isSelected ? 4.5 : 3.2,
                  dashArray: isSelected ? '6, 6' : '8, 8',
                  opacity: 0.88,
                  lineCap: 'round'
                }}
                eventHandlers={{
                  click: () => onSelectTransfer(transfer)
                }}
              />

              {/* Interactive Midpoint Pill Badge */}
              <Marker
                position={midpoint}
                icon={createTransferMidpointIcon(transfer, isSelected)}
                eventHandlers={{
                  click: () => onSelectTransfer(transfer)
                }}
              >
                <Popup>
                  <div className="transfer-popup-card">
                    <div className="transfer-popup-header">
                      <span className="transfer-badge-priority" style={{
                        background: strokeColor,
                        color: '#FFFFFF'
                      }}>
                        {transfer.priority} PRIORITY
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#66736B' }}>
                        {transfer.status}
                      </span>
                    </div>

                    <div className="transfer-flow-diagram">
                      <div className="flow-node">
                        <div className="flow-node-badge donor">C</div>
                        <div className="flow-node-info">
                          <span className="flow-node-name">{transfer.donorHospitalName}</span>
                          <span className="flow-node-role">Donor Facility (Surplus Available)</span>
                        </div>
                      </div>

                      <div className="flow-divider">
                        <div className="flow-line" />
                        <span>{transfer.quantity} {transfer.unit} • {transfer.distance} ({transfer.eta})</span>
                        <div className="flow-line" />
                      </div>

                      <div className="flow-node">
                        <div className="flow-node-badge recipient">A</div>
                        <div className="flow-node-info">
                          <span className="flow-node-name">{transfer.recipientHospitalName}</span>
                          <span className="flow-node-role">Recipient Facility (Critical Shortage)</span>
                        </div>
                      </div>
                    </div>

                    <div className="transfer-specs-table">
                      <div className="spec-cell">
                        <span className="spec-title">Medicine SKU</span>
                        <span className="spec-val">{transfer.medicine}</span>
                      </div>
                      <div className="spec-cell">
                        <span className="spec-title">Transfer Volume</span>
                        <span className="spec-val" style={{ color: '#1F4D3A' }}>
                          {transfer.quantity} {transfer.unit}
                        </span>
                      </div>
                      <div className="spec-cell">
                        <span className="spec-title">Road Distance</span>
                        <span className="spec-val">{transfer.distance}</span>
                      </div>
                      <div className="spec-cell">
                        <span className="spec-title">Transit Time (ETA)</span>
                        <span className="spec-val">{transfer.eta}</span>
                      </div>
                    </div>

                    <div className="transfer-rationale-box">
                      <strong>AI Dispatch Rationale:</strong> {transfer.rationale}
                    </div>

                    <button
                      type="button"
                      className="popup-action-btn"
                      onClick={() => onSelectTransfer(transfer)}
                    >
                      <ExternalLink size={14} />
                      View Full Transfer Specification
                    </button>
                  </div>
                </Popup>
              </Marker>
            </div>
          );
        })}

        {/* ─────────────────────────────────────────────────────────────
            Hospital Markers
           ───────────────────────────────────────────────────────────── */}
        {filteredHospitals.map((hospital) => {
          const isSelected = selectedHospital?.id === hospital.id;
          const icon = createHospitalMarkerIcon(hospital.status, isSelected, hospital.code);
          const theme = STATUS_THEMES[hospital.status] || STATUS_THEMES.healthy;

          return (
            <Marker
              key={hospital.id}
              position={[hospital.latitude, hospital.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectHospital(hospital)
              }}
            >
              <Popup>
                <div className="hospital-popup-card">
                  {/* Header */}
                  <div className="hospital-popup-header">
                    <div className="popup-title-area">
                      <h4 className="popup-hospital-name">{hospital.name}</h4>
                      <span className="popup-hospital-type">{hospital.type}</span>
                    </div>
                    <span className={`popup-status-badge ${hospital.status}`}>
                      {theme.label}
                    </span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="popup-metrics-grid">
                    <div className="popup-metric-item">
                      <span className="popup-metric-label">
                        <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
                        Days to Stockout
                      </span>
                      <span className={`popup-metric-val ${hospital.status === 'critical' ? 'critical-text' : ''}`}>
                        {hospital.daysToStockout} days
                      </span>
                    </div>

                    <div className="popup-metric-item">
                      <span className="popup-metric-label">
                        <Users size={11} style={{ display: 'inline', marginRight: 3 }} />
                        Patient Load
                      </span>
                      <span className="popup-metric-val">
                        {hospital.patientLoad} / {hospital.patientCapacity} ({hospital.occupancyRate}%)
                      </span>
                    </div>

                    <div className="popup-metric-item">
                      <span className="popup-metric-label">
                        <AlertTriangle size={11} style={{ display: 'inline', marginRight: 3 }} />
                        Risk Level
                      </span>
                      <span className={`popup-metric-val ${hospital.riskLevel === 'CRITICAL' ? 'critical-text' : ''}`}>
                        {hospital.riskLevel}
                      </span>
                    </div>

                    <div className="popup-metric-item">
                      <span className="popup-metric-label">
                        <Package size={11} style={{ display: 'inline', marginRight: 3 }} />
                        Surplus Units
                      </span>
                      <span className={`popup-metric-val ${hospital.surplusUnits > 0 ? 'surplus-text' : ''}`}>
                        {hospital.surplusUnits > 0 ? `${hospital.surplusUnits.toLocaleString()} units` : '0 units'}
                      </span>
                    </div>
                  </div>

                  {/* Critical Medicines Section */}
                  {hospital.criticalMedicines.length > 0 && (
                    <div className="popup-medicines-section">
                      <span className="popup-section-title" style={{ color: '#DC2626' }}>
                        Critical Shortages:
                      </span>
                      {hospital.criticalMedicines.map((med) => (
                        <div key={med.id} className="popup-medicine-item">
                          <span className="popup-med-name">{med.name}</span>
                          <span className="popup-med-badge critical">
                            {med.currentStock} left ({med.daysLeft}d)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Surplus Medicines Section */}
                  {hospital.surplusMedicines.length > 0 && (
                    <div className="popup-medicines-section">
                      <span className="popup-section-title" style={{ color: '#2563EB' }}>
                        Available Surplus Medicines:
                      </span>
                      {hospital.surplusMedicines.map((med) => (
                        <div key={med.id} className="popup-medicine-item">
                          <span className="popup-med-name">{med.name}</span>
                          <span className="popup-med-badge surplus">
                            +{med.surplusQuantity} units
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    type="button"
                    className="popup-action-btn"
                    onClick={() => onFocusFacility(hospital)}
                  >
                    <span>Inspect Facility Details</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Legend */}
      <MapLegend />
    </div>
  );
}
