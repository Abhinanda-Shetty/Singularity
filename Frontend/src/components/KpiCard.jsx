import React from 'react';
import { Pill, Package, AlertTriangle, Hourglass, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function KpiCard({ data }) {
  const { title, value, change, isPositive, type, colorTheme, sparklineColor } = data;

  // Icon mapping
  const renderIcon = () => {
    switch (type) {
      case 'medicine':
        return <Pill size={22} strokeWidth={2.2} />;
      case 'stock':
        return <Package size={22} strokeWidth={2.2} />;
      case 'risk':
        return <AlertTriangle size={22} strokeWidth={2.2} />;
      case 'expiring':
        return <Hourglass size={22} strokeWidth={2.2} />;
      default:
        return <Pill size={22} strokeWidth={2.2} />;
    }
  };

  // Sparkline paths matching the reference aesthetic
  const getSparklinePath = () => {
    switch (type) {
      case 'medicine':
        // upward climbing curve
        return 'M 2 20 C 14 20, 20 16, 28 12 C 36 8, 44 14, 52 4 L 56 3';
      case 'stock':
        // wavy slight dip
        return 'M 2 6 C 12 4, 22 14, 30 12 C 38 10, 46 22, 56 18';
      case 'risk':
        // orange wave
        return 'M 2 18 C 12 18, 20 8, 30 14 C 40 20, 48 6, 56 4';
      case 'expiring':
        // red rising wave
        return 'M 2 18 C 14 20, 22 12, 32 15 C 42 18, 48 6, 56 4';
      default:
        return 'M 2 20 C 18 18, 34 10, 56 4';
    }
  };

  return (
    <div className="kpi-card">
      <div className={`kpi-icon-box ${colorTheme}`}>
        {renderIcon()}
      </div>

      <div className="kpi-details">
        <div className="kpi-title">{title}</div>
        <div className="kpi-value-row">
          <span className="kpi-value">{value}</span>
          <svg className="kpi-sparkline" viewBox="0 0 58 24" fill="none">
            <path
              d={getSparklinePath()}
              stroke={sparklineColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="kpi-change-row">
          {isPositive ? (
            <span className="kpi-change positive" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <ArrowUpRight size={13} strokeWidth={2.6} /> {change}
            </span>
          ) : (
            <span className="kpi-change negative" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <ArrowDownRight size={13} strokeWidth={2.6} /> {change}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
