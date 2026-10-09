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

// Initial Inventory across all 5 hospitals with varied Indian medicines
let inventory = [
  // Hospital 1 - City General Hospital (Urban, Large)
  { id: 1, hospital_id: 1, medicine_id: 1, quantity: 1200, safety_stock: 200, updated_at: new Date().toISOString() }, // Augmentin (Surplus)
  { id: 2, hospital_id: 1, medicine_id: 2, quantity: 800,  safety_stock: 150, updated_at: new Date().toISOString() }, // Azithral (Surplus)
  { id: 3, hospital_id: 1, medicine_id: 3, quantity: 450,  safety_stock: 100, updated_at: new Date().toISOString() }, // Ascoril LS
  { id: 4, hospital_id: 1, medicine_id: 4, quantity: 600,  safety_stock: 120, updated_at: new Date().toISOString() }, // Allegra 120
  { id: 5, hospital_id: 1, medicine_id: 5, quantity: 35,   safety_stock: 50,  updated_at: new Date().toISOString() }, // Avil 25 (Critical Deficit)
  { id: 6, hospital_id: 1, medicine_id: 6, quantity: 120,  safety_stock: 40,  updated_at: new Date().toISOString() }, // Aciloc 150
  { id: 7, hospital_id: 1, medicine_id: 7, quantity: 700,  safety_stock: 150, updated_at: new Date().toISOString() }, // Atorva 20
  { id: 8, hospital_id: 1, medicine_id: 8, quantity: 20,   safety_stock: 30,  updated_at: new Date().toISOString() }, // Amlokind 5 (Critical Deficit)
  { id: 9, hospital_id: 1, medicine_id: 9, quantity: 950,  safety_stock: 180, updated_at: new Date().toISOString() }, // Glycomet 500
  { id: 10, hospital_id: 1, medicine_id: 10, quantity: 400, safety_stock: 80, updated_at: new Date().toISOString() }, // Pan 40
  { id: 11, hospital_id: 1, medicine_id: 11, quantity: 1500, safety_stock: 250, updated_at: new Date().toISOString() }, // Calpol 650
  { id: 12, hospital_id: 1, medicine_id: 12, quantity: 18,  safety_stock: 60, updated_at: new Date().toISOString() }, // Dolo 650 (Critical Deficit)

  // Hospital 2 - Northern District Hospital (Semi-Urban)
  { id: 13, hospital_id: 2, medicine_id: 1, quantity: 50,  safety_stock: 150, updated_at: new Date().toISOString() }, // Augmentin (Needs Transfer!)
  { id: 14, hospital_id: 2, medicine_id: 2, quantity: 65,  safety_stock: 120, updated_at: new Date().toISOString() }, // Azithral (Needs Transfer!)
  { id: 15, hospital_id: 2, medicine_id: 3, quantity: 500, safety_stock: 90,  updated_at: new Date().toISOString() }, // Ascoril LS
  { id: 16, hospital_id: 2, medicine_id: 5, quantity: 300, safety_stock: 40,  updated_at: new Date().toISOString() }, // Avil 25 (Donor Surplus)
  { id: 17, hospital_id: 2, medicine_id: 8, quantity: 450, safety_stock: 50,  updated_at: new Date().toISOString() }, // Amlokind 5 (Donor Surplus)
  { id: 18, hospital_id: 2, medicine_id: 9, quantity: 40,  safety_stock: 100, updated_at: new Date().toISOString() }, // Glycomet (Deficit)

  // Hospital 3 - Rural Health Centre East (Rural)
  { id: 19, hospital_id: 3, medicine_id: 1, quantity: 25,  safety_stock: 80,  updated_at: new Date().toISOString() }, // Augmentin (Deficit)
  { id: 20, hospital_id: 3, medicine_id: 6, quantity: 380, safety_stock: 40,  updated_at: new Date().toISOString() }, // Aciloc (Surplus)
  { id: 21, hospital_id: 3, medicine_id: 11, quantity: 45, safety_stock: 120, updated_at: new Date().toISOString() }, // Calpol (Deficit)
  { id: 22, hospital_id: 3, medicine_id: 12, quantity: 500, safety_stock: 50, updated_at: new Date().toISOString() }, // Dolo (Donor Surplus)

  // Hospital 4 - Cardiac Specialty Institute (Specialty)
  { id: 23, hospital_id: 4, medicine_id: 7, quantity: 850, safety_stock: 120, updated_at: new Date().toISOString() }, // Atorva (Surplus)
  { id: 24, hospital_id: 4, medicine_id: 8, quantity: 720, safety_stock: 100, updated_at: new Date().toISOString() }, // Amlokind (Surplus)
  { id: 25, hospital_id: 4, medicine_id: 1, quantity: 40,  safety_stock: 80,  updated_at: new Date().toISOString() }, // Augmentin (Deficit)

  // Hospital 5 - South Urban Medical Centre (Urban)
  { id: 26, hospital_id: 5, medicine_id: 2, quantity: 600, safety_stock: 100, updated_at: new Date().toISOString() }, // Azithral (Surplus)
  { id: 27, hospital_id: 5, medicine_id: 4, quantity: 450, safety_stock: 80,  updated_at: new Date().toISOString() }, // Allegra
  { id: 28, hospital_id: 5, medicine_id: 10, quantity: 20, safety_stock: 70,  updated_at: new Date().toISOString() }, // Pan 40 (Deficit)
];

// Initial Batches with EXPIRED, CRITICAL, and HEALTHY expiry dates
let batches = [
  // Expired Batches (Action Required: Quarantine & Remove)
  { id: 1, hospital_id: 1, medicine_id: 5, batch_number: 'B-EXP-2024A', quantity: 25,  expiry_date: daysFromNow(-8),  created_at: new Date().toISOString() }, // EXPIRED 8 days ago
  { id: 2, hospital_id: 1, medicine_id: 8, batch_number: 'B-EXP-2024B', quantity: 15,  expiry_date: daysFromNow(-3),  created_at: new Date().toISOString() }, // EXPIRED 3 days ago
  { id: 3, hospital_id: 2, medicine_id: 1, batch_number: 'B-EXP-2024C', quantity: 30,  expiry_date: daysFromNow(-15), created_at: new Date().toISOString() }, // EXPIRED 15 days ago

  // Critical Expiry Batches (< 14 days remaining)
  { id: 4, hospital_id: 1, medicine_id: 3, batch_number: 'B-CRIT-001', quantity: 40,   expiry_date: daysFromNow(4),   created_at: new Date().toISOString() }, // Expires in 4 days
  { id: 5, hospital_id: 1, medicine_id: 6, batch_number: 'B-CRIT-002', quantity: 50,   expiry_date: daysFromNow(9),   created_at: new Date().toISOString() }, // Expires in 9 days
  { id: 6, hospital_id: 3, medicine_id: 6, batch_number: 'B-CRIT-003', quantity: 60,   expiry_date: daysFromNow(12),  created_at: new Date().toISOString() }, // Expires in 12 days

  // Medium Expiry Batches (15 to 30 days)
  { id: 7, hospital_id: 1, medicine_id: 2, batch_number: 'B-MED-001',  quantity: 200,  expiry_date: daysFromNow(22),  created_at: new Date().toISOString() },
  { id: 8, hospital_id: 2, medicine_id: 3, batch_number: 'B-MED-002',  quantity: 150,  expiry_date: daysFromNow(28),  created_at: new Date().toISOString() },

  // Long Safe Batches (> 60 days)
  { id: 9, hospital_id: 1, medicine_id: 1, batch_number: 'B-SAFE-001', quantity: 700,  expiry_date: daysFromNow(180), created_at: new Date().toISOString() },
  { id: 10, hospital_id: 1, medicine_id: 1, batch_number: 'B-SAFE-002', quantity: 500, expiry_date: daysFromNow(365), created_at: new Date().toISOString() },
  { id: 11, hospital_id: 1, medicine_id: 7, batch_number: 'B-SAFE-003', quantity: 450, expiry_date: daysFromNow(240), created_at: new Date().toISOString() },
  { id: 12, hospital_id: 2, medicine_id: 5, batch_number: 'B-SAFE-004', quantity: 300, expiry_date: daysFromNow(300), created_at: new Date().toISOString() },
  { id: 13, hospital_id: 4, medicine_id: 7, batch_number: 'B-SAFE-005', quantity: 850, expiry_date: daysFromNow(330), created_at: new Date().toISOString() },
];

// Initial Demand History across multiple facilities and medicines
let demandHistory = [];
const trackedPairs = [
  { hid: 1, mid: 1, base: 35 }, { hid: 1, mid: 2, base: 28 }, { hid: 1, mid: 5, base: 18 },
  { hid: 2, mid: 1, base: 24 }, { hid: 2, mid: 2, base: 20 }, { hid: 3, mid: 1, base: 15 },
  { hid: 4, mid: 7, base: 30 }, { hid: 5, mid: 2, base: 22 },
];

let dhId = 1;
for (const pair of trackedPairs) {
  for (let i = 20; i >= 1; i--) {
    const date = daysFromNow(-i);
    demandHistory.push({
      id: dhId++,
      hospital_id: pair.hid,
      medicine_id: pair.mid,
      date,
      consumption: Math.round(pair.base + (Math.random() * 12 - 6)),
      patient_load: Math.round(160 + (Math.random() * 40 - 20)),
      emergency_demand: Math.round(Math.random() * 4),
      created_at: new Date().toISOString(),
    });
  }
}

// Initial Supply Requests
let requests = [
  {
    id: 1,
    hospital_id: 2,
    medicine_id: 1,
    quantity_required: 100,
    needed_by: daysFromNow(3),
    urgency: 'Critical',
    status: 'pending',
    notes: 'Urgent stockout risk for Augmentin in Northern District',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 2,
    hospital_id: 1,
    medicine_id: 5,
    quantity_required: 50,
    needed_by: daysFromNow(5),
    urgency: 'Urgent',
    status: 'in-transit',
    notes: 'Avil 25 anti-allergic shortage replenishment',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 3,
    hospital_id: 3,
    medicine_id: 11,
    quantity_required: 75,
    needed_by: daysFromNow(7),
    urgency: 'Normal',
    status: 'fulfilled',
    notes: 'Routine buffer replenishment for Calpol',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];
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

function getBatches({ hospital_id, medicine_id, expiring_within_days, status, limit = 50, offset = 0 } = {}) {
  let list = batches;
  const today = daysFromNow(0);

  if (hospital_id) {
    list = list.filter((b) => b.hospital_id === parseInt(hospital_id, 10));
  }
  if (medicine_id) {
    list = list.filter((b) => b.medicine_id === parseInt(medicine_id, 10));
  }

  if (status === 'expired') {
    list = list.filter((b) => b.expiry_date < today);
  } else if (status === 'active') {
    list = list.filter((b) => b.expiry_date >= today);
  }

  if (expiring_within_days !== undefined) {
    const days = parseInt(expiring_within_days, 10);
    const maxExpiry = daysFromNow(days);
    list = list.filter((b) => b.expiry_date >= today && b.expiry_date <= maxExpiry);
  }

  const enriched = list.map((b) => {
    const h = getHospitalById(b.hospital_id);
    const m = medicineDataset.findById(b.medicine_id) || { name: `Medicine #${b.medicine_id}`, unit: 'unit', category: 'General' };
    const diffMs = new Date(b.expiry_date) - new Date();
    const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isExpired = daysUntilExpiry <= 0;

    return {
      ...b,
      hospital_name: h ? h.name : 'Unknown Hospital',
      medicine_name: m.name,
      medicine_unit: m.unit,
      medicine_category: m.category,
      is_expired: isExpired,
      days_until_expiry: daysUntilExpiry,
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

function getRequests({ hospital_id, limit = 50 } = {}) {
  let filtered = requests;
  if (hospital_id) {
    filtered = filtered.filter((r) => r.hospital_id === parseInt(hospital_id, 10));
  }
  const enriched = filtered.map((r) => {
    const m = medicineDataset.findById(r.medicine_id) || { name: `Medicine #${r.medicine_id}`, unit: 'unit' };
    const h = getHospitalById(r.hospital_id);
    return {
      ...r,
      medicine_name: m.name,
      medicine_unit: m.unit,
      hospital_name: h ? h.name : `Hospital ${r.hospital_id}`,
    };
  });
  return enriched.slice(0, limit);
}

function updateRequestStatus(id, status) {
  const numId = parseInt(id, 10);
  const req = requests.find((r) => r.id === numId);
  if (req) {
    req.status = status;
    req.updated_at = new Date().toISOString();
    return req;
  }
  return null;
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

function updateInventoryItem({ id, hospital_id, medicine_id, quantity, safety_stock, note }) {
  const numId = id !== undefined && id !== null ? parseInt(id, 10) : null;
  const hid = hospital_id ? parseInt(hospital_id, 10) : null;
  const mid = medicine_id ? parseInt(medicine_id, 10) : null;

  let item = null;
  if (numId) {
    item = inventory.find((i) => i.id === numId);
  }
  if (!item && hid && mid) {
    item = inventory.find((i) => i.hospital_id === hid && i.medicine_id === mid);
  }

  if (!item) {
    if (hid && mid) {
      item = {
        id: inventory.length + 1,
        hospital_id: hid,
        medicine_id: mid,
        quantity: quantity !== undefined ? Math.max(0, parseFloat(quantity)) : 0,
        safety_stock: safety_stock !== undefined ? Math.max(0, parseFloat(safety_stock)) : 50,
        updated_at: new Date().toISOString(),
      };
      inventory.push(item);
    } else {
      return null;
    }
  }

  const prevQty = item.quantity;
  if (quantity !== undefined) {
    item.quantity = Math.max(0, parseFloat(quantity));
  }
  if (safety_stock !== undefined) {
    item.safety_stock = Math.max(0, parseFloat(safety_stock));
  }
  item.updated_at = new Date().toISOString();

  const h = getHospitalById(item.hospital_id);
  const m = medicineDataset.findById(item.medicine_id) || { name: `Medicine #${item.medicine_id}`, unit: 'unit', category: 'General' };

  // Activity Log
  const diff = item.quantity - prevQty;
  const diffText = diff >= 0 ? `+${diff}` : `${diff}`;
  activityLog.unshift({
    id: activityLog.length + 1,
    hospital_id: item.hospital_id,
    medicine_id: item.medicine_id,
    type: 'stock_update',
    quantity: item.quantity,
    description: `Inventory stock updated: ${m.name} changed from ${prevQty} to ${item.quantity} (${diffText} units). ${note || ''}`.trim(),
    created_at: new Date().toISOString(),
  });

  return {
    ...item,
    hospital_name: h ? h.name : 'Unknown Hospital',
    medicine_name: m.name,
    medicine_unit: m.unit,
    medicine_category: m.category,
  };
}

// In-Memory Storage for Users
const bcrypt = require('bcryptjs');
let users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@medsupply.org',
    password_hash: bcrypt.hashSync('MedSupply2026!', 10),
    role: 'admin',
    hospital_id: 1,
    created_at: new Date().toISOString(),
  },
];

function findUser(identifier) {
  if (!identifier) return null;
  const term = identifier.trim().toLowerCase();
  return (
    users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === term) ||
        (u.email && u.email.toLowerCase() === term)
    ) || null
  );
}

function createUser({ username, email, password_hash, role = 'hospital_admin', hospital_id = 1 }) {
  const newUser = {
    id: users.length + 1,
    username: username.trim(),
    email: email ? email.trim().toLowerCase() : null,
    password_hash,
    role,
    hospital_id: parseInt(hospital_id, 10) || 1,
    created_at: new Date().toISOString(),
  };
  users.push(newUser);
  return newUser;
}

function createHospital({
  name,
  type = 'general',
  address = 'New Delhi, India',
  latitude,
  longitude,
  patient_capacity = 300,
}) {
  const cityCoordinates = [
    { name: 'hyderabad', lat: 17.3850, lng: 78.4867 },
    { name: 'pune', lat: 18.5204, lng: 73.8567 },
    { name: 'kolkata', lat: 22.5726, lng: 88.3639 },
    { name: 'jaipur', lat: 26.9124, lng: 75.7873 },
    { name: 'ahmedabad', lat: 23.0225, lng: 72.5714 },
    { name: 'chandigarh', lat: 30.7333, lng: 76.7794 },
    { name: 'lucknow', lat: 26.8467, lng: 80.9462 },
    { name: 'kochi', lat: 9.9312, lng: 76.2673 },
    { name: 'bhopal', lat: 23.2599, lng: 77.4126 },
    { name: 'nagpur', lat: 21.1458, lng: 79.0882 },
  ];

  let chosenLat = parseFloat(latitude);
  let chosenLng = parseFloat(longitude);

  if (isNaN(chosenLat) || isNaN(chosenLng) || !chosenLat || !chosenLng) {
    const addrLower = (address || '').toLowerCase();
    const matched = cityCoordinates.find((c) => addrLower.includes(c.name));
    if (matched) {
      chosenLat = matched.lat;
      chosenLng = matched.lng;
    } else {
      const fallbackCity = cityCoordinates[(hospitals.length) % cityCoordinates.length];
      chosenLat = fallbackCity.lat;
      chosenLng = fallbackCity.lng;
    }
  }

  const newHospital = {
    id: hospitals.length + 1,
    name: name ? name.trim() : `Hospital #${hospitals.length + 1}`,
    type: (type || 'general').toLowerCase(),
    address: address ? address.trim() : 'India Regional Healthcare Center',
    latitude: Math.round(chosenLat * 10000) / 10000,
    longitude: Math.round(chosenLng * 10000) / 10000,
    patient_capacity: parseInt(patient_capacity, 10) || 300,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  hospitals.push(newHospital);

  // Seed inventory for top essential medicines for this new hospital
  const baseMedicines = [
    { mid: 1, qty: 350, safety: 120 }, // Augmentin 625
    { mid: 2, qty: 280, safety: 100 }, // Azithral 500
    { mid: 3, qty: 150, safety: 80 },  // Ascoril LS
    { mid: 4, qty: 220, safety: 70 },  // Allegra 120
    { mid: 5, qty: 45,  safety: 60 },  // Avil 25 (Low stock)
    { mid: 6, qty: 400, safety: 90 },  // Aciloc 150
    { mid: 7, qty: 300, safety: 110 }, // Atorva 20
    { mid: 8, qty: 25,  safety: 50 },  // Amlokind 5 (Low stock)
    { mid: 9, qty: 500, safety: 120 }, // Glycomet 500
    { mid: 10, qty: 180, safety: 60 }, // Pan 40
    { mid: 11, qty: 650, safety: 150 },// Calpol 650
    { mid: 12, qty: 30,  safety: 70 }, // Dolo 650 (Shortage)
  ];

  baseMedicines.forEach((bm) => {
    inventory.push({
      id: inventory.length + 1,
      hospital_id: newHospital.id,
      medicine_id: bm.mid,
      quantity: bm.qty,
      safety_stock: bm.safety,
      updated_at: new Date().toISOString(),
    });
  });

  // Seed 2 active batches for this hospital
  batches.push({
    id: batches.length + 1,
    hospital_id: newHospital.id,
    medicine_id: 1,
    batch_number: `B-NEW-${newHospital.id}-01`,
    quantity: 200,
    expiry_date: daysFromNow(210),
    created_at: new Date().toISOString(),
  });

  batches.push({
    id: batches.length + 1,
    hospital_id: newHospital.id,
    medicine_id: 5,
    batch_number: `B-NEW-${newHospital.id}-02`,
    quantity: 45,
    expiry_date: daysFromNow(18),
    created_at: new Date().toISOString(),
  });

  // Seed demand history pairs
  for (let d = 1; d <= 7; d++) {
    demandHistory.push({
      id: demandHistory.length + 1,
      hospital_id: newHospital.id,
      medicine_id: 1,
      date: daysFromNow(-d),
      consumption: 18 + (d % 4),
      patient_load: Math.round(newHospital.patient_capacity * 0.72),
      emergency_demand: d % 3 === 0 ? 5 : 0,
    });
  }

  return newHospital;
}

function getRecentEntries({ hospital_id = 1, limit = 20 } = {}) {
  const filtered = activityLog.filter((a) => a.hospital_id === parseInt(hospital_id, 10));
  return filtered.slice(0, limit);
}

module.exports = {

  getHospitals,
  getHospitalById,
  createHospital,
  getInventory,
  getBatches,
  getDemandHistory,
  createRequest,
  getRequests,
  updateRequestStatus,
  recordStockReceived,
  recordDailyUsage,
  updateInventoryItem,
  getRecentEntries,
  findUser,
  createUser,
};


