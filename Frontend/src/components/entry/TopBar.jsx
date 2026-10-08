import { VitalSignsIcon, PersonIcon } from './EntryIcons';

export default function TopBar({ hospitalName = 'Hospital A', onNavigate }) {
  const handleNav = (target, e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(target);
    }
  };

  return (
    <header className="entry-header">
      <div className="entry-header-inner">
        {/* Brand / Logo */}
        <div className="entry-brand">
          <div className="entry-brand-icon">
            <VitalSignsIcon size={20} />
          </div>
          <span className="entry-brand-title">Medical Supply Intelligence</span>
        </div>

        {/* Right Section: Signed In Badge, Nav Links, Avatar */}
        <div className="entry-header-right">
          <div className="entry-hospital-badge">
            <div className="entry-hospital-avatar-letter">
              {hospitalName ? hospitalName.charAt(0).toUpperCase() : 'H'}
            </div>
            <span className="entry-hospital-name-text">
              {hospitalName}, signed in
            </span>
          </div>

          <nav className="entry-nav">
            <a
              href="#dashboard"
              onClick={(e) => handleNav('dashboard', e)}
              className="entry-nav-link entry-nav-link-primary"
            >
              Back to dashboard
            </a>
            <a
              href="#sign-out"
              onClick={(e) => handleNav('sign-out', e)}
              className="entry-nav-link entry-nav-link-secondary"
            >
              Sign out
            </a>
          </nav>

          <div className="entry-user-avatar" title="Signed in user">
            <PersonIcon size={18} />
          </div>
        </div>
      </div>
    </header>
  );
}
