/**
 * api.js — Centralized API client for Singularity Medical Supply Intelligence
 *
 * All backend communication goes through this module.
 * Base URL is read from VITE_API_BASE_URL environment variable.
 * Token is stored in sessionStorage (cleared on tab close).
 * Never import backend URLs directly inside components.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// ─────────────────────────────────────────────────────────────────
// Session helpers
// ─────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'medsupply_token';
const USER_KEY  = 'medsupply_user';

export function saveSession(token, user) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch { return null; }
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}

// ─────────────────────────────────────────────────────────────────
// Core fetch wrapper — injects Bearer token automatically
// ─────────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (networkError) {
    throw new Error(
      'Cannot reach the server. Please check that the backend is running.',
      { cause: networkError }
    );
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message = json?.error || `Server error ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.code = json?.code;
    throw err;
  }

  return json;
}

// ─────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────

/** POST /api/auth/signup — registers new user and stores token on success */
export async function signup({ username, password, email, hospital_id }) {
  const res = await apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ username, password, email, hospital_id }),
  });
  if (res.data?.token) {
    saveSession(res.data.token, res.data.user);
  }
  return res.data;
}

/** POST /api/auth/login — stores token in session on success */
export async function login(username, password) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (res.data?.token) {
    saveSession(res.data.token, res.data.user);
  }
  return res.data;
}

/** GET /api/auth/me */
export async function fetchMe() {
  return apiFetch('/auth/me');
}

// ─────────────────────────────────────────────────────────────────
// Health
// ─────────────────────────────────────────────────────────────────

export async function fetchHealth() {
  return apiFetch('/health');
}

// ─────────────────────────────────────────────────────────────────
// Hospitals
// ─────────────────────────────────────────────────────────────────

export async function fetchHospitals(params = {}) {
  const qs = new URLSearchParams();
  if (params.type)  qs.set('type',  params.type);
  if (params.page)  qs.set('page',  String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const q = qs.toString() ? `?${qs}` : '';
  return apiFetch(`/hospitals${q}`);
}

export async function fetchHospitalById(id) {
  return apiFetch(`/hospitals/${id}`);
}

// ─────────────────────────────────────────────────────────────────
// Medicines
// ─────────────────────────────────────────────────────────────────

export async function fetchMedicines(params = {}) {
  const qs = new URLSearchParams();
  if (params.category)             qs.set('category', params.category);
  if (params.critical !== undefined) qs.set('critical', String(params.critical));
  if (params.page)                 qs.set('page',    String(params.page));
  if (params.limit)                qs.set('limit',   String(params.limit));
  const q = qs.toString() ? `?${qs}` : '';
  return apiFetch(`/medicines${q}`);
}

export async function fetchMedicineById(id) {
  return apiFetch(`/medicines/${id}`);
}

// ─────────────────────────────────────────────────────────────────
// Inventory
// ─────────────────────────────────────────────────────────────────

export async function fetchInventory(params = {}) {
  const qs = new URLSearchParams();
  if (params.hospital_id) qs.set('hospital_id', String(params.hospital_id));
  if (params.medicine_id) qs.set('medicine_id', String(params.medicine_id));
  if (params.page)        qs.set('page',        String(params.page));
  if (params.limit)       qs.set('limit',       String(params.limit));
  const q = qs.toString() ? `?${qs}` : '';
  return apiFetch(`/inventory${q}`);
}

// ─────────────────────────────────────────────────────────────────
// Batches
// ─────────────────────────────────────────────────────────────────

export async function fetchBatches(params = {}) {
  const qs = new URLSearchParams();
  if (params.hospital_id)         qs.set('hospital_id',         String(params.hospital_id));
  if (params.medicine_id)         qs.set('medicine_id',         String(params.medicine_id));
  if (params.expiring_within_days) qs.set('expiring_within_days', String(params.expiring_within_days));
  if (params.status)              qs.set('status',              String(params.status));
  if (params.page)                qs.set('page',                String(params.page));
  if (params.limit)               qs.set('limit',               String(params.limit));
  const q = qs.toString() ? `?${qs}` : '';
  return apiFetch(`/batches${q}`);
}


// ─────────────────────────────────────────────────────────────────
// Entries  (Stock Received + Daily Usage)
// ─────────────────────────────────────────────────────────────────

/** POST /api/entries  { type:'stock'|'usage', ... } */
export async function createEntry(entry) {
  return apiFetch('/entries', { method: 'POST', body: JSON.stringify(entry) });
}

/** GET /api/entries/recent */
export async function fetchRecentEntries(params = {}) {
  const qs = new URLSearchParams();
  if (params.hospital_id) qs.set('hospital_id', String(params.hospital_id));
  if (params.limit)       qs.set('limit',       String(params.limit));
  const q = qs.toString() ? `?${qs}` : '';
  return apiFetch(`/entries/recent${q}`);
}

// ─────────────────────────────────────────────────────────────────
// Requests  (Medicine Supply Requests)
// ─────────────────────────────────────────────────────────────────

/** POST /api/requests */
export async function createRequest(requestData) {
  return apiFetch('/requests', { method: 'POST', body: JSON.stringify(requestData) });
}

/** GET /api/requests */
export async function fetchRequests(params = {}) {
  const qs = new URLSearchParams();
  if (params.hospital_id) qs.set('hospital_id', String(params.hospital_id));
  if (params.limit)       qs.set('limit',       String(params.limit));
  const q = qs.toString() ? `?${qs}` : '';
  return apiFetch(`/requests${q}`);
}

/** PATCH /api/requests/:id */
export async function updateRequestStatus(id, status) {
  return apiFetch(`/requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}


// ─────────────────────────────────────────────────────────────────
// Demand History
// ─────────────────────────────────────────────────────────────────

/** GET /api/demand-history */
export async function fetchDemandHistory(params = {}) {
  const qs = new URLSearchParams();
  if (params.hospital_id) qs.set('hospital_id', String(params.hospital_id));
  if (params.medicine_id) qs.set('medicine_id', String(params.medicine_id));
  if (params.start_date)  qs.set('start_date',  params.start_date);
  if (params.end_date)    qs.set('end_date',    params.end_date);
  if (params.limit)       qs.set('limit',       String(params.limit));
  const q = qs.toString() ? `?${qs}` : '';
  return apiFetch(`/demand-history${q}`);
}

// ─────────────────────────────────────────────────────────────────
// Dashboard summary helper  (parallel fetch for all KPIs)
// ─────────────────────────────────────────────────────────────────

export async function fetchDashboardSummary(hospitalId = 1) {
  const [medicinesRes, inventoryRes, batchesRes, hospitalRes] = await Promise.all([
    fetchMedicines({ limit: 1 }),
    fetchInventory({ limit: 100 }),
    fetchBatches({ expiring_within_days: 30, limit: 1 }),
    fetchHospitalById(hospitalId),
  ]);

  const inventoryRows = inventoryRes.data || [];

  const atRiskCount = inventoryRows.filter(
    (row) => parseFloat(row.quantity) <= parseFloat(row.safety_stock)
  ).length;

  const totalStockUnits = inventoryRows.reduce(
    (sum, row) => sum + parseFloat(row.quantity || 0),
    0
  );

  return {
    medicineTotal:  medicinesRes.meta?.total ?? 0,
    inventoryTotal: Math.round(totalStockUnits),
    expiringTotal:  batchesRes.meta?.total ?? 0,
    atRiskCount,
    inventoryRows,
    hospital: hospitalRes.data || null,
  };
}

// ─────────────────────────────────────────────────────────────────
// AI Intelligence (XGBoost Demand Forecast & PuLP Redistribution)
// ─────────────────────────────────────────────────────────────────

/** GET /api/ai/forecast */
export async function fetchForecast(params = {}) {
  const qs = new URLSearchParams();
  if (params.hospital_id)     qs.set('hospital_id',     String(params.hospital_id));
  if (params.medicine_id)     qs.set('medicine_id',     String(params.medicine_id));
  if (params.days_per_period) qs.set('days_per_period', String(params.days_per_period));
  const q = qs.toString() ? `?${qs}` : '';
  return apiFetch(`/ai/forecast${q}`);
}

/** GET /api/ai/risks */
export async function fetchRisks(params = {}) {
  const qs = new URLSearchParams();
  if (params.hospital_id)    qs.set('hospital_id',    String(params.hospital_id));
  if (params.medicine_id)    qs.set('medicine_id',    String(params.medicine_id));
  if (params.lead_time_days) qs.set('lead_time_days', String(params.lead_time_days));
  if (params.safety_horizon) qs.set('safety_horizon', String(params.safety_horizon));
  const q = qs.toString() ? `?${qs}` : '';
  return apiFetch(`/ai/risks${q}`);
}

/** GET /api/ai/analyse */
export async function fetchFullAnalysis(params = {}) {
  const qs = new URLSearchParams();
  if (params.hospital_id)     qs.set('hospital_id',     String(params.hospital_id));
  if (params.days_per_period) qs.set('days_per_period', String(params.days_per_period));
  const q = qs.toString() ? `?${qs}` : '';
  return apiFetch(`/ai/analyse${q}`);
}

/** POST /api/ai/redistribute */
export async function fetchRedistribution(options = {}) {
  return apiFetch('/ai/redistribute', {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

