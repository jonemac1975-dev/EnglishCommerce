import { readData, updateData }
from "../../../scripts/services/firebaseService.js";

const PATH = "users/teachers";
const PATH_SUBJECT = "config/danh_muc/chuyenmon"; // 🔥 đúng path

let subjectMap = {}; 

/* =========================
   LOAD DANH SÁCH
========================= */
async function loadTeachers() {

  const tableBody = document.getElementById("teacherTable");
  tableBody.innerHTML = "";

  // load môn học trước
  await loadSubjects();

  const data = await readData(PATH);
  if (!data) return;

  let i = 1;

  Object.entries(data).forEach(([id, teacher]) => {

    const profile = teacher.profile || {};
    const auth = teacher.auth || {};

    // 🔥 map id -> tên môn
    const monId = profile.chuyen_mon;
    const tenMon = subjectMap[monId] || monId || "";

    tableBody.innerHTML += `
      <tr>
        <td>${i++}</td>
        <td>${id}</td>
        <td>${profile.ho_ten || ""}</td>
        <td>${profile.dien_thoai || ""}</td>
        <td>${tenMon}</td>
        <td>
          <button onclick="viewProfile('${id}')">Xem</button>
        </td>
        <td>${auth.username || ""}</td>
        <td>${auth.pass_hash || ""}</td>
        <td><button onclick="resetPass('${id}')">Đổi pass</button></td>
      </tr>
    `;
  });
}

/* =========================
   LOAD MÔN HỌC
========================= */
async function loadSubjects() {

  const data = await readData(PATH_SUBJECT);
  subjectMap = {};

  if (!data) return;

  Object.entries(data).forEach(([id, sub]) => {
    subjectMap[id] = sub.name || id; // 🔥 dùng name
  });
}

/* =========================
   RESET PASS
========================= */
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

window.resetPass = async function(id) {
  const newPass = prompt("Nhập mật khẩu mới:");
  if (!newPass) return;

  const hash = await sha256(newPass);

  await updateData(`users/teachers/${id}/auth`, {
    pass_hash: hash
  });

  alert("Đã cập nhật mật khẩu");
};

/* =========================
   XEM HỒ SƠ
========================= */
window.viewProfile = function (id) {
  localStorage.setItem("admin_view_teacher", id);
  window.open("../../pages/teacher/hosogiaovien.html", "_blank");
};

/* INIT */
loadTeachers();