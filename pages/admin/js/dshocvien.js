import {
  readData,
  updateData
} from "../../../scripts/services/firebaseService.js";

const PATH = "users/students";
const PATH_LOP = "config/danh_muc/lop"; // 🔥 path lớp

const body = document.getElementById("hocVienBody");
const filterLop = document.getElementById("filterLop");

let allStudents = {};
let lopMap = {}; // 🔥 id -> tên lớp

init();

/* ================= INIT ================= */
async function init() {

  // load lớp trước
  await loadLop();

  allStudents = await readData(PATH);

  if (!allStudents) {
    body.innerHTML = `<tr><td colspan="12">Không có học viên</td></tr>`;
    return;
  }

  renderFilter();
  renderTable();
}

/* ================= LOAD LỚP ================= */
async function loadLop() {
  const data = await readData(PATH_LOP);
  lopMap = {};

  if (!data) return;

  Object.entries(data).forEach(([id, l]) => {
    lopMap[id] = l.name || id;
  });
}

/* ================= FILTER LỚP ================= */
function renderFilter() {

  const lopSet = new Set();

  Object.values(allStudents).forEach(s => {
    const lopId = s.profile?.lop;
    if (lopId) lopSet.add(lopId);
  });

  filterLop.innerHTML = `<option value="">-- Tất cả lớp --</option>`;

  lopSet.forEach(lopId => {
    const opt = document.createElement("option");
    opt.value = lopId;
    opt.textContent = lopMap[lopId] || lopId; // 🔥 map tên
    filterLop.appendChild(opt);
  });

  filterLop.onchange = renderTable;
}

/* ================= RENDER TABLE ================= */
function renderTable() {

  const lopFilter = filterLop.value;
  body.innerHTML = "";

  let stt = 1;

  Object.entries(allStudents).forEach(([id, s]) => {

    const p = s.profile || {};
    const a = s.auth || {};

    if (lopFilter && p.lop !== lopFilter) return;

    const tenLop = lopMap[p.lop] || p.lop || ""; // 🔥 map tên lớp

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${stt++}</td>
      <td class="col-name">${p.ho_ten || ""}</td>
      <td>${p.dien_thoai || ""}</td>
      <td>${tenLop}</td>
      <td class="truncate">${a.username || ""}</td>
      <td class="pass-mask">••••••</td>
      <td>
        <button onclick="resetPass('${id}')">reset</button>
      </td>
       <td>
          <button onclick="viewProfile('${id}')">Xem</button>
        </td>
      <td class="truncate">${p.gmail || ""}</td>
      <td class="truncate">${p.facebook || ""}</td>
      <td class="truncate">${p.zalo || ""}</td>
    `;

    body.appendChild(tr);
  });

  if (!body.innerHTML) {
    body.innerHTML = `<tr><td colspan="12">Không có dữ liệu</td></tr>`;
  }
}

/* ================= RESET PASS ================= */
window.resetPass = async function (id) {

  if (!confirm("Reset mật khẩu học viên này?")) return;

  const newPass = randomPass();
  const hash = await sha256(newPass);

  await updateData(`${PATH}/${id}/auth`, {
    pass_hash: hash,
    last_reset: Date.now()
  });

  alert(
    `Mật khẩu mới: ${newPass}\n(Học viên đăng nhập xong sẽ đổi lại)`
  );
};


/* =========================
   XEM HỒ SƠ
========================= */
window.viewProfile = function (id) {
  localStorage.setItem("admin_view_student", id);
  window.open("../../pages/student/hosohocvien.html", "_blank");
};


/* ================= UTIL ================= */
function randomPass() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const len = Math.floor(Math.random() * 3) + 6;
  let s = "";
  for (let i = 0; i < len; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}