import { useState, useEffect } from 'react';
import { Calendar, ChevronDown, Loader } from 'lucide-react';
import { fetchDemandHistory } from '../services/api';

export default function DemandChart() {
  const [selectedRange, setSelectedRange] = useState('Last 30 days');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [demandData, setDemandData] = useState([]);
  const [loading, setLoading] = useState(true);

  const timeRangeOptions = ['Last 7 days', 'Last 14 days', 'Last 30 days', 'Last 90 days'];

  // Compute date range from selectedRange
  const getDaysFromRange = (range) => {
    if (range === 'Last 7 days') return 7;
    if (range === 'Last 14 days') return 14;
    if (range === 'Last 30 days') return 30;
    return 90;
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const days = getDaysFromRange(selectedRange);
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);

        const startStr = start.toISOString().split('T')[0];
        const endStr   = end.toISOString().split('T')[0];

        const res = await fetchDemandHistory({
          hospital_id: 1,
          start_date: startStr,
          end_date: endStr,
          limit: 365,
        });

        if (!cancelled) {
          // Aggregate by date (sum consumption across all medicines for that date)
          const byDate = {};
          for (const row of (res.data || [])) {
            const d = row.date?.split('T')[0] || row.date;
            if (!byDate[d]) {
              byDate[d] = { date: d, consumption: 0, patient_load: 0, emergency_demand: 0 };
            }
            byDate[d].consumption      += parseFloat(row.consumption || 0);
            byDate[d].patient_load     += parseInt(row.patient_load || 0, 10);
            byDate[d].emergency_demand += parseFloat(row.emergency_demand || 0);
          }
          const sorted = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
          setDemandData(sorted);
        }
      } catch {
        if (!cancelled) setDemandData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedRange]);

  // Chart dimensions
  const width = 680;
  const height = 230;
  const paddingLeft = 52;
  const paddingRight = 24;
  const paddingTop = 16;
  const paddingBottom = 32;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Derive max Y from data
  const maxConsumption = demandData.reduce((m, d) => Math.max(m, d.consumption), 0);
  const maxY = maxConsumption > 0
    ? Math.ceil(maxConsumption / 500) * 500
    : 2000;

  // Y ticks
  const yTickCount = 5;
  const yTicks = [];
  for (let i = yTickCount; i >= 0; i--) {
    yTicks.push(Math.round((maxY / yTickCount) * i));
  }

  const getYCoord = (val) => paddingTop + chartHeight - (val / maxY) * chartHeight;
  const getXCoord = (ratio) => paddingLeft + ratio * chartWidth;

  // Build actual points from real demand data
  const actualPoints = demandData.map((d, i) => ({
    date: formatDateLabel(d.date),
    val: Math.round(d.consumption),
    ratio: demandData.length > 1 ? i / (demandData.length - 1) : 0.5,
  }));

  // Build smooth SVG curve
  const buildSmoothCurve = (pts) => {
    if (pts.length === 0) return '';
    const coords = pts.map(p => ({ x: getXCoord(p.ratio), y: getYCoord(p.val) }));
    if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;
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

  // Area fill path
  const zeroY = getYCoord(0);
  const actualAreaPath = actualPoints.length > 1
    ? `${actualCurvePath} L ${getXCoord(actualPoints[actualPoints.length - 1].ratio).toFixed(1)} ${zeroY} L ${getXCoord(actualPoints[0].ratio).toFixed(1)} ${zeroY} Z`
    : '';

  // X axis markers (evenly spaced labels from data)
  const labelCount = Math.min(8, actualPoints.length);
  const step = actualPoints.length > 1 ? Math.max(1, Math.floor(actualPoints.length / labelCount)) : 1;
  const xMarkers = actualPoints.filter((_, i) => i % step === 0 || i === actualPoints.length - 1);

  // Show empty state for no data
  const hasData = actualPoints.length > 0;

  return (
    <div className="analysis-card">
      <div className="analysis-header">
        <div className="analysis-title-group">
          <h2>Medicine demand overview</h2>
          <p>{hasData ? 'Actual consumption from hospital records' : 'No demand data recorded yet'}</p>
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
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '6px',
              background: '#FFFFFF', borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: '1px solid #E3EDE0', zIndex: 20, minWidth: '120px', overflow: 'hidden',
            }}>
              {timeRangeOptions.map((opt) => (
                <div
                  key={opt}
                  onClick={() => { setSelectedRange(opt); setDropdownOpen(false); }}
                  style={{
                    padding: '8px 12px', fontSize: '0.78rem', cursor: 'pointer',
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

      {/* Chart body */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: '#1F4D3A' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : !hasData ? (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#888', fontSize: '0.85rem' }}>
          <p>No demand history found for this period.</p>
          <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>Record daily usage in the Inventory page to populate this chart.</p>
        </div>
      ) : (
        <>
          <div style={{ position: 'relative', width: '100%', overflow: 'visible' }}>
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <linearGradient id="actualAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1F4D3A" stopOpacity="0.22" />
                  <stop offset="70%" stopColor="#81B29A" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#DDE8DA" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Y Axis */}
              <text x={12} y={height / 2} fill="#8E9B93" fontSize="10" fontWeight="500"
                textAnchor="middle" transform={`rotate(-90, 12, ${height / 2})`}>
                Units
              </text>

              {yTicks.map((tick) => {
                const y = getYCoord(tick);
                return (
                  <g key={tick}>
                    <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#EBF0E9" strokeWidth="1" />
                    <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fill="#8E9B93" fontSize="10" fontWeight="500">
                      {tick.toLocaleString()}
                    </text>
                  </g>
                );
              })}

              {/* Actual area fill */}
              {actualAreaPath && <path d={actualAreaPath} fill="url(#actualAreaGradient)" />}

              {/* Actual demand line */}
              <path d={actualCurvePath} stroke="#1F4D3A" strokeWidth="2.8" fill="none" strokeLinecap="round" />

              {/* Data points */}
              {actualPoints.map((pt, idx) => {
                const cx = getXCoord(pt.ratio);
                const cy = getYCoord(pt.val);
                const isHovered = hoveredPoint?.date === pt.date;
                return (
                  <g key={idx} style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}>
                    <circle cx={cx} cy={cy} r={isHovered ? 6 : 4} fill="#1F4D3A" stroke="#FFFFFF" strokeWidth="1.5" />
                    <circle cx={cx} cy={cy} r={12} fill="transparent" />
                  </g>
                );
              })}

              {/* X axis labels */}
              {xMarkers.map((marker, idx) => (
                <text key={idx} x={getXCoord(marker.ratio)} y={height - 8}
                  textAnchor="middle" fill="#8E9B93" fontSize="10.5" fontWeight="500">
                  {marker.date}
                </text>
              ))}
            </svg>

            {/* Hover tooltip */}
            {hoveredPoint && (
              <div style={{
                position: 'absolute',
                left: `${(getXCoord(hoveredPoint.ratio) / width) * 100}%`,
                top: `${(getYCoord(hoveredPoint.val) / height) * 100}%`,
                transform: 'translate(-50%, -120%)',
                background: '#1F4D3A', color: '#FFFFFF',
                padding: '4px 8px', borderRadius: '6px',
                fontSize: '11px', fontWeight: 600,
                pointerEvents: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                whiteSpace: 'nowrap', zIndex: 10,
              }}>
                {hoveredPoint.date}: {hoveredPoint.val} units
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '24px',
            marginTop: '12px', paddingLeft: '48px', fontSize: '0.76rem', color: '#1F2A24',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1F4D3A', display: 'inline-block' }} />
              <span style={{ fontWeight: 600 }}>Actual demand</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
              <span style={{ width: '16px', height: '2px', borderBottom: '2px dashed #2B674E', display: 'inline-block' }} />
              <span style={{ color: '#4D6256', fontWeight: 500 }}>Predicted demand (AI pending)</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatDateLabel(isoDate) {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length < 3) return isoDate;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${months[monthIdx]} ${day}`;
}
