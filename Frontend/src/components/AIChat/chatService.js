/**
 * chatService.js — Local Mock Response System for MedSupply AI Assistant
 *
 * ARCHITECTURAL PRINCIPLE:
 * This is an interface layer for explaining MedSupply data.
 * It is NOT the decision engine (no PuLP, no clinical optimization).
 *
 * In Phase 4, the implementation inside `sendChatMessage` can easily be replaced with:
 *   const res = await apiFetch('/chat', { method: 'POST', body: JSON.stringify({ message }) });
 *   return res.data;
 */

export const SUGGESTED_QUESTIONS = [
  "Which hospitals are at stockout risk?",
  "What medicines are expiring soon?",
  "Why was this transfer recommended?",
  "Show today's critical alerts",
  "How much stock is available?"
];

/**
 * Predefined responses based on MedSupply telemetry contracts
 */
const PREDEFINED_RESPONSES = {
  stockout:
    "3 hospitals are currently at high stockout risk. Hospital A is projected to run out of insulin in 4 days, while Hospital B may face a shortage in 6 days.",

  expiring:
    "1,250 units across 4 batches are expected to expire within the next 30 days. The highest expiry risk is currently concentrated at Hospital C.",

  transfer:
    "The recommendation is based on a projected shortage at Hospital A and available surplus at Hospital C. The system also considers safety stock, expiry risk, priority, and transport time.",

  alerts:
    "There are 4 critical alerts today: 2 stockout risks, 1 urgent expiry risk, and 1 high-priority transfer recommendation.",

  stock:
    "The network currently has 12,450 tracked units across participating hospitals."
};

const DEFAULT_FALLBACK_RESPONSE =
  "I can currently help with stockout risks, expiry alerts, inventory levels, forecasts, and transfer recommendations.";

/**
 * Sends a message and returns the assistant's answer.
 * Simulates a realistic typing delay (600–900ms).
 */
export async function sendChatMessage(query) {
  const normalized = (query || "").trim().toLowerCase();

  // Simulate network / AI inference latency
  await new Promise((resolve) => setTimeout(resolve, 750));

  // 1. Stockout risk query
  if (
    normalized.includes("stockout") ||
    normalized.includes("run out") ||
    normalized.includes("shortage") ||
    (normalized.includes("risk") && normalized.includes("hospital"))
  ) {
    return PREDEFINED_RESPONSES.stockout;
  }

  // 2. Expiry query
  if (
    normalized.includes("expir") ||
    normalized.includes("shelf life") ||
    normalized.includes("batches")
  ) {
    return PREDEFINED_RESPONSES.expiring;
  }

  // 3. Transfer recommendation rationale query
  if (
    normalized.includes("transfer") ||
    normalized.includes("recommended") ||
    normalized.includes("redistribut") ||
    normalized.includes("route")
  ) {
    return PREDEFINED_RESPONSES.transfer;
  }

  // 4. Critical alerts query
  if (
    normalized.includes("alert") ||
    normalized.includes("critical") ||
    normalized.includes("urgent") ||
    normalized.includes("warning")
  ) {
    return PREDEFINED_RESPONSES.alerts;
  }

  // 5. Total stock / inventory availability query
  if (
    normalized.includes("how much stock") ||
    normalized.includes("total stock") ||
    normalized.includes("available") ||
    normalized.includes("inventory level")
  ) {
    return PREDEFINED_RESPONSES.stock;
  }

  // 6. Generic/Help fallback
  return DEFAULT_FALLBACK_RESPONSE;
}
