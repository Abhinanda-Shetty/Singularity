import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function MapLegend() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="network-map-legend">
      <div className="legend-header">
        <span className="legend-title">Grid Status Legend</span>
        <button
          type="button"
          className="legend-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand legend" : "Collapse legend"}
        >
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {!collapsed && (
        <div className="legend-items-list">
          <div className="legend-item-row">
            <span className="legend-icon-badge healthy" />
            <span style={{ fontWeight: 600 }}>Healthy Stock</span>
            <span className="legend-item-desc">&gt; 14 days buffer</span>
          </div>

          <div className="legend-item-row">
            <span className="legend-icon-badge low_stock" />
            <span style={{ fontWeight: 600 }}>Low Stock</span>
            <span className="legend-item-desc">3–7 days buffer</span>
          </div>

          <div className="legend-item-row">
            <span className="legend-icon-badge critical" />
            <span style={{ fontWeight: 600 }}>Critical Shortage</span>
            <span className="legend-item-desc">&lt; 3 days stockout</span>
          </div>

          <div className="legend-item-row">
            <span className="legend-icon-badge surplus" />
            <span style={{ fontWeight: 600 }}>Surplus / Donor</span>
            <span className="legend-item-desc">Available for rebalance</span>
          </div>

          <div className="legend-item-row" style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #EEF3EA' }}>
            <span className="legend-route-line" />
            <span style={{ fontWeight: 600 }}>Recommended Transfer</span>
            <span className="legend-item-desc">AI route proposal</span>
          </div>
        </div>
      )}
    </div>
  );
}
