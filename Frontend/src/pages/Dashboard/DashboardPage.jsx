import React from 'react';
import { Lightbulb } from 'lucide-react';
import KpiCard from '../../components/KpiCard';
import DemandChart from '../../components/DemandChart';
import StockDonutChart from '../../components/StockDonutChart';
import InsightCard from '../../components/InsightCard';
import { kpiCardsData, quickInsightsData, hospitalProfile } from '../../data/mockData';

export default function DashboardPage() {
  return (
    <div>
      {/* Welcome Section */}
      <div className="welcome-section">
        <div>
          <h1 className="welcome-title">Welcome, {hospitalProfile.name}</h1>
          <p className="welcome-subtitle">Here's the current status of your medicine supply.</p>
        </div>

        <div className="system-status-wrap">
          <div className="system-status-pill">
            <span className="status-dot-pulse" />
            <span>{hospitalProfile.systemStatus}</span>
          </div>
          <span className="status-last-updated">Last updated {hospitalProfile.lastUpdated}</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-cards-grid">
        {kpiCardsData.map((kpi) => (
          <KpiCard key={kpi.id} data={kpi} />
        ))}
      </div>

      {/* Analysis Grid: Demand Trend & Stock Status */}
      <div className="analysis-grid">
        <DemandChart />
        <StockDonutChart />
      </div>

      {/* Quick Insights Section */}
      <section className="quick-insights-section">
        <div className="section-label">
          <Lightbulb className="section-label-icon" size={19} strokeWidth={2.2} />
          <span>Quick insights</span>
        </div>

        <div className="insights-grid">
          {quickInsightsData.map((item) => (
            <InsightCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
