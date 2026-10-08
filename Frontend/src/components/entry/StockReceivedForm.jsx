import { useState } from 'react';
import { ExpandMoreIcon, WarningIcon } from './EntryIcons';

export default function StockReceivedForm({ medicines = [], onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    medicineId: '',
    batchId: '',
    quantity: '',
    expiryDate: '',
    dateReceived: new Date().toISOString().split('T')[0],
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
      batchId: '',
      quantity: '',
      expiryDate: '',
      dateReceived: new Date().toISOString().split('T')[0],
    });
    setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = [];
    const medicineIdToSubmit = activeMedicineId;

    // Validation: no empty fields
    if (!medicineIdToSubmit || !formData.batchId.trim() || !formData.quantity || !formData.expiryDate || !formData.dateReceived) {
      newErrors.push('All fields are required.');
    }

    // Validation: no negatives or zero quantity
    const qtyNum = Number(formData.quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      newErrors.push('Quantity must be greater than zero.');
    }

    // Validation: expiry date not in the past (parsed in local timezone to avoid UTC shifts)
    if (formData.expiryDate) {
      const [y, m, d] = formData.expiryDate.split('-').map(Number);
      if (y && m && d) {
        const expDate = new Date(y, m - 1, d, 0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expDate < today) {
          newErrors.push('Expiry date cannot be in the past.');
        }
      }
    }

    // Validation: batch ID uniqueness
    if (formData.batchId.trim() && selectedMedicine) {
      const cleanBatch = formData.batchId.trim().toUpperCase();
      if (selectedMedicine.existingBatches?.some((b) => b.toUpperCase() === cleanBatch)) {
        newErrors.push('This batch ID already exists.');
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitSuccess({
        type: 'stock',
        medicineId: medicineIdToSubmit,
        batchId: formData.batchId.trim().toUpperCase(),
        quantity: qtyNum,
        expiryDate: formData.expiryDate,
        dateReceived: formData.dateReceived,
      });

      handleClear();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="entry-form-panel" id="tab-panel-stock">
      <div className="entry-form-header">
        <h2 className="entry-form-title">Stock received</h2>
        <p className="entry-form-description">
          Log incoming medical supplies and batch receipts.
        </p>
      </div>

      <form className="entry-form" onSubmit={handleSubmit}>
        {/* Medicine Select */}
        <div className="entry-form-field">
          <label className="entry-label" htmlFor="stock-medicine-select">
            Medicine
          </label>
          <div className="entry-input-wrapper">
            <select
              id="stock-medicine-select"
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
              Current stock on record: {selectedMedicine.currentStock.toLocaleString()} {selectedMedicine.unit}
            </span>
          )}
        </div>

        {/* Batch ID & Quantity */}
        <div className="entry-grid-2">
          <div className="entry-form-field">
            <label className="entry-label" htmlFor="stock-batch-id">
              Batch ID
            </label>
            <div className="entry-input-wrapper">
              <input
                id="stock-batch-id"
                type="text"
                placeholder="e.g. AMX-8102"
                className="entry-input"
                value={formData.batchId}
                onChange={(e) => handleChange('batchId', e.target.value)}
              />
            </div>
            <span className="entry-field-helper">
              Printed on the packaging or manufacturer stamp.
            </span>
          </div>

          <div className="entry-form-field">
            <label className="entry-label" htmlFor="stock-quantity">
              Quantity received
            </label>
            <div className="entry-input-wrapper">
              <input
                id="stock-quantity"
                type="number"
                min="1"
                placeholder="e.g. 2000"
                className="entry-input"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
              />
              <span className="entry-input-adornment-right">
                {selectedMedicine ? selectedMedicine.unit : 'units'}
              </span>
            </div>
            <span className="entry-field-helper">
              Units received into local facility stock.
            </span>
          </div>
        </div>

        {/* Expiry Date & Date Received */}
        <div className="entry-grid-2">
          <div className="entry-form-field">
            <label className="entry-label" htmlFor="stock-expiry-date">
              Expiry date
            </label>
            <div className="entry-input-wrapper">
              <input
                id="stock-expiry-date"
                type="date"
                className="entry-input"
                value={formData.expiryDate}
                onChange={(e) => handleChange('expiryDate', e.target.value)}
              />
            </div>
            <span className="entry-field-helper">
              Batch expiration date indicated by supplier.
            </span>
          </div>

          <div className="entry-form-field">
            <label className="entry-label" htmlFor="stock-date-received">
              Date received
            </label>
            <div className="entry-input-wrapper">
              <input
                id="stock-date-received"
                type="date"
                className="entry-input"
                value={formData.dateReceived}
                onChange={(e) => handleChange('dateReceived', e.target.value)}
              />
            </div>
            <span className="entry-field-helper">
              Date physical inventory arrived at ward.
            </span>
          </div>
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
            {isSubmitting ? 'Saving...' : 'Save stock received'}
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
