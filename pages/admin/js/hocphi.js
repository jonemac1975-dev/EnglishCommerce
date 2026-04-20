import { readData, updateData,writeData }
from "../../../scripts/services/firebaseService.js";

/* ===== BIẾN ===== */
let hpMonth, hpFilterMonth, hpStudent, hpClass, hpHinhThuc, hpTien;
let hpTable, btnThem, btnLuu;

let studentMap = {};
let classMap = {};
let editStudentId = null;
let editHocPhiId = null;

/* ===== DOM ===== */
function getDOM() {
  hpMonth       = document.getElementById("hpMonth");
  hpFilterMonth = document.getElementById("hpFilterMonth");
  hpStudent     = document.getElementById("hpStudent");
  hpClass       = document.getElementById("hpClass");
  hpHinhThuc    = document.getElementById("hpHinhThuc");
  hpTien        = document.getElementById("hpTien");
  hpTable       = document.getElementById("hpTable");
  btnThem       = document.getElementById("btnThem");
  btnLuu        = document.getElementById("btnLuu");
}

/* ===== CLEAR FORM ===== */
function clearForm() {
  hpStudent.value = "";
  hpClass.value = "";
  hpHinhThuc.value = "";
  hpTien.value = "";

  editStudentId = null;
  editHocPhiId = null;

  btnThem.style.display = "inline-block";
  btnLuu.style.display  = "none";
}

/* ===== LOAD STUDENTS ===== */
async function loadStudents() {
  const data = await readData("users/students");
  hpStudent.innerHTML = `<option value="">-- chọn học viên --</option>`;
  studentMap = {};

  if (!data) return;

  Object.entries(data).forEach(([id, s]) => {
    const name  = s.profile?.ho_ten || id;
    const phone = s.profile?.dien_thoai || "";
    studentMap[id] = { name, phone };
    hpStudent.innerHTML += `<option value="${id}">${name}</option>`;
  });
}

/* ===== LOAD CLASSES ===== */
async function loadClasses() {
  const data = await readData("config/danh_muc/lop");
  hpClass.innerHTML = `<option value="">-- chọn lớp --</option>`;
  classMap = {};

  if (!data) return;

  Object.entries(data).forEach(([id, c]) => {
    classMap[id] = c.name;
    hpClass.innerHTML += `<option value="${id}">${c.name}</option>`;
  });
}

/* ===== THÊM HỌC PHÍ ===== */
async function themHocPhi() {
  if (!hpMonth.value || !hpStudent.value || !hpClass.value ||
      !hpHinhThuc.value || !hpTien.value) {
    showToast("Thiếu thông tin", "error");
    return;
  }

  const id = "hp_" + Date.now();

  await writeData(
    `users/students/${hpStudent.value}/hocphi/${id}`,
    {
      month: hpMonth.value,
      classId: hpClass.value,
      hinh_thuc: hpHinhThuc.value,
      so_tien: Number(hpTien.value),
      status: "unpaid",
      created_at: Date.now()
    }
  );

  clearForm();
  await loadHocPhiTable();
  showToast("Đã thêm học phí");
}

/* ===== LƯU (CHỈNH SỬA) ===== */
async function luuHocPhi() {
  if (!editStudentId || !editHocPhiId) return;

const oldData = await readData(
  `users/students/${editStudentId}/hocphi/${editHocPhiId}`
);

if (oldData?.status === "paid") {
  showToast("Không thể sửa học phí đã thu", "error");
  return;
}

  await writeData(
    `users/students/${editStudentId}/hocphi/${editHocPhiId}`,
    {
      month: hpMonth.value,
      classId: hpClass.value,
      hinh_thuc: hpHinhThuc.value,
      so_tien: Number(hpTien.value),
      status: "unpaid",
      updated_at: Date.now()
    }
  );

  clearForm();
  await loadHocPhiTable();
  showToast("Đã cập nhật học phí");
}

/* ===== LOAD TABLE ===== */
async function loadHocPhiTable() {
  if (!hpTable || !hpFilterMonth.value) return;

  hpTable.innerHTML = "";
  const students = await readData("users/students");
  if (!students) return;

  let stt = 1;

  Object.entries(students).forEach(([sid, s]) => {
    if (!s.hocphi) return;

    Object.entries(s.hocphi).forEach(([id, r]) => {
      if (r.month !== hpFilterMonth.value) return;

      const tr = document.createElement("tr");
      tr.dataset.sid = sid;
      tr.dataset.id  = id;

      const hienThiTien = r.status === "paid" ? 0 : r.so_tien;

tr.innerHTML = `
  <td>${stt++}</td>
  <td>${studentMap[sid]?.name || sid}</td>
  <td>${studentMap[sid]?.phone || ""}</td>
  <td>${classMap[r.classId] || r.classId}</td>
  <td>${r.hinh_thuc} tháng</td>
  <td>${Number(hienThiTien).toLocaleString()}</td>
  <td>
    ${
      r.status === "paid"
        ? `Đã thu ${r.phieu ? `(${r.phieu})` : ""}`
        : "Chưa thu"
    }
  </td>
  <td><button class="btn-xoa">X</button></td>
`;

if (r.status === "paid") {
  tr.style.background = "#f0fdf4";
  tr.style.color = "#777";
  tr.onclick = null; // khóa chỉnh sửa
}


      /* click dòng => chỉnh sửa */
      tr.onclick = () => {
        hpStudent.value  = sid;
        hpClass.value    = r.classId;
        hpHinhThuc.value = r.hinh_thuc;
        hpTien.value     = r.so_tien;

        editStudentId = sid;
        editHocPhiId  = id;

        btnThem.style.display = "none";
        btnLuu.style.display  = "inline-block";
      };

      /* nút xóa */
      tr.querySelector(".btn-xoa").onclick = async (e) => {
        e.stopPropagation();
        if (!confirm("Xóa học phí này?")) return;
        await writeData(`users/students/${sid}/hocphi/${id}`, null);
        await loadHocPhiTable();
        showToast("Đã xóa học phí");
      };

      hpTable.appendChild(tr);
    });
  });
}

/* ===== INIT ===== */
export async function init() {
  getDOM();

  const now = new Date().toISOString().slice(0,7);
  hpMonth.value = now;
  hpFilterMonth.value = now;

  await loadStudents();
  await loadClasses();
  await loadHocPhiTable();

  btnThem.onclick = themHocPhi;
  btnLuu.onclick  = luuHocPhi;
  hpFilterMonth.onchange = loadHocPhiTable;
}
