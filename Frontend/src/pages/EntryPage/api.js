// Mock API layer for Medical Supply Intelligence Entry Page
// Contains mock methods and required endpoint specifications

import {
  MOCK_MEDICINES,
  MOCK_HOSPITAL_PROFILE,
  INITIAL_RECENT_ENTRIES,
} from './constants';

let inMemoryMedicines = MOCK_MEDICINES.map((m) => ({ ...m, existingBatches: [...m.existingBatches] }));
let inMemoryEntries = [...INITIAL_RECENT_ENTRIES];

// GET /api/medicines
export async function getMedicines() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(inMemoryMedicines.map((m) => ({ ...m, existingBatches: [...m.existingBatches] })));
    }, 100);
  });
}

// GET /api/entries/recent
export async function getRecentEntries() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...inMemoryEntries]);
    }, 100);
  });
}

// GET /api/hospital/profile (mock helper for current signed-in user's facility)
export async function getHospitalProfile() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...MOCK_HOSPITAL_PROFILE });
    }, 100);
  });
}

// POST /api/entries
// Handles both 'Stock received' and 'Daily usage' records
export async function saveEntry(entryData) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const isStock = entryData.type === 'stock';
      const targetMed = inMemoryMedicines.find((m) => m.id === entryData.medicineId);
      const medName = targetMed ? targetMed.name.split(' (')[0] : 'Medicine';

      // Immutable state update for mock medicines
      inMemoryMedicines = inMemoryMedicines.map((med) => {
        if (med.id !== entryData.medicineId) return med;

        if (isStock) {
          const qty = Number(entryData.quantity || 0);
          const batches = entryData.batchId && !med.existingBatches.includes(entryData.batchId)
            ? [...med.existingBatches, entryData.batchId]
            : [...med.existingBatches];
          return {
            ...med,
            currentStock: med.currentStock + qty,
            existingBatches: batches,
          };
        } else {
          const used = Number(entryData.unitsUsed || 0);
          return {
            ...med,
            currentStock: Math.max(0, med.currentStock - used),
          };
        }
      });

      let newRecord;
      if (isStock) {
        newRecord = {
          id: `entry-${Date.now()}`,
          title: medName,
          time: 'Just now',
          pillText: `+${Number(entryData.quantity || 0).toLocaleString()} units received`,
          pillType: 'received',
          subtitle: `Batch #${entryData.batchId}`,
        };
      } else {
        newRecord = {
          id: `entry-${Date.now()}`,
          title: medName,
          time: 'Just now',
          pillText: `-${Number(entryData.unitsUsed || 0).toLocaleString()} units used`,
          pillType: 'used',
          subtitle: 'Ward clinical draw',
        };
      }

      inMemoryEntries = [newRecord, ...inMemoryEntries];

      resolve({
        success: true,
        message: 'Saved. The plan is updating.',
        entry: newRecord,
      });
    }, 150);
  });
}

// POST /api/requests
// Handles medicine tablet requests
export async function sendMedicineRequest(requestData) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const med = inMemoryMedicines.find((m) => m.id === requestData.medicineId);
      const medName = med ? med.name.split(' (')[0] : 'Medicine';

      const newRecord = {
        id: `req-${Date.now()}`,
        title: `Request: ${medName}`,
        time: 'Just now',
        pillText: `${Number(requestData.quantityRequired || 0).toLocaleString()} tablets · ${requestData.urgency}`,
        pillType: 'urgent',
        subtitle: `Needed by ${requestData.neededBy || 'soon'} · Looking for stock`,
      };

      inMemoryEntries = [newRecord, ...inMemoryEntries];

      resolve({
        success: true,
        message: 'Request sent. We are looking for hospitals that can help.',
        request: newRecord,
      });
    }, 150);
  });
}
