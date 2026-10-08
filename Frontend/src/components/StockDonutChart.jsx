import { useState } from 'react';
import { stockStatusData } from '../data/mockData';

/**
 * StockDonutChart
 * Accepts optional `inventoryRows` from the backend.
 * When real data is available, computes stock segments live.
 * Falls back to mockData when no data is passed.
 *
 * @param {{ inventoryRows?: object[], loading?: boolean }} props
 */
export default function StockDonutChart({ inventoryRows, loading }) {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // ── Derive segments from live inventory data when available ──────
  const computeSegments = () => {
    if (!inventoryRows || inventoryRows.length === 0) {
      // Fall back to mockData shape while loading or if data is empty
      return {
        segments: stockStatusData.segments,
        totalCount: stockStatusData.totalCount,
        totalLabel: stockStatusData.totalLabel,
      };
    }

    const total = inventoryRows.length;
    let inStock = 0;
    let lowStock = 0;
    let atRisk = 0;
    let expiringSoon = 0; // we don't have per-row expiry here, approximate as 0

    inventoryRows.forEach((row) => {
      const qty = parseFloat(row.quantity || 0);
      const safety = parseFloat(row.safety_stock || 0);
      if (qty <= safety) {
        atRisk += 1;
      } else if (qty <= safety * 1.5) {
        lowStock += 1;
      } else {
        inStock += 1;
      }
    });

    const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);

    return {
      totalCount: total,
      totalLabel: 'Inventory rows',
      segments: [
        { label: 'In stock', count: inStock, percentage: pct(inStock), color: '#1F4D3A' },
        { label: 'Low stock', count: lowStock, percentage: pct(lowStock), color: '#EAB308' },
        { label: 'At risk', count: atRisk, percentage: pct(atRisk), color: '#E04A4A' },
        { label: 'Expiring soon', count: expiringSoon, percentage: pct(expiringSoon), color: '#95BE9E' },
      ],
    };
  };

  const { segments, totalCount, totalLabel } = computeSegments();

  // Donut SVG parameters
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate cumulative dash offsets in a plain function (avoids reassignment-after-render lint)
  const buildRenderedSegments = () => {
    let acc = 0;
    return segments.map((seg) => {
      const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((acc / 100) * circumference);
      acc += seg.percentage;
      return { ...seg, strokeDasharray, strokeDashoffset };
    });
  };
  const renderedSegments = buildRenderedSegments();

  return (
    <div className="analysis-card">
      <div className="analysis-header" style={{ marginBottom: '12px' }}>
        <div className="analysis-title-group">
          <h2>Medicine stock status</h2>
          <p>
            {loading
              ? 'Loading live inventory data…'
              : inventoryRows?.length
                ? 'Live distribution from your inventory records'
                : 'Overall distribution of medicine stock'}
          </p>
        </div>
      </div>

      <div className="donut-card-body">
        {/* SVG Donut Visual */}
        <div className="donut-visual-wrap">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ transform: 'rotate(-90deg)' }}
          >
            {renderedSegments.map((seg, idx) => {
              const isHovered = hoveredSegment === seg.label;
              return (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="butt"
                  style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredSegment(seg.label)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              );
            })}
          </svg>

          {/* Center Info */}
          <div className="donut-center-info">
            <span className="donut-total-count">{loading ? '…' : totalCount}</span>
            <span className="donut-total-label">{totalLabel}</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="donut-legend-list">
          {segments.map((seg, idx) => {
            const isHovered = hoveredSegment === seg.label;
            return (
              <div
                key={idx}
                className="donut-legend-item"
                style={{
                  opacity: hoveredSegment && !isHovered ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredSegment(seg.label)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <div className="donut-legend-left">
                  <span className="legend-dot" style={{ backgroundColor: seg.color }} />
                  <span>{seg.label}</span>
                </div>
                <div className="donut-legend-right">
                  <span className="legend-count">{loading ? '—' : seg.count}</span>
                  <span className="legend-pct">{loading ? '—' : `${seg.percentage}%`}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
