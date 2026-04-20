import { readData } from "../../../scripts/services/firebaseService.js";

let teachersGlobal = {};
let lopDanhMucGlobal = {};
let kyThiDanhMucGlobal = {};
let monHocDanhMucGlobal = {};
let teacherExamMap = {};

export async function init() {
  const student = JSON.parse(localStorage.getItem("studentLogin"));
  if (!student) return;

  const tbody = document.getElementById("tongHopDiemBody");
  if (!tbody) return;

  try {
    const data = await readData(`users/students/${student.id}/kiemtra`);

    if (!data) {
      tbody.innerHTML = `
        <tr>
          <td colspan="15" style="text-align:center; padding:20px;">
            Chưa có dữ liệu điểm
          </td>
        </tr>
      `;
      return;
    }

    // ===== Load danh mục =====
    const teachers = await readData("users/teachers");
    const lopDanhMuc = await readData("config/danh_muc/lop");
    const kyThiDanhMuc = await readData("config/danh_muc/kythi");
    const monHocDanhMuc = await readData("config/danh_muc/monhoc");

    teachersGlobal = teachers || {};
    lopDanhMucGlobal = lopDanhMuc || {};
    kyThiDanhMucGlobal = kyThiDanhMuc || {};
    monHocDanhMucGlobal = monHocDanhMuc || {};

    // ===== Build map đề kiểm tra =====
    teacherExamMap = await buildTeacherExamMap(teachersGlobal);

    renderTongHopTable(data);

  } catch (err) {
    console.error("❌ Lỗi load tổng hợp điểm:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="15" style="text-align:center; color:red; padding:20px;">
          Lỗi tải dữ liệu điểm
        </td>
      </tr>
    `;
  }
}

/* ================= BUILD EXAM MAP ================= */

async function buildTeacherExamMap(teachers) {
  const examMap = {};
  if (!teachers) return examMap;

  const teacherIds = Object.keys(teachers);

  await Promise.all(
    teacherIds.map(async (gvId) => {
      try {
        const exams = await readData(`teacher/${gvId}/kiemtra`);
        if (!exams) return;

        Object.entries(exams).forEach(([examId, examData]) => {
          examMap[examId] = {
            ...examData,
            teacherId: gvId
          };
        });
      } catch (err) {
        console.warn(`⚠️ Không load được đề của giáo viên ${gvId}`, err);
      }
    })
  );

  return examMap;
}

/* ================= RENDER TABLE ================= */

function renderTongHopTable(data) {
  const tbody = document.getElementById("tongHopDiemBody");
  tbody.innerHTML = "";

  const list = Object.entries(data)
    .map(([baiId, item]) => ({ baiId, ...item }))
    .sort((a, b) => new Date(a.ngay) - new Date(b.ngay));

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="15" style="text-align:center; padding:20px;">
          Chưa có dữ liệu điểm
        </td>
      </tr>
    `;
    return;
  }

  // ===== Gom theo giáo viên + môn + lớp =====
  const grouped = {};

  list.forEach(item => {
    const examInfo = teacherExamMap?.[item.bai] || teacherExamMap?.[item.baiId] || {};

    const gvId = item.giao_vien || examInfo.teacherId || "";
    const monId = examInfo.monhoc || item.monhoc || "";
    const lopId = item.lop || examInfo.lop || "";

    const key = `${gvId}__${monId}__${lopId}`;

    if (!grouped[key]) {
      grouped[key] = {
        giao_vien: gvId,
        monhoc: monId,
        lop: lopId,

        hk1_15p: [],
        hk1_1tiet: [],
        hk1_giuaKy: null,
        hk1_cuoiKy: null,

        hk2_15p: [],
        hk2_1tiet: [],
        hk2_giuaKy: null,
        hk2_cuoiKy: null
      };
    }

    const row = grouped[key];
    const kyThiName = normalizeKyThiName(
      kyThiDanhMucGlobal?.[item.kythi]?.name ||
      kyThiDanhMucGlobal?.[examInfo.kythi]?.name ||
      ""
    );

    const diem = getFinalScore(item);

    if (diem === null) return;

    // ===== Phân loại điểm =====
    if (kyThiName.includes("15 phút")) {
      if (isHK2(item, examInfo)) row.hk2_15p.push(diem);
      else row.hk1_15p.push(diem);
    }
    else if (kyThiName.includes("1 tiết")) {
      if (isHK2(item, examInfo)) row.hk2_1tiet.push(diem);
      else row.hk1_1tiet.push(diem);
    }
    else if (kyThiName.includes("giữa kỳ i")) {
      row.hk1_giuaKy = diem;
    }
    else if (kyThiName.includes("học kỳ i")) {
      row.hk1_cuoiKy = diem;
    }
    else if (kyThiName.includes("giữa kỳ ii")) {
      row.hk2_giuaKy = diem;
    }
    else if (kyThiName.includes("học kỳ ii")) {
      row.hk2_cuoiKy = diem;
    }
  });

  const rows = Object.values(grouped);

  if (!rows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="15" style="text-align:center; padding:20px;">
          Chưa có dữ liệu điểm
        </td>
      </tr>
    `;
    return;
  }

  rows.forEach((row, index) => {
    const tenGV =
      teachersGlobal?.[row.giao_vien]?.profile?.ho_ten ||
      row.giao_vien ||
      "";

    const tenMon =
      monHocDanhMucGlobal?.[row.monhoc]?.name ||
      row.monhoc ||
      "";

    const tenLop =
      lopDanhMucGlobal?.[row.lop]?.name ||
      row.lop ||
      "";

    const tbhk1 = tinhTBHocKy(
      row.hk1_15p,
      row.hk1_1tiet,
      row.hk1_giuaKy,
      row.hk1_cuoiKy
    );

    const tbhk2 = tinhTBHocKy(
      row.hk2_15p,
      row.hk2_1tiet,
      row.hk2_giuaKy,
      row.hk2_cuoiKy
    );

    const tbNam = tinhTBNam(tbhk1, tbhk2);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${tenGV}</td>
      <td>${tenMon}</td>
      <td>${tenLop}</td>

      <td class="score-list-cell">${formatScoreList(row.hk1_15p)}</td>
      <td class="score-list-cell">${formatScoreList(row.hk1_1tiet)}</td>
      <td>${formatScoreOrDash(row.hk1_giuaKy)}</td>
      <td>${formatScoreOrDash(row.hk1_cuoiKy)}</td>
      <td class="score-avg">${formatScoreOrDash(tbhk1)}</td>

      <td class="score-list-cell">${formatScoreList(row.hk2_15p)}</td>
      <td class="score-list-cell">${formatScoreList(row.hk2_1tiet)}</td>
      <td>${formatScoreOrDash(row.hk2_giuaKy)}</td>
      <td>${formatScoreOrDash(row.hk2_cuoiKy)}</td>
      <td class="score-avg">${formatScoreOrDash(tbhk2)}</td>

      <td class="score-year">${formatScoreOrDash(tbNam)}</td>
    `;

    tbody.appendChild(tr);
  });
}

/* ================= TÍNH ĐIỂM ================= */

function tinhTBHocKy(arr15p = [], arr1Tiet = [], giuaKy = null, cuoiKy = null) {
  let tong = 0;
  let heSo = 0;

  arr15p.forEach(d => {
    if (isValidNumber(d)) {
      tong += Number(d);
      heSo += 1;
    }
  });

  arr1Tiet.forEach(d => {
    if (isValidNumber(d)) {
      tong += Number(d) * 2;
      heSo += 2;
    }
  });

  if (isValidNumber(giuaKy)) {
    tong += Number(giuaKy) * 3;
    heSo += 3;
  }

  if (isValidNumber(cuoiKy)) {
    tong += Number(cuoiKy) * 3;
    heSo += 3;
  }

  if (heSo === 0) return null;

  return round1(tong / heSo);
}

function tinhTBNam(tbhk1, tbhk2) {
  if (!isValidNumber(tbhk1) && !isValidNumber(tbhk2)) return null;
  if (isValidNumber(tbhk1) && !isValidNumber(tbhk2)) return round1(Number(tbhk1));
  if (!isValidNumber(tbhk1) && isValidNumber(tbhk2)) return round1(Number(tbhk2));

  return round1((Number(tbhk1) + Number(tbhk2) * 2) / 3);
}

/* ================= HELPERS ================= */

function getFinalScore(item) {
  if (isValidNumber(item.tong_diem)) return Number(item.tong_diem);
  if (isValidNumber(item.finalScore)) return Number(item.finalScore);
  if (isValidNumber(item.diem)) return Number(item.diem);
  return null;
}

function normalizeKyThiName(str = "") {
  return String(str).trim().toLowerCase();
}

function isHK2(item, examInfo) {
  const tenKyThi =
    kyThiDanhMucGlobal?.[item.kythi]?.name ||
    kyThiDanhMucGlobal?.[examInfo.kythi]?.name ||
    "";

  const s = normalizeKyThiName(tenKyThi);

  return s.includes("ii") || s.includes("2");
}

function isValidNumber(v) {
  return v !== undefined && v !== null && v !== "" && !isNaN(Number(v));
}

function round1(num) {
  return Math.round(Number(num) * 10) / 10;
}

function formatScore(value) {
  if (!isValidNumber(value)) return "";
  const num = Number(value);
  if (Number.isInteger(num)) return String(num);
  return num.toFixed(1).replace(".", ",");
}

function formatScoreOrDash(value) {
  return isValidNumber(value) ? formatScore(value) : '<span class="empty-score">---</span>';
}

function formatScoreList(arr = []) {
  if (!Array.isArray(arr) || !arr.length) {
    return '<span class="empty-score">---</span>';
  }
  return arr.map(x => formatScore(x)).join(", ");
}