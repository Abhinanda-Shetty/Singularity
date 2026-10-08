import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Package, 
  Layers, 
  Users, 
  ArrowDownCircle, 
  ShieldCheck, 
  Lightbulb, 
  Network, 
  Info,
  Check
} from 'lucide-react';
import { risksData } from '../../data/mockData';

export default function RisksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const medicineParam = searchParams.get('medicine');

  // Selected item state
  const [selectedRiskId, setSelectedRiskId] = useState('amoxicillin');

  // Filter states
  const [activeTab, setActiveTab] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [timePeriod, setTimePeriod] = useState('Next 14 days');
  const [sortBy, setSortBy] = useState('Severity (High to Low)');

  // Sync selected medicine with URL param if provided
  useEffect(() => {
    if (medicineParam) {
      const match = risksData.find(
        (r) => r.id.toLowerCase() === medicineParam.toLowerCase() ||
               r.name.toLowerCase().includes(medicineParam.toLowerCase())
      );
      if (match) {
        setSelectedRiskId(match.id);
      }
    }
  }, [medicineParam]);

  // Tab categories with counts
  const tabCategories = [
    { label: 'All', count: 10 },
    { label: 'Shortage', count: 4 },
    { label: 'Low stock', count: 3 },
    { label: 'Expiry', count: 2 },
    { label: 'Demand spike', count: 1 },
    { label: 'Data issue', count: 0 },
  ];

  // Filter logic
  const filteredRisks = risksData.filter((item) => {
    // Tab filter
    if (activeTab === 'Shortage' && item.categoryFilter !== 'Shortage') return false;
    if (activeTab === 'Low stock' && item.categoryFilter !== 'Low stock') return false;
    if (activeTab === 'Expiry' && item.categoryFilter !== 'Expiry') return false;
    if (activeTab === 'Demand spike' && item.categoryFilter !== 'Demand spike') return false;
    if (activeTab === 'Data issue') return false; // 0 issues

    // Severity filter
    if (severityFilter !== 'All' && item.severity.toLowerCase() !== severityFilter.toLowerCase()) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = item.name.toLowerCase().includes(q);
      const matchesCategory = item.category.toLowerCase().includes(q);
      const matchesType = item.type.toLowerCase().includes(q);
      if (!matchesName && !matchesCategory && !matchesType) return false;
    }

    return true;
  });

  // Sorting
  const sortedRisks = [...filteredRisks].sort((a, b) => {
    if (sortBy === 'Severity (High to Low)') {
      if (a.severity === 'High' && b.severity !== 'High') return -1;
      if (a.severity !== 'High' && b.severity === 'High') return 1;
      return (a.daysLeft || 999) - (b.daysLeft || 999);
    }
    if (sortBy === 'Days left (Lowest first)') {
      return (a.daysLeft || 999) - (b.daysLeft || 999);
    }
    if (sortBy === 'Shortage (Highest first)') {
      const parseVal = (str) => parseInt(str.replace(/[^0-9]/g, '')) || 0;
      return parseVal(b.issue) - parseVal(a.issue);
    }
    return 0;
  });

  // Currently selected risk object
  const selectedRisk = risksData.find((r) => r.id === selectedRiskId) || sortedRisks[0] || risksData[0];

  // Helper for Type icon and style
  const renderTypeCell = (type) => {
    switch (type) {
      case 'Shortage':
        return (
          <span className="type-cell shortage">
            <AlertTriangle size={15} strokeWidth={2.4} /> Shortage
          </span>
        );
      case 'Low stock':
        return (
          <span className="type-cell low-stock">
            <AlertTriangle size={15} strokeWidth={2.4} /> Low stock
          </span>
        );
      case 'Expiry':
        return (
          <span className="type-cell expiry">
            <Clock size={15} strokeWidth={2.4} /> Expiry
          </span>
        );
      case 'Demand spike':
        return (
          <span className="type-cell demand-spike">
            <TrendingUp size={15} strokeWidth={2.4} /> Demand spike
          </span>
        );
      default:
        return <span className="type-cell">{type}</span>;
    }
  };

  // Helper for Days left color
  const getDaysLeftClass = (days) => {
    if (days === null || days === undefined) return 'neutral';
    if (days <= 6) return 'urgent';
    if (days <= 12) return 'warning';
    return 'safe';
  };

  return (
    <div>
      {/* Top Navigation Back Link */}
      <button 
        type="button" 
        className="back-link" 
        onClick={() => navigate('/dashboard')}
      >
        <ArrowLeft size={16} strokeWidth={2.4} />
        <span>Back to Dashboard</span>
      </button>

      {/* Page Header */}
      <div className="risks-page-header">
        <div>
          <h1>Risks & Alerts</h1>
          <p>
            Detailed view of medicines that need attention due to low stock, expected shortages, expiry or unusual demand.
          </p>
        </div>
        <span className="risks-last-updated">Last updated: 10 minutes ago</span>
      </div>

      {/* Category Tabs */}
      <div className="risk-tabs-wrap">
        {tabCategories.map((tab) => (
          <button
            key={tab.label}
            type="button"
            className={`risk-tab-btn ${activeTab === tab.label ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.label)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Filter Controls Bar */}
      <div className="risk-filters-bar">
        {/* Severity */}
        <div className="filter-field">
          <label htmlFor="severity-select">Severity</label>
          <div className="filter-select-wrap">
            <select
              id="severity-select"
              className="filter-select"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
            </select>
            <ChevronDown size={14} className="filter-select-chevron" />
          </div>
        </div>

        {/* Search Medicine */}
        <div className="filter-field">
          <label htmlFor="medicine-search">Medicine</label>
          <div className="filter-search-wrap">
            <input
              id="medicine-search"
              type="text"
              className="filter-search-input"
              placeholder="Search medicine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={15} className="filter-search-icon" />
          </div>
        </div>

        {/* Time period */}
        <div className="filter-field">
          <label htmlFor="time-period-select">Time period</label>
          <div className="filter-select-wrap">
            <select
              id="time-period-select"
              className="filter-select"
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
            >
              <option value="Next 7 days">Next 7 days</option>
              <option value="Next 14 days">Next 14 days</option>
              <option value="Next 30 days">Next 30 days</option>
            </select>
            <ChevronDown size={14} className="filter-select-chevron" />
          </div>
        </div>

        {/* Sort by */}
        <div className="filter-field">
          <label htmlFor="sort-by-select">Sort by</label>
          <div className="filter-select-wrap">
            <select
              id="sort-by-select"
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="Severity (High to Low)">Severity (High to Low)</option>
              <option value="Days left (Lowest first)">Days left (Lowest first)</option>
              <option value="Shortage (Highest first)">Shortage (Highest first)</option>
            </select>
            <ChevronDown size={14} className="filter-select-chevron" />
          </div>
        </div>
      </div>

      {/* Main Content Two-Panel Layout */}
      <div className="risks-content-grid">
        {/* LEFT PANEL: Risk Table */}
        <div className="risk-table-card">
          <div className="risk-table-header">
            {sortedRisks.length} risks found
          </div>

          <table className="risk-table">
            <thead>
              <tr>
                <th style={{ width: '38px', paddingRight: '0' }}>
                  <input 
                    type="checkbox" 
                    style={{ accentColor: '#1F4D3A', cursor: 'pointer' }}
                    readOnly
                  />
                </th>
                <th>Medicine ↕</th>
                <th>Type</th>
                <th>Days left ↕</th>
                <th>Shortage / Issue ↕</th>
                <th>Severity ↕</th>
                <th style={{ width: '28px' }}></th>
              </tr>
            </thead>
            <tbody>
              {sortedRisks.map((item) => {
                const isSelected = selectedRisk?.id === item.id;
                return (
                  <tr
                    key={item.id}
                    className={`risk-table-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedRiskId(item.id)}
                  >
                    <td style={{ paddingRight: '0' }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => setSelectedRiskId(item.id)}
                        style={{ accentColor: '#1F4D3A', cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <div className="medicine-cell">
                        <span className="medicine-name">{item.name}</span>
                        <span className="medicine-category">{item.category}</span>
                      </div>
                    </td>
                    <td>{renderTypeCell(item.type)}</td>
                    <td>
                      <span className={`days-left-cell ${getDaysLeftClass(item.daysLeft)}`}>
                        {item.daysLeftText}
                      </span>
                    </td>
                    <td>
                      <span className="issue-cell">{item.issue}</span>
                    </td>
                    <td>
                      <span className={`severity-badge ${item.severity.toLowerCase()}`}>
                        <span className="dot" />
                        {item.severity}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <ChevronRight size={16} className="row-chevron" />
                    </td>
                  </tr>
                );
              })}

              {sortedRisks.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#66736B' }}>
                    No medicines match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* RIGHT PANEL: Selected Risk Details */}
        {selectedRisk && (
          <div className="selected-risk-card">
            {/* Header */}
            <div className="selected-risk-header">
              <div className="selected-title-group">
                <h2>{selectedRisk.name}</h2>
                <span>{selectedRisk.category}</span>
              </div>
              <span className={`severity-badge ${selectedRisk.severity.toLowerCase()}`} style={{ padding: '4px 12px' }}>
                <span className="dot" />
                {selectedRisk.severity} risk
              </span>
            </div>

            {/* Prominent Warning Banner */}
            <div className="risk-warning-box">
              <div className="warning-icon-wrap">
                <AlertTriangle size={20} strokeWidth={2.4} />
              </div>
              <div className="warning-box-content">
                <h3>{selectedRisk.warningTitle}</h3>
                <p>{selectedRisk.warningSubtitle}</p>
              </div>
            </div>

            {/* Key Risk Metric Rows */}
            <div className="risk-metrics-list">
              <div className="metric-row">
                <div className="metric-left">
                  <Package size={16} color="#66736B" strokeWidth={2} />
                  <span>Current stock</span>
                </div>
                <div className="metric-right">{selectedRisk.currentStock}</div>
              </div>

              <div className="metric-row">
                <div className="metric-left">
                  <Layers size={16} color="#66736B" strokeWidth={2} />
                  <span>Minimum stock</span>
                </div>
                <div className="metric-right">{selectedRisk.minStock}</div>
              </div>

              <div className="metric-row">
                <div className="metric-left">
                  <Users size={16} color="#66736B" strokeWidth={2} />
                  <span>Predicted demand (14 days)</span>
                </div>
                <div className="metric-right">{selectedRisk.predictedDemand}</div>
              </div>

              <div className="metric-row">
                <div className="metric-left">
                  <AlertTriangle size={16} color="#D03535" strokeWidth={2} />
                  <span>Expected stockout</span>
                </div>
                <div className="metric-right urgent">{selectedRisk.expectedStockout}</div>
              </div>

              <div className="metric-row">
                <div className="metric-left">
                  <ArrowDownCircle size={16} color="#D03535" strokeWidth={2} />
                  <span>Expected shortage</span>
                </div>
                <div className="metric-right urgent" style={{ fontWeight: 800 }}>
                  {selectedRisk.expectedShortage}
                </div>
              </div>

              <div className="metric-row">
                <div className="metric-left">
                  <ShieldCheck size={16} color="#66736B" strokeWidth={2} />
                  <span>Forecast confidence</span>
                </div>
                <div className="metric-right">{selectedRisk.forecastConfidence}</div>
              </div>
            </div>

            {/* Section: Why is this a risk? */}
            <div className="why-risk-section">
              <Lightbulb size={20} className="why-risk-icon" strokeWidth={2.2} />
              <div className="why-risk-content">
                <h4>Why is this a risk?</h4>
                <p>{selectedRisk.whyRisk}</p>
              </div>
            </div>

            {/* Section: Network Availability */}
            <Link to="/network" className="network-avail-box" title="View network availability">
              <div className="network-avail-left">
                <Network size={22} className="network-avail-icon" strokeWidth={2.2} />
                <div className="network-avail-content">
                  <h4>Network availability</h4>
                  <p>{selectedRisk.networkAvailability.description}</p>
                </div>
              </div>
              <ChevronRight size={18} className="network-avail-arrow" strokeWidth={2.4} />
            </Link>

            {/* Section: Additional Information */}
            <div className="additional-info-section">
              <div className="additional-info-header">
                <Info size={16} color="#1F4D3A" strokeWidth={2.2} />
                <span>Additional information</span>
              </div>
              <div className="additional-info-rows">
                <div className="info-item-row">
                  <span className="info-label">Average daily usage</span>
                  <span className="info-val">{selectedRisk.additionalInfo.avgDailyUsage}</span>
                </div>
                <div className="info-item-row">
                  <span className="info-label">Supplier lead time</span>
                  <span className="info-val">{selectedRisk.additionalInfo.supplierLeadTime}</span>
                </div>
                <div className="info-item-row">
                  <span className="info-label">Last stock update</span>
                  <span className="info-val">{selectedRisk.additionalInfo.lastStockUpdate}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
