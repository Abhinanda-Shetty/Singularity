import {
  MoveToInboxIcon,
  OutboxIcon,
  MedicationIcon,
  LocalHospitalIcon,
} from './EntryIcons';

const TABS = [
  { id: 'stock', label: 'Stock received', icon: MoveToInboxIcon },
  { id: 'usage', label: 'Daily usage', icon: OutboxIcon },
  { id: 'request', label: 'Request tablets', icon: MedicationIcon },
  { id: 'profile', label: 'Hospital profile', icon: LocalHospitalIcon },
];

export default function TabBar({ activeTab, onSelectTab }) {
  return (
    <div className="entry-tab-bar" role="tablist">
      {TABS.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`tab-btn-${tab.id}`}
            role="tab"
            aria-selected={isActive}
            type="button"
            className={`entry-tab-button ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
          >
            <IconComponent size={18} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
