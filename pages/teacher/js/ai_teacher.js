import { askAI } from "../../../scripts/services/aiService.js";
import { buildAIPrompt } from "../../../scripts/ai/aiPromptBuilder.js";
import { wrapAiContent } from "../../../scripts/ai/aiParser.js";
import { canUseAI } from "../../../scripts/ai/aiRateLimit.js";
import { logAIRequest } from "../../../scripts/ai/aiLogger.js";
import { AI_TYPES } from "../../../scripts/ai/aiTypes.js";
import {
  normalizeTeachingContent,
  plainTextToHtmlParagraphs,
  autoFixMissingAnswerStars
} from "../../../scripts/utils/aiContentFormatter.js";

import {
  showAILoading,
  showAIError,
  showAISuccess,
  copyTextToClipboard
} from "../../../js/aiSharedUI.js";

let CURRENT_AI_TEXT = "";
let CURRENT_AI_TYPE = AI_TYPES.LESSON;
let CURRENT_AI_PAYLOAD = {};
let CURRENT_AI_PROVIDER = "standby";
let CURRENT_AI_FAKE_MODE = true;

/* =========================
   INIT
========================= */
export function init() {
  injectAITeacherCSS();
  initAITeacherPage();
}

function injectAITeacherCSS() {
  const cssId = "ai-teacher-css";
  if (document.getElementById(cssId)) return;

  const link = document.createElement("link");
  link.id = cssId;
  link.rel = "stylesheet";
  link.href = "./css/ai_teacher.css";
  document.head.appendChild(link);
}

function initAITeacherPage() {
  initTypeTabs();
  initGenerateButtons();
  initActionButtons();
  initPushButtons();
  loadSavedDraftIfAny();
  renderPremiumPlaceholder();
  setAIStatus("idle", "AI Ready");
  setAIProvider("standby");
}

/* =========================
   PREMIUM UI HELPERS
========================= */
function getAITypeMeta(type) {
  const map = {
    lesson: {
      label: "AI Lesson Builder",
      badge: "📘 Lesson",
      cls: "lesson"
    },
    exercise: {
      label: "AI Exercise Builder",
      badge: "📝 Exercise",
      cls: "exercise"
    },
    exam: {
      label: "AI Exam Generator",
      badge: "📋 Exam",
      cls: "exam"
    },
    toeic: {
      label: "AI TOEIC Generator",
      badge: "🎧 TOEIC",
      cls: "toeic"
    }
  };

  return map[type] || map.lesson;
}

function getAIModeText(fakeMode = true) {
  return fakeMode ? "AI Fake - Demo" : "AI Live";
}

function getAISubtitle(fakeMode = true, provider = "unknown") {
  return fakeMode
    ? `Fallback Demo • ${provider}`
    : `Live AI Engine • ${provider}`;
}

function renderPremiumPlaceholder() {
  const outputBox = document.getElementById("aiOutputBox");
  if (!outputBox) return;

  const meta = getAITypeMeta(CURRENT_AI_TYPE);

  outputBox.className = `ai-output-box premium-output ${meta.cls}`;
  outputBox.innerHTML = `
    <div class="ai-output-shell">
      <div class="ai-output-top">
        <div class="ai-output-brand">
          <div class="ai-output-avatar">🤖</div>
          <div>
            <div class="ai-output-title">${meta.label}</div>
            <div class="ai-output-sub">${getAISubtitle(CURRENT_AI_FAKE_MODE, CURRENT_AI_PROVIDER)}</div>
          </div>
        </div>
        <div class="ai-output-badge">${meta.badge}</div>
      </div>

      <div class="ai-output-content ai-output-placeholder">
        <div class="ai-placeholder-hero">✨ AI sẵn sàng tạo nội dung cho bạn</div>
        <p>Điền thông tin ở biểu mẫu bên trên và bấm <b>Tạo</b> để tạo bài giảng, bài tập, đề kiểm tra hoặc đề TOEIC.</p>

        <div class="ai-placeholder-grid">
          <div class="ai-mini-card">
            <span>📘</span>
            <b>Bài giảng</b>
            <small>Giải thích + ví dụ + mini practice</small>
          </div>
          <div class="ai-mini-card">
            <span>📝</span>
            <b>Bài tập</b>
            <small>Multiple choice, fill, rewrite...</small>
          </div>
          <div class="ai-mini-card">
            <span>📋</span>
            <b>Đề kiểm tra</b>
            <small>Section rõ ràng, có đáp án</small>
          </div>
          <div class="ai-mini-card">
            <span>🎧</span>
            <b>TOEIC</b>
            <small>Mini TOEIC style practice</small>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderPremiumAIOutput(type, htmlContent = "", status = "success", fakeMode = true, provider = "unknown") {
  const outputBox = document.getElementById("aiOutputBox");
  if (!outputBox) return;

  const meta = getAITypeMeta(type);

  outputBox.className = `ai-output-box premium-output ${meta.cls} ${status}`;
  outputBox.innerHTML = `
    <div class="ai-output-shell">
      <div class="ai-output-top">
        <div class="ai-output-brand">
          <div class="ai-output-avatar">🤖</div>
          <div>
            <div class="ai-output-title">${meta.label}</div>
            <div class="ai-output-sub">${getAISubtitle(fakeMode, provider)}</div>
          </div>
        </div>
        <div class="ai-output-badge">${meta.badge}</div>
      </div>

      <div class="ai-output-toolbar">
        <span class="ai-status-dot"></span>
        <span>
          ${
            status === "loading"
              ? "AI đang xử lý nội dung..."
              : status === "error"
              ? "AI phản hồi lỗi"
              : `AI đã tạo nội dung thành công • ${getAIModeText(fakeMode)}`
          }
        </span>
      </div>

      <div class="ai-output-content ai-rendered-content">
        ${htmlContent}
      </div>
    </div>
  `;
}

/* =========================
   TAB SWITCH
========================= */
function initTypeTabs() {
  const tabs = document.querySelectorAll(".ai-type-btn");
  const forms = document.querySelectorAll(".ai-form-section");

  tabs.forEach(tab => {
    tab.onclick = function () {
      tabs.forEach(t => t.classList.remove("active"));
      forms.forEach(f => f.classList.remove("active"));

      tab.classList.add("active");
      CURRENT_AI_TYPE = tab.dataset.type;

      const targetForm = document.getElementById(`form-${CURRENT_AI_TYPE}`);
      if (targetForm) targetForm.classList.add("active");

      if (!CURRENT_AI_TEXT.trim()) {
        renderPremiumPlaceholder();
      }
    };
  });
}

/* =========================
   BUTTON GENERATE
========================= */
function initGenerateButtons() {
  const btnLesson = document.getElementById("btnGenerateLesson");
  const btnExercise = document.getElementById("btnGenerateExercise");
  const btnExam = document.getElementById("btnGenerateExam");
  const btnToeic = document.getElementById("btnGenerateToeic");

  if (btnLesson) {
    btnLesson.onclick = function () {
      generateAIContent(AI_TYPES.LESSON, getLessonPayload());
    };
  }

  if (btnExercise) {
    btnExercise.onclick = function () {
      generateAIContent(AI_TYPES.EXERCISE, getExercisePayload());
    };
  }

  if (btnExam) {
    btnExam.onclick = function () {
      generateAIContent(AI_TYPES.EXAM, getExamPayload());
    };
  }

  if (btnToeic) {
    btnToeic.onclick = function () {
      generateAIContent(AI_TYPES.TOEIC, getToeicPayload());
    };
  }
}

/* =========================
   ACTION BUTTONS
========================= */
function initActionButtons() {
  const btnNormalize = document.getElementById("btnNormalizeAI");
  const btnCopy = document.getElementById("btnCopyAI");
  const btnSaveDraft = document.getElementById("btnSaveDraftAI");

  if (btnNormalize) {
    btnNormalize.onclick = function () {
      if (!CURRENT_AI_TEXT.trim()) {
        return window.showToast?.("Chưa có nội dung AI để chuẩn hóa", "warning");
      }

      const normalized = normalizeTeachingContent(CURRENT_AI_TEXT, CURRENT_AI_TYPE);
      CURRENT_AI_TEXT = normalized;

      const renderHtml =
        ["exam", "toeic", "exercise"].includes(CURRENT_AI_TYPE)
          ? plainTextToHtmlParagraphs(normalized)
          : wrapAiContent(normalized);

      renderPremiumAIOutput(
        CURRENT_AI_TYPE,
        renderHtml,
        "success",
        CURRENT_AI_FAKE_MODE,
        CURRENT_AI_PROVIDER
      );

      window.showToast?.("✨ Đã chuẩn hóa nội dung AI", "success");
    };
  }

  if (btnCopy) {
    btnCopy.onclick = function () {
      if (!CURRENT_AI_TEXT) {
        return window.showToast?.("Chưa có nội dung AI để copy", "warning");
      }
 console.log("=== COPY CURRENT_AI_TEXT ===");
    console.log(CURRENT_AI_TEXT);
      copyTextToClipboard(CURRENT_AI_TEXT);
    };
  }

  if (btnSaveDraft) {
    btnSaveDraft.onclick = function () {
      const payload = getCurrentFormPayload();

      localStorage.setItem("teacher_ai_draft", JSON.stringify({
        type: CURRENT_AI_TYPE,
        text: CURRENT_AI_TEXT,
        payload,
        provider: CURRENT_AI_PROVIDER,
        fakeMode: CURRENT_AI_FAKE_MODE,
        created_at: Date.now()
      }));

      window.showToast?.("✅ Đã lưu nháp AI", "success");
    };
  }
}

/* =========================
   PUSH TO REAL TAB
========================= */
function initPushButtons() {
  document.getElementById("btnPushToLesson")?.addEventListener("click", pushToLesson);
  document.getElementById("btnPushToExercise")?.addEventListener("click", pushToExercise);
  document.getElementById("btnPushToExam")?.addEventListener("click", pushToExam);
  document.getElementById("btnPushToToeic")?.addEventListener("click", pushToToeic);
}

function pushToLesson() {
  if (!CURRENT_AI_TEXT.trim()) {
    return window.showToast?.("Chưa có nội dung AI để đưa sang Bài giảng", "warning");
  }

  const p = getLessonPayload();
  const normalized = normalizeTeachingContent(CURRENT_AI_TEXT, "lesson");
  CURRENT_AI_TEXT = normalized;

  localStorage.setItem("teacher_ai_push_baigiang", JSON.stringify({
    title: p.chuDe || "Bài giảng AI",
    subjectText: p.monHoc || "",
    classText: p.trinhDo || "",
    ngay: getToday(),
    content_html: convertAITextToHtml(normalized),
    ai_meta: p,
    ai_provider: CURRENT_AI_PROVIDER,
    ai_fakeMode: CURRENT_AI_FAKE_MODE
  }));

  openTeacherTab("baigiang");
  window.showToast?.("📘 Đã chuyển sang tab Bài giảng", "success");
}

function pushToExercise() {
  if (!CURRENT_AI_TEXT.trim()) {
    return window.showToast?.("Chưa có nội dung AI để đưa sang Bài tập", "warning");
  }

  const p = getExercisePayload();
  const normalized = normalizeTeachingContent(CURRENT_AI_TEXT, "exercise");

  localStorage.setItem("teacher_ai_push_baitap", JSON.stringify({
    title: p.chuDe || "Bài tập AI",
    content_text: normalized,
    content_html: plainTextToHtmlParagraphs(normalized)
  }));

  openTeacherTab("baitap");
  window.showToast?.("📝 Đã chuyển sang tab Bài tập", "success");
}

function pushToExam() {
  if (!CURRENT_AI_TEXT.trim()) {
    return window.showToast?.("Chưa có nội dung AI để đưa sang Đề kiểm tra", "warning");
  }

  const p = getExamPayload();
  const normalized = normalizeTeachingContent(CURRENT_AI_TEXT, "exam");

  localStorage.setItem("teacher_ai_push_kiemtra", JSON.stringify({
    title: p.chuDe || "Đề kiểm tra AI",
    content_text: normalized,
    content_html: plainTextToHtmlParagraphs(normalized)
  }));

  openTeacherTab("kiemtra");
  window.showToast?.("📋 Đã chuyển sang tab Đề kiểm tra", "success");
}

function pushToToeic() {
  if (!CURRENT_AI_TEXT.trim()) {
    return window.showToast?.("Chưa có nội dung AI để đưa sang TOEIC", "warning");
  }

  const p = getToeicPayload();
  const normalized = normalizeTeachingContent(CURRENT_AI_TEXT, "toeic");

  localStorage.setItem("teacher_ai_push_toeic", JSON.stringify({
    title: p.chuDe || "TOEIC AI",
    content_text: normalized,
    content_html: plainTextToHtmlParagraphs(normalized)
  }));

  openTeacherTab("test");
  window.showToast?.("🎧 Đã chuyển sang tab TOEIC", "success");
}

function openTeacherTab(tabName) {
  const btn = document.querySelector(`.menu-item[data-tab="${tabName}"]`);
  if (btn) btn.click();
  else console.warn("Không tìm thấy menu-item tab:", tabName);
}

/* =========================
   GENERATE AI
========================= */
async function generateAIContent(type, payload) {
  const outputBox = document.getElementById("aiOutputBox");
  if (!outputBox) return;

  if (!canUseAI("teacher_ai_generate", 2500)) {
    return window.showToast?.("⏳ Bạn thao tác quá nhanh, thử lại sau 2-3 giây", "warning");
  }

  const prompt = buildAIPrompt(type, payload);

  setAIStatus("loading", "Thinking...");
  setAIProvider("processing");

  renderPremiumAIOutput(
    type,
    `<div class="ai-loading-fancy">
      <div class="ai-loader-ring"></div>
      <div class="ai-loading-text">
        <h3>Đang tạo nội dung AI...</h3>
        <p>Hệ thống đang xử lý nội dung cho giáo viên.</p>
      </div>
    </div>`,
    "loading",
    CURRENT_AI_FAKE_MODE,
    CURRENT_AI_PROVIDER
  );

  const result = await askAI({
    type,
    prompt,
    payload
  });

console.log("=== AI RESULT DEBUG ===");
console.log("success:", result?.success);
console.log("provider:", result?.provider);
console.log("fakeMode:", result?.fakeMode);
console.log("text:", result?.text);


  if (!result || !result.success) {
    CURRENT_AI_PROVIDER = result?.provider || "error";
    CURRENT_AI_FAKE_MODE = true;

    setAIStatus("error", "Error");
    setAIProvider(CURRENT_AI_PROVIDER);

    renderPremiumAIOutput(
      type,
      `
      <div class="ai-error-fancy">
        <div class="ai-error-icon">⚠️</div>
        <h3>Không thể tạo nội dung AI</h3>
        <p>${result?.text || "Hệ thống đang bận hoặc có lỗi kết nối."}</p>
      </div>
      `,
      "error",
      true,
      CURRENT_AI_PROVIDER
    );

    return;
  }

  CURRENT_AI_TEXT = result.text || "";
CURRENT_AI_TYPE = type;
CURRENT_AI_PAYLOAD = payload;
CURRENT_AI_PROVIDER = result.provider || "unknown";
CURRENT_AI_FAKE_MODE = !!result.fakeMode;

// ✅ cứu nếu AI quên không gắn *
CURRENT_AI_TEXT = autoFixMissingAnswerStars(CURRENT_AI_TEXT, CURRENT_AI_TYPE);

// ✅ luôn chuẩn hóa ngay sau khi AI trả về
CURRENT_AI_TEXT = normalizeTeachingContent(CURRENT_AI_TEXT, CURRENT_AI_TYPE);

console.log("=== AI RAW AFTER NORMALIZE ===");
console.log(CURRENT_AI_TEXT);

  if (CURRENT_AI_FAKE_MODE) {
    setAIStatus("fake", "AI Fake - Demo");
  } else {
    setAIStatus("live", "AI Live");
  }

  setAIProvider(CURRENT_AI_PROVIDER);

  const renderHtml =
    ["exam", "toeic", "exercise"].includes(CURRENT_AI_TYPE)
      ? plainTextToHtmlParagraphs(CURRENT_AI_TEXT)
      : wrapAiContent(CURRENT_AI_TEXT);

  renderPremiumAIOutput(
    type,
    renderHtml,
    "success",
    CURRENT_AI_FAKE_MODE,
    CURRENT_AI_PROVIDER
  );

  await logAIRequest({
    userId: getCurrentTeacherId(),
    type,
    input: payload,
    prompt,
    output: CURRENT_AI_TEXT,
    provider: CURRENT_AI_PROVIDER,
    fakeMode: CURRENT_AI_FAKE_MODE
  });

  window.showToast?.(
    CURRENT_AI_FAKE_MODE
      ? "🤖 AI tạo xong (Fake Demo)"
      : "🟢 AI Live tạo xong",
    "success"
  );
}

/* =========================
   PAYLOADS
========================= */
function getLessonPayload() {
  return {
    monHoc: val("lesson_monHoc"),
    chuDe: val("lesson_chuDe"),
    trinhDo: val("lesson_trinhDo"),
    mucTieu: val("lesson_mucTieu"),
    soPhan: val("lesson_soPhan"),
    phongCach: val("lesson_phongCach"),
    mucChiTiet: val("lesson_mucChiTiet"),
    ghiChu: val("lesson_ghiChu"),
    duLieuGoc: val("lesson_duLieuGoc")
  };
}

function getExercisePayload() {
  return {
    monHoc: val("exercise_monHoc"),
    chuDe: val("exercise_chuDe"),
    dangBai: val("exercise_dangBai"),
    doKho: val("exercise_doKho"),
    soLuong: val("exercise_soLuong"),
    dapAn: val("exercise_dapAn"),
    mucChiTiet: val("exercise_mucChiTiet"),
    ghiChu: val("exercise_ghiChu"),
    duLieuGoc: val("exercise_duLieuGoc")
  };
}

function getExamPayload() {
  return {
    monHoc: val("exam_monHoc"),
    chuDe: val("exam_chuDe"),
    thoiGian: val("exam_thoiGian"),
    soCau: val("exam_soCau"),
    doKho: val("exam_doKho"),
    loaiDe: val("exam_loaiDe"),
    dapAn: val("exam_dapAn"),
    ghiChu: val("exam_ghiChu"),
    duLieuGoc: val("exam_duLieuGoc")
  };
}

function getToeicPayload() {
  return {
    toeicPart: val("toeic_part"),
    chuDe: val("toeic_chuDe"),
    soCau: val("toeic_soCau"),
    doKho: val("toeic_doKho"),
    vocab: val("toeic_vocab"),
    style: val("toeic_style"),
    target: val("toeic_target"),
    ghiChu: val("toeic_ghiChu"),
    duLieuGoc: val("toeic_duLieuGoc")
  };
}

function getCurrentFormPayload() {
  switch (CURRENT_AI_TYPE) {
    case AI_TYPES.LESSON:
      return getLessonPayload();
    case AI_TYPES.EXERCISE:
      return getExercisePayload();
    case AI_TYPES.EXAM:
      return getExamPayload();
    case AI_TYPES.TOEIC:
      return getToeicPayload();
    default:
      return {};
  }
}

function val(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function getCurrentTeacherId() {
  return localStorage.getItem("teacher_id") || "unknown_teacher";
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function convertAITextToHtml(text = "") {
  return text
    .split("\n")
    .map(line => {
      const clean = line.trim();
      if (!clean) return "<p><br></p>";

      if (/^\d+\./.test(clean)) {
        return `<h3>${escapeHtml(clean)}</h3>`;
      }

      if (clean.startsWith("- ")) {
        return `<p>• ${escapeHtml(clean.slice(2))}</p>`;
      }

      return `<p>${escapeHtml(clean)}</p>`;
    })
    .join("");
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/* =========================
   LOAD DRAFT
========================= */
function loadSavedDraftIfAny() {
  const draft = localStorage.getItem("teacher_ai_draft");
  if (!draft) return;

  try {
    const parsed = JSON.parse(draft);
    if (!parsed) return;

    CURRENT_AI_TYPE = parsed.type || AI_TYPES.LESSON;
    CURRENT_AI_TEXT = parsed.text || "";
    CURRENT_AI_PAYLOAD = parsed.payload || {};
    CURRENT_AI_PROVIDER = parsed.provider || "saved_draft";
    CURRENT_AI_FAKE_MODE = parsed.fakeMode ?? true;

    restoreFormData(parsed.payload || {});
    restoreActiveTab(CURRENT_AI_TYPE);

    if (CURRENT_AI_TEXT) {
      setAIStatus("idle", "AI Ready");
      setAIProvider(CURRENT_AI_PROVIDER || "saved_draft");

      // ✅ chuẩn hóa lại để chắc chắn giữ *
      CURRENT_AI_TEXT = normalizeTeachingContent(CURRENT_AI_TEXT, CURRENT_AI_TYPE);

      const renderHtml =
        ["exam", "toeic", "exercise"].includes(CURRENT_AI_TYPE)
          ? plainTextToHtmlParagraphs(CURRENT_AI_TEXT)
          : wrapAiContent(CURRENT_AI_TEXT);

      renderPremiumAIOutput(
        CURRENT_AI_TYPE,
        renderHtml,
        "success",
        CURRENT_AI_FAKE_MODE,
        CURRENT_AI_PROVIDER
      );
    } else {
      setAIStatus("idle", "AI Ready");
      setAIProvider("standby");
      renderPremiumPlaceholder();
    }
  } catch (e) {
    console.warn("Không đọc được AI draft:", e);
  }
}

function restoreActiveTab(type) {
  const tabs = document.querySelectorAll(".ai-type-btn");
  const forms = document.querySelectorAll(".ai-form-section");

  tabs.forEach(t => t.classList.remove("active"));
  forms.forEach(f => f.classList.remove("active"));

  document.querySelector(`.ai-type-btn[data-type="${type}"]`)?.classList.add("active");
  document.getElementById(`form-${type}`)?.classList.add("active");
}

function restoreFormData(payload = {}) {
  Object.entries(payload).forEach(([key, value]) => {
    const idMap = {
      monHoc: `${CURRENT_AI_TYPE}_monHoc`,
      chuDe: `${CURRENT_AI_TYPE}_chuDe`,
      trinhDo: "lesson_trinhDo",
      mucTieu: "lesson_mucTieu",
      soPhan: "lesson_soPhan",
      phongCach: "lesson_phongCach",
      mucChiTiet: CURRENT_AI_TYPE === "lesson" ? "lesson_mucChiTiet" : "exercise_mucChiTiet",
      ghiChu: `${CURRENT_AI_TYPE}_ghiChu`,
      duLieuGoc: `${CURRENT_AI_TYPE}_duLieuGoc`,
      dangBai: "exercise_dangBai",
      doKho: `${CURRENT_AI_TYPE}_doKho`,
      soLuong: "exercise_soLuong",
      dapAn: CURRENT_AI_TYPE === "exercise" ? "exercise_dapAn" : "exam_dapAn",
      thoiGian: "exam_thoiGian",
      soCau: CURRENT_AI_TYPE === "exam" ? "exam_soCau" : "toeic_soCau",
      loaiDe: "exam_loaiDe",
      toeicPart: "toeic_part",
      vocab: "toeic_vocab",
      style: "toeic_style",
      target: "toeic_target"
    };

    const id = idMap[key];
    const el = document.getElementById(id);
    if (el) el.value = value || "";
  });
}

/* =========================
   AI STATUS BADGE
========================= */
function setAIStatus(type = "idle", text = "AI READY") {
  const badge = document.getElementById("aiStatusBadge");
  if (!badge) return;

  badge.className = `ai-status-badge ${type}`;
  const label = badge.querySelector(".label");
  if (label) label.textContent = text;
}

function setAIProvider(provider = "standby") {
  const el = document.getElementById("aiProviderText");
  if (el) el.textContent = `Provider: ${provider}`;
}