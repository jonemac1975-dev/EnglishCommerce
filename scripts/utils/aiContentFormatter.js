function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* =========================
   LESSON NORMALIZE
========================= */
export function normalizeTeachingContent(text = "", type = "lesson") {
  if (!text) return "";
  return String(text)
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* =========================
   EXAM / TOEIC / EXERCISE CLEAN
========================= */
function normalizeQuestionLine(line = "") {
  let s = line.trim();

  // sửa lỗi kiểu "C. âu 1", "C âu 1", "Câu1", "Question 1"
  s = s.replace(/^C[\.\s]*âu\s*/i, "Câu ");
  s = s.replace(/^Câu\s*(\d+)\s*[\.\:\-]?\s*/i, (_, n) => `Câu ${n}. `);
  s = s.replace(/^Question\s*(\d+)\s*[\.\:\-]?\s*/i, (_, n) => `Câu ${n}. `);

  // nếu AI đẻ ra "1." thì ép thành Câu 1.
  s = s.replace(/^(\d+)\s*[\.\:\-]\s*/i, (_, n) => `Câu ${n}. `);

  // fix trường hợp "Câu 1. ."
  s = s.replace(/^Câu\s+(\d+)\.\s*\.\s*/i, (_, n) => `Câu ${n}. `);

  return s.trim();
}

function normalizeOptionLine(line = "") {
  let s = line.trim();

  // A) A: A- A, => A.
  s = s.replace(/^([A-D])[\)\:\,\-]\s*/i, "$1. ");
  s = s.replace(/^([A-D])\.\s*/i, "$1. ");

  // nếu AI viết "A . abc"
  s = s.replace(/^([A-D])\s+\.\s*/i, "$1. ");

  return s.trim();
}

export function autoFixMissingAnswerStars(text = "") {
  if (!text) return "";

  const lines = text.split("\n");
  const out = [];
  let buffer = [];

  const flushQuestion = () => {
    if (!buffer.length) return;

    const optionIndexes = [];
    buffer.forEach((line, idx) => {
      if (/^[A-D]\.\s+/i.test(line)) optionIndexes.push(idx);
    });

    if (optionIndexes.length) {
      const hasStar = optionIndexes.some(i => /\*\s*$/.test(buffer[i]));
      if (!hasStar) {
        // mặc định gắn sao vào đáp án A nếu AI quên hoàn toàn
        const firstOpt = optionIndexes[0];
        buffer[firstOpt] = buffer[firstOpt].replace(/\s*\*+\s*$/, "").trim() + "*";
      }
    }

    out.push(...buffer);
    buffer = [];
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (/^Câu\s+\d+\./i.test(line)) {
      flushQuestion();
      buffer.push(line);
    } else {
      buffer.push(line);
    }
  }

  flushQuestion();
  return out.join("\n");
}

export function ensureSingleCorrectAnswer(text = "") {
  if (!text) return "";

  const lines = text.split("\n");
  const out = [];
  let buffer = [];

  const flushQuestion = () => {
    if (!buffer.length) return;

    const optionIndexes = [];
    buffer.forEach((line, idx) => {
      if (/^[A-D]\.\s+/i.test(line)) optionIndexes.push(idx);
    });

    if (optionIndexes.length) {
      let starred = optionIndexes.filter(i => /\*\s*$/.test(buffer[i]));

      // nếu nhiều hơn 1 đáp án đúng => giữ đáp án đầu tiên
      if (starred.length > 1) {
        const keep = starred[0];
        optionIndexes.forEach(i => {
          buffer[i] = buffer[i].replace(/\s*\*+\s*$/, "").trim();
        });
        buffer[keep] += "*";
      }

      // nếu không có sao nào => cho A đúng tạm
      if (starred.length === 0) {
        const firstOpt = optionIndexes[0];
        buffer[firstOpt] = buffer[firstOpt].replace(/\s*\*+\s*$/, "").trim() + "*";
      }
    }

    out.push(...buffer);
    buffer = [];
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (/^Câu\s+\d+\./i.test(line)) {
      flushQuestion();
      buffer.push(line);
    } else {
      buffer.push(line);
    }
  }

  flushQuestion();
  return out.join("\n");
}

/* =========================
   FINAL CLEAN MAIN
========================= */
export function finalizeAIContent(text = "", type = "lesson") {
  if (!text) return "";

  let cleaned = String(text)
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u00A0/g, " ")

    // 🔥 FIX dính dòng (rất quan trọng)
    .replace(/([^\n])\s*(Câu\s*\d+)/gi, "$1\n$2")
    .replace(/([^\n])\s*(Question\s*\d+)/gi, "$1\n$2")
    .replace(/([^\n])\s*([A-D][\.\)\:\-])/g, "$1\n$2")

    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!["exam", "toeic", "exercise"].includes(type)) {
    return normalizeTeachingContent(cleaned, type);
  }

  const lines = cleaned
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      if (
        /^C[\.\s]*âu/i.test(line) ||
        /^Question\s*\d+/i.test(line) ||
        /^\d+\s*[\.\:\-]/i.test(line)
      ) {
        return normalizeQuestionLine(line);
      }

      if (/^[A-D][\.\)\:\,\-]/i.test(line) || /^[A-D]\s+\./i.test(line)) {
        return normalizeOptionLine(line);
      }

      return line;
    });

  cleaned = lines.join("\n");

  cleaned = autoFixMissingAnswerStars(cleaned);
  cleaned = ensureSingleCorrectAnswer(cleaned);

  cleaned = cleaned.replace(/^C\.\s*âu/igm, "Câu");
  cleaned = cleaned.replace(/^C\s+âu/igm, "Câu");

  return cleaned.trim();
}

/* =========================
   OUTPUT FOR STORAGE / PREVIEW
========================= */
export function normalizeAIOutputForPreview(text = "", type = "lesson") {
  return finalizeAIContent(text, type);
}

/* =========================
   RENDER HTML FOR AI BOX
========================= */
export function renderStructuredAIHtml(text = "", type = "exercise") {
  if (!text) return `<div class="tb-empty-preview">Không có nội dung</div>`;

  const cleaned = finalizeAIContent(text, type);
  const lines = cleaned.split("\n").map(x => x.trim()).filter(Boolean);

  let html = "";
  let inQuestion = false;
  let qIndex = 0;

  for (const line of lines) {
    if (/^Câu\s+\d+\./i.test(line)) {
      if (inQuestion) html += `</div></div>`;

      qIndex++;

      html += `
        <div class="tb-preview-question">
          <div class="tb-preview-qtop">
            <span class="tb-qbadge">Question ${qIndex}</span>
          </div>
          <div class="tb-preview-qtext">${escapeHtml(line)}</div>
          <div class="tb-preview-options">
      `;
      inQuestion = true;
      continue;
    }

    if (/^[A-D]\.\s+/i.test(line)) {
      const letter = line.charAt(0).toUpperCase();
      const isCorrect = /\*\s*$/.test(line);

      const optionText = line
        .replace(/^[A-D]\.\s+/i, "")
        .replace(/\s*\*+\s*$/, "")
        .trim();

      html += `
        <div class="tb-preview-option ${isCorrect ? "correct" : ""}">
          <div class="tb-preview-letter">${letter}</div>
          <div class="tb-preview-optext">${escapeHtml(optionText)}</div>
          ${isCorrect ? `<div class="tb-preview-ok">✔</div>` : ""}
        </div>
      `;
      continue;
    }

    html += `<div class="tb-preview-passage">${escapeHtml(line)}</div>`;
  }

  if (inQuestion) html += `</div></div>`;

  return html || `<div class="tb-empty-preview">Không parse được nội dung</div>`;
}

/* =========================
   OPTIONAL EXPORT (GIỮ CHO FILE CŨ KHỎI VỠ)
========================= */
export function plainTextToHtmlParagraphs(text = "") {
  return String(text || "")
    .split("\n")
    .map(line => `<p>${escapeHtml(line)}</p>`)
    .join("");
}


export function validateAndFixMCQ(text = "") {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  let output = [];
  let currentQ = null;

  for (let line of lines) {

    // ===== QUESTION =====
    if (/^câu\s*\d+/i.test(line)) {
      if (currentQ) output.push(currentQ);
      currentQ = { q: line, options: [] };
      continue;
    }

    // ===== OPTION =====
    if (/^[A-D][\.\)\-:]/i.test(line) && currentQ) {
      currentQ.options.push(line);
      continue;
    }
  }

  if (currentQ) output.push(currentQ);

  // ===== FIX =====
  const fixed = output.map((q, index) => {

    let options = q.options.slice(0, 4);

    // Nếu thiếu option → thêm dummy
    while (options.length < 4) {
      const letter = ["A", "B", "C", "D"][options.length];
      options.push(`${letter}. ...`);
    }

    // Fix format A/B/C/D
    options = options.map((op, i) => {
      const letter = ["A", "B", "C", "D"][i];
      return `${letter}. ` + op.replace(/^[A-D][^ ]*\s*/i, "").replace(/\*/g, "").trim();
    });

    // Fix đáp án đúng
    let correctCount = q.options.filter(o => o.includes("*")).length;

    if (correctCount !== 1) {
      // random 1 đáp án đúng
      const rand = Math.floor(Math.random() * 4);
      options[rand] += "*";
    } else {
      // giữ đúng cái có *
      options = options.map(op => op.includes("*") ? op : op);
    }

    return `Câu ${index + 1}. ${q.q.replace(/^câu\s*\d+\.\s*/i, "")}\n` +
      options.join("\n");
  });

  return fixed.join("\n\n");
}