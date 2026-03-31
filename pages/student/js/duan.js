import { readData, writeData } 
from "../../../scripts/services/firebaseService.js";

const studentId = localStorage.getItem("student_id");

if (!studentId) {
  location.href = "../../index.html";
}

/* =========================
   TOAST
========================= */
window.showToast = function (message, type = "info", time = 2500) {
  let box = document.getElementById("toastBox");

  if (!box) {
    box = document.createElement("div");
    box.id = "toastBox";
    document.body.appendChild(box);

    const style = document.createElement("style");
    style.innerHTML = `
      #toastBox {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .toast-item {
        min-width: 260px;
        max-width: 360px;
        padding: 14px 18px;
        border-radius: 14px;
        color: #fff;
        font-size: 15px;
        font-weight: 700;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
        opacity: 0;
        transform: translateX(120%);
        transition: all 0.35s ease;
      }

      .toast-item.show {
        opacity: 1;
        transform: translateX(0);
      }

      .toast-item.success {
        background: linear-gradient(135deg, #18a957, #0f8f48);
      }

      .toast-item.error {
        background: linear-gradient(135deg, #ef4444, #dc2626);
      }

      .toast-item.warning {
        background: linear-gradient(135deg, #f7b500, #e49b00);
        color: #1f1f1f;
      }

      .toast-item.info {
        background: linear-gradient(135deg, #1976d2, #1258a8);
      }
    `;
    document.head.appendChild(style);
  }

  const toast = document.createElement("div");
  toast.className = `toast-item ${type}`;
  toast.textContent = message;

  box.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 20);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 350);
  }, time);
};

/* =========================
   DOM
========================= */
let daMonHoc, daLop, daTenDuAn, daMp3, daMp32, daMp4, daYoutube,
    daNoiDung, daNgay,
    previewMp3, previewMp32, previewMp4, previewYoutube,
    editingId = null;

function getDOM() {
  daMonHoc = document.getElementById("daMonHoc");
  daLop = document.getElementById("daLop");
  daTenDuAn = document.getElementById("daTenDuAn");
  daMp3 = document.getElementById("daMp3");
  daMp32 = document.getElementById("daMp32");
  daMp4 = document.getElementById("daMp4");
  daYoutube = document.getElementById("daYoutube");
  daNoiDung = document.getElementById("daNoiDung");
  daNgay = document.getElementById("daNgay");

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

  daMonHoc.innerHTML = `<option value="">-- Chọn môn học --</option>`;
  if (!data) return;

  Object.entries(data).forEach(([id, item]) => {
    daMonHoc.innerHTML += `<option value="${id}">${item.name}</option>`;
  });
}

/* =========================
   LOAD LỚP
========================= */
async function loadLop() {
  const data = await readData("config/danh_muc/lop");

  daLop.innerHTML = `<option value="">-- Chọn lớp --</option>`;
  if (!data) return;

  Object.entries(data).forEach(([id, item]) => {
    daLop.innerHTML += `<option value="${id}">${item.name}</option>`;
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
   DRIVE PREVIEW
========================= */
function convertDriveToPreview(url) {
  if (!url) return "";

  let match = url.match(/\/d\/([^/]+)/);
  if (match) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }

  match = url.match(/[?&]id=([^&]+)/);
  if (match) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }

  if (url.includes("/preview")) return url;

  return "";
}

/* =========================
   CHÈN HTML TẠI CON TRỎ
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

/* =========================
   COLLECT DATA
========================= */
function collectData() {
  if (!daMonHoc.value || !daLop.value || !daTenDuAn.value.trim()) {
    showToast("Vui lòng nhập đầy đủ thông tin", "warning");
    return null;
  }

  const data = {
    subjectId: daMonHoc.value,
    classId: daLop.value,
    title: daTenDuAn.value.trim(),
    ngay: daNgay.value || "",
    content_html: daNoiDung.innerHTML || "",
    media: {
      mp3: daMp3.value || "",
      mp32: daMp32.value || "",
      mp4: daMp4.value || "",
      youtube: daYoutube.value || ""
    }
  };

  if (!editingId) {
    data.created_at = Date.now();
  }

  return data;
}

/* =========================
   THÊM
========================= */
window.addDuAn = async function () {
  try {
    const data = collectData();
    if (!data) return;

    const id = "lec_" + Date.now();

    await writeData(
      `users/students/${studentId}/duan/${id}`,
      data
    );

    showToast("Đã thêm dự án", "success");
    clearForm();
    loadList();
  } catch (err) {
    console.error("Lỗi thêm dự án:", err);
    showToast("Lỗi khi thêm dự án", "error");
  }
};

/* =========================
   LƯU
========================= */
window.saveDuAn = async function () {
  try {
    if (!editingId) {
      showToast("Chưa chọn dự án để lưu", "warning");
      return;
    }

    const data = collectData();
    if (!data) return;

    const oldData = await readData(
      `users/students/${studentId}/duan/${editingId}`
    );

    await writeData(
      `users/students/${studentId}/duan/${editingId}`,
      {
        ...data,
        created_at: oldData?.created_at || Date.now()
      }
    );

    showToast("Đã lưu dự án", "success");
    clearForm();
    loadList();
  } catch (err) {
    console.error("Lỗi lưu dự án:", err);
    showToast("Lỗi khi lưu dự án", "error");
  }
};

/* =========================
   LOAD LIST
========================= */
async function loadList() {
  const data = await readData(
    `users/students/${studentId}/duan`
  );

  const tbody = document.getElementById("daList");
  tbody.innerHTML = "";

  if (!data) return;

  let i = 1;

  Object.entries(data)
    .sort((a, b) => (b[1]?.created_at || 0) - (a[1]?.created_at || 0))
    .forEach(([id, item]) => {
      tbody.innerHTML += `
        <tr onclick="editDuAn('${id}')" style="cursor:pointer">
          <td>${i++}</td>
          <td>${item.title || ""}</td>
          <td>${item.ngay || ""}</td>
          <td>
            <button onclick="deleteDuAn('${id}');event.stopPropagation();">
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
window.editDuAn = async function (id) {
  const data = await readData(
    `users/students/${studentId}/duan/${id}`
  );
  if (!data) return;

  editingId = id;
  document.getElementById("daId").value = id;

  daMonHoc.value = data.subjectId || "";
  daLop.value = data.classId || "";
  daTenDuAn.value = data.title || "";
  daNgay.value = data.ngay || "";

  daMp3.value = data.media?.mp3 || "";
  daMp32.value = data.media?.mp32 || "";
  daMp4.value = data.media?.mp4 || "";
  daYoutube.value = data.media?.youtube || "";

  daNoiDung.innerHTML = data.content_html || "";

  daMp3.dispatchEvent(new Event("input"));
  daMp32.dispatchEvent(new Event("input"));
  daMp4.dispatchEvent(new Event("input"));
  daYoutube.dispatchEvent(new Event("input"));

  showToast("Đã tải dữ liệu dự án", "info");
};

/* =========================
   DELETE
========================= */
window.deleteDuAn = async function (id) {
  if (!confirm("Xóa dự án này?")) return;

  try {
    await writeData(
      `users/students/${studentId}/duan/${id}`,
      null
    );

    showToast("Đã xóa dự án", "error");

    if (editingId === id) clearForm();
    loadList();
  } catch (err) {
    console.error("Lỗi xóa dự án:", err);
    showToast("Lỗi khi xóa dự án", "error");
  }
};

/* =========================
   CLEAR
========================= */
function clearForm() {
  editingId = null;

  document.getElementById("daId").value = "Tự tạo";
  daMonHoc.value = "";
  daLop.value = "";
  daTenDuAn.value = "";
  daNgay.value = "";

  daMp3.value = "";
  daMp32.value = "";
  daMp4.value = "";
  daYoutube.value = "";

  daNoiDung.innerHTML = "";

  previewMp3.innerHTML = "";
  previewMp32.innerHTML = "";
  previewMp4.innerHTML = "";
  previewYoutube.innerHTML = "";
}

/* =========================
   PREVIEW EVENTS
========================= */
function bindPreviewEvents() {
  daMp3.addEventListener("input", () => {
    const previewUrl = convertDriveToPreview(daMp3.value);

    previewMp3.innerHTML = previewUrl
      ? `<iframe src="${previewUrl}" width="100%" height="80" allow="autoplay"></iframe>`
      : "";
  });

  daMp32.addEventListener("input", () => {
    const previewUrl = convertDriveToPreview(daMp32.value);

    previewMp32.innerHTML = previewUrl
      ? `<iframe src="${previewUrl}" width="100%" height="80" allow="autoplay"></iframe>`
      : "";
  });

  daMp4.addEventListener("input", () => {
    const previewUrl = convertDriveToPreview(daMp4.value);

    previewMp4.innerHTML = previewUrl
      ? `<iframe src="${previewUrl}" width="100%" height="250" allow="autoplay"></iframe>`
      : "";
  });

  daYoutube.addEventListener("input", () => {
    const embed = getYoutubeEmbed(daYoutube.value);

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
   INSERT PDF
========================= */
window.insertPDF = function () {
  const url = prompt("Dán link PDF Google Drive:");
  if (!url) return;

  const m = url.match(/\/d\/([^/]+)/);
  if (!m) {
    showToast("Link PDF không hợp lệ", "warning");
    return;
  }

  insertAtCursor(`
    <iframe 
      src="https://drive.google.com/file/d/${m[1]}/preview"
      style="width:100%;height:600px;border:none;margin:16px 0;border-radius:12px">
    </iframe>
  `);

  showToast("Đã chèn PDF", "success");
};

/* =========================
   INSERT PPT / SLIDES / LINK NGOÀI
========================= */
window.insertPPT = function () {
  const url = prompt("Dán link PPTX / Google Slides / FlipHTML5 / HTML:");
  if (!url) return;

  let html = "";

  // Google Slides
  if (url.includes("docs.google.com/presentation")) {
    const m = url.match(/\/d\/([^/]+)/);
    if (!m) {
      showToast("Link Google Slides không hợp lệ", "warning");
      return;
    }

    html = `
      <iframe 
        src="https://docs.google.com/presentation/d/${m[1]}/embed"
        style="width:100%;height:600px;border:none;border-radius:12px">
      </iframe>
    `;
  }

  // Drive file
  else if (url.includes("drive.google.com/file")) {
    const m = url.match(/\/d\/([^/]+)/);
    if (!m) {
      showToast("Link Google Drive không hợp lệ", "warning");
      return;
    }

    const fileUrl = `https://drive.google.com/uc?id=${m[1]}&export=download`;

    html = `
      <iframe 
        src="https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true"
        style="width:100%;height:600px;border:none;border-radius:12px">
      </iframe>
    `;
  }

  // Link ngoài => không iframe bừa nữa
  else if (url.startsWith("http")) {
    html = `
      <p style="margin:16px 0;text-align:center">
        <a href="${url}" target="_blank" style="
          display:inline-block;
          padding:12px 18px;
          background:#1976d2;
          color:#fff;
          text-decoration:none;
          border-radius:12px;
          font-weight:700;">
          🔗 Mở nội dung bên ngoài
        </a>
      </p>
    `;
  }

  else {
    showToast("Link không hợp lệ", "warning");
    return;
  }

  insertAtCursor(html);
  showToast("Đã chèn nội dung", "success");
};

/* =========================
   PREVIEW CONTENT
========================= */
window.previewContent = function () {
  if (!daNoiDung.innerHTML.trim()) {
    showToast("Chưa có nội dung để preview", "warning");
    return;
  }

  localStorage.setItem(
    "lesson_preview",
    JSON.stringify({
      name: daTenDuAn.value || "Dự Án",
      meta:
        `Môn: ${daMonHoc.options[daMonHoc.selectedIndex]?.text || ""} | ` +
        `Lớp: ${daLop.options[daLop.selectedIndex]?.text || ""} | ` +
        `Ngày: ${daNgay.value || ""}`,
      content: daNoiDung.innerHTML
    })
  );

  window.open("/preview.html", "_blank");
};

/* =========================
   CHỌN ẢNH
========================= */
window.chooseImage = function () {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        // Giảm kích thước còn 25%
        const scale = 0.25;
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Nén JPEG chất lượng 0.72
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.72);

        insertAtCursor(`
          <p style="text-align:center; margin:16px 0;">
            <img 
              src="${compressedDataUrl}" 
              style="
                width:25%;
                max-width:220px;
                border-radius:12px;
                box-shadow:0 8px 18px rgba(0,0,0,0.08);
              " 
            />
          </p>
        `);

        const oldKB = (file.size / 1024).toFixed(0);
        const newKB = Math.round((compressedDataUrl.length * 3 / 4) / 1024);

        showToast(`Đã chèn ảnh (${oldKB}KB → ~${newKB}KB)`, "success", 3200);
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  };

  input.click();
};

/* =========================
   INIT
========================= */
export async function init() {
  try {
    getDOM();

    document.getElementById("daId").value = "Tự tạo";

    await loadMonHoc();
    await loadLop();
    await loadList();

    bindPreviewEvents();

    showToast("Tab Dự án đã sẵn sàng", "info", 1800);
  } catch (err) {
    console.error("Lỗi init duan:", err);
    showToast("Lỗi tải tab Dự án", "error");
  }
}