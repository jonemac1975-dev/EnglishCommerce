import { readData, writeData } 
from "../../../scripts/services/firebaseService.js";

/* ================= CONST ================= */
const teacherId = localStorage.getItem("teacher_id");
if (!teacherId) location.href = "../../index.html";

let currentEditId = null;
let essayBlocks = [];

/* ================= DATE TIME HELPER ================= */
function formatDateTimeLocal(ts) {
  if (!ts) return "";

  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function parseExamDateTime(datetimeLocalValue) {
  if (!datetimeLocalValue) {
    return { text: "", iso: "", ts: 0 };
  }

  const d = new Date(datetimeLocalValue);
  if (isNaN(d.getTime())) {
    return { text: "", iso: "", ts: 0 };
  }

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return {
    text: `${dd}/${mm}/${yyyy} ${hh}:${mi}`,
    iso: datetimeLocalValue,
    ts: d.getTime()
  };
}

/* ================= HELPER INPUT ĐIỂM ================= */
function getDiemInputs() {
  return {
    diemTNInput: document.getElementById("kt_diemTN"),
    diemTLInput: document.getElementById("kt_diemTL")
  };
}

/* ================= INIT ================= */
export async function init() {
  await loadTeacherName();
  await loadDanhMuc();
  await loadDanhSach();
applyAIPushedExam();

  initEditor();
  initEssayBuilder();

  kt_add.onclick = addBaiKiemTra;
  kt_save.onclick = saveBaiKiemTra;

  document.getElementById("kt_examType").onchange = toggleExamTypeUI;
  toggleExamTypeUI();
}

/* ================= LOAD TEACHER ================= */
async function loadTeacherName() {
  const d = await readData(`teacher/${teacherId}`);
  kt_giaovien.value = d?.hoten || d?.profile?.hoten || teacherId;
}

/* ================= DANH MỤC ================= */
async function loadDanhMuc() {
  await loadSelect("monhoc", "kt_monhoc");
  await loadSelect("lop", "kt_lop");
  await loadSelect("kythi", "kt_kythi");
}

async function loadSelect(dm, selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;

  sel.innerHTML = `<option value="">-- Chọn --</option>`;

  const data = await readData(`config/danh_muc/${dm}`);
  if (!data) return;

  Object.entries(data).forEach(([id, item]) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = item.name || id;
    sel.appendChild(opt);
  });
}

/* ================= ADD ================= */
async function addBaiKiemTra() {
  const data = getFormData();
  if (!data) return;

  const id = "kt_" + Date.now();

  await writeData(`teacher/${teacherId}/kiemtra/${id}`, {
    ...data,
    createdAt: Date.now()
  });

  showToast("Đã thêm bài kiểm tra");
  clearForm();
  loadDanhSach();
}

/* ================= SAVE ================= */
async function saveBaiKiemTra() {
  if (!currentEditId) {
    showToast("Chưa chọn bài để sửa", "error");
    return;
  }

  const data = getFormData();
  if (!data) return;

  const oldCreatedAt =
    await readData(`teacher/${teacherId}/kiemtra/${currentEditId}/createdAt`);

  await writeData(`teacher/${teacherId}/kiemtra/${currentEditId}`, {
    ...data,
    createdAt: oldCreatedAt || Date.now()
  });

  showToast("Đã lưu thay đổi");
  clearForm();
  loadDanhSach();
}

/* ================= LIST ================= */
async function loadDanhSach() {
  const tbody = kt_list;
  if (!tbody) return;

  tbody.innerHTML = "";

  const data = await readData(`teacher/${teacherId}/kiemtra`);
  if (!data) return;

  let i = 1;

  Object.entries(data)
    .sort((a, b) => (b[1]?.createdAt || 0) - (a[1]?.createdAt || 0))
    .forEach(([id, item]) => {
      const loai =
        item.examType === "mixed" ? "Tổng hợp" : "Trắc nghiệm";

      const diemTN = Number(item.diemTN ?? 0);
      const diemTL = Number(item.diemTL ?? 0);
      const coCauDiem = `TN: ${diemTN} | TL: ${diemTL}`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i++}</td>
        <td>${item.tieude || ""}</td>
        <td>${item.examStartText || ""}</td>
        <td>${loai}</td>
        <td>${coCauDiem}</td>
        <td>
          <button onclick="window.editKT('${id}')">Sửa</button>
          <button onclick="window.deleteKT('${id}')">Xóa</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
}

/* ================= EDIT / DELETE ================= */
window.editKT = async (id) => {
  const d = await readData(`teacher/${teacherId}/kiemtra/${id}`);
  if (!d) return;

  currentEditId = id;

  const { diemTNInput, diemTLInput } = getDiemInputs();

  kt_monhoc.value = d.monhoc || "";
  kt_lop.value = d.lop || "";
  kt_kythi.value = d.kythi || "";
  kt_tieude.value = d.tieude || "";
  kt_ngay.value = d.ngay || "";
  kt_examType.value = d.examType || "multiple_choice";
  kt_noidung.innerHTML = d.noidung || "";

  const examTimeInput = document.getElementById("kt_examTime");
  if (examTimeInput) {
    examTimeInput.value =
      d.examStartISO || (d.examStartAt ? formatDateTimeLocal(d.examStartAt) : "");
  }

  if (diemTNInput) {
    diemTNInput.value = d.diemTN ?? (d.examType === "mixed" ? 5 : 10);
  }

  if (diemTLInput) {
    diemTLInput.value = d.diemTL ?? (d.examType === "mixed" ? 5 : 0);
  }

  essayBlocks = (d.essays || []).map((html, i) => ({
    id: "essay_" + i + "_" + Date.now(),
    content: html
  }));

  toggleExamTypeUI();
  renderEssayBlocks();
};

window.deleteKT = async (id) => {
  if (!confirm("Xóa bài này?")) return;

  await writeData(`teacher/${teacherId}/kiemtra/${id}`, null);

  showToast("Đã xóa bài", "error");
  clearForm();
  loadDanhSach();
};

/* ================= FORM ================= */
function getFormData() {
  const examType = kt_examType.value;
  const { diemTNInput, diemTLInput } = getDiemInputs();

  const examTimeRaw = document.getElementById("kt_examTime")?.value || "";
  const examTimeData = parseExamDateTime(examTimeRaw);

  const monhoc = kt_monhoc.value;
  const lop = kt_lop.value;
  const kythi = kt_kythi.value;
  const tieude = kt_tieude.value.trim();
  const ngay = kt_ngay.value.trim();
  const noidung = kt_noidung.innerHTML.trim();

  if (!tieude) {
    showToast("Chưa nhập tiêu đề", "error");
    return null;
  }

  if (!monhoc || !lop || !kythi) {
    showToast("Vui lòng chọn đủ Môn học / Lớp / Kỳ kiểm tra", "error");
    return null;
  }

  if (!examTimeRaw || !examTimeData.ts) {
    showToast("Chưa chọn ngày giờ kiểm tra", "error");
    return null;
  }

  if (!noidung) {
    showToast("Chưa có nội dung phần trắc nghiệm", "error");
    return null;
  }

  let diemTN = Number(diemTNInput?.value || 0);
  let diemTL = Number(diemTLInput?.value || 0);

  // ===== Chuẩn hóa theo loại đề =====
  if (examType === "multiple_choice") {
    diemTL = 0;
    if (diemTN <= 0) diemTN = 10;
  }

  if (examType === "mixed") {
    if (diemTN < 0 || diemTL < 0) {
      showToast("Điểm TN / TL không được âm", "error");
      return null;
    }

    if (diemTN === 0 && diemTL === 0) {
      showToast("Phải nhập ít nhất 1 phần điểm", "error");
      return null;
    }
  }

  if (diemTN + diemTL > 10) {
    showToast("Tổng điểm TN + TL không được vượt quá 10", "error");
    return null;
  }

  const tongDiem = diemTN + diemTL;
  if (tongDiem !== 10) {
    const ok = confirm(
      `Tổng điểm hiện tại là ${tongDiem} (không phải 10).\nBạn vẫn muốn lưu đề này?`
    );
    if (!ok) return null;
  }

  return {
    monhoc,
    lop,
    kythi,
    tieude,
    ngay,

    // ===== THỜI GIAN MỞ ĐỀ (CHUẨN MỚI) =====
    examStartAt: examTimeData.ts,
    examStartISO: examTimeData.iso,
    examStartText: examTimeData.text,

    examType,
    diemTN,
    diemTL,
    noidung,
    essays:
      examType === "mixed"
        ? essayBlocks.map(x => x.content).filter(x => x.trim() !== "")
        : [],
    updatedAt: Date.now()
  };
}

/* ================= CLEAR FORM ================= */
function clearForm() {
  const { diemTNInput, diemTLInput } = getDiemInputs();

  currentEditId = null;
  kt_monhoc.value = "";
  kt_lop.value = "";
  kt_kythi.value = "";
  kt_tieude.value = "";
  kt_ngay.value = "";
  kt_examType.value = "multiple_choice";
  kt_noidung.innerHTML = "";

  const examTimeInput = document.getElementById("kt_examTime");
  if (examTimeInput) examTimeInput.value = "";

  if (diemTNInput) diemTNInput.value = 10;
  if (diemTLInput) diemTLInput.value = 0;

  essayBlocks = [];

  toggleExamTypeUI();
  renderEssayBlocks();
}

/* ================= EXAM TYPE ================= */
function toggleExamTypeUI() {
  const { diemTNInput, diemTLInput } = getDiemInputs();

  const type = document.getElementById("kt_examType").value;
  const essayWrap = document.getElementById("essay_wrap");

  if (!essayWrap) return;

  essayWrap.style.display = type === "mixed" ? "block" : "none";

  if (diemTNInput && diemTLInput && !currentEditId) {
    if (type === "multiple_choice") {
      diemTNInput.value = 10;
      diemTLInput.value = 0;
    } else if (type === "mixed") {
      diemTNInput.value = 5;
      diemTLInput.value = 5;
    }
  }
}

/* ================= EDITOR ================= */
function initEditor() {
  const content = kt_noidung;
  const fileInput = document.getElementById("fileInput");

  btnChooseFile.onclick = () => fileInput.click();

  function insertAtCursor(html) {
    content.focus();
    document.execCommand("insertHTML", false, html);
  }

  fileInput.onchange = () => {
    const f = fileInput.files[0];
    if (!f) return;

    const r = new FileReader();
    r.onload = e => {
      let html = "";

      if (f.type.startsWith("image/")) {
        html = `<img src="${e.target.result}" style="max-width:70%;display:block;margin:16px auto">`;
      } else if (f.type.startsWith("audio/")) {
        html = `<audio controls src="${e.target.result}" style="width:70%;display:block;margin:16px auto"></audio>`;
      } else if (f.type.startsWith("video/")) {
        html = `<video controls src="${e.target.result}" style="width:70%;display:block;margin:16px auto"></video>`;
      } else {
        return alert("Chỉ hỗ trợ ảnh / audio / video");
      }

      insertAtCursor(html);
      fileInput.value = "";
    };

    r.readAsDataURL(f);
  };

  btnAudio.onclick = () => insertDrive("audio", 60);
  btnMp4.onclick = () => insertDrive("video", 340);

  function insertDrive(type, h) {
    const url = prompt(`Dán link ${type.toUpperCase()} Google Drive`);
    if (!url) return;

    const m = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
    if (!m) return alert("Link sai");

    insertAtCursor(`
      <iframe src="https://drive.google.com/file/d/${m[1]}/preview"
      style="width:70%;height:${h}px;display:block;margin:16px auto;border:none"></iframe>
    `);
  }

  btnYoutube.onclick = () => {
    const url = prompt("Link YouTube");
    if (!url) return;

    const id = url.includes("v=")
      ? url.split("v=")[1].split("&")[0]
      : url.split("/").pop();

    insertAtCursor(`
      <iframe src="https://www.youtube.com/embed/${id}"
      style="width:70%;height:360px;display:block;margin:16px auto"
      allowfullscreen></iframe>
    `);
  };

  btnPdf.onclick = () => {
    const url = prompt("Link PDF Drive");
    const m = url?.match(/\/d\/([^/]+)/);
    if (!m) return;

    insertAtCursor(`
      <iframe src="https://drive.google.com/file/d/${m[1]}/preview"
      style="width:100%;height:600px;border:none;margin:16px 0"></iframe>
    `);
  };

  btnPptx.onclick = () => {
    const url = prompt("Link PPT / HTML / Flip");
    if (url) insertAtCursor(url);
  };

  btnPreview.onclick = () => {
    if (!content.innerHTML.trim()) {
      return showToast("Chưa có nội dung", "error");
    }

    localStorage.setItem("lesson_preview", JSON.stringify({
      name: kt_tieude.value || "Bài kiểm tra",
      meta: `Môn: ${kt_monhoc.value} | Lớp: ${kt_lop.value}`,
      content: content.innerHTML
    }));

    window.open("/preview.html", "_blank");
  };
}

/* ================= ESSAY BUILDER ================= */
function initEssayBuilder() {
  const btn = document.getElementById("btnAddEssayHtml");
  if (!btn) return;

  btn.onclick = () => {
    essayBlocks.push({
      id: "essay_" + Date.now(),
      content: ""
    });
    renderEssayBlocks();
  };

  renderEssayBlocks();
}

function renderEssayBlocks() {
  const wrap = document.getElementById("essay_html_list");
  if (!wrap) return;

  wrap.innerHTML = "";

  essayBlocks.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "essay-card";
    div.innerHTML = `
      <div class="essay-head">
        <h4>Câu tự luận ${index + 1}</h4>
        <button type="button" onclick="window.deleteEssayBlock('${item.id}')">🗑 Xóa</button>
      </div>

      <div class="essay-note">Dán nội dung câu tự luận từ Word vào đây:</div>

      <div class="essay-editor"
           contenteditable="true"
           oninput="window.updateEssayBlock('${item.id}', this.innerHTML)">${item.content || ""}</div>
    `;
    wrap.appendChild(div);
  });
}

window.updateEssayBlock = (id, html) => {
  const item = essayBlocks.find(x => x.id === id);
  if (!item) return;
  item.content = html;
};

window.deleteEssayBlock = (id) => {
  essayBlocks = essayBlocks.filter(x => x.id !== id);
  renderEssayBlocks();
};



function applyAIPushedExam() {
  const raw = localStorage.getItem("teacher_ai_push_kiemtra");
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    if (!data) return;

    // ==== ĐỔI ID CHO KHỚP FILE KIỂM TRA CỦA ANH ====
    const tenDe = document.getElementById("ktTenDe");
    const noiDung = document.getElementById("ktNoiDung");
    const monHoc = document.getElementById("ktMonHoc");
    const thoiGian = document.getElementById("ktThoiGian");

    if (tenDe) tenDe.value = data.title || "";
    if (noiDung) noiDung.value = data.content_text || "";
    if (thoiGian) thoiGian.value = data.thoiGian || "";

    selectOptionByText(monHoc, data.subjectText);

    localStorage.removeItem("teacher_ai_push_kiemtra");
    showToast?.("🤖 Đã nhận nội dung AI cho Đề kiểm tra", "success");
  } catch (e) {
    console.error("Lỗi applyAIPushedExam:", e);
  }
}

function selectOptionByText(selectEl, text = "") {
  if (!selectEl || !text) return;

  const keyword = text.trim().toLowerCase();

  [...selectEl.options].forEach(opt => {
    if (opt.textContent.trim().toLowerCase() === keyword) {
      selectEl.value = opt.value;
    }
  });
}