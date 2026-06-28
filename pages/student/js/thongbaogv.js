import {
  readData,
  writeData,
onDataChange
} from "../../../scripts/services/firebaseService.js";

let teacherNameMap = {};

const studentId =
  localStorage.getItem("student_id");

if (!studentId) {
  location.href = "../../index.html";
}

const tb_list =
  document.getElementById("tb_list");

const tbDetail =
  document.getElementById("tbDetail");

const detailTitle =
  document.getElementById("detailTitle");

const detailInfo =
  document.getElementById("detailInfo");

const detailContent =
  document.getElementById("detailContent");

let lopNameMap = {};
let viewedMap = {};


// ================= INIT =================

export async function init() {

  await loadLopMap();

  viewedMap =
    await readData(`users/students/${studentId}/thongbao_da_xem`) || {};

  await loadTeacherMap(); // 👈 PHẢI đứng trước

  const teachers = await readData("teacher");
  updateThongBaoUI(teachers || {});
  listenThongBaoRealtime();
}


// ================= LOAD LOP =================

async function loadLopMap() {

  const data =
    await readData(
      "config/danh_muc/lop"
    );

  lopNameMap = {};

  Object.entries(data || {})
    .forEach(([id, item]) => {

      lopNameMap[id] =
        item.name || id;

    });
}


// ================= LOAD LIST =================

function updateThongBaoUI(teachers) {

  const tbody = document.getElementById("tb_list");
  if (!tbody) return;

  let dsThongBao = [];

  for (const [teacherId, teacherData] of Object.entries(teachers || {})) {

    const teacherName = teacherNameMap[teacherId] || teacherId;

    const thongbao = teacherData.thongbao || {};

    Object.entries(thongbao).forEach(([tbId, tb]) => {
      dsThongBao.push({
        id: tbId,
        teacherId,
        teacherName,
        ...tb
      });
    });
  }

  dsThongBao.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  tbody.innerHTML = "";

  let stt = 1;

  dsThongBao.forEach(tb => {

    const tr = document.createElement("tr");

    const noidungTomTat =
      (tb.noidung || "")
        .replace(/<[^>]*>/g, "")
        .substring(0, 60);

    const lastSeen = viewedMap[tb.id] || 0;
    const lastUpdate = tb.updatedAt || 0;

    const daXem = lastSeen >= lastUpdate;

    tr.innerHTML = `
      <td>${stt++}</td>
      <td>${tb.teacherName}</td>
      <td>${formatDate(tb.updatedAt)}</td>
      <td>${lopNameMap[tb.lop] || ""}</td>
      <td>${tb.tieude}</td>
      <td title="${tb.noidung || ""}">
        ${noidungTomTat}...
      </td>
      <td>
        <span class="${daXem ? "seen" : "unseen"}">
          ${daXem ? "✅Đã xem" : "🔴Chưa xem"}
        </span>
      </td>
    `;

    tr.style.cursor = "pointer";
    tr.onclick = () => openThongBao(tb);

    tbody.appendChild(tr);
  });
}

// ================= OPEN =================

async function openThongBao(tb) {

  detailTitle.textContent = tb.tieude;

  detailInfo.innerHTML = `
    <b>Giáo viên:</b> ${tb.teacherName}<br>
    <b>Lớp:</b> ${lopNameMap[tb.lop] || ""}<br>
    <b>Ngày:</b> ${formatDate(tb.updatedAt)}
  `;

  detailContent.innerHTML = tb.noidung;
  tbDetail.style.display = "block";

  const now = Date.now();

  await writeData(
    `users/students/${studentId}/thongbao_da_xem/${tb.id}`,
    now
  );

  viewedMap[tb.id] = now;

  // 🔥 IMPORTANT: render lại UI ngay
  const teachers = await readData("teacher");
  updateThongBaoUI(teachers || {});
}


function formatDate(timestamp) {

  if (!timestamp) return "";

  return new Date(timestamp)
    .toLocaleDateString("vi-VN");

}

function listenThongBaoRealtime() {
  onDataChange("teacher", (snapshot) => {
    updateThongBaoUI(snapshot || {});
  });
}


async function loadTeacherMap() {
  const teachers = await readData("teacher");

  for (const teacherId of Object.keys(teachers || {})) {
    const profile = await readData(`users/teachers/${teacherId}/profile`);
    teacherNameMap[teacherId] = profile?.ho_ten || teacherId;
  }
}