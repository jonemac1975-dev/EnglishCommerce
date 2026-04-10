// /pages/teacher/js/pptxExporter.js

const PPTX_HISTORY_KEY = "pptx_recent_slides";

/* =========================
   LOAD LIB
========================= */
async function loadPptxLib() {
  if (window.PptxGenJS || window.PptxGen) return;

  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/pptxgenjs/dist/pptxgen.bundle.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/* =========================
   MAIN EXPORT
========================= */
export async function exportSlidesToPptx(pptData = {}) {
  await loadPptxLib();

  const PptxLib = window.PptxGenJS || window.PptxGen;

  if (!PptxLib) {
    console.error("❌ Không tìm thấy PptxGenJS", window);
    throw new Error("Thiếu thư viện PptxGenJS.");
  }

  const title = String(pptData?.title || "AI Presentation").trim();
  const targetCount = pptData?.slideCount || 10;

  const slidesRaw = Array.isArray(pptData?.slides) ? pptData.slides : [];

  if (!slidesRaw.length) {
    throw new Error("Không có slide nào để xuất PPTX.");
  }

  const slides = normalizeSlides(slidesRaw, targetCount);

  console.log("🎯 Slides final:", slides.length);

  const pptx = new PptxLib();

  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "ChatGPT AI PPTX";
  pptx.company = "Teacher AI";
  pptx.subject = title;
  pptx.title = title;
  pptx.lang = "vi-VN";

  pptx.theme = {
    headFontFace: "Arial",
    bodyFontFace: "Arial",
    lang: "vi-VN"
  };

  // ✅ Save history đúng chuẩn
  saveRecentSlides({
    title,
    slides,
    slideCount: slides.length
  });

  slides.forEach((slideData, index) => {
    const slide = pptx.addSlide();
    renderSlide(slide, slideData, index + 1, title);
  });

  const safeName = sanitizeFileName(title) || "AI_Presentation";
  await pptx.writeFile({ fileName: `${safeName}.pptx` });
}

/* =========================
   NORMALIZE SLIDES
========================= */
function normalizeSlides(slides = [], target = 10) {
  let out = [...slides];

  if (out.length > target) {
    return out.slice(0, target);
  }

  while (out.length < target) {
    out.push({
      type: "content",
      title: "Nội dung bổ sung",
      bullets: ["Đang cập nhật nội dung"]
    });
  }

  return out;
}

/* =========================
   RENDER SLIDE
========================= */
function renderSlide(slide, data = {}, index = 1, deckTitle = "") {
  const type = String(data?.type || "content").toLowerCase();
  const title = safeText(data?.title || `Slide ${index}`);
  const subtitle = safeText(data?.subtitle || "");
  const bullets = Array.isArray(data?.bullets) ? data.bullets : [];
  const questions = Array.isArray(data?.questions) ? data.questions : [];
  const notes = safeText(data?.speakerNotes || "");

  slide.background = { color: "F7F9FC" };

  // Footer
  slide.addText(`${deckTitle} • ${index}`, {
    x: 0.4,
    y: 7.1,
    w: 12.3,
    h: 0.3,
    fontSize: 9,
    color: "666666",
    align: "right"
  });

  // Title
  slide.addText(title, {
    x: 0.6,
    y: type === "cover" ? 1.0 : 0.8,
    w: 12,
    h: 0.6,
    fontSize: type === "cover" ? 24 : 20,
    bold: true
  });

  // Subtitle
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.7,
      y: type === "cover" ? 1.8 : 1.5,
      w: 11.5,
      h: 0.4,
      fontSize: 12,
      italic: true
    });
  }

  if (type === "cover") {
    renderCover(slide, bullets, questions);
  } else if (type === "activity" || type === "practice") {
    renderQuestionSlide(slide, bullets, questions);
  } else {
    renderBulletSlide(slide, bullets, questions);
  }

  // Notes
  if (notes) {
    slide.addText(`Ghi chú GV: ${notes}`, {
      x: 0.7,
      y: 6.5,
      w: 11.5,
      h: 0.4,
      fontSize: 9,
      italic: true,
      color: "777777"
    });
  }
}

/* =========================
   SLIDE TYPES
========================= */
function renderCover(slide, bullets = [], questions = []) {
  const lines = [...bullets, ...questions].slice(0, 4);

  slide.addText(
    lines.length
      ? lines.map(i => `• ${safeText(i)}`).join("\n")
      : "Bài giảng được tạo bởi AI",
    {
      x: 1.2,
      y: 2.5,
      w: 10.5,
      h: 2.5,
      align: "center",
      fontSize: 18
    }
  );
}

function renderBulletSlide(slide, bullets = [], questions = []) {
  const content = [];

  bullets.slice(0, 6).forEach(item => {
    content.push({ text: safeText(item), options: { bullet: true } });
  });

  questions.slice(0, 3).forEach(item => {
    content.push({ text: "Q: " + safeText(item), options: { bullet: true } });
  });

  if (!content.length) {
    content.push({ text: "Nội dung đang cập nhật", options: { bullet: true } });
  }

  slide.addText(content, {
    x: 0.9,
    y: 1.9,
    w: 11.2,
    h: 4.5,
    fontSize: 18
  });
}

function renderQuestionSlide(slide, bullets = [], questions = []) {
  slide.addText("Hoạt động", { x: 1, y: 2, fontSize: 16, bold: true });
  slide.addText("Câu hỏi", { x: 7, y: 2, fontSize: 16, bold: true });

  slide.addText(
    bullets.map(i => `• ${safeText(i)}`).join("\n"),
    { x: 1, y: 2.5, w: 5 }
  );

  slide.addText(
    questions.map((i, idx) => `${idx + 1}. ${safeText(i)}`).join("\n"),
    { x: 7, y: 2.5, w: 5 }
  );
}

/* =========================
   HISTORY
========================= */
function saveRecentSlides(pptData = {}) {
  try {
    let history = JSON.parse(localStorage.getItem(PPTX_HISTORY_KEY) || "[]");

    history.unshift({
      id: Date.now(),
      title: pptData.title,
      createdAt: new Date().toISOString(),
      data: pptData
    });

    history = history.slice(0, 5);

    localStorage.setItem(PPTX_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.warn("saveRecentSlides error:", err);
  }
}



/* =========================
   UTILS
========================= */
function sanitizeFileName(name = "") {
  return String(name)
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

// ✅ SUPPORT SONG NGỮ
function safeText(text = "") {
  if (typeof text === "object" && text !== null) {
    const vi = text.vi || "";
    const en = text.en || "";

    // 🔥 Ưu tiên theo config
    const mode = window.PPTX_LANG_MODE || "bilingual";

    if (mode === "vi") return vi;
    if (mode === "en") return en;

    // bilingual
    if (vi && en) return `${vi} (${en})`;

    return vi || en || "";
  }

  return String(text || "").replace(/\s+/g, " ").trim();
}


export function restoreRecentSlide(id) {
  const list = getRecentSlides();

  const found = list.find(item => item.id === id);

  if (!found) {
    console.warn("❌ Không tìm thấy slide để restore");
    return null;
  }

  console.log("✅ Restore:", found);

  return found.data;
}

window.PPTX_LANG_MODE = "bilingual"; 
// "vi" | "en" | "bilingual"

