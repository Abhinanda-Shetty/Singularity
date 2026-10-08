export default function HospitalProfileView({ profile }) {
  const hospital = profile || {
    name: 'Hospital A (Central General)',
    beds: 450,
    location: 'North District · Sector 4 Regional Grid',
  };

  return (
    <div className="entry-form-panel" id="tab-panel-profile">
      <div className="entry-form-header">
        <h2 className="entry-form-title">Hospital profile</h2>
        <p className="entry-form-description">
          Operational facility parameters for network balancing.
        </p>
      </div>

      <div className="entry-profile-grid">
        {/* Facility Name */}
        <div className="entry-profile-card">
          <span className="entry-profile-card-label">Facility Name</span>
          <span className="entry-profile-card-value">{hospital.name}</span>
          <span className="entry-profile-card-sub">Assigned healthcare facility</span>
        </div>

        {/* Total Active Beds */}
        <div className="entry-profile-card">
          <span className="entry-profile-card-label">Total Active Beds</span>
          <span className="entry-profile-card-metric">{hospital.beds}</span>
          <span className="entry-profile-card-sub">Certified inpatient beds</span>
        </div>

        {/* Location */}
        <div className="entry-profile-card">
          <span className="entry-profile-card-label">Facility Location</span>
          <span className="entry-profile-card-value">{hospital.location}</span>
          <span className="entry-profile-card-sub">Regional dispatch zone</span>
        </div>
      </div>
    </div>
  );
}
