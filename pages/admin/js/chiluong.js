import { readData, writeData, updateData }
from "../../../scripts/services/firebaseService.js";

/* ========= PATH ========= */
const PATH_CHI = "config/account/chiluong";
const PATH_TEACHER = "teacher";
const PATH_TEACHER_PROFILE = "users/teachers";

/* ========= DOM ========= */
let soPhieu, ngayChi, kyLuong, giaoVien;
let noiDung, soTien, bangChu;
let bangChi, tongTienEl;
let btnThem, btnLuu, btnIn;

/* ========= STATE ========= */
let currentEditId = null;

/* ========= INIT ========= */
export async function init() {

  soPhieu   = document.getElementById("soPhieu");
  ngayChi   = document.getElementById("ngayChi");
  kyLuong   = document.getElementById("kyLuong");
  giaoVien  = document.getElementById("giaoVien");
  noiDung   = document.getElementById("noiDung");
  soTien    = document.getElementById("soTien");
  bangChu   = document.getElementById("bangChu");

  bangChi   = document.getElementById("bangChi");
  tongTienEl= document.getElementById("tongTien");

  btnThem   = document.getElementById("btnThem");
  btnLuu    = document.getElementById("btnLuu");
  btnIn     = document.getElementById("btnIn");

  if (!soPhieu) return; // tránh load lỗi khi chưa render html

  ngayChi.valueAsDate = new Date();
  kyLuong.value = new Date().toISOString().slice(0,7);

  await loadGiaoVienTheoThang(kyLuong.value);
  await loadBang();

  kyLuong.onchange  = async () => {
    await loadGiaoVienTheoThang(kyLuong.value);
    tinhLuong();
  };

  giaoVien.onchange = tinhLuong;

  btnThem.onclick = themPhieu;
  btnLuu.onclick  = luuCapNhat;
  btnIn.onclick   = () => window.print();
  soPhieu.value = await taoSoPhieuMoi();

}

/* ========= LOAD GIÁO VIÊN ========= */
async function loadGiaoVienTheoThang(monthKey) {

  const teachers = await readData(PATH_TEACHER);
  giaoVien.innerHTML = `<option value="">-- Chọn giáo viên --</option>`;
  if (!teachers) return;

  for (const [gvId, gvData] of Object.entries(teachers)) {

    if (!gvData.luong) continue;

    const conLuong = Object.values(gvData.luong).some(l =>
      l.monthKey === monthKey && !l.paid
    );

    if (!conLuong) continue;

    const profile = await readData(`${PATH_TEACHER_PROFILE}/${gvId}/profile`);
    const ten = profile?.ho_ten || gvId;

    const opt = document.createElement("option");
    opt.value = gvId;
    opt.textContent = ten;

    giaoVien.appendChild(opt);
  }
}

/* ========= TÍNH LƯƠNG ========= */
async function tinhLuong() {

  const gvId = giaoVien.value;
  const monthKey = kyLuong.value;
  if (!gvId || !monthKey) return;

  const gv = await readData(`${PATH_TEACHER}/${gvId}`);
  if (!gv?.luong) return;

  let tong = 0;
  let luongIds = [];

  Object.entries(gv.luong).forEach(([id, l]) => {
    if (l.monthKey === monthKey && !l.paid) {
      tong += Number(l.soTien || 0);
      luongIds.push(id);
    }
  });

  soTien.value = tong;
  bangChu.value = soThanhChu(tong);
  soTien.dataset.luong = JSON.stringify(luongIds);

  const [year, month] = monthKey.split("-");
  noiDung.value = `Chi lương tháng ${month}/${year}`;
}

/* ========= THÊM ========= */
async function themPhieu() {
const all = await readData(PATH_CHI);
if (all) {
  const trung = Object.values(all)
    .some(p => p.soPhieu === soPhieu.value);

  if (trung) {
    showToast("Số phiếu đã tồn tại");
    soPhieu.value = await taoSoPhieuMoi();
    return;
  }
}

  const gvId = giaoVien.value;
  if (!gvId) return showToast("Chọn giáo viên");


  const id = crypto.randomUUID();

  const data = {
    soPhieu: soPhieu.value,
    ngayChi: ngayChi.value,
    monthKey: kyLuong.value,
    giaoVienId: gvId,
    giaoVienText: giaoVien.options[giaoVien.selectedIndex]?.text || gvId,
    noiDung: noiDung.value,
    soTien: Number(soTien.value || 0),
    luongIds: JSON.parse(soTien.dataset.luong || "[]"),
    createdAt: Date.now()
  };

  await writeData(`${PATH_CHI}/${id}`, data);

  for (const lid of data.luongIds) {
    await updateData(`${PATH_TEACHER}/${gvId}/luong/${lid}`, {
      paid: true,
      phieu: data.soPhieu,
      ngay_chi: data.ngayChi
    });
  }
showToast("Đã thêm");
  cleanForm();
  await loadBang();
  soPhieu.value = await taoSoPhieuMoi();

}

/* ========= LOAD BẢNG ========= */
async function loadBang() {

  const data = await readData(PATH_CHI);
  bangChi.innerHTML = "";

  let stt = 1;
  let tong = 0;

  if (!data) {
    tongTienEl.textContent = "0";
    return;
  }

  Object.entries(data).forEach(([id, p]) => {

    tong += Number(p.soTien || 0);

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${stt++}</td>
      <td>${p.soPhieu}</td>
      <td>${p.ngayChi}</td>
      <td>${p.giaoVienText}</td>
      <td>${p.noiDung}</td>
      <td>${formatMoney(p.soTien)}</td>
      <td><button class="btn-xoa">Xóa</button></td>
    `;

    tr.onclick = () => fillForm(id, p);

    tr.querySelector(".btn-xoa").onclick = async (e) => {
      e.stopPropagation();
      if (!confirm("Xóa phiếu chi?")) return;
      await xoaPhieu(id);
    };

    bangChi.appendChild(tr);
  });

  tongTienEl.textContent = formatMoney(tong);
}

/* ========= XÓA ========= */
async function xoaPhieu(id) {

  const p = await readData(`${PATH_CHI}/${id}`);
  if (!p) return;

  for (const lid of p.luongIds || []) {
    await updateData(`${PATH_TEACHER}/${p.giaoVienId}/luong/${lid}`, {
      paid: false,
      phieu: null,
      ngay_chi: null
    });
  }

  await writeData(`${PATH_CHI}/${id}`, null);
showToast("Đã xóa");
  await loadBang();
}

/* ========= LƯU ========= */
async function luuCapNhat() {

  if (!currentEditId) {
    showToast("Chưa chọn phiếu để sửa");
    return;
  }

  const old = await readData(`${PATH_CHI}/${currentEditId}`);
  if (!old) return;

  const newData = {
    ...old,   // 🔥 giữ nguyên luongIds, giáo viên
    soPhieu: soPhieu.value,
    ngayChi: ngayChi.value,
    noiDung: noiDung.value,
    soTien: Number(soTien.value || 0),
    updatedAt: Date.now()
  };

  await writeData(`${PATH_CHI}/${currentEditId}`, newData);

  showToast("Đã cập nhật");

  cleanForm();
  await loadBang();
}

/* ========= UTIL ========= */
function formatMoney(n) {
  return Number(n || 0).toLocaleString("vi-VN");
}

function soThanhChu(n) {
  return Number(n || 0).toLocaleString("vi-VN") + " đồng";
}


/* ========= TẠO SỐ PHIẾU MỚI ========= */
async function taoSoPhieuMoi() {

  const data = await readData(PATH_CHI);

  if (!data) {
    return "PC001";
  }

  let max = 0;

  Object.values(data).forEach(p => {
    if (!p.soPhieu) return;

    const num = parseInt(p.soPhieu.replace("PC", ""));
    if (!isNaN(num) && num > max) {
      max = num;
    }
  });

  const next = max + 1;
  return "PC" + String(next).padStart(3, "0");
}


function cleanForm() {

  currentEditId = null;

  soPhieu.value = "";
  noiDung.value = "";
  soTien.value  = "";
  bangChu.value = "";
  giaoVien.value = "";

  giaoVien.disabled = false;
  kyLuong.disabled = false;
}



function fillForm(id, p) {

  currentEditId = id;

  soPhieu.value  = p.soPhieu;
  ngayChi.value  = p.ngayChi;
  kyLuong.value  = p.monthKey;
  giaoVien.value = p.giaoVienId;
  noiDung.value  = p.noiDung;
  soTien.value   = p.soTien;
  bangChu.value  = soThanhChu(p.soTien);

  // 🔥 khóa không cho đổi GV & tháng khi đang sửa
  giaoVien.disabled = true;
  kyLuong.disabled = true;

  // giữ lại danh sách lương cũ
  soTien.dataset.luong = JSON.stringify(p.luongIds || []);
}