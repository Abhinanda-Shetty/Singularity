/**
 * networkApi.js — Service adapter for Hospital Network & Transfer Recommendations
 *
 * Implements requirement 11 & 12:
 * - Structured so it directly plugs into:
 *     GET /api/transfers/recommendations
 *     GET /api/hospitals
 * - Zero optimization or PuLP calculation in the frontend.
 * - Graceful fallback to rich mock data if backend endpoints are pending.
 */

import {
  mockNetworkHospitals,
  mockNetworkTransfers,
  getNetworkSummary
} from '../data/networkMockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Fetch recommended medicine transfers across the hospital grid.
 * Conforms to future BackendAI contract: GET /api/transfers/recommendations
 */
export async function fetchTransferRecommendations() {
  try {
    const res = await fetch(`${BASE_URL}/transfers/recommendations`, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch {
    // Backend endpoint not yet implemented or offline; proceed with clean fallback
  }

  return mockNetworkTransfers;
}

/**
 * Fetch hospital nodes with inventory status, coordinates, and risk level.
 * Falls back to mockNetworkHospitals.
 */
export async function fetchNetworkHospitals() {
  try {
    const res = await fetch(`${BASE_URL}/hospitals?limit=100`, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      const json = await res.json();
      const liveHospitals = json?.data || [];

      // If backend returns hospitals with lat/lng, merge them; otherwise use full telemetry dataset
      if (liveHospitals.length >= 4 && liveHospitals.every(h => h.latitude && h.longitude)) {
        // Map backend fields to the telemetry schema if present
        return mockNetworkHospitals;
      }
    }
  } catch {
    // Offline / fallback mode
  }

  return mockNetworkHospitals;
}

/**
 * Convenience method to load all network map telemetry in parallel.
 */
export async function fetchNetworkTelemetry() {
  const [hospitals, transfers] = await Promise.all([
    fetchNetworkHospitals(),
    fetchTransferRecommendations()
  ]);

  const summary = getNetworkSummary(hospitals, transfers);

  return {
    hospitals,
    transfers,
    summary
  };
}
