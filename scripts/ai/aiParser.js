export function wrapAiContent(text = "") {
  if (!text) return "";

  let html = escapeHtml(text);
  const lines = html.split(/\r?\n/);

  html = lines.map(line => {
    line = line.trim();
    if (!line) return "<br>";

    // Tiêu đề dạng "1. ..." hoặc "Câu 1. ..."
    if (/^\d+\.\s/.test(line) || /^Câu\s+\d+\./i.test(line)) {
      return `<div class="ai-block-title">${line}</div>`;
    }

    // Bullet cấp 2
    if (/^-- /.test(line)) {
      return `<div class="ai-bullet" style="margin-left:16px">◦ ${line.slice(3)}</div>`;
    }

    // Bullet cấp 1
    if (/^- /.test(line)) {
      return `<div class="ai-bullet">• ${line.slice(2)}</div>`;
    }

    // Đáp án A/B/C/D
    if (/^[A-D]\.\s/.test(line)) {
      const isCorrect = /\s*\*$/.test(line);
      const cleanLine = line.replace(/\s*\*$/, "").trim();

      return `
        <div class="ai-answer-line ${isCorrect ? "correct-answer" : ""}">
          ${cleanLine}${isCorrect ? " *" : ""}
        </div>
      `;
    }

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