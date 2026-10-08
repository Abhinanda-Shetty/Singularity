'use strict';

const aiService = require('../services/aiService');

/**
 * GET /api/ai/forecast
 */
async function getForecast(req, res, next) {
  try {
    const { hospital_id, medicine_id, days_per_period } = req.query;
    const result = await aiService.requestForecast({
      hospital_id: hospital_id ? Number(hospital_id) : undefined,
      medicine_id: medicine_id ? Number(medicine_id) : undefined,
      days_per_period: days_per_period ? Number(days_per_period) : 7,
    });
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ai/risks
 */
async function getRisks(req, res, next) {
  try {
    const { hospital_id, medicine_id, lead_time_days, safety_horizon } = req.query;
    const result = await aiService.requestRiskAnalysis({
      hospital_id: hospital_id ? Number(hospital_id) : undefined,
      medicine_id: medicine_id ? Number(medicine_id) : undefined,
      lead_time_days: lead_time_days ? Number(lead_time_days) : 7,
      safety_horizon: safety_horizon ? Number(safety_horizon) : 14,
    });
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ai/analyse
 */
async function getFullAnalysis(req, res, next) {
  try {
    const { hospital_id, days_per_period } = req.query;
    const result = await aiService.requestFullAnalysis({
      hospital_id: hospital_id ? Number(hospital_id) : undefined,
      days_per_period: days_per_period ? Number(days_per_period) : 7,
    });
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/ai/redistribute
 */
async function getRedistribution(req, res, next) {
  try {
    const result = await aiService.requestRedistribution(req.body);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getForecast,
  getRisks,
  getFullAnalysis,
  getRedistribution,
};
