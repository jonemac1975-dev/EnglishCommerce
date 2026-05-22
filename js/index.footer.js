/*************************************************
 * INDEX FOOTER
 * - Load dữ liệu từ Firebase
 * - News
 * - Hoạt động
 * - Thư viện (Sách + Tài liệu)
 *************************************************/

import { readData } from "../scripts/services/firebaseService.js";

/* ===== LẤY ELEMENT ===== */
const ftNews      = document.getElementById("ftNews");
const ftHoatDong  = document.getElementById("ftHoatDong");
const ftSach      = document.getElementById("ftSach");
const ftTaiLieu   = document.getElementById("ftTaiLieu");

/* ===== HÀM RENDER LIST ===== */
function renderList(container, data, textField) {

  if (!container) return;

  if (!data) {
    container.innerHTML = "<li>Chưa có dữ liệu</li>";
    return;
  }

  container.innerHTML = "";

  Object.values(data).forEach(item => {

    const itemLink = item.link || item.Link || item.url || "";

    // =========================
    // HỖ TRỢ DATA CŨ + MỚI
    // =========================
    let images = [];

    if (Array.isArray(item.images)) {
      images = item.images;
    }
    else if (item.image) {
      images = [item.image];
    }

    // =========================
    // LI
    // =========================
    const li = document.createElement("li");

    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.gap = "10px";
    li.style.marginBottom = "14px";

    // =========================
    // THUMBNAIL
    // =========================
    if (images.length) {

      const img = document.createElement("img");

      // random ảnh thumbnail
      const thumbIndex =
        Math.floor(Math.random() * images.length);

      img.src = images[thumbIndex];

      img.style.width = "55px";
      img.style.height = "55px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "8px";
      img.style.flexShrink = "0";
      img.style.cursor = "pointer";

      // ===== click thumbnail =====
      img.onclick = () => {

        // có link → mở link
        if (itemLink && itemLink.trim()) {
          window.open(itemLink, "_blank");
          return;
        }

        // không link → mở gallery
        openGallery(thumbIndex);
      };

      li.appendChild(img);
    }

    // =========================
    // GALLERY
    // =========================
    function openGallery(startIndex = 0) {

      const w = window.open("");

      w.document.write(`
        <title>${item[textField] || "Hình ảnh"}</title>

        <style>

          body{
            margin:0;
            background:#111;
            display:flex;
            justify-content:center;
            align-items:center;
            height:100vh;
            overflow:hidden;
            position:relative;
            font-family:system-ui;
          }

          img{
            max-width:92%;
            max-height:92%;
            border-radius:12px;
            box-shadow:0 0 30px rgba(0,0,0,.5);
          }

          .nav{
            position:absolute;
            top:50%;
            transform:translateY(-50%);
            font-size:42px;
            color:#fff;
            cursor:pointer;
            user-select:none;
            padding:14px;
            background:rgba(0,0,0,.35);
            border-radius:12px;
          }

          .prev{
            left:20px;
          }

          .next{
            right:20px;
          }

          .counter{
            position:absolute;
            bottom:20px;
            color:#fff;
            font-size:14px;
            background:rgba(0,0,0,.5);
            padding:6px 12px;
            border-radius:20px;
          }

        </style>

        <div class="nav prev">◀</div>

        <img id="viewer">

        <div class="nav next">▶</div>

        <div class="counter" id="counter"></div>

        <script>

          const images = ${JSON.stringify(images)};

          let index = ${startIndex};

          const viewer =
            document.getElementById("viewer");

          const counter =
            document.getElementById("counter");

          function render(){

            viewer.src = images[index];

            counter.innerText =
              (index + 1) + " / " + images.length;
          }

          document.querySelector(".prev").onclick = () => {

            index--;

            if(index < 0){
              index = images.length - 1;
            }

            render();
          };

          document.querySelector(".next").onclick = () => {

            index++;

            if(index >= images.length){
              index = 0;
            }

            render();
          };

          render();

        <\/script>
      `);
    }

    // =========================
    // TITLE
    // =========================
    let title;

    if (itemLink || images.length) {

      title = document.createElement("a");

      title.href = "#";

      title.textContent =
        item[textField] || "Không tiêu đề";

      title.style.color = "#2563eb";
      title.style.textDecoration = "none";
      title.style.fontWeight = "600";
      title.style.cursor = "pointer";

      title.onmouseover = () => {
        title.style.textDecoration = "underline";
      };

      title.onmouseout = () => {
        title.style.textDecoration = "none";
      };

      // ===== click title =====
      title.onclick = (e) => {

        e.preventDefault();

        // có link → mở link
        if (itemLink && itemLink.trim()) {
          window.open(itemLink, "_blank");
          return;
        }

        // không link → mở gallery
        if (images.length) {

          // random ảnh đầu tiên
          const randomIndex =
            Math.floor(Math.random() * images.length);

          openGallery(randomIndex);
        }
      };

    } else {

      title = document.createElement("span");

      title.textContent =
        item[textField] || "Không tiêu đề";

      title.style.color = "#555";
    }

    li.appendChild(title);

    container.appendChild(li);

  });
}

/* ===== LOAD FOOTER ===== */
async function loadFooter() {

  try {

    /* ===== NEWS ===== */
    const newsData = await readData("thoisuhoatdong/thoisu");
    renderList(ftNews, newsData, "tieuDe");

    /* ===== HOẠT ĐỘNG ===== */
    const hdData = await readData("thoisuhoatdong/hoatdong");
    renderList(ftHoatDong, hdData, "tieuDe");

    /* ===== SÁCH ===== */
    const sachData = await readData("sachtailieu/sach");
    renderList(ftSach, sachData, "ten");

    /* ===== TÀI LIỆU ===== */
    const taiLieuData = await readData("sachtailieu/tailieu");
    renderList(ftTaiLieu, taiLieuData, "ten");

  } catch (error) {
    console.error("Lỗi load footer:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadFooter);