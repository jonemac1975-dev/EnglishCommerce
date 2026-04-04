import { writeData } from "../services/firebaseService.js";

export async function logAIRequest({
  userId = "unknown",
  type = "unknown",
  input = {},
  prompt = "",
  output = ""
} = {}) {
  try {
    const id = "ai_" + Date.now();

    await writeData(`logs/ai_requests/${id}`, {
      userId,
      type,
      input,
      prompt,
      output,
      created_at: Date.now()
    });
  } catch (err) {
    console.warn("⚠️ Không ghi được AI log:", err);
  }
}