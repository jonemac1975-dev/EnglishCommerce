import {
  readData,
  writeData,
  deleteData
} from "../../../scripts/services/firebaseService.js";

let editId = null;

let tdChude, tdNgay, tdThanhPhan, tdNoiDung, tdGmeet, tdZoom;

export async function init() {

  console.log("init link to adam");

  tdChude = document.getElementById("tdChude");
  tdNgay = document.getElementById("tdNgay");
  tdThanhPhan = document.getElementById("tdThanhPhan");
  tdNoiDung = document.getElementById("tdNoiDung");
  tdGmeet = document.getElementById("tdGmeet");
  tdZoom = document.getElementById("tdZoom");

  const btnThemTD = document.getElementById("btnThemTD");
  const btnLuuTD = document.getElementById("btnLuuTD");
document
  .getElementById("btnPreviewTD")
  ?.addEventListener("click", previewNoiDung);

  // ➕ THÊM MỚI
  btnThemTD?.addEventListener("click", addToaDam);

  // 💾 LƯU (UPDATE)
  btnLuuTD?.addEventListener("click", saveToaDam);

  await loadList();
}

async function addToaDam() {

  const id = "td_" + Date.now();

  const now = Date.now();

  const data = {
    ...getFormData(),

    createdAt: now,
    updatedAt: now
  };

  await writeData(
    `config/danh_muc/linktoadam/${id}`,
    data
  );

  alert("Đã thêm mới");

  clearForm();
  await loadList();
}

async function saveToaDam() {

  if (!editId) {
    alert("Bạn chưa chọn dữ liệu để sửa");
    return;
  }

  const oldData =
    await readData(
      `config/danh_muc/linktoadam/${editId}`
    );

  const data = {
    ...getFormData(),

    createdAt:
      oldData?.createdAt || Date.now(),

    updatedAt: Date.now() // 🔥 thêm dòng này
  };

  await writeData(
    `config/danh_muc/linktoadam/${editId}`,
    data
  );

  alert("Đã cập nhật");

  clearForm();
  await loadList();
}

function getFormData() {
  return {
    ngay: tdNgay.value,
    chude: tdChude.value,
    thamdu: tdThanhPhan.value,
    noidung: tdNoiDung.innerHTML,
    gmeet: tdGmeet.value,
    zoom: tdZoom.value,
    status: "on",
   seenBy: {} 
  };
}

function clearForm() {
  editId = null;

  tdChude.value = "";
  tdNgay.value = "";
  tdThanhPhan.value = "";
  tdNoiDung.innerHTML = "";
  tdGmeet.value = "";
  tdZoom.value = "";
}

async function loadList() {

  const data = await readData("config/danh_muc/linktoadam") || {};

  const tbody = document.getElementById("toadamList");

  let stt = 1;

  tbody.innerHTML = Object.entries(data).map(([id, r]) => `
    <tr>
      <td>${stt++}</td>
      <td>${r.ngay || ""}</td>
      <td title="${r.chude || ""}">
              ${r.chude || ""}
      </td>
      <td>${r.thamdu || ""}</td>
      <td title="${(r.noidung || '').replace(/<[^>]*>/g,'')}">
  ${(r.noidung || '')
      .replace(/<[^>]*>/g,'')
      .substring(0,80)}
</td>
      <td>${r.gmeet || r.zoom || ""}</td>
      <td>
        <button onclick="window.editTD('${id}')">✏️</button>
        <button onclick="window.deleteTD('${id}')">🗑️</button>
      </td>
    </tr>
  `).join("");

  // ✏️ EDIT
  window.editTD = function (id) {
    const r = data[id];
    if (!r) return;

    editId = id;

    tdChude.value = r.chude || "";
    tdNgay.value = r.ngay || "";
    tdThanhPhan.value = r.thamdu || "";
    tdNoiDung.innerHTML = r.noidung || "";
    tdGmeet.value = r.gmeet || "";
    tdZoom.value = r.zoom || "";
  };

  // 🗑️ DELETE
  window.deleteTD = async function (id) {
    if (!confirm("Xóa?")) return;

    await deleteData(`config/danh_muc/linktoadam/${id}`);

    if (editId === id) clearForm();

    await loadList();
  };
}

function previewNoiDung() {

  localStorage.setItem(
    "lesson_preview",
    JSON.stringify({
      content_html: tdNoiDung.innerHTML
    })
  );

  window.open("/preview.html", "_blank");
}