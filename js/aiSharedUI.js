export function showAILoading(el, text = "AI đang xử lý...") {
  if (!el) return;
  el.innerHTML = `
    <div class="ai-loading-box">
      <div class="ai-spinner"></div>
      <div class="ai-loading-text">${text}</div>
    </div>
  `;
}

export function showAIError(el, text = "Đã có lỗi xảy ra.") {
  if (!el) return;
  el.innerHTML = `
    <div class="ai-error-box">
      ❌ ${text}
    </div>
  `;
}

export function showAISuccess(el, html = "") {
  if (!el) return;
  el.innerHTML = `
    <div class="ai-success-box">
      ${html}
    </div>
  `;
}

export async function copyTextToClipboard(text = "") {
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    window.showToast?.("📋 Đã copy nội dung AI", "success");
  } catch (e) {
    console.error("Copy lỗi:", e);
    window.showToast?.("Không copy được", "error");
  }
}