import { Building2, AlertOctagon, PackageCheck, ArrowLeftRight } from 'lucide-react';

export default function NetworkSummaryCards({
  summary,
  activeFilter,
  onFilterChange,
  showTransfers,
  onToggleTransfers
}) {
  return (
    <div className="network-summary-grid">
      {/* Total Hospitals */}
      <div
        className={`network-kpi-card ${activeFilter === 'all' ? 'is-active' : ''}`}
        onClick={() => onFilterChange('all')}
        role="button"
        tabIndex={0}
      >
        <div className="network-kpi-left">
          <span className="network-kpi-label">Total Facilities</span>
          <div className="network-kpi-value-row">
            <span className="network-kpi-value">{summary.totalHospitals}</span>
            <span className="network-kpi-subtext">Regional Grid</span>
          </div>
        </div>
        <div className="network-kpi-icon-wrap total">
          <Building2 size={22} />
        </div>
      </div>

      {/* Critical Hospitals */}
      <div
        className={`network-kpi-card ${activeFilter === 'critical' ? 'is-active' : ''}`}
        onClick={() => onFilterChange('critical')}
        role="button"
        tabIndex={0}
      >
        <div className="network-kpi-left">
          <span className="network-kpi-label">Critical Shortage</span>
          <div className="network-kpi-value-row">
            <span className="network-kpi-value" style={{ color: '#DC2626' }}>
              {summary.criticalHospitals}
            </span>
            <span className="network-kpi-subtext" style={{ color: '#DC2626' }}>
              Stockout &lt; 3 days
            </span>
          </div>
        </div>
        <div className="network-kpi-icon-wrap critical">
          <AlertOctagon size={22} />
        </div>
      </div>

      {/* Surplus Facilities */}
      <div
        className={`network-kpi-card ${activeFilter === 'surplus' ? 'is-active' : ''}`}
        onClick={() => onFilterChange('surplus')}
        role="button"
        tabIndex={0}
      >
        <div className="network-kpi-left">
          <span className="network-kpi-label">Surplus Facilities</span>
          <div className="network-kpi-value-row">
            <span className="network-kpi-value" style={{ color: '#2563EB' }}>
              {summary.surplusHospitals}
            </span>
            <span className="network-kpi-subtext" style={{ color: '#2563EB' }}>
              Ready Donors
            </span>
          </div>
        </div>
        <div className="network-kpi-icon-wrap surplus">
          <PackageCheck size={22} />
        </div>
      </div>

      {/* Recommended / Active Transfers */}
      <div
        className={`network-kpi-card ${showTransfers ? 'is-active' : ''}`}
        onClick={onToggleTransfers}
        role="button"
        tabIndex={0}
      >
        <div className="network-kpi-left">
          <span className="network-kpi-label">Active Transfers</span>
          <div className="network-kpi-value-row">
            <span className="network-kpi-value" style={{ color: '#16A34A' }}>
              {summary.activeTransfers}
            </span>
            <span className="network-kpi-subtext" style={{ color: '#16A34A' }}>
              {summary.totalTransferredUnits.toLocaleString()} units routed
            </span>
          </div>
        </div>
        <div className="network-kpi-icon-wrap transfers">
          <ArrowLeftRight size={22} />
        </div>
      </div>
    </div>
  );
}
