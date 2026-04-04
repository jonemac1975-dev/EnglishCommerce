import { readData, writeData }
from "../../../scripts/services/firebaseService.js";

const teacherId = localStorage.getItem("teacher_id");
if (!teacherId) location.href = "../../index.html";

let currentEditId = null;
let lopNameMap = {};
let currentMediaType = null; // audio | video | youtube

/* ================= INIT ================= */
export async function init() {
  document.getElementById("btnAdd")?.addEventListener("click", addTest);
  document.getElementById("btnSave")?.addEventListener("click", saveTest);

  document.getElementById("btnPreviewInline")
    ?.addEventListener("click", previewCurrentDraft);

  document.getElementById("btnFormatTest")
    ?.addEventListener("click", autoFormatEditor);

  bindToolbarActions();
  bindMediaModal();
   await loadTestLop();
  await loadList();
applyAIPushedToeic();

}

/* ================= LOAD LỚP ================= */
async function loadTestLop() {
  const sel = document.getElementById("testLop");
  if (!sel) return;

  const data = await readData("config/danh_muc/lop");
  if (!data) return;

  sel.innerHTML = `<option value="">Chọn lớp</option>`;
  lopNameMap = {};

  Object.entries(data).forEach(([id, item]) => {
    lopNameMap[id] = item.name || id;

    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = item.name || id;
    sel.appendChild(opt);
  });
}

/* ================= ADD ================= */
async function addTest() {
  const data = getFormData();

  if (!data.made) return showToast("Chưa nhập mã đề");
  if (!data.noidung || !stripHtml(data.noidung).trim()) {
    return showToast("Chưa có nội dung");
  }
  if (!data.lop) return showToast("Chưa chọn lớp");

  const list = await readData(`teacher/${teacherId}/test`);
  if (list) {
    const trung = Object.values(list).some(t => t.made === data.made);
    if (trung) return showToast("⚠️ Mã đề đã tồn tại");
  }

  const id = "test_" + Date.now();

  await writeData(`teacher/${teacherId}/test/${id}`, data);

  showToast("✅ Đã thêm đề TOEIC");
  clearForm();
  await loadList();

}

/* ================= SAVE ================= */
async function saveTest() {
  if (!currentEditId) return showToast("Chưa chọn đề để sửa");

  const data = getFormData();

  if (!data.made) return showToast("Chưa nhập mã đề");
  if (!data.noidung || !stripHtml(data.noidung).trim()) {
    return showToast("Chưa có nội dung");
  }
  if (!data.lop) return showToast("Chưa chọn lớp");

  await writeData(
    `teacher/${teacherId}/test/${currentEditId}`,
    data
  );

  showToast("💾 Đã lưu thay đổi");
  clearForm();
  await loadList();
  
}

/* ================= LIST ================= */
async function loadList() {
  test_list.innerHTML = "";

  const data = await readData(`teacher/${teacherId}/test`);
  if (!data) return;

  let i = 1;

  Object.entries(data).forEach(([id, item]) => {
    const tr = document.createElement("tr");
    const tenLop = lopNameMap[item.lop] || item.lop || "";

    tr.innerHTML = `
      <td>${i++}</td>
      <td><b>${item.made || ""}</b></td>
      <td>${tenLop}</td>
      <td class="tb-action-cell">
        <button class="tb-row-btn" onclick="editTest('${id}')">Sửa</button>
        <button class="tb-row-btn danger" onclick="deleteTest('${id}')">Xóa</button>
        <button class="tb-row-btn ghost" onclick="previewTest('${id}')">Preview</button>
      </td>
    `;

    test_list.appendChild(tr);
  });
}

/* ================= EDIT ================= */
window.editTest = async id => {
  const d = await readData(`teacher/${teacherId}/test/${id}`);
  if (!d) return;

  currentEditId = id;

  test_made.value = d.made || "";
  test_noidung.innerHTML = d.noidung || "";
  testLop.value = d.lop || "";

  showToast("✏️ Đang chỉnh sửa đề");
   window.scrollTo({ top: 0, behavior: "smooth" });
};

/* ================= DELETE ================= */
window.deleteTest = async id => {
  if (!confirm("Xóa đề TOEIC này?")) return;

  await writeData(`teacher/${teacherId}/test/${id}`, null);

  showToast("🗑 Đã xóa đề TOEIC");
  await loadList();
};

/* ================= PREVIEW TAB ================= */
window.previewTest = async id => {
  const d = await readData(`teacher/${teacherId}/test/${id}`);
  if (!d) return;

  localStorage.setItem(
    "lesson_preview",
    JSON.stringify({
      name: `Đề TOEIC ${d.made}`,
      meta: `Lớp: ${lopNameMap[d.lop] || d.lop || ""}`,
      content: d.noidung
    })
  );

  window.open("/preview.html", "_blank");
};

/* ================= TOOLBAR ================= */
function bindToolbarActions() {
  const imagePicker = document.getElementById("imagePicker");

  document.getElementById("btnInsertQuestion")
    ?.addEventListener("click", () => {
      insertHtmlAtCursor(`
        <p><b>Câu 1.</b> Nội dung câu hỏi...</p>
        <p>A. Đáp án A</p>
        <p>B. Đáp án B*</p>
        <p>C. Đáp án C</p>
        <p>D. Đáp án D</p>
        <p><br></p>
      `);
      
    });

  document.getElementById("btnInsertPassage")
    ?.addEventListener("click", () => {
      insertHtmlAtCursor(`
        <p><b>Passage:</b></p>
        <p>Nhập đoạn văn / đoạn hội thoại ở đây...</p>
        <p><br></p>
      `);
     
    });

  /* ========= IMAGE FROM PC ========= */
  document.getElementById("btnInsertImage")
    ?.addEventListener("click", () => {
      imagePicker.value = "";
      imagePicker.click();
    });

  imagePicker?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 0.25); // 25%
      insertHtmlAtCursor(`
        <p class="tb-media-center">
          <img src="${compressed}" alt="image" class="tb-insert-img">
        </p>
      `);
      showToast("🖼 Đã chèn ảnh và nén nhẹ");
     
    } catch (err) {
      console.error(err);
      showToast("❌ Không thể chèn ảnh");
    }
  });

  /* ========= AUDIO ========= */
  document.getElementById("btnInsertAudio")
    ?.addEventListener("click", () => openMediaModal("audio"));

  /* ========= VIDEO ========= */
  document.getElementById("btnInsertVideo")
    ?.addEventListener("click", () => openMediaModal("video"));

  /* ========= YOUTUBE ========= */
  document.getElementById("btnInsertYoutube")
    ?.addEventListener("click", () => openMediaModal("youtube"));
}


/* ================= FORMAT SMART ================= */
function autoFormatEditor() {
  const raw = test_noidung.innerText || "";
  if (!raw.trim()) return showToast("Chưa có nội dung để chuẩn hóa");

  const html = parseRawTextToHtml(raw);
  test_noidung.innerHTML = html;

  showToast("✨ Đã chuẩn hóa đề");
  
}

/* ================= PARSE RAW TEXT ================= */
function parseRawTextToHtml(raw) {
  const lines = raw
    .replace(/\r/g, "")
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean);

  let html = "";

  for (let line of lines) {
    const isQuestion =
      /^câu\s*\d+/i.test(line) ||
      /^question\s*\d+/i.test(line);

    const isOption = /^[A-D][\.\)\-:]/i.test(line);

    if (isQuestion) {
      html += `<p><b>${escapeHtml(line)}</b></p>`;
      continue;
    }

    if (isOption) {
      html += `<p>${escapeHtml(line)}</p>`;
      continue;
    }

    html += `<p>${escapeHtml(line)}</p>`;
  }

  return html || "<p></p>";
}




/* ================= FORM DATA ================= */
function getFormData() {
  return {
    made: test_made.value.trim(),
    lop: document.getElementById("testLop").value,
    noidung: test_noidung.innerHTML,
    updatedAt: Date.now()
  };
}

function clearForm() {
  currentEditId = null;
  test_made.value = "";
  test_noidung.innerHTML = "";
  testLop.value = "";
}

/* ================= CURSOR INSERT ================= */
function insertHtmlAtCursor(html) {
  test_noidung.focus();

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    test_noidung.innerHTML += html;
    return;
  }

  const range = sel.getRangeAt(0);
  range.deleteContents();

  const temp = document.createElement("div");
  temp.innerHTML = html;

  const frag = document.createDocumentFragment();
  let node;
  while ((node = temp.firstChild)) {
    frag.appendChild(node);
  }

  range.insertNode(frag);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

/* ================= URL HELPERS ================= */
function isValidMediaUrl(url) {
  return /^https?:\/\/.+/i.test((url || "").trim());
}

function convertYoutubeToEmbed(url) {
  try {
    if (url.includes("youtube.com/watch?v=")) {
      const id = new URL(url).searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1].split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (url.includes("/embed/")) return url;
    return null;
  } catch {
    return null;
  }
}

function convertGoogleDriveToPreview(url) {
  if (!url) return "";

  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch?.[1]) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }

  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch?.[1]) {
    return `https://drive.google.com/file/d/${openMatch[1]}/preview`;
  }

  return "";
}

function convertGoogleDriveToDirect(url) {
  if (!url) return "";

  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch?.[1]) {
    return `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`;
  }

  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch?.[1]) {
    return `https://drive.google.com/uc?export=download&id=${openMatch[1]}`;
  }

  return url.trim();
}

function normalizeMediaUrl(url) {
  return (url || "").trim();
}

function isGoogleDriveUrl(url) {
  return /drive\.google\.com/i.test(url || "");
}

function isDirectAudioUrl(url) {
  return /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(url || "");
}

function isDirectVideoUrl(url) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url || "");
}

function buildAudioHtml(url) {
  const clean = normalizeMediaUrl(url);

  if (isGoogleDriveUrl(clean)) {
    const preview = convertGoogleDriveToPreview(clean);
    if (!preview) return "";
    return `
      <iframe
        src="${preview}"
        class="tb-drive-audio"
        allow="autoplay">
      </iframe>
    `;
  }

  const direct = clean;
  return `
    <audio controls preload="metadata" class="tb-audio-player">
      <source src="${direct}" type="audio/mpeg">
      Trình duyệt không hỗ trợ audio.
    </audio>
  `;
}

function buildVideoHtml(url) {
  const clean = normalizeMediaUrl(url);

  if (isGoogleDriveUrl(clean)) {
    const preview = convertGoogleDriveToPreview(clean);
    if (!preview) return "";
    return `
      <iframe
        src="${preview}"
        class="tb-drive-video"
        allow="autoplay">
      </iframe>
    `;
  }

  const direct = clean;
  return `
    <video controls preload="metadata" class="tb-small-video">
      <source src="${direct}" type="video/mp4">
      Trình duyệt không hỗ trợ video.
    </video>
  `;
}

/* ================= SAFE HELPERS ================= */
function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripHtml(html = "") {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.innerText || div.textContent || "";
}

async function compressImage(file, scale = 0.25) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      const img = new Image();

      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressed = canvas.toDataURL("image/jpeg", 0.72);
        resolve(compressed);
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* =========================================
   MEDIA MODAL
========================================= */
function bindMediaModal() {
  const modal = document.getElementById("mediaModal");
  const closeBtn = document.getElementById("closeMediaModal");
  const previewBtn = document.getElementById("btnPreviewMedia");
  const insertBtn = document.getElementById("btnInsertMedia");
  const input = document.getElementById("mediaUrlInput");

  closeBtn?.addEventListener("click", closeMediaModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeMediaModal();
  });

  previewBtn?.addEventListener("click", previewMediaInModal);
  insertBtn?.addEventListener("click", insertMediaFromModal);

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      previewMediaInModal();
    }
  });
}

function openMediaModal(type) {
  currentMediaType = type;

  const modal = document.getElementById("mediaModal");
  const title = document.getElementById("mediaModalTitle");
  const input = document.getElementById("mediaUrlInput");
  const preview = document.getElementById("mediaPreviewBox");

  const titleMap = {
    audio: "🎧 Chèn MP3 / Audio",
    video: "🎬 Chèn MP4 / Video",
    youtube: "▶ Chèn YouTube"
  };

  title.textContent = titleMap[type] || "Chèn media";
  input.value = "";
  preview.innerHTML = `<div class="tb-modal-placeholder">Dán link rồi bấm “👁 Test” để xem trước</div>`;

  modal.classList.remove("hidden");
  setTimeout(() => input.focus(), 120);
}

function closeMediaModal() {
  const modal = document.getElementById("mediaModal");
  modal?.classList.add("hidden");
}

function previewMediaInModal() {
  const rawUrl = document.getElementById("mediaUrlInput").value.trim();
  const box = document.getElementById("mediaPreviewBox");

  if (!rawUrl) return showToast("⚠️ Chưa nhập link");
  if (!isValidMediaUrl(rawUrl)) return showToast("⚠️ Link không hợp lệ");

  let html = "";

  if (currentMediaType === "audio") {
    html = buildAudioHtml(rawUrl);
  }

  if (currentMediaType === "video") {
    html = buildVideoHtml(rawUrl);
  }

  if (currentMediaType === "youtube") {
    const embed = convertYoutubeToEmbed(rawUrl);
    if (!embed) return showToast("⚠️ Link YouTube không hợp lệ");

    html = `
      <iframe
        src="${embed}"
        class="tb-small-youtube"
        allowfullscreen>
      </iframe>
    `;
  }

  if (!html) return showToast("⚠️ Không thể preview media này");

  box.innerHTML = html;
}

function insertMediaFromModal() {
  const rawUrl = document.getElementById("mediaUrlInput").value.trim();

  if (!rawUrl) return showToast("⚠️ Chưa nhập link");
  if (!isValidMediaUrl(rawUrl)) return showToast("⚠️ Link không hợp lệ");

  let html = "";

  if (currentMediaType === "audio") {
    const media = buildAudioHtml(rawUrl);
    if (!media) return showToast("⚠️ Link audio không hợp lệ");

    html = `
      <p class="tb-media-center">
        ${media}
      </p>
    `;
  }

  if (currentMediaType === "video") {
    const media = buildVideoHtml(rawUrl);
    if (!media) return showToast("⚠️ Link video không hợp lệ");

    html = `
      <p class="tb-media-center">
        ${media}
      </p>
    `;
  }

  if (currentMediaType === "youtube") {
    const embed = convertYoutubeToEmbed(rawUrl);
    if (!embed) return showToast("⚠️ Link YouTube không hợp lệ");

    html = `
      <p class="tb-media-center">
        <iframe
          src="${embed}"
          class="tb-small-youtube"
          allowfullscreen>
        </iframe>
      </p>
    `;
  }

  insertHtmlAtCursor(html);
  
  closeMediaModal();
  showToast("✅ Đã chèn media vào đề");
}

function previewCurrentDraft() {
  const made = document.getElementById("test_made")?.value?.trim() || "Chưa đặt mã đề";
  const lop = document.getElementById("testLop")?.value || "";
  const noidung = document.getElementById("test_noidung")?.innerHTML?.trim() || "";

  if (!noidung || !stripHtml(noidung).trim()) {
    return showToast("⚠️ Chưa có nội dung để preview");
  }

  localStorage.setItem(
    "lesson_preview",
    JSON.stringify({
      name: `Đề TOEIC ${made}`,
      meta: `Lớp: ${lopNameMap[lop] || lop || ""}`,
      content: noidung
    })
  );

  window.open("/preview.html", "_blank");
}


function applyAIPushedToeic() {
  const raw = localStorage.getItem("teacher_ai_push_toeic");
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    if (!data) return;

    const title = document.getElementById("toeicTitle");
    const content = document.getElementById("toeicContent");
    const part = document.getElementById("toeicPart");

    if (title) title.value = data.title || "";
    if (content) content.value = data.content_text || "";
    if (part) part.value = data.toeicPart || "";

    localStorage.removeItem("teacher_ai_push_toeic");
    showToast?.("🤖 Đã nhận nội dung AI cho TOEIC", "success");
  } catch (e) {
    console.error("Lỗi applyAIPushedToeic:", e);
  }
}