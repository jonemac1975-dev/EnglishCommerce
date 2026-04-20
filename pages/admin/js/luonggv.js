import { readData, updateData,writeData }
from "../../../scripts/services/firebaseService.js";

/* ================= BIẾN ================= */
let lgvDate, lgvTeacher, lgvClass,
    lgvSoTiet, lgvSoTien,
    lgvMonth, lgvTable,
    detailZone, btnThem, btnLuu;

let teacherMap = {};
let classMap = {};
let editTeacherId = null;
let editLuongId = null;

/* ================= DOM ================= */
function getDOM() {
  lgvDate    = document.getElementById("lgvDate");
  lgvTeacher = document.getElementById("lgvTeacher");
  lgvClass   = document.getElementById("lgvClass");
  lgvSoTiet  = document.getElementById("lgvSoTiet");
  lgvSoTien  = document.getElementById("lgvSoTien");
  lgvMonth   = document.getElementById("lgvMonth");
  lgvTable   = document.getElementById("lgvTable");
  detailZone = document.getElementById("detailZone");
  btnThem    = document.getElementById("btnThem");
  btnLuu     = document.getElementById("btnLuu");
}

/* ================= LOAD TEACHERS ================= */
async function loadTeachers() {
  const data = await readData("users/teachers");
  teacherMap = {};
  lgvTeacher.innerHTML = `<option value="">-- Chọn giáo viên --</option>`;

  if (!data) return;

  Object.entries(data).forEach(([id, t]) => {
    const name = t.profile?.ho_ten || id;
    teacherMap[id] = name;
    lgvTeacher.innerHTML += `<option value="${id}">${name}</option>`;
  });
}

/* ================= LOAD CLASSES ================= */
async function loadClasses() {
  const data = await readData("config/danh_muc/lop");
  classMap = {};
  lgvClass.innerHTML = `<option value="">-- Chọn lớp --</option>`;
  if (!data) return;

  Object.entries(data).forEach(([id, c]) => {
    classMap[id] = c.name;
    lgvClass.innerHTML += `<option value="${id}">${c.name}</option>`;
  });
}

/* ================= CLEAR FORM ================= */
function clearForm() {
  lgvDate.value = "";
  lgvSoTiet.value = "";
  lgvSoTien.value = "";
  editTeacherId = null;
  editLuongId = null;
  btnThem.style.display = "inline-block";
  btnLuu.style.display = "none";
}

/* ================= THÊM ================= */
async function themLuong() {
  if (!lgvDate.value || !lgvTeacher.value || !lgvClass.value ||
      !lgvSoTiet.value || !lgvSoTien.value) {
    showToast("Thiếu thông tin");
    return;
  }

  const id = "sl_" + Date.now();
  const monthKey = lgvDate.value.slice(0, 7);

  await writeData(`teacher/${lgvTeacher.value}/luong/${id}`, {
    date: lgvDate.value,
    classId: lgvClass.value,
    soTiet: Number(lgvSoTiet.value),
    soTien: Number(lgvSoTien.value),
    monthKey,
    paid: false
  });
showToast("Đã thêm lương GV");
  clearForm();
  loadAllDetailTable();
  loadSalaryTable();
}

/* ================= LƯU (SỬA) ================= */
async function luuLuong() {
  if (!editTeacherId || !editLuongId) return;

  const old = await readData(
    `teacher/${editTeacherId}/luong/${editLuongId}`
  );

  if (old?.paid) {
    showToast("Dòng này đã thanh toán – không được sửa");
    return;
  }

  await writeData(`teacher/${editTeacherId}/luong/${editLuongId}`, {
    ...old,
    date: lgvDate.value,
    classId: lgvClass.value,
    soTiet: Number(lgvSoTiet.value),
    soTien: Number(lgvSoTien.value),
    monthKey: lgvDate.value.slice(0, 7)
  });
showToast("Đã Cập nhật");
  clearForm();
  loadAllDetailTable();
  loadSalaryTable();
}

/* ================= EDIT ================= */
window._editLuong = async (teacherId, luongId) => {
  const r = await readData(`teacher/${teacherId}/luong/${luongId}`);
  if (!r) return;

  if (r.paid) {
    showToast("Đã thanh toán – không được chỉnh sửa");
    return;
  }

  editTeacherId = teacherId;
  editLuongId = luongId;

  lgvTeacher.value = teacherId;
  lgvDate.value = r.date;
  lgvClass.value = r.classId;
  lgvSoTiet.value = r.soTiet;
  lgvSoTien.value = r.soTien;

  btnThem.style.display = "none";
  btnLuu.style.display = "inline-block";
};

/* ================= XÓA ================= */
window._xoaLuong = async (teacherId, luongId) => {
  const r = await readData(`teacher/${teacherId}/luong/${luongId}`);
  if (r?.paid) {
    showToast("Đã thanh toán – không được xóa");
    return;
  }

  if (!confirm("Xóa dòng lương này?")) return;
  await writeData(`teacher/${teacherId}/luong/${luongId}`, null);
showToast("Đã xóa");
  loadAllDetailTable();
  loadSalaryTable();
};

/* ================= BẢNG CHI TIẾT ================= */
async function loadAllDetailTable() {
  detailZone.innerHTML = "";

  const teachers = await readData("teacher");
  if (!teachers) return;

  Object.entries(teachers).forEach(([teacherId, tData]) => {
    const luong = tData.luong;
    if (!luong) return;

    const wrap = document.createElement("div");
    wrap.style.marginBottom = "12px";

    const header = document.createElement("div");
    header.textContent = `▶ Giáo viên: ${teacherMap[teacherId] || teacherId}`;
    header.style.fontWeight = "bold";
    header.style.cursor = "pointer";

    const content = document.createElement("div");
    content.style.display = "none";

    header.onclick = () => {
      content.style.display =
        content.style.display === "none" ? "block" : "none";
    };

    let html = `
      <table>
        <tr>
          <th>STT</th>
          <th>Ngày</th>
          <th>Lớp</th>
          <th>Số tiết</th>
          <th>Số tiền</th>
          <th>Trạng thái</th>
          <th>Xóa</th>
        </tr>`;

    let stt = 1;
    Object.entries(luong).forEach(([lid, r]) => {
      html += `
        <tr onclick="window._editLuong('${teacherId}','${lid}')">
          <td>${stt++}</td>
          <td>${r.date}</td>
          <td>${classMap[r.classId] || r.classId}</td>
          <td>${r.soTiet}</td>
          <td>${r.soTien.toLocaleString()}</td>
          <td>${r.paid ? "🔒 Đã TT" : "Chưa TT"}</td>
          <td>
            ${r.paid ? "—" : `
              <button onclick="event.stopPropagation();
                window._xoaLuong('${teacherId}','${lid}')">X</button>
            `}
          </td>
        </tr>`;
    });

    html += "</table>";
    content.innerHTML = html;

    wrap.appendChild(header);
    wrap.appendChild(content);
    detailZone.appendChild(wrap);
  });
}

/* ================= TỔNG HỢP ================= */
async function loadSalaryTable() {
  if (!lgvMonth.value) return;

  const teachers = await readData("teacher");
  lgvTable.innerHTML = "";
  if (!teachers) return;

  let stt = 1;

  Object.entries(teachers).forEach(([tid, t]) => {
    let tongTiet = 0;
    let tongTien = 0;
    let conChuaTT = false;

    Object.values(t.luong || {}).forEach(r => {
      if (r.monthKey === lgvMonth.value) {
        tongTiet += r.soTiet;
        tongTien += r.soTien;

        if (!r.paid) {
          conChuaTT = true;
        }
      }
    });

    if (tongTiet === 0) return;

    lgvTable.innerHTML += `
      <tr>
        <td>${stt++}</td>
        <td>${teacherMap[tid] || tid}</td>
        <td>${tongTiet}</td>
        <td>${tongTien.toLocaleString()}</td>
        <td class="${conChuaTT ? "status-unpaid" : "status-paid"}">
          ${conChuaTT ? "❌ Chưa thanh toán" : "✅ Đã thanh toán"}
        </td>
      </tr>
    `;
  });
}
/* ================= INIT ================= */
export async function init() {
  getDOM();

  lgvMonth.value = new Date().toISOString().slice(0, 7);

  await loadTeachers();
  await loadClasses();

  await loadSalaryTable();      // tổng hợp tháng hiện tại
  await loadAllDetailTable();   // bảng chi tiết toàn bộ

  btnThem.onclick = themLuong;
  btnLuu.onclick  = luuLuong;

  // 🔥 FIX LỖI: đổi tháng phải reload bảng tổng hợp
  lgvMonth.addEventListener("change", () => {
    loadSalaryTable();
  });
}


