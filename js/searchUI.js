export function renderResults(container, keyword, dict) {
  let html = `
    <div class="search-header">${keyword}</div>

    <div class="search-tabs">
      <button class="active" onclick="switchTab('translate')">Translate</button>
      <button onclick="switchTab('dict')">Vocabulary</button>
    </div>

    <div class="esc-hint">👉 Nhấn ESC hoặc [X] để thoát</div>

    <!-- TRANSLATE -->
    <div class="tab-content" id="tab-translate">
      <div id="translateResult" class="translate-box"></div>
    </div>
  `;

  // DICTIONARY
  html += `<div class="tab-content" id="tab-dict" style="display:none">`;

  if (dict) {
    html += `
      <div class="search-item dict">
        <div class="title">${dict.word}</div>
        <div class="desc">
          ${dict.meanings?.[0]?.definitions?.[0]?.definition || ""}
        </div>
      </div>
    `;
  } else {
    html += `<div>❌ Không có từ</div>`;
  }

  html += `</div>`;

  container.innerHTML = html;

  // 🔥 luôn mở translate
  window.switchTab && window.switchTab("translate");
}