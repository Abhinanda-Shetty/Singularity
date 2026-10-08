import { useState, useEffect } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { fetchHospitalById } from '../services/api';

export default function Header() {
  const [hospital, setHospital] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchHospitalById(1)
      .then((res) => { if (!cancelled) setHospital(res.data); })
      .catch(() => { /* silently ignore — header still renders without live data */ });
    return () => { cancelled = true; };
  }, []);

  const name     = hospital?.name     ?? 'Hospital';
  const location = hospital?.address  ?? '';
  // Derive a 2-letter short code from the hospital name
  const shortCode = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <header className="top-header">
      {/* Decorative organic background wave/leaves */}
      <div className="header-decor-leaves" aria-hidden="true">
        <svg viewBox="0 0 1000 120" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          <path d="M0 0C250 80 500 20 800 60C920 80 1000 30 1000 0H0Z" fill="#EAF2E8" opacity="0.45" />
          <path d="M150 0C380 65 650 15 900 50C950 58 1000 20 1000 0H150Z" fill="#DFECDC" opacity="0.35" />
          <path d="M720 15C740 5 770 10 780 25C770 35 745 35 730 25L720 15Z" fill="#CDE2CB" opacity="0.4" />
          <path d="M750 35C775 25 805 35 810 50C790 60 765 55 750 35Z" fill="#CDE2CB" opacity="0.35" />
        </svg>
      </div>

      <div className="header-actions">
        {/* Notification Bell */}
        <button className="notification-btn" aria-label="Notifications" title="Notifications">
          <Bell size={20} strokeWidth={2} />
          <span className="notification-dot" />
        </button>

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
