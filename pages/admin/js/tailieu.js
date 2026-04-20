import { readData, writeData } 
from "../../../scripts/services/firebaseService.js";

/* ========= BIẾN ========= */
let tlImgFile, tlImgPreview, btnXoaAnh;
let tlTheLoai, tlTen, tlLink;
let tailieuTable;
let btnThem, btnLuu, btnXoa;

let currentImg = "";
let editId = null;

let theLoaiMap = {};
/* ========= DOM ========= */
function getDOM() {
  tlImgFile     = document.getElementById("tlImgFile");
  tlImgPreview  = document.getElementById("tlImgPreview");
  btnXoaAnh     = document.getElementById("btnXoaAnh");

  tlTheLoai     = document.getElementById("tlTheLoai");
  tlTen         = document.getElementById("tlTen");
  tlLink        = document.getElementById("tlLink");

  tailieuTable  = document.getElementById("tailieuTable");

  btnThem = document.getElementById("btnThem");
  btnLuu  = document.getElementById("btnLuu");
  btnXoa  = document.getElementById("btnXoa");
}

/* ========= TOAST ========= */
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove("show"), 2500);
}

/* ========= CLEAR FORM ========= */
function clearForm() {
  tlTheLoai.value = "";
  tlTen.value = "";
  tlLink.value = "";

  currentImg = "";
  tlImgFile.value = "";
  tlImgPreview.src = "";
  tlImgPreview.style.display = "none";
  btnXoaAnh.style.display = "none";

  editId = null;
  btnThem.style.display = "inline-block";
  btnLuu.style.display  = "none";
  btnXoa.style.display  = "none";
}

/* ========= LOAD THỂ LOẠI ========= */
async function loadTheLoai() {
  const data = await readData("config/danh_muc/theloaisach");

  tlTheLoai.innerHTML = `<option value="">-- chọn thể loại --</option>`;
  theLoaiMap = {};

  if (!data) return;

  Object.entries(data).forEach(([id, t]) => {
    theLoaiMap[id] = t.name;
    tlTheLoai.innerHTML += `
      <option value="${id}">${t.name}</option>
    `;
  });
}

/* ========= ẢNH ========= */
function bindImageEvents() {
  tlImgFile.onchange = () => {
    const file = tlImgFile.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      currentImg = e.target.result;
      tlImgPreview.src = currentImg;
      tlImgPreview.style.display = "block";
      btnXoaAnh.style.display = "inline-block";
    };
    reader.readAsDataURL(file);
  };

  btnXoaAnh.onclick = () => {
    currentImg = "";
    tlImgFile.value = "";
    tlImgPreview.src = "";
    tlImgPreview.style.display = "none";
    btnXoaAnh.style.display = "none";
  };
}

/* ========= THÊM ========= */
async function themTaiLieu() {
  if (!tlTen.value || !tlLink.value || !tlTheLoai.value) {
    showToast("Thiếu thông tin", "error");
    return;
  }

  const id = "tl_" + Date.now();

  await writeData(`sachtailieu/tailieu/${id}`, {
    img: currentImg || "",
    theloai: tlTheLoai.value,
    ten: tlTen.value,
    link: tlLink.value,
    created_at: Date.now()
  });

  clearForm();
  await loadTable();
  showToast("Đã thêm tài liệu");
}

/* ========= LƯU ========= */
async function luuTaiLieu() {
  if (!editId) return;

  await writeData(`sachtailieu/tailieu/${editId}`, {
    img: currentImg || "",
    theloai: tlTheLoai.value,
    ten: tlTen.value,
    link: tlLink.value,
    updated_at: Date.now()
  });

  clearForm();
  await loadTable();
  showToast("Đã cập nhật tài liệu");
}

/* ========= XOÁ ========= */
async function xoaTaiLieu() {
  if (!editId) return;
  if (!confirm("Xóa tài liệu này?")) return;

  await writeData(`sachtailieu/tailieu/${editId}`, null);

  clearForm();
  await loadTable();
  showToast("Đã xóa tài liệu");
}

/* ========= LOAD TABLE ========= */
async function loadTable() {
  tailieuTable.innerHTML = "";
  const data = await readData("sachtailieu/tailieu");
  if (!data) return;

  let stt = 1;

  Object.entries(data).forEach(([id, t]) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${stt++}</td>
      <td>${t.img ? `<img src="${t.img}" style="width:40px">` : ""}</td>
      <td>${t.ten}</td>
      <td><a href="${t.link}" target="_blank">Mở</a></td>
    `;

    tr.onclick = () => {
      editId = id;

      tlTheLoai.value = t.theloai || "";
      tlTen.value     = t.ten || "";
      tlLink.value    = t.link || "";

      currentImg = t.img || "";
      if (currentImg) {
        tlImgPreview.src = currentImg;
        tlImgPreview.style.display = "block";
        btnXoaAnh.style.display = "inline-block";
      } else {
        tlImgPreview.style.display = "none";
        btnXoaAnh.style.display = "none";
      }

      btnThem.style.display = "none";
      btnLuu.style.display  = "inline-block";
      btnXoa.style.display  = "inline-block";
    };

    tailieuTable.appendChild(tr);
  });
}

/* ========= INIT ========= */
export async function init() {
  getDOM();

  if (!btnThem || !tlImgFile) {
    console.warn("tailieu.js: DOM chưa sẵn sàng");
    return;
  }

  bindImageEvents();

  await loadTheLoai();
  await loadTable();

  btnThem.onclick = themTaiLieu;
  btnLuu.onclick  = luuTaiLieu;
  btnXoa.onclick  = xoaTaiLieu;
}
