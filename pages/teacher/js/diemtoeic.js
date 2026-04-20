import { readData } from "../../../scripts/services/firebaseService.js";

console.log("🔥 diemtoeic.js LOADED");

const teacherId = localStorage.getItem("teacher_id");

let dsLop = {};
let teacherTests = {};
let students = {};
let teacherName = "";
let currentRows = [];

/* =========================
   INIT
========================= */
export async function init() {
  console.log("🚀 init diemtoeic");

  const lopSelect = document.getElementById("lopSelect");
  const deSelect = document.getElementById("deSelect");
  const btnExportExcel = document.getElementById("btnExportExcel");

  if (!lopSelect || !deSelect) {
    console.error("❌ Không tìm thấy #lopSelect hoặc #deSelect");
    return;
  }

  await loadInitialData();
  renderLopDropdown();
  renderDeDropdown();

  function handleFilterChange() {
    const lopId = lopSelect.value;
    const deId = deSelect.value;

    renderBangDiem(lopId, deId);
  }

  lopSelect.addEventListener("change", handleFilterChange);
  deSelect.addEventListener("change", handleFilterChange);

  btnExportExcel?.addEventListener("click", exportExcel);

  renderBangDiem("", "");
}

/* =========================
   LOAD DATA
========================= */
async function loadInitialData() {
  try {
    const [lopData, teacherTestData, studentData, teacherProfile] = await Promise.all([
      readData("config/danh_muc/lop"),
      readData(`teacher/${teacherId}/test`),
      readData("users/students"),
      readData(`users/teachers/${teacherId}/profile`)
    ]);

    dsLop = lopData || {};
    teacherTests = teacherTestData || {};
    students = studentData || {};
    teacherName = teacherProfile?.ho_ten || teacherProfile?.name || teacherId || "";

    console.log("✅ dsLop:", dsLop);
    console.log("✅ teacherTests:", teacherTests);
    console.log("✅ students:", students);
    console.log("✅ teacherName:", teacherName);
  } catch (err) {
    console.error("❌ loadInitialData error:", err);
    renderEmpty("Lỗi tải dữ liệu");
  }
}

/* =========================
   DROPDOWN LỚP
========================= */
function renderLopDropdown() {
  const lopSelect = document.getElementById("lopSelect");
  if (!lopSelect) return;

  let html = `<option value="">-- Tất cả lớp --</option>`;

  Object.entries(dsLop).forEach(([lopId, lop]) => {
    html += `<option value="${lopId}">${lop.name || lopId}</option>`;
  });

  lopSelect.innerHTML = html;
}

/* =========================
   DROPDOWN ĐỀ
========================= */
function renderDeDropdown() {
  const deSelect = document.getElementById("deSelect");
  if (!deSelect) return;

  let html = `<option value="">-- Tất cả đề --</option>`;

  Object.entries(teacherTests).forEach(([testId, test]) => {
    const made = test?.made || "(Không mã đề)";
    html += `<option value="${testId}">Đề ${made}</option>`;
  });

  deSelect.innerHTML = html;
}

/* =========================
   RENDER TABLE
========================= */
function renderBangDiem(filterLopId = "", filterDeId = "") {
  const rows = [];
  let stt = 1;

  Object.entries(students).forEach(([studentId, student]) => {
    const profile = student.profile || {};
    const studentName = profile.ho_ten || student.auth?.username || "Không rõ tên";
    const studentLop = profile.lop || "";
    const studentTests = student.test || {};

    Object.entries(studentTests).forEach(([testId, baiLam]) => {
      // chỉ lấy bài test của giáo viên hiện tại
      if ((baiLam.giao_vien || "") !== teacherId) return;

      const testInfo = teacherTests[testId];
      if (!testInfo) return;

      const lopId = testInfo.lop || "";
      const made = testInfo.made || "";

      // lọc lớp
      if (filterLopId && lopId !== filterLopId) return;

      // lọc đề
      if (filterDeId && testId !== filterDeId) return;

      const diem = getToeicScore(baiLam);
      const xepLoai = getToeicRank(diem);
      const ngayTest = formatDate(baiLam.ngay);

      rows.push({
        stt: stt++,
        studentId,
        hoTen: studentName,
        lopName: dsLop[lopId]?.name || lopId || "",
        monHocName: "TOEIC",
        giaoVien: teacherName,
        deSo: made,
        diem: formatNumberOnly(diem),
        xepLoai,
        ngayTest
      });
    });
  });

  // sort mới nhất trước
  rows.sort((a, b) => {
    const da = parseDateValue(a.ngayTest);
    const db = parseDateValue(b.ngayTest);
    return db - da;
  });

  // cập nhật lại STT sau sort
  rows.forEach((r, i) => r.stt = i + 1);

  currentRows = rows;
  renderRows(rows);
}

/* =========================
   SCORE TOEIC
========================= */
function getToeicScore(baiLam) {
  if (isValidNumber(baiLam.diem)) return Number(baiLam.diem);
  if (isValidNumber(baiLam.tong_diem)) return Number(baiLam.tong_diem);
  if (isValidNumber(baiLam.finalScore)) return Number(baiLam.finalScore);
  return 0;
}

function getToeicRank(score) {
  const s = Number(score || 0);

  if (s >= 9) return "Xuất sắc";
  if (s >= 8) return "Giỏi";
  if (s >= 6.5) return "Khá";
  if (s >= 5) return "Trung bình";
  return "Yếu";
}

/* =========================
   RENDER ROWS
========================= */
function renderRows(rows) {
  const bangDiemBody = document.getElementById("bangDiemBody");
  if (!bangDiemBody) return;

  if (!rows.length) {
    renderEmpty("Không có dữ liệu điểm TOEIC");
    return;
  }

  bangDiemBody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.stt}</td>
      <td class="student-name">${r.hoTen}</td>
      <td>${r.lopName}</td>
      <td>${r.monHocName}</td>
      <td>${r.giaoVien}</td>
      <td><b>${r.deSo}</b></td>
      <td class="score-cell"><b>${r.diem}</b></td>
      <td>${r.xepLoai}</td>
      <td>${r.ngayTest}</td>
    </tr>
  `).join("");
}

function renderEmpty(message) {
  const bangDiemBody = document.getElementById("bangDiemBody");
  if (!bangDiemBody) return;

  bangDiemBody.innerHTML = `
    <tr>
      <td colspan="9" style="text-align:center; padding:20px;">${message}</td>
    </tr>
  `;
}

/* =========================
   HELPERS
========================= */
function isValidNumber(v) {
  return v !== undefined && v !== null && v !== "" && !isNaN(Number(v));
}

function formatNumberOnly(value) {
  const num = Number(value || 0);
  if (Number.isInteger(num)) return String(num);
  return String(num).replace(".", ",");
}

function formatDate(iso) {
  if (!iso) return "";

  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function parseDateValue(str) {
  if (!str) return 0;

  const parts = str.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (!parts) return 0;

  const [, dd, mm, yyyy, hh, mi] = parts;
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:00`).getTime();
}

/* =========================
   EXPORT EXCEL
========================= */
function exportExcel() {
  if (!currentRows.length) {
    alert("Không có dữ liệu để xuất Excel!");
    return;
  }

  if (typeof XLSX === "undefined") {
    alert("Chưa load thư viện XLSX!\nHãy thêm script XLSX vào trang giáo viên.");
    return;
  }

  const exportData = currentRows.map(r => ({
    "STT": r.stt,
    "TÊN SINH VIÊN": r.hoTen,
    "LỚP": r.lopName,
    "MÔN HỌC": r.monHocName,
    "GIÁO VIÊN": r.giaoVien,
    "ĐỀ SỐ": r.deSo,
    "ĐIỂM": r.diem,
    "XẾP LOẠI": r.xepLoai,
    "NGÀY TEST": r.ngayTest
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BangDiemTOEIC");

  const lopSelect = document.getElementById("lopSelect");
  const deSelect = document.getElementById("deSelect");

  const lopName = dsLop[lopSelect?.value]?.name || "TatCaLop";
  const deName = teacherTests[deSelect?.value]?.made || "TatCaDe";

  XLSX.writeFile(wb, `Bang_diem_TOEIC_${lopName}_${deName}.xlsx`);
}