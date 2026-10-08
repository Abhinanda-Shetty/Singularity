'use strict';

/**
 * AI Service Client
 *
 * Connects the Node.js backend to BackendAI (FastAPI + XGBoost + PuLP)
 * Base URL defaults to http://localhost:8000 or AI_SERVICE_URL.
 * Provides resilient fallbacks using live database inventory if AI service is offline.
 */

const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const dataStore = require('./dataStore');

/**
 * Helper to call BackendAI with timeout
 */
async function callAiApi(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const url = `${AI_BASE_URL}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`BackendAI returned status ${res.status}: ${errText}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Request demand forecast from BackendAI (or resilient fallback)
 */
async function requestForecast({ hospital_id, medicine_id, days_per_period = 7 } = {}) {
  const qs = new URLSearchParams();
  if (hospital_id) qs.set('hospital_id', String(hospital_id));
  if (medicine_id) qs.set('medicine_id', String(medicine_id));
  if (days_per_period) qs.set('days_per_period', String(days_per_period));

  try {
    const data = await callAiApi(`/forecast/db?${qs.toString()}`);
    return { success: true, ai_service: 'connected', ...data };
  } catch (err) {
    console.warn(`[aiService] BackendAI unreachable (${err.message}). Using database fallback.`);

    // Resilient fallback based on live database dataStore
    let invList = dataStore.getInventory({ hospital_id, medicine_id, limit: 100 });
    if (!Array.isArray(invList)) invList = invList.rows || [];
    const hospRes = dataStore.getHospitals();
    const hospitals = hospRes.rows || [];
    const hospMap = Object.fromEntries(hospitals.map((h) => [h.id, h]));


    const forecasts = invList.map((item) => {
      const hid = item.hospital_id;
      const h = hospMap[hid] || {};
      const baseDaily = Math.max(1, Math.round(Number(item.quantity) * 0.05 + 15));
      const predDemand = Math.round(baseDaily * days_per_period);
      const stock = Number(item.quantity || 0);
      const daysToStockout = Math.round((stock / baseDaily) * 10) / 10;

      return {
        hospital_id: `H${String(hid).padStart(3, '0')}`,
        hospital_name: item.hospital_name || h.name || `Hospital ${hid}`,
        medicine_id: item.medicine_id,
        medicine_name: item.medicine_name || `Medicine ${item.medicine_id}`,
        medicine_category: item.medicine_category || 'General',
        region_type: h.type || 'urban',
        latitude: h.latitude || 19.076,
        longitude: h.longitude || 72.8777,
        current_stock: stock,
        safety_stock: Number(item.safety_stock || 0),
        predicted_future_demand: predDemand,
        predicted_daily_demand: baseDaily,
        days_to_stockout: daysToStockout,
      };
    });

    return {
      success: true,
      ai_service: 'fallback',
      source: 'database_store',
      count: forecasts.length,
      forecasts,
    };
  }
}

/**
 * Request stockout risk analysis
 */
async function requestRiskAnalysis({ hospital_id, medicine_id, lead_time_days = 7, safety_horizon = 14 } = {}) {
  const qs = new URLSearchParams();
  if (hospital_id) qs.set('hospital_id', String(hospital_id));
  if (medicine_id) qs.set('medicine_id', String(medicine_id));
  if (lead_time_days) qs.set('lead_time_days', String(lead_time_days));
  if (safety_horizon) qs.set('safety_horizon', String(safety_horizon));

  try {
    const data = await callAiApi(`/stockout/db?${qs.toString()}`);
    return { success: true, ai_service: 'connected', ...data };
  } catch (err) {
    console.warn(`[aiService] BackendAI unreachable (${err.message}). Computing stockout fallback.`);
    const fc = await requestForecast({ hospital_id, medicine_id });
    const records = fc.forecasts || [];

    const riskRecords = records.map((r) => {
      let riskTier = 'LOW';
      let riskScore = 15.0;
      if (r.days_to_stockout <= lead_time_days) {
        riskTier = 'CRITICAL';
        riskScore = 85.0;
      } else if (r.days_to_stockout <= safety_horizon) {
        riskTier = 'HIGH';
        riskScore = 60.0;
      } else if (r.days_to_stockout <= safety_horizon * 1.5) {
        riskTier = 'MEDIUM';
        riskScore = 35.0;
      }

      const shortageQty = Math.max(0, r.safety_stock + r.predicted_future_demand - r.current_stock);

      return {
        ...r,
        risk_tier: riskTier,
        risk_score: riskScore,
        shortage_quantity: shortageQty,
      };
    });

    const tierCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    let totalShortage = 0;
    riskRecords.forEach((r) => {
      tierCounts[r.risk_tier] = (tierCounts[r.risk_tier] || 0) + 1;
      totalShortage += r.shortage_quantity;
    });

    return {
      success: true,
      ai_service: 'fallback',
      summary: {
        tier_counts: tierCounts,
        total_shortage: totalShortage,
        records_assessed: riskRecords.length,
        critical_high: riskRecords.filter((r) => r.risk_tier === 'CRITICAL' || r.risk_tier === 'HIGH'),
      },
      risk_records: riskRecords,
    };
  }
}

/**
 * Request full orchestration (forecast -> expiry -> stockout -> priority -> redistribute)
 */
async function requestFullAnalysis({ hospital_id, days_per_period = 7 } = {}) {
  const qs = new URLSearchParams();
  if (hospital_id) qs.set('hospital_id', String(hospital_id));
  if (days_per_period) qs.set('days_per_period', String(days_per_period));

  try {
    const data = await callAiApi(`/analyse/db?${qs.toString()}`);
    return { success: true, ai_service: 'connected', ...data };
  } catch (err) {
    console.warn(`[aiService] BackendAI unreachable (${err.message}). Computing pipeline fallback.`);
    const risk = await requestRiskAnalysis({ hospital_id });
    return {
      success: true,
      ai_service: 'fallback',
      pipeline: 'forecast -> expiry -> stockout -> priority -> redistribute',
      forecast_count: (risk.risk_records || []).length,
      forecasts: risk.risk_records || [],
      risk_summary: risk.summary || {},
      risk_records: risk.risk_records || [],
      total_transfers: 0,
      transfers_by_medicine: {},
    };
  }
}

/**
 * Request redistribution plan
 */
async function requestRedistribution(options = {}) {
  try {
    const data = await callAiApi('/redistribute', {
      method: 'POST',
      body: JSON.stringify(options),
    });
    return { success: true, ai_service: 'connected', ...data };
  } catch (err) {
    console.warn(`[aiService] BackendAI unreachable (${err.message}).`);
    return {
      success: true,
      ai_service: 'fallback',
      total_transfers: 0,
      transfers_by_medicine: {},
    };
  }
}

module.exports = {
  requestForecast,
  requestRiskAnalysis,
  requestFullAnalysis,
  requestRedistribution,
};
