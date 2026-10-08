import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { demandChartData } from '../data/mockData';

export default function DemandChart() {
  const [selectedRange, setSelectedRange] = useState('Last 14 days');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Chart dimensions & layout coordinates
  // SVG viewBox: 0 0 680 250
  // Left padding for Y-axis: 48, Right padding: 24, Top padding: 20, Bottom padding: 36
  const width = 680;
  const height = 230;
  const paddingLeft = 52;
  const paddingRight = 24;
  const paddingTop = 16;
  const paddingBottom = 32;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const yTicks = [2000, 1500, 1000, 500, 0];
  const maxY = 2000;

  const getYCoord = (val) => paddingTop + chartHeight - (val / maxY) * chartHeight;
  const getXCoord = (ratio) => paddingLeft + ratio * chartWidth;

  // Actual demand data points across 14-day timeline (Oct 1 to Oct 8)
  const actualPoints = [
    { label: 'Oct 1', date: 'Oct 1', val: 420, ratio: 0 / 13 },
    { label: 'Oct 3', date: 'Oct 3', val: 590, ratio: 2 / 13 },
    { label: 'Oct 5', date: 'Oct 5', val: 880, ratio: 4 / 13 },
    { label: 'Oct 7', date: 'Oct 7', val: 740, ratio: 6 / 13 },
    { label: 'Oct 8', date: 'Oct 8', val: 1100, ratio: 7.2 / 13 },
  ];

  // Predicted demand line points across full timeline (Oct 1 to Oct 14)
  const predictedPoints = [
    { date: 'Oct 1', val: 400, ratio: 0 / 13 },
    { date: 'Oct 3', val: 560, ratio: 2 / 13 },
    { date: 'Oct 5', val: 760, ratio: 4 / 13 },
    { date: 'Oct 7', val: 980, ratio: 6 / 13 },
    { date: 'Oct 9', val: 1220, ratio: 8 / 13 },
    { date: 'Oct 11', val: 1410, ratio: 10 / 13 },
    { date: 'Oct 13', val: 1540, ratio: 12 / 13 },
    { date: 'Oct 14', val: 1620, ratio: 13 / 13 },
  ];

  // Build smooth curve path for actual points
  const buildSmoothCurve = (pts) => {
    if (pts.length === 0) return '';
    const coords = pts.map(p => ({ x: getXCoord(p.ratio), y: getYCoord(p.val) }));
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2 < coords.length ? i + 2 : coords.length - 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const actualCurvePath = buildSmoothCurve(actualPoints);
  const predictedCurvePath = buildSmoothCurve(predictedPoints);

  // Area path for actual data (closed down to bottom y-axis)
  const lastActualCoord = {
    x: getXCoord(actualPoints[actualPoints.length - 1].ratio),
    y: getYCoord(actualPoints[actualPoints.length - 1].val)
  };
  const firstActualCoord = {
    x: getXCoord(actualPoints[0].ratio),
    y: getYCoord(actualPoints[0].val)
  };
  const zeroY = getYCoord(0);

  const actualAreaPath = `${actualCurvePath} L ${lastActualCoord.x.toFixed(1)} ${zeroY} L ${firstActualCoord.x.toFixed(1)} ${zeroY} Z`;

  // X Axis markers matching reference: Oct 1, Oct 3, Oct 5, Oct 7, Oct 9, Oct 11, Oct 13, Oct 14
  const xMarkers = [
    { label: 'Oct 1', ratio: 0 / 13 },
    { label: 'Oct 3', ratio: 2 / 13 },
    { label: 'Oct 5', ratio: 4 / 13 },
    { label: 'Oct 7', ratio: 6 / 13 },
    { label: 'Oct 9', ratio: 8 / 13 },
    { label: 'Oct 11', ratio: 10 / 13 },
    { label: 'Oct 13', ratio: 12 / 13 },
    { label: 'Oct 14', ratio: 13 / 13 },
  ];

  return (
    <div className="analysis-card">
      <div className="analysis-header">
        <div className="analysis-title-group">
          <h2>{demandChartData.title}</h2>
          <p>{demandChartData.subtitle}</p>
        </div>

        {/* Time Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <button 
            className="time-range-pill"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            type="button"
          >
            <Calendar size={14} strokeWidth={2.2} color="#1F4D3A" />
            <span>{selectedRange}</span>
            <ChevronDown size={14} />
          </button>

          {dropdownOpen && (
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                background: '#FFFFFF',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #E3EDE0',
                zIndex: 20,
                minWidth: '120px',
                overflow: 'hidden'
              }}
            >
              {demandChartData.timeRangeOptions.map((opt) => (
                <div
                  key={opt}
                  onClick={() => {
                    setSelectedRange(opt);
                    setDropdownOpen(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    color: selectedRange === opt ? '#1F4D3A' : '#1F2A24',
                    fontWeight: selectedRange === opt ? 700 : 500,
                    background: selectedRange === opt ? '#EEF5ED' : 'transparent',
                  }}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SVG Chart Area */}
      <div style={{ position: 'relative', width: '100%', overflow: 'visible' }}>
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <defs>
            {/* Soft sage gradient fill under actual curve */}
            <linearGradient id="actualAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1F4D3A" stopOpacity="0.22" />
              <stop offset="70%" stopColor="#81B29A" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#DDE8DA" stopOpacity="0.01" />
            </linearGradient>

            {/* Subtle soft backdrop for prediction projection */}
            <linearGradient id="predictionAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A3C9A8" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Y Axis text label: Units */}
          <text
            x={12}
            y={height / 2}
            fill="#8E9B93"
            fontSize="10"
            fontWeight="500"
            textAnchor="middle"
            transform={`rotate(-90, 12, ${height / 2})`}
          >
            Units
          </text>

          {/* Horizontal Grid lines and Y labels */}
          {yTicks.map((tick) => {
            const y = getYCoord(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#EBF0E9"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#8E9B93"
                  fontSize="10"
                  fontFamily="inherit"
                  fontWeight="500"
                >
                  {tick.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Prediction subtle background fill under curve */}
          <path
            d={`${predictedCurvePath} L ${width - paddingRight} ${zeroY} L ${paddingLeft} ${zeroY} Z`}
            fill="url(#predictionAreaGrad)"
          />

          {/* Actual Demand Filled Area under curve */}
          <path
            d={actualAreaPath}
            fill="url(#actualAreaGradient)"
          />

          {/* Predicted Demand Line (Dashed) */}
          <path
            d={predictedCurvePath}
            stroke="#2B674E"
            strokeWidth="2.2"
            strokeDasharray="4 4"
            fill="none"
            strokeLinecap="round"
          />

          {/* Actual Demand Line (Solid) */}
          <path
            d={actualCurvePath}
            stroke="#1F4D3A"
            strokeWidth="2.8"
            fill="none"
            strokeLinecap="round"
          />

          {/* Actual Demand Points (Solid green dots with subtle hover ring) */}
          {actualPoints.map((pt, idx) => {
            const cx = getXCoord(pt.ratio);
            const cy = getYCoord(pt.val);
            const isHovered = hoveredPoint?.date === pt.date;

            return (
              <g 
                key={idx} 
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill="#1F4D3A"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                {/* Invisible larger hit target */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={12}
                  fill="transparent"
                />
              </g>
            );
          })}

          {/* X Axis Date labels */}
          {xMarkers.map((marker, idx) => {
            const x = getXCoord(marker.ratio);
            return (
              <text
                key={idx}
                x={x}
                y={height - 8}
                textAnchor="middle"
                fill="#8E9B93"
                fontSize="10.5"
                fontFamily="inherit"
                fontWeight="500"
              >
                {marker.label}
              </text>
            );
          })}
        </svg>

        {/* Interactive Hover Tooltip */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              left: `${(getXCoord(hoveredPoint.ratio) / width) * 100}%`,
              top: `${(getYCoord(hoveredPoint.val) / height) * 100}%`,
              transform: 'translate(-50%, -120%)',
              background: '#1F4D3A',
              color: '#FFFFFF',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              pointerEvents: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            {hoveredPoint.date}: {hoveredPoint.val} units
          </div>
        )}
      </div>

      {/* Legend below the chart */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '24px', 
          marginTop: '12px',
          paddingLeft: '48px',
          fontSize: '0.76rem',
          color: '#1F2A24'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span 
            style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: '#1F4D3A', 
              display: 'inline-block' 
            }} 
          />
          <span style={{ fontWeight: 600 }}>Actual demand</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span 
            style={{ 
              width: '16px', 
              height: '2px', 
              borderBottom: '2px dashed #2B674E', 
              display: 'inline-block' 
            }} 
          />
          <span style={{ color: '#4D6256', fontWeight: 500 }}>Predicted demand</span>
        </div>
      </div>
    </div>
  );
}
