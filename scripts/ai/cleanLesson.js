export async function cleanLesson(rawText) {
  try {
    if (!rawText) return "";

    let text = String(rawText);

    text = text
      .replace(/\r/g, "")
      .replace(/\t/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")

      // 🔥 FIX IPA vỡ dòng
      .replace(/IP\s*\n\s*A:/gi, "IPA:")
      .replace(/IP\s*A:/gi, "IPA:")

      // 🔥 remove markdown
      .replace(/\*\*/g, "")
      .replace(/^\*\s+/gm, "")

      // 🔥 normalize key
      .replace(/Word:/gi, "Từ:")

      .trim();

    return text;

  } catch (err) {
    console.error("cleanLesson error:", err);
    return String(rawText || "");
  }
}
