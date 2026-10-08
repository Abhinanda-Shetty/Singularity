import { useState, useEffect } from 'react';
import { 
  Pill, 
  ClipboardList, 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  Building, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Boxes,
  ArrowRight
} from 'lucide-react';
import { fetchInventory, fetchHospitals } from '../../services/api';
import EntryPage from '../EntryPage/EntryPage';
import { useNavigate } from 'react-router-dom';

export default function InventoryPage() {
  const navigate = useNavigate();
  const [viewEntryForm, setViewEntryForm] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, hospRes] = await Promise.all([
        fetchInventory({
          hospital_id: selectedHospital || undefined,
          limit: 100,
        }).catch(() => ({ data: [] })),
        fetchHospitals({ limit: 50 }).catch(() => ({ data: [] })),
      ]);
      setInventory(invRes.data || []);
      if (hospRes.data) setHospitals(hospRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedHospital]);

  if (viewEntryForm) {
    return (
      <div className="inventory-entry-view-wrapper">
        <div style={{ marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => {
              setViewEntryForm(false);
              loadData();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #c0c9c2',
              borderRadius: '8px',
              color: '#1F4D3A',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} />
            Back to Inventory Directory
          </button>
        </div>
        <EntryPage />
      </div>
    );
  }

  // Filter inventory
  const filtered = inventory.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      (item.medicine_name && item.medicine_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.medicine_category && item.medicine_category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.hospital_name && item.hospital_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const qty = parseFloat(item.quantity || 0);
    const safety = parseFloat(item.safety_stock || 0);
    const isAtRisk = qty <= safety;

    let matchesStatus = true;
    if (stockFilter === 'AT_RISK') matchesStatus = isAtRisk;
    if (stockFilter === 'HEALTHY') matchesStatus = !isAtRisk;

    return matchesSearch && matchesStatus;
  });

  const totalUnits = inventory.reduce((acc, curr) => acc + parseFloat(curr.quantity || 0), 0);
  const atRiskCount = inventory.filter((i) => parseFloat(i.quantity || 0) <= parseFloat(i.safety_stock || 0)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: '#1F4D3A' }}>
            Hospital Medicine Inventory Directory
          </h1>
          <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: '0.9rem' }}>
            Live centralized inventory across network hospitals with real-time stock levels and safety thresholds.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#334155'
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setViewEntryForm(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              backgroundColor: '#1F4D3A',
              color: '#ffffff',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(31,77,58,0.2)'
            }}
          >
            <ClipboardList size={16} />
            <span>Record Stock / Usage Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85rem' }}>
            <span>Stocked Medicine Items</span>
            <Boxes size={18} color="#1F4D3A" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px', color: '#0f172a' }}>
            {inventory.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>
            Across all facilities
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85rem' }}>
            <span>Total Units in Stock</span>
            <Pill size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px', color: '#0f172a' }}>
            {Math.round(totalUnits).toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>units</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Cumulative available quantity
          </div>
        </div>

        <div style={{
          background: atRiskCount > 0 ? '#fff1f2' : '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: atRiskCount > 0 ? '1px solid #fecdd3' : '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: atRiskCount > 0 ? '#9f1239' : '#64748b', fontSize: '0.85rem' }}>
            <span>At-Risk / Low Stock</span>
            <AlertTriangle size={18} color={atRiskCount > 0 ? '#e11d48' : '#64748b'} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 2px', color: atRiskCount > 0 ? '#be123c' : '#0f172a' }}>
            {atRiskCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: atRiskCount > 0 ? '#e11d48' : '#16a34a', fontWeight: 500 }}>
            {atRiskCount > 0 ? 'Breaching safety threshold' : 'All buffers healthy'}
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#ffffff',
        padding: '14px 18px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          {/* Search bar */}
          <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by medicine, brand, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Hospital Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building size={16} color="#64748b" />
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                outline: 'none',
                background: '#ffffff',
                color: '#334155'
              }}
            >
              <option value="">All Hospitals</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { label: 'All', value: 'ALL' },
            { label: 'Low Stock Only', value: 'AT_RISK' },
            { label: 'Healthy Stock', value: 'HEALTHY' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStockFilter(item.value)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: stockFilter === item.value ? '1px solid #1F4D3A' : '1px solid #e2e8f0',
                background: stockFilter === item.value ? '#1F4D3A' : '#ffffff',
                color: stockFilter === item.value ? '#ffffff' : '#64748b',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '12px 16px' }}>Medicine &amp; Category</th>
                <th style={{ padding: '12px 16px' }}>Hospital Facility</th>
                <th style={{ padding: '12px 16px' }}>Quantity On Hand</th>
                <th style={{ padding: '12px 16px' }}>Safety Stock</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <RefreshCw size={18} className="animate-spin" color="#1F4D3A" />
                      <span>Loading inventory from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No inventory records match your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const qty = parseFloat(item.quantity || 0);
                  const safety = parseFloat(item.safety_stock || 0);
                  const isDeficit = qty <= safety;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {item.medicine_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {item.medicine_category || 'General'} • ID #{item.medicine_id}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: '#334155', fontWeight: 500 }}>
                          {item.hospital_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Facility #{item.hospital_id}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: isDeficit ? '#dc2626' : '#0f172a'
                        }}>
                          {qty.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '4px' }}>
                          {item.medicine_unit || 'units'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', color: '#64748b' }}>
                        {safety.toLocaleString()} {item.medicine_unit || 'units'}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: isDeficit ? '#fee2e2' : '#dcfce7',
                          color: isDeficit ? '#991b1b' : '#166534',
                          border: isDeficit ? '1px solid #fca5a5' : '1px solid #86efac',
                        }}>
                          {isDeficit ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                          {isDeficit ? 'At Risk / Deficit' : 'Optimal'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setViewEntryForm(true)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#334155',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Update
                          </button>

                          {isDeficit && (
                            <button
                              type="button"
                              onClick={() => navigate('/transfers')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #fca5a5',
                                backgroundColor: '#fff1f2',
                                color: '#be123c',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <span>Transfer</span>
                              <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
