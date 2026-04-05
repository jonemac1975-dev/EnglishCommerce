export function wrapAiContent(text = "") {
  if (!text) return "";

  // 1. escape HTML
  let html = escapeHtml(text);

  // 2. chuẩn hóa xuống dòng
  const lines = html.split(/\r?\n/);

  // 3. xử lý từng dòng
  html = lines.map(line => {
    line = line.trim();
    if (!line) return "<br>";

    // Tiêu đề dạng "1. ..." hoặc "Câu 1. ..."
    if (/^\d+\.\s/.test(line) || /^Câu\s+\d+\./i.test(line)) {
      return `<div class="ai-block-title">${line}</div>`;
    }

    // Bullet 2 cấp "--" phải đặt trước "-"
    if (/^-- /.test(line)) {
      return `<div class="ai-bullet" style="margin-left:16px">◦ ${line.slice(3)}</div>`;
    }

    // Bullet 1 cấp "-"
    if (/^- /.test(line)) {
      return `<div class="ai-bullet">• ${line.slice(2)}</div>`;
    }

    // Đáp án A/B/C/D
    if (/^[A-D]\.\s/.test(line)) {
      const isCorrect = /\*$/.test(line);

      const cleanLine = line.replace(/\*$/, "").trim();

      return `
        <div class="ai-answer-line ${isCorrect ? "correct-answer" : ""}">
          ${cleanLine}${isCorrect ? ' <span class="ai-answer-key">✓</span>' : ""}
        </div>
      `;
    }

    // Mặc định dòng text thường
    return `<div class="ai-text-line">${line}</div>`;
  }).join("");

  return `<div class="ai-render-content">${html}</div>`;
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}