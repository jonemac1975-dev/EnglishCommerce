import { readData, writeData }
from "../../../scripts/services/firebaseService.js";

const teacherId = localStorage.getItem("teacher_id");
if (!teacherId) location.href = "../../index.html";

let currentEditId = null;
let lopNameMap = {};

/* ================= INIT ================= */
export async function init() {

  btnAdd.onclick = addTest;
  btnSave.onclick = saveTest;

  await loadTestLop();  // 🔥 phải trước
  await loadList();
}

/* ================= LOAD LỚP ================= */
async function loadTestLop() {

  const sel = document.getElementById("testLop");
  if (!sel) return;

  const data = await readData("config/danh_muc/lop");
  if (!data) return;

  sel.innerHTML = `<option value="">Chọn lớp</option>`;
  lopNameMap = {}; // reset

  Object.entries(data).forEach(([id, item]) => {

    lopNameMap[id] = item.name || id;   // 🔥 lưu map

    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = item.name || id;
    sel.appendChild(opt);
  });
}

/* ================= ADD ================= */
async function addTest() {

  const data = getFormData();

  if (!data.made) return showToast("Chưa nhập mã đề");
  if (!data.noidung) return showToast("Chưa có nội dung");
  if (!data.lop) return showToast("Chưa chọn lớp");
const list = await readData(`teacher/${teacherId}/test`);
if (list) {
  const trung = Object.values(list)
    .some(t => t.made === data.made);

  if (trung) return showToast("⚠️ Mã đề đã tồn tại");
}

  const id = "test_" + Date.now();

  await writeData(`teacher/${teacherId}/test/${id}`, data);

  showToast("✅ Đã thêm đề test");
  clearForm();
await loadTestLop();
await loadList();
}

/* ================= SAVE ================= */
async function saveTest() {

  if (!currentEditId)
    return showToast("Chưa chọn đề để sửa");

  const data = getFormData();

  await writeData(
    `teacher/${teacherId}/test/${currentEditId}`,
    data
  );

  showToast("💾 Đã lưu thay đổi");
  clearForm();
await loadTestLop();
await loadList();
}

/* ================= LIST ================= */
async function loadList() {

  test_list.innerHTML = "";

  const data =
    await readData(`teacher/${teacherId}/test`);

  if (!data) return;

  let i = 1;

  Object.entries(data).forEach(([id, item]) => {

    const tr = document.createElement("tr");

    const tenLop =
      lopNameMap[item.lop] || item.lop || "";

    tr.innerHTML = `
      <td>${i++}</td>
      <td>${item.made}</td>
      <td>${tenLop}</td>
      <td>
        <button onclick="editTest('${id}')">Sửa</button>
        <button onclick="deleteTest('${id}')">Xóa</button>
        <button onclick="previewTest('${id}')">Preview</button>
      </td>
    `;

    test_list.appendChild(tr);
  });
}

/* ================= EDIT ================= */
window.editTest = async id => {

  const d =
    await readData(`teacher/${teacherId}/test/${id}`);

  if (!d) return;

  currentEditId = id;

  test_made.value = d.made || "";
  test_noidung.innerHTML = d.noidung || "";
  testLop.value = d.lop || "";
};

/* ================= DELETE ================= */
window.deleteTest = async id => {

  if (!confirm("Xóa đề test này?")) return;

  await writeData(
    `teacher/${teacherId}/test/${id}`,
    null
  );

  showToast("Đã xóa test");
   
await loadTestLop();
await loadList();
};

/* ================= PREVIEW ================= */
window.previewTest = async id => {

  const d =
    await readData(`teacher/${teacherId}/test/${id}`);

  if (!d) return;

  localStorage.setItem("lesson_preview",
    JSON.stringify({
      name: `Đề test ${d.made}`,
      meta: `Lớp: ${d.lop || ""}`,
      content: d.noidung
    })
  );

  window.open("/preview.html", "_blank");
};

/* ================= HELPERS ================= */
function getFormData() {

  return {
    made: test_made.value.trim(),
    lop: document.getElementById("testLop").value,   // ✅ THÊM LỚP
    noidung: test_noidung.innerHTML,
    updatedAt: Date.now()
  };
}

function clearForm() {

  currentEditId = null;
  test_made.value = "";
  test_noidung.innerHTML = "";
  testLop.value = "";
}