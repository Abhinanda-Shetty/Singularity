import { useState, useEffect } from 'react';
import '../../components/entry/entry.css';
import TopBar from '../../components/entry/TopBar';
import NotificationBanner from '../../components/entry/NotificationBanner';
import TabBar from '../../components/entry/TabBar';
import StockReceivedForm from '../../components/entry/StockReceivedForm';
import DailyUsageForm from '../../components/entry/DailyUsageForm';
import RequestTabletsForm from '../../components/entry/RequestTabletsForm';
import HospitalProfileView from '../../components/entry/HospitalProfileView';
import RecentEntriesCard from '../../components/entry/RecentEntriesCard';
import { LeafIcon } from '../../components/entry/EntryIcons';
import {
  MOCK_MEDICINES,
  MOCK_HOSPITAL_PROFILE,
  INITIAL_RECENT_ENTRIES,
} from './constants';
import {
  getMedicines,
  getRecentEntries,
  getHospitalProfile,
  saveEntry,
  sendMedicineRequest,
} from './api';

export default function EntryPage({ onNavigate }) {
  // Four tabs: 'stock', 'usage', 'request', 'profile'
  const [activeTab, setActiveTab] = useState('request');

  // Initialize with initial constants to ensure synchronous availability on mount
  const [medicines, setMedicines] = useState(MOCK_MEDICINES);
  const [recentEntries, setRecentEntries] = useState(INITIAL_RECENT_ENTRIES);
  const [hospitalProfile, setHospitalProfile] = useState(MOCK_HOSPITAL_PROFILE);

  // Notification state - initialized to match design screenshot
  const [notification, setNotification] = useState({
    type: 'request',
    message: 'Request sent. We are looking for hospitals that can help.',
  });

  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      const [medsData, entriesData, profileData] = await Promise.all([
        getMedicines(),
        getRecentEntries(),
        getHospitalProfile(),
      ]);
      if (isMounted) {
        setMedicines(medsData);
        setRecentEntries(entriesData);
        setHospitalProfile(profileData);
      }
    }
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Submission handler for stock, daily usage and request forms
  const handleFormSubmit = async (submission) => {
    if (submission.type === 'request') {
      const result = await sendMedicineRequest(submission);
      setNotification({
        type: 'request',
        message: result.message,
      });
      // Refresh entries & medicines
      const updatedEntries = await getRecentEntries();
      setRecentEntries(updatedEntries);
    } else {
      const result = await saveEntry(submission);
      setNotification({
        type: 'entry',
        message: result.message,
      });
      // Refresh entries & medicines
      const [updatedEntries, updatedMeds] = await Promise.all([
        getRecentEntries(),
        getMedicines(),
      ]);
      setRecentEntries(updatedEntries);
      setMedicines(updatedMeds);
    }
  };

  return (
    <div className="entry-page-wrapper">
      {/* Top Header Navigation */}
      <TopBar
        hospitalName={hospitalProfile.shortName}
        onNavigate={onNavigate}
      />

      {/* Main Workspace Area */}
      <main className="entry-main-content">
        <div className="entry-layout-container">
          {/* Notification Banner */}
          <NotificationBanner
            notification={notification}
            onNavigate={onNavigate}
          />

          {/* Header Block */}
          <div className="entry-page-header">
            <h1 className="entry-page-title">Enter your hospital's data</h1>
            <p className="entry-page-subtitle">
              Save your numbers and the plan updates on its own.
            </p>
          </div>

          {/* Main 2-Column Workspace Grid */}
          <div className="entry-workspace-grid">
            {/* Primary Data Entry Column (8 cols) */}
            <div className="entry-form-column">
              {/* Main Form Card containing TabBar, Active Form, and Friendly Info Banner */}
              <div className="entry-card">
                <TabBar
                  activeTab={activeTab}
                  onSelectTab={(tabId) => setActiveTab(tabId)}
                />

                {/* Tab 1: Stock Received Form */}
                {activeTab === 'stock' && (
                  <StockReceivedForm
                    medicines={medicines}
                    onSubmitSuccess={handleFormSubmit}
                  />
                )}

                {/* Tab 2: Daily Usage Form */}
                {activeTab === 'usage' && (
                  <DailyUsageForm
                    medicines={medicines}
                    onSubmitSuccess={handleFormSubmit}
                  />
                )}

                {/* Tab 3: Request Tablets Form */}
                {activeTab === 'request' && (
                  <RequestTabletsForm
                    medicines={medicines}
                    onSubmitSuccess={handleFormSubmit}
                  />
                )}

                {/* Tab 4: Hospital Profile (Read-Only) */}
                {activeTab === 'profile' && (
                  <HospitalProfileView profile={hospitalProfile} />
                )}

                {/* Bottom Friendly Info Banner */}
                <div className="entry-friendly-banner">
                  <div className="entry-friendly-icon-circle">
                    <LeafIcon size={18} />
                  </div>
                  <p className="entry-friendly-text">
                    <strong>No other steps are needed.</strong> We forecast demand and suggest transfers for you.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Recent Activity & Help Tip (4 cols) */}
            <RecentEntriesCard
              entries={recentEntries}
              hospitalName={hospitalProfile.shortName}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="entry-footer">
        <div className="entry-footer-inner">
          <p className="entry-footer-text">
            Medical Supply Intelligence · Automatic hospital stock balancing
          </p>
        </div>
      </footer>
    </div>
  );
}
