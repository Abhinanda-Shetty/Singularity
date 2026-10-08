import { Search, RotateCcw, ArrowLeftRight, Layers, LayoutGrid } from 'lucide-react';

export default function NetworkFilters({
  activeFilter,
  onFilterChange,
  counts,
  showTransfers,
  onToggleTransfers,
  searchQuery,
  onSearchChange,
  onResetView,
  viewMode,
  onViewModeChange
}) {
  return (
    <div className="network-controls-bar">
      {/* Filter Tabs */}
      <div className="network-filter-pills">
        <button
          type="button"
          className={`network-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          All Hospitals
          <span className="filter-badge-count">{counts.all}</span>
        </button>

        <button
          type="button"
          className={`network-filter-pill ${activeFilter === 'critical' ? 'active' : ''}`}
          onClick={() => onFilterChange('critical')}
        >
          <span className="filter-dot critical" />
          Critical
          <span className="filter-badge-count">{counts.critical}</span>
        </button>

        <button
          type="button"
          className={`network-filter-pill ${activeFilter === 'low_stock' ? 'active' : ''}`}
          onClick={() => onFilterChange('low_stock')}
        >
          <span className="filter-dot low_stock" />
          Low Stock
          <span className="filter-badge-count">{counts.low_stock}</span>
        </button>

        <button
          type="button"
          className={`network-filter-pill ${activeFilter === 'surplus' ? 'active' : ''}`}
          onClick={() => onFilterChange('surplus')}
        >
          <span className="filter-dot surplus" />
          Surplus
          <span className="filter-badge-count">{counts.surplus}</span>
        </button>
      </div>

      {/* Controls & Search */}
      <div className="network-controls-right">
        {/* Toggle Transfers */}
        <button
          type="button"
          className={`transfer-toggle-btn ${showTransfers ? 'active' : ''}`}
          onClick={onToggleTransfers}
          title="Toggle recommended transfer routes on the map"
        >
          <span className="transfer-toggle-dot" />
          <ArrowLeftRight size={14} />
          <span>Transfers ({counts.transfers})</span>
        </button>

        {/* Search */}
        <div className="network-search-wrap">
          <Search size={14} className="network-search-icon" />
          <input
            type="text"
            className="network-search-input"
            placeholder="Search facility or drug…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'inline-flex', border: '1px solid #E3EDE0', borderRadius: '8px', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => onViewModeChange('map')}
            style={{
              padding: '6px 10px',
              background: viewMode === 'map' ? '#1F4D3A' : '#FFFFFF',
              color: viewMode === 'map' ? '#FFFFFF' : '#66736B',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Map view"
          >
            <Layers size={13} />
            Map
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('split')}
            style={{
              padding: '6px 10px',
              background: viewMode === 'split' ? '#1F4D3A' : '#FFFFFF',
              color: viewMode === 'split' ? '#FFFFFF' : '#66736B',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Split map and list view"
          >
            <LayoutGrid size={13} />
            Split
          </button>
        </div>

        {/* Reset View */}
        <button
          type="button"
          className="network-reset-btn"
          onClick={onResetView}
          title="Reset map view to show all regional hospitals"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
