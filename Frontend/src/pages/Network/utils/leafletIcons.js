import L from 'leaflet';

/**
 * Status color mappings conforming to MedSupply branding & requirements:
 * - Green = healthy stock
 * - Orange = low stock
 * - Red = critical shortage
 * - Blue = surplus/donor hospital
 */
export const STATUS_THEMES = {
  healthy: {
    label: 'Healthy Stock',
    color: '#2E7D52',
    bg: '#EDF7EE',
    border: '#1F4D3A',
    halo: 'rgba(46, 125, 82, 0.25)',
    textColor: '#1F4D3A'
  },
  low_stock: {
    label: 'Low Stock',
    color: '#F59E0B',
    bg: '#FEF9EC',
    border: '#D97706',
    halo: 'rgba(245, 158, 11, 0.3)',
    textColor: '#B45309'
  },
  critical: {
    label: 'Critical Shortage',
    color: '#DC2626',
    bg: '#FDF2F2',
    border: '#991B1B',
    halo: 'rgba(220, 38, 38, 0.35)',
    textColor: '#991B1B'
  },
  surplus: {
    label: 'Surplus Facility',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#1D4ED8',
    halo: 'rgba(37, 99, 235, 0.25)',
    textColor: '#1E40AF'
  }
};

/**
 * Creates a modern, SVG-powered Leaflet DivIcon.
 * Completely immune to asset bundling / missing PNG 404 bugs.
 */
export function createHospitalMarkerIcon(status = 'healthy', isSelected = false, code = '') {
  const theme = STATUS_THEMES[status] || STATUS_THEMES.healthy;
  const isCritical = status === 'critical';
  const size = isSelected ? 44 : 36;
  const half = size / 2;

  const pulseRing = isCritical
    ? `<div class="marker-pulse-ring" style="background-color: ${theme.halo};"></div>`
    : '';

  const selectionHalo = isSelected
    ? `<div class="marker-selection-ring"></div>`
    : '';

  const labelBadge = code
    ? `<div class="marker-code-badge" style="background-color: ${theme.color}">${code}</div>`
    : '';

  const html = `
    <div class="med-hospital-pin-wrapper ${status} ${isSelected ? 'is-selected' : ''}" style="width: ${size}px; height: ${size}px;">
      ${pulseRing}
      ${selectionHalo}
      <div class="med-hospital-pin" style="background: linear-gradient(135deg, ${theme.color}, ${theme.border});">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 6v12m-6-6h12"/>
        </svg>
      </div>
      ${labelBadge}
    </div>
  `;

  return L.divIcon({
    className: 'med-leaflet-div-icon',
    html,
    iconSize: [size, size],
    iconAnchor: [half, size],
    popupAnchor: [0, -size + 2]
  });
}

/**
 * Creates an interactive midpoint transfer route badge along the polyline.
 */
export function createTransferMidpointIcon(transfer, isHovered = false) {
  const priorityColors = {
    CRITICAL: { bg: '#DC2626', text: '#FFFFFF', border: '#991B1B' },
    HIGH:     { bg: '#F59E0B', text: '#FFFFFF', border: '#B45309' },
    MEDIUM:   { bg: '#10B981', text: '#FFFFFF', border: '#047857' }
  };

  const style = priorityColors[transfer.priority] || priorityColors.HIGH;

  const html = `
    <div class="med-transfer-midpoint-badge ${isHovered ? 'hovered' : ''}" style="border-left: 3px solid ${style.bg};">
      <div class="midpoint-top">
        <span class="midpoint-qty">${transfer.quantity} ${transfer.unit || 'units'}</span>
        <span class="midpoint-med">${transfer.medicine}</span>
      </div>
      <div class="midpoint-meta">
        <span>${transfer.distance}</span>
        <span class="midpoint-dot">•</span>
        <span>${transfer.eta}</span>
        <span class="midpoint-arrow">➔</span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'med-transfer-midpoint-wrapper',
    html,
    iconSize: [160, 42],
    iconAnchor: [80, 21],
    popupAnchor: [0, -22]
  });
}
