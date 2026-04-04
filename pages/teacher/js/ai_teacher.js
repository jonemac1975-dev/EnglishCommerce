import { askAI } from "../../../scripts/services/aiService.js";
import { buildAIPrompt } from "../../../scripts/ai/aiPromptBuilder.js";
import { wrapAiContent } from "../../../scripts/ai/aiParser.js";
import { canUseAI } from "../../../scripts/ai/aiRateLimit.js";
import { logAIRequest } from "../../../scripts/ai/aiLogger.js";
import { AI_TYPES } from "../../../scripts/ai/aiTypes.js";
import {
  showAILoading,
  showAIError,
  showAISuccess,
  copyTextToClipboard
} from "../../../js/aiSharedUI.js";

let CURRENT_AI_TEXT = "";
let CURRENT_AI_TYPE = AI_TYPES.LESSON;
let CURRENT_AI_PAYLOAD = {};

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
  const btnCopy = document.getElementById("btnCopyAI");
  const btnSaveDraft = document.getElementById("btnSaveDraftAI");

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
      const payload = getCurrentFormPayload();

      localStorage.setItem("teacher_ai_draft", JSON.stringify({
        type: CURRENT_AI_TYPE,
        text: CURRENT_AI_TEXT,
        payload,
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

  localStorage.setItem("teacher_ai_push_baigiang", JSON.stringify({
    title: p.chuDe || "Bài giảng AI",
    subjectText: p.monHoc || "",
    classText: p.trinhDo || "",
    ngay: getToday(),
    content_html: convertAITextToHtml(CURRENT_AI_TEXT),
    ai_meta: p
  }));

  openTeacherTab("baigiang");
  window.showToast?.("📘 Đã chuyển sang tab Bài giảng", "success");
}

function pushToExercise() {
  if (!CURRENT_AI_TEXT.trim()) {
    return window.showToast?.("Chưa có nội dung AI để đưa sang Bài tập", "warning");
  }

  const p = getExercisePayload();

  localStorage.setItem("teacher_ai_push_baitap", JSON.stringify({
    title: p.chuDe || "Bài tập AI",
    subjectText: p.monHoc || "",
    classText: "",
    dangBai: p.dangBai || "",
    doKho: p.doKho || "",
    dapAn: p.dapAn || "",
    content_text: CURRENT_AI_TEXT,
    ai_meta: p
  }));

  openTeacherTab("baitap");
  window.showToast?.("📝 Đã chuyển sang tab Bài tập", "success");
}

function pushToExam() {
  if (!CURRENT_AI_TEXT.trim()) {
    return window.showToast?.("Chưa có nội dung AI để đưa sang Đề kiểm tra", "warning");
  }

  const p = getExamPayload();

  localStorage.setItem("teacher_ai_push_kiemtra", JSON.stringify({
    title: p.chuDe || "Đề kiểm tra AI",
    subjectText: p.monHoc || "",
    thoiGian: p.thoiGian || "",
    soCau: p.soCau || "",
    doKho: p.doKho || "",
    loaiDe: p.loaiDe || "",
    dapAn: p.dapAn || "",
    content_text: CURRENT_AI_TEXT,
    ai_meta: p
  }));

  openTeacherTab("kiemtra");
  window.showToast?.("📋 Đã chuyển sang tab Đề kiểm tra", "success");
}

function pushToToeic() {
  if (!CURRENT_AI_TEXT.trim()) {
    return window.showToast?.("Chưa có nội dung AI để đưa sang TOEIC", "warning");
  }

  const p = getToeicPayload();

  localStorage.setItem("teacher_ai_push_toeic", JSON.stringify({
    title: p.chuDe || "TOEIC AI",
    toeicPart: p.toeicPart || "",
    soCau: p.soCau || "",
    doKho: p.doKho || "",
    style: p.style || "",
    vocab: p.vocab || "",
    target: p.target || "",
    content_text: CURRENT_AI_TEXT,
    ai_meta: p
  }));

  openTeacherTab("toeic");
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

  showAILoading(outputBox, "🤖 AI đang tạo nội dung...");

  const result = await askAI({
    type,
    prompt,
    payload
  });

  if (!result || !result.success) {
    showAIError(outputBox, result?.text || "Không thể tạo nội dung AI.");
    return;
  }

  CURRENT_AI_TEXT = result.text || "";
  CURRENT_AI_TYPE = type;
  CURRENT_AI_PAYLOAD = payload;

  showAISuccess(outputBox, wrapAiContent(CURRENT_AI_TEXT));

  await logAIRequest({
    userId: getCurrentTeacherId(),
    type,
    input: payload,
    prompt,
    output: CURRENT_AI_TEXT
  });

  window.showToast?.("🤖 AI đã tạo xong", "success");
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
        return `<h3>${clean}</h3>`;
      }

      if (clean.startsWith("- ")) {
        return `<p>• ${clean.slice(2)}</p>`;
      }

      return `<p>${escapeHtml(clean)}</p>`;
    })
    .join("");
}

function escapeHtml(str = "") {
  return str
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

    restoreFormData(parsed.payload || {});
    restoreActiveTab(CURRENT_AI_TYPE);

    const outputBox = document.getElementById("aiOutputBox");
    if (outputBox && CURRENT_AI_TEXT) {
      outputBox.innerHTML = wrapAiContent(CURRENT_AI_TEXT);
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