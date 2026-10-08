import { useState } from 'react';
import {
  ExpandMoreIcon,
  CalendarIcon,
  CheckIcon,
  SendIcon,
  WarningIcon,
} from './EntryIcons';

export default function RequestTabletsForm({ medicines = [], onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    medicineId: '',
    quantityRequired: '1600',
    neededBy: '2025-10-12',
    urgency: 'Urgent',
  });

  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive active medicine ID gracefully without cascading effect
  const activeMedicineId = formData.medicineId || (medicines[0]?.id ?? '');
  const selectedMedicine = medicines.find((m) => m.id === activeMedicineId) || medicines[0];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors([]);
  };

  const handleClear = () => {
    setFormData({
      medicineId: '',
      quantityRequired: '',
      neededBy: '',
      urgency: 'Normal',
    });
    setErrors([]);
  };

  // Determine warnings
  const qtyNumber = Number(formData.quantityRequired || 0);
  const usualAmount = selectedMedicine?.usualRequestAmount || 160;
  const isTenTimesUsual = qtyNumber > 0 && qtyNumber >= usualAmount * 10;

  // Local timezone date check
  const isNeededByInPast = () => {
    if (!formData.neededBy) return false;
    const [y, m, d] = formData.neededBy.split('-').map(Number);
    if (!y || !m || !d) return false;
    const needed = new Date(y, m - 1, d, 0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return needed < today;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = [];
    const medicineIdToSubmit = activeMedicineId;

    if (!medicineIdToSubmit || !formData.quantityRequired || !formData.neededBy || !formData.urgency) {
      newErrors.push('All fields are required.');
    }

    if (isNaN(qtyNumber) || qtyNumber <= 0) {
      newErrors.push('Quantity required must be greater than zero.');
    }

    if (isNeededByInPast()) {
      newErrors.push('Needed-by date cannot be in the past.');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitSuccess({
        type: 'request',
        medicineId: medicineIdToSubmit,
        quantityRequired: qtyNumber,
        neededBy: formData.neededBy,
        urgency: formData.urgency,
      });

      handleClear();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="entry-form-panel" id="tab-panel-request">
      <div className="entry-form-header">
        <h2 className="entry-form-title">Request medicine tablets</h2>
        <p className="entry-form-description">
          Tell the network what your hospital needs and nearby facilities will be checked automatically.
        </p>
      </div>

      <form className="entry-form" onSubmit={handleSubmit}>
        {/* Medicine Select */}
        <div className="entry-form-field">
          <label className="entry-label" htmlFor="request-medicine-select">
            Medicine
          </label>
          <div className="entry-input-wrapper">
            <select
              id="request-medicine-select"
              className="entry-select"
              value={activeMedicineId}
              onChange={(e) => handleChange('medicineId', e.target.value)}
            >
              {medicines.map((med) => (
                <option key={med.id} value={med.id}>
                  {med.name}
                </option>
              ))}
            </select>
            <span className="entry-input-adornment-right">
              <ExpandMoreIcon size={20} />
            </span>
          </div>

          {/* Helper line using mock numbers from constants.js */}
          <span className="entry-field-helper">
            {selectedMedicine
              ? `You have ${selectedMedicine.currentStock.toLocaleString()} in stock. We expect you to need ${selectedMedicine.expectedDemand14Days.toLocaleString()} in the next 14 days.`
              : 'You have 1,200 in stock. We expect you to need 2,800 in the next 14 days.'}
          </span>
        </div>

        {/* Tablets Required */}
        <div className="entry-form-field">
          <label className="entry-label" htmlFor="request-tablets-required">
            Tablets required
          </label>
          <div className="entry-input-wrapper">
            <input
              id="request-tablets-required"
              type="number"
              min="1"
              className="entry-input entry-input-metric"
              value={formData.quantityRequired}
              onChange={(e) => handleChange('quantityRequired', e.target.value)}
            />
            <span className="entry-input-adornment-right">
              tablets
            </span>
          </div>
          <span className="entry-field-helper">
            Total amount you need, not what you already have.
          </span>

          {/* Plain Validation Warning Box */}
          {(isTenTimesUsual || isNeededByInPast()) && (
            <div className="entry-validation-warning-box">
              <span className="entry-validation-warning-icon">
                <WarningIcon size={20} />
              </span>
              <div className="entry-validation-warning-content">
                {isTenTimesUsual && (
                  <p className="entry-validation-warning-heading">
                    This is 10 times your usual amount. Please check it.
                  </p>
                )}
                {isNeededByInPast() && (
                  <p className="entry-validation-warning-sub">
                    Needed-by date cannot be in the past.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Needed By Date */}
        <div className="entry-form-field">
          <label className="entry-label" htmlFor="request-needed-by-date">
            Needed by
          </label>
          <div className="entry-input-wrapper">
            <input
              id="request-needed-by-date"
              type="date"
              className="entry-input"
              value={formData.neededBy}
              onChange={(e) => handleChange('neededBy', e.target.value)}
            />
            <span className="entry-input-adornment-right">
              <CalendarIcon size={20} />
            </span>
          </div>
          <span className="entry-field-helper">
            The date your ward requires supplies delivered.
          </span>
        </div>

        {/* Urgency Choice Chips */}
        <div className="entry-form-field">
          <label className="entry-label">Urgency</label>
          <div className="entry-urgency-grid">
            <button
              type="button"
              className={`entry-urgency-chip ${formData.urgency === 'Normal' ? 'selected-normal' : ''}`}
              onClick={() => handleChange('urgency', 'Normal')}
            >
              <span className="entry-chip-dot" style={{ backgroundColor: 'var(--entry-primary)' }} />
              Normal
            </button>

            <button
              type="button"
              className={`entry-urgency-chip ${formData.urgency === 'Urgent' ? 'selected-urgent' : ''}`}
              onClick={() => handleChange('urgency', 'Urgent')}
            >
              {formData.urgency === 'Urgent' ? (
                <CheckIcon size={16} />
              ) : (
                <span className="entry-chip-dot" style={{ backgroundColor: 'var(--entry-warning-text)' }} />
              )}
              Urgent
            </button>

            <button
              type="button"
              className={`entry-urgency-chip ${formData.urgency === 'Critical' ? 'selected-critical' : ''}`}
              onClick={() => handleChange('urgency', 'Critical')}
            >
              <span className="entry-chip-dot" style={{ backgroundColor: 'var(--entry-critical-text)' }} />
              Critical
            </button>
          </div>
        </div>

        {/* Form level error display if any */}
        {errors.length > 0 && (
          <div className="entry-validation-warning-box">
            <span className="entry-validation-warning-icon">
              <WarningIcon size={20} />
            </span>
            <div className="entry-validation-warning-content">
              {errors.map((err, idx) => (
                <p key={idx} className="entry-validation-warning-heading">
                  {err}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Action Row */}
        <div className="entry-form-actions">
          <button
            type="submit"
            className="entry-btn-primary"
            disabled={isSubmitting}
          >
            <SendIcon size={20} />
            {isSubmitting ? 'Sending...' : 'Send request'}
          </button>
          <button
            type="button"
            className="entry-btn-secondary"
            onClick={handleClear}
          >
            Clear form
          </button>
        </div>
      </form>
    </div>
  );
}
