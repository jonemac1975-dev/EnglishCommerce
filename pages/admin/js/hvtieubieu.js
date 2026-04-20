import { readData, writeData }
from "../../../scripts/services/firebaseService.js";

/* ========= BIẾN ========= */
let hvTen, hvMon, hvThang, hvThanhTich;
let hvImgFile, hvImgPreview, btnXoaAnh;
let table, btnThem, btnLuu, btnXoa;

let hvMap = {}, monMap = {};
let currentImg = "", editId = null;

/* ========= DOM ========= */
function getDOM() {
  hvImgFile    = document.getElementById("hvImgFile");
  hvImgPreview = document.getElementById("hvImgPreview");
  btnXoaAnh    = document.getElementById("btnXoaAnh");

  hvTen        = document.getElementById("hvTen");
  hvMon        = document.getElementById("hvMon");
  hvThang      = document.getElementById("hvThang");
  hvThanhTich  = document.getElementById("hvThanhTich");

  table        = document.getElementById("hvTable");

  btnThem = document.getElementById("btnThem");
  btnLuu  = document.getElementById("btnLuu");
  btnXoa  = document.getElementById("btnXoa");
}

/* ========= TOAST ========= */
function showToast(msg, type="success") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove("show"), 2500);
}

/* ========= LOAD SELECT ========= */
async function loadSelect() {
  // ===== HỌC VIÊN =====
  const hv = await readData("users/students");
  hvTen.innerHTML = `<option value="">-- chọn học viên --</option>`;
  hvMap = {};

  if (hv) {
    Object.entries(hv).forEach(([id, v]) => {
      const name = v.profile?.ho_ten || id;
      hvMap[id] = name;
      hvTen.innerHTML += `<option value="${id}">${name}</option>`;
    });
  }

  // ===== MÔN HỌC =====
  const mon = await readData("config/danh_muc/monhoc");
  hvMon.innerHTML = `<option value="">-- chọn môn --</option>`;
  monMap = {};

  if (mon) {
    Object.entries(mon).forEach(([id, v]) => {
      monMap[id] = v.name || id;
      hvMon.innerHTML += `<option value="${id}">${v.name}</option>`;
    });
  }
}

/* ========= ẢNH ========= */
function bindImage() {
  hvImgFile.onchange = () => {
    const f = hvImgFile.files[0];
    if (!f) return;

    const r = new FileReader();
    r.onload = e => {
      currentImg = e.target.result;
      hvImgPreview.src = currentImg;
      hvImgPreview.style.display = "block";
      btnXoaAnh.style.display = "inline-block";
    };
    r.readAsDataURL(f);
  };

  btnXoaAnh.onclick = () => {
    currentImg = "";
    hvImgFile.value = "";
    hvImgPreview.style.display = "none";
    btnXoaAnh.style.display = "none";
  };
}

/* ========= CLEAR ========= */
function clearForm() {
  editId = null;
  hvThang.value = "";
  hvThanhTich.value = "";
  hvImgFile.value = "";
  hvImgPreview.style.display = "none";
  btnThem.style.display = "inline-block";
  btnLuu.style.display  = "none";
  btnXoa.style.display  = "none";
}

/* ========= SAVE ========= */
async function save(isEdit=false) {
  if (!hvTen.value || !hvMon.value || !hvThang.value) {
    showToast("Thiếu thông tin", "error");
    return;
  }

  const id = editId || ("hv_" + Date.now());

  await writeData(`tieubieu/hocvien/${id}`, {
    img: currentImg || "",
    hocvien: hvTen.value,
    mon: hvMon.value,
    thang: hvThang.value,
    thanhtich: hvThanhTich.value,
    updated_at: Date.now()
  });

  clearForm();
  await loadTable();
  showToast(isEdit ? "Đã cập nhật" : "Đã thêm");
}

/* ========= LOAD TABLE ========= */
async function loadTable() {
  table.innerHTML = "";
  const data = await readData("tieubieu/hocvien");
  if (!data) return;

  let stt = 1;

  Object.entries(data).forEach(([id, v]) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${stt++}</td>
      <td>${hvMap[v.hocvien] || ""}</td>
      <td>${monMap[v.mon] || ""}</td>
      <td>${v.thang || ""}</td>
      <td>${v.thanhtich || ""}</td>
    `;

    tr.onclick = () => {
      editId = id;

      hvTen.value       = v.hocvien;
      hvMon.value       = v.mon;
      hvThang.value     = v.thang;
      hvThanhTich.value = v.thanhtich || "";

      currentImg = v.img || "";
      if (currentImg) {
        hvImgPreview.src = currentImg;
        hvImgPreview.style.display = "block";
        btnXoaAnh.style.display = "inline-block";
      }

      btnThem.style.display = "none";
      btnLuu.style.display  = "inline-block";
      btnXoa.style.display  = "inline-block";
    };

    table.appendChild(tr);
  });
}

/* ========= INIT ========= */
export async function init() {
  getDOM();
  if (!btnThem) return;

  bindImage();
  await loadSelect();
  await loadTable();

  btnThem.onclick = () => save(false);
  btnLuu.onclick  = () => save(true);
  btnXoa.onclick  = async () => {
    if (!editId || !confirm("Xóa học viên tiêu biểu?")) return;
    await writeData(`tieubieu/hocvien/${editId}`, null);
    clearForm();
    loadTable();
    showToast("Đã xóa");
  };
}
