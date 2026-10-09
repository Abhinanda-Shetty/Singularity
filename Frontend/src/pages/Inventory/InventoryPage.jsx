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
  Boxes,
  ArrowRight,
  Edit3,
  X,
  TrendingUp,
  TrendingDown,
  Check,
  Package,
  Layers,
  FileText
} from 'lucide-react';
import { fetchInventory, fetchHospitals, updateInventory } from '../../services/api';
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

  // Quick Stock Update Modal state
  const [selectedItemForUpdate, setSelectedItemForUpdate] = useState(null);
  const [updateMode, setUpdateMode] = useState('set'); // 'set' | 'add' | 'deduct'
  const [updateValue, setUpdateValue] = useState('');
  const [updateSafetyStock, setUpdateSafetyStock] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

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

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleOpenUpdateModal = (item) => {
    setSelectedItemForUpdate(item);
    setUpdateMode('set');
    setUpdateValue(String(item.quantity || 0));
    setUpdateSafetyStock(String(item.safety_stock || 0));
    setUpdateNote('');
  };

  const handleCloseUpdateModal = () => {
    if (updating) return;
    setSelectedItemForUpdate(null);
  };

  // Calculations for stock preview in modal
  const currentQty = selectedItemForUpdate ? parseFloat(selectedItemForUpdate.quantity || 0) : 0;
  const currentSafety = selectedItemForUpdate ? parseFloat(selectedItemForUpdate.safety_stock || 0) : 0;
  
  let calculatedNewQty = currentQty;
  const parsedVal = parseFloat(updateValue);
  if (!isNaN(parsedVal)) {
    if (updateMode === 'set') calculatedNewQty = Math.max(0, parsedVal);
    if (updateMode === 'add') calculatedNewQty = Math.max(0, currentQty + parsedVal);
    if (updateMode === 'deduct') calculatedNewQty = Math.max(0, currentQty - parsedVal);
  }

  const effectiveSafety = !isNaN(parseFloat(updateSafetyStock)) ? Math.max(0, parseFloat(updateSafetyStock)) : currentSafety;
  const projectedIsAtRisk = calculatedNewQty <= effectiveSafety;

  const handleSaveStockUpdate = async (e) => {
    e?.preventDefault();
    if (!selectedItemForUpdate) return;
    setUpdating(true);
    try {
      await updateInventory(selectedItemForUpdate.id, {
        quantity: calculatedNewQty,
        safety_stock: effectiveSafety,
        note: updateNote.trim() || undefined,
      });

      // Optimistic update of local inventory
      setInventory((prev) =>
        prev.map((i) =>
          i.id === selectedItemForUpdate.id
            ? {
                ...i,
                quantity: calculatedNewQty,
                safety_stock: effectiveSafety,
                updated_at: new Date().toISOString(),
              }
            : i
        )
      );

      setToastMessage({
        type: 'success',
        text: `Stock for "${selectedItemForUpdate.medicine_name}" successfully updated to ${calculatedNewQty.toLocaleString()} ${selectedItemForUpdate.medicine_unit || 'units'}.`,
      });

      setSelectedItemForUpdate(null);
      // Re-fetch in background to ensure total parity
      loadData();
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Failed to update stock. Please try again.',
      });
    } finally {
      setUpdating(false);
    }
  };

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
        <EntryPage initialTab="stock" />
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
      {/* Toast alert */}
      {toastMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderRadius: '10px',
          backgroundColor: toastMessage.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: toastMessage.type === 'error' ? '1px solid #fecaca' : '1px solid #bbf7d0',
          color: toastMessage.type === 'error' ? '#991b1b' : '#166534',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          animation: 'fadeIn 0.2s ease-in-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 500, fontSize: '0.9rem' }}>
            {toastMessage.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

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
                            onClick={() => handleOpenUpdateModal(item)}
                            title="Update current stock & safety threshold"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#1F4D3A',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#1F4D3A';
                              e.currentTarget.style.backgroundColor = '#f0fdf4';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#cbd5e1';
                              e.currentTarget.style.backgroundColor = '#ffffff';
                            }}
                          >
                            <Edit3 size={13} color="#1F4D3A" />
                            <span>Update Stock</span>
                          </button>

                          {isDeficit && (
                            <button
                              type="button"
                              onClick={() => navigate('/transfers')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 11px',
                                borderRadius: '6px',
                                border: '1px solid #fca5a5',
                                backgroundColor: '#fff1f2',
                                color: '#be123c',
                                fontSize: '0.78rem',
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

      {/* QUICK STOCK UPDATE MODAL */}
      {selectedItemForUpdate && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            animation: 'modalSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              background: '#f8fafc',
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#e6f4ea',
                  color: '#1F4D3A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #b7dfca'
                }}>
                  <Package size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                    Update Stock Inventory
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                    {selectedItemForUpdate.medicine_name} • {selectedItemForUpdate.hospital_name}
                  </div>
                </div>
              </div>
              <button
                onClick={handleCloseUpdateModal}
                disabled={updating}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px',
                  borderRadius: '6px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveStockUpdate} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Snapshot Card */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '10px',
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '0.825rem'
              }}>
                <div>
                  <span style={{ color: '#64748b' }}>Current On Hand:</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {currentQty.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>{selectedItemForUpdate.medicine_unit || 'units'}</span>
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Current Safety Threshold:</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#64748b', marginTop: '2px' }}>
                    {currentSafety.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{selectedItemForUpdate.medicine_unit || 'units'}</span>
                  </div>
                </div>
              </div>

              {/* Mode Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Update Action Mode:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setUpdateMode('set');
                      setUpdateValue(String(currentQty));
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: updateMode === 'set' ? '2px solid #1F4D3A' : '1px solid #cbd5e1',
                      background: updateMode === 'set' ? '#e6f4ea' : '#ffffff',
                      color: updateMode === 'set' ? '#1F4D3A' : '#475569',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Edit3 size={15} />
                    <span>Set Total Count</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUpdateMode('add');
                      setUpdateValue('50');
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: updateMode === 'add' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: updateMode === 'add' ? '#eff6ff' : '#ffffff',
                      color: updateMode === 'add' ? '#2563eb' : '#475569',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <TrendingUp size={15} />
                    <span>Add Received (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUpdateMode('deduct');
                      setUpdateValue('20');
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: updateMode === 'deduct' ? '2px solid #d97706' : '1px solid #cbd5e1',
                      background: updateMode === 'deduct' ? '#fffbeb' : '#ffffff',
                      color: updateMode === 'deduct' ? '#d97706' : '#475569',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <TrendingDown size={15} />
                    <span>Deduct Used (-)</span>
                  </button>
                </div>
              </div>

              {/* Input for Quantity */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155' }}>
                    {updateMode === 'set' && 'New Total Quantity Count:'}
                    {updateMode === 'add' && 'Quantity Received / Restocked:'}
                    {updateMode === 'deduct' && 'Quantity Dispensed / Used:'}
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Unit: {selectedItemForUpdate.medicine_unit || 'units'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={updateValue}
                    onChange={(e) => setUpdateValue(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      outline: 'none',
                      color: '#0f172a'
                    }}
                  />
                  {/* Preset quick buttons if adding */}
                  {updateMode !== 'set' && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[25, 50, 100].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setUpdateValue(String(preset))}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Safety Stock Threshold */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Safety Stock Threshold:
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={updateSafetyStock}
                  onChange={(e) => setUpdateSafetyStock(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                />
                <span style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Minimum buffer required before inventory triggers automated supply chain deficit warnings.
                </span>
              </div>

              {/* Projected Result Live Card */}
              <div style={{
                borderRadius: '10px',
                padding: '14px 16px',
                backgroundColor: projectedIsAtRisk ? '#fff1f2' : '#f0fdf4',
                border: projectedIsAtRisk ? '1px solid #fecdd3' : '1px solid #bbf7d0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: projectedIsAtRisk ? '#be123c' : '#166534' }}>
                    PROJECTED STOCK LEVEL:
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: projectedIsAtRisk ? '#9f1239' : '#14532d', marginTop: '2px' }}>
                    {calculatedNewQty.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{selectedItemForUpdate.medicine_unit || 'units'}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: projectedIsAtRisk ? '#fee2e2' : '#dcfce7',
                    color: projectedIsAtRisk ? '#991b1b' : '#166534',
                    border: projectedIsAtRisk ? '1px solid #fca5a5' : '1px solid #86efac',
                  }}>
                    {projectedIsAtRisk ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                    {projectedIsAtRisk ? 'Deficit Warning' : 'Optimal'}
                  </span>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                    {projectedIsAtRisk 
                      ? `${(effectiveSafety - calculatedNewQty).toLocaleString()} units below safety buffer`
                      : `${(calculatedNewQty - effectiveSafety).toLocaleString()} units safe cushion`
                    }
                  </div>
                </div>
              </div>

              {/* Reason / Audit Note */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Adjustment Reason / Audit Note (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Physical inventory verification, depot delivery receipt, pharmacy audit"
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    color: '#334155'
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleCloseUpdateModal}
                  disabled={updating}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#1F4D3A',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: updating ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(31,77,58,0.2)',
                    opacity: updating ? 0.7 : 1,
                  }}
                >
                  {updating ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Saving Stock...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Confirm &amp; Update Stock</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
