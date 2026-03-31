import { readData, writeData } from "../../../scripts/services/firebaseService.js";

/* =========================
   DOM
========================= */
let hvImgPreview, hvTen, hvLop, hvMon, hvThang, hvThanhTich;
let btnThem, btnLuu, btnXoa, hvTable;

/* =========================
   DATA
========================= */
let studentsMap = {}; // { studentId: { name, avatar, lopId } }
let classesMap = {};  // { lopId: lopName }
let subjectsMap = {}; // { monId: monName }

let editId = null;
let currentImg = "";

/* =========================
   DOM
========================= */
function getDOM() {
  hvImgPreview = document.getElementById("hvImgPreview");
  hvTen        = document.getElementById("hvTen");
  hvLop        = document.getElementById("hvLop");
  hvMon        = document.getElementById("hvMon");
  hvThang      = document.getElementById("hvThang");
  hvThanhTich  = document.getElementById("hvThanhTich");

  btnThem = document.getElementById("btnThem");
  btnLuu  = document.getElementById("btnLuu");
  btnXoa  = document.getElementById("btnXoa");
  hvTable = document.getElementById("hvTable");
}

/* =========================
   TOAST
========================= */
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove("show"), 2500);
}

/* =========================
   AVATAR
========================= */
function renderAvatar(img) {
  if (img) {
    hvImgPreview.src = img;
    hvImgPreview.style.display = "block";
  } else {
    hvImgPreview.src = "";
    hvImgPreview.style.display = "none";
  }
}

/* =========================
   LOAD LỚP
========================= */
async function loadClasses() {
  classesMap = {};

  const data = await readData("config/danh_muc/lop");
  if (!data) return;

  Object.entries(data).forEach(([id, v]) => {
    classesMap[id] = v?.name || id;
  });

  console.log("📘 classesMap:", classesMap);
}

/* =========================
   LOAD MÔN HỌC
========================= */
async function loadSubjects() {
  subjectsMap = {};
  hvMon.innerHTML = `<option value="">-- chọn môn học --</option>`;

  const data = await readData("config/danh_muc/monhoc");
  if (!data) return;

  Object.entries(data).forEach(([id, v]) => {
    const name = v?.name || id;
    subjectsMap[id] = name;
    hvMon.innerHTML += `<option value="${id}">${name}</option>`;
  });
}

/* =========================
   LOAD HỌC VIÊN
========================= */
async function loadStudents() {
  studentsMap = {};
  hvTen.innerHTML = `<option value="">-- chọn học viên --</option>`;

  const data = await readData("users/students");
  if (!data) return;

  Object.entries(data).forEach(([id, v]) => {
    const profile = v?.profile || {};
    const name = profile?.ho_ten || id;
    const avatar = profile?.avatar || "";
    const lopId = profile?.lop || "";

    studentsMap[id] = {
      name,
      avatar,
      lopId
    };

    hvTen.innerHTML += `<option value="${id}">${name}</option>`;
  });

  console.log("👨‍🎓 studentsMap:", studentsMap);
}

/* =========================
   CHỌN HỌC VIÊN
========================= */
function bindStudentChange() {
  hvTen.addEventListener("change", () => {
    const studentId = hvTen.value;
    const student = studentsMap[studentId];

    if (!student) {
      currentImg = "";
      hvLop.value = "";
      renderAvatar("");
      return;
    }

    currentImg = student.avatar || "";

    // lấy tên lớp từ lopId
    const lopName = classesMap[student.lopId] || "";
    hvLop.value = lopName;

    renderAvatar(currentImg);

    console.log("✅ studentId:", studentId);
    console.log("✅ student:", student);
    console.log("✅ lopId:", student.lopId);
    console.log("✅ lopName:", lopName);
  });
}

/* =========================
   CLEAR FORM
========================= */
function clearForm() {
  editId = null;
  currentImg = "";

  hvTen.value = "";
  hvLop.value = "";
  hvMon.value = "";
  hvThang.value = "";
  hvThanhTich.value = "";

  renderAvatar("");

  btnThem.style.display = "inline-block";
  btnLuu.style.display = "none";
  btnXoa.style.display = "none";
}

/* =========================
   SAVE
========================= */
async function saveData(isEdit = false) {
  if (!hvTen.value || !hvMon.value || !hvThang.value) {
    showToast("Thiếu thông tin", "error");
    return;
  }

  const id = editId || ("hv_" + Date.now());

  await writeData(`tieubieu/chungchihv/${id}`, {
    hocvien: hvTen.value,
    img: currentImg || "",
    lop: hvLop.value || "",
    mon: hvMon.value,
    thang: hvThang.value,
    thanhtich: hvThanhTich.value || "",
    updated_at: Date.now()
  });

  showToast(isEdit ? "Đã cập nhật" : "Đã thêm mới");
  clearForm();
  await loadTable();
}

/* =========================
   LOAD TABLE
========================= */
async function loadTable() {
  hvTable.innerHTML = "";
  const data = await readData("tieubieu/chungchihv");
  if (!data) return;

  let stt = 1;

  Object.entries(data).forEach(([id, item]) => {
    const tr = document.createElement("tr");

    const tenHv = studentsMap[item.hocvien]?.name || item.hocvien || "";
    const tenMon = subjectsMap[item.mon] || item.mon || "";

    tr.innerHTML = `
      <td>${stt++}</td>
      <td>${tenHv}</td>
      <td>${item.lop || ""}</td>
      <td>${tenMon}</td>
      <td>${item.thang || ""}</td>
      <td>${item.thanhtich || ""}</td>
    `;

    tr.addEventListener("click", () => {
      editId = id;

      hvTen.value = item.hocvien || "";
      hvMon.value = item.mon || "";
      hvThang.value = item.thang || "";
      hvThanhTich.value = item.thanhtich || "";
      hvLop.value = item.lop || "";

      currentImg = item.img || "";
      renderAvatar(currentImg);

      btnThem.style.display = "none";
      btnLuu.style.display = "inline-block";
      btnXoa.style.display = "inline-block";
    });

    hvTable.appendChild(tr);
  });
}

/* =========================
   DELETE
========================= */
async function deleteData() {
  if (!editId) return;
  if (!confirm("Xóa chứng nhận học viên này?")) return;

  await writeData(`tieubieu/chungchihv/${editId}`, null);
  showToast("Đã xóa");
  clearForm();
  await loadTable();
}

/* =========================
   INIT
========================= */
export async function init() {
  getDOM();
  if (!btnThem) return;

  await loadClasses();   // phải load lớp trước
  await loadSubjects();
  await loadStudents();  // rồi mới load học viên

  bindStudentChange();
  await loadTable();

  btnThem.addEventListener("click", () => saveData(false));
  btnLuu.addEventListener("click", () => saveData(true));
  btnXoa.addEventListener("click", deleteData);
}