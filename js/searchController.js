import { searchDictionary } from "./searchService.js";
import { renderResults } from "./searchUI.js";

export function initSearch() {
  const input = document.getElementById("searchInput");
  const btn = document.getElementById("searchBtn");
  const resultBox = document.getElementById("searchResults");
  const searchBox = document.querySelector(".search-box");

  if (!input || !resultBox || !searchBox) return;

  let timeout;
  let isSearching = false;

  async function doSearch() {
    if (isSearching) return;

    const keyword = input.value.trim();

    if (!keyword) {
      window.closeSearch();
      return;
    }

    searchBox.classList.add("active");
    isSearching = true;

    try {
      const dict = await searchDictionary(keyword);
      renderResults(resultBox, keyword, dict);
      runTranslate(keyword);
    } catch (err) {
      console.error(err);
      resultBox.innerHTML = "❌ Lỗi tìm kiếm";
    }

    isSearching = false;
  }

  input.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(doSearch, 400);
  });

  btn?.addEventListener("click", (e) => {
    e.preventDefault();
    doSearch();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doSearch();
    }
  });
}

async function runTranslate(text) {
  const box = document.getElementById("translateResult");
  if (!box) return;

  box.innerHTML = `<div class="loading-translate">⏳ Đang dịch...</div>`;

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${detectLangPair(text)}`
    );

    const data = await res.json();
    const translated = data.responseData?.translatedText || "Không có kết quả";

    box.innerHTML = `
      <div class="translate-box animate-in">

        <div class="tools">
          <button class="tool-btn speak-btn" onclick="speakText('${escapeQuote(text)}', 'en-US', this)" title="Nghe phát âm">🔊</button>
          <button class="tool-btn copy-btn" onclick="copyText('${escapeQuote(translated)}', this)" title="Sao chép">📋</button>
          <button class="tool-btn close-btn" onclick="escText()" title="Đóng">✕</button>
        </div>

        <div class="translate-result">
          ${translated}
        </div>

      </div>
    `;
  } catch (err) {
    console.error(err);
    box.innerHTML = `<div class="loading-translate">❌ Lỗi dịch</div>`;
  }
}

// 🔊 phát âm + hiệu ứng sáng nút
window.speakText = function(text, lang = "en-US", btn = null) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = lang;

  speechSynthesis.cancel();

  if (btn) {
    btn.classList.add("speaking");
    msg.onend = () => btn.classList.remove("speaking");
    msg.onerror = () => btn.classList.remove("speaking");
  }

  speechSynthesis.speak(msg);
};

// 📋 copy + thông báo đẹp
window.copyText = async function(text, btn = null) {
  try {
    await navigator.clipboard.writeText(text);

    if (btn) {
      const old = btn.innerHTML;
      btn.innerHTML = "✔";
      btn.classList.add("copied");

      setTimeout(() => {
        btn.innerHTML = old;
        btn.classList.remove("copied");
      }, 1200);
    }

    showToast("📋 Đã copy");
  } catch (err) {
    console.error("Copy lỗi:", err);
    showToast("❌ Copy thất bại");
  }
};

// ❌ đóng translate
window.escText = function() {
  window.closeSearch();
};

function detectLangPair(text) {
  const isVN = /[àáạảãâăđêôơư]/i.test(text);
  return isVN ? "vi|en" : "en|vi";
}

// đóng toàn bộ search
window.closeSearch = function() {
  const input = document.getElementById("searchInput");
  const box = document.getElementById("searchResults");
  const translateBox = document.getElementById("translateResult");
  const searchBox = document.querySelector(".search-box");

  speechSynthesis.cancel();

  if (box) box.innerHTML = "";
  if (translateBox) translateBox.innerHTML = "";
  if (input) input.value = "";
  if (searchBox) searchBox.classList.remove("active");
};

// ESC để đóng cực mượt
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    window.closeSearch();
  }
});

// toast mini
function showToast(message) {
  let toast = document.getElementById("miniToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "miniToast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.__toastTimeout);
  window.__toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 1500);
}

// tránh lỗi dấu nháy trong onclick
function escapeQuote(str) {
  return String(str).replace(/'/g, "\\'");
}