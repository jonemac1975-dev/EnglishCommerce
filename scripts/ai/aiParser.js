export function wrapAiContent(text = "") {
  if (!text) return "";

  let html = text;

  html = html
    .replace(/=== (.*?) ===/g, '<h2>📘 $1</h2>')
    .replace(/--- (.*?) ---/g, '<h3>🔹 $1</h3>')
    .replace(/\n/g, "<br>");

  return `<div class="ai-rendered-content">${html}</div>`;
}


function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}