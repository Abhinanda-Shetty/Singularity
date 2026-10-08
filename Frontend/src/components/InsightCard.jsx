import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Users, Hourglass, ArrowRight } from 'lucide-react';

export default function InsightCard({ item }) {
  const navigate = useNavigate();
  const { title, description, icon, variant, actionLink, featuredMedicine } = item;

  const handleClick = () => {
    if (actionLink) {
      navigate(actionLink);
    }
  };

  const renderIcon = () => {
    switch (icon) {
      case 'chart':
        return <BarChart2 size={20} strokeWidth={2.2} className="insight-card-icon green" />;
      case 'warning':
        return <Users size={20} strokeWidth={2.2} className="insight-card-icon green" />;
      case 'alert':
        return <Hourglass size={20} strokeWidth={2.2} className="insight-card-icon" />;
      default:
        return <BarChart2 size={20} strokeWidth={2.2} className="insight-card-icon green" />;
    }
  };

  return (
    <div 
      className={`insight-card ${variant === 'urgent' ? 'urgent' : ''}`}
      onClick={handleClick}
      style={{ cursor: actionLink ? 'pointer' : 'default' }}
      title={actionLink ? 'Click to view risk details' : undefined}
    >
      <div className="insight-card-icon-wrap">
        {renderIcon()}
      </div>
      <div className="insight-content" style={{ flex: 1 }}>
        <h3>{title}</h3>
        <p>{description}</p>
        {featuredMedicine && (
          <div style={{ marginTop: '4px', fontSize: '0.73rem', color: '#1F4D3A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span>{featuredMedicine}</span>
            <ArrowRight size={12} strokeWidth={2.4} />
          </div>
        )}
      </div>
    </div>
  );
}
