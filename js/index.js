
import "./index.head.js";
import "./index.main.js";
import "./index.footer.js";
import "./avatar-gv.js";
import "./index.student.js";
import "./index.teacher.js";
import "./sessionService.js";
import { loadTeacherHeaderTheme } from "./index.head.dynamic.js";
import { initSearch } from "./searchController.js";

/* =========================
   APP STATE
========================= */
let mainMode = "landing"; // landing | working



/* =========================
   MENU TOGGLE
========================= */
window.toggleMenu = function (id) {
  const el = document.getElementById(id);
  if (!el) return;

  el.style.display = el.style.display === "block" ? "none" : "block";
};



/* =========================
   LOAD PREVIEW (KHÓA HỌC)
========================= */
window.loadPreview = function (link) {
  if (!link) return;

  window.location.href = link;
};



/* =========================
   LOAD YOUTUBE (BÀI GIẢNG MẪU)
========================= */
window.loadYoutube = function (link) {
  if (!link) return;

  window.open(link, "_blank");
};



/* =========================
   KHI GIÁO VIÊN CHỌN BÀI
========================= */
window.loadTeacherMedia = function (data) {
  /*
    data = {
      youtube: "",
      mp4: "",
      mp3: ""
    }
  */

  if (!data) return;

  // Ẩn landing grid
  const grid = document.getElementById("mainGrid");
  if (grid) grid.style.display = "none";

  // Tắt background main
  const main = document.getElementById("main");
  if (main) main.classList.add("working-mode");

  // Hiện media
  const mediaBox = document.getElementById("teacherMedia");
  if (mediaBox) mediaBox.style.display = "block";

  // Gán link
  const y = document.getElementById("gvYoutube");
  const m4 = document.getElementById("gvMp4");
  const m3 = document.getElementById("gvMp3");

  if (y) y.href = data.youtube || "#";
  if (m4) m4.href = data.mp4 || "#";
  if (m3) m3.href = data.mp3 || "#";

  mainMode = "working";
};



/* =========================
   RESET VỀ LANDING MODE
========================= */
window.resetLandingMode = function () {

  const grid = document.getElementById("mainGrid");
  if (grid) grid.style.display = "grid";

  const main = document.getElementById("main");
  if (main) main.classList.remove("working-mode");

  const mainBg = document.getElementById("mainBg");
  if (mainBg) mainBg.style.display = "block";

  const teacherMedia = document.getElementById("teacherMedia");
  if (teacherMedia) teacherMedia.style.display = "none";

  const studentMediaBox = document.getElementById("studentMediaBox");
  if (studentMediaBox) studentMediaBox.style.display = "none";

  const studentPlayer = document.getElementById("studentPlayer");
  if (studentPlayer) studentPlayer.innerHTML = "";

  mainMode = "landing";
};



/* =========================
   ĐIỀU HƯỚNG
========================= */
window.goGVRegister = () => location.href = "./pages/teacher/gvdangky.html";
window.goGVLogin    = () => location.href = "./pages/teacher/gvdangnhap.html";
window.goTeacherPage= () => location.href = "./pages/teacher/giaovien.html";

window.goHVRegister = () => location.href = "./pages/student/hvdangky.html";
window.goHVLogin    = () => location.href = "./pages/student/hvdangnhap.html";
window.goStudentPage= () => location.href = "./pages/student/hocvien.html";

/* =========================
   HỌC VIÊN: KIỂM TRA
========================= */

async function openKiemTra() {
  const main = document.getElementById("main");

  main.innerHTML = await fetch(
    "/pages/student/tab/kiemtra.html"
  ).then(r => r.text());

  const mod = await import(
    "/pages/student/js/kiemtra.js"
  );

  mod.init(); // 🔥 BẮT BUỘC
}

window.openStudentKiemtra = openKiemTra;


/* =========================
   HỌC VIÊN:  TEST
========================= */

async function openStudentTest() {
  const main = document.getElementById("main");

  main.innerHTML = await fetch(
    "/pages/student/tab/test.html"
  ).then(r => r.text());

  const mod = await import(
    "/pages/student/js/test.js"
  );

  mod.init();
}

window.openStudentTest = openStudentTest; // ✅ đúng

/* =========================
   ADMIN LOGIN (FOOTER LOCK)
========================= */

window.addEventListener("DOMContentLoaded", () => {

  const adminLock = document.getElementById("adminLock");
  if (adminLock) {
    adminLock.addEventListener("click", () => {
      location.href = "./pages/admin/adminlogin.html";
    });
  }

  loadTeacherHeaderTheme(); // 🔥 load head theo giáo viên nếu có

  window.addEventListener("load", () => {
    document.body.classList.add("ready");
  });

  initSearch();
});

/* =========================
   LANG SWITCH (SIÊU GỌN)
========================= */

function setLang(lang) {
  const select = document.querySelector(".goog-te-combo");
  if (!select) return;

  select.value = lang;
  select.dispatchEvent(new Event("change"));
}

function initLangSwitch() {
  const toggle = document.getElementById("langToggle");
  if (!toggle) return;

  toggle.addEventListener("change", () => {
    setLang(toggle.checked ? "en" : "vi");
  });
}

window.addEventListener("load", () => {
  setTimeout(initLangSwitch, 1000); // đợi Google load xong
});



/* =========================
   VIDEO MODAL CONTROL
========================= */

// ▶ mở video (gọi từ search hoặc nơi khác)
window.openVideo = function (videoId) {
  const modal = document.getElementById("videoModal");
  const iframe = document.getElementById("videoFrame");

  if (!modal || !iframe) return;

  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  modal.classList.add("active");
};

// ❌ tắt video
window.closeVideo = function () {
  const modal = document.getElementById("videoModal");
  const iframe = document.getElementById("videoFrame");

  if (!modal || !iframe) return;

  iframe.src = ""; // stop video
  modal.classList.remove("active");
  modal.classList.remove("mini-mode");

  document.querySelector(".video-box")?.classList.remove("mini");
};

// 🔽 thu nhỏ
window.minimizeVideo = function () {
  const modal = document.getElementById("videoModal");
  const box = document.querySelector(".video-box");

  if (!modal || !box) return;

  modal.classList.add("mini-mode");
  box.classList.add("mini");
};

// 🔼 phóng to lại
window.maximizeVideo = function () {
  const modal = document.getElementById("videoModal");
  const box = document.querySelector(".video-box");

  if (!modal || !box) return;

  modal.classList.remove("mini-mode");
  box.classList.remove("mini");
};


/* =========================
   SEARCH TAB SWITCH
========================= */
window.switchTab = function(tab) {

  document.querySelectorAll(".tab-content").forEach(el => {
    el.style.display = "none";
  });

  document.querySelectorAll(".search-tabs button").forEach(btn => {
    btn.classList.remove("active");
  });

  const active = document.getElementById("tab-" + tab);
  if (active) active.style.display = "block";

  const btn = document.querySelector(
    `.search-tabs button[onclick="switchTab('${tab}')"]`
  );
  if (btn) btn.classList.add("active");
};

/* =========================
   MAIN BG CONTROL
========================= */
window.enterWorkingMode = function () {
  const main = document.getElementById("main");
  if (main) main.classList.add("working-mode");
};

window.exitWorkingMode = function () {
  const main = document.getElementById("main");
  if (main) main.classList.remove("working-mode");
};