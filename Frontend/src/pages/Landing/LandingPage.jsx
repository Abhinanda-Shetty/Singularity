import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Background organic leaf accents */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '400px',
          height: '400px',
          pointerEvents: 'none',
          opacity: 0.5,
          zIndex: 0
        }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M400 0C320 80 280 200 320 300C340 350 380 390 400 400V0Z" fill="#DDE8DA" />
          <path d="M400 0C280 120 220 250 260 380L400 400V0Z" fill="#EEF5ED" />
        </svg>
      </div>

      <header className="landing-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1F4D3A' }}>MedSupply</span>
          </div>
        </div>

        <button 
          onClick={() => navigate('/login')}
          className="btn-primary"
          style={{ padding: '8px 22px', fontSize: '0.88rem' }}
        >
          Login
        </button>
      </header>

      <main className="landing-body" style={{ zIndex: 1 }}>
        <span className="landing-tagline">Medical Supply Intelligence</span>
        <h1 className="landing-title">Know before the shortage.</h1>
        <p className="landing-description">
          Real-time hospital medicine supply monitoring, demand forecasting, and inventory risk detection in one calm, unified portal.
        </p>

        <button 
          onClick={() => navigate('/login')}
          className="btn-primary"
          style={{ padding: '14px 34px', fontSize: '1.05rem', borderRadius: '12px' }}
        >
          Access Portal <ArrowRight size={18} />
        </button>
      </main>
    </div>
  );
}
