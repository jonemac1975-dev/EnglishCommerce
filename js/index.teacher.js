import { readData } from "../scripts/services/firebaseService.js";
import { loadTeacherHeaderTheme } from "./index.head.dynamic.js";

let GLOBAL_CLASS_MAP = {};
let offlineStarted = false;
let MAIN_HISTORY = [];
let MAIN_HOME_HTML = "";

/* ================= HISTORY ================= */
function pushView(renderFn) {
  MAIN_HISTORY.push(renderFn);
}

function goBack() {
  // 🔥 nếu đã quay về hết thì reload lại trang cho sạch
  if (MAIN_HISTORY.length <= 1) {
    location.reload();
    return;
  }

  MAIN_HISTORY.pop(); // bỏ view hiện tại
  const prev = MAIN_HISTORY[MAIN_HISTORY.length - 1];
  if (typeof prev === "function") prev();
}



function renderMainWithBack(content, showBack = true) {
  const main = document.getElementById("main");
  if (!main) return;

  const grid = document.getElementById("mainGrid");
  if (grid) grid.style.display = "none";

  main.innerHTML = `
    ${showBack ? `<button id="globalBackBtn" class="back-btn">⬅ Quay lại</button>` : ""}
    ${content}
  `;

  if (showBack) {
    const backBtn = document.getElementById("globalBackBtn");
    if (backBtn) backBtn.onclick = goBack;
  }
}

function showHomeView() {
  const main = document.getElementById("main");
  const grid = document.getElementById("mainGrid");
  const mediaBox = document.getElementById("teacherMedia");
  const playerBox = document.getElementById("teacherPlayer");

  if (grid) grid.style.display = "grid";

  // 🔥 khôi phục lại giao diện ban đầu của main
  if (main) {
    main.innerHTML = MAIN_HOME_HTML || "";
  }

  // ẩn media/player
  if (mediaBox) mediaBox.style.display = "none";
  if (playerBox) playerBox.innerHTML = "";

  MAIN_HISTORY = [];
}

/* ================= DRIVE PREVIEW ================= */
function convertDriveToPreview(url) {
  if (!url) return "";

  const match = url.match(/\/file\/d\/([^/]+)/);
  if (match) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }

  return url;
}



/* ================= INIT SIDEBAR ================= */
async function initTeacherSidebar() {
  const main = document.getElementById("main");
  if (main && !MAIN_HOME_HTML) {
    MAIN_HOME_HTML = main.innerHTML;
  }

  const teacherId = localStorage.getItem("teacher_id");
  if (!teacherId) return;

  await loadTeacherHeaderTheme(); // 🔥 đổi head theo giáo viên

  const teacherData = await readData("teacher/" + teacherId);
  if (!teacherData) return;

  const config = await readData("config");
  GLOBAL_CLASS_MAP = config?.danh_muc?.lop || {};

  // ===== MENU BÀI GIẢNG =====
  const menuBaigiang = document.getElementById("gv-baigiang");
  menuBaigiang.innerHTML = `<li class="menu-title">Bài giảng</li>`;
  menuBaigiang.querySelector(".menu-title").onclick = () => {
    MAIN_HISTORY = [];
    loadClassList(teacherData.baigiang || {}, "baigiang");
  };

  // ===== MENU BÀI TẬP =====
  const menuBaitap = document.getElementById("gv-baitap");
  menuBaitap.innerHTML = `<li class="menu-title">Bài tập</li>`;
  menuBaitap.querySelector(".menu-title").onclick = () => {
    MAIN_HISTORY = [];
    loadClassList(teacherData.baitap || {}, "baitap");
  };

  // ===== MENU KIỂM TRA =====
  const menuKiemtra = document.getElementById("gv-kiemtra");
  menuKiemtra.innerHTML = `<li class="menu-title">Bài kiểm tra</li>`;
  menuKiemtra.querySelector(".menu-title").onclick = () => {
    MAIN_HISTORY = [];
    loadClassList(teacherData.kiemtra || {}, "kiemtra");
  };

  // ===== MENU VĂN BẢN =====
  const menuVanban = document.getElementById("gv-vanban");
  menuVanban.innerHTML = `<li class="menu-title">Văn bản - Hội thảo</li>`;
  menuVanban.querySelector(".menu-title").onclick = () => {
    MAIN_HISTORY = [];
    loadVanbanList(teacherData.vanban || {});
  };
}

/* ================= TEACHER ONLINE/TRỰC TIẾP ================= */
const teacherModeRadios = document.getElementsByName("teacher_mode");
const teacherLop = document.getElementById("teacherLop");
const teacherLinks = document.getElementById("teacherLinks");

teacherModeRadios.forEach(radio => {
  radio.addEventListener("change", async () => {
    const mode = document.querySelector('input[name="teacher_mode"]:checked').value;
    if (mode === "online") {
      teacherLop.style.display = "inline-block";
      await loadTeacherLopDropdown();
    } else {
      teacherLop.style.display = "none";
      teacherLinks.innerHTML = "";
    }
  });
});

/* ================= LOAD DROPDOWN LỚP ================= */
async function loadTeacherLopDropdown() {
  const config = await readData("config/danh_muc/lop");
  if (!config) return;

  teacherLop.innerHTML = `<option value="">Chọn lớp</option>`;
  Object.entries(config).forEach(([id, item]) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = item.name || id;
    teacherLop.appendChild(opt);
  });
}

/* ================= CHỌN LỚP ================= */
teacherLop.addEventListener("change", async () => {
  const lopId = teacherLop.value;
  if (!lopId) return;

  const teacherId = localStorage.getItem("teacher_id");
  const list = await readData(`teacher/${teacherId}/linkday`);
  if (!list) return;

  teacherLinks.innerHTML = "";

  const lopLinks = Object.values(list).filter(l => l.lop === lopId);

  if (lopLinks.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.textContent = "Chưa có Link";
    emptyMsg.style.fontStyle = "italic";
    emptyMsg.style.color = "#888";
    teacherLinks.appendChild(emptyMsg);
    return;
  }

  lopLinks.forEach(l => {
    const linkBtn = document.createElement("button");

    linkBtn.textContent = "Vào dạy";
    linkBtn.classList.add("btn-vao-day");

    linkBtn.style.background = "#ffa94d";
    linkBtn.style.color = "#fff";
    linkBtn.style.padding = "4px 4px";
    linkBtn.style.borderRadius = "4px";
    linkBtn.style.border = "none";
    linkBtn.style.cursor = "pointer";
    linkBtn.style.margin = "4px 4px 4px 0";
    linkBtn.style.display = "inline-block";

    linkBtn.addEventListener("mouseover", () => {
      linkBtn.style.background = "#ff922b";
    });

    linkBtn.addEventListener("mouseout", () => {
      linkBtn.style.background = "#ffa94d";
    });

    linkBtn.addEventListener("click", async () => {
      const mode = document.querySelector('input[name="teacher_mode"]:checked')?.value;
      const selectedClass = teacherLop.value;

      if (!mode) {
        alert("❌ Chọn Online hoặc Offline");
        return;
      }

      if (!selectedClass) {
        alert("❌ Chưa chọn lớp");
        return;
      }

      if (l.lop !== selectedClass) {
        alert("❌ Link không đúng lớp đã chọn");
        return;
      }

      const className = GLOBAL_CLASS_MAP[selectedClass]?.name || "Lớp";

      if (window.startSession) {
        await window.startSession(selectedClass, className, mode);
      } else {
        return;
      }

      if (mode === "online") {
        window.open(l.made, "_blank");
      }
    });

    teacherLinks.appendChild(linkBtn);
  });
});

/* ================= LOAD BÀI GIẢNG / BÀI TẬP ================= */
function loadLesson(item) {
  const mediaBox = document.getElementById("teacherMedia");
  const playerBox = document.getElementById("teacherPlayer");

  let content = "";

  if (item.content_html) {
    if (item.content_html.startsWith("http")) {
      content = `
        <iframe 
          src="${item.content_html}" 
          width="100%" 
          height="600"
          style="border:none;"
          allowfullscreen
          webkitallowfullscreen
          mozallowfullscreen
          allow="fullscreen">
        </iframe>
      `;
    } else {
      content = item.content_html;
    }
  } else {
    content = "<p>Không có nội dung</p>";
  }

  renderMainWithBack(`
    <div class="lesson-content">
      <h3>${item.title || item.tieude || "Nội dung"}</h3>
      ${content}
    </div>
  `);

  // ===== LOAD MEDIA =====
  if (item.media && mediaBox) {
    mediaBox.style.display = "flex";
    mediaBox.style.flexDirection = "column";

    const mp3  = document.getElementById("gvMp3");
    const mp32 = document.getElementById("gvMp32");
    const mp4  = document.getElementById("gvMp4");
    const yt   = document.getElementById("gvYoutube");

    function renderMedia(el, icon, label, url) {
      if (!el) return;

      el.dataset.url = url || "";
      el.innerHTML = `
        <div class="media-item">
          <span class="media-icon">${icon}</span>
          <span class="media-title">${label} - ${item.title || ""}</span>
        </div>
      `;
    }

    renderMedia(mp3,  "🎧", "MP3", item.media.mp3);
    renderMedia(mp32, "🎧", "MP32", item.media.mp32);
    renderMedia(mp4,  "🎬", "MP4", item.media.mp4);
    renderMedia(yt,   "▶️", "YouTube", item.media.youtube);
  } else {
    if (mediaBox) mediaBox.style.display = "none";
    if (playerBox) playerBox.innerHTML = "";
  }
}

/* ================= LOAD KIỂM TRA ================= */
function loadExam(item) {
  renderMainWithBack(`
    <div class="exam-content">
      <h3>${item.title || item.tieude || "Bài kiểm tra"}</h3>
      ${item.noidung || "<p>Không có nội dung</p>"}
    </div>
  `);
}

initTeacherSidebar();
loadTeacherHeaderTheme();
window.loadTeacherHeaderTheme = loadTeacherHeaderTheme;

/* ================= MEDIA CLICK ================= */
document.addEventListener("click", function(e) {
  const parent = e.target.closest("#gvMp3, #gvMp32, #gvMp4, #gvYoutube");
  if (!parent) return;

  const id = parent.id;
  const rawUrl = parent.dataset.url;
  if (!rawUrl) return;

  const box = document.getElementById("teacherPlayer");

  document.querySelectorAll(".media-item")
    .forEach(el => el.classList.remove("active"));

  parent.querySelector(".media-item")?.classList.add("active");

  if (id === "gvYoutube") {
    const videoId = rawUrl.split("v=")[1]?.split("&")[0];

    box.innerHTML = `
      <iframe width="100%" height="150"
        src="https://www.youtube.com/embed/${videoId}"
        frameborder="0"
        allowfullscreen>
      </iframe>
    `;
  } else if (id === "gvMp4") {
    const previewUrl = convertDriveToPreview(rawUrl);
    box.innerHTML = `
      <iframe src="${previewUrl}" width="100%" height="150" allow="autoplay"></iframe>
    `;
  } else if (id === "gvMp3" || id === "gvMp32") {
    const previewUrl = convertDriveToPreview(rawUrl);
    box.innerHTML = `
      <iframe src="${previewUrl}" width="100%" height="80" allow="autoplay"></iframe>
    `;
  }
});

/* ================= VĂN BẢN ================= */
function loadVanbanList(data) {
  const list = Object.values(data || {});

  const render = () => {
    if (!list.length) {
      renderMainWithBack("<p>Không có văn bản</p>");
      return;
    }

    let html = `
      <h3>📚 Văn bản - Hội thảo</h3>
      <ul>
    `;

    list.forEach((item, index) => {
      html += `
        <li class="vanban-item" data-index="${index}">
          📄 ${item.title || item.tieude || "Không tên"}
        </li>
      `;
    });

    html += "</ul>";
    renderMainWithBack(html);

    document.querySelectorAll(".vanban-item").forEach(el => {
      el.onclick = () => {
        const index = Number(el.dataset.index);
        const item = list[index];

        pushView(render);
        loadLesson(item);
      };
    });
  };

  pushView(render);
  render();
}


/* ================= LOAD DANH SÁCH LỚP ================= */
function loadClassList(data, type) {
  const group = {};

  Object.values(data).forEach(item => {
    let classId = "";
    if (type === "baigiang" || type === "baitap") {
      classId = (item.classId || "").trim();
    } else if (type === "kiemtra" || type === "vanban") {
      classId = (item.lop || "").trim();
    }

    if (!classId) return;

    if (!group[classId]) group[classId] = [];
    group[classId].push(item);
  });

  const render = () => {
    let html = `<h3>Danh sách lớp</h3><ul>`;

    Object.entries(group).forEach(([id, list]) => {
      const className = GLOBAL_CLASS_MAP[id]?.name || "❌ Không tìm thấy";
      html += `<li class="class-item" data-id="${id}">📚 ${className} (${list.length})</li>`;
    });

    html += "</ul>";
    renderMainWithBack(html);

    document.querySelectorAll(".class-item").forEach(el => {
      el.onclick = async () => {
        const id = el.dataset.id;
        const className = GLOBAL_CLASS_MAP[id]?.name || "";
        const mode = document.querySelector('input[name="teacher_mode"]:checked')?.value;

        if (!mode) {
          alert("❌ Chọn Online hoặc Offline");
          return;
        }

        const items = group[id] || [];
        if (!items.length) {
          alert("❌ Không có bài nào trong lớp này");
          return;
        }

        // =========================
        // OFFLINE
        // =========================
        if (mode === "truc_tiep") {
          if (!offlineStarted) {
            const ok = await window.askStartSession(id, className, "offline");

            // ❌ Cancel → chỉ load bài, tuyệt đối không điểm danh
            if (!ok) {
              pushView(render);
              loadItemList(items, className, type);
              return;
            }

            // ✅ OK → đánh dấu đã bật offline
            offlineStarted = true;
          }

          pushView(render);
          loadItemList(items, className, type);
          return;
        }

        // =========================
        // ONLINE / MODE KHÁC
        // =========================
        pushView(render);
        loadItemList(items, className, type);
      };
    });
  };

  pushView(render);
  render();
}

/* ================= LOAD DANH SÁCH BÀI ================= */
function loadItemList(list, className, type) {
  const render = () => {
    let html = `
      <h3>${className}</h3>
      <ul>
    `;

    list.forEach((item, index) => {
      html += `
        <li class="item" data-index="${index}">
          ▶ ${item.title || item.tieude || "Không tên"}
        </li>
      `;
    });

    html += "</ul>";
    renderMainWithBack(html);

    document.querySelectorAll(".item").forEach(el => {
      el.onclick = () => {
        const index = Number(el.dataset.index);
        const item = list[index];

        if (!item) {
          alert("❌ Không tìm thấy bài");
          return;
        }

        pushView(render);

        if (type === "baigiang" || type === "baitap" || type === "vanban") {
          loadLesson(item);
        }

        if (type === "kiemtra") {
          loadExam(item);
        }
      };
    });
  };

  render();
}