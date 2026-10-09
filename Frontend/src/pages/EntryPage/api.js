/**
 * EntryPage/api.js
 * All API calls now go through the real backend via services/api.js.
 *
 * getMedicines        → GET /api/medicines?limit=100
 * getHospitalProfile  → GET /api/hospitals/1
 * getRecentEntries    → GET /api/entries/recent?hospital_id=1
 * saveEntry           → POST /api/entries  (stock or usage)
 * sendMedicineRequest → POST /api/requests
 */

import {
  fetchMedicines,
  fetchInventory,
  fetchHospitalById,
  fetchRecentEntries,
  createEntry,
  createRequest,
  getUser,
} from '../../services/api';

function getActiveHospitalId() {
  const user = getUser();
  return (user && user.hospital_id) ? parseInt(user.hospital_id, 10) : 1;
}

// ─────────────────────────────────────────────────────────────────
// GET medicines — shape backend rows for the entry forms
// ─────────────────────────────────────────────────────────────────
export async function getMedicines() {
  try {
    const hid = getActiveHospitalId();
    const [medsRes, invRes] = await Promise.all([
      fetchMedicines({ limit: 100 }),
      fetchInventory({ hospital_id: hid, limit: 100 }),
    ]);

    const stockMap = {};
    (invRes?.data || []).forEach((item) => {
      stockMap[String(item.medicine_id)] = parseFloat(item.quantity || 0);
    });

    return (medsRes?.data || []).map((med) => {
      const currentStock = stockMap[String(med.id)] !== undefined
        ? stockMap[String(med.id)]
        : 500; // fallback stock for newly selected catalog medicines

      return {
        id:                   String(med.id),
        name:                 med.name,
        unit:                 med.unit || 'units',
        currentStock,
        expectedDemand14Days: Math.round(currentStock * 1.5),
        usualRequestAmount:   100,
        existingBatches:      [],
      };
    });
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────
// GET hospital profile
// ─────────────────────────────────────────────────────────────────
export async function getHospitalProfile() {
  try {
    const res = await fetchHospitalById(getActiveHospitalId());
    const h = res.data;
    if (!h) throw new Error('No data');
    return {
      name:      h.name,
      shortName: h.name.split(' ').slice(0, 2).join(' '),
      beds:      h.patient_capacity ?? 0,
      location:  h.address ?? '',
      initial:   h.name[0]?.toUpperCase() ?? 'H',
    };
  } catch {
    return { name: 'Hospital', shortName: 'Hospital', beds: 0, location: '', initial: 'H' };
  }
}

// ─────────────────────────────────────────────────────────────────
// GET recent entries/activity
// ─────────────────────────────────────────────────────────────────
export async function getRecentEntries() {
  try {
    const res = await fetchRecentEntries({ hospital_id: getActiveHospitalId(), limit: 20 });
    return res.data || [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────
// POST stock received or daily usage
// ─────────────────────────────────────────────────────────────────
export async function saveEntry(entryData) {
  if (entryData.type === 'stock') {
    const res = await createEntry({
      type:        'stock',
      hospital_id: getActiveHospitalId(),
      medicine_id: parseInt(entryData.medicineId, 10),
      batch_id:    entryData.batchId,
      quantity:    entryData.quantity,
      expiry_date: entryData.expiryDate,
      date_received: entryData.dateReceived,
    });
    return {
      success: res.success,
      message: res.message || 'Stock saved.',
      entry:   res.data,
    };
  } else {
    // usage
    const res = await createEntry({
      type:            'usage',
      hospital_id:     getActiveHospitalId(),
      medicine_id:     parseInt(entryData.medicineId, 10),
      units_used:      entryData.unitsUsed,
      date:            entryData.date || new Date().toISOString().split('T')[0],
      emergency_cases: entryData.emergencyCases || 0,
      patient_load:    entryData.patientLoad || 0,
    });
    return {
      success: res.success,
      message: res.message || 'Usage saved.',
      entry:   res.data,
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// POST medicine request
// ─────────────────────────────────────────────────────────────────
export async function sendMedicineRequest(requestData) {
  const res = await createRequest({
    hospital_id:       getActiveHospitalId(),
    medicine_id:       parseInt(requestData.medicineId, 10),
    quantity_required: requestData.quantityRequired,
    needed_by:         requestData.neededBy,
    urgency:           requestData.urgency || 'Normal',
  });
  return {
    success: res.success,
    message: res.message || 'Request sent.',
    request: res.data,
  };
}
