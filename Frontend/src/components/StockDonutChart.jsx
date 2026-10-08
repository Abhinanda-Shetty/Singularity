import React, { useState } from 'react';
import { stockStatusData } from '../data/mockData';

export default function StockDonutChart() {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // Donut SVG parameters
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2; // radius ~68
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate cumulative dash offsets
  let accumulatedPercent = 0;
  const renderedSegments = stockStatusData.segments.map((seg) => {
    const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
    // Start from top (-90 degrees)
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += seg.percentage;

    return {
      ...seg,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="analysis-card">
      <div className="analysis-header" style={{ marginBottom: '12px' }}>
        <div className="analysis-title-group">
          <h2>{stockStatusData.title}</h2>
          <p>{stockStatusData.subtitle}</p>
        </div>
      </div>

      <div className="donut-card-body">
        {/* SVG Donut Visual with Center Metric */}
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
                  style={{
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setHoveredSegment(seg.label)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              );
            })}
          </svg>

          {/* Center Info */}
          <div className="donut-center-info">
            <span className="donut-total-count">{stockStatusData.totalCount}</span>
            <span className="donut-total-label">{stockStatusData.totalLabel}</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="donut-legend-list">
          {stockStatusData.segments.map((seg, idx) => {
            const isHovered = hoveredSegment === seg.label;
            return (
              <div 
                key={idx} 
                className="donut-legend-item"
                style={{
                  opacity: hoveredSegment && !isHovered ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredSegment(seg.label)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <div className="donut-legend-left">
                  <span
                    className="legend-dot"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span>{seg.label}</span>
                </div>

                <div className="donut-legend-right">
                  <span className="legend-count">{seg.count}</span>
                  <span className="legend-pct">{seg.percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
