// /pages/teacher/js/ai_pptx.js
import { askAI } from "../../../scripts/services/aiService.js";
import { readWordFile, extractDriveTextMock } from "./wordReader.js";
import { buildPptxPrompt } from "./pptxPromptBuilder.js";
import { exportSlidesToPptx } from "./pptxExporter.js";
import {
  getRecentSlides,
  saveRecentSlides,
  restoreRecentSlide
} from "./pptxHistory.js";

const PPTX_HISTORY_KEY = "pptx_recent_slides";
const PPTX_DRAFT_KEY = "pptx_draft_auto";


function loadRecentSlides() {
  try {
    const history = JSON.parse(localStorage.getItem(PPTX_HISTORY_KEY) || "[]");
    const draft = JSON.parse(localStorage.getItem(PPTX_DRAFT_KEY) || "null");

    console.log("📚 History:", history);
    console.log("📝 Draft:", draft);

    pptxState.recentSlides = history;

    // ✅ Ưu tiên draft
    if (draft?.slides?.length) {
      const ok = confirm("🔁 Bạn có muốn tiếp tục bài đang làm dở không?");
      if (ok) {
        applyDeckData(draft);
        syncStateFromCurrentSlides();
persistSlides();
        updateStatus("🔁 Đã khôi phục bản đang làm dở", "info");
        return;
      }
    }

    // ✅ Nếu KHÔNG có gì → clear
    if (!draft && (!history || !history.length)) {
      currentSlides = [];
    }

  } catch (err) {
    console.warn("⚠️ Load failed:", err);
    currentSlides = [];
  }

  renderAll(); // ✅ chỉ render 1 lần cuối
}



const pptxState = {
  sourceText: "",
  parsedJson: null,
  lastAiRaw: "",
  busy: false,
  initialized: false,
  showJson: false,
  aiMode: "unknown", // real | fake | parse_fallback | local_only
  aiProvider: ""
};

let currentSlides = [];
let currentDeckMeta = {
  title: "AI Presentation",
  theme: "modern",
  language: "vi"
};
let editingSlideIndex = -1;

window.initAiPptxTab = initAiPptxTab;

setTimeout(() => {
  const root = document.querySelector(".ai-pptx-page");
  if (root && !pptxState.initialized) {
    console.log("🛟 [PPTX] Auto init fallback fired");
    initAiPptxTab();
  }
}, 300);

export function initAiPptxTab() {
  try {
    console.log("🟢 [PPTX] initAiPptxTab called");

    bindEvents();

    loadRecentSlides();   // ✅ FIX
    renderAll();          // ✅ FIX

    updateStatus("Sẵn sàng tạo slide PPTX", "info");
    pptxState.initialized = true;

    console.log("✅ [PPTX] Tab initialized successfully");
  } catch (err) {
    console.error("❌ [PPTX] initAiPptxTab error:", err);
    updateStatus("Lỗi khởi tạo tab PPTX", "error");
  }
}

function bindEvents() {
  bindClick("pptxReadSourceBtn", onReadSourceClick);
  bindClick("pptxGenerateBtn", onGenerateSlides);
  bindClick("pptxExportBtn", onExportPptx);
  bindClick("pptxToggleJsonBtn", onToggleJson);
  bindClick("pptxClearBtn", onClearAll);
  bindClick("pptxAddSlideBtn", onAddSlide);
  bindClick("pptxCloseEditorBtn", closeSlideEditor);
  bindClick("pptxSaveSlideBtn", saveEditedSlide);

  bindDelegatedPreviewActions();
}

function bindClick(id, handler) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`⚠️ [PPTX] Missing button: #${id}`);
    return;
  }

  const fresh = el.cloneNode(true);
  el.replaceWith(fresh);

  fresh.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await handler(e);
    } catch (err) {
      console.error(`❌ [PPTX] Handler error at ${id}:`, err);
      updateStatus(err.message || "Có lỗi khi xử lý nút", "error");
    }
  });
}

function bindDelegatedPreviewActions() {
  const box = document.getElementById("pptxPreviewContainer");
  if (!box) return;

  const fresh = box.cloneNode(true);
  box.replaceWith(fresh);

  fresh.addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-action='edit-slide']");
    const deleteBtn = e.target.closest("[data-action='delete-slide']");
    const duplicateBtn = e.target.closest("[data-action='duplicate-slide']");

    if (editBtn) {
      const index = parseInt(editBtn.dataset.index, 10);
      openSlideEditor(index);
      return;
    }

    if (deleteBtn) {
      const index = parseInt(deleteBtn.dataset.index, 10);
      deleteSlide(index);
      return;
    }

    if (duplicateBtn) {
      const index = parseInt(duplicateBtn.dataset.index, 10);
      duplicateSlide(index);
      return;
    }
  });
}

/* =========================
   ACTIONS
========================= */

async function onReadSourceClick() {
  if (pptxState.busy) return;

  try {
    setBusy(true, "Đang đọc dữ liệu nguồn...");
    await loadMammothLib(); 
    await loadPdfLib();
    const pastedText = getValue("pptxSourceText");
    const driveLink = getValue("pptxDriveLink");
    const fileInput = document.getElementById("pptxSourceFile");

    let finalText = "";

    if (pastedText.trim()) {
      finalText = pastedText.trim();
    } 
        else if (fileInput?.files?.length) {
  const file = fileInput.files[0];
  const name = file.name.toLowerCase();

  if (name.endsWith(".docx")) {
    finalText = await readWordFile(file);
  } 
  else if (name.endsWith(".pdf")) {
    finalText = await readPdfFile(file); // ✅ đúng chỗ
  } 
  else if (name.endsWith(".txt")) {
    finalText = await file.text();
  }
  else {
    throw new Error("Chỉ hỗ trợ file .docx, .pdf hoặc .txt");
  }
}
	else if (driveLink.trim()) {
      finalText = await extractDriveTextMock({
        wordUrl: driveLink.trim(),
        pdfUrl: driveLink.trim()
      });
    }

    if (!finalText.trim()) {
      throw new Error("Chưa có dữ liệu đầu vào để đọc.");
    }

    finalText = normalizeSourceText(finalText);
    pptxState.sourceText = finalText;

    setValue("pptxParsedText", finalText);
    updateStatus(`Đã đọc dữ liệu nguồn (${finalText.length} ký tự)`, "success");
  } catch (err) {
    console.error("❌ [PPTX] onReadSourceClick:", err);
    updateStatus(err.message || "Không đọc được dữ liệu nguồn", "error");
  } finally {
    setBusy(false);
  }
}

async function onGenerateSlides() {
  if (pptxState.busy) return;

  try {
    setBusy(true, "AI đang phân tích nội dung và tạo slide...");

    let sourceText = normalizeSourceText(
  getValue("pptxParsedText") || pptxState.sourceText || getValue("pptxSourceText") || ""
);

// 🔥 Detect + convert conversation
const contentType = detectContentType(sourceText);

if (contentType === "narrative") {
  console.log("🔄 Converting narrative → dialogue...");

  const shortText = sourceText.slice(0, 3000); // tránh quá dài
  const converted = await convertToDialogue(shortText);

  if (converted && converted.length > 20) {
    sourceText = converted;
  }
}

    if (!sourceText.trim()) {
      throw new Error("Bạn chưa có nội dung nguồn để tạo slide.");
    }

    const sourceType = getValue("pptxSourceType") || "custom";
    const mode = getValue("pptxMode") || "teaching";
    const audience = getValue("pptxAudience") || "secondary";
    const language = getValue("pptxLanguage") || "vi";
    const style = getValue("pptxStyle") || "modern";
    const slideCount = parseInt(getValue("pptxSlideCount") || "12", 10) || 12;
    const fileName = getValue("pptxFileName") || guessTitleFromText(sourceText) || "AI_Presentation";

    const includeActivities = isChecked("pptxIncludeActivities");
    const includeQuestions = isChecked("pptxIncludeQuestions");
    const includeHomework = isChecked("pptxIncludeHomework");
    const includeNotes = isChecked("pptxIncludeNotes");

    const prompt = buildPptxPrompt({
      sourceType,
      mode,
      audience,
      language,
      style,
      slideCount,
      fileName,
      sourceText,
      includeActivities,
      includeQuestions,
      includeHomework,
      includeNotes
    });

    const aiRes = await askAI({
      type: "lesson",
      prompt,
      payload: {
        chuDe: fileName,
        monHoc: sourceType,
        trinhDo: audience,
        duLieuGoc: sourceText,
        mode: "pptx"
      }
    });

    const aiText = extractAiText(aiRes);
    pptxState.lastAiRaw = aiText;
    pptxState.aiProvider = aiRes?.provider || "unknown";
    pptxState.aiMode = aiRes?.fakeMode ? "fake" : "real";

    let parsed;

    try {
      parsed = safeParsePptxJson(aiText, {
  fallbackTitle: fileName,
  fallbackTheme: style,
  fallbackLanguage: language,
  slideCount
});
    } catch (err) {
      console.warn("⚠️ AI trả không đúng JSON slide, fallback local parse");
      pptxState.aiMode = aiRes?.fakeMode ? "fake" : "parse_fallback";

      parsed = buildLocalSlidesFromText({
        title: fileName,
        sourceText,
        includeActivities,
        includeQuestions,
        includeHomework,
        includeNotes,
        slideCount,
        theme: style,
        language
      });
    }

    applyDeckData(parsed);
    renderAll();
    persistSlides();
    triggerAutoSave();
    updateStatus(buildAiStatusText(), mapAiModeToStatusType(pptxState.aiMode));
  } catch (err) {
    console.error("❌ [PPTX] onGenerateSlides:", err);

    const sourceText = normalizeSourceText(
      getValue("pptxParsedText") || pptxState.sourceText || getValue("pptxSourceText") || ""
    );

    if (sourceText.trim()) {
      pptxState.aiMode = "local_only";

      const fileName = getValue("pptxFileName") || guessTitleFromText(sourceText) || "AI_Presentation";
      const includeActivities = isChecked("pptxIncludeActivities");
      const includeQuestions = isChecked("pptxIncludeQuestions");
      const includeHomework = isChecked("pptxIncludeHomework");
      const includeNotes = isChecked("pptxIncludeNotes");
      const slideCount = parseInt(getValue("pptxSlideCount") || "12", 10) || 12;
      const style = getValue("pptxStyle") || "modern";
      const language = getValue("pptxLanguage") || "vi";

      const parsed = buildLocalSlidesFromText({
        title: fileName,
        sourceText,
        includeActivities,
        includeQuestions,
        includeHomework,
        includeNotes,
        slideCount,
        theme: style,
        language
      });

      applyDeckData(parsed);
      persistSlides();
      renderAll();
   //   persistSlides();
      updateStatus("🔵 AI lỗi / timeout → Đã dựng slide local từ nội dung nguồn", "warning");
    } else {
      updateStatus(err.message || "Không thể tạo slide", "error");
    }
  } finally {
    setBusy(false);
  }
}

async function onExportPptx() {
  if (pptxState.busy) return;

  try {
    if (!currentSlides.length) {
      throw new Error("Chưa có dữ liệu slide để xuất PPTX.");
    }

    setBusy(true, "Đang xuất file PPTX...");

    const fileName = getValue("pptxFileName") || currentDeckMeta.title || "AI_Presentation";

    const payload = {
      title: currentDeckMeta.title || fileName,
      theme: currentDeckMeta.theme || "modern",
      language: currentDeckMeta.language || "vi",
      slides: currentSlides
    };

    await exportSlidesToPptx(payload, fileName);
    updateStatus("Xuất PPTX thành công", "success");
  } catch (err) {
    console.error("❌ [PPTX] onExportPptx:", err);
    updateStatus(err.message || "Xuất PPTX thất bại", "error");
  } finally {
    setBusy(false);
  }
}

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


async function loadMammothLib() {
  if (window.mammoth) return;

  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/mammoth/mammoth.browser.min.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}


async function loadPdfLib() {
  if (window.pdfjsLib) return;

  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}


async function readPdfFile(file) {
  if (!window.pdfjsLib) {
    throw new Error("Thiếu thư viện PDF.js");
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const strings = content.items.map(item => item.str);
    fullText += strings.join(" ") + "\n\n";
  }

  return fullText.trim();
}


function onToggleJson() {
  pptxState.showJson = !pptxState.showJson;
  const panel = document.getElementById("pptxJsonPanel");
  if (!panel) return;
  panel.classList.toggle("hidden", !pptxState.showJson);
}

function onClearAll() {
localStorage.removeItem(PPTX_DRAFT_KEY);
  pptxState.sourceText = "";
  pptxState.parsedJson = null;
  pptxState.lastAiRaw = "";
  pptxState.busy = false;
  pptxState.showJson = false;
  pptxState.aiMode = "unknown";
  pptxState.aiProvider = "";

  currentSlides = [];
  currentDeckMeta = {
    title: "AI Presentation",
    theme: "modern",
    language: "vi"
  };
  editingSlideIndex = -1;

  setValue("pptxSourceText", "");
  setValue("pptxDriveLink", "");
  setValue("pptxParsedText", "");
  setValue("pptxFileName", "");

  const fileInput = document.getElementById("pptxSourceFile");
  if (fileInput) fileInput.value = "";

  const preview = document.getElementById("pptxPreviewContainer");
  if (preview) {
    preview.innerHTML = `<div class="pptx-empty">Chưa có slide nào ✨<br>Hãy đọc nguồn nội dung rồi nhấn <b>Tạo Slide AI</b>.</div>`;
  }

  const jsonOutput = document.getElementById("pptxJsonOutput");
  if (jsonOutput) jsonOutput.value = "";

  const panel = document.getElementById("pptxJsonPanel");
  if (panel) panel.classList.add("hidden");

  closeSlideEditor();
  updateStatus("Đã xóa toàn bộ dữ liệu PPTX", "success");
}

/* =========================
   SLIDE CRUD
========================= */

function onAddSlide() {
  const newSlide = normalizeSlide({
    type: "content",
    title: `Slide ${currentSlides.length + 1}`,
    subtitle: "",
    bullets: ["Ý chính 1", "Ý chính 2"],
    questions: [],
    note: ""
  }, currentSlides.length);

  currentSlides.push(newSlide);
  syncStateFromCurrentSlides();
persistSlides();
triggerAutoSave();
  renderAll();
animateNewSlide(); // 🔥 THÊM DÒNG NÀY
  openSlideEditor(currentSlides.length - 1);
  updateStatus("Đã thêm slide mới", "success");
}

function duplicateSlide(index) {
  if (!isValidSlideIndex(index)) return;

  const source = currentSlides[index];
  const clone = normalizeSlide(JSON.parse(JSON.stringify(source)), currentSlides.length);
  clone.title = `${clone.title} (Bản sao)`;

  currentSlides.splice(index + 1, 0, clone);
  syncStateFromCurrentSlides();
persistSlides();
  renderAll();
  updateStatus(`Đã nhân bản slide ${index + 1}`, "success");
}

function deleteSlide(index) {
  if (!isValidSlideIndex(index)) return;

  const ok = window.confirm(`Xóa slide ${index + 1}?`);
  if (!ok) return;

  currentSlides.splice(index, 1);
  syncStateFromCurrentSlides();
persistSlides();
  renderAll();
  closeSlideEditor();

  if (!currentSlides.length) {
    updateStatus("Đã xóa hết slide", "warning");
  } else {
    updateStatus(`Đã xóa slide ${index + 1}`, "success");
  }
}

function openSlideEditor(index) {
  if (!isValidSlideIndex(index)) return;

  const slide = currentSlides[index];
  editingSlideIndex = index;

  setValue("pptxEditType", slide.type || "content");
  setValue("pptxEditTitle", slide.title || "");
  setValue("pptxEditSubtitle", slide.subtitle || "");
  setValue("pptxEditBullets", Array.isArray(slide.bullets) ? slide.bullets.join("\n") : "");
  setValue("pptxEditQuestions", Array.isArray(slide.questions) ? slide.questions.join("\n") : "");
  setValue("pptxEditNote", slide.note || "");

  const editor = document.getElementById("pptxSlideEditor");
  if (editor) editor.classList.remove("hidden");
}

function closeSlideEditor() {
  editingSlideIndex = -1;
  const editor = document.getElementById("pptxSlideEditor");
  if (editor) editor.classList.add("hidden");
}

function saveEditedSlide() {
  if (!isValidSlideIndex(editingSlideIndex)) {
    updateStatus("Không tìm thấy slide để lưu", "error");
    return;
  }

  const updated = normalizeSlide({
    type: getValue("pptxEditType"),
    title: getValue("pptxEditTitle"),
    subtitle: getValue("pptxEditSubtitle"),
    bullets: splitTextareaLines(getValue("pptxEditBullets")),
    questions: splitTextareaLines(getValue("pptxEditQuestions")),
    note: getValue("pptxEditNote")
  }, editingSlideIndex);

  currentSlides[editingSlideIndex] = updated;
  syncStateFromCurrentSlides();
persistSlides();
  renderAll();
 triggerAutoSave(); 
  closeSlideEditor();

  updateStatus(`Đã lưu slide ${editingSlideIndex + 1}`, "success");
}

function isValidSlideIndex(index) {
  return Number.isInteger(index) && index >= 0 && index < currentSlides.length;
}



/* =========================
   CORE HELPERS
========================= */

function applyDeckData(parsed = {}) {
  const slides = Array.isArray(parsed?.slides) ? parsed.slides : [];
currentSlides = parsed.slides.map((slide, idx) =>
  normalizeSlide(slide, idx)
);
  currentDeckMeta = {
    title: sanitizeSlideText(parsed?.title || getValue("pptxFileName") || "AI Presentation") || "AI Presentation",
    theme: sanitizeSlideText(parsed?.theme || getValue("pptxStyle") || "modern") || "modern",
    language: getValue("pptxLanguage") || "vi"
  };

  pptxState.parsedJson = {
    title: currentDeckMeta.title,
    theme: currentDeckMeta.theme,
    language: currentDeckMeta.language,
    slides: currentSlides
  };

  if (!getValue("pptxFileName")) {
    setValue("pptxFileName", currentDeckMeta.title);
  }
}



function enhanceSlides(slides = []) {
  return slides.map(slide => {
    if (slide.bullets?.length) {
      slide.bullets = slide.bullets.map(b => {
        if (b.length < 5) return null;
        if (/ý chính|ghi chú|nội dung/i.test(b)) return null;
        return b;
      }).filter(Boolean);
    }
    return slide;
  });
}



function syncStateFromCurrentSlides() {
  pptxState.parsedJson = {
    title: currentDeckMeta.title,
    theme: currentDeckMeta.theme,
    language: currentDeckMeta.language,
    slides: currentSlides
  };
}

function renderAll() {
  if (!Array.isArray(currentSlides)) currentSlides = [];

  renderSlidePreview({
    title: currentDeckMeta.title,
    slides: currentSlides
  });

  renderJsonOutput({
    title: currentDeckMeta.title,
    theme: currentDeckMeta.theme,
    language: currentDeckMeta.language,
    slides: currentSlides
  });

  setTimeout(() => {
    enableDragSort();
    applyThemeToSlides();
    bindRestoreButton();
renderRecentList();
  }, 50);
}



function safeParsePptxJson(aiText, options = {}) {
  const cleaned = extractJsonBlock(aiText);
  const parsed = JSON.parse(cleaned);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI không trả JSON hợp lệ");
  }

  if (!Array.isArray(parsed.slides)) {
    parsed.slides = [];
  }

  if (!parsed.title) {
    parsed.title = options.fallbackTitle || "AI Presentation";
  }

  if (!parsed.theme) {
    parsed.theme = options.fallbackTheme || "modern";
  }

  if (!parsed.language) {
    parsed.language = options.fallbackLanguage || "vi";
  }

  if (!parsed.slides.length) {
    throw new Error("JSON không có slides");
  }

  const maxSlides = options.slideCount || 12;

parsed.slides = parsed.slides
  .filter(Boolean)
  .map((slide, idx) => normalizeSlide(slide, idx));

// 🔥 BÙ SLIDE NẾU AI TRẢ THIẾU
while (parsed.slides.length < maxSlides) {
  parsed.slides.push(
    normalizeSlide({
      type: "content",
      title: `Slide ${parsed.slides.length + 1}`,
      bullets: ["Ý chính", "Ví dụ", "Ghi chú"]
    }, parsed.slides.length)
  );
}

// 🔥 CẮT ĐÚNG SỐ LƯỢNG
parsed.slides = parsed.slides.slice(0, maxSlides);

  return parsed;
}

function normalizeSlide(slide = {}, index = 0) {
  const language = getValue("pptxLanguage") || "vi";

  const normalizeText = (x) => {
    if (!x) return "";

    // 🔥 nếu là object (song ngữ)
    if (typeof x === "object") {
      if (language === "bilingual") {
        return `${x.vi || ""}\n${x.en || ""}`;
      }
      return x[language] || x.vi || x.en || "";
    }

    return sanitizeSlideText(String(x).trim());
  };

  const cleanedBullets = Array.isArray(slide.bullets)
    ? slide.bullets
        .map(normalizeText)
        .filter(Boolean)
        .slice(0, 6)
    : [];

  const cleanedQuestions = Array.isArray(slide.questions)
    ? slide.questions
        .map(normalizeText)
        .filter(Boolean)
        .slice(0, 5)
    : [];

  return {
    type: sanitizeSlideType(slide.type || "content"),
    title: normalizeText(slide.title) || `Slide ${index + 1}`,
    subtitle: normalizeText(slide.subtitle),
    bullets: cleanedBullets,
    questions: cleanedQuestions,
    note: normalizeText(slide.note)
  };
}

function extractJsonBlock(text = "") {
  const raw = String(text || "").trim();

  if (raw.startsWith("{") && raw.endsWith("}")) return raw;

  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const genericFence = raw.match(/```([\s\S]*?)```/);
  if (genericFence?.[1]) return genericFence[1].trim();

  const match = raw.match(/\{[\s\S]*\}/);
  if (match) return match[0];

  throw new Error("Không tìm thấy JSON trong phản hồi AI");
}

function extractAiText(aiResponse) {
  if (!aiResponse) return "";
  if (typeof aiResponse === "string") return aiResponse;
  if (typeof aiResponse?.text === "string") return aiResponse.text;
  return JSON.stringify(aiResponse);
}

/* =========================
   SMART LOCAL FALLBACK
========================= */

function buildLocalSlidesFromText({
  title = "Bài giảng",
  sourceText = "",
  includeActivities = true,
  includeQuestions = true,
  includeHomework = true,
  includeNotes = true,
  slideCount = 10,
  theme = "modern",
  language = "vi"
} = {}) {

  const sections = splitIntoSmartSections(sourceText);
  const slides = [];

  /* =========================
     HELPER
  ========================= */

  const clean = (arr = [], max = 5) =>
    arr.filter(Boolean).slice(0, max);

  const makeExample = (points = []) => {
    if (!points.length) return ["Ví dụ minh họa đơn giản"];
    return points.slice(0, 2).map(p => `Ví dụ: ${p}`);
  };

  /* =========================
     1. COVER
  ========================= */

  slides.push({
    type: "cover",
    title,
    subtitle: "Bài giảng được tạo tự động"
  });

  /* =========================
     2. OBJECTIVES
  ========================= */

  slides.push({
    type: "overview",
    title: "Mục tiêu bài học",
    bullets: clean([
      "Hiểu nội dung chính của bài",
      "Nắm được các ý quan trọng",
      "Áp dụng vào bài tập thực tế",
      "Phát triển kỹ năng liên quan"
    ])
  });

  /* =========================
     3. WARM-UP
  ========================= */

  slides.push({
    type: "activity",
    title: "Khởi động",
    bullets: clean([
      "Thảo luận nhanh: bạn đã biết gì về chủ đề này?",
      "Chia sẻ ví dụ thực tế",
      "Đặt câu hỏi dẫn dắt vào bài học"
    ])
  });

  /* =========================
     4. MAIN CONTENT + EXAMPLE
  ========================= */

  const maxMainSlides = Math.max(2, slideCount - 6);

  sections.slice(0, maxMainSlides).forEach((sec, idx) => {

    const secTitle = sec.title || `Nội dung ${idx + 1}`;
    const points = clean(sec.points, 5);

    // Content
    slides.push({
      type: "content",
      title: secTitle,
      bullets: points,
      note: includeNotes
        ? `Giải thích kỹ phần "${secTitle}" và đưa ví dụ thực tế`
        : ""
    });

    // Example
    slides.push({
      type: "content",
      title: `Ví dụ - ${secTitle}`,
      bullets: makeExample(points)
    });

  });

  /* =========================
     5. PRACTICE / QUESTIONS
  ========================= */

  if (includeQuestions) {
    slides.push({
      type: "practice",
      title: "Luyện tập",
      questions: clean(generateQuestionsFromText(sourceText), 4)
    });
  }

  /* =========================
     6. ACTIVITIES
  ========================= */

  if (includeActivities) {
    slides.push({
      type: "activity",
      title: "Hoạt động lớp học",
      bullets: clean(generateActivitiesFromText(sourceText), 4)
    });
  }

  /* =========================
     7. SUMMARY
  ========================= */

  slides.push({
    type: "summary",
    title: "Tổng kết",
    bullets: clean(generateSummaryFromSections(sections), 5)
  });

  /* =========================
     8. HOMEWORK
  ========================= */

  if (includeHomework) {
    slides.push({
      type: "homework",
      title: "Bài tập về nhà",
      bullets: clean(generateHomeworkFromText(sourceText), 4)
    });
  }

  /* =========================
     9. AUTO FILL (SMART)
  ========================= */

  while (slides.length < slideCount) {
    slides.push({
      type: "content",
      title: `Mở rộng ${slides.length + 1}`,
      bullets: clean([
        "Phân tích sâu hơn nội dung bài",
        "Liên hệ thực tế",
        "Mở rộng kiến thức liên quan"
      ])
    });
  }

  /* =========================
     FINAL CLEAN + LIMIT
  ========================= */

  const finalSlides = slides
    .map((s, idx) => normalizeSlide(s, idx))
    .slice(0, slideCount);

  return {
    title,
    theme,
    language,
    slides: finalSlides
  };
}




function generateExampleFromText(points = []) {
  if (!points.length) return ["Ví dụ minh họa đơn giản"];

  return points.slice(0, 2).map(p => `Ví dụ: ${p}`);
}





function splitIntoSmartSections(text = "") {
  const lines = String(text || "")
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean);

  const sections = [];
  let current = { title: "", points: [] };

  for (const line of lines) {
    const isHeading =
      line.length < 80 &&
      (
        /^[A-ZÀ-Ỹ0-9][^.!?]{0,80}$/.test(line) ||
        /^bài\s|^unit\s|^lesson\s|^part\s|^section\s|^chủ đề\s|^mục\s/i.test(line)
      );

    if (isHeading && current.points.length) {
      sections.push(current);
      current = { title: line, points: [] };
      continue;
    }

    if (isHeading && !current.title) {
      current.title = line;
      continue;
    }

    current.points.push(cleanBullet(line));
  }

  if (current.title || current.points.length) {
    sections.push(current);
  }

  return sections
    .map(sec => ({
      title: sec.title || guessSectionTitle(sec.points),
      points: sec.points.filter(Boolean).slice(0, 8)
    }))
    .filter(sec => sec.title || sec.points.length);
}

function cleanBullet(line = "") {
  return String(line || "")
    .replace(/^[-•*]\s*/, "")
    .replace(/^\d+[\.\)]\s*/, "")
    .trim();
}

function guessSectionTitle(points = []) {
  const first = points.find(Boolean) || "Nội dung chính";
  return first.length > 40 ? first.slice(0, 40) + "..." : first;
}

function buildOverviewBullets(sourceText = "", sections = []) {
  const bullets = [];
  if (sections.length) bullets.push(`Bài học gồm khoảng ${sections.length} phần nội dung chính`);
  if (sourceText.length > 1000) bullets.push("Nội dung tương đối đầy đủ, phù hợp triển khai nhiều slide");
  bullets.push("Tập trung vào ý chính, ví dụ và ứng dụng");
  bullets.push("Học viên cần nắm được nội dung cốt lõi của bài");
  return bullets.slice(0, 6);
}

function generateActivitiesFromText(text = "") {
  const base = [
    "Thảo luận nhóm theo nội dung bài",
    "Tóm tắt lại ý chính bằng lời của học viên",
    "Thực hành theo cặp hoặc nhóm nhỏ"
  ];

  if (/dialogue|hội thoại|conversation/i.test(text)) {
    base.unshift("Đóng vai theo hội thoại trong bài");
  }

  if (/vocabulary|từ vựng|word/i.test(text)) {
    base.unshift("Trò chơi ghi nhớ từ vựng");
  }

  return base.slice(0, 4);
}

function generateQuestionsFromText(text = "") {
  const qs = [
    "Ý chính của bài là gì?",
    "Phần nào em thấy quan trọng nhất?",
    "Hãy nêu một ví dụ minh họa từ bài học."
  ];

  if (/grammar|ngữ pháp|tense|cấu trúc/i.test(text)) {
    qs.unshift("Hãy đặt một câu áp dụng cấu trúc vừa học.");
  }

  return qs.slice(0, 3);
}

function generateHomeworkFromText(text = "") {
  const hw = [
    "Ôn lại nội dung bài hôm nay",
    "Ghi chú lại các ý chính",
    "Chuẩn bị nội dung cho buổi học tiếp theo"
  ];

  if (/vocabulary|từ vựng/i.test(text)) {
    hw.unshift("Học và ghi nhớ từ vựng mới trong bài.");
  }

  return hw.slice(0, 4);
}

function generateSummaryFromSections(sections = []) {
  const bullets = sections
    .slice(0, 4)
    .map(sec => sec.title)
    .filter(Boolean);

  if (!bullets.length) {
    return ["Nắm được nội dung chính", "Hiểu trọng tâm bài học", "Sẵn sàng luyện tập thêm"];
  }

  return bullets.slice(0, 6);
}

function guessTitleFromText(text = "") {
  const lines = String(text || "")
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean);

  const first = lines[0] || "";
  if (!first) return "AI_Presentation";

  return first.length > 60 ? first.slice(0, 60) : first;
}

/* =========================
   UI RENDER
========================= */

function renderJsonOutput(data) {
  const box = document.getElementById("pptxJsonOutput");
  if (!box) return;

  const payload = {
    aiMode: pptxState.aiMode,
    aiProvider: pptxState.aiProvider,
    generatedAt: new Date().toISOString(),
    ...data
  };

  box.value = JSON.stringify(payload, null, 2);
}



function renderSlidePreview(data) {
  const box = document.getElementById("pptxPreviewContainer");
  if (!box) return;

  const slides = Array.isArray(data?.slides) ? data.slides : [];

  if (!slides.length) {
    box.innerHTML = `<div class="pptx-empty">Không có slide để hiển thị.</div>`;
    return;
  }

  box.innerHTML = `
    <div class="pptx-ai-badge ${mapAiModeToStatusType(pptxState.aiMode)}">
      ${escapeHtml(buildAiStatusText())}
    </div>

    <div class="pptx-preview-deck-title">
      ${escapeHtml(currentDeckMeta.title || "AI Presentation")}
    </div>

    ${slides.map((slide, index) => `
      <div class="pptx-slide-card pptx-slide" data-index="${index}">
        <div class="pptx-slide-top">
          <span class="pptx-slide-badge">Slide ${index + 1}</span>
          <span class="pptx-slide-type">${escapeHtml(slide.type || "content")}</span>
        </div>

        <div class="pptx-slide-toolbar">
          <button class="btn btn-secondary btn-sm" data-action="edit-slide" data-index="${index}">✏ Sửa</button>
          <button class="btn btn-secondary btn-sm" data-action="duplicate-slide" data-index="${index}">📄 Nhân bản</button>
          <button class="btn btn-danger btn-sm" data-action="delete-slide" data-index="${index}">🗑 Xóa</button>
        </div>

        <h4>${escapeHtml(slide.title || "")}</h4>
        ${slide.subtitle ? `<p>${escapeHtml(slide.subtitle)}</p>` : ""}

        ${Array.isArray(slide.bullets) && slide.bullets.length ? `
          <ul>
            ${slide.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join("")}
          </ul>
        ` : ""}

        ${Array.isArray(slide.questions) && slide.questions.length ? `
          <ol>
            ${slide.questions.map(q => `<li>${escapeHtml(q)}</li>`).join("")}
          </ol>
        ` : ""}

        ${slide.note ? `<div class="pptx-note"><strong>Note:</strong> ${escapeHtml(slide.note)}</div>` : ""}
      </div>
    `).join("")}
  `;
}
// 🔥 Enhance sau khi render xong
//enableDragSort();
//applyThemeToSlides();


/* =========================
   STATUS + UTILS
========================= */

function buildAiStatusText() {
  switch (pptxState.aiMode) {
    case "real":
      return `🟢 AI thật + JSON chuẩn (${pptxState.aiProvider || "unknown"})`;
    case "fake":
      return `🔴 Smart Fake AI (${pptxState.aiProvider || "fallback"})`;
    case "parse_fallback":
      return `🟡 AI thật nhưng JSON lỗi → dùng slide local thông minh`;
    case "local_only":
      return `🔵 AI lỗi / timeout → dựng slide local từ nội dung nguồn`;
    default:
      return "ℹ️ Chưa xác định chế độ AI";
  }
}

function mapAiModeToStatusType(mode = "") {
  switch (mode) {
    case "real":
      return "success";
    case "fake":
      return "error";
    case "parse_fallback":
      return "warning";
    case "local_only":
      return "warning";
    default:
      return "info";
  }
}

function updateStatus(message = "", type = "info") {
  const el = document.getElementById("pptxStatusBox");
  if (!el) return;
  el.className = `pptx-status-box ${type}`;
  el.textContent = message;
}

function setBusy(flag, message = "") {
  pptxState.busy = !!flag;

  [
    "pptxReadSourceBtn",
    "pptxGenerateBtn",
    "pptxExportBtn",
    "pptxToggleJsonBtn",
    "pptxClearBtn",
    "pptxAddSlideBtn",
    "pptxSaveSlideBtn",
    "pptxCloseEditorBtn"
  ].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = !!flag;
  });

  if (message) updateStatus(message, flag ? "loading" : "info");
}

function normalizeSourceText(text = "") {
  let clean = String(text || "")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (clean.length > 12000) {
    clean = clean.slice(0, 12000) + "\n\n[Nội dung đã được cắt bớt]";
  }

  return clean;
}

function getValue(id) {
  return document.getElementById(id)?.value || "";
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function isChecked(id) {
  return !!document.getElementById(id)?.checked;
}

function splitTextareaLines(text = "") {
  return String(text || "")
    .split("\n")
    .map(x => sanitizeSlideText(x))
    .filter(Boolean);
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeSlideText(text = "") {
  const raw = String(text || "").trim();
  if (!raw) return "";

  const bannedPatterns = [
    /đọc kỹ nội dung nguồn/i,
    /tạo nội dung slide power ?point/i,
    /slide\s*\d+:\s*trang bìa/i,
    /slide\s*\d+:\s*tổng quan/i,
    /slide\s*\d+:\s*nội dung/i,
    /slide\s*\d+/i,
    /thông tin thiết kế slide/i,
    /yêu cầu chuyển đổi nội dung/i,
    /tùy chọn bổ sung/i,
    /output format/i,
    /json/i,
    /^title$/i,
    /^subtitle$/i,
    /^bullets?$/i,
    /^questions?$/i,
    /^theme$/i,
    /^language$/i,
    /chỉ được trả về json/i,
    /không markdown/i,
    /không giải thích/i
  ];

  for (const pattern of bannedPatterns) {
    if (pattern.test(raw)) return "";
  }

  return raw
    .replace(/^[-•*]\s*/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sanitizeSlideType(type = "") {
  const safe = String(type || "").toLowerCase().trim();
  const allow = ["cover", "overview", "content", "activity", "practice", "homework", "summary"];
  return allow.includes(safe) ? safe : "content";
}



function enableDragSort() {
  const container = document.getElementById("pptxPreviewContainer");
  if (!container) return;

  let dragIndex = null;

  const slides = container.querySelectorAll(".pptx-slide");

  slides.forEach((slide) => {
    slide.draggable = true;

    slide.ondragstart = () => {
      dragIndex = Number(slide.dataset.index);
    };

    slide.ondrop = (e) => {
      e.preventDefault();

      const targetIndex = Number(slide.dataset.index);
      if (dragIndex === null || dragIndex === targetIndex) return;

      const moved = currentSlides.splice(dragIndex, 1)[0];
      currentSlides.splice(targetIndex, 0, moved);

      syncStateFromCurrentSlides();
persistSlides();
      renderAll();
    };

    slide.ondragover = (e) => e.preventDefault();
  });
}

function persistSlides() {
  if (!currentSlides.length) return;

  const history = JSON.parse(localStorage.getItem(PPTX_HISTORY_KEY) || "[]");

  history.unshift({
    id: Date.now(),
    time: Date.now(),
    title: currentDeckMeta.title,
    slides: currentSlides,
    meta: currentDeckMeta
  });

  // 🔥 chỉ giữ 7 bản gần nhất
  localStorage.setItem(PPTX_HISTORY_KEY, JSON.stringify(history.slice(0, 7)));

  console.log("💾 Saved version:", history.length);
}

function applyThemeToSlides() {
  const theme = document.getElementById("pptxStyle")?.value || "modern";

  document.querySelectorAll(".pptx-slide").forEach(slide => {
    slide.classList.remove(
      "theme-modern",
      "theme-minimal",
      "theme-kids",
      "theme-academic"
    );

    slide.classList.add(`theme-${theme}`);
  });
}


function animateNewSlide() {
  const slides = document.querySelectorAll(".pptx-slide");
  const last = slides[slides.length - 1];

  if (last) {
    last.style.transform = "scale(0.9)";
    setTimeout(() => {
      last.style.transform = "scale(1)";
    }, 50);
  }
}

function bindRestoreButton() {
  const btn = document.getElementById("btnRestore");
  if (!btn || btn.dataset.bound) return;

  btn.dataset.bound = "true";

  btn.addEventListener("click", () => {
  const ok = confirm("♻️ Bạn có chắc muốn khôi phục bản gần nhất không?");
  if (!ok) return;

  const history = JSON.parse(localStorage.getItem("pptx_recent_slides") || "[]");

  if (!history.length) {
    alert("Chưa có bản gần nhất");
    return;
  }

  const latest = history[0];

  if (latest?.slides) {
    currentSlides = latest.slides;
    currentDeckMeta = latest.meta || currentDeckMeta;

    syncStateFromCurrentSlides();
    persistSlides();
    renderAll();

    updateStatus("Đã khôi phục slide gần nhất", "success");
  }
});
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeSlideEditor();
  }
});


function renderRecentList() {
  const list = getRecentSlides();
  const container = document.getElementById("recentSlides");

  if (!container) return;

  container.innerHTML = list.map(item => `
    <div>
      <span>${formatSlideText(item.title)}</span>
      <button data-id="${item.id}" class="btn-restore">
        Khôi phục
      </button>
    </div>
  `).join("");
}

function formatSlideText(text) {
  if (!text) return "";

  // 🔥 nếu là object (song ngữ)
  if (typeof text === "object") {
    const lang = getValue("pptxLanguage") || "vi";

    if (lang === "bilingual") {
      return `${text.vi || ""}\n${text.en || ""}`;
    }

    return text[lang] || text.vi || text.en || "";
  }

  return String(text);
}


function detectContentType(text) {
  if (/:\s/.test(text) && /[A-Z][a-z]+:/.test(text)) {
    return "dialogue";
  }

  if (/\".*?\"/.test(text)) {
    return "semi-dialogue";
  }

  return "narrative";
}


async function convertToDialogue(text) {
  const prompt = `
Chuyển đoạn văn sau thành hội thoại giữa 2-3 người.

Yêu cầu:
- Giữ nguyên nội dung
- Tự đặt tên nhân vật
- Viết dạng:
A: ...
B: ...

Nội dung:
${text}
`;

  const res = await askAI({
    type: "rewrite",
    prompt
  });

  return extractAiText(res);
}



function autoSaveDraft() {
  if (!currentSlides.length) return;

  const payload = {
    time: Date.now(),
    title: currentDeckMeta.title,
    slides: currentSlides,
    meta: currentDeckMeta
  };

  localStorage.setItem(PPTX_DRAFT_KEY, JSON.stringify(payload));

  console.log("💾 Auto-saved draft");
}


let autoSaveTimer = null;

function triggerAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    autoSaveDraft();
  }, 800); // delay 0.8s
}


document.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-restore")) {

    const ok = confirm("♻️ Khôi phục bản này?");
    if (!ok) return;

    const id = Number(e.target.dataset.id);

    const list = getRecentSlides();
    const item = list.find(x => x.id === id);

    if (!item) return;

    console.log("🛟 Restore:", item);

    applyDeckData({
      title: item.title,
      theme: item.meta?.theme,
      language: item.meta?.language,
      slides: item.slides
    });

    currentSlides = enhanceSlides(currentSlides);

    syncStateFromCurrentSlides(); // 🔥 THÊM DÒNG NÀY

    renderAll();

    updateStatus("Đã khôi phục từ lịch sử", "success");
  }
});