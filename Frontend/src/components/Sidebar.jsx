import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Pill, 
  BarChart2, 
  AlertTriangle, 
  Network, 
  ArrowLeftRight, 
  FileText, 
  Settings 
} from 'lucide-react';

export default function Sidebar() {
  const mainNav = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Inventory', path: '/inventory', icon: Pill },
    { name: 'Risks & Alerts', path: '/risks', icon: AlertTriangle },
  ];

  const secondaryNav = [
    { name: 'Network', path: '/network', icon: Network },
    { name: 'Transfers', path: '/transfers', icon: ArrowLeftRight },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  const bottomNav = [
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M8.5 2.5C8.5 2.5 8.5 3 8.5 3.5V7.5C8.5 7.8 8.2 8 8 8H4C3.2 8 2.5 8.7 2.5 9.5V14.5C2.5 15.3 3.2 16 4 16H8C8.2 16 8.5 16.2 8.5 16.5V20.5C8.5 21.3 9.2 22 10 22H14C14.8 22 15.5 21.3 15.5 20.5V16.5C15.5 16.2 15.8 16 16 16H20C20.8 16 21.5 15.3 21.5 14.5V9.5C21.5 8.7 20.8 8 20 8H16C15.8 8 15.5 7.8 15.5 7.5V3.5C15.5 2.7 14.8 2 14 2H10C9.2 2 8.5 2.5 8.5 2.5Z" 
              stroke="#1F4D3A" 
              strokeWidth="2.5" 
              strokeLinejoin="round" 
              strokeLinecap="round" 
            />
          </svg>
        </div>
        <div className="brand-text-wrap">
          <span className="brand-title">MedSupply</span>
          <span className="brand-subtitle">Hospital Supply Intelligence</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {mainNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="nav-icon" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        <div className="nav-divider" />

        {secondaryNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="nav-icon" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        <div className="nav-divider" />

        {bottomNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="nav-icon" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Decorative leaf motif at bottom left */}
      <div className="sidebar-decor-leaves" aria-hidden="true">
        <svg viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <path d="M-40 260C-40 260 10 210 50 170C90 130 140 100 200 90C160 140 110 200 60 230C20 254 -40 260 -40 260Z" fill="#E2EDE0" opacity="0.6"/>
          <path d="M-20 280C-20 280 40 200 80 160C120 120 170 120 220 130C160 170 100 220 40 270L-20 280Z" fill="#D3E5D0" opacity="0.45"/>
          <path d="M120 180C140 150 170 140 190 150C170 170 140 185 120 180Z" fill="#C5DDC2" opacity="0.5"/>
          <path d="M80 220C100 195 130 190 145 200C125 215 100 225 80 220Z" fill="#B7D4B4" opacity="0.4"/>
        </svg>
      </div>
    </aside>
  );
}
