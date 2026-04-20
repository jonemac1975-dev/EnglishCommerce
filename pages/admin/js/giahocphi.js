import { readData, writeData, updateData }
from "../../../scripts/services/firebaseService.js";

/* ========= PATH ========= */
const MON_HOC_PATH = "/config/danh_muc/monhoc";
const PATH = "/config/account/giahocphi";

/* ========= DOM ========= */
let ngayCapNhat, monHoc, soBuoi;
let gia1Thang, gia3Thang, gia6Thang;
let bangGia, btnThem, btnLuu;

/* ========= STATE ========= */
let currentEditId = null;

/* ========= INIT (BẮT BUỘC) ========= */
export async function init() {
  // cache DOM sau khi HTML đã được inject
  ngayCapNhat = document.getElementById("ngayCapNhat");
  monHoc      = document.getElementById("monHoc");
  soBuoi      = document.getElementById("soBuoi");
  gia1Thang   = document.getElementById("gia1Thang");
  gia3Thang   = document.getElementById("gia3Thang");
  gia6Thang   = document.getElementById("gia6Thang");
  bangGia     = document.getElementById("bangGiaHocPhi");
  btnThem     = document.getElementById("btnThem");
  btnLuu      = document.getElementById("btnLuu");

  if (!bangGia) return; // tab chưa sẵn sàng

  await loadMonHoc();
  await loadBangGia();

  btnThem.onclick = themMoi;
  btnLuu.onclick  = luuCapNhat;
}

/* ========= LOAD MÔN HỌC ========= */
async function loadMonHoc() {
  const data = await readData(MON_HOC_PATH);
  monHoc.innerHTML = `<option value="">-- Chọn môn --</option>`;

  if (!data) return;

  Object.entries(data).forEach(([id, item]) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = item.name;
    monHoc.appendChild(opt);
  });
}

/* ========= LOAD BẢNG GIÁ ========= */
async function loadBangGia() {
  const data = await readData(PATH);
  bangGia.innerHTML = "";
  if (!data) return;

  let stt = 1;

  Object.entries(data).forEach(([id, item]) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${stt++}</td>
      <td>${item.monHocText}</td>
      <td>${item.soBuoi}</td>
      <td>${formatMoney(item.gia1Thang)}</td>
      <td>${formatMoney(item.gia3Thang)}</td>
      <td>${formatMoney(item.gia6Thang)}</td>
      <td><button class="btn-xoa">Xóa</button></td>
    `;

    // chọn record để sửa
    tr.addEventListener("click", () => {
      fillForm(id, item);
    });

    // xóa record
    const btnXoa = tr.querySelector(".btn-xoa");
    btnXoa.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Xóa giá học phí này?")) return;

      await updateData(PATH, { [id]: null });
showToast("🗑️ Đã xóa giá học phí", "info");
      cleanForm();
      loadBangGia();
    });

    bangGia.appendChild(tr);
  });
}

/* ========= FORM ========= */
function fillForm(id, item) {
  currentEditId     = id;
  ngayCapNhat.value = item.ngayCapNhat || "";
  monHoc.value      = item.monHoc || "";
  soBuoi.value      = item.soBuoi || "";
  gia1Thang.value   = item.gia1Thang || "";
  gia3Thang.value   = item.gia3Thang || "";
  gia6Thang.value   = item.gia6Thang || "";
}

function cleanForm() {
  currentEditId     = null;
  ngayCapNhat.value = "";
  monHoc.value      = "";
  soBuoi.value      = "";
  gia1Thang.value   = "";
  gia3Thang.value   = "";
  gia6Thang.value   = "";
}

/* ========= UTIL ========= */
function formatMoney(num) {
  return Number(num || 0).toLocaleString("vi-VN");
}

function getFormData() {
  return {
    ngayCapNhat: ngayCapNhat.value,
    monHoc: monHoc.value,
    monHocText: monHoc.options[monHoc.selectedIndex]?.text || "",
    soBuoi: soBuoi.value,
    gia1Thang: Number(gia1Thang.value || 0),
    gia3Thang: Number(gia3Thang.value || 0),
    gia6Thang: Number(gia6Thang.value || 0),
    updatedAt: Date.now()
  };
}

/* ========= ACTION ========= */
async function themMoi() {
  const data = getFormData();
  if (!data.monHoc || !data.soBuoi) {
    showToast("Chưa chọn môn học hoặc số buổi");
    return;
  }

  const id = crypto.randomUUID();
  await writeData(`${PATH}/${id}`, data);
showToast("✅ Đã thêm giá học phí");
    cleanForm();
  loadBangGia();
}

async function luuCapNhat() {
  if (!currentEditId) {
    showToast("Chưa chọn dòng để lưu");
    return;
  }

  const data = getFormData();
  await writeData(`${PATH}/${currentEditId}`, data);
showToast("💾 Đã lưu thay đổi");
  cleanForm();
  loadBangGia();
}

