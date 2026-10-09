'use strict';

const express = require('express');
const router = express.Router();
const llmService = require('../services/llmService');

/**
 * POST /api/llm/explain
 * Generate clinical reasoning for a medicine redistribution recommendation
 */
router.post('/explain', async (req, res) => {
  try {
    const result = await llmService.explainRedistribution(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[API /api/llm/explain] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      fallback: 'Reallocating units from source to target prevents inventory wastage while mitigating critical stockout risk.',
    });
  }
});

/**
 * POST /api/llm/query
 * RAG AI Medical Supply Intelligence Assistant Q&A
 */
router.post('/query', async (req, res) => {
  try {
    const { query, inventoryContext, hospitalId } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query string is required.' });
    }

    const result = await llmService.answerRagQuery({
      query,
      inventoryContext,
      hospitalId,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[API /api/llm/query] Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
