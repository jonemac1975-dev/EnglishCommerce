/*************************************************
 * INDEX.MAIN.JS
 * - Load nội dung MAIN từ Firebase
 * - KHÓA HỌC / BÀI GIẢNG MẪU / TIÊU BIỂU
 *************************************************/

import { readData } from "../scripts/services/firebaseService.js";

/* ===== DOM READY ===== */
document.addEventListener("DOMContentLoaded", async () => {

  initMainBackground();

  const grid = document.getElementById("mainGrid");
  if (grid) {
    await loadMain(grid);
  }
});

/* ===== LOAD MAIN ===== */
async function loadMain(grid) {

  let html = "";

  /* ================= KHÓA HỌC ================= */
  const courses = await readData("courses");
  const monHocMap = await readData("config/danh_muc/monhoc");

  if (courses) {
    html += `<div class="main-section">
                <h2 class="section-title">KHÓA HỌC MỚI</h2>
                <div class="section-grid">`;

    Object.values(courses).forEach(c => {
      const monHocName =
        monHocMap?.[c.mon_hoc]?.name || "Chưa rõ môn";

      html += `
        <div class="card course-card">
          <img class="card-img"
               src="${c.image || "./store/no-image.png"}">
          <div class="card-body">
            <div class="badge">Khai giảng</div>
            <strong>${c.ma_khoa || ""}</strong>
            <a href="#" class="course-link"
               data-html="${encodeURIComponent(c.mo_ta_html || "")}">
               ${monHocName}
            </a>
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
  }

  /* ================= BÀI GIẢNG MẪU ================= */
const baimau = await readData("baimau");

if (baimau) {
  html += `<div class="main-section">
              <h2 class="section-title">BÀI GIẢNG MẪU</h2>
              <div class="section-grid">`;

  Object.values(baimau).forEach(bm => {

    const ytId = extractYoutubeId(bm.link || "");
    const thumb = ytId
      ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
      : "./store/no-video.png";

    html += `
      <div class="card video-card"
           data-link="${bm.link || ""}">
        <img class="card-img" src="${thumb}">
        <div class="card-body">
          <strong>${bm.tieude || "Bài giảng mẫu"}</strong>
        </div>
      </div>
    `;
  });

  html += `</div></div>`;
}

  /* ================= GIÁO VIÊN TIÊU BIỂU ================= */
  const gvTB = await readData("tieubieu/giaovien");

  if (gvTB) {
    html += `<div class="main-section center">
                <h2 class="section-title">GIÁO VIÊN TIÊU BIỂU</h2>
                <div class="highlight-row">`;

    for (const item of Object.values(gvTB)) {
      const profile =
        await readData(`users/teachers/${item.giaovien}/profile`);

      html += `
        <div class="highlight-card">
          <img src="${item.img || profile?.avatar || "./store/avatar.png"}">
          <div>${profile?.ho_ten || "Giáo viên"}</div>
          <small>${item.thang || ""}</small>
        </div>
      `;
    }

    html += `</div></div>`;
  }

  /* ================= HỌC VIÊN TIÊU BIỂU ================= */
  const hvTB = await readData("tieubieu/hocvien");

  if (hvTB) {
    html += `<div class="main-section center">
                <h2 class="section-title">HỌC VIÊN TIÊU BIỂU</h2>
                <div class="highlight-row">`;

    for (const item of Object.values(hvTB)) {
      const profile =
        await readData(`users/students/${item.hocvien}/profile`);

      html += `
        <div class="highlight-card">
          <img src="${item.img || profile?.avatar || "./store/avatar.png"}">
          <div>${profile?.ho_ten || "Học viên"}</div>
          <small>${item.thang || ""}</small>
        </div>
      `;
    }

    html += `</div></div>`;
  }

  grid.innerHTML = html || "<p>Chưa có dữ liệu</p>";
  bindCourseLinks();
  bindVideoCards();
}


/* ===== CLICK KHÓA HỌC → MỞ MÔ TẢ HTML ===== */
function bindCourseLinks() {
  document.querySelectorAll(".course-link").forEach(a => {
    a.onclick = e => {
      e.preventDefault();

      const html = decodeURIComponent(a.dataset.html || "");
      if (!html) return;

      const main = document.getElementById("mainContent") 
                || document.querySelector(".content");

      if (!main) return;

      const originalContent = main.innerHTML; // lưu lại

      main.innerHTML = `
        <div class="lesson-content">
          <button id="btnBack" class="back-btn">← Quay lại</button>
          <div class="lesson-html">${html}</div>
        </div>
      `;

      document.getElementById("btnBack").onclick = () => {
        main.innerHTML = originalContent;
        bindCourseLinks(); // bind lại sự kiện
      };
    };
  });
}



/* ===== HELPER: LẤY YOUTUBE ID ===== */
function extractYoutubeId(url) {
  if (!url) return "";
  const m = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return m ? m[1] : "";
}



function bindVideoCards() {

  const modal = document.getElementById("videoModal");
  const box = document.getElementById("videoBox");
  const frame = document.getElementById("videoFrame");
  const closeBtn = document.getElementById("closeVideo");
  const miniBtn = document.getElementById("minimizeVideo");

  document.querySelectorAll(".video-card").forEach(card => {

    card.onclick = () => {

      const link = card.dataset.link;
      if (!link) return;

      const embed = link.includes("watch?v=")
        ? link.replace("watch?v=", "embed/")
        : link;

      frame.src = embed;
      modal.classList.add("active");
      box.classList.remove("mini");
    };

  });

  // Đóng hoàn toàn
  closeBtn.onclick = () => {
  modal.classList.remove("active", "mini-mode");
  box.classList.remove("mini");
  frame.src = "";
  miniBtn.textContent = "—";
};


  // Thu nhỏ
  miniBtn.onclick = () => {

  box.classList.toggle("mini");

  if (box.classList.contains("mini")) {
    modal.classList.add("mini-mode");
    miniBtn.textContent = "⛶";   // phóng to
  } else {
    modal.classList.remove("mini-mode");
    miniBtn.textContent = "—";   // thu nhỏ
  }
};

  // Bấm nền tối để đóng (chỉ khi không mini)
  modal.onclick = e => {
    if (e.target === modal && !box.classList.contains("mini")) {
      modal.classList.remove("active");
      frame.src = "";
    }
  };

  enableDrag(box);
}

function enableDrag(el) {

  let posX = 0, posY = 0, mouseX = 0, mouseY = 0;

  el.onmousedown = function(e) {

    if (!el.classList.contains("mini")) return;

    e.preventDefault();
    mouseX = e.clientX;
    mouseY = e.clientY;

    document.onmouseup = closeDrag;
    document.onmousemove = drag;
  };

  function drag(e) {

    e.preventDefault();

    posX = mouseX - e.clientX;
    posY = mouseY - e.clientY;
    mouseX = e.clientX;
    mouseY = e.clientY;

    el.style.top = (el.offsetTop - posY) + "px";
    el.style.left = (el.offsetLeft - posX) + "px";
  }

  function closeDrag() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}



/* ===== MAIN BACKGROUND SLIDE ===== */
function initMainBackground(){

  const mainBg = document.getElementById("mainBg");
  if (!mainBg) return;

  const images = [
    "./store/main1.png",
    "./store/main2.png",
    "./store/main3.png",
    "./store/main4.png",
    "./store/main5.png"
  ];

  let index = 0;

  function changeBg(){
    mainBg.style.backgroundImage = `url(${images[index]})`;
    index = (index + 1) % images.length;
  }

  changeBg(); // chạy lần đầu
  setInterval(changeBg, 10000); // 10 giây
}