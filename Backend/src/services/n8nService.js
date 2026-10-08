'use strict';

/**
 * n8n Automation Service
 *
 * Responsible for triggering n8n workflows and receiving negotiation results.
 * Webhook URL and payload schema are NOT yet defined by Automation Team.
 * This file is a placeholder.
 *
 * Planned flow:
 *   1. Backend calls n8n trigger URL with supply order context
 *   2. n8n workflow handles supplier negotiation
 *   3. n8n POSTs result to POST /api/negotiations/webhook
 *   4. Backend persists result to `negotiations` table
 */

const N8N_TRIGGER_URL = process.env.N8N_TRIGGER_URL || '';

/**
 * Trigger an n8n negotiation workflow.
 * @param {object} params - Supply order / cost context
 * @returns {Promise<object>} n8n workflow trigger response
 */
async function triggerNegotiationWorkflow(params) {
  // TODO: Implement when n8n workflow URL and payload schema are defined.
  throw new Error('n8n negotiation workflow not yet integrated. Contract pending from Automation Team.');
}

module.exports = { triggerNegotiationWorkflow };
