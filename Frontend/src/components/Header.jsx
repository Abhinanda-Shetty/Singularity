import { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  ChevronDown, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  X, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { fetchHospitalById, fetchBatches, fetchInventory } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const dropdownRef = useRef(null);

  // Load hospital metadata and generate alerts from expired batches and low stocks
  const loadAlerts = async () => {
    try {
      const [hospRes, batchRes, invRes] = await Promise.all([
        fetchHospitalById(1).catch(() => null),
        fetchBatches({ limit: 100 }).catch(() => ({ data: [] })),
        fetchInventory({ limit: 100 }).catch(() => ({ data: [] })),
      ]);

      if (hospRes?.data) setHospital(hospRes.data);

      const batchList = batchRes?.data || [];
      const invList = invRes?.data || [];

      const generated = [];

      // 1. Detect Expired Batches
      batchList.forEach((b) => {
        const diffDays = b.days_until_expiry !== undefined 
          ? b.days_until_expiry 
          : Math.ceil((new Date(b.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
          generated.push({
            id: `exp-${b.id}`,
            type: 'EXPIRED',
            severity: 'critical',
            title: `Batch Expired: ${b.medicine_name}`,
            message: `Batch #${b.batch_number || b.id} (${b.quantity} units) expired on ${b.expiry_date}. Immediate quarantine required.`,
            facility: b.hospital_name,
            days: Math.abs(diffDays),
            link: '/risks',
            linkText: 'Quarantine & Review',
          });
        } else if (diffDays <= 14) {
          generated.push({
            id: `crit-exp-${b.id}`,
            type: 'EXPIRING_SOON',
            severity: 'warning',
            title: `Critical Expiry: ${b.medicine_name}`,
            message: `Batch #${b.batch_number || b.id} (${b.quantity} units) expires in ${diffDays} days (${b.expiry_date}).`,
            facility: b.hospital_name,
            days: diffDays,
            link: '/transfers',
            linkText: 'Redistribute Batch',
          });
        }
      });

      // 2. Detect Critical Low Stock
      invList.forEach((inv) => {
        const qty = parseFloat(inv.quantity || 0);
        const safety = parseFloat(inv.safety_stock || 0);
        if (qty <= safety) {
          generated.push({
            id: `stock-${inv.id}`,
            type: 'STOCKOUT',
            severity: 'high',
            title: `Low Stock Alert: ${inv.medicine_name}`,
            message: `Current stock (${qty} units) has breached safety threshold (${safety} units) at ${inv.hospital_name}.`,
            facility: inv.hospital_name,
            link: '/transfers',
            linkText: 'Request Stock',
          });
        }
      });

      setNotifications(generated);
    } catch {
      // silently fallback
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 45000); // refresh every 45s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const name = hospital?.name ?? 'City General Hospital';
  const location = hospital?.address ?? 'Mumbai, Maharashtra';
  const shortCode = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === 'EXPIRED') return n.type === 'EXPIRED';
    if (activeTab === 'EXPIRING') return n.type === 'EXPIRING_SOON';
    if (activeTab === 'STOCKOUT') return n.type === 'STOCKOUT';
    return true;
  });

  const unreadCount = notifications.length;

  return (
    <header className="top-header" style={{ position: 'relative' }}>
      {/* Decorative organic background */}
      <div className="header-decor-leaves" aria-hidden="true">
        <svg viewBox="0 0 1000 120" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          <path d="M0 0C250 80 500 20 800 60C920 80 1000 30 1000 0H0Z" fill="#EAF2E8" opacity="0.45" />
          <path d="M150 0C380 65 650 15 900 50C950 58 1000 20 1000 0H150Z" fill="#DFECDC" opacity="0.35" />
          <path d="M720 15C740 5 770 10 780 25C770 35 745 35 730 25L720 15Z" fill="#CDE2CB" opacity="0.4" />
        </svg>
      </div>

      <div className="header-actions" ref={dropdownRef}>
        {/* Notification Bell Button */}
        <div style={{ position: 'relative' }}>
          <button 
            className="notification-btn" 
            aria-label="Notifications" 
            title="Notifications & Alerts"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              position: 'relative',
              background: isOpen ? '#e2e8f0' : undefined,
              cursor: 'pointer',
            }}
          >
            <Bell size={20} strokeWidth={2} />
            {unreadCount > 0 && (
              <span 
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#e11d48',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  borderRadius: '9999px',
                  minWidth: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  border: '2px solid #ffffff',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Popover Dropdown */}
          {isOpen && (
            <div style={{
              position: 'absolute',
              top: '46px',
              right: 0,
              width: '380px',
              maxHeight: '520px',
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              boxShadow: '0 12px 30px -4px rgba(0,0,0,0.18), 0 4px 10px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease-out',
            }}>
              {/* Header */}
              <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f8fafc',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} color="#1F4D3A" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                    Notifications &amp; Alerts
                  </span>
                  {unreadCount > 0 && (
                    <span style={{
                      backgroundColor: '#fee2e2',
                      color: '#b91c1c',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                    }}>
                      {unreadCount} active
                    </span>
                  )}
                </div>

                <button 
                  onClick={() => setIsOpen(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '4px',
                    borderRadius: '4px',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Tabs */}
              <div style={{
                display: 'flex',
                gap: '4px',
                padding: '8px 12px',
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: '#ffffff',
              }}>
                {[
                  { label: 'All', value: 'ALL' },
                  { label: 'Expired', value: 'EXPIRED' },
                  { label: 'Expiring', value: 'EXPIRING' },
                  { label: 'Stockout', value: 'STOCKOUT' },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setActiveTab(t.value)}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: activeTab === t.value ? '#1F4D3A' : '#f1f5f9',
                      color: activeTab === t.value ? '#ffffff' : '#64748b',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Alerts List */}
              <div style={{
                overflowY: 'auto',
                maxHeight: '360px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                {filteredNotifs.length === 0 ? (
                  <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>
                    <CheckCircle2 size={32} color="#16a34a" style={{ margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                      No alerts in this category
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                      All batches and stock levels are in healthy condition.
                    </p>
                  </div>
                ) : (
                  filteredNotifs.map((item) => {
                    const isExp = item.type === 'EXPIRED';
                    const isCritExp = item.type === 'EXPIRING_SOON';
                    const bg = isExp ? '#fff1f2' : isCritExp ? '#fffbeb' : '#fef2f2';
                    const border = isExp ? '#fecdd3' : isCritExp ? '#fde68a' : '#fed7aa';
                    const iconColor = isExp ? '#e11d48' : isCritExp ? '#f59e0b' : '#ea580c';

                    return (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: bg,
                          border: `1px solid ${border}`,
                          borderRadius: '10px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isExp ? (
                              <AlertTriangle size={15} color={iconColor} />
                            ) : isCritExp ? (
                              <Clock size={15} color={iconColor} />
                            ) : (
                              <ShieldAlert size={15} color={iconColor} />
                            )}
                            <span style={{ fontWeight: 700, fontSize: '0.825rem', color: '#0f172a' }}>
                              {item.title}
                            </span>
                          </div>
                          {item.days !== undefined && (
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: isExp ? '#b91c1c' : '#92400e',
                            }}>
                              {isExp ? `Expired ${item.days}d ago` : `in ${item.days}d`}
                            </span>
                          )}
                        </div>

                        <p style={{ margin: 0, fontSize: '0.775rem', color: '#475569', lineHeight: 1.4 }}>
                          {item.message}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            {item.facility}
                          </span>

                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate(item.link);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: '#1F4D3A',
                              color: '#ffffff',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <span>{item.linkText}</span>
                            <ArrowRight size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '10px 14px',
                borderTop: '1px solid #f1f5f9',
                backgroundColor: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/risks');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#1F4D3A',
                    fontSize: '0.775rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>View All Risks &amp; Batches</span>
                  <ExternalLink size={12} />
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/transfers');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '0.775rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>Transfers &amp; Redistribution</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hospital Profile Pill */}
        <div className="hospital-profile-btn" role="button" tabIndex={0}>
          <div className="hospital-avatar">
            {shortCode || 'HA'}
          </div>
          <div className="hospital-info">
            <span className="hospital-name">{name}</span>
            {location && <span className="hospital-location">{location}</span>}
          </div>
          <ChevronDown className="dropdown-chevron" />
        </div>
      </div>
    </header>
  );
}
