'use strict';

require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const dataStore = require('./dataStore');
const { supabase } = require('../config/supabase');

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Generate content with Gemini (gemini-3.8-flash) with retry for transient 503 spikes
 */
async function generateWithGemini(prompt) {
  const models = ['gemini-3.8-flash'];
  let lastErr = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        if (response && response.text) {
          return response.text.trim();
        }
      } catch (err) {
        lastErr = err;
        console.warn(`[llmService] Attempt ${attempt + 1} with ${model} error: ${err.message}`);
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 1200));
        }
      }
    }
  }

  throw lastErr || new Error('All Gemini generation attempts failed');
}


/**
 * Gather live RAG context from Supabase tables (with dataStore fallback)
 */
async function gatherRagContext(hospitalId = null) {
  let hospitals = [];
  let inventory = [];
  let batches = [];
  let requests = [];

  // 1. Try Supabase Cloud API first
  try {
    const [hRes, iRes, bRes, rRes] = await Promise.all([
      supabase.from('hospitals').select('id, name, type, patient_capacity, address').limit(20),
      supabase.from('inventory').select('id, hospital_id, medicine_id, quantity, safety_stock').limit(100),
      supabase.from('batches').select('id, hospital_id, medicine_id, quantity, expiry_date').order('expiry_date', { ascending: true }).limit(50),
      supabase.from('requests').select('id, hospital_id, medicine_id, quantity_required, urgency, status').limit(30),
    ]);

    if (hRes.data && hRes.data.length > 0) hospitals = hRes.data;
    if (iRes.data && iRes.data.length > 0) inventory = iRes.data;
    if (bRes.data && bRes.data.length > 0) batches = bRes.data;
    if (rRes.data && rRes.data.length > 0) requests = rRes.data;
  } catch (err) {
    console.warn('[llmService] Supabase direct query skipped:', err.message);
  }

  // 2. Supplement or fallback to dataStore
  if (hospitals.length === 0) {
    const hData = dataStore.getHospitals();
    hospitals = (hData.rows || hData).map(h => ({
      id: h.id,
      name: h.name,
      type: h.type,
      patient_capacity: h.patient_capacity,
      address: h.address,
    }));
  }

  if (inventory.length === 0) {
    const invData = dataStore.getInventory({ limit: 100 });
    inventory = invData.rows || [];
  }

  if (batches.length === 0) {
    const bData = dataStore.getBatches({ limit: 50 });
    batches = bData.rows || [];
  }

  if (requests.length === 0) {
    const rData = dataStore.getRequests({ limit: 30 });
    requests = rData.rows || [];
  }

  // Build high-signal summaries for RAG context
  const hospitalMap = {};
  hospitals.forEach(h => { hospitalMap[h.id] = h.name; });

  const criticalShortages = inventory
    .filter(i => parseFloat(i.quantity) <= parseFloat(i.safety_stock))
    .slice(0, 15)
    .map(i => ({
      facility: hospitalMap[i.hospital_id] || i.hospital_name || `Hospital #${i.hospital_id}`,
      medicine: i.medicine_name || `Medicine #${i.medicine_id}`,
      stock: parseFloat(i.quantity),
      safety_stock: parseFloat(i.safety_stock),
      deficit: Math.max(0, parseFloat(i.safety_stock) - parseFloat(i.quantity)),
      status: parseFloat(i.quantity) === 0 ? 'CRITICAL_STOCKOUT' : 'BELOW_SAFETY_THRESHOLD'
    }));

  const surplusStock = inventory
    .filter(i => parseFloat(i.quantity) >= parseFloat(i.safety_stock) * 1.8)
    .slice(0, 15)
    .map(i => ({
      facility: hospitalMap[i.hospital_id] || i.hospital_name || `Hospital #${i.hospital_id}`,
      medicine: i.medicine_name || `Medicine #${i.medicine_id}`,
      stock: parseFloat(i.quantity),
      safety_stock: parseFloat(i.safety_stock),
      surplus: parseFloat(i.quantity) - parseFloat(i.safety_stock)
    }));

  const today = new Date();
  const expiringSoon = batches
    .filter(b => {
      const exp = new Date(b.expiry_date);
      const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 90;
    })
    .slice(0, 15)
    .map(b => ({
      facility: hospitalMap[b.hospital_id] || b.hospital_name || `Hospital #${b.hospital_id}`,
      medicine: b.medicine_name || `Medicine #${b.medicine_id}`,
      quantity: parseFloat(b.quantity),
      expiry_date: b.expiry_date,
      days_to_expiry: Math.ceil((new Date(b.expiry_date) - today) / (1000 * 60 * 60 * 24))
    }));

  const pendingRequests = requests
    .filter(r => r.status === 'Pending')
    .slice(0, 10)
    .map(r => ({
      id: r.id,
      facility: hospitalMap[r.hospital_id] || r.hospital_name || `Hospital #${r.hospital_id}`,
      medicine: r.medicine_name || `Medicine #${r.medicine_id}`,
      quantity_required: parseFloat(r.quantity_required),
      urgency: r.urgency
    }));

  return {
    total_facilities: hospitals.length,
    facilities_list: hospitals.map(h => `${h.name} (${h.type}, capacity: ${h.patient_capacity})`),
    critical_shortages_count: criticalShortages.length,
    critical_shortages_sample: criticalShortages,
    surplus_inventory_sample: surplusStock,
    expiring_batches_sample: expiringSoon,
    pending_transfer_requests: pendingRequests,
  };
}

/**
 * Intelligent Rule-based RAG Fallback if Gemini network is down
 */
function generateHeuristicRagAnswer(query, context) {
  const q = query.toLowerCase();

  if (q.includes('shortage') || q.includes('critical') || q.includes('deficit') || q.includes('out of stock')) {
    if (context.critical_shortages_sample.length > 0) {
      const items = context.critical_shortages_sample.slice(0, 3)
        .map(s => `${s.medicine} at ${s.facility} (${s.stock} in stock vs ${s.safety_stock} safety target)`)
        .join('; ');
      return `We currently have ${context.critical_shortages_count} critical inventory deficits across the network. High-priority shortages include: ${items}. Immediate stock redistribution or emergency replenishment is recommended.`;
    }
    return `Network stock levels are currently stable with no zero-inventory stockouts detected across the ${context.total_facilities} facilities.`;
  }

  if (q.includes('expir') || q.includes('waste') || q.includes('batch')) {
    if (context.expiring_batches_sample.length > 0) {
      const b = context.expiring_batches_sample[0];
      return `There are batches approaching expiry within 90 days. For example, ${b.quantity} units of ${b.medicine} at ${b.facility} expire on ${b.expiry_date} (${b.days_to_expiry} days remaining). Consider redistributing to facilities with higher burn rates.`;
    }
    return `No batches are facing imminent expiry within the next 30 days across active inventory batches.`;
  }

  if (q.includes('transfer') || q.includes('request') || q.includes('pending')) {
    if (context.pending_transfer_requests.length > 0) {
      const req = context.pending_transfer_requests[0];
      return `There are ${context.pending_transfer_requests.length} pending transfer requests in the system. Highest urgency is for ${req.quantity_required} units of ${req.medicine} from ${req.facility} (${req.urgency} priority).`;
    }
    return `All recent transfer requests are fulfilled or up to date. You can create a new dispatch from the Transfers console.`;
  }

  if (q.includes('hospital') || q.includes('facility') || q.includes('network')) {
    return `The network is currently monitoring ${context.total_facilities} healthcare facilities including: ${context.facilities_list.slice(0, 3).join(', ')}. All nodes are synchronized with the central telemetry grid.`;
  }

  if (q.includes('surplus') || q.includes('excess') || q.includes('available')) {
    if (context.surplus_inventory_sample.length > 0) {
      const s = context.surplus_inventory_sample[0];
      return `Surplus stock is available for re-allocation. ${s.facility} holds ${s.stock} units of ${s.medicine} (+${s.surplus} above safety baseline) ready for dispatch.`;
    }
  }

  return `Based on live network data across ${context.total_facilities} facilities, the system is tracking ${context.critical_shortages_count} low-stock alerts and ${context.expiring_batches_sample.length} batches near expiry. Ask for specific medicines, facilities, or pending transfer dispatches for tailored recommendations.`;
}

/**
 * Handle POST /api/llm/query
 */
async function answerRagQuery({ query, inventoryContext = null, hospitalId = null }) {
  if (!query || typeof query !== 'string') {
    throw new Error('Query string is required.');
  }

  // Gather context from Supabase tables
  const dbContext = await gatherRagContext(hospitalId);
  const effectiveContext = inventoryContext && Object.keys(inventoryContext).length > 0 
    ? { ...dbContext, client_view_context: inventoryContext } 
    : dbContext;

  const prompt = `You are MedSupply AI, an intelligent Medical Supply Intelligence Assistant for hospital administrators and logistics coordinators.
Current Live Supabase & Inventory Database Context:
${JSON.stringify(effectiveContext, null, 2)}

Administrator Question: "${query}"

Instructions:
1. Provide a clear, direct, professional, and factual answer in 2-3 concise sentences based strictly on the provided medical inventory and facility context.
2. If the user asks about specific medicines, shortages, surplus facilities, or expiration risks, mention exact facility names and quantities from the data.
3. Maintain an authoritative yet helpful clinical supply-chain tone. Avoid generic pleasantries or introductory fluff.`;

  try {
    const answer = await generateWithGemini(prompt);
    return {
      success: true,
      answer,
      rag_source: 'gemini-model-grounded',
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[llmService] Gemini query error:', err.message);
    const heuristicAnswer = generateHeuristicRagAnswer(query, dbContext);
    return {
      success: true,
      answer: heuristicAnswer,
      rag_source: 'supabase-heuristic-rag-fallback',
      note: 'Generated from real-time database tables snapshot',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Handle POST /api/llm/explain
 */
async function explainRedistribution({
  targetHospital,
  targetStock,
  dailyUsage,
  daysLeft,
  sourceHospital,
  sourceStock,
  expiryDays,
  medicine,
  transferQty,
}) {
  const prompt = `You are an AI Medical Supply Intelligence Assistant.
Explain in 2-3 concise, high-impact sentences why this stock transfer is recommended:
- Target Facility: ${targetHospital || 'Hospital A'} (Stock: ${targetStock || 0}, Usage: ${dailyUsage || 5}/day, Supply Left: ${daysLeft || 2} days)
- Source Facility: ${sourceHospital || 'Hospital B'} (Stock: ${sourceStock || 100}, Expiry in: ${expiryDays || 45} days)
- Recommendation: Reallocate ${transferQty || 20} units of ${medicine || 'Critical Medicine'}.

Focus on preventing wastage, addressing outbreak/patient load spikes, and solving shortages. Do not include markdown headings or introductory fluff.`;

  try {
    const explanation = await generateWithGemini(prompt);
    return {
      success: true,
      explanation,
    };
  } catch (err) {
    console.error('[llmService] Gemini Explain Error:', err.message);
    return {
      success: true,
      explanation: `Reallocating ${transferQty || 'requested'} units of ${medicine || 'medicine'} from ${sourceHospital || 'source facility'} to ${targetHospital || 'target facility'} prevents imminent stockout exhaustion (currently ${daysLeft || 2} days remaining) while preventing expiration wastage from source reserves.`,
      fallback: true,
    };
  }
}

module.exports = {
  answerRagQuery,
  explainRedistribution,
  gatherRagContext,
};
