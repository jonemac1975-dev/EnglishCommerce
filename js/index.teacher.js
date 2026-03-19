import { readData } from "../scripts/services/firebaseService.js";

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

  // ===== LOAD DATA ĐÚNG NODE =====
  const teacherData = await readData("teacher/" + teacherId);
  if (!teacherData) return;

  loadMenu("gv-baigiang", teacherData.baigiang, "baigiang");
  loadMenu("gv-baitap", teacherData.baitap, "baitap");
  loadMenu("gv-kiemtra", teacherData.kiemtra, "kiemtra");
}

function loadMenu(elementId, data, type) {

  const ul = document.getElementById(elementId);
  if (!ul || !data) return;

  ul.innerHTML = "";

  Object.entries(data).forEach(([id, item]) => {

    const li = document.createElement("li");
    li.textContent = item.title || item.tieude || "Không tên";

    li.onclick = () => {
console.log("CLICK OK", item); // 👈 thêm dòng này

      if (type === "baigiang") {
        loadLesson(item);
      }

      if (type === "baitap") {
        loadLesson(item);
      }

      if (type === "kiemtra") {
        loadExam(item);
      }
    };

    ul.appendChild(li);
  });
}

/* ================= LOAD BÀI GIẢNG / BÀI TẬP ================= */

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