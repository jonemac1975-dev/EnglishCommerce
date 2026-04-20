import { readData, writeData, updateData } 
from "../../../scripts/services/firebaseService.js";

/* ========= PATH ========= */
const PATH_THU = "/config/account/thuhocphi";
const PATH_STUDENTS = "/users/students";

/* ========= DOM ========= */
let soPhieu, ngayThu, hocVien, noiDung;
let soTien, giam, phaiThu, bangChu;
let bangThu, btnThem, btnLuu, btnIn;
let hinhThuc, tienPhaiThuHV;

/* ========= STATE ========= */
let currentEditId = null;

/* ========= INIT ========= */
export async function init() {
  soPhieu   = document.getElementById("soPhieu");
  ngayThu   = document.getElementById("ngayThu");
  hocVien   = document.getElementById("hocVien");
  noiDung   = document.getElementById("noiDung");
  soTien    = document.getElementById("soTien");
  giam      = document.getElementById("giam");
  phaiThu   = document.getElementById("phaiThu");
  bangChu   = document.getElementById("bangChu");

  bangThu   = document.getElementById("bangThu");
  btnThem   = document.getElementById("btnThem");
  btnLuu    = document.getElementById("btnLuu");
  btnIn     = document.getElementById("btnIn");
  hinhThuc = document.getElementById("hinhThuc");
  tienPhaiThuHV = document.getElementById("tienPhaiThuHV");



  await loadHocVien();
  await loadBangThu();

  soTien.oninput = tinhTien;
  giam.oninput   = tinhTien;
  hocVien.onchange = onChonHocVien;

  btnThem.onclick = themMoi;
  btnLuu.onclick  = luuCapNhat;
  btnIn.onclick   = () => window.print();
soPhieu.value = await taoSoPhieuMoi();

}

/* ========= LOAD HỌC VIÊN ========= */
async function loadHocVien() {
  const data = await readData(PATH_STUDENTS);
  hocVien.innerHTML = `<option value="">-- Chọn học viên --</option>`;

  if (!data) return;

  Object.entries(data).forEach(([id, hv]) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = hv.profile?.ho_ten || id;
    hocVien.appendChild(opt);
  });
}

/* ========= LOAD HỌC VIÊN ĐÃ ĐỐNG PHÍ ========= */
async function onChonHocVien() {
  const hvId = hocVien.value;
  if (!hvId) return;

  const hv = await readData(`/users/students/${hvId}`);
  if (!hv) return;

  // hình thức đóng phí (để kế toán xem nhanh)
  hinhThuc.value = hv.profile?.hinh_thuc_dong_phi || "";

  let tong = 0;
  let hocphiIds = [];

  // 🔑 tháng đang thu (yyyy-mm)
  const thangThu = ngayThu.value?.slice(0, 7);

  if (hv.hocphi && thangThu) {
    Object.entries(hv.hocphi).forEach(([id, hp]) => {
      if (
        hp.status !== "paid" &&
        hp.month === thangThu
      ) {
        tong += Number(hp.so_tien || 0);
        hocphiIds.push(id);
      }
    });
  }

  tienPhaiThuHV.value = tong;

  if (tong === 0) {
    showToast("⚠️ Học viên đã đóng đủ học phí tháng này", "info");
  }

  // gắn cứng danh sách học phí cho phiếu thu
  tienPhaiThuHV.dataset.hocphi = JSON.stringify(hocphiIds);

  // gợi ý cho kế toán
  soTien.value = tong;
  tinhTien();
}


/* ========= XÓA - SỬA PHIẾU THU ========= */
async function rollbackHocPhi(phieu) {
  if (!phieu?.hocphiIds) return;

  for (const hpId of phieu.hocphiIds) {
    await updateData(
      `/users/students/${phieu.hocVienId}/hocphi/${hpId}`,
      {
        status: "unpaid",
        phieu: null,
        ngay_thu: null
      }
    );
  }
}

/* ========= LOAD BẢNG ========= */
async function loadBangThu() {
  const data = await readData(PATH_THU);
  bangThu.innerHTML = "";
  if (!data) return;

  let stt = 1;

  Object.entries(data).forEach(([id, item]) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${stt++}</td>
      <td>${item.soPhieu}</td>
      <td>${item.ngayThu}</td>
      <td>${item.hocVienText}</td>
      <td>${item.noiDung}</td>
      <td>${formatMoney(item.phaiThu)}</td>
      <td><button class="btn-xoa">Xóa</button></td>
    `;

    tr.onclick = () => fillForm(id, item);

    tr.querySelector(".btn-xoa").onclick = async (e) => {
      e.stopPropagation();
      if (!confirm("Xóa phiếu thu?")) return;
      await xoaPhieu(id);
    };

    bangThu.appendChild(tr);
  });
}

/* ========= FORM ========= */
function fillForm(id, item) {
  currentEditId = id;
  soPhieu.value = item.soPhieu;
  ngayThu.value = item.ngayThu;
  hocVien.value = item.hocVienId;
  noiDung.value = item.noiDung;
  soTien.value  = item.soTien;
  giam.value    = item.giam;
  tinhTien();
}

async function cleanForm() {
  currentEditId = null;
  ngayThu.value = "";
  hocVien.value = "";
  noiDung.value = "";
  soTien.value  = "";
  giam.value    = "";
  phaiThu.value = "";
  bangChu.value = "";

  soPhieu.value = await getNextSoPhieu(); // ⭐ auto số mới
taoSoPhieuMoi().then(v => soPhieu.value = v);

}


/* ========= UTIL ========= */
function tinhTien() {
  const t = Number(soTien.value || 0);
  const g = Number(giam.value || 0);
  const p = t - g;
  phaiThu.value = p;
  bangChu.value = soThanhChu(p);
}

function formatMoney(n) {
  return Number(n || 0).toLocaleString("vi-VN");
}

function soThanhChu(n) {
  return n.toLocaleString("vi-VN") + " đồng";
}

/* ========= TẠO SỐ PHIẾU MỚI ========= */
async function taoSoPhieuMoi() {

  const data = await readData(PATH_THU);

  if (!data) return "PT001";

  let max = 0;

  Object.values(data).forEach(p => {
    if (!p.soPhieu) return;

    const num = parseInt(p.soPhieu.replace("PT", ""));
    if (!isNaN(num) && num > max) {
      max = num;
    }
  });

  const next = max + 1;
  return "PT" + String(next).padStart(3, "0");
}

/* ========= LẤY SỐ TIẾP THEO ========= */
async function getNextSoPhieu() {
  const data = await readData(PATH_THU);
  if (!data) return "PT001";

  let max = 0;

  Object.values(data).forEach(p => {
    const num = parseInt(p.soPhieu?.replace(/\D/g, "")) || 0;
    if (num > max) max = num;
  });

  const next = max + 1;
  return "PT" + String(next).padStart(3, "0");
}



async function isSoPhieuExist(so, ignoreId=null) {
  const data = await readData(PATH_THU);
  if (!data) return false;

  return Object.entries(data).some(([id, p]) => {
    if (ignoreId && id === ignoreId) return false;
    return p.soPhieu === so;
  });
}

/* ========= LOAD PHIẾU THU ========= */
function getPayload() {
  return {
    soPhieu: soPhieu.value,
    ngayThu: ngayThu.value,
    hocVienId: hocVien.value,
    hocVienText: hocVien.options[hocVien.selectedIndex]?.text || "",
    noiDung: noiDung.value,
    soTien: Number(soTien.value || 0),
    giam: Number(giam.value || 0),
    phaiThu: Number(phaiThu.value || 0),
    hocphiIds: JSON.parse(tienPhaiThuHV.dataset.hocphi || "[]"),
    createdAt: Date.now()
  };
}

/* ========= ACTION ========= */
async function themMoi() {

  if (!soPhieu.value) {
    soPhieu.value = await getNextSoPhieu();
  }

  const data = getPayload();

  if (!data.hocVienId) {
    showToast("Chưa chọn học viên");
    return;
  }

  // ❌ Check trùng
  if (await isSoPhieuExist(data.soPhieu)) {
    showToast("❌ Trùng số phiếu!", "error");
    return;
  }

  const id = crypto.randomUUID();
  await writeData(`${PATH_THU}/${id}`, data);

  // cập nhật trạng thái học phí
  for (const hpId of data.hocphiIds) {
    await updateData(
      `/users/students/${data.hocVienId}/hocphi/${hpId}`,
      {
        status: "paid",
        phieu: data.soPhieu,
        ngay_thu: data.ngayThu
      }
    );
  }

  showToast("✅ Đã thêm phiếu thu");
  cleanForm();
  loadBangThu();
soPhieu.value = await taoSoPhieuMoi();

}



/* ========= LƯU CẬP NHẬT ========= */
async function luuCapNhat() {
  if (!currentEditId) {
    showToast("Chưa chọn phiếu");
    return;
  }

  const oldPhieu = await readData(`${PATH_THU}/${currentEditId}`);
  if (!oldPhieu) return;

  // ❗ KHÔNG rollback học phí
  // ❗ KHÔNG cập nhật lại status

  const newData = {
    ...oldPhieu, // giữ nguyên hocphiIds
    soPhieu: soPhieu.value,
    ngayThu: ngayThu.value,
    noiDung: noiDung.value,
    soTien: Number(soTien.value || 0),
    giam: Number(giam.value || 0),
    phaiThu: Number(phaiThu.value || 0),
    updatedAt: Date.now()
  };

if (await isSoPhieuExist(soPhieu.value, currentEditId)) {
  showToast("❌ Trùng số phiếu!", "error");
  return;
}

  await writeData(`${PATH_THU}/${currentEditId}`, newData);

  showToast("💾 Đã cập nhật phiếu thu");
  cleanForm();
  loadBangThu();
}

/* ========= XÓA + ROLLBACK ========= */
async function xoaPhieu(id) {
  const phieu = await readData(`${PATH_THU}/${id}`);
  if (!phieu) return;

  // rollback học phí nếu có
  if (phieu.hocphiIds) {
  for (const hpId of phieu.hocphiIds) {
    await updateData(
      `/users/students/${phieu.hocVienId}/hocphi/${hpId}`,
      {
        status: "unpaid",
        phieu: null,
        ngay_thu: null
      }
    );
  }
}

  await writeData(`${PATH_THU}/${id}`, null);
  showToast("🗑️ Đã xóa phiếu thu");

  cleanForm();
  loadBangThu();
}

