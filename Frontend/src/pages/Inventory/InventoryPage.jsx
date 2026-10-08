import { useState } from 'react';
import { Pill, ClipboardList, ArrowLeft } from 'lucide-react';
import EntryPage from '../EntryPage/EntryPage';

export default function InventoryPage() {
  const [viewEntryForm, setViewEntryForm] = useState(false);

  if (viewEntryForm) {
    return (
      <div className="inventory-entry-view-wrapper">
        <div style={{ marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setViewEntryForm(false)}
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
            Back to Inventory Overview
          </button>
        </div>
        <EntryPage />
      </div>
    );
  }

  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">
        <Pill size={32} />
      </div>
      <h2>Inventory Management</h2>
      <p>Inventory page coming soon.</p>
      <div style={{ marginTop: '20px' }}>
        <button
          type="button"
          onClick={() => setViewEntryForm(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: '#1F4D3A',
            color: '#ffffff',
            borderRadius: '9999px',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ClipboardList size={18} />
          Open Stock &amp; Medicine Entry
        </button>
      </div>
    </div>
  );
}
