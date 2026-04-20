import { readData, updateData, writeData }
from "../../../scripts/services/firebaseService.js";

const PATH = "courses";

let currentId = null;
let monHocMap = {}; // id -> name


/* =========================
   GET DOM
========================= */
function getDom() {
  return {
    maKhoa: document.getElementById("ma_khoa"),
    monHoc: document.getElementById("khMonHoc"),
    thoiGian: document.getElementById("thoi_gian"),
    khaiGiang: document.getElementById("khai_giang"),
    moTa: document.getElementById("mo_ta_html"),
    imageFile: document.getElementById("imageFile"),
    imagePreview: document.getElementById("imagePreview"),
    tableBody: document.getElementById("tableBody"),
  };
}



function cleanWordAlign(html) {
  if (!html) return "";

  const div = document.createElement("div");
  div.innerHTML = html;

  // bỏ div bọc ngoài bị center
  const wrappers = div.querySelectorAll("div[style*='text-align:center']");

  wrappers.forEach(w => {
    const hasOnlyBlockChildren =
      [...w.children].every(c => c.tagName === "P" || c.tagName === "TABLE" || c.tagName === "IMG");

    // nếu chỉ là div bọc ngoài thì unwrap
    if (hasOnlyBlockChildren) {
      const parent = w.parentNode;
      while (w.firstChild) parent.insertBefore(w.firstChild, w);
      parent.removeChild(w);
    }
  });

  return div.innerHTML;
}

/* =========================
   LOAD DANH MỤC MÔN HỌC
========================= */
async function loadMonHoc() {
  const { monHoc } = getDom();
  const data = await readData("config/danh_muc/monhoc");

  monHoc.innerHTML = "<option value=''>-- Chọn môn học --</option>";
  monHocMap = {}; // reset map

  if (!data) return;

  Object.entries(data).forEach(([id, item]) => {
    monHocMap[id] = item.name; // lưu vào map

    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = item.name;
    monHoc.appendChild(opt);
  });
}


/* =========================
   CONVERT BASE64
========================= */
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}


/* =========================
   LOAD LIST
========================= */
async function loadList() {
  const { tableBody } = getDom();
  const data = await readData(PATH);

  tableBody.innerHTML = "";
  if (!data) return;

  let i = 1;

  Object.entries(data).forEach(([id, item]) => {
    const tenMon = monHocMap[item.mon_hoc] || "";

    tableBody.innerHTML += `
      <tr onclick="selectCourse('${id}')">
        <td>${i++}</td>
        <td>${item.ma_khoa || ""}</td>
        <td>${tenMon}</td>
        <td>${item.thoi_gian_hoc || ""}</td>
        <td>${item.khai_giang || ""}</td>
      </tr>
    `;
  });
}


/* =========================
   SELECT
========================= */
window.selectCourse = async function (id) {
  const data = await readData(`${PATH}/${id}`);
  if (!data) return;

  const { maKhoa, monHoc, thoiGian, khaiGiang, moTa, imagePreview } = getDom();

  currentId = id;

  maKhoa.value = data.ma_khoa || "";
  monHoc.value = data.mon_hoc || "";
  thoiGian.value = data.thoi_gian_hoc || "";
  khaiGiang.value = data.khai_giang || "";
  moTa.innerHTML = data.mo_ta_html || "";
  imagePreview.src = data.image || "";
};


/* =========================
   IMAGE PREVIEW (BASE64)
========================= */
document.addEventListener("change", async (e) => {
  if (e.target.id !== "imageFile") return;

  const { imagePreview } = getDom();
  const file = e.target.files[0];
  if (!file) return;

  const base64 = await toBase64(file);
  imagePreview.src = base64;
});

window.removeImage = function () {
  const { imagePreview, imageFile } = getDom();
  imagePreview.src = "";
  imageFile.value = "";
};


/* =========================
   CHÈN ẢNH VÀO HTML
========================= */
window.insertImageToHtml = function () {

  const { moTa } = getDom();

  // Tạo input file ẩn
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const base64 = await toBase64(file);

    moTa.innerHTML += `
      <div style="margin:10px 0;">
        <img src="${base64}" style="max-width:70%; height:auto; border-radius:6px;">
      </div>
    `;
  };

  input.click();
};


/* =========================
   CHÈN YOUTUBE
========================= */
window.insertYoutube = function () {
  const { moTa } = getDom();
  const link = prompt("Nhập link Youtube:");
  if (!link) return;

  const embed = link.replace("watch?v=", "embed/");

  moTa.innerHTML += `
    <div style="text-align:center">
      <iframe width="560" height="315"
        src="${embed}"
        frameborder="0"
        allowfullscreen>
      </iframe>
    </div>`;
};


/* =========================
   PREVIEW
========================= */
window.previewCourse = function () {

  const { maKhoa, monHoc, thoiGian, khaiGiang, moTa } = getDom();

  const previewData = {
    title: maKhoa.value || "Khóa học",
    meta: `${monHoc.options[monHoc.selectedIndex]?.text || ""} | ${thoiGian.value || ""} | ${khaiGiang.value || ""}`,
    content: moTa.innerHTML
  };

  localStorage.setItem("lesson_preview", JSON.stringify(previewData));

  window.open("/preview.html", "_blank");
};



/* =========================
   COLLECT
========================= */
function collectData() {
  const { maKhoa, monHoc, thoiGian, khaiGiang, moTa, imagePreview } = getDom();

  if (!maKhoa.value || !monHoc.value) {
    showToast("Thiếu thông tin");
    return null;
  }

  return {
    ma_khoa: maKhoa.value.trim(),
    mon_hoc: monHoc.value,
    thoi_gian_hoc: thoiGian.value.trim(),
    khai_giang: khaiGiang.value,
    mo_ta_html: cleanWordAlign(moTa.innerHTML),
    image: imagePreview.src || "",
    updated_at: Date.now()
  };
}


/* =========================
   ADD
========================= */
window.addCourse = async function () {
  const data = collectData();
  if (!data) return showToast("Nhập đầy đủ thông tin");;

  const id = "course_" + Date.now();
  data.created_at = Date.now();

  await updateData(`${PATH}/${id}`, data);

  showToast("Đã thêm");
  clearForm();
  loadList();
};


/* =========================
   SAVE
========================= */
window.saveCourse = async function () {
  if (!currentId) return showToast("Chọn khóa học");

  const data = collectData();
  if (!data) return;

  await updateData(`${PATH}/${currentId}`, data);

  showToast("Cập nhật thành công");
  loadList();
clearForm();
};


/* =========================
   DELETE
========================= */
window.deleteCourse = async function () {
  if (!currentId) return showToast("Chọn khóa học");

  await writeData(`${PATH}/${currentId}`, null);

  showToast("Xóa thành công");
  clearForm();
  loadList();
};


/* =========================
   CLEAR
========================= */
function clearForm() {
  const { maKhoa, monHoc, thoiGian, khaiGiang, moTa, imagePreview } = getDom();

  currentId = null;
  maKhoa.value = "";
  monHoc.value = "";
  thoiGian.value = "";
  khaiGiang.value = "";
  moTa.innerHTML = "";
  imagePreview.src = "";
}


/* =========================
   INIT (QUAN TRỌNG)
========================= */
async function init() {
  await loadMonHoc();   // load map trước
  await loadList();     // rồi render
}

init();
