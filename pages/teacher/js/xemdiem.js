import { readData } from "../../../scripts/services/firebaseService.js";



const teacherId = localStorage.getItem("teacher_id");

let dsLop = {};
let dsKyThi = {};
let dsMonHoc = {};
let teacherKiemTra = {};
let students = {};
let currentRows = [];

/* =========================
   INIT
========================= */
export async function init() {
  
  const lopSelect = document.getElementById("lopSelect");
  const monhocSelect = document.getElementById("monhocSelect");


document
  .getElementById("btnExportExcelPro")
  ?.addEventListener(
    "click",
    exportExcelPro
  );

  if (!lopSelect || !monhocSelect) {
    console.error("❌ Không tìm thấy #lopSelect hoặc #monhocSelect");
    return;
  }

  await loadInitialData();
  renderLopDropdown();
  renderMonHocDropdown();

  function handleFilterChange() {
    const lopId = lopSelect.value;
    const monhocId = monhocSelect.value;

    if (!lopId || !monhocId) {
      renderEmpty("Chọn Lớp và Môn học để xem bảng điểm");
      return;
    }

    renderBangDiem(lopId, monhocId);
  }

  lopSelect.addEventListener("change", handleFilterChange);
  monhocSelect.addEventListener("change", handleFilterChange);

  renderEmpty("Chọn Lớp và Môn học để xem bảng điểm");
}

/* =========================
   LOAD DATA
========================= */
async function loadInitialData() {
  try {
    const [lopData, kyThiData, monHocData, teacherExamData, studentData] = await Promise.all([
      readData("config/danh_muc/lop"),
      readData("config/danh_muc/kythi"),
      readData("config/danh_muc/monhoc"),
      readData(`teacher/${teacherId}/kiemtra`),
      readData("users/students")
    ]);

    dsLop = lopData || {};
    dsKyThi = kyThiData || {};
    dsMonHoc = monHocData || {};
    teacherKiemTra = teacherExamData || {};
    students = studentData || {};

    
  } catch (err) {
    console.error("❌ loadInitialData error:", err);
    renderEmpty("Lỗi tải dữ liệu");
  }
}

/* =========================
   DROPDOWN
========================= */
function renderLopDropdown() {
  const lopSelect = document.getElementById("lopSelect");
  if (!lopSelect) return;

  let html = `<option value="">-- Chọn lớp --</option>`;

  Object.entries(dsLop).forEach(([lopId, lop]) => {
    html += `<option value="${lopId}">${lop.name || "Không tên lớp"}</option>`;
  });

  lopSelect.innerHTML = html;
}

function renderMonHocDropdown() {
  const monhocSelect = document.getElementById("monhocSelect");
  if (!monhocSelect) return;

  let html = `<option value="">-- Chọn môn học --</option>`;

  Object.entries(dsMonHoc).forEach(([monhocId, monhoc]) => {
    html += `<option value="${monhocId}">${monhoc.name || "Không tên môn"}</option>`;
  });

  monhocSelect.innerHTML = html;
}

/* =========================
   RENDER TABLE
========================= */
function renderBangDiem(lopId, monhocId) {
  const rows = [];
  let stt = 1;

  Object.entries(students).forEach(([studentId, student]) => {
    const profile = student.profile || {};
    const studentLop = profile.lop || "";

    if (studentLop !== lopId) return;

    const hoTen = profile.ho_ten || student.auth?.username || "Không rõ tên";
    const lopName = dsLop[studentLop]?.name || "";
    const monHocName = dsMonHoc[monhocId]?.name || "";

    const scoreMap = extractStudentScores(student, lopId, monhocId);

    const tbhk1 = calcTBHK(scoreMap.hk1);
    const tbhk2 = calcTBHK(scoreMap.hk2);
    const tbNam = calcTBNam(tbhk1, tbhk2);

    rows.push({
      stt: stt++,
      studentId,
      hoTen,
      lopName,
      monHocName,

      hk1_tx: formatScoreList(scoreMap.hk1.tx),
      hk1_gk: formatScoreSingle(scoreMap.hk1["giuaky"]),
      hk1_hk: formatScoreSingle(scoreMap.hk1["hocky"]),
      tbhk1: formatDecimal(tbhk1),

      hk2_tx: formatScoreList(scoreMap.hk2.tx),
      hk2_gk: formatScoreSingle(scoreMap.hk2["giuaky"]),
      hk2_hk: formatScoreSingle(scoreMap.hk2["hocky"]),
      tbhk2: formatDecimal(tbhk2),

      tbNam: formatDecimal(tbNam)
    });
  });

  currentRows = rows;
  renderRows(rows);
}

function extractStudentScores(student, lopId, monhocId) {

  const result = {
    hk1: {
      tx: [],
      giuaky: [],
      hocky: []
    },
    hk2: {
      tx: [],
      giuaky: [],
      hocky: []
    }
  };

  const studentTests = student.kiemtra || {};

  Object.entries(studentTests).forEach(([baiId, baiLam]) => {

    if ((baiLam.lop || "") !== lopId) return;
    if ((baiLam.monhoc || "") !== monhocId) return;

    // ===== TX =====
    if (
      baiLam.loaikt === "TX" ||
      baiLam.kythi === "tx_hk1" ||
      baiLam.kythi === "tx_hk2"
    ) {

      const score = getFinalScore(baiLam);

      if (score !== null) {

        if (baiLam.kythi === "tx_hk2") {
          result.hk2.tx.push(score);
        } else {
          result.hk1.tx.push(score);
        }

      }

      return;
    }

    // ===== Đề kiểm tra =====
    const deThi = teacherKiemTra[baiId];

    if (!deThi) return;

    const kyThiId = deThi.kythi;
    const kyThiName =
      (dsKyThi[kyThiId]?.name || "").trim();

    const score = getFinalScore(baiLam);

    if (score === null || isNaN(score)) return;

    const mapped = mapKyThiToColumn(kyThiName);

    if (!mapped) return;

    result[mapped.hk][mapped.type].push(score);

  });

  return result;
}

function getFinalScore(baiLam) {
  if (isValidNumber(baiLam.tong_diem)) return Number(baiLam.tong_diem);
  if (isValidNumber(baiLam.finalScore)) return Number(baiLam.finalScore);
  if (isValidNumber(baiLam.diem)) return Number(baiLam.diem);
  return null;
}

function isValidNumber(v) {
  return v !== undefined && v !== null && v !== "" && !isNaN(Number(v));
}

function mapKyThiToColumn(name) {
  const n = name.toLowerCase().trim();

  if (n.includes("15 phút") && n.includes("hk 1")) return { hk: "hk1", type: "15phut" };
  if (n.includes("15 phút") && n.includes("hk i")) return { hk: "hk1", type: "15phut" };
  if (n.includes("1 tiết") && n.includes("hk 1")) return { hk: "hk1", type: "1tiet" };
  if (n.includes("1 tiết") && n.includes("hk i")) return { hk: "hk1", type: "1tiet" };

  if (n.includes("15 phút") && n.includes("hk 2")) return { hk: "hk2", type: "15phut" };
  if (n.includes("15 phút") && n.includes("hk ii")) return { hk: "hk2", type: "15phut" };
  if (n.includes("1 tiết") && n.includes("hk 2")) return { hk: "hk2", type: "1tiet" };
  if (n.includes("1 tiết") && n.includes("hk ii")) return { hk: "hk2", type: "1tiet" };

  if (n.includes("giữa kỳ i")) return { hk: "hk1", type: "giuaky" };
  if (n.includes("giữa kỳ 1")) return { hk: "hk1", type: "giuaky" };

  if (n.includes("giữa kỳ ii")) return { hk: "hk2", type: "giuaky" };
  if (n.includes("giữa kỳ 2")) return { hk: "hk2", type: "giuaky" };

  if (n.includes("học kỳ i")) return { hk: "hk1", type: "hocky" };
  if (n.includes("học kỳ 1")) return { hk: "hk1", type: "hocky" };

  if (n.includes("học kỳ ii")) return { hk: "hk2", type: "hocky" };
  if (n.includes("học kỳ 2")) return { hk: "hk2", type: "hocky" };

  return null;
}

/* =========================
   TÍNH ĐIỂM
========================= */
function calcTBHK(hkData) {
  const diemTX = hkData["tx"] || [];
  const giuaKy = hkData["giuaky"] || [];
  const hocKy = hkData["hocky"] || [];

  let tong = 0;
  let heSo = 0;

  diemTX.forEach(d => {
  tong += Number(d);
  heSo += 1;
});

  if (giuaKy.length) {
    tong += Number(giuaKy[giuaKy.length - 1]) * 3;
    heSo += 3;
  }

  if (hocKy.length) {
    tong += Number(hocKy[hocKy.length - 1]) * 3;
    heSo += 3;
  }

  if (heSo === 0) return 0;

  return tong / heSo;
}

function calcTBNam(tbhk1, tbhk2) {
  const hasHK1 = tbhk1 > 0;
  const hasHK2 = tbhk2 > 0;

  if (!hasHK1 && !hasHK2) return 0;
  if (hasHK1 && !hasHK2) return tbhk1;
  if (!hasHK1 && hasHK2) return tbhk2;

  return (tbhk1 + tbhk2 * 2) / 3;
}

/* =========================
   RENDER ROWS
========================= */
function renderRows(rows) {
  const bangDiemBody = document.getElementById("bangDiemBody");
  if (!bangDiemBody) return;

  if (!rows.length) {
    renderEmpty("Không có dữ liệu điểm cho lớp + môn học này");
    return;
  }

  bangDiemBody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.stt}</td>
      <td class="student-name">${r.hoTen}</td>
      <td>${r.lopName}</td>
      <td>${r.monHocName}</td>
      <td class="score-cell">${r.hk1_tx}</td>
      <td>${r.hk1_gk}</td>
      <td>${r.hk1_hk}</td>
      <td class="tb-cell">${r.tbhk1}</td>
      <td class="score-cell">${r.hk2_tx}</td>
      <td>${r.hk2_gk}</td>
      <td>${r.hk2_hk}</td>
      <td class="tb-cell">${r.tbhk2}</td>
      <td class="year-cell">${r.tbNam}</td>
    </tr>
  `).join("");
}

function renderEmpty(message) {
  const bangDiemBody = document.getElementById("bangDiemBody");
  if (!bangDiemBody) return;

  bangDiemBody.innerHTML = `
    <tr>
      <td colspan="13" style="text-align:center; padding:20px;">${message}</td>
    </tr>
  `;
}

/* =========================
   FORMAT
========================= */
function formatScoreList(arr = []) {
  if (!arr.length) return "";
  return arr.map(v => formatNumberOnly(v)).join(", ");
}

function formatScoreSingle(arr = []) {
  if (!arr.length) return "";
  return formatNumberOnly(arr[arr.length - 1]);
}

function formatNumberOnly(value) {
  const num = Number(value);
  if (Number.isInteger(num)) return String(num);
  return String(num).replace(".", ",");
}

function formatDecimal(value) {
  if (value === null || value === undefined || isNaN(value)) return "";
  return Number(value).toFixed(1).replace(".", ",");
}




/* =========================
   EXPORT EXCEL CHUẨN
========================= */

async function exportExcelPro() {
 
  if (!currentRows.length) {

    alert("Không có dữ liệu");

    return;

  }

  const workbook =
    new ExcelJS.Workbook();

  const sheet =
    workbook.addWorksheet(
      "BangDiem"
    );

  const lopSelect =
    document.getElementById(
      "lopSelect"
    );

  const monhocSelect =
    document.getElementById(
      "monhocSelect"
    );

  const lopName =
    dsLop[
      lopSelect?.value
    ]?.name || "";

  const monHocName =
    dsMonHoc[
      monhocSelect?.value
    ]?.name || "";

  // =====================
  // TIÊU ĐỀ
  // =====================

  sheet.mergeCells("A1:O1");

  sheet.getCell("A1").value =
    "BẢNG ĐIỂM HỌC TẬP";

  sheet.getCell("A1").font = {
    size:16,
    bold:true
  };

  sheet.getCell("A1").alignment = {
    horizontal:"center"
  };

  sheet.mergeCells("A2:O2");

  sheet.getCell("A2").value =
    `Lớp: ${lopName}   |   Môn học: ${monHocName}`;

  sheet.getCell("A2").alignment = {
    horizontal:"center"
  };

  // =====================
  // HEADER
  // =====================

  const headers = [

    "STT",
    "TÊN SINH VIÊN",
    "LỚP",
    "MÔN HỌC",

    "TX HK I",
    "GIỮA KỲ I",
    "HỌC KỲ I",
    "TBHK I",

    "TX HK II",
    "GIỮA KỲ II",
    "HỌC KỲ II",
    "TBHK II",

    "ĐIỂM TB NĂM"

  ];

  sheet.addRow([]);

  const headerRow =
    sheet.addRow(headers);

  headerRow.font = {
    bold:true
  };

  headerRow.alignment = {
    vertical:"middle",
    horizontal:"center"
  };

  headerRow.eachCell(cell => {

    cell.fill = {
      type:"pattern",
      pattern:"solid",
      fgColor:{
        argb:"D9EAD3"
      }
    };

    cell.border = {
      top:{style:"thin"},
      left:{style:"thin"},
      bottom:{style:"thin"},
      right:{style:"thin"}
    };

  });

  // =====================
  // DATA
  // =====================

  currentRows.forEach(r => {

    sheet.addRow([

      r.stt,
      r.hoTen,
      r.lopName,
      r.monHocName,

      r.hk1_tx,
      r.hk1_gk,
      r.hk1_hk,
      r.tbhk1,

      r.hk2_tx,
      r.hk2_gk,
      r.hk2_hk,
      r.tbhk2,

      r.tbNam

    ]);

  });

  // =====================
  // BORDER
  // =====================

  sheet.eachRow(row => {

    row.eachCell(cell => {

      cell.border = {
        top:{style:"thin"},
        left:{style:"thin"},
        bottom:{style:"thin"},
        right:{style:"thin"}
      };

    });

  });

  // =====================
  // AUTO WIDTH
  // =====================

  sheet.columns = [

    { width:4 },
    { width:25 },
    { width:35 },
    { width:35 },

    { width:12 },
    { width:12 },
    { width:12 },
    { width:12 },
    { width:12 },

    { width:12 },
    { width:12 },
    { width:12 },
    { width:16 },
    { width:12 },

    { width:12 }

  ];

  // Freeze header

  sheet.views = [
    {
      state:"frozen",
      ySplit:4
    }
  ];

  const buffer =
    await workbook.xlsx.writeBuffer();

  saveAs(

    new Blob(
      [buffer],
      {
        type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    ),

    `Bang_diem_${lopName}_${monHocName}.xlsx`

  );

}