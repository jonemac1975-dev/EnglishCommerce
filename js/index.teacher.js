import { readData } from "../scripts/services/firebaseService.js";


let GLOBAL_CLASS_MAP = {};


function convertDriveToPreview(url) {
  if (!url) return "";

  const match = url.match(/\/file\/d\/([^/]+)/);
  if (match) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }

  return url;
}


async function initTeacherSidebar() {
  const teacherId = localStorage.getItem("teacher_id");
  if (!teacherId) return;

  // ===== LOAD TEACHER DATA =====
  const teacherData = await readData("teacher/" + teacherId);
  if (!teacherData) return;

  // ===== LOAD CLASS MAP =====
  const config = await readData("config");
  GLOBAL_CLASS_MAP = config?.danh_muc?.lop || {};
  console.log("CLASS MAP:", GLOBAL_CLASS_MAP);

  // ===== MENU BÀI GIẢNG =====
  const menuBaigiang = document.getElementById("gv-baigiang");
  menuBaigiang.innerHTML = `<li class="menu-title">Bài giảng</li>`;
  menuBaigiang.querySelector(".menu-title").onclick = () => {
    loadClassList(teacherData.baigiang || {}, "baigiang");
  };

  // ===== MENU BÀI TẬP =====
  const menuBaitap = document.getElementById("gv-baitap");
  menuBaitap.innerHTML = `<li class="menu-title">Bài tập</li>`;
  menuBaitap.querySelector(".menu-title").onclick = () => {
    loadClassList(teacherData.baitap || {}, "baitap");
  };

  // ===== MENU KIỂM TRA =====
  const menuKiemtra = document.getElementById("gv-kiemtra");
  menuKiemtra.innerHTML = `<li class="menu-title">Bài kiểm tra</li>`;
  menuKiemtra.querySelector(".menu-title").onclick = () => {
    loadClassList(teacherData.kiemtra || {}, "kiemtra");
  };
}


// ================= TEACHER ONLINE/TRỰC TIẾP =================
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

// ================= LOAD DROPDOWN LỚP =================
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

// ================= CHỌN LỚP =================
teacherLop.addEventListener("change", async () => {
  const lopId = teacherLop.value;
  if (!lopId) return;

  const teacherId = localStorage.getItem("teacher_id");
  const list = await readData(`teacher/${teacherId}/linkday`);
  if (!list) return;

  teacherLinks.innerHTML = "";

  // lọc các link của lớp này
  const lopLinks = Object.values(list).filter(l => l.lop === lopId);

  if (lopLinks.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.textContent = "Chưa có Link";
    emptyMsg.style.fontStyle = "italic";
    emptyMsg.style.color = "#888";
    teacherLinks.appendChild(emptyMsg);
    return;
  }

  // tạo nút [Vào dạy] cho từng link
  lopLinks.forEach(l => {
  const linkBtn = document.createElement("button");

  linkBtn.textContent = "Vào dạy";
  linkBtn.classList.add("btn-vao-day");

  // 👉 STYLE TRỰC TIẾP
  linkBtn.style.background = "#ffa94d";
  linkBtn.style.color = "#fff";
  linkBtn.style.padding = "4px 4px";
  linkBtn.style.borderRadius = "4px";
  linkBtn.style.border = "none";
  linkBtn.style.cursor = "pointer";
  linkBtn.style.margin = "4px 4px 4px 0";
  linkBtn.style.display = "inline-block";

  // hover (JS version 😎)
  linkBtn.addEventListener("mouseover", () => {
    linkBtn.style.background = "#ff922b";
  });

  linkBtn.addEventListener("mouseout", () => {
    linkBtn.style.background = "#ffa94d";
  });

  linkBtn.addEventListener("click", async () => {

  const classId = l.lop;
  const className = GLOBAL_CLASS_MAP[classId]?.name || "Lớp";

  console.log("🚀 Vào dạy:", classId, className);

  // 🔥 1. START SESSION
  if (window.startSession) {
    await window.startSession(classId, className);
  } else {
    console.error("❌ Không tìm thấy startSession");
  }

  // 🔥 2. MỞ LINK
  window.open(l.made, "_blank");
});

  teacherLinks.appendChild(linkBtn);
});
});



function loadMenu(elementId, data, type, classMap = {}) {

  const ul = document.getElementById(elementId);
  if (!ul || !data) return;

  ul.innerHTML = "";

  const li = document.createElement("li");

  // 👉 đổi tên theo loại
  if (type === "baigiang") li.textContent = "📚 Bài giảng";
  if (type === "baitap") li.textContent = "📝 Bài tập";
  if (type === "kiemtra") li.textContent = "🧪 Kiểm tra";

  li.onclick = () => {
  loadClassList(data, GLOBAL_CLASS_MAP, type);
};

  ul.appendChild(li);
}
/* ================= LOAD BÀI GIẢNG / BÀI TẬP /VĂN BẢN================= */

function loadLesson(item) {

  const main = document.getElementById("main");
  const mediaBox = document.getElementById("teacherMedia");
  const playerBox = document.getElementById("teacherPlayer");

  console.log("LOAD LESSON:", item);

  // Ẩn grid nếu có
  const grid = document.getElementById("mainGrid");
  if (grid) grid.style.display = "none";

  // ===== LOAD HTML =====
  let content = "";

if (item.content_html) {

  // Nếu là link (http)
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
    // Nếu là HTML thật
    content = item.content_html;
  }

} else {
  content = "<p>Không có nội dung</p>";
}

main.innerHTML = `
  <div class="lesson-content">
    ${content}
  </div>
`;

  // ===== LOAD MEDIA =====
if (item.media && mediaBox) {

  mediaBox.style.display = "flex";
  mediaBox.style.flexDirection = "column";

  const mp3  = document.getElementById("gvMp3");
  const mp32 = document.getElementById("gvMp32");
  const mp4  = document.getElementById("gvMp4");
  const yt   = document.getElementById("gvYoutube");

  // helper render item
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

  const main = document.getElementById("main");

  const grid = document.getElementById("mainGrid");
  if (grid) grid.style.display = "none";

  main.innerHTML = item.noidung || "";
}

initTeacherSidebar();


document.addEventListener("click", function(e){

  const parent = e.target.closest("#gvMp3, #gvMp32, #gvMp4, #gvYoutube");
  if (!parent) return;

  const id = parent.id;
  const rawUrl = parent.dataset.url;
  if (!rawUrl) return;

  const box = document.getElementById("teacherPlayer");

  // ===== ACTIVE UI =====
  document.querySelectorAll(".media-item")
    .forEach(el => el.classList.remove("active"));

  parent.querySelector(".media-item")?.classList.add("active");

  /* ================= YOUTUBE ================= */
  if (id === "gvYoutube") {

    const videoId = rawUrl.split("v=")[1]?.split("&")[0];

    box.innerHTML = `
      <iframe width="100%" height="150"
        src="https://www.youtube.com/embed/${videoId}"
        frameborder="0"
        allowfullscreen>
      </iframe>
    `;

  }

  /* ================= MP4 ================= */
  else if (id === "gvMp4") {

    const previewUrl = convertDriveToPreview(rawUrl);

    box.innerHTML = `
      <iframe src="${previewUrl}" width="100%" height="150" allow="autoplay"></iframe>
    `;

  }

  /* ================= MP3 + MP32 ================= */
  else if (id === "gvMp3" || id === "gvMp32") {

    const previewUrl = convertDriveToPreview(rawUrl);

    box.innerHTML = `
      <iframe src="${previewUrl}" width="100%" height="80" allow="autoplay"></iframe>
    `;

  }

});




function loadClassList(data, type) {
  const main = document.getElementById("main");
  const group = {};

  Object.values(data).forEach(item => {
    // ===== Lấy ID lớp theo type =====
    let classId = "";
    if (type === "baigiang" || type === "baitap") {
      classId = (item.classId || "").trim();
    } else if (type === "kiemtra") {
      classId = (item.lop || "").trim();
    }

    if (!classId) return; // bỏ nếu không có ID

    if (!group[classId]) group[classId] = [];
    group[classId].push(item);
  });

  // ===== Render danh sách lớp =====
  let html = "<h3>Danh sách lớp</h3><ul>";
  Object.entries(group).forEach(([id, list]) => {
    const className = GLOBAL_CLASS_MAP[id]?.name || "❌ Không tìm thấy";
    html += `<li class="class-item" data-id="${id}">📚 ${className} (${list.length})</li>`;
  });
  html += "</ul>";
  main.innerHTML = html;

  // ===== Click lớp =====
  document.querySelectorAll(".class-item").forEach(el => {
    el.onclick = async () => {

  const id = el.dataset.id;
  const className = GLOBAL_CLASS_MAP[id]?.name || "";

  // 🔥 START SESSION
  if (window.startSession) {
    await window.startSession(id, className);
  }

  const items = group[id] || [];
  if (!items.length) {
    alert("❌ Không có bài nào trong lớp này");
    return;
  }

  loadItemList(items, className, type);
};
  });
}


function loadItemList(list, className, type) {
  const main = document.getElementById("main");

  let html = `
    <button id="backBtn">⬅ Quay lại</button>
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
  main.innerHTML = html;

  // ===== BACK BUTTON =====
  document.getElementById("backBtn").onclick = () => {
    // quay lại danh sách lớp
    loadClassList(list.reduce((acc, i) => { 
      // build lại object gốc để loadClassList nhận
      acc[i.classId || i.lop || ""] = i; 
      return acc;
    }, {}), type);
  };

  // ===== CLICK ITEM =====
  document.querySelectorAll(".item").forEach(el => {
    el.onclick = () => {
      const index = Number(el.dataset.index);
      const item = list[index];

      if (!item) {
        alert("❌ Không tìm thấy bài");
        return;
      }

      if (type === "baigiang" || type === "baitap") loadLesson(item);
      if (type === "kiemtra") loadExam(item);
    };
  });
}