import { readData, writeData } 
from "../../../scripts/services/firebaseService.js";

const teacherId = localStorage.getItem("teacher_id");
if (!teacherId) location.href = "../../index.html";

/* =========================
   DOM
========================= */
let btId, btMon, btLop, btTitle, btContent, btDate;
let btnImg, btnPdf, btnPreview, btnAdd, btnSave;
let btList;

let editingId = null;

/* =========================
   DOM READY
========================= */
function getDOM() {
  btId      = document.getElementById("btId");
  btMon     = document.getElementById("btMon");
  btLop     = document.getElementById("btLop");
  btTitle   = document.getElementById("btTitle");
  btContent = document.getElementById("btContent");
  btDate    = document.getElementById("btDate");

  btnImg     = document.getElementById("btnImg");
  btnPdf     = document.getElementById("btnPdf");
  btnPreview = document.getElementById("btnPreview");
  btnAdd     = document.getElementById("btnAdd");
  btnSave    = document.getElementById("btnSave");

  btList = document.getElementById("btList");

  /* ===== SCROLL CHO Ô HTML ===== */
  btContent.style.minHeight = "300px";
  btContent.style.maxHeight = "600px";
  btContent.style.overflowY = "auto";
  btContent.style.padding  = "12px";
  btContent.style.border   = "1px solid #ccc";
}

/* =========================
   LOAD MÔN
========================= */
async function loadMonHoc() {
  const data = await readData("config/danh_muc/monhoc");
  btMon.innerHTML = `<option value="">-- Chọn môn --</option>`;
  if (!data) return;

  Object.entries(data).forEach(([id, item]) => {
    btMon.innerHTML += `<option value="${id}">${item.name}</option>`;
  });
}

/* =========================
   LOAD LỚP
========================= */
async function loadLop() {
  const data = await readData("config/danh_muc/lop");
  btLop.innerHTML = `<option value="">-- Chọn lớp --</option>`;
  if (!data) return;

  Object.entries(data).forEach(([id, item]) => {
    btLop.innerHTML += `<option value="${id}">${item.name}</option>`;
  });
}

/* =========================
   COLLECT DATA
========================= */
function collectData() {
  if (!btMon.value || !btLop.value || !btTitle.value) {
    showToast("Thiếu thông tin", "error");
    return null;
  }

  return {
    subjectId: btMon.value,
    classId: btLop.value,
    title: btTitle.value,
    content_html: btContent.innerHTML,
    created_at: btDate?.value
      ? new Date(btDate.value).getTime()
      : Date.now()
  };
}

/* =========================
   ADD
========================= */
async function themBaiTap() {
  const data = collectData();
  if (!data) return;

  const id = "bt_" + Date.now();
  await writeData(`teacher/${teacherId}/baitap/${id}`, {
    teacherId,
    ...data
  });

  showToast("Đã thêm bài tập");
  clearForm();
  loadList();
}

/* =========================
   SAVE
========================= */
async function luuBaiTap() {
  if (!editingId) {
    showToast("Chưa chọn bài", "error");
    return;
  }

  const data = collectData();
  if (!data) return;

  await writeData(`teacher/${teacherId}/baitap/${editingId}`, {
    teacherId,
    ...data
  });

  showToast("Đã cập nhật");
  clearForm();
  loadList();
}

/* =========================
   LOAD LIST
========================= */
async function loadList() {
  const data = await readData(`teacher/${teacherId}/baitap`);
  btList.innerHTML = "";
  if (!data) return;

  let i = 1;
  Object.entries(data).forEach(([id, item]) => {
    if (btMon.value && item.subjectId !== btMon.value) return;
    if (btLop.value && item.classId !== btLop.value) return;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i++}</td>
      <td>${item.title}</td>
      <td>${new Date(item.created_at).toLocaleDateString()}</td>
      <td><button class="btnDelete" data-id="${id}">❌Xóa</button></td>
    `;

    tr.onclick = () => chonBaiTap(id);
    btList.appendChild(tr);
  });

  document.querySelectorAll(".btnDelete").forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      xoaBaiTap(btn.dataset.id);
    };
  });
}

/* =========================
   CHỌN
========================= */
async function chonBaiTap(id) {
  const data = await readData(`teacher/${teacherId}/baitap/${id}`);
  if (!data) return;

  editingId = id;
  btId.value = teacherId;
  btMon.value = data.subjectId;
  btLop.value = data.classId;
  btTitle.value = data.title;
  btContent.innerHTML = data.content_html || "";

  if (btDate) {
    btDate.value = new Date(data.created_at).toISOString().split("T")[0];
  }

  showToast("Đã load bài");
}

/* =========================
   DELETE
========================= */
async function xoaBaiTap(id) {
  if (!confirm("Xóa bài này?")) return;
  await writeData(`teacher/${teacherId}/baitap/${id}`, null);
  showToast("Đã xóa");
  loadList();
}

/* =========================
   CLEAR
========================= */
function clearForm() {
  editingId = null;
  btTitle.value = "";
  btContent.innerHTML = "";
  if (btDate) btDate.value = "";
}

/* =========================
  VỊ TRÍ CON TRỎ
========================= */
function insertAtCursor(html) {
  btContent.focus();
  document.execCommand("insertHTML", false, html);
}

/* =========================
   CHÈN ẢNH
========================= */
window.insertImage = function () {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.click();

  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      insertAtCursor(`
        <img src="${reader.result}"
          style="max-width:100%;display:block;margin:16px auto;">
      `);
    };
    reader.readAsDataURL(file);
  };
};

/* =========================
   CHÈN PDF
========================= */
window.insertPDF = function () {
  const url = prompt("Dán link PDF Google Drive:");
  if (!url) return;

  const m = url.match(/\/d\/([^/]+)/);
  if (!m) return alert("Link sai");

  insertAtCursor(`
    <iframe 
      src="https://drive.google.com/file/d/${m[1]}/preview"
      style="width:100%;height:600px;border:none;margin:16px 0">
    </iframe>
  `);
};

/* =========================
  CHÈN PPTX / SLIDES / FLIPHTML
========================= */

window.insertPPT = function () {
  const url = prompt("Dán link PPTX / Google Slides / FlipHTML5 / HTML:");
  if (!url) return;

  let iframe = "";

  // Google Slides
  if (url.includes("docs.google.com/presentation")) {
    const m = url.match(/\/d\/([^/]+)/);
    if (!m) return alert("Link Slides sai");

    iframe = `
      <iframe 
        src="https://docs.google.com/presentation/d/${m[1]}/embed"
        style="width:100%;height:600px;border:none">
      </iframe>
    `;
  }

  // Drive file (PPTX / PDF / DOC)
  else if (url.includes("drive.google.com/file")) {
    const m = url.match(/\/d\/([^/]+)/);
    if (!m) return alert("Link Drive sai");

    const fileUrl =
      `https://drive.google.com/uc?id=${m[1]}&export=download`;

    iframe = `
      <iframe 
        src="https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true"
        style="width:100%;height:600px;border:none">
      </iframe>
    `;
  }

  // Link ngoài: FlipHTML5 / HTML / iframe
  else {
    insertAtCursor(url);
    return;
  }

  insertAtCursor(iframe);
};


/* =========================
  PREVIEW
========================= */
window.previewContent = function () {
  if (!btContent.innerHTML.trim()) {
    alert("Chưa có nội dung");
    return;
  }

  localStorage.setItem(
    "lesson_preview",
    JSON.stringify({
      name: btTitle.value || "Bài tập",
      meta:
        `Môn: ${btMon.value || ""} | ` +
        `Lớp: ${btLop.value || ""} | ` +
        `Ngày: ${btDate?.value || ""}`,
      content: btContent.innerHTML
    })
  );

  window.open("/preview.html", "_blank");
};



/* =========================
   INIT
========================= */
export async function init() {
  getDOM();

  btId.value = teacherId;
  await loadMonHoc();
  await loadLop();
  await loadList();
applyAIPushedExercise();

  btMon.onchange = loadList;
  btLop.onchange = loadList;

  btnImg.onclick = insertImage;
  btnPdf.onclick = insertPDF;
  btnPreview.onclick = previewContent;
  btnAdd.onclick = themBaiTap;
  btnSave.onclick = luuBaiTap;
}

/* =========================
   AI PUSH → BÀI TẬP
========================= */
function applyAIPushedExercise() {
  const raw = localStorage.getItem("teacher_ai_push_baitap");
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    if (!data) return;

    const tenBai = document.getElementById("btTitle");
    const noiDung = document.getElementById("btContent");

    if (tenBai) {
      tenBai.value = data.title || "";
    }

    if (noiDung) {
      if (data.content_html && data.content_html.trim()) {
        noiDung.innerHTML = data.content_html;
      } else {
        noiDung.innerHTML = (data.content_text || "").replace(/\n/g, "<br>");
      }
    }

    localStorage.removeItem("teacher_ai_push_baitap");
    showToast?.("🤖 Đã nhận nội dung AI cho Bài tập", "success");

    window.scrollTo({ top: 0, behavior: "smooth" });

  } catch (e) {
    console.error("Lỗi applyAIPushedExercise:", e);
  }
}

function selectOptionByText(selectEl, text = "") {
  if (!selectEl || !text) return;

  const keyword = text.trim().toLowerCase();

  const matched = [...selectEl.options].find(opt =>
    opt.textContent.trim().toLowerCase() === keyword
  );

  if (matched) {
    selectEl.value = matched.value;
    selectEl.dispatchEvent(new Event("change"));
  }
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
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}