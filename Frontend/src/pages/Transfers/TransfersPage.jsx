import { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Clock, 
  CheckCircle, 
  Search, 
  RefreshCw, 
  Loader, 
  Cpu, 
  Truck, 
  Building, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  X,
  MapPin,
  TrendingDown
} from 'lucide-react';
import { 
  fetchRequests, 
  createRequest, 
  updateRequestStatus, 
  fetchFullAnalysis, 
  fetchHospitals, 
  fetchMedicines 
} from '../../services/api';

export default function TransfersPage() {
  const [activeTab, setActiveTab] = useState('AI_TRANSFERS'); // 'AI_TRANSFERS' or 'REQUESTS'
  const [requests, setRequests] = useState([]);
  const [aiTransfers, setAiTransfers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningOptimizer, setRunningOptimizer] = useState(false);
  const [error, setError] = useState(null);
  
  // Filters
  const [filterUrgency, setFilterUrgency] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State for New Request
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState('');
  const [medicineResults, setMedicineResults] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [formData, setFormData] = useState({
    hospital_id: 1,
    quantity_required: '',
    needed_by: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    urgency: 'Urgent',
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, aiRes, hospRes] = await Promise.all([
        fetchRequests({ limit: 50 }).catch(() => ({ data: [] })),
        fetchFullAnalysis().catch(() => ({ total_transfers: 0, transfers_by_medicine: {} })),
        fetchHospitals({ limit: 50 }).catch(() => ({ data: [] })),
      ]);

      setRequests(reqRes.data || []);
      if (hospRes.data) setHospitals(hospRes.data);

      // Flatten transfers by medicine
      const transferMap = aiRes.transfers_by_medicine || {};
      const flat = [];
      Object.entries(transferMap).forEach(([mid, list]) => {
        list.forEach((t) => flat.push({ ...t, medicine_id: mid }));
      });
      setAiTransfers(flat);
    } catch (err) {
      setError(err.message || 'Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunOptimizer = async () => {
    setRunningOptimizer(true);
    try {
      const aiRes = await fetchFullAnalysis();
      const transferMap = aiRes.transfers_by_medicine || {};
      const flat = [];
      Object.entries(transferMap).forEach(([mid, list]) => {
        list.forEach((t) => flat.push({ ...t, medicine_id: mid }));
      });
      setAiTransfers(flat);
    } catch (err) {
      setError(err.message || 'Failed to run optimization');
    } finally {
      setRunningOptimizer(false);
    }
  };

  const handleStatusChange = async (reqId, newStatus) => {
    try {
      await updateRequestStatus(reqId, newStatus);
      setRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      alert(`Could not update status: ${err.message}`);
    }
  };

  // Medicine search within modal
  useEffect(() => {
    if (!medicineSearch || medicineSearch.length < 2) {
      setMedicineResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetchMedicines({ page: 1, limit: 8 });
        // filter by query in client or server
        const matched = (res.data || []).filter((m) =>
          m.name.toLowerCase().includes(medicineSearch.toLowerCase())
        );
        setMedicineResults(matched);
      } catch {
        // silent
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [medicineSearch]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedMed && !formData.medicine_id) {
      alert('Please select a medicine');
      return;
    }
    setSubmitting(true);
    try {
      await createRequest({
        ...formData,
        medicine_id: selectedMed ? selectedMed.id : formData.medicine_id,
        quantity_required: parseFloat(formData.quantity_required),
      });
      setShowModal(false);
      setSelectedMed(null);
      setMedicineSearch('');
      setFormData({
        hospital_id: 1,
        quantity_required: '',
        needed_by: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        urgency: 'Urgent',
        notes: '',
      });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesUrgency = filterUrgency === 'All' || req.urgency === filterUrgency;
    const matchesSearch =
      searchQuery === '' ||
      (req.medicine_name && req.medicine_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (req.notes && req.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (req.hospital_name && req.hospital_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesUrgency && matchesSearch;
  });

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'Critical':
        return { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' };
      case 'Urgent':
        return { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' };
      default:
        return { bg: '#e0f2fe', color: '#075985', border: '#bae6fd' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: '#1F4D3A' }}>
              Stock Transfers &amp; Redistribution
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: '#EFF6FF',
              color: '#1D4ED8',
              border: '1px solid #BFDBFE'
            }}>
              <Truck size={12} />
              Inter-Hospital Logistics
            </span>
          </div>
          <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: '0.9rem' }}>
            AI-driven PuLP transfer recommendations and supply coordination across network hospitals.
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
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#1F4D3A',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <Plus size={16} />
            <span>Create Transfer Request</span>
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '2px',
      }}>
        <button
          onClick={() => setActiveTab('AI_TRANSFERS')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'AI_TRANSFERS' ? '3px solid #1F4D3A' : '3px solid transparent',
            background: 'transparent',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'AI_TRANSFERS' ? '#1F4D3A' : '#64748b',
            cursor: 'pointer',
          }}
        >
          <Cpu size={16} />
          <span>AI PuLP Recommended Transfers ({aiTransfers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('REQUESTS')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'REQUESTS' ? '3px solid #1F4D3A' : '3px solid transparent',
            background: 'transparent',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: activeTab === 'REQUESTS' ? '#1F4D3A' : '#64748b',
            cursor: 'pointer',
          }}
        >
          <ArrowLeftRight size={16} />
          <span>Facility Supply Requests ({requests.length})</span>
        </button>
      </div>

      {/* TAB 1: AI RECOMMENDED TRANSFERS */}
      {activeTab === 'AI_TRANSFERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Actions & Model Status Banner */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                PuLP Linear Programming Optimization
              </div>
              <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '2px' }}>
                Matches surplus donor facilities with deficit recipient hospitals to minimize stockouts and travel distance.
              </div>
            </div>

            <button
              onClick={handleRunOptimizer}
              disabled={runningOptimizer}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: '#1F4D3A'
              }}
            >
              <Cpu size={15} />
              <span>{runningOptimizer ? 'Recomputing PuLP Solver...' : 'Run Optimization Solver'}</span>
            </button>
          </div>

          {/* Transfers Table */}
          {aiTransfers.length === 0 ? (
            <div style={{
              padding: '48px',
              textAlign: 'center',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px dashed #cbd5e1'
            }}>
              <CheckCircle size={36} color="#16a34a" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: '#0f172a' }}>
                No Transfers Currently Required
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', maxWidth: '420px', marginInline: 'auto' }}>
                All hospitals are within their target safety stock buffers or no feasible donors have surplus inventory.
              </p>
            </div>
          ) : (
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '12px 16px' }}>Donor Hospital (Surplus)</th>
                    <th style={{ padding: '12px 16px' }}>Recipient Hospital (Deficit)</th>
                    <th style={{ padding: '12px 16px' }}>Medicine</th>
                    <th style={{ padding: '12px 16px' }}>Transfer Quantity</th>
                    <th style={{ padding: '12px 16px' }}>Transit &amp; Distance</th>
                    <th style={{ padding: '12px 16px' }}>Urgency Priority</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {aiTransfers.map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#166534' }}>{t.donor_hospital_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Surplus: {Math.round(t.donor_surplus || 0)} units available
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#991b1b' }}>{t.recipient_hospital_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Deficit facility
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{t.medicine_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.medicine_category}</div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}>
                          {Math.round(t.transfer_qty)} units
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', color: '#475569' }}>
                        <div>{Math.round(t.distance_km)} km</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          ~{t.transport_time_days ? (t.transport_time_days * 24).toFixed(0) : '24'} hours transit
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                        }}>
                          Priority: {Math.round(t.recipient_priority_score || 50)}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            alert(`Transfer initiated for ${Math.round(t.transfer_qty)} units of ${t.medicine_name} from ${t.donor_hospital_name} to ${t.recipient_hospital_name}. Tracking ID: TR-${Date.now().toString().slice(-6)}`);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#1F4D3A',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.775rem',
                            cursor: 'pointer',
                          }}
                        >
                          <Truck size={12} />
                          <span>Dispatch Transfer</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUPPLY REQUESTS */}
      {activeTab === 'REQUESTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search requests by medicine or hospital..."
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

            <div style={{ display: 'flex', gap: '6px' }}>
              {['All', 'Critical', 'Urgent', 'Normal'].map((urg) => (
                <button
                  key={urg}
                  onClick={() => setFilterUrgency(urg)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: filterUrgency === urg ? '1px solid #1F4D3A' : '1px solid #e2e8f0',
                    background: filterUrgency === urg ? '#1F4D3A' : '#ffffff',
                    color: filterUrgency === urg ? '#ffffff' : '#64748b',
                  }}
                >
                  {urg}
                </button>
              ))}
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <ArrowLeftRight size={32} style={{ color: '#94a3b8', marginBottom: '8px' }} />
              <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#334155' }}>No Requests Found</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                Click "Create Transfer Request" above to submit an urgent supply request.
              </p>
            </div>
          ) : (
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '12px 16px' }}>Request ID</th>
                    <th style={{ padding: '12px 16px' }}>Hospital</th>
                    <th style={{ padding: '12px 16px' }}>Medicine</th>
                    <th style={{ padding: '12px 16px' }}>Quantity</th>
                    <th style={{ padding: '12px 16px' }}>Needed By</th>
                    <th style={{ padding: '12px 16px' }}>Urgency</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Manage Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => {
                    const badge = getUrgencyBadge(req.urgency);
                    const isFulfilled = req.status === 'fulfilled';
                    const isInTransit = req.status === 'in-transit';

                    return (
                      <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>#{req.id}</td>
                        <td style={{ padding: '12px 16px', color: '#334155', fontWeight: 500 }}>
                          {req.hospital_name || `Hospital ${req.hospital_id}`}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                          {req.medicine_name || `Medicine #${req.medicine_id}`}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#334155', fontWeight: 600 }}>
                          {parseFloat(req.quantity_required).toLocaleString()} {req.medicine_unit || 'units'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>
                          {req.needed_by ? new Date(req.needed_by).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                          }}>
                            {req.urgency}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: isFulfilled ? '#ecfdf5' : isInTransit ? '#eff6ff' : '#fffbeb',
                            color: isFulfilled ? '#047857' : isInTransit ? '#1d4ed8' : '#b45309',
                          }}>
                            {isFulfilled ? <CheckCircle size={12} /> : isInTransit ? <Truck size={12} /> : <Clock size={12} />}
                            {req.status || 'pending'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {!isFulfilled && (
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {!isInTransit && (
                                <button
                                  onClick={() => handleStatusChange(req.id, 'in-transit')}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid #bfdbfe',
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    fontSize: '0.725rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Dispatch
                                </button>
                              )}
                              <button
                                onClick={() => handleStatusChange(req.id, 'fulfilled')}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid #bbf7d0',
                                  background: '#f0fdf4',
                                  color: '#15803d',
                                  fontSize: '0.725rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Fulfill
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE TRANSFER REQUEST MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.45)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
          padding: '16px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="#1F4D3A" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Create Inter-Hospital Supply Request
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitRequest} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Requesting Hospital */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Requesting Hospital
                </label>
                <select
                  value={formData.hospital_id}
                  onChange={(e) => setFormData({ ...formData, hospital_id: parseInt(e.target.value, 10) })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                >
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Medicine Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Medicine Selection (Extensive Indian Catalog)
                </label>
                {selectedMed ? (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #86efac',
                    background: '#f0fdf4',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#15803d', fontSize: '0.9rem' }}>{selectedMed.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>{selectedMed.category} • ID #{selectedMed.id}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMed(null)}
                      style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="Type medicine name (e.g. Augmentin, Dolo, Pan)..."
                      value={medicineSearch}
                      onChange={(e) => setMedicineSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem',
                        outline: 'none',
                      }}
                    />
                    {medicineResults.length > 0 && (
                      <div style={{
                        marginTop: '6px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        maxHeight: '150px',
                        overflowY: 'auto',
                        background: '#ffffff',
                      }}>
                        {medicineResults.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              setSelectedMed(m);
                              setMedicineSearch('');
                              setMedicineResults([]);
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9',
                              fontSize: '0.85rem',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                          >
                            <span style={{ fontWeight: 600 }}>{m.name}</span>
                            <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#64748b' }}>({m.category})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity and Urgency */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Quantity Required
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    required
                    value={formData.quantity_required}
                    onChange={(e) => setFormData({ ...formData, quantity_required: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Urgency Tier
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Critical">Critical Shortage</option>
                  </select>
                </div>
              </div>

              {/* Needed By Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Needed By Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.needed_by}
                  onChange={(e) => setFormData({ ...formData, needed_by: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Clinical Justification / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional details on ICU demand, emergency shortage, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#1F4D3A',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
