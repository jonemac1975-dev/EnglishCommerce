import { askAI } from "../../../scripts/services/aiService.js";
import { buildAIPrompt } from "../../../scripts/ai/aiPromptBuilder.js";
import { wrapAiContent } from "../../../scripts/ai/aiParser.js";
import { canUseAI } from "../../../scripts/ai/aiRateLimit.js";
import {
  logAIRequest,
  clearExpiredAILogs,
  clearAllMyAILogs
} from "../../../scripts/ai/aiLogger.js";
import { AI_TYPES } from "../../../scripts/ai/aiTypes.js";
import {
  normalizeTeachingContent,
  normalizeAIOutputForPreview,
  renderStructuredAIHtml,
  finalizeAIContent
} from "../../../scripts/utils/aiContentFormatter.js";

import { copyTextToClipboard } from "../../../js/aiSharedUI.js";

import {
  saveAIDraft,
  loadAIDraft,
  loadAIDraftHistory,
  clearAIDraft,
  removeAIDraftById
} from "../../../scripts/utils/aiDraftStorage.js";

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

async function initAITeacherPage() {
  injectQuickPresets();
  initTypeTabs();
  initGenerateButtons();
  initActionButtons();
  initPushButtons();
  initQuickPresetEvents();
  loadSavedDraftIfAny();
  renderPremiumPlaceholder();
  setAIStatus("idle", "AI Ready");
  setAIProvider("standby");
  bindDraftButtons();
  bindAILifecycleCleanup();

  // luôn dọn logs cloud khi vào AI page
  await clearAllMyAILogs(getCurrentTeacherId());
}

/* =========================
   PREMIUM UI HELPERS
========================= */
function getAITypeMeta(type) {
  const map = {
    lesson: { label: "AI Lesson Builder", badge: "📘 Lesson", cls: "lesson" },
    exercise: { label: "AI Exercise Builder", badge: "📝 Exercise", cls: "exercise" },
    exam: { label: "AI Exam Generator", badge: "📋 Exam", cls: "exam" },
    toeic: { label: "AI TOEIC Generator", badge: "🎧 TOEIC", cls: "toeic" }
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
        <p>Điền thông tin ở biểu mẫu bên trên và bấm <b>Tạo</b>.</p>
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
      } else {
        rehydrateAIPreviewIfNeeded();
      }
    };
  });
}

/* =========================
   BUTTON GENERATE
========================= */
function initGenerateButtons() {
  document.getElementById("btnGenerateLesson")?.addEventListener("click", () => {
    generateAIContent(AI_TYPES.LESSON, getLessonPayload());
  });

  document.getElementById("btnGenerateExercise")?.addEventListener("click", () => {
    generateAIContent(AI_TYPES.EXERCISE, getExercisePayload());
  });

  document.getElementById("btnGenerateExam")?.addEventListener("click", () => {
    generateAIContent(AI_TYPES.EXAM, getExamPayload());
  });

  document.getElementById("btnGenerateToeic")?.addEventListener("click", () => {
    generateAIContent(AI_TYPES.TOEIC, getToeicPayload());
  });
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

      CURRENT_AI_TEXT = finalizeAIContent(CURRENT_AI_TEXT, CURRENT_AI_TYPE);

      const renderHtml =
        ["exam", "toeic", "exercise"].includes(CURRENT_AI_TYPE)
          ? renderStructuredAIHtml(CURRENT_AI_TEXT, CURRENT_AI_TYPE)
          : wrapAiContent(CURRENT_AI_TEXT);

      renderPremiumAIOutput(
        CURRENT_AI_TYPE,
        renderHtml,
        "success",
        CURRENT_AI_FAKE_MODE,
        CURRENT_AI_PROVIDER
      );

      saveCurrentDraft();
      window.showToast?.("✨ Đã chuẩn hóa nội dung AI", "success");
    };
  }

  if (btnCopy) {
    btnCopy.onclick = function () {
      if (!CURRENT_AI_TEXT) {
        return window.showToast?.("Chưa có nội dung AI để copy", "warning");
      }
      copyTextToClipboard(CURRENT_AI_TEXT);
    };
  }

  if (btnSaveDraft) {
    btnSaveDraft.onclick = function () {
      saveCurrentDraft();
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
  saveCurrentDraft();

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
  const normalized = finalizeAIContent(CURRENT_AI_TEXT, "exercise");

  CURRENT_AI_TEXT = normalized;
  saveCurrentDraft();

  localStorage.setItem("teacher_ai_push_baitap", JSON.stringify({
    title: p.chuDe || "Bài tập AI",

    // 🔥 QUAN TRỌNG: chỉ lưu TEXT
    content_text: normalized,
    content_html: "" // ❌ KHÔNG lưu HTML nữa
  }));

  openTeacherTab("baitap");
  window.showToast?.("📝 Đã chuyển sang tab Bài tập", "success");
}

function pushToExam() {
  if (!CURRENT_AI_TEXT.trim()) {
    return window.showToast?.("Chưa có nội dung AI để đưa sang Đề kiểm tra", "warning");
  }

  const p = getExamPayload();
  const normalized = finalizeAIContent(CURRENT_AI_TEXT, "exam");

  CURRENT_AI_TEXT = normalized;
  saveCurrentDraft();

  localStorage.setItem("teacher_ai_push_kiemtra", JSON.stringify({
    title: p.chuDe || "Đề kiểm tra AI",
    content_text: normalized,
    content_html: ""
  }));

  openTeacherTab("kiemtra");
  window.showToast?.("📋 Đã chuyển sang tab Đề kiểm tra", "success");
}

function pushToToeic() {
  if (!CURRENT_AI_TEXT.trim()) {
    return window.showToast?.("Chưa có nội dung AI để đưa sang TOEIC", "warning");
  }

  const p = getToeicPayload();
  const normalized = finalizeAIContent(CURRENT_AI_TEXT, "toeic");

  CURRENT_AI_TEXT = normalized;
  saveCurrentDraft();

  localStorage.setItem("teacher_ai_push_toeic", JSON.stringify({
    title: p.chuDe || "TOEIC AI",
    content_text: normalized,
    content_html: ""
  }));

  openTeacherTab("test");
  window.showToast?.("🎧 Đã chuyển sang tab TOEIC", "success");
}

function openTeacherTab(tabName) {
  const btn = document.querySelector(`.menu-item[data-tab="${tabName}"]`);
  if (btn) btn.click();
}

/* =========================
   GENERATE AI
========================= */
async function generateAIContent(type, payload) {
  const outputBox = document.getElementById("aiOutputBox");
  if (!outputBox) return;

  await clearExpiredAILogs(getCurrentTeacherId());

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

  try {
    const result = await askAI({
      type,
      prompt,
      payload,
      userId: getCurrentTeacherId(),
      role: "teacher"
    });

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

    CURRENT_AI_TEXT = result.text || result.raw || result.content || "";
    CURRENT_AI_TYPE = type;
    CURRENT_AI_PAYLOAD = payload;
    CURRENT_AI_PROVIDER = result.provider || "unknown";
    CURRENT_AI_FAKE_MODE = !!result.fakeMode;

    CURRENT_AI_TEXT = finalizeAIContent(CURRENT_AI_TEXT, CURRENT_AI_TYPE);

    if (CURRENT_AI_FAKE_MODE) {
      setAIStatus("fake", "AI Fake - Demo");
    } else {
      setAIStatus("live", "AI Live");
    }

    setAIProvider(CURRENT_AI_PROVIDER);

    const renderHtml =
      ["exam", "toeic", "exercise"].includes(CURRENT_AI_TYPE)
        ? renderStructuredAIHtml(CURRENT_AI_TEXT, CURRENT_AI_TYPE)
        : wrapAiContent(CURRENT_AI_TEXT);

    renderPremiumAIOutput(
      type,
      renderHtml,
      "success",
      CURRENT_AI_FAKE_MODE,
      CURRENT_AI_PROVIDER
    );

    saveAIDraft({
      type,
      title: makeDraftTitle(type, prompt),
      prompt,
      raw: CURRENT_AI_TEXT,
      html: normalizeAIOutputForPreview(CURRENT_AI_TEXT, CURRENT_AI_TYPE),
      plainText: CURRENT_AI_TEXT
    });

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
  } catch (err) {
    console.error("❌ generateAIContent error:", err);
    setAIStatus("error", "Error");
    setAIProvider("exception");
    renderPremiumAIOutput(
      type,
      `<div class="ai-error-fancy"><div class="ai-error-icon">⚠️</div><h3>Lỗi hệ thống</h3><p>${err.message || "Không xác định"}</p></div>`,
      "error",
      true,
      "exception"
    );
  }
}

/* =========================
   DRAFT HELPERS
========================= */
function saveCurrentDraft() {
  saveAIDraft({
    type: CURRENT_AI_TYPE,
    title: makeDraftTitle(CURRENT_AI_TYPE, getCurrentMainTopic()),
    prompt: getCurrentMainTopic(),
    raw: CURRENT_AI_TEXT,
    html: normalizeAIOutputForPreview(CURRENT_AI_TEXT, CURRENT_AI_TYPE),
    plainText: CURRENT_AI_TEXT
  });

  localStorage.setItem("teacher_ai_draft", JSON.stringify({
    type: CURRENT_AI_TYPE,
    text: CURRENT_AI_TEXT,
    payload: getCurrentFormPayload(),
    provider: CURRENT_AI_PROVIDER,
    fakeMode: CURRENT_AI_FAKE_MODE,
    created_at: Date.now()
  }));
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

      CURRENT_AI_TEXT = finalizeAIContent(CURRENT_AI_TEXT, CURRENT_AI_TYPE);

      const renderHtml =
        ["exam", "toeic", "exercise"].includes(CURRENT_AI_TYPE)
          ? renderStructuredAIHtml(CURRENT_AI_TEXT, CURRENT_AI_TYPE)
          : wrapAiContent(CURRENT_AI_TEXT);

      renderPremiumAIOutput(
        CURRENT_AI_TYPE,
        renderHtml,
        "success",
        CURRENT_AI_FAKE_MODE,
        CURRENT_AI_PROVIDER
      );
    } else {
      renderPremiumPlaceholder();
    }
  } catch (e) {
    console.warn("Không đọc được AI draft:", e);
  }
}

function bindDraftButtons() {
  document.getElementById("btnRestoreAIDraft")?.addEventListener("click", () => {
    openDraftHistoryModal();
  });

  document.getElementById("btnClearAIDraft")?.addEventListener("click", () => {
    if (!confirm("Bạn có chắc muốn xóa toàn bộ lịch sử AI local?")) return;

    clearAIDraft();
    localStorage.removeItem("teacher_ai_draft");
    CURRENT_AI_TEXT = "";
    renderPremiumPlaceholder();
    window.showToast?.("🗑️ Đã xóa toàn bộ lịch sử AI local", "success");
  });
}

function rehydrateAIPreviewIfNeeded() {
  if (!CURRENT_AI_TEXT?.trim()) {
    const draft = loadAIDraft();
    if (draft?.raw) {
      CURRENT_AI_TEXT = draft.raw;
      CURRENT_AI_TYPE = draft.type || CURRENT_AI_TYPE;

      CURRENT_AI_TEXT = finalizeAIContent(CURRENT_AI_TEXT, CURRENT_AI_TYPE);

      const renderHtml =
        ["exam", "toeic", "exercise"].includes(CURRENT_AI_TYPE)
          ? renderStructuredAIHtml(CURRENT_AI_TEXT, CURRENT_AI_TYPE)
          : wrapAiContent(CURRENT_AI_TEXT);

      renderPremiumAIOutput(
        CURRENT_AI_TYPE,
        renderHtml,
        "success",
        CURRENT_AI_FAKE_MODE,
        CURRENT_AI_PROVIDER
      );
    }
  }
}

function makeDraftTitle(type = "lesson", prompt = "") {
  const shortPrompt = (prompt || "").slice(0, 60).trim();
  const typeMap = {
    lesson: "Bài giảng",
    exercise: "Bài tập",
    exam: "Kiểm tra",
    toeic: "TOEIC"
  };
  return `${typeMap[type] || "AI"} - ${shortPrompt || "Không tiêu đề"}`;
}

function getCurrentMainTopic() {
  switch (CURRENT_AI_TYPE) {
    case AI_TYPES.LESSON:
      return val("lesson_chuDe");
    case AI_TYPES.EXERCISE:
      return val("exercise_chuDe");
    case AI_TYPES.EXAM:
      return val("exam_chuDe");
    case AI_TYPES.TOEIC:
      return val("toeic_chuDe");
    default:
      return "";
  }
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
    mucTieuDauRa: val("exercise_mucTieuDauRa"),
    formatMongMuon: val("exercise_formatMongMuon"),
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
    mucTieuDauRa: val("exam_mucTieuDauRa"),
    formatMongMuon: val("exam_formatMongMuon"),
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
    formatMongMuon: val("toeic_formatMongMuon"),
    kyNang: val("toeic_kyNang"),
    ghiChu: val("toeic_ghiChu"),
    duLieuGoc: val("toeic_duLieuGoc")
  };
}

function getCurrentFormPayload() {
  switch (CURRENT_AI_TYPE) {
    case AI_TYPES.LESSON: return getLessonPayload();
    case AI_TYPES.EXERCISE: return getExercisePayload();
    case AI_TYPES.EXAM: return getExamPayload();
    case AI_TYPES.TOEIC: return getToeicPayload();
    default: return {};
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

/* =========================
   AI CLEAN FOR OLD PREVIEW
========================= */
function sanitizeAIForPreview(text = "", type = "exercise") {
  if (!text) return "";

  const cleaned = finalizeAIContent(text, type);
  const lines = cleaned.split("\n").map(x => x.trim()).filter(Boolean);
  return lines.join("\n").trim();
}

/* =========================
   HTML CONVERTERS
========================= */
function convertAITextToHtml(text = "") {
  return text
    .split("\n")
    .map(line => {
      const clean = line.trim();
      if (!clean) return "<p><br></p>";
      if (/^\d+\./.test(clean)) return `<h3>${escapeHtml(clean)}</h3>`;
      if (clean.startsWith("- ")) return `<p>• ${escapeHtml(clean.slice(2))}</p>`;
      return `<p>${escapeHtml(clean)}</p>`;
    })
    .join("");
}

function convertStructuredPreviewHtml(text = "") {
  return renderStructuredAIHtml(text);
}

/* =========================
   RESTORE UI
========================= */
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
      target: "toeic_target",
      mucTieuDauRa:
        CURRENT_AI_TYPE === "exercise"
          ? "exercise_mucTieuDauRa"
          : "exam_mucTieuDauRa",
      formatMongMuon:
        CURRENT_AI_TYPE === "exercise"
          ? "exercise_formatMongMuon"
          : CURRENT_AI_TYPE === "exam"
          ? "exam_formatMongMuon"
          : "toeic_formatMongMuon",
      kyNang: "toeic_kyNang"
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

/* =========================
   QUICK PRESETS
========================= */
function injectQuickPresets() {
  const header = document.querySelector(".ai-header");
  if (!header || document.getElementById("aiQuickPresets")) return;

  const div = document.createElement("div");
  div.id = "aiQuickPresets";
  div.className = "ai-quick-presets";

  div.innerHTML = `
    <div class="ai-preset-title">⚡ Preset nhanh</div>
    <div class="ai-preset-wrap">
      <button class="ai-preset-btn" data-preset="lesson_basic">📘 Bài giảng nhanh</button>
      <button class="ai-preset-btn" data-preset="exercise_dialogue">💬 5 câu hội thoại</button>
      <button class="ai-preset-btn" data-preset="exercise_reading">📖 Đọc hiểu</button>
      <button class="ai-preset-btn" data-preset="exam_15p">📝 KT 15p</button>
      <button class="ai-preset-btn" data-preset="exam_mix">📋 Đề mix</button>
      <button class="ai-preset-btn" data-preset="toeic_part5">🎧 TOEIC Part 5</button>
      <button class="ai-preset-btn" data-preset="toeic_part7">📄 TOEIC Part 7</button>
    </div>
  `;

  header.insertAdjacentElement("afterend", div);
}

function initQuickPresetEvents() {
  document.querySelectorAll(".ai-preset-btn").forEach(btn => {
    btn.addEventListener("click", () => applyQuickPreset(btn.dataset.preset));
  });
}

function applyQuickPreset(preset = "") {
  switch (preset) {
    case "lesson_basic":
      switchAITab("lesson");
      setVal("lesson_monHoc", "Tiếng Anh");
      setVal("lesson_trinhDo", "A2");
      setVal("lesson_mucTieu", "Hiểu bài và vận dụng cơ bản");
      setVal("lesson_soPhan", "4");
      setVal("lesson_phongCach", "Dễ hiểu, sinh động");
      setVal("lesson_mucChiTiet", "vừa");
      setVal("lesson_ghiChu", "Có ví dụ thực tế, có câu hỏi cuối bài");
      break;

    case "exercise_dialogue":
      switchAITab("exercise");
      setVal("exercise_monHoc", "Tiếng Anh");
      setVal("exercise_dangBai", "Hội thoại");
      setVal("exercise_doKho", "Cơ bản");
      setVal("exercise_soLuong", "5");
      setVal("exercise_dapAn", "Không");
      setVal("exercise_mucChiTiet", "vừa");
      setVal("exercise_ghiChu", "Từ nội dung trên, hãy tạo 5 câu hội thoại ngắn. Không tạo trắc nghiệm.");
      break;

    case "exercise_reading":
      switchAITab("exercise");
      setVal("exercise_monHoc", "Tiếng Anh");
      setVal("exercise_dangBai", "Đọc hiểu");
      setVal("exercise_doKho", "Trung bình");
      setVal("exercise_soLuong", "5");
      setVal("exercise_dapAn", "Có");
      setVal("exercise_mucChiTiet", "kỹ");
      setVal("exercise_ghiChu", "Tạo 1 đoạn đọc hiểu ngắn rồi tạo 5 câu hỏi dựa trên đoạn văn.");
      break;

    case "exam_15p":
      switchAITab("exam");
      setVal("exam_monHoc", "Tiếng Anh");
      setVal("exam_thoiGian", "15 phút");
      setVal("exam_soCau", "10");
      setVal("exam_doKho", "Cơ bản");
      setVal("exam_loaiDe", "Trắc nghiệm");
      setVal("exam_dapAn", "Có");
      setVal("exam_ghiChu", "Tạo đề kiểm tra ngắn, đúng format preview cũ, mỗi câu 4 đáp án, đáp án đúng có dấu * cuối dòng.");
      break;

    case "exam_mix":
      switchAITab("exam");
      setVal("exam_monHoc", "Tiếng Anh");
      setVal("exam_thoiGian", "45 phút");
      setVal("exam_soCau", "15");
      setVal("exam_doKho", "Trung bình");
      setVal("exam_loaiDe", "Mix");
      setVal("exam_dapAn", "Có");
      setVal("exam_ghiChu", "Tạo đề gồm trắc nghiệm + tự luận + đọc hiểu nếu phù hợp.");
      break;

    case "toeic_part5":
      switchAITab("toeic");
      setVal("toeic_part", "Part 5");
      setVal("toeic_soCau", "10");
      setVal("toeic_doKho", "450-650");
      setVal("toeic_style", "Business / Office");
      setVal("toeic_target", "Band 450-650");
      setVal("toeic_ghiChu", "Tạo câu hỏi ngữ pháp và từ vựng theo chuẩn TOEIC Part 5.");
      break;

    case "toeic_part7":
      switchAITab("toeic");
      setVal("toeic_part", "Part 7");
      setVal("toeic_soCau", "5");
      setVal("toeic_doKho", "550-750");
      setVal("toeic_style", "Email / Notice / Article");
      setVal("toeic_target", "Band 550-750");
      setVal("toeic_ghiChu", "Tạo 1 đoạn đọc TOEIC Part 7 + câu hỏi đúng format.");
      break;
  }

  toastPreset("Đã áp preset");
}

function switchAITab(type = "lesson") {
  document.querySelector(`.ai-type-btn[data-type="${type}"]`)?.click();
}

function setVal(id, value = "") {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function toastPreset(msg = "Đã áp preset") {
  window.showToast?.(`⚡ ${msg}`, "success");
}

window.addEventListener("beforeunload", () => {
  clearAllMyAILogs(getCurrentTeacherId());
});

function bindAILifecycleCleanup() {
  // Khi tab browser bị ẩn / user rời page
  document.addEventListener("visibilitychange", async () => {
    if (document.hidden) {
      try {
        await clearAllMyAILogs(getCurrentTeacherId());
        console.log("🧹 AI logs cleared on hidden");
      } catch (err) {
        console.warn("clear logs on hidden failed:", err);
      }
    }
  });

  // Khi unload
  window.addEventListener("pagehide", () => {
    try {
      clearAllMyAILogs(getCurrentTeacherId());
    } catch (err) {
      console.warn("pagehide clear failed:", err);
    }
  });

  window.addEventListener("beforeunload", () => {
    try {
      clearAllMyAILogs(getCurrentTeacherId());
    } catch (err) {
      console.warn("beforeunload clear failed:", err);
    }
  });
}


function openDraftHistoryModal() {
  const list = loadAIDraftHistory();

  if (!list.length) {
    return window.showToast?.("Chưa có lịch sử AI local", "warning");
  }

  let old = document.getElementById("aiDraftHistoryModal");
  if (old) old.remove();

  const modal = document.createElement("div");
  modal.id = "aiDraftHistoryModal";
  modal.className = "ai-draft-modal";

  modal.innerHTML = `
    <div class="ai-draft-modal-backdrop"></div>
    <div class="ai-draft-modal-box">
      <div class="ai-draft-modal-header">
        <h3>🕘 5 nội dung AI gần nhất</h3>
        <button class="ai-draft-close" id="closeAIDraftModal">✕</button>
      </div>

      <div class="ai-draft-list">
        ${list.map(item => `
          <div class="ai-draft-item" data-id="${item.id}">
            <div class="ai-draft-item-top">
              <div class="ai-draft-title">${escapeHtml(item.title || "AI Draft")}</div>
              <div class="ai-draft-type">${escapeHtml(item.type || "lesson")}</div>
            </div>
            <div class="ai-draft-preview">${escapeHtml((item.raw || "").slice(0, 180))}</div>
            <div class="ai-draft-item-actions">
              <button class="ai-draft-load-btn" data-load="${item.id}">Khôi phục</button>
              <button class="ai-draft-delete-btn" data-delete="${item.id}">Xóa</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("closeAIDraftModal")?.addEventListener("click", () => modal.remove());
  modal.querySelector(".ai-draft-modal-backdrop")?.addEventListener("click", () => modal.remove());

  modal.querySelectorAll("[data-load]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-load");
      restoreDraftById(id);
      modal.remove();
    });
  });

  modal.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-delete");
      removeAIDraftById(id);
      modal.remove();
      openDraftHistoryModal();
    });
  });
}

function restoreDraftById(id = "") {
  const list = loadAIDraftHistory();
  const draft = list.find(x => x.id === id);
  if (!draft) return;

  CURRENT_AI_TYPE = draft.type || AI_TYPES.LESSON;
  CURRENT_AI_TEXT = draft.raw || "";
  CURRENT_AI_PROVIDER = "local_history";
  CURRENT_AI_FAKE_MODE = true;

  restoreActiveTab(CURRENT_AI_TYPE);

  CURRENT_AI_TEXT = finalizeAIContent(CURRENT_AI_TEXT, CURRENT_AI_TYPE);

  const renderHtml =
    ["exam", "toeic", "exercise"].includes(CURRENT_AI_TYPE)
      ? renderStructuredAIHtml(CURRENT_AI_TEXT, CURRENT_AI_TYPE)
      : wrapAiContent(CURRENT_AI_TEXT);

  renderPremiumAIOutput(
    CURRENT_AI_TYPE,
    renderHtml,
    "success",
    CURRENT_AI_FAKE_MODE,
    CURRENT_AI_PROVIDER
  );

  window.showToast?.("♻️ Đã khôi phục nội dung AI", "success");
}