// /scripts/services/aiService.js
import { AI_CONFIG } from "../../config/aiConfig.js";

/* =========================
   MAIN CALL V5 (CLEAN PIPELINE)
========================= */
export async function askAI({
  type = "lesson",
  prompt = "",
  payload = {},
  userId = null,
  role = "teacher"
} = {}) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      AI_CONFIG.TIMEOUT_MS || 60000
    );

    const res = await fetch(AI_CONFIG.WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        userId: userId || getCurrentUserId(),
        role,
        mode: normalizeMode(type),

        // 🔥 CRITICAL FIX: enforce single prompt source
        prompt: buildSafePrompt(prompt, payload, type),
        payload: sanitizePayload(payload)
      })
    });

    clearTimeout(timeout);

    const data = await res.json().catch(() => ({}));

    console.log("🧠 AI RAW RESPONSE:", data);

    if (!data?.ok) {
      return fallback(type, "worker_error");
    }

    return {
      success: true,
      text: data.result,   // 🔥 always string
      mode: data.mode,
      provider: data.provider
    };

  } catch (err) {
    return fallback(type, "network_error");
  }
}

/* =========================
   PROMPT SAFETY LAYER (ANTI-CONFLICT)
========================= */
function buildSafePrompt(prompt, payload, type) {
  const base = prompt?.trim() || "";

  return `
YOU ARE STRICT AI ENGINE.

RULES (HARD):
- Output ONLY final answer
- NO explanation
- NO markdown intro text
- NO "Here is..."
- NO extra commentary
- IF JSON → return VALID JSON ONLY

MODE: ${type}

DATA:
${JSON.stringify(payload, null, 2)}

USER_PROMPT:
${base}
`.trim();
}

/* =========================
   CLEAN PAYLOAD
========================= */
function sanitizePayload(payload = {}) {
  return {
    chuDe: payload?.chuDe || "",
    monHoc: payload?.monHoc || "English",
    trinhDo: payload?.trinhDo || "A2",
    soLuong: Number(payload?.soLuong || 5),
    soCau: Number(payload?.soCau || 5),
    duLieuGoc: payload?.duLieuGoc || "",
    lessonContext: payload?.lessonContext || null
  };
}

/* =========================
   MODE
========================= */
function normalizeMode(type = "") {
  const t = String(type).toLowerCase();
  if (t.includes("lesson")) return "lesson";
  if (t.includes("exercise")) return "exercise";
  if (t.includes("exam")) return "exam";
  if (t.includes("pptx")) return "pptx";
  return "lesson";
}

/* =========================
   FALLBACK SAFE
========================= */
function fallback(type, reason) {
  return {
    success: true,
    text: `AI fallback mode (${type})`,
    fakeMode: true,
    provider: "fallback_v5",
    reason
  };
}

/* =========================
   USER ID
========================= */
function getCurrentUserId() {
  return localStorage.getItem("teacher_id") || "demo";
}