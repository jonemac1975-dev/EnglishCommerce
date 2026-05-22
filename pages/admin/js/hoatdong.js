import { readData, writeData } 
from "../../../scripts/services/firebaseService.js";

/* ========= BIẾN ========= */
let hdTieuDe, hdLink, hdImage, previewBox;
let table, btnThem, btnLuu, btnXoa;
let editId = null;

// danh sách ảnh đang chọn
let selectedImages = [];

/* ========= DOM ========= */
function getDOM() {

  hdTieuDe = document.getElementById("hdTieuDe");
  hdLink   = document.getElementById("hdLink");
  table    = document.getElementById("hoatdongTable");

  hdImage   = document.getElementById("hdImage");
  previewBox = document.getElementById("previewBox");

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

  setTimeout(() => {
    t.classList.remove("show");
  }, 2500);
}

/* ========= FILE → BASE64 ========= */
async function fileToBase64(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

/* ========= RENDER PREVIEW ========= */
function renderPreviewImages() {

  previewBox.innerHTML = "";

  if (!selectedImages.length) return;

  selectedImages.forEach((img, index) => {

    const wrap = document.createElement("div");

    wrap.style.display = "inline-block";
    wrap.style.position = "relative";
    wrap.style.margin = "6px";

    wrap.innerHTML = `
      <img src="${img}"
           style="
             width:120px;
             height:90px;
             object-fit:cover;
             border-radius:10px;
             border:1px solid #ddd;
           ">

      <button
        style="
          position:absolute;
          top:-8px;
          right:-8px;
          width:24px;
          height:24px;
          border:none;
          border-radius:50%;
          background:#ef4444;
          color:#fff;
          cursor:pointer;
          font-size:12px;
        "
      >
        ✕
      </button>
    `;

    wrap.querySelector("button").onclick = () => {

      selectedImages.splice(index, 1);

      renderPreviewImages();
    };

    previewBox.appendChild(wrap);
  });
}

/* ========= CHỌN ẢNH ========= */
async function handleChooseImage() {

  const file = hdImage.files[0];

  if (!file) return;

  // giới hạn 2MB
  if (file.size > 1024 * 1024 * 2) {

    showToast("Ảnh quá lớn (<2MB)", "error");

    hdImage.value = "";

    return;
  }

  const base64 = await fileToBase64(file);

  selectedImages.push(base64);

  renderPreviewImages();

  // reset để chọn tiếp ảnh khác
  hdImage.value = "";
}

/* ========= CLEAR ========= */
function clearForm() {

  hdTieuDe.value = "";
  hdLink.value   = "";

  editId = null;

  selectedImages = [];

  if (hdImage) hdImage.value = "";

  previewBox.innerHTML = "";

  btnThem.style.display = "inline-block";
  btnLuu.style.display  = "none";
  btnXoa.style.display  = "none";
}

/* ========= THÊM ========= */
async function themHoatDong() {

  if (!hdTieuDe.value.trim()) {

    showToast("Thiếu tiêu đề", "error");

    return;
  }

  const id = "hoatdong_" + Date.now();

  await writeData(`thoisuhoatdong/hoatdong/${id}`, {

    tieuDe: hdTieuDe.value,

    link: hdLink.value,

    images: selectedImages,

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

    images: selectedImages,

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

    // hỗ trợ data cũ
    const firstImage =
      d.images?.[0] ||
      d.image ||
      "";

    const totalImages =
      d.images?.length ||
      (d.image ? 1 : 0);

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${stt++}</td>

      <td>
        ${
          firstImage
          ? `
            <div style="position:relative;width:70px">

              <img src="${firstImage}"
                   style="
                     width:70px;
                     height:50px;
                     object-fit:cover;
                     border-radius:8px;
                   ">

              <div style="
                position:absolute;
                bottom:4px;
                right:4px;
                background:rgba(0,0,0,.7);
                color:#fff;
                padding:2px 6px;
                border-radius:20px;
                font-size:11px;
              ">
                ${totalImages}
              </div>

            </div>
          `
          : ""
        }
      </td>

      <td>${d.tieuDe || ""}</td>

      <td>
        ${
          d.link
          ? `<a href="${d.link}" target="_blank">Mở</a>`
          : ""
        }
      </td>
    `;

    tr.onclick = () => {

      editId = id;

      hdTieuDe.value = d.tieuDe || "";

      hdLink.value = d.link || "";

      // hỗ trợ data cũ
      selectedImages =
        d.images ||
        (d.image ? [d.image] : []);

      renderPreviewImages();

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

  // chọn ảnh nhiều lần
  hdImage.addEventListener("change", handleChooseImage);

  await loadTable();

  btnThem.onclick = themHoatDong;

  btnLuu.onclick  = luuHoatDong;

  btnXoa.onclick  = xoaHoatDong;
}