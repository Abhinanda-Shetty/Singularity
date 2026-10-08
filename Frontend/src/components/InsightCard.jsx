import React from 'react';
import { BarChart2, Users, Hourglass } from 'lucide-react';

export default function InsightCard({ item }) {
  const { title, description, icon, variant } = item;

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
    <div className={`insight-card ${variant === 'urgent' ? 'urgent' : ''}`}>
      <div className="insight-card-icon-wrap">
        {renderIcon()}
      </div>
      <div className="insight-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}
