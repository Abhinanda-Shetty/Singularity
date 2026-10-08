import { Fragment } from 'react';
import { QrCodeIcon } from './EntryIcons';

export default function RecentEntriesCard({ entries = [], hospitalName = 'Hospital A' }) {
  // Show the most recent 5 items
  const displayEntries = entries.slice(0, 5);

  return (
    <div className="entry-sidebar-column">
      {/* Recent Entries Card */}
      <div className="entry-recent-card">
        <div className="entry-recent-header">
          <div className="entry-recent-title-row">
            <h2 className="entry-recent-title">Your recent entries and requests</h2>
            <span className="entry-pulse-dot" title="Live sync" />
          </div>
          <p className="entry-recent-subtitle">
            Recent updates logged for {hospitalName}
          </p>
        </div>

        <div className="entry-recent-list">
          {displayEntries.map((item, index) => {
            const isReceived = item.pillType === 'received';
            const dotColor = isReceived ? 'var(--entry-success-green)' : 'var(--entry-warning-text)';

            return (
              <Fragment key={item.id || index}>
                <div className="entry-recent-item">
                  <div className="entry-recent-item-top">
                    <span className="entry-recent-item-name">{item.title}</span>
                    <span className="entry-recent-item-time">{item.time}</span>
                  </div>

                  <div className="entry-recent-item-bottom">
                    <span className={`entry-recent-pill ${item.pillType || 'received'}`}>
                      <span className="entry-pill-dot" style={{ backgroundColor: dotColor }} />
                      {item.pillText}
                    </span>
                    <span className="entry-recent-item-desc">{item.subtitle}</span>
                  </div>
                </div>
                {index < displayEntries.length - 1 && (
                  <div className="entry-recent-divider" />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Short Tip Box */}
      <div className="entry-tip-box">
        <div className="entry-tip-icon-circle">
          <QrCodeIcon size={18} />
        </div>
        <div className="entry-tip-content">
          <span className="entry-tip-title">Need help with batch formats?</span>
          <p className="entry-tip-text">Batch ID is printed on the medicine box.</p>
        </div>
      </div>
    </div>
  );
}
