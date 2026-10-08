'use strict';

const medicineDataset = require('./medicineDatasetService');

// Initial Hospitals
const hospitals = [
  {
    id: 1,
    name: 'City General Hospital',
    type: 'general',
    address: '101 Main Street, Mumbai, Maharashtra 400001',
    latitude: 19.076,
    longitude: 72.8777,
    patient_capacity: 500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Northern District Hospital',
    type: 'general',
    address: '45 North Road, Delhi 110001',
    latitude: 28.7041,
    longitude: 77.1025,
    patient_capacity: 350,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Rural Health Centre East',
    type: 'rural',
    address: 'Village Panchayat Road, Patna, Bihar 800001',
    latitude: 25.5941,
    longitude: 85.1376,
    patient_capacity: 80,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Cardiac Specialty Institute',
    type: 'specialty',
    address: '200 Heart Avenue, Bangalore, Karnataka 560001',
    latitude: 12.9716,
    longitude: 77.5946,
    patient_capacity: 200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'South Urban Medical Centre',
    type: 'urban',
    address: '78 Park Street, Chennai, Tamil Nadu 600001',
    latitude: 13.0827,
    longitude: 80.2707,
    patient_capacity: 450,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper to calculate date offsets
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Initial Inventory
let inventory = [
  { id: 1, hospital_id: 1, medicine_id: 1, quantity: 1200, safety_stock: 200, updated_at: new Date().toISOString() },
  { id: 2, hospital_id: 1, medicine_id: 2, quantity: 800,  safety_stock: 150, updated_at: new Date().toISOString() },
  { id: 3, hospital_id: 1, medicine_id: 3, quantity: 450,  safety_stock: 100, updated_at: new Date().toISOString() },
  { id: 4, hospital_id: 1, medicine_id: 4, quantity: 600,  safety_stock: 120, updated_at: new Date().toISOString() },
  { id: 5, hospital_id: 1, medicine_id: 5, quantity: 35,   safety_stock: 50,  updated_at: new Date().toISOString() }, // at-risk
  { id: 6, hospital_id: 1, medicine_id: 6, quantity: 120,  safety_stock: 40,  updated_at: new Date().toISOString() },
  { id: 7, hospital_id: 1, medicine_id: 7, quantity: 700,  safety_stock: 150, updated_at: new Date().toISOString() },
  { id: 8, hospital_id: 1, medicine_id: 8, quantity: 20,   safety_stock: 30,  updated_at: new Date().toISOString() }, // at-risk
  { id: 9, hospital_id: 2, medicine_id: 1, quantity: 500,  safety_stock: 100, updated_at: new Date().toISOString() },
  { id: 10, hospital_id: 2, medicine_id: 2, quantity: 300, safety_stock: 80,  updated_at: new Date().toISOString() },
];

// Initial Batches
let batches = [
  { id: 1, hospital_id: 1, medicine_id: 1, quantity: 500, expiry_date: daysFromNow(180), created_at: new Date().toISOString() },
  { id: 2, hospital_id: 1, medicine_id: 1, quantity: 700, expiry_date: daysFromNow(365), created_at: new Date().toISOString() },
  { id: 3, hospital_id: 1, medicine_id: 2, quantity: 400, expiry_date: daysFromNow(30),  created_at: new Date().toISOString() },
  { id: 4, hospital_id: 1, medicine_id: 2, quantity: 400, expiry_date: daysFromNow(200), created_at: new Date().toISOString() },
  { id: 5, hospital_id: 1, medicine_id: 5, quantity: 20,  expiry_date: daysFromNow(14),  created_at: new Date().toISOString() }, // Expiring soon
  { id: 6, hospital_id: 1, medicine_id: 5, quantity: 15,  expiry_date: daysFromNow(7),   created_at: new Date().toISOString() }, // Critical expiry
  { id: 7, hospital_id: 1, medicine_id: 8, quantity: 20,  expiry_date: daysFromNow(21),  created_at: new Date().toISOString() },
];

// Initial Demand History (last 30 days)
let demandHistory = [];
for (let i = 30; i >= 1; i--) {
  const date = daysFromNow(-i);
  demandHistory.push({
    id: 31 - i,
    hospital_id: 1,
    medicine_id: 1,
    date,
    consumption: Math.round(20 + Math.random() * 15),
    patient_load: Math.round(150 + Math.random() * 50),
    emergency_demand: Math.round(Math.random() * 5),
    created_at: new Date().toISOString(),
  });
}

// In-Memory Storage for Requests & Activity Logs
let requests = [];
let activityLog = [];

// ==========================================
// Data Operations
// ==========================================

function getHospitals({ type, limit = 20, offset = 0 } = {}) {
  let list = hospitals;
  if (type) {
    list = list.filter((h) => h.type.toLowerCase() === type.toLowerCase());
  }
  const total = list.length;
  const rows = list.slice(offset, offset + limit);
  return { rows, total };
}

function getHospitalById(id) {
  const numId = parseInt(id, 10);
  return hospitals.find((h) => h.id === numId) || null;
}

function getInventory({ hospital_id, medicine_id, limit = 100, offset = 0 } = {}) {
  let list = inventory;
  if (hospital_id) {
    list = list.filter((item) => item.hospital_id === parseInt(hospital_id, 10));
  }
  if (medicine_id) {
    list = list.filter((item) => item.medicine_id === parseInt(medicine_id, 10));
  }

  const enriched = list.map((item) => {
    const h = getHospitalById(item.hospital_id);
    const m = medicineDataset.findById(item.medicine_id) || { name: `Medicine #${item.medicine_id}`, unit: 'unit', category: 'General' };
    return {
      ...item,
      hospital_name: h ? h.name : 'Unknown Hospital',
      medicine_name: m.name,
      medicine_unit: m.unit,
      medicine_category: m.category,
    };
  });

  const total = enriched.length;
  const rows = enriched.slice(offset, offset + limit);
  return { rows, total };
}

function getBatches({ hospital_id, medicine_id, expiring_within_days, limit = 50, offset = 0 } = {}) {
  let list = batches;
  if (hospital_id) {
    list = list.filter((b) => b.hospital_id === parseInt(hospital_id, 10));
  }
  if (medicine_id) {
    list = list.filter((b) => b.medicine_id === parseInt(medicine_id, 10));
  }
  if (expiring_within_days !== undefined) {
    const days = parseInt(expiring_within_days, 10);
    const maxExpiry = daysFromNow(days);
    const today = daysFromNow(0);
    list = list.filter((b) => b.expiry_date >= today && b.expiry_date <= maxExpiry);
  }

  const enriched = list.map((b) => {
    const h = getHospitalById(b.hospital_id);
    const m = medicineDataset.findById(b.medicine_id) || { name: `Medicine #${b.medicine_id}`, unit: 'unit' };
    return {
      ...b,
      hospital_name: h ? h.name : 'Unknown Hospital',
      medicine_name: m.name,
      medicine_unit: m.unit,
    };
  });

  const total = enriched.length;
  const rows = enriched.slice(offset, offset + limit);
  return { rows, total };
}

function getDemandHistory({ hospital_id = 1, medicine_id, start_date, end_date, limit = 90 } = {}) {
  let list = demandHistory;
  if (hospital_id) {
    list = list.filter((d) => d.hospital_id === parseInt(hospital_id, 10));
  }
  if (medicine_id) {
    list = list.filter((d) => d.medicine_id === parseInt(medicine_id, 10));
  }
  if (start_date) {
    list = list.filter((d) => d.date >= start_date);
  }
  if (end_date) {
    list = list.filter((d) => d.date <= end_date);
  }

  const enriched = list.map((d) => {
    const h = getHospitalById(d.hospital_id);
    const m = medicineDataset.findById(d.medicine_id) || { name: `Medicine #${d.medicine_id}` };
    return {
      ...d,
      hospital_name: h ? h.name : '',
      medicine_name: m.name,
    };
  });

  return enriched.slice(0, limit);
}

function createRequest({ hospital_id, medicine_id, quantity_required, needed_by, urgency = 'Normal', notes }) {
  const id = requests.length + 1;
  const medicine = medicineDataset.findById(medicine_id) || { name: `Medicine #${medicine_id}` };
  const newReq = {
    id,
    hospital_id: parseInt(hospital_id, 10),
    medicine_id: parseInt(medicine_id, 10),
    quantity_required: parseFloat(quantity_required),
    needed_by,
    urgency,
    status: 'Pending',
    notes: notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  requests.unshift(newReq);

  // Activity Log
  activityLog.unshift({
    id: activityLog.length + 1,
    hospital_id: parseInt(hospital_id, 10),
    medicine_id: parseInt(medicine_id, 10),
    type: 'request',
    quantity: parseFloat(quantity_required),
    description: `Medicine request: ${quantity_required} ${medicine.name} (${urgency})`,
    created_at: new Date().toISOString(),
  });

  return newReq;
}

function getRequests({ hospital_id = 1, limit = 20 } = {}) {
  const filtered = requests.filter((r) => r.hospital_id === parseInt(hospital_id, 10));
  const enriched = filtered.map((r) => {
    const m = medicineDataset.findById(r.medicine_id) || { name: `Medicine #${r.medicine_id}`, unit: 'unit' };
    return {
      ...r,
      medicine_name: m.name,
      medicine_unit: m.unit,
    };
  });
  return enriched.slice(0, limit);
}

function recordStockReceived({ hospital_id = 1, medicine_id, batch_id, quantity, expiry_date, date_received }) {
  const hid = parseInt(hospital_id, 10);
  const mid = parseInt(medicine_id, 10);
  const qty = parseFloat(quantity);
  const medicine = medicineDataset.findById(mid) || { name: `Medicine #${mid}` };

  // Upsert inventory
  let inv = inventory.find((i) => i.hospital_id === hid && i.medicine_id === mid);
  if (inv) {
    inv.quantity = parseFloat(inv.quantity) + qty;
    inv.updated_at = new Date().toISOString();
  } else {
    inv = {
      id: inventory.length + 1,
      hospital_id: hid,
      medicine_id: mid,
      quantity: qty,
      safety_stock: Math.round(qty * 0.2),
      updated_at: new Date().toISOString(),
    };
    inventory.push(inv);
  }

  // Insert batch
  const newBatch = {
    id: batches.length + 1,
    batch_id: batch_id || `BATCH-${Date.now()}`,
    hospital_id: hid,
    medicine_id: mid,
    quantity: qty,
    expiry_date,
    created_at: new Date().toISOString(),
  };
  batches.push(newBatch);

  // Activity Log
  const act = {
    id: activityLog.length + 1,
    hospital_id: hid,
    medicine_id: mid,
    type: 'stock_received',
    quantity: qty,
    batch_id: batch_id || null,
    description: `Stock received: ${qty} units of ${medicine.name} (Batch: ${batch_id || 'N/A'})`,
    created_at: new Date().toISOString(),
  };
  activityLog.unshift(act);

  return { inventory: inv, batch: newBatch, activity: act };
}

function recordDailyUsage({ hospital_id = 1, medicine_id, units_used, date, emergency_cases = 0, patient_load = 0 }) {
  const hid = parseInt(hospital_id, 10);
  const mid = parseInt(medicine_id, 10);
  const used = parseFloat(units_used);
  const medicine = medicineDataset.findById(mid) || { name: `Medicine #${mid}` };

  // Deduct inventory
  let inv = inventory.find((i) => i.hospital_id === hid && i.medicine_id === mid);
  if (inv) {
    inv.quantity = Math.max(0, parseFloat(inv.quantity) - used);
    inv.updated_at = new Date().toISOString();
  }

  // Record in demand history
  const demandEntry = {
    id: demandHistory.length + 1,
    hospital_id: hid,
    medicine_id: mid,
    date: date || daysFromNow(0),
    consumption: used,
    patient_load: parseInt(patient_load, 10),
    emergency_demand: parseFloat(emergency_cases),
    created_at: new Date().toISOString(),
  };
  demandHistory.unshift(demandEntry);

  // Activity Log
  const act = {
    id: activityLog.length + 1,
    hospital_id: hid,
    medicine_id: mid,
    type: 'usage',
    quantity: used,
    description: `Daily usage recorded: ${used} units of ${medicine.name}`,
    created_at: new Date().toISOString(),
  };
  activityLog.unshift(act);

  return { inventory: inv, demand: demandEntry, activity: act };
}

function getRecentEntries({ hospital_id = 1, limit = 20 } = {}) {
  const filtered = activityLog.filter((a) => a.hospital_id === parseInt(hospital_id, 10));
  return filtered.slice(0, limit);
}

module.exports = {
  getHospitals,
  getHospitalById,
  getInventory,
  getBatches,
  getDemandHistory,
  createRequest,
  getRequests,
  recordStockReceived,
  recordDailyUsage,
  getRecentEntries,
};
