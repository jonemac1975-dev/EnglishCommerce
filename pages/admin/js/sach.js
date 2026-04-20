import { readData, writeData } 
from "../../../scripts/services/firebaseService.js";

/* ========= BIẾN ========= */
let sachTheLoai, sachTen, sachLink;
let sachTable, btnThem, btnLuu, btnXoa;
let sachImgFile, sachImgPreview, btnXoaAnh;

let currentImg = "";
let theLoaiMap = {};
let editId = null;

/* ========= DOM ========= */
function getDOM() {
  sachImgFile    = document.getElementById("sachImgFile");
  sachImgPreview = document.getElementById("sachImgPreview");
  btnXoaAnh      = document.getElementById("btnXoaAnh");

  sachTheLoai = document.getElementById("sachTheLoai");
  sachTen     = document.getElementById("sachTen");
  sachLink    = document.getElementById("sachLink");
  sachTable   = document.getElementById("sachTable");

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
  sachTheLoai.value = "";
  sachTen.value = "";
  sachLink.value = "";

  currentImg = "";
  sachImgFile.value = "";
  sachImgPreview.src = "";
  sachImgPreview.style.display = "none";
  btnXoaAnh.style.display = "none";

  editId = null;
  btnThem.style.display = "inline-block";
  btnLuu.style.display  = "none";
  btnXoa.style.display  = "none";
}

/* ========= LOAD THỂ LOẠI ========= */
async function loadTheLoai() {
  const data = await readData("config/danh_muc/theloaisach");

  sachTheLoai.innerHTML = `<option value="">-- chọn thể loại --</option>`;
  theLoaiMap = {};

  if (!data) return;

  Object.entries(data).forEach(([id, t]) => {
    theLoaiMap[id] = t.name;
    sachTheLoai.innerHTML += `
      <option value="${id}">${t.name}</option>
    `;
  });
}

/* ========= ẢNH: CHỌN FILE ========= */
function bindImageEvents() {
  sachImgFile.onchange = () => {
    const file = sachImgFile.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      currentImg = e.target.result;
      sachImgPreview.src = currentImg;
      sachImgPreview.style.display = "block";
      btnXoaAnh.style.display = "inline-block";
    };
    reader.readAsDataURL(file);
  };

  btnXoaAnh.onclick = () => {
    currentImg = "";
    sachImgFile.value = "";
    sachImgPreview.src = "";
    sachImgPreview.style.display = "none";
    btnXoaAnh.style.display = "none";
  };
}

/* ========= THÊM SÁCH ========= */
async function themSach() {
  if (!sachTen.value || !sachLink.value || !sachTheLoai.value) {
    showToast("Thiếu thông tin", "error");
    return;
  }

  const id = "sach_" + Date.now();

  await writeData(`sachtailieu/sach/${id}`, {
    img: currentImg || "",
    theloai: sachTheLoai.value,
    ten: sachTen.value,
    link: sachLink.value,
    created_at: Date.now()
  });

  clearForm();
  await loadSachTable();
  showToast("Đã thêm sách");
}

/* ========= LƯU (SỬA) ========= */
async function luuSach() {
  if (!editId) return;

  await writeData(`sachtailieu/sach/${editId}`, {
    img: currentImg || "",
    theloai: sachTheLoai.value,
    ten: sachTen.value,
    link: sachLink.value,
    updated_at: Date.now()
  });

  clearForm();
  await loadSachTable();
  showToast("Đã cập nhật sách");
}

/* ========= XOÁ ========= */
async function xoaSach() {
  if (!editId) return;
  if (!confirm("Xóa sách này?")) return;

  await writeData(`sachtailieu/sach/${editId}`, null);

  clearForm();
  await loadSachTable();
  showToast("Đã xóa sách");
}

/* ========= LOAD TABLE ========= */
async function loadSachTable() {
  sachTable.innerHTML = "";
  const data = await readData("sachtailieu/sach");
  if (!data) return;

  let stt = 1;

  Object.entries(data).forEach(([id, s]) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${stt++}</td>
      <td>
        ${s.img ? `<img src="${s.img}" style="width:40px;height:auto">` : ""}
      </td>
      <td>${s.ten}</td>
      <td>
        <a href="${s.link}" target="_blank">Mở</a>
      </td>
    `;

    tr.onclick = () => {
      editId = id;

      sachTheLoai.value = s.theloai || "";
      sachTen.value     = s.ten || "";
      sachLink.value    = s.link || "";

      currentImg = s.img || "";
      if (currentImg) {
        sachImgPreview.src = currentImg;
        sachImgPreview.style.display = "block";
        btnXoaAnh.style.display = "inline-block";
      } else {
        sachImgPreview.style.display = "none";
        btnXoaAnh.style.display = "none";
      }

      btnThem.style.display = "none";
      btnLuu.style.display  = "inline-block";
      btnXoa.style.display  = "inline-block";
    };

    sachTable.appendChild(tr);
  });
}

/* ========= INIT ========= */
export async function init() {
  getDOM();

  if (!btnThem || !sachImgFile) {
    console.warn("sach.js: DOM chưa sẵn sàng");
    return;
  }

  bindImageEvents();

  await loadTheLoai();
  await loadSachTable();

  btnThem.onclick = themSach;
  btnLuu.onclick  = luuSach;
  btnXoa.onclick  = xoaSach;
}
