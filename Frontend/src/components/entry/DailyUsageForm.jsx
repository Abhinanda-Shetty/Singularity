import { useState } from 'react';
import { ExpandMoreIcon, InfoIcon, WarningIcon } from './EntryIcons';

export default function DailyUsageForm({ medicines = [], onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    medicineId: '',
    unitsUsed: '180',
    date: new Date().toISOString().split('T')[0],
    emergencyCases: '',
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
      unitsUsed: '',
      date: new Date().toISOString().split('T')[0],
      emergencyCases: '',
    });
    setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = [];
    const medicineIdToSubmit = activeMedicineId;

    // Validation: no empty fields (emergencyCases is optional)
    if (!medicineIdToSubmit || !formData.unitsUsed || !formData.date) {
      newErrors.push('Medicine, units used, and date are required.');
    }

    // Validation: non-negative
    const usedNum = Number(formData.unitsUsed);
    if (isNaN(usedNum) || usedNum <= 0) {
      newErrors.push('Units used must be greater than zero.');
    }

    if (formData.emergencyCases && Number(formData.emergencyCases) < 0) {
      newErrors.push('Emergency cases cannot be negative.');
    }

    // Validation: cannot use more than stock
    if (selectedMedicine && usedNum > selectedMedicine.currentStock) {
      newErrors.push('You cannot use more than the stock you have.');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitSuccess({
        type: 'usage',
        medicineId: medicineIdToSubmit,
        unitsUsed: usedNum,
        date: formData.date,
        emergencyCases: formData.emergencyCases ? Number(formData.emergencyCases) : 0,
      });

      handleClear();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="entry-form-panel" id="tab-panel-usage">
      <div className="entry-form-header">
        <h2 className="entry-form-title">Record daily usage</h2>
        <p className="entry-form-description">
          Submit dispensed medical stock for clinical shifts.
        </p>
      </div>

      <form className="entry-form" onSubmit={handleSubmit}>
        {/* Medicine Select */}
        <div className="entry-form-field">
          <label className="entry-label" htmlFor="usage-medicine-select">
            Medicine
          </label>
          <div className="entry-input-wrapper">
            <select
              id="usage-medicine-select"
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
          {selectedMedicine && (
            <span className="entry-field-helper">
              Current available stock: {selectedMedicine.currentStock.toLocaleString()} {selectedMedicine.unit}
            </span>
          )}
        </div>

        {/* Units Used & Emergency Cases */}
        <div className="entry-grid-2">
          <div className="entry-form-field">
            <label className="entry-label" htmlFor="usage-units-used">
              Units used today
            </label>
            <div className="entry-input-wrapper">
              <input
                id="usage-units-used"
                type="number"
                min="1"
                className="entry-input"
                value={formData.unitsUsed}
                onChange={(e) => handleChange('unitsUsed', e.target.value)}
              />
              <span className="entry-input-adornment-right">
                {selectedMedicine ? selectedMedicine.unit : 'units'}
              </span>
            </div>
          </div>

          <div className="entry-form-field">
            <label className="entry-label" htmlFor="usage-emergency-cases">
              Emergency cases today (optional)
            </label>
            <div className="entry-input-wrapper">
              <input
                id="usage-emergency-cases"
                type="number"
                min="0"
                placeholder="e.g. 14"
                className="entry-input"
                value={formData.emergencyCases}
                onChange={(e) => handleChange('emergencyCases', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Date Field */}
        <div className="entry-form-field">
          <label className="entry-label" htmlFor="usage-date">
            Usage date
          </label>
          <div className="entry-input-wrapper">
            <input
              id="usage-date"
              type="date"
              className="entry-input"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
            />
          </div>
        </div>

        {/* Stock Constraint Info Callout */}
        <div className="entry-info-callout">
          <InfoIcon size={18} />
          <span className="entry-field-helper">
            You cannot use more than the stock you have.
          </span>
        </div>

        {/* Validation Errors Box */}
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
            {isSubmitting ? 'Saving...' : 'Save usage'}
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
