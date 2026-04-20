import { readData } from "../../../scripts/services/firebaseService.js";

/* ========= BIẾN ========= */
let tkbNam, tkbThang, tkbLop, weeksWrap;
let lopMap = {};
let teacherMap = {};
let teacherProfileMap = {};

/* ========= DOM ========= */
function getDOM() {
  tkbNam   = document.getElementById("tkbNam");
  tkbThang = document.getElementById("tkbThang");
  tkbLop   = document.getElementById("tkbLop");
  weeksWrap = document.getElementById("tkbWeeksWrap");
}

/* ========= TOAST ========= */
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove("show"), 2500);
}

/* ========= TUẦN HIỆN TẠI ========= */
function getCurrentWeekOfMonth() {
  const today = new Date();
  const day = today.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

/* ========= INIT TIME ========= */
function initTime() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  tkbNam.innerHTML = `<option value="${y}">${y}</option>`;
  tkbThang.innerHTML = "";

  for (let month = 1; month <= 12; month++) {
    tkbThang.innerHTML += `<option value="${month}">${month}</option>`;
  }

  tkbThang.value = m;
}

/* ========= LOAD LỚP ========= */
async function loadLop() {
  const lop = await readData("config/danh_muc/lop") || {};
  lopMap = {};

  tkbLop.innerHTML = `<option value="">-- Chọn lớp --</option>`;

  Object.entries(lop).forEach(([id, v]) => {
    const name = v.name || id;
    lopMap[id] = name;
    tkbLop.innerHTML += `<option value="${id}">${name}</option>`;
  });
}

/* ========= LOAD TEACHER ========= */
async function loadTeachers() {
  teacherMap = await readData("teacher") || {};
}

/* ========= LOAD USER TEACHER PROFILE ========= */
async function loadTeacherProfiles() {
  teacherProfileMap = await readData("users/teachers") || {};
}

/* ========= LẤY TÊN GIÁO VIÊN ========= */
function getTeacherName(teacherId) {
  return (
    teacherProfileMap?.[teacherId]?.profile?.ho_ten ||
    teacherProfileMap?.[teacherId]?.profile?.ten ||
    teacherProfileMap?.[teacherId]?.profile?.name ||
    teacherProfileMap?.[teacherId]?.profile?.fullName ||
    teacherMap?.[teacherId]?.teacherName ||
    teacherMap?.[teacherId]?.name ||
    teacherId
  );
}

/* ========= LẤY MÔN HỌC ========= */
function getSubjectName(item) {
  return (
    item?.monhocName ||
    item?.monhoc ||
    ""
  );
}

/* ========= BUILD ROWS ========= */
function buildWeekRows(arr, weekNum) {
  if (!arr.length) {
    return `
      <tr>
        <td colspan="10" class="empty-row">Chưa có thời khóa biểu tuần ${weekNum}</td>
      </tr>
    `;
  }

  let stt = 1;

  return arr.map(item => `
    <tr>
      <td>${stt++}</td>
      <td>${item.teacherName}</td>
      <td>${item.subject}</td>
      ${["t2","t3","t4","t5","t6","t7","cn"]
        .map(d => `<td>${item.lich?.[d] || ""}</td>`).join("")}
    </tr>
  `).join("");
}

/* ========= RENDER 4 TUẦN ========= */
async function renderAllWeeks() {
  if (!weeksWrap) return;

  const selectedYear  = String(tkbNam.value);
  const selectedMonth = String(tkbThang.value);
  const selectedLop   = String(tkbLop.value || "");

  if (!selectedLop) {
    weeksWrap.innerHTML = `
      <div class="week-block">
        <div class="empty-select">Vui lòng chọn lớp để xem thời khóa biểu</div>
      </div>
    `;
    return;
  }

  const now = new Date();
  const isCurrentMonth =
    Number(selectedYear) === now.getFullYear() &&
    Number(selectedMonth) === (now.getMonth() + 1);

  const currentWeek = getCurrentWeekOfMonth();

  weeksWrap.innerHTML = "";

  for (let week = 1; week <= 4; week++) {
    let rows = [];

    Object.entries(teacherMap).forEach(([teacherId, teacher]) => {
      const lichday = teacher?.lichday || {};

      Object.values(lichday).forEach(item => {
        if (
          String(item.nam) === selectedYear &&
          String(item.thang) === selectedMonth &&
          String(item.tuan) === String(week) &&
          String(item.lop) === selectedLop
        ) {
          rows.push({
            teacherId,
            teacherName: getTeacherName(teacherId),
            subject: getSubjectName(item),
            lich: item.lich || {}
          });
        }
      });
    });

    rows.sort((a, b) => a.teacherName.localeCompare(b.teacherName, "vi"));

    const activeClass = isCurrentMonth && week === currentWeek ? "active-week" : "";

    const block = document.createElement("div");
    block.className = `week-block ${activeClass}`;
    block.innerHTML = `
      <div class="week-title-row">
        <div class="week-title">Tuần ${week}</div>
        ${activeClass ? `<span class="week-badge">Tuần hiện hành</span>` : ""}
      </div>

      <div class="table-wrap">
        <table class="admin-table lich-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Giáo viên</th>
              <th>Môn học</th>
              <th>T2</th>
              <th>T3</th>
              <th>T4</th>
              <th>T5</th>
              <th>T6</th>
              <th>T7</th>
              <th>CN</th>
            </tr>
          </thead>
          <tbody>
            ${buildWeekRows(rows, week)}
          </tbody>
        </table>
      </div>
    `;

    weeksWrap.appendChild(block);
  }
}

/* ========= INIT ========= */
export async function init() {
  getDOM();
  if (!tkbNam) return;

  initTime();
  await loadLop();
  await loadTeachers();
  await loadTeacherProfiles();
  await renderAllWeeks();

  tkbNam.onchange   = renderAllWeeks;
  tkbThang.onchange = renderAllWeeks;
  tkbLop.onchange   = renderAllWeeks;
}