import {
  writeData,
  readData,
  deleteData
} from "../services/firebaseService.js";

/* =========================
   LOG AI REQUEST
========================= */
export async function logAIRequest({
  userId = "unknown",
  type = "unknown",
  input = {},
  prompt = "",
  output = "",
  provider = "unknown",
  fakeMode = false
} = {}) {
  try {
    // Không log AI fake để đỡ rác
    if (fakeMode) return;

    const now = Date.now();
    const id = "ai_" + now;
    const expireAt = now + 1000 * 60 * 10; // 10 phút

    await writeData(`logs/ai_requests/${userId}/${id}`, {
      userId,
      type,
      provider,
      fakeMode,
      created_at: now,
      expireAt,

      // debug nhẹ, tránh lưu quá nặng
      prompt_preview: String(prompt || "").slice(0, 300),
      output_preview: String(output || "").slice(0, 500)
    });

    console.log("📝 AI log saved");
  } catch (err) {
    console.warn("⚠️ Không ghi được AI log:", err);
  }
}

/* =========================
   CLEAR EXPIRED AI LOGS
========================= */
export async function clearExpiredAILogs(userId = "unknown") {
  try {
    const logs = await readData(`logs/ai_requests/${userId}`);
    if (!logs) return;

    const now = Date.now();
    const deleteTasks = [];

    Object.entries(logs).forEach(([key, item]) => {
      if (!item?.expireAt || item.expireAt <= now) {
        deleteTasks.push(deleteData(`logs/ai_requests/${userId}/${key}`));
      }
    });

    await Promise.all(deleteTasks);

    if (deleteTasks.length) {
      console.log(`🧹 Đã xóa ${deleteTasks.length} AI logs hết hạn`);
    }
  } catch (err) {
    console.warn("⚠️ Không clear được AI logs hết hạn:", err);
  }
}

/* =========================
   CLEAR ALL MY AI LOGS
========================= */
export async function clearAllMyAILogs(userId = "unknown") {
  try {
    await deleteData(`logs/ai_requests/${userId}`);
    console.log("🧹 Đã xóa toàn bộ AI logs");
  } catch (err) {
    console.warn("⚠️ Không xóa được toàn bộ AI logs:", err);
  }
}