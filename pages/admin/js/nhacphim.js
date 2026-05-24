import { readData, writeData } 
from "../../../scripts/services/firebaseService.js";

/* ========= BIẾN ========= */
let nhacTheLoai, nhacTen, nhacLink;
let nhacTable, btnThem, btnLuu, btnXoa;
let nhacImgFile, nhacImgPreview, btnXoaAnh;

let currentImg = "";
let theLoaiMap = {};
let editId = null;

/* ========= DOM ========= */
function getDOM() {
  nhacImgFile    = document.getElementById("nhacImgFile");
  nhacImgPreview = document.getElementById("nhacImgPreview");
  btnXoaAnh      = document.getElementById("btnXoaAnh");

  nhacTheLoai = document.getElementById("nhacTheLoai");
  nhacTen     = document.getElementById("nhacTen");
  nhacLink    = document.getElementById("nhacLink");
  nhacTable   = document.getElementById("nhacTable");

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
  nhacTheLoai.value = "";
  nhacTen.value = "";
  nhacLink.value = "";

  currentImg = "";
  nhacImgFile.value = "";
  nhacImgPreview.src = "";
  nhacImgPreview.style.display = "none";
  btnXoaAnh.style.display = "none";

  editId = null;
  btnThem.style.display = "inline-block";
  btnLuu.style.display  = "none";
  btnXoa.style.display  = "none";
}

/* ========= LOAD THỂ LOẠI ========= */
async function loadTheLoai() {
  const data = await readData("config/danh_muc/theloainhac");

  nhacTheLoai.innerHTML = `<option value="">-- chọn thể loại --</option>`;
  theLoaiMap = {};

  if (!data) return;

  Object.entries(data).forEach(([id, t]) => {
    theLoaiMap[id] = t.name;
    nhacTheLoai.innerHTML += `
      <option value="${id}">${t.name}</option>
    `;
  });
}

/* ========= ẢNH: CHỌN FILE ========= */
function bindImageEvents() {
  nhacImgFile.onchange = () => {
    const file = nhacImgFile.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      currentImg = e.target.result;
      nhacImgPreview.src = currentImg;
      nhacImgPreview.style.display = "block";
      btnXoaAnh.style.display = "inline-block";
    };
    reader.readAsDataURL(file);
  };

  btnXoaAnh.onclick = () => {
    currentImg = "";
    nhacImgFile.value = "";
    nhacImgPreview.src = "";
    nhacImgPreview.style.display = "none";
    btnXoaAnh.style.display = "none";
  };
}

/* ========= THÊM SÁCH ========= */
async function themNhac() {
  if (!nhacTen.value || !nhacLink.value || !nhacTheLoai.value) {
    showToast("Thiếu thông tin", "error");
    return;
  }

  const id = "nhac_" + Date.now();

  await writeData(`nhactailieu/nhac/${id}`, {
    img: currentImg || "",
    theloai: nhacTheLoai.value,
    ten: nhacTen.value,
    link: nhacLink.value,
    created_at: Date.now()
  });

  clearForm();
  await loadNhacTable();
  showToast("Đã thêm Nhạc - Phim");
}

/* ========= LƯU (SỬA) ========= */
async function luuNhac() {
  if (!editId) return;

  await writeData(`nhactailieu/nhac/${editId}`, {
    img: currentImg || "",
    theloai: nhacTheLoai.value,
    ten: nhacTen.value,
    link: nhacLink.value,
    updated_at: Date.now()
  });

  clearForm();
  await loadNhacTable();
  showToast("Đã cập nhật sách");
}

/* ========= XOÁ ========= */
async function xoaNhac() {
  if (!editId) return;
  if (!confirm("Xóa Nhạc - Phim này?")) return;

  await writeData(`nhactailieu/nhac/${editId}`, null);

  clearForm();
  await loadNhacTable();
  showToast("Đã xóa Nhạc - Phim");
}

/* ========= LOAD TABLE ========= */
async function loadNhacTable() {
  nhacTable.innerHTML = "";
  const data = await readData("nhactailieu/nhac");
  if (!data) return;

  let stt = 1;

  Object.entries(data).forEach(([id, n]) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${stt++}</td>
      <td>
        ${n.img ? `<img src="${n.img}" style="width:40px;height:auto">` : ""}
      </td>
      <td>${n.ten}</td>
      <td>
        <a href="${n.link}" target="_blank">Mở</a>
      </td>
    `;

    tr.onclick = () => {
      editId = id;

      nhacTheLoai.value = n.theloai || "";
      nhacTen.value     = n.ten || "";
      nhacLink.value    = n.link || "";

      currentImg = n.img || "";
      if (currentImg) {
        nhacImgPreview.src = currentImg;
        nhacImgPreview.style.display = "block";
        btnXoaAnh.style.display = "inline-block";
      } else {
        nhacImgPreview.style.display = "none";
        btnXoaAnh.style.display = "none";
      }

      btnThem.style.display = "none";
      btnLuu.style.display  = "inline-block";
      btnXoa.style.display  = "inline-block";
    };

    nhacTable.appendChild(tr);
  });
}

/* ========= INIT ========= */
export async function init() {

  getDOM();

  if (!btnThem || !nhacImgFile) {
    console.warn("nhacphim.js: DOM chưa sẵn sàng");
    return;
  }

  bindImageEvents();

  // LOAD THỂ LOẠI
  await loadTheLoai();

  // LOAD TABLE
  await loadNhacTable();

  // BUTTON
  btnThem.onclick = themNhac;
  btnLuu.onclick  = luuNhac;
  btnXoa.onclick  = xoaNhac;

}

window.addEventListener("DOMContentLoaded", init);