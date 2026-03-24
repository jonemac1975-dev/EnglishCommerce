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
      resultBox.innerHTML = "";
      searchBox.classList.remove("active");
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
      doSearch();
    }
  });
}

async function runTranslate(text) {
  const box = document.getElementById("translateResult");
  if (!box) return;

  box.innerHTML = "⏳ Đang dịch...";

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${detectLangPair(text)}`
    );

    const data = await res.json();
    const translated = data.responseData.translatedText;

    box.innerHTML = `
  <div class="translate-box">

    <div class="tools">
      <button onclick="speakText('${text}', 'en-US')">🔊</button>
      <button onclick="copyText('${text}')">📋</button>
    </div>

    <div class="translate-result">
      ${translated}
    </div>

  </div>
`;
  } catch (err) {
    console.error(err);
    box.innerHTML = "❌ Lỗi dịch";
  }
}


// 🔊 phát âm
window.speakText = function(text, lang = "en-US") {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = lang;
  speechSynthesis.cancel(); // stop cái cũ
  speechSynthesis.speak(msg);
};

// 📋 copy
window.copyText = function(text) {
  navigator.clipboard.writeText(text);
};



function detectLangPair(text) {
  const isVN = /[àáạảãâăđêôơư]/i.test(text);
  return isVN ? "vi|en" : "en|vi";
}

window.closeSearch = function() {
  const box = document.getElementById("searchResults");
  const searchBox = document.querySelector(".search-box");

  if (box) box.innerHTML = "";
  if (searchBox) searchBox.classList.remove("active");
};


document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    window.closeSearch && window.closeSearch();
  }
});