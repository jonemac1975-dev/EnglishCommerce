import { readData } from "../../../scripts/services/firebaseService.js";

let teacherExamMap = {};
let teachersGlobal = {};
let lopDanhMucGlobal = {};
let kyThiDanhMucGlobal = {};
let monHocDanhMucGlobal = {};

export async function init() {
  const student = JSON.parse(localStorage.getItem("studentLogin"));
  if (!student) return;

  const diemTableBody = document.getElementById("diemTableBody");
  const chartContainer = document.getElementById("chartContainer");

  if (!diemTableBody) return;

  const data = await readData(`users/students/${student.id}/kiemtra`);

  if (!data) {
    diemTableBody.innerHTML =
      "<tr><td colspan='11'>Chưa có dữ liệu</td></tr>";
    if (chartContainer) chartContainer.innerHTML = "";
    return;
  }

  // 🔥 load danh mục
  	const teachers = await readData("users/teachers");
	const lopDanhMuc = await readData("config/danh_muc/lop");
	const kyThiDanhMuc = await readData("config/danh_muc/kythi");
	const monHocDanhMuc = await readData("config/danh_muc/monhoc");

	teachersGlobal = teachers || {};
	lopDanhMucGlobal = lopDanhMuc || {};
	kyThiDanhMucGlobal = kyThiDanhMuc || {};
	monHocDanhMucGlobal = monHocDanhMuc || {};


  // 🔥 load đề kiểm tra từ teacher/*
  teacherExamMap = await buildTeacherExamMap(teachersGlobal);

  renderTable(data);
//  renderCharts(data, teachersGlobal);
  bindModalEvents();
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

  console.log("📚 teacherExamMap:", examMap);
  return examMap;
}

/* ================= TABLE ================= */

function renderTable(data) {
  const tbody = document.getElementById("diemTableBody");
  tbody.innerHTML = "";

  const list = Object.entries(data)
    .map(([baiId, item]) => ({ baiId, ...item }))
    .sort((a, b) => new Date(a.ngay) - new Date(b.ngay));

  if (!list.length) {
    tbody.innerHTML = "<tr><td colspan='11'>Chưa có dữ liệu</td></tr>";
    return;
  }

  list.forEach((item, index) => {
    const tr = document.createElement("tr");

    const diemTracNghiem = getTracNghiemScore(item);
    const diemTuLuan = getEssayScore(item);
    const diemTong = getFinalScore(item);

    const diemTongClass = diemTong >= 5 ? "score-green" : "score-red";

    const tenGV =
  teachersGlobal?.[item.giao_vien]?.profile?.ho_ten || item.giao_vien || "";

const examInfo = teacherExamMap?.[item.bai] || teacherExamMap?.[item.baiId] || {};

const monHocId = item.monhoc || examInfo.monhoc || "";
const monGV =
  monHocDanhMucGlobal?.[monHocId]?.name || monHocId || "";


    const tenLop =
      lopDanhMucGlobal?.[item.lop]?.name || item.lop || "";

   
    const tenDe = examInfo.tieude || item.bai || item.baiId || "";
    const loaiBai = kyThiDanhMucGlobal?.[examInfo.kythi]?.name || item.kythi || "";

    const nhanXet = extractNhanXet(item);
    const hasEssay = hasEssayContent(item, examInfo);

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${tenGV}</td>
      <td>${monGV}</td>
      <td>${tenLop}</td>
      <td>${loaiBai}</td>
      <td>${tenDe}</td>
      <td>${formatScoreOrEmpty(diemTracNghiem)}</td>
      <td>${formatScoreOrEmpty(diemTuLuan)}</td>
      <td class="${diemTongClass}">${formatScoreOrEmpty(diemTong)}</td>
      <td class="essay-note">${nhanXet}</td>
      <td>${formatDate(item.ngay)}</td>
      <td>
        ${
          hasEssay
            ? `<button class="btn-view-essay" data-baiid="${item.baiId}">Xem</button>`
            : `---`
        }
      </td>
    `;

    tbody.appendChild(tr);
  });

  bindViewEssayButtons(list);
}

/* ================= BIND BUTTONS ================= */

function bindViewEssayButtons(list) {
  const buttons = document.querySelectorAll(".btn-view-essay");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const baiId = btn.dataset.baiid;
      const item = list.find(x => x.baiId === baiId);
      if (!item) return;

      const examInfo = teacherExamMap?.[item.bai] || teacherExamMap?.[item.baiId] || {};
      openEssayModal(item, examInfo);
    });
  });
}

/* ================= MODAL ================= */

function bindModalEvents() {
  const closeBtn = document.getElementById("closeEssayModal");
  const modal = document.getElementById("essayModal");

  closeBtn?.addEventListener("click", closeEssayModal);

  modal?.addEventListener("click", (e) => {
    if (e.target.id === "essayModal") {
      closeEssayModal();
    }
  });
}

function openEssayModal(item, examInfo) {
  const modal = document.getElementById("essayModal");
  const body = document.getElementById("essayModalBody");
  if (!modal || !body) return;

  const tenGV =
    teachersGlobal?.[item.giao_vien]?.profile?.ho_ten || item.giao_vien || "";

  const loaiBai =
    kyThiDanhMucGlobal?.[examInfo.kythi]?.name || item.kythi || "";

  const tenDe = examInfo.tieude || item.bai || item.baiId || "";
  const tenLop = lopDanhMucGlobal?.[item.lop]?.name || item.lop || "";
  const monHocId = item.monhoc || examInfo.monhoc || "";
  const tenMonHoc = monHocDanhMucGlobal?.[monHocId]?.name || monHocId || "";

  const diemTracNghiem = getTracNghiemScore(item);
  const diemTuLuan = getEssayScore(item);
  const diemTong = getFinalScore(item);

  const essayQuestions = Array.isArray(examInfo.essays) ? examInfo.essays : [];
  const essayAnswers = Array.isArray(item.tuLuan) ? item.tuLuan : [];
  const essayMarks = Array.isArray(item.tuLuanCham) ? item.tuLuanCham : [];

  let html = `
    <div class="essay-info-grid">
      <div class="essay-info-card"><strong>Tên đề</strong>${tenDe}</div>
	<div class="essay-info-card"><strong>Giáo viên</strong>${tenGV}</div>
	<div class="essay-info-card"><strong>Môn học</strong>${tenMonHoc}</div>
	<div class="essay-info-card"><strong>Lớp</strong>${tenLop}</div>
	<div class="essay-info-card"><strong>Loại kiểm tra</strong>${loaiBai}</div>
      <div class="essay-info-card"><strong>Ngày làm</strong>${formatDate(item.ngay)}</div>
      <div class="essay-info-card"><strong>Điểm trắc nghiệm</strong>${formatScoreOrEmpty(diemTracNghiem)}</div>
      <div class="essay-info-card"><strong>Điểm tự luận</strong>${formatScoreOrEmpty(diemTuLuan)}</div>
      <div class="essay-info-card"><strong>Điểm tổng</strong><span class="essay-score">${formatScoreOrEmpty(diemTong)}</span></div>
    </div>
  `;

  let hasAnyEssay = false;

  const maxLen = Math.max(essayQuestions.length, essayAnswers.length, essayMarks.length);

  for (let i = 1; i < maxLen; i++) {
    const cauHoi = essayQuestions[i] || "";
    const baiLam = essayAnswers[i] || {};
    const cham = essayMarks[i] || {};

    if (!cauHoi && !baiLam?.text && !baiLam?.image && !cham?.nhanXet && !isValidNumber(cham?.diem)) {
      continue;
    }

    hasAnyEssay = true;

    html += `
      <div class="essay-question-box">
        <div class="essay-question-title">Câu hỏi ${i}</div>

        <div class="essay-block">
          
         <div>${cauHoi || "<i>Không có nội dung</i>"}</div>
        </div>

        <div class="essay-block">
          <strong>Bài làm:</strong>
          <div class="essay-answer-text">${escapeHtml(baiLam?.text || "Không có nội dung trả lời")}</div>
          ${
            baiLam?.image
              ? `<img src="${baiLam.image}" alt="Bài làm tự luận" class="essay-image">`
              : ""
          }
        </div>

        <div class="essay-block">
          <strong>Điểm:</strong>
          <div class="essay-score">${formatScoreOrEmpty(cham?.diem)}</div>
        </div>

        <div class="essay-block">
          <strong>Nhận xét giáo viên:</strong>
          <div class="essay-comment">${escapeHtml(cham?.nhanXet || "Chưa có nhận xét")}</div>
        </div>
      </div>
    `;
  }

  if (!hasAnyEssay) {
    html += `
      <div class="essay-question-box">
        <div style="text-align:center; padding:20px;">
          Không có dữ liệu tự luận để hiển thị.
        </div>
      </div>
    `;
  }

  body.innerHTML = html;
  modal.classList.remove("hidden");
}

function closeEssayModal() {
  document.getElementById("essayModal")?.classList.add("hidden");
}



/* ================= HELPERS ================= */

function hasEssayContent(item, examInfo) {
  const hasEssayQuestion =
    Array.isArray(examInfo?.essays) && examInfo.essays.some(x => x);

  const hasEssayAnswer =
    Array.isArray(item?.tuLuan) &&
    item.tuLuan.some(x => x?.text || x?.image);

  const hasEssayMark =
    Array.isArray(item?.tuLuanCham) &&
    item.tuLuanCham.some(x => x?.nhanXet || isValidNumber(x?.diem));

  return hasEssayQuestion || hasEssayAnswer || hasEssayMark;
}

function getTracNghiemScore(item) {
  if (isValidNumber(item.diem)) return Number(item.diem);
  if (isValidNumber(item.finalScore) && !isValidNumber(item.diem_tuluan)) {
    return Number(item.finalScore);
  }
  return null;
}

function getEssayScore(item) {
  if (isValidNumber(item.diem_tuluan)) return Number(item.diem_tuluan);

  if (Array.isArray(item.tuLuanCham)) {
    let tong = 0;
    let coDiem = false;

    item.tuLuanCham.forEach(cau => {
      if (cau && isValidNumber(cau.diem)) {
        tong += Number(cau.diem);
        coDiem = true;
      }
    });

    if (coDiem) return tong;
  }

  return null;
}

function getFinalScore(item) {
  if (isValidNumber(item.tong_diem)) return Number(item.tong_diem);
  if (isValidNumber(item.finalScore)) return Number(item.finalScore);
  if (isValidNumber(item.diem)) return Number(item.diem);
  return null;
}

function extractNhanXet(item) {
  const notes = [];

  if (Array.isArray(item.tuLuanCham)) {
    item.tuLuanCham.forEach(cau => {
      if (cau?.nhanXet) {
        notes.push(cau.nhanXet.trim());
      }
    });
  }

  if (!notes.length) return "";
  return notes.join(" | ");
}

function isValidNumber(v) {
  return v !== undefined && v !== null && v !== "" && !isNaN(Number(v));
}

function formatScoreOrEmpty(value) {
  if (value === null || value === undefined || isNaN(value)) return "";
  const num = Number(value);
  if (Number.isInteger(num)) return String(num);
  return num.toFixed(1).replace(".", ",");
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}