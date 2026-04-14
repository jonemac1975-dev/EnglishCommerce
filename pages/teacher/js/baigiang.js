import { readData, writeData } 
from "../../../scripts/services/firebaseService.js";

function convertDriveToPreview(url) {
  if (!url) return "";

  const match = url.match(/\/file\/d\/([^/]+)/);
  if (match) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }

  return url;
}
const teacherId = localStorage.getItem("teacher_id");

if (!teacherId) {
  location.href = "../../index.html";
}

/* =========================
   DOM
========================= */
let bgMonHoc, bgLop, bgTenBai, bgMp3,bgMp32, bgMp4, bgYoutube,
    bgNoiDung, bgNgay,
    previewMp3,previewMp32, previewMp4, previewYoutube,
    editingId = null;

function getDOM() {
  bgMonHoc = document.getElementById("bgMonHoc");
  bgLop = document.getElementById("bgLop");
  bgTenBai = document.getElementById("bgTenBai");
  bgMp3 = document.getElementById("bgMp3");
  bgMp32 = document.getElementById("bgMp32");
  bgMp4 = document.getElementById("bgMp4");
  bgYoutube = document.getElementById("bgYoutube");
  bgNoiDung = document.getElementById("bgNoiDung");
  bgNgay = document.getElementById("bgNgay");

  previewMp3 = document.getElementById("previewMp3");
  previewMp32 = document.getElementById("previewMp32");
  previewMp4 = document.getElementById("previewMp4");
  previewYoutube = document.getElementById("previewYoutube");
}

/* =========================
   LOAD MÔN
========================= */
async function loadMonHoc() {
  const data = await readData("config/danh_muc/monhoc");

  bgMonHoc.innerHTML = `<option value="">-- Chọn môn học --</option>`;
  if (!data) return;

  Object.entries(data).forEach(([id, item]) => {
    bgMonHoc.innerHTML += `<option value="${id}">${item.name}</option>`;
  });
}

/* =========================
   LOAD LỚP
========================= */
async function loadLop() {
  const data = await readData("config/danh_muc/lop");

  bgLop.innerHTML = `<option value="">-- Chọn lớp --</option>`;
  if (!data) return;

  Object.entries(data).forEach(([id, item]) => {
    bgLop.innerHTML += `<option value="${id}">${item.name}</option>`;
  });
}

/* =========================
   YOUTUBE EMBED
========================= */
function getYoutubeEmbed(url) {
  if (!url) return "";
  const reg = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;
  const match = url.match(reg);
  return match ? `https://www.youtube.com/embed/${match[1]}` : "";
}



/* =========================
  Chèn tại vị trỏ
========================= */
function insertHTMLAtCursor(html) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  range.deleteContents();

  const el = document.createElement("div");
  el.innerHTML = html;

  const frag = document.createDocumentFragment();
  let node;
  while ((node = el.firstChild)) {
    frag.appendChild(node);
  }

  range.insertNode(frag);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}





/* =========================
   COLLECT
========================= */
function collectData() {

  if (!bgMonHoc.value || !bgLop.value || !bgTenBai.value) {
    showToast("Thiếu thông tin");
    return null;
  }

  return {
    subjectId: bgMonHoc.value,
    classId: bgLop.value,
    title: bgTenBai.value,
    ngay: bgNgay.value || "",
    content_html: bgNoiDung.innerHTML,
    media: {
      mp3: bgMp3.value || "",
      mp32: bgMp32.value || "",
      mp4: bgMp4.value || "",
      youtube: bgYoutube.value || ""
    },
    created_at: editingId ? undefined : Date.now()
  };
}

/* =========================
   THÊM
========================= */
window.addBaiGiang = async function () {

  const data = collectData();
  if (!data) return;

  const id = "lec_" + Date.now();

  await writeData(
    `teacher/${teacherId}/baigiang/${id}`,
    data
  );
showToast("Đã thêm bài giảng");
  clearForm();
  loadList();
};

/* =========================
   LƯU
========================= */
window.saveBaiGiang = async function () {

  if (!editingId) {
    showToast("Chưa chọn bài để lưu");
    return;
  }

  const data = collectData();
  if (!data) return;

  await writeData(
    `teacher/${teacherId}/baigiang/${editingId}`,
    {
      ...data,
      created_at: data.created_at ?? Date.now()
    }
  );
showToast("Đã lưu bài giảng");
  clearForm();
  loadList();
};

/* =========================
   LOAD LIST
========================= */
async function loadList() {

  const data = await readData(
    `teacher/${teacherId}/baigiang`
  );

  const tbody = document.getElementById("bgList");
  tbody.innerHTML = "";

  if (!data) return;

  let i = 1;

  Object.entries(data).forEach(([id, item]) => {

    tbody.innerHTML += `
      <tr onclick="editBaiGiang('${id}')" style="cursor:pointer">
        <td>${i++}</td>
        <td>${item.title}</td>
        <td>${item.ngay || ""}</td>
        <td>
          <button onclick="deleteBaiGiang('${id}');event.stopPropagation();">
            Xóa
          </button>
        </td>
      </tr>
    `;
  });
}

/* =========================
   EDIT
========================= */
window.editBaiGiang = async function (id) {

  const data = await readData(
    `teacher/${teacherId}/baigiang/${id}`
  );
  if (!data) return;

  editingId = id;
  document.getElementById("bgId").value = id;
  bgMonHoc.value = data.subjectId || "";
  bgLop.value = data.classId || "";
  bgTenBai.value = data.title || "";
  bgNgay.value = data.ngay || "";

  bgMp3.value = data.media?.mp3 || "";
  bgMp32.value = data.media?.mp32 || "";
  bgMp4.value = data.media?.mp4 || "";
  bgYoutube.value = data.media?.youtube || "";

  bgNoiDung.innerHTML = data.content_html || "";

  bgMp3.dispatchEvent(new Event("input"));
  bgMp32.dispatchEvent(new Event("input"));
  bgMp4.dispatchEvent(new Event("input"));
  bgYoutube.dispatchEvent(new Event("input"));
};

/* =========================
   DELETE
========================= */
window.deleteBaiGiang = async function (id) {

  if (!confirm("Xóa bài này?")) return;

  await writeData(
    `teacher/${teacherId}/baigiang/${id}`,
    null
  );
showToast("Đã xóa bài giảng");
  loadList();
};

/* =========================
   CLEAR
========================= */
function clearForm() {

  editingId = null;
  document.getElementById("bgId").value = teacherId;
  bgTenBai.value = "";
  bgNgay.value = "";
  bgMp3.value = "";
  bgMp32.value = "";
  bgMp4.value = "";
  bgYoutube.value = "";
  bgNoiDung.innerHTML = "";

  previewMp3.innerHTML = "";
  previewMp32.innerHTML = "";
  previewMp4.innerHTML = "";
  previewYoutube.innerHTML = "";
}

/* =========================
   INIT
========================= */
export async function init() {

  getDOM();
  document.getElementById("bgId").value = teacherId;
  await loadMonHoc();
  await loadLop();
  await loadList();
  applyAIPushedLesson();

  bgMp3.addEventListener("input", () => {
  const previewUrl = convertDriveToPreview(bgMp3.value);

  previewMp3.innerHTML = previewUrl
    ? `<iframe 
         src="${previewUrl}" 
         width="100%" 
         height="80" 
         allow="autoplay">
       </iframe>`
    : "";
});


bgMp32.addEventListener("input", () => {
  const previewUrl = convertDriveToPreview(bgMp32.value);

  previewMp32.innerHTML = previewUrl
    ? `<iframe 
         src="${previewUrl}" 
         width="100%" 
         height="80" 
         allow="autoplay">
       </iframe>`
    : "";
});

  bgMp4.addEventListener("input", () => {

  const previewUrl = convertDriveToPreview(bgMp4.value);

  previewMp4.innerHTML = previewUrl
    ? `<iframe 
         src="${previewUrl}" 
         width="100%" 
         height="250" 
         allow="autoplay">
       </iframe>`
    : "";
});



  bgYoutube.addEventListener("input", () => {
    const embed = getYoutubeEmbed(bgYoutube.value);
    previewYoutube.innerHTML = embed
      ? `<iframe width="100%" height="250"
          src="${embed}"
          frameborder="0"
          allowfullscreen>
        </iframe>`
      : "";
  });
}

/* =========================
   INSERT TOOLS (BẮT BUỘC)
========================= */
function insertAtCursor(html) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  range.deleteContents();

  const temp = document.createElement("div");
  temp.innerHTML = html;

  const frag = document.createDocumentFragment();
  let node;
  while ((node = temp.firstChild)) {
    frag.appendChild(node);
  }

  range.insertNode(frag);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

window.insertPDF = function () {
  const url = prompt("Dán link PDF Google Drive:");
  if (!url) return;

  const m = url.match(/\/d\/([^/]+)/);
  if (!m) return alert("Link sai");

  insertAtCursor(`
    <iframe 
      src="https://drive.google.com/file/d/${m[1]}/preview"
      style="width:100%;height:600px;border:none;margin:16px 0">
    </iframe>
  `);
};

window.insertPPT = function () {
  const url = prompt("Dán link PPTX / Google Slides / FlipHTML5 / HTML:");
  if (!url) return;

  let iframe = "";

  // Google Slides
  if (url.includes("docs.google.com/presentation")) {
    const m = url.match(/\/d\/([^/]+)/);
    if (!m) return alert("Link Slides sai");

    iframe = `
      <iframe 
        src="https://docs.google.com/presentation/d/${m[1]}/embed"
        style="width:100%;height:600px;border:none">
      </iframe>
    `;
  }

  // Drive PPTX / PDF / file khác
  else if (url.includes("drive.google.com/file")) {
    const m = url.match(/\/d\/([^/]+)/);
    if (!m) return alert("Link Drive sai");

    const fileUrl =
      `https://drive.google.com/uc?id=${m[1]}&export=download`;

    iframe = `
      <iframe 
        src="https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true"
        style="width:100%;height:600px;border:none">
      </iframe>
    `;
  }

  // Link ngoài: FlipHTML5, HTML, iframe web
  else {
    insertAtCursor(url);
    return;
  }

  insertAtCursor(iframe);
};

window.previewContent = function () {
  if (!bgNoiDung.innerHTML.trim()) {
    alert("Chưa có nội dung");
    return;
  }

  localStorage.setItem(
    "lesson_preview",
    JSON.stringify({
      name: bgTenBai.value || "Bài giảng",
      meta:
        `Môn: ${bgMonHoc.value || ""} | ` +
        `Lớp: ${bgLop.value || ""} | ` +
        `Ngày: ${bgNgay.value || ""}`,
      content_html: bgNoiDung.innerHTML
    })
  );

  window.open("/preview2.html", "_blank");
};

window.chooseImage = function () {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      insertAtCursor(`
        <p style="text-align:center">
          <img src="${reader.result}" style="max-width:100%" />
        </p>
      `);
    };
    reader.readAsDataURL(file);
  };

  input.click();
};


function applyAIPushedLesson() {
  const raw = localStorage.getItem("teacher_ai_push_baigiang");
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    if (!data) return;

    if (bgTenBai) bgTenBai.value = data.title || "";
    if (bgNgay) bgNgay.value = data.ngay || "";

    // cố gắng map môn/lớp nếu option text trùng
    selectOptionByText(bgMonHoc, data.subjectText);
    selectOptionByText(bgLop, data.classText);

    if (bgNoiDung) {
      bgNoiDung.innerHTML = data.content_html || "";
    }

    localStorage.removeItem("teacher_ai_push_baigiang");
    showToast?.("🤖 Đã nhận nội dung từ AI Teacher", "success");
  } catch (e) {
    console.error("Lỗi applyAIPushedLesson:", e);
  }
}

function selectOptionByText(selectEl, text = "") {
  if (!selectEl || !text) return;

  const keyword = text.trim().toLowerCase();

  [...selectEl.options].forEach(opt => {
    if (opt.textContent.trim().toLowerCase() === keyword) {
      selectEl.value = opt.value;
    }
  });
}