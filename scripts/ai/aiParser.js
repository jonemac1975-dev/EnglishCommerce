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

    // Tiêu đề dạng "1. ..."
    if (/^\d+\.\s/.test(line)) {
      return `<div class="ai-block-title">${line}</div>`;
    }

    // Bullet 1 cấp "-"
    if (/^- /.test(line)) {
      return `<div class="ai-bullet">• ${line.slice(2)}</div>`;
    }

    // Bullet 2 cấp "--"
    if (/^-- /.test(line)) {
      return `<div class="ai-bullet" style="margin-left:16px">◦ ${line.slice(3)}</div>`;
    }

    // Đáp án A/B/C/D
    if (/^[A-D]\.\s/.test(line)) {
      return `<div class="ai-answer-line">${line}</div>`;
    }

    // Mặc định dòng text thường
    return line;
  }).join("<br>");

  return `<div class="ai-render-content">${html}</div>`;
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}