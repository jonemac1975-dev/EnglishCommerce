import { readData, writeData } 
from "../../../scripts/services/firebaseService.js";

/* ========= BIẾN ========= */
let tsTieuDe, tsLink;
let table, btnThem, btnLuu, btnXoa;
let editId = null;

/* ========= DOM ========= */
function getDOM() {
  tsTieuDe = document.getElementById("tsTieuDe");
  tsLink   = document.getElementById("tsLink");
  table    = document.getElementById("thoisuTable");

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
  tsTieuDe.value = "";
  tsLink.value   = "";
  editId = null;

  btnThem.style.display = "inline-block";
  btnLuu.style.display  = "none";
  btnXoa.style.display  = "none";
}

/* ========= THÊM ========= */
async function themThoiSu() {
  if (!tsTieuDe.value) {
    showToast("Thiếu tiêu đề", "error");
    return;
  }

  const id = "thoisu_" + Date.now();

  await writeData(`thoisuhoatdong/thoisu/${id}`, {
    tieuDe: tsTieuDe.value,
    link: tsLink.value,
    created_at: Date.now()
  });

  clearForm();
  await loadTable();
  showToast("Đã thêm thời sự");
}

/* ========= LƯU ========= */
async function luuThoiSu() {
  if (!editId) return;

  await writeData(`thoisuhoatdong/thoisu/${editId}`, {
    tieuDe: tsTieuDe.value,
    link: tsLink.value,
    updated_at: Date.now()
  });

  clearForm();
  await loadTable();
  showToast("Đã cập nhật");
}

/* ========= XOÁ ========= */
async function xoaThoiSu() {
  if (!editId) return;
  if (!confirm("Xóa mục này?")) return;

  await writeData(`thoisuhoatdong/thoisu/${editId}`, null);

  clearForm();
  await loadTable();
  showToast("Đã xóa");
}

/* ========= LOAD TABLE ========= */
async function loadTable() {
  table.innerHTML = "";
  const data = await readData("thoisuhoatdong/thoisu");
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
      tsTieuDe.value = d.tieuDe || "";
      tsLink.value   = d.link || "";

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
    console.warn("thoisu.js: DOM chưa sẵn sàng");
    return;
  }

  await loadTable();

  btnThem.onclick = themThoiSu;
  btnLuu.onclick  = luuThoiSu;
  btnXoa.onclick  = xoaThoiSu;
}
