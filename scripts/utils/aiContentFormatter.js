
export function normalizeAIContent(raw = "", type = "lesson") {
  if (!raw) return "";

  let text = String(raw)
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u00A0/g, " ")
    .trim();

  // =========================
  // LESSON
  // =========================
  if (type === "lesson") {
    return text;
  }

  // =========================
  // EXERCISE / EXAM / TOEIC
  // =========================
  if (type === "exam" || type === "toeic" || type === "exercise") {
    const lines = text
      .split("\n")
      .map(x => x.trim())
      .filter(Boolean);

    const out = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // bỏ markdown heading
      line = line.replace(/^#{1,6}\s*/, "");

      // ===== tiêu đề =====
      if (
        i === 0 &&
        !/^câu\s*\d+/i.test(line) &&
        !/^tự luận/i.test(line) &&
        !/^[A-D]\s*[\.\,\)\-:]/i.test(line)
      ) {
        out.push(line);
        continue;
      }

      // ===== câu hỏi =====
      if (/^câu\s*\d+/i.test(line) || /^\d+\./.test(line)) {
        line = line
          .replace(/^\d+\.\s*/, match => {
            const num = match.replace(".", "").trim();
            return `Câu ${num}. `;
          })
          .replace(/^câu\s*/i, "Câu ");

        out.push(line);
        continue;
      }

      // ===== đáp án A/B/C/D => GIỮ DẤU * =====
      if (/^[A-D]\s*[\.\,\)\-:]/i.test(line)) {
        const hasStar = /\*\s*$/.test(line);

        line = line
          .replace(/^([A-D])\s*[\.\,\)\-:]\s*/i, "$1. ")
          .replace(/\s*\*\s*$/, "")
          .trim();

        if (hasStar) line += "*";

        out.push(line);
        continue;
      }

      // ===== tự luận =====
      if (/^tự luận/i.test(line)) {
        out.push("Tự luận");
        continue;
      }

      // ===== dòng thường =====
      out.push(line);
    }

    return out.join("\n");
  }

  return text;
}

/* =====================================================
   HTML render phụ trợ
===================================================== */
export function plainTextToHtmlParagraphs(text = "") {
  if (!text) return "";

  return String(text)
    .split("\n")
    .map(line => {
      const clean = line.trim();
      if (!clean) return "<p><br></p>";
      return `<p>${escapeHtml(clean)}</p>`;
    })
    .join("");
}

/* =====================================================
   Alias cũ để không lỗi import
===================================================== */
export function normalizeTeachingContent(raw = "", type = "lesson") {
  return normalizeAIContent(raw, type);
}

/* =====================================================
   Escape HTML
===================================================== */
export function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function autoFixMissingAnswerStars(text = "", type = "lesson") {
  if (!text) return text;

  // Chỉ áp dụng cho dạng có đáp án trắc nghiệm
  if (!["exercise", "exam", "toeic"].includes(type)) {
    return text;
  }

  const lines = String(text).split("\n");

  let hasAnyStar = lines.some(line => /\*\s*$/.test(line.trim()));
  if (hasAnyStar) return text; // đã có * rồi thì thôi

  let currentQuestionAnswers = [];
  let result = [];

  function flushQuestionAnswers() {
    if (!currentQuestionAnswers.length) return;

    // Nếu không có dấu *, mặc định gắn vào đáp án B để hệ thống không bị mất key
    let hasStar = currentQuestionAnswers.some(x => /\*\s*$/.test(x.trim()));

    if (!hasStar && currentQuestionAnswers.length >= 2) {
      currentQuestionAnswers = currentQuestionAnswers.map((line, idx) => {
        if (idx === 1) return line.replace(/\s*\*?\s*$/, "") + "*"; // mặc định B đúng
        return line.replace(/\s*\*?\s*$/, "");
      });
    }

    result.push(...currentQuestionAnswers);
    currentQuestionAnswers = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // gặp câu mới => flush đáp án câu trước
    if (/^câu\s*\d+/i.test(line.trim()) || /^\d+\./.test(line.trim())) {
      flushQuestionAnswers();
      result.push(line);
      continue;
    }

    // gom đáp án A/B/C/D
    if (/^[A-D]\s*[\.\,\)\-:]/i.test(line.trim())) {
      currentQuestionAnswers.push(line.trim());
      continue;
    }

    // dòng khác
    flushQuestionAnswers();
    result.push(line);
  }

  flushQuestionAnswers();

  return result.join("\n");
}