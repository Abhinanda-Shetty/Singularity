'use strict';

/**
 * AI Service Client
 *
 * Responsible for calling BackendAI endpoints.
 * Contract schemas are NOT yet defined by AI Team.
 * This file is a placeholder — implement when AI Team provides endpoint specs.
 *
 * Planned endpoints:
 *   POST /api/predict/forecast      → demand forecast
 *   POST /api/predict/risk          → stock-out / expiry risk
 *   POST /api/optimize/redistribution → PuLP redistribution plan
 */

const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Request a demand forecast from BackendAI.
 * @param {object} params - { hospital_id, medicine_id, horizon_days }
 * @returns {Promise<object>} Forecast result
 */
async function requestForecast(params) {
  // TODO: Implement when BackendAI forecast endpoint is defined.
  throw new Error('AI forecast service not yet integrated. Contract pending from AI Team.');
}

/**
 * Request risk analysis from BackendAI.
 * @param {object} params - { hospital_id, medicine_id }
 * @returns {Promise<object>} Risk result
 */
async function requestRiskAnalysis(params) {
  // TODO: Implement when BackendAI risk endpoint is defined.
  throw new Error('AI risk service not yet integrated. Contract pending from AI Team.');
}

/**
 * Request redistribution plan from BackendAI (PuLP optimizer).
 * @param {object} params - { hospitals, medicines, inventory, demand_forecast }
 * @returns {Promise<object>} Redistribution plan with transfers
 */
async function requestRedistribution(params) {
  // TODO: Implement when BackendAI redistribution endpoint is defined.
  throw new Error('AI redistribution service not yet integrated. Contract pending from AI Team.');
}

module.exports = { requestForecast, requestRiskAnalysis, requestRedistribution };
