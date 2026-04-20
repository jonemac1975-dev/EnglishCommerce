import { readData, writeData, updateData }
from "../../../scripts/services/firebaseService.js";

/* ========= PATH ========= */
const MON_HOC_PATH = "/config/danh_muc/monhoc";
const GV_PATH      = "/users/teachers";
const PATH         = "/config/account/gialuonggv";

/* ========= DOM ========= */
let ngayCapNhat, monHoc, giaoVien, donGia;
let bangGia, btnThem, btnLuu;

/* ========= STATE ========= */
let currentEditId = null;

/* ========= INIT ========= */
export async function init() {
  ngayCapNhat = document.getElementById("ngayCapNhat");
  monHoc      = document.getElementById("monHoc");
  giaoVien    = document.getElementById("giaoVien");
  donGia      = document.getElementById("donGia");
  bangGia     = document.getElementById("bangGiaLuong");
  btnThem     = document.getElementById("btnThem");
  btnLuu      = document.getElementById("btnLuu");

  if (!bangGia) return;

  await loadMonHoc();
  await loadGiaoVien();
  await loadBangGia();

  btnThem.onclick = themMoi;
  btnLuu.onclick  = luuCapNhat;
}

/* ========= LOAD DROPDOWN ========= */
async function loadMonHoc() {
  const data = await readData(MON_HOC_PATH);
  monHoc.innerHTML = `<option value="">-- Chọn môn học --</option>`;
  if (!data) return;

  Object.entries(data).forEach(([id, v]) => {
    monHoc.innerHTML += `<option value="${id}">${v.name}</option>`;
  });
}

async function loadGiaoVien() {
  const data = await readData(GV_PATH);
  giaoVien.innerHTML = `<option value="">-- Chọn giáo viên --</option>`;
  if (!data) return;

  Object.entries(data).forEach(([id, v]) => {
    const name = v.profile?.ho_ten || id;
    giaoVien.innerHTML += `<option value="${id}">${name}</option>`;
  });
}

/* ========= LOAD TABLE ========= */
async function loadBangGia() {
  const data = await readData(PATH);
  bangGia.innerHTML = "";
  if (!data) return;

  let stt = 1;
  Object.entries(data).forEach(([id, item]) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${stt++}</td>
      <td>${item.giaoVienText}</td>
      <td>${item.monHocText}</td>
      <td>${formatMoney(item.donGia)}</td>
      <td>${formatDate(item.ngayCapNhat)}</td>
      <td><button class="btn-xoa">Xóa</button></td>
    `;

    tr.onclick = () => fillForm(id, item);

    tr.querySelector(".btn-xoa").onclick = async (e) => {
      e.stopPropagation();
      if (!confirm("Xóa đơn giá này?")) return;

      await updateData(PATH, { [id]: null });
      showToast("🗑️ Đã xóa giá tiết dạy", "info");
      cleanForm();
      loadBangGia();
    };

    bangGia.appendChild(tr);
  });
}

/* ========= FORM ========= */
function fillForm(id, item) {
  currentEditId        = id;
  ngayCapNhat.value    = item.ngayCapNhat || "";
  monHoc.value         = item.monHoc;
  giaoVien.value       = item.giaoVien;
  donGia.value         = item.donGia;
}

function cleanForm() {
  currentEditId     = null;
  ngayCapNhat.value = "";
  monHoc.value      = "";
  giaoVien.value    = "";
  donGia.value      = "";
}

/* ========= ACTION ========= */
async function themMoi() {
  const data = getFormData();
  if (!data.monHoc || !data.giaoVien || !data.donGia) {
    alert("Thiếu thông tin");
    return;
  }

  const id = crypto.randomUUID();
  await writeData(`${PATH}/${id}`, data);
  showToast("✅ Đã thêm giá tiết dạy");
  cleanForm();
  loadBangGia();
}

async function luuCapNhat() {
  if (!currentEditId) {
    alert("Chưa chọn dòng để lưu");
    return;
  }

  await writeData(`${PATH}/${currentEditId}`, getFormData());
  showToast("💾 Đã cập nhật giá tiết dạy");
  cleanForm();
  loadBangGia();
}

/* ========= UTIL ========= */
function getFormData() {
  return {
    ngayCapNhat: ngayCapNhat.value,
    monHoc: monHoc.value,
    monHocText: monHoc.options[monHoc.selectedIndex]?.text || "",
    giaoVien: giaoVien.value,
    giaoVienText: giaoVien.options[giaoVien.selectedIndex]?.text || "",
    donGia: Number(donGia.value || 0),
    updatedAt: Date.now()
  };
}

function formatMoney(num) {
  return Number(num || 0).toLocaleString("vi-VN");
}

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN");
}

