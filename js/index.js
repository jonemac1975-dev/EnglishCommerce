
import "./index.head.js";
import "./index.main.js";
import "./index.footer.js";
import {loadMobileEvent,loadMobileNews,loadMobileBook,loadMobileDocument,loadMobileMusic} from "./index.footer.js";
import "./avatar-gv.js";
import "./index.student.js";
import "./index.teacher.js";
import "./sessionService.js";
import { loadTeacherHeaderTheme } from "./index.head.dynamic.js";
import { initSearch } from "./searchController.js";
import { readData } from "../scripts/services/firebaseService.js";


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


window.openRatingList = async function () {

  const mainContent =
    document.getElementById("mainContent");

  const mainBg =
    document.getElementById("mainBg");

  if (mainBg)
    mainBg.style.display = "none";

  const html = await fetch(
    "/pages/teacher/tab/ratinglist.html"
  ).then(r => r.text());

  mainContent.innerHTML = html;

  const mod = await import(
    "/pages/teacher/js/ratinglist.js"
  );

  mod.init();
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


window.toggleSidebar = function(type) {
  const teacher = document.querySelector(".sidebar.teacher");
  const student = document.querySelector(".sidebar.student");
  const overlay = document.getElementById("overlay");

  if (type === "teacher") {
    teacher.classList.toggle("active");
    student.classList.remove("active");
  }

  if (type === "student") {
    student.classList.toggle("active");
    teacher.classList.remove("active");
  }

  if (teacher.classList.contains("active") || student.classList.contains("active")) {
    overlay.classList.add("show");
  } else {
    overlay.classList.remove("show");
  }
};

// click ngoài để đóng
document.addEventListener("click", function(e) {
  const teacher = document.querySelector(".sidebar.teacher");
  const student = document.querySelector(".sidebar.student");
  const overlay = document.getElementById("overlay");

  const isClickInsideSidebar = e.target.closest(".sidebar");
  const isClickButton = e.target.closest(".top-menu button");

  if (!isClickInsideSidebar && !isClickButton) {
    teacher.classList.remove("active");
    student.classList.remove("active");
    overlay.classList.remove("show");
  }
});


//====BÌNH CHỌN GIÁO VIÊN=====//

async function loadTab(tabName, role = "teacher") {
  const mainContent = document.getElementById("mainContent");
  const mainBg = document.getElementById("mainBg");
  try {
    if (mainBg) mainBg.style.display = "none";
    const html = await fetch(`/pages/${role}/tab/${tabName}.html`)
      .then(res => res.text());
    mainContent.innerHTML = html;
    await new Promise(r => setTimeout(r, 0));
    const module = await import(`/pages/${role}/js/${tabName}.js`);
    module?.init?.();
    // 🔥 TEST FOR SURE
        setTimeout(() => {
        if (typeof loadTeachersToSelect === "function") {
        loadTeachersToSelect();
      } else {
        
      }
    }, 0);

  } catch (err) {
    
  }
}


// ===== MỞ TRANG BÌNH CHỌN =====

function openRatingGV() {
  const select = document.querySelector(".teacherSelect");
  if (!select) {
    alert("Không tìm thấy dropdown giáo viên");
    return;
  }

  const teacherId = select.value;

  if (!teacherId) {
    alert("Vui lòng chọn giáo viên");
    return;
  }
 
  localStorage.setItem("view_teacher_id", teacherId);

  loadTab("binhchongv", "teacher");
}

function goHome() {
  const mainContent = document.getElementById("mainContent");
  const mainBg = document.getElementById("mainBg");
  mainContent.innerHTML = "";
  if (mainBg) mainBg.style.display = "block";
localStorage.removeItem("view_teacher_id");
}

// ✅ FIX GLOBAL
window.openRatingGV = openRatingGV;
window.goHome = goHome;
window.loadTab = loadTab;
window.loadTeachersToSelect = loadTeachersToSelect;

async function loadTeachersToSelect() {
  
  const select = document.querySelector(".teacherSelect");

  if (!select) {
    
    return;
  }

  const data = await readData("users/teachers");
  if (!data) return;

  select.innerHTML = `
    <option value="">-- Chọn giáo viên --</option>
    ${Object.entries(data).map(([id, t]) => {
      const name = t?.profile?.ho_ten || "(Chưa có tên)";
      return `<option value="${id}">${name}</option>`;
    }).join("")}
  `;
  
}

// 🔥 AUTO RUN KHI VÀO TRANG
document.addEventListener("DOMContentLoaded", () => {
  loadTeachersToSelect();
});

// expose nếu cần dùng nút
window.loadTeachersToSelect = loadTeachersToSelect;

// ======================================================
// MOBILE - ĐƯA MAIN CONTENT VÀO KHUNG MOBILE
// ======================================================

function syncMobileContent() {

  const main = document.getElementById("main");
  const mobileMain = document.getElementById("mobileMain");

  if (!main || !mobileMain) return;

  if (window.innerWidth <= 768) {
    mobileMain.appendChild(main);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  syncMobileContent();
});

// ======================================================
// MOBILE - TEACHER PANEL
// ======================================================

function openMobileTeacher() {
  const panel = document.getElementById("mobileTeacherPanel");
  if (!panel) return;
  panel.classList.add("active");
}


function closeMobileTeacher() {
  const panel = document.getElementById("mobileTeacherPanel");
  if (!panel) return;
  panel.classList.remove("active");
}
window.closeMobileTeacher = closeMobileTeacher;



function openMobileStudent() {
  const panel = document.getElementById("mobileStudentPanel");
    if (!panel) return;
  panel.classList.add("active");
  }

function closeMobileStudent() {
  const panel = document.getElementById("mobileStudentPanel");
  if (!panel) return;
  panel.classList.remove("active");
}
window.closeMobileStudent = closeMobileStudent;


function openMobileOther() {
  const panel = document.getElementById("mobileOtherPanel");
  if (!panel) {
    console.error("❌ KHÔNG TÌM THẤY #mobileOtherPanel");
    return;
  }
  panel.classList.add("active");
}


function closeMobileOther() {
  const panel =
    document.getElementById("mobileOtherPanel");
  if (!panel) return;
  panel.classList.remove("active");
}


document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // TEACHER
  // =========================

  const teacherBtn = document.querySelector('[data-mobile-action="teacher"]');
  const closeBtn = document.getElementById("mobileTeacherClose");
  if (teacherBtn) {
    teacherBtn.addEventListener("click", openMobileTeacher);
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", closeMobileTeacher);
  }


  // =========================
  // STUDENT
  // =========================

  const studentBtn = document.querySelector('[data-mobile-action="student"]');
  const studentCloseBtn = document.getElementById("mobileStudentClose");
    if (studentBtn) {
    studentBtn.addEventListener("click", openMobileStudent);
  }

  if (studentCloseBtn) {
    studentCloseBtn.addEventListener("click", closeMobileStudent);
 }

const adminBtn = document.querySelector('[data-mobile-action="admin"]');
if (adminBtn) {
  adminBtn.addEventListener("click", () => {
    location.href = "./pages/admin/adminlogin.html";
  });
}

const homeBtn = document.querySelector('[data-mobile-action="home"]');
if (homeBtn) {
  homeBtn.addEventListener("click", () => {
    location.href = "./index.html";
  });
}

const ratingBtn = document.querySelector('[data-mobile-action="rating"]');
if (ratingBtn) {
  ratingBtn.addEventListener("click", () => {
    const select = document.querySelector(".teacherSelect");
    if (!select) {
      alert("Không tìm thấy danh sách giáo viên");
      return;
    }

    const options = [...select.options]
      .filter(option => option.value)
      .map(option => `
        <button
          type="button"
          class="mobile-rating-teacher"
          data-teacher-id="${option.value}">
          👨‍🏫 ${option.textContent}
        </button>
      `)
      .join("");

    const oldBox =
      document.getElementById("mobileRatingBox");

    if (oldBox) oldBox.remove();

    const box = document.createElement("div");
    box.id = "mobileRatingBox";

    box.innerHTML = `
      <div class="mobile-rating-overlay">
        <div class="mobile-rating-dialog">
          <div class="mobile-rating-header">
            <strong>⭐ Mục xem bình chọn GV</strong>
            <button type="button" id="mobileRatingClose">✕</button>
          </div>
<div class="mobile-rating-menu">

  <button
    type="button"
    id="mobileChooseTeacherBtn"
    class="mobile-rating-list-all">
    ⭐ Chọn giáo viên
  </button>

  <button
    type="button"
    id="mobileRatingListBtn"
    class="mobile-rating-list-all">
    📋 Danh sách bình chọn
  </button>

</div>

<div
  id="mobileTeacherList"
  class="mobile-teacher-list"
  style="display:none;">
  ${options || "<p>Chưa có giáo viên.</p>"}
</div>

        </div>
      </div>
    `;

    document.body.appendChild(box);
// ⭐ CHỌN GIÁO VIÊN
document
  .getElementById("mobileChooseTeacherBtn")
  ?.addEventListener("click", () => {
    const list = document.getElementById("mobileTeacherList");
    if (list) {
      list.style.display = "block";
    }
  });


// 📋 DANH SÁCH BÌNH CHỌN
document
  .getElementById("mobileRatingListBtn")
  ?.addEventListener("click", () => {
    box.remove();
    loadTab("ratinglist", "teacher");
  });
document
      .getElementById("mobileRatingClose")
      ?.addEventListener("click", () => {
        box.remove();
      });

    box.querySelectorAll(".mobile-rating-teacher")
      .forEach(btn => {
        btn.addEventListener("click", () => {
          select.value = btn.dataset.teacherId;
          box.remove();
          openRatingGV();
        });
      });
  });
}
});



// ======================================================
// MOBILE - TEACHER BÀI GIẢNG
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("mobileGvBaiGiangBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
  if (typeof window.mobileTeacherBaigiang === "function") {
    window.mobileTeacherBaigiang();
  }
});
});

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("mobileGvBaiTapBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (typeof window.mobileTeacherBaiTap === "function") {
      window.mobileTeacherBaiTap();
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("mobileGvKiemTraBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (typeof window.mobileTeacherKiemTra === "function") {
      window.mobileTeacherKiemTra();
    }
  });
});


document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("mobileHvBaiGiangBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
  if (
    typeof window.mobileStudentBaigiang ===
    "function"
  ) {
    await window.mobileStudentBaigiang();
    closeMobileStudent();
  }
});
});


document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("mobileHvBaiTapBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    if (
      typeof window.mobileStudentBaiTap ===
      "function"
    ) {
      await window.mobileStudentBaiTap();
      closeMobileStudent();
    }
  });
});


document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("mobileHvDuAnBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    if (
      typeof window.mobileStudentDuAn ===
      "function"
    ) {
      await window.mobileStudentDuAn();
      closeMobileStudent();
    }
  });
});


document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("mobileHvKiemTraBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const desktopBtn = document.getElementById("btnKiemTra");
    if (desktopBtn) {
      desktopBtn.click();
      closeMobileStudent();
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // STUDENT TEST
  // =========================

  const btn = document.querySelector('#mobileStudentPanel button[onclick*="openStudentTest"]');
  if (btn) {
    btn.addEventListener("click", () => {
      closeMobileStudent();
      if (typeof window.openStudentTest === "function") {
        window.openStudentTest();
      }
    });
  }


  // =========================
  // OTHER
  // =========================

  const otherBtn = document.querySelector('[data-mobile-action="other"]');
  const otherCloseBtn = document.getElementById("mobileOtherClose");
  if (otherBtn) {
    otherBtn.addEventListener("click", openMobileOther);
  }
  if (otherCloseBtn) {
    otherCloseBtn.addEventListener("click", closeMobileOther);
  }

// =========================
// NEWS
// =========================

const newsBtn = document.getElementById("mobileNewsBtn");
if (newsBtn) {
  newsBtn.addEventListener("click", async () => {
    closeMobileOther();
    const main = document.getElementById("main");
    const mobileMain = document.getElementById("mobileMain");
    if (main && mobileMain && window.innerWidth <= 768) {
      mobileMain.appendChild(main);
    }
    const content = document.getElementById("mainContent");
    if (!content) {
      console.warn("⚠️ Không tìm thấy #main-content");
      return;
    }
    content.innerHTML = `
      <h2>📰 News</h2>
      <div id="mobileNewsList">
        ⏳ Đang tải...
      </div>
    `;

    const list = document.getElementById("mobileNewsList");
    await loadMobileNews(list);
      });
}


const bookBtn = document.getElementById("mobileBookBtn");
if (bookBtn) {
  bookBtn.addEventListener("click", async () => {
    closeMobileOther();
    const main = document.getElementById("main");
    const mobileMain = document.getElementById("mobileMain");
    if (main && mobileMain && window.innerWidth <= 768) {
      mobileMain.appendChild(main);
    }
    const content = document.getElementById("mainContent");
    if (!content) {
      console.warn("⚠️ Không tìm thấy #mainContent");
      return;
    }

    content.innerHTML = `
      <h2>📖 Sách</h2>
      <div id="mobileBookList">
        ⏳ Đang tải...
      </div>
    `;

    const list = document.getElementById("mobileBookList");
    await loadMobileBook(list);
  });
}


const documentBtn = document.getElementById("mobileDocumentBtn");
if (documentBtn) {
  documentBtn.addEventListener("click", async () => {
    closeMobileOther();
    const main = document.getElementById("main");
    const mobileMain = document.getElementById("mobileMain");
    if (main && mobileMain && window.innerWidth <= 768) {
      mobileMain.appendChild(main);
    }
    const content = document.getElementById("mainContent");
    if (!content) {
      console.warn("⚠️ Không tìm thấy #mainContent");
      return;
    }

    content.innerHTML = `
      <h2>📄 Tài liệu</h2>
      <div id="mobileDocumentList">
        ⏳ Đang tải...
      </div>
    `;

    const list = document.getElementById("mobileDocumentList");
    await loadMobileDocument(list);
  });
}

const musicBtn = document.getElementById("mobileMusicBtn");
if (musicBtn) {
  musicBtn.addEventListener("click", async () => {
    closeMobileOther();
    const content = document.getElementById("mainContent");
    if (!content) {
      console.warn("⚠️ Không tìm thấy #mainContent");
      return;
    }

    content.innerHTML = `
      <h2>🎵 Nhạc – Phim</h2>
      <div id="mobileMusicList">
        ⏳ Đang tải...
      </div>
    `;

    const list = document.getElementById("mobileMusicList");
    await loadMobileMusic(list);
  });
}

const eventBtn = document.getElementById("mobileEventBtn");
if (eventBtn) {
  eventBtn.addEventListener("click", async () => {
    closeMobileOther();
    const main = document.getElementById("main");
    const mobileMain = document.getElementById("mobileMain");
    if (main && mobileMain && window.innerWidth <= 768) {
      mobileMain.appendChild(main);
    }

    const content = document.getElementById("mainContent");
    if (!content) return;

    content.innerHTML = `
      <h2>📅 Sự kiện</h2>
      <div id="mobileEventList">
        ⏳ Đang tải...
      </div>
    `;

    const list = document.getElementById("mobileEventList");
    await loadMobileEvent(list);
  });
}
});