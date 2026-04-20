import { readData, writeData } 
from "../../../scripts/services/firebaseService.js";

/* ========= BIẾN ========= */
let hdTieuDe, hdLink;
let table, btnThem, btnLuu, btnXoa;
let editId = null;

/* ========= DOM ========= */
function getDOM() {
  hdTieuDe = document.getElementById("hdTieuDe");
  hdLink   = document.getElementById("hdLink");
  table    = document.getElementById("hoatdongTable");

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

/* ========= CLEAR ========= */
function clearForm() {
  hdTieuDe.value = "";
  hdLink.value   = "";
  editId = null;

  btnThem.style.display = "inline-block";
  btnLuu.style.display  = "none";
  btnXoa.style.display  = "none";
}

/* ========= THÊM ========= */
async function themHoatDong() {
  if (!hdTieuDe.value) {
    showToast("Thiếu tiêu đề", "error");
    return;
  }

  const id = "hoatdong_" + Date.now();

  await writeData(`thoisuhoatdong/hoatdong/${id}`, {
    tieuDe: hdTieuDe.value,
    link: hdLink.value,
    created_at: Date.now()
  });

  clearForm();
  await loadTable();
  showToast("Đã thêm hoạt động");
}

/* ========= LƯU ========= */
async function luuHoatDong() {
  if (!editId) return;

  await writeData(`thoisuhoatdong/hoatdong/${editId}`, {
    tieuDe: hdTieuDe.value,
    link: hdLink.value,
    updated_at: Date.now()
  });

  clearForm();
  await loadTable();
  showToast("Đã cập nhật");
}

/* ========= XOÁ ========= */
async function xoaHoatDong() {
  if (!editId) return;
  if (!confirm("Xóa hoạt động này?")) return;

  await writeData(`thoisuhoatdong/hoatdong/${editId}`, null);

  clearForm();
  await loadTable();
  showToast("Đã xóa");
}

/* ========= LOAD TABLE ========= */
async function loadTable() {
  table.innerHTML = "";
  const data = await readData("thoisuhoatdong/hoatdong");
  if (!data) return;

  let stt = 1;

  Object.entries(data).forEach(([id, d]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${stt++}</td>
      <td>${d.tieuDe || ""}</td>
      <td>
        ${d.link ? `<a href="${d.link}" target="_blank">Mở</a>` : ""}
      </td>
    `;

    tr.onclick = () => {
      editId = id;
      hdTieuDe.value = d.tieuDe || "";
      hdLink.value   = d.link || "";

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

  if (!btnThem) {
    console.warn("hoatdong.js: DOM chưa sẵn sàng");
    return;
  }

  await loadTable();

  btnThem.onclick = themHoatDong;
  btnLuu.onclick  = luuHoatDong;
  btnXoa.onclick  = xoaHoatDong;
}
