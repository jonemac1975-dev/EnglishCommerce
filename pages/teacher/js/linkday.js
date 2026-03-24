import { readData, writeData } from "../../../scripts/services/firebaseService.js";

const teacherId = localStorage.getItem("teacher_id");
if (!teacherId) location.href = "../../index.html";

let currentEditId = null;
let lopNameMap = {}; // map id lớp -> tên lớp

// ===== DOM ELEMENTS =====
const link_made = document.getElementById("link_made");
const linkLop = document.getElementById("linkLop");
const btnAdd = document.getElementById("btnAdd");
const btnSave = document.getElementById("btnSave");
const test_list = document.getElementById("test_list");

// ================= INIT =================
export async function init() {
  btnAdd.addEventListener("click", addLink);
  btnSave.addEventListener("click", saveLink);

  await loadLinkLop();  // load dropdown lớp trước
  await loadList();     // load danh sách link
}

// ================= LOAD LỚP =================
async function loadLinkLop() {
  if (!linkLop) return;

  const data = await readData("config/danh_muc/lop");
  if (!data) return;

  linkLop.innerHTML = `<option value="">Chọn lớp</option>`;
  lopNameMap = {};

  Object.entries(data).forEach(([id, item]) => {
    lopNameMap[id] = item.name || id;

    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = item.name || id;
    linkLop.appendChild(opt);
  });
}

// ================= GET FORM DATA =================
function getFormData() {
  return {
    made: link_made.value.trim(),
    lop: linkLop.value,
    updatedAt: Date.now()
  };
}

// ================= CLEAR FORM =================
function clearForm() {
  currentEditId = null;
  link_made.value = "";
  linkLop.value = "";
}

// ================= ADD LINK =================

async function addLink() {
  const data = getFormData();

  // kiểm tra link hợp lệ
  if (!/^https?:\/\/.*(zoom\.us|meet\.google\.com)/.test(data.made)) {
    return showToast("⚠️ Link không hợp lệ (chỉ Zoom/Meet)");
  }

  if (!data.made) return showToast("Chưa nhập link");
  if (!data.lop) return showToast("Chưa chọn lớp");

  const list = await readData(`teacher/${teacherId}/linkday`);
  if (list && Object.values(list).some(t => t.made === data.made)) {
    return showToast("⚠️ Link đã tồn tại");
  }

  const id = "link_" + Date.now();
  await writeData(`teacher/${teacherId}/linkday/${id}`, data);

  showToast("✅ Đã thêm link");
  clearForm();
  await loadList();
}
// ================= SAVE LINK =================
async function saveLink() {
  if (!currentEditId) return showToast("Chưa chọn link để sửa");

  const data = getFormData();
  await writeData(`teacher/${teacherId}/linkday/${currentEditId}`, data);

  showToast("💾 Đã lưu thay đổi");
  clearForm();
  await loadList();
}

// ================= LOAD LIST =================
async function loadList() {
  if (!test_list) return;

  test_list.innerHTML = "";
  const data = await readData(`teacher/${teacherId}/linkday`);
  if (!data) return;

  let i = 1;
  Object.entries(data).forEach(([id, item]) => {
    const tr = document.createElement("tr");
    const tenLop = lopNameMap[item.lop] || item.lop || "";

    tr.innerHTML = `
      <td>${i++}</td>
      <td>${item.made}</td>
      <td>${tenLop}</td>
      <td>
        <button class="edit-btn" data-id="${id}">Sửa</button>
        <button class="delete-btn" data-id="${id}">Xóa</button>
        <button class="preview-btn" data-id="${id}">Preview</button>
      </td>
    `;
    test_list.appendChild(tr);
  });

  // gắn sự kiện cho các nút
  test_list.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => editLink(btn.dataset.id));
  });
  test_list.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteLink(btn.dataset.id));
  });
  test_list.querySelectorAll(".preview-btn").forEach(btn => {
    btn.addEventListener("click", () => previewLink(btn.dataset.id));
  });
}

// ================= EDIT =================
async function editLink(id) {
  const d = await readData(`teacher/${teacherId}/linkday/${id}`);
  if (!d) return;

  currentEditId = id;
  link_made.value = d.made || "";
  linkLop.value = d.lop || "";
}

// ================= DELETE =================
async function deleteLink(id) {
  if (!confirm("Xóa link này?")) return;

  await writeData(`teacher/${teacherId}/linkday/${id}`, null);
  showToast("✅ Đã xóa link");

  await loadList();
}

// ================= PREVIEW =================
function previewLink(id) {
  readData(`teacher/${teacherId}/linkday/${id}`).then(d => {
    if (!d?.made) return showToast("Link trống");
    window.open(d.made, "_blank"); // mở tab mới
  });
}

// ================= TOAST HELPER =================
function showToast(msg) {
  alert(msg); // bạn có thể thay bằng toast UI khác
}