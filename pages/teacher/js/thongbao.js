import { readData, writeData } from "../../../scripts/services/firebaseService.js";

const teacherId = localStorage.getItem("teacher_id");
if (!teacherId) location.href = "../../index.html";

let currentEditId = null;
let lopNameMap = {}; // map id lớp -> tên lớp

// ===== DOM ELEMENTS =====
const tieude = document.getElementById("tieude");
const tbLop = document.getElementById("tbLop");
const btnAdd = document.getElementById("btnAdd");
const btnSave = document.getElementById("btnSave");
const test_list = document.getElementById("test_list");
const tbNoiDung = document.getElementById("tbNoiDung");

// ================= INIT =================
export async function init() {
  btnAdd.addEventListener("click", addthongbao);
  btnSave.addEventListener("click", savethongbao);

  await loadthongbaoLop();  // load dropdown lớp trước
  await loadList();     // load danh sách link
}

// ================= LOAD LỚP =================
async function loadthongbaoLop() {
  if (!tbLop) return;

  const data = await readData("config/danh_muc/lop");
  if (!data) return;

  tbLop.innerHTML = `<option value="">Chọn lớp</option>`;
  lopNameMap = {};

  Object.entries(data).forEach(([id, item]) => {
    lopNameMap[id] = item.name || id;

    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = item.name || id;
    tbLop.appendChild(opt);
  });
}

// ================= GET FORM DATA =================
function getFormData() {
  return {
    tieude: tieude.value.trim(),
    noidung: tbNoiDung.innerHTML,
    lop: tbLop.value,
    updatedAt: Date.now()
  };
}

// ================= CLEAR FORM =================
function clearForm() {
  currentEditId = null;
  tieude.value = "";
  tbLop.value = "";
  tbNoiDung.innerHTML = "";
}

// ================= ADD LINK =================

async function addthongbao() {
  const data = getFormData();
  
  if (!data.tieude) return showToast("Chưa nhập tiêu đề");
  if (!data.lop) return showToast("Chưa chọn lớp");

  const list = await readData(`teacher/${teacherId}/thongbao`);
  if (list && Object.values(list).some(t => t.tieude === data.tieude)) {
    return showToast("⚠️ tiêu đề đã tồn tại");
  }

  const id = "tb_" + Date.now();
  await writeData(`teacher/${teacherId}/thongbao/${id}`, data);

  showToast("✅ Đã thêm thông báo");
  clearForm();
  await loadList();
}
// ================= SAVE Thông Báo =================
async function savethongbao() {
  if (!currentEditId) return showToast("Chưa chọn thông báo để sửa");

  const data = getFormData();
  await writeData(`teacher/${teacherId}/thongbao/${currentEditId}`, data);

  showToast("💾 Đã lưu thay đổi");
  clearForm();
  await loadList();
}

// ================= LOAD LIST =================
async function loadList() {
  if (!test_list) return;

  test_list.innerHTML = "";

  const data = await readData(
    `teacher/${teacherId}/thongbao`
  );

  if (!data) {
    test_list.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center">
          Chưa có thông báo
        </td>
      </tr>
    `;
    return;
  }

  let i = 1;

  Object.entries(data)
    .sort((a, b) =>
      (b[1].updatedAt || 0) -
      (a[1].updatedAt || 0)
    )
    .forEach(([id, item]) => {

      const tr = document.createElement("tr");

      const ngay = item.updatedAt
        ? new Date(item.updatedAt)
            .toLocaleDateString("vi-VN")
        : "";

      const tenLop =
        lopNameMap[item.lop] ||
        item.lop ||
        "";

      const noiDungRutGon =
        (item.noidung || "")
          .replace(/<[^>]*>/g, "")
          .substring(0, 100);

      tr.innerHTML = `
        <td>${i++}</td>

        <td>${ngay}</td>

        <td>${tenLop}</td>

        <td>${item.tieude || ""}</td>

        <td>${noiDungRutGon}</td>

        <td>
          <button
            class="edit-btn"
            data-id="${id}">
            ✏️ Sửa
          </button>

          <button
            class="delete-btn"
            data-id="${id}">
            🗑️ Xóa
          </button>
        </td>
      `;

      test_list.appendChild(tr);
    });

  // ===== Nút sửa =====
  test_list
    .querySelectorAll(".edit-btn")
    .forEach(btn => {
      btn.addEventListener("click", () => {
        editthongbao(btn.dataset.id);
      });
    });

  // ===== Nút xóa =====
  test_list
    .querySelectorAll(".delete-btn")
    .forEach(btn => {
      btn.addEventListener("click", () => {
        deletethongbao(btn.dataset.id);
      });
    });
}

// ================= EDIT =================
async function editthongbao(id) {
  const d = await readData(`teacher/${teacherId}/thongbao/${id}`);
  if (!d) return;

  currentEditId = id;
  tieude.value = d.tieude || "";
tbNoiDung.innerHTML = d.noidung || "";
tbLop.value = d.lop || "";
}

// ================= DELETE =================
async function deletethongbao(id) {
  if (!confirm("Xóa thông báo này?")) return;

  await writeData(`teacher/${teacherId}/thongbao/${id}`, null);
  showToast("✅ Đã xóa thông báo");

  await loadList();
}


// ================= TOAST HELPER =================
function showToast(msg) {
  alert(msg); // bạn có thể thay bằng toast UI khác
}