import { CheckIcon, ArrowForwardIcon } from './EntryIcons';

export default function NotificationBanner({ notification, onNavigate }) {
  if (!notification || !notification.message) {
    return null;
  }

  const isRequest = notification.type === 'request';
  const linkText = isRequest
    ? 'See it on the dashboard'
    : 'See what changed on the dashboard';

  const handleClick = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="entry-notification-banner" role="status">
      <div className="entry-notification-left">
        <div className="entry-notification-icon-circle">
          <CheckIcon size={18} />
        </div>
        <p className="entry-notification-text">{notification.message}</p>
      </div>

      <a
        href="#dashboard"
        onClick={handleClick}
        className="entry-notification-action-link"
      >
        {linkText}
        <ArrowForwardIcon size={16} />
      </a>
    </div>
  );
}
