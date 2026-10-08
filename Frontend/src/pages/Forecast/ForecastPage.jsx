import { BarChart2, Cpu } from 'lucide-react';

export default function ForecastPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon" style={{ position: 'relative' }}>
        <BarChart2 size={32} />
        <Cpu size={14} style={{ position: 'absolute', bottom: -2, right: -2, color: '#F59E0B' }} />
      </div>
      <h2>Demand Forecasting</h2>
      <p style={{ color: '#666', maxWidth: '400px', textAlign: 'center', lineHeight: 1.6 }}>
        AI-powered demand forecasting will appear here once the AI service (XGBoost model) is integrated.
      </p>
      <div style={{
        marginTop: '16px', padding: '10px 20px', borderRadius: '8px',
        background: '#FFF8E1', border: '1px solid #FFE082',
        fontSize: '0.82rem', color: '#F57F17', fontWeight: 500,
      }}>
        ⏳ AI service integration pending
      </div>
    </div>
  );
}
