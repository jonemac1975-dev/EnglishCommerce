import { readData } from "../../../scripts/services/firebaseService.js";

/* ================= GLOBAL ================= */

let teachersGlobal = {};
let lopDanhMucGlobal = {};
let monHocDanhMucGlobal = {};

/* ================= INIT ================= */

export async function init() {
  try {
    // load danh mục
    const teachers = await readData("users/teachers");
    const lopDanhMuc = await readData("config/danh_muc/lop");
    const monHocDanhMuc = await readData("config/danh_muc/monhoc");

    teachersGlobal = teachers || {};
    lopDanhMucGlobal = lopDanhMuc || {};
    monHocDanhMucGlobal = monHocDanhMuc || {};

    renderDropdowns();

  } catch (err) {
    console.error("❌ Lỗi init bài giảng bài tập:", err);
  }
}

/* ================= DROPDOWN ================= */

function renderDropdowns() {
  const teacherEl = document.getElementById("teacher");
  const classEl = document.getElementById("class");
  const subjectEl = document.getElementById("subject");

  // giáo viên
  teacherEl.innerHTML = `<option value="">-- Giáo viên --</option>`;
  Object.entries(teachersGlobal).forEach(([id, t]) => {
    const name = t?.profile?.ho_ten || id;
    teacherEl.innerHTML += `<option value="${id}">${name}</option>`;
  });

  // lớp
  classEl.innerHTML = `<option value="">-- Lớp --</option>`;
  Object.entries(lopDanhMucGlobal).forEach(([id, l]) => {
    classEl.innerHTML += `<option value="${id}">${l.name}</option>`;
  });

  // môn
  subjectEl.innerHTML = `<option value="">-- Môn học --</option>`;
  Object.entries(monHocDanhMucGlobal).forEach(([id, m]) => {
    subjectEl.innerHTML += `<option value="${id}">${m.name}</option>`;
  });
}

/* ================= LOAD LIST ================= */

window.loadList = async function () {

  const btn = document.querySelector(".filter-box button");

  if (btn) {
    btn.disabled = true;
    btn.innerText = "Đang tải...";
  }

  try {

    const type = document.querySelector('input[name="type"]:checked').value;
    const teacherId = document.getElementById("teacher").value;
    const classId = document.getElementById("class").value;
    const subjectId = document.getElementById("subject").value;

    const listEl = document.getElementById("list");

    if (!teacherId || !classId || !subjectId) {
      listEl.innerHTML = `<p>⚠️ Chọn đầy đủ giáo viên, lớp, môn</p>`;
      return;
    }

    listEl.innerHTML = "⏳ Đang tải...";

    const data = await readData(`teacher/${teacherId}/${type}`);

    if (!data) {
      listEl.innerHTML = `<p>Không có dữ liệu</p>`;
      return;
    }

    listEl.innerHTML = "";

    Object.entries(data).forEach(([id, item]) => {

      if (item.classId !== classId || item.subjectId !== subjectId) return;

      const div = document.createElement("div");
      div.className = "list-item";
      div.innerText = item.title;
      div.title = item.title;

      div.onclick = () => loadContent(item, type);

      listEl.appendChild(div);
    });

  } catch (err) {
    console.error("❌ Lỗi load list:", err);
    document.getElementById("list").innerHTML =
      `<p style="color:red">Lỗi tải dữ liệu</p>`;
  }

  finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "Load";
    }
  }
};

/* ================= LOAD CONTENT ================= */

function loadContent(item, type) {

  const content = document.getElementById("content_html");
  const mediaBox = document.getElementById("mediaBox");

  if (!content || !mediaBox) {
    console.error("❌ Thiếu #content_html hoặc #mediaBox");
    return;
  }

  // reset
  content.innerHTML = "";
  mediaBox.innerHTML = "";

  /* ================= BÀI GIẢNG ================= */
  if (type === "baigiang") {

    /* ===== MEDIA ===== */
    if (item.media) {

      // MP3
      if (item.media.mp3) {
        mediaBox.appendChild(createMediaButton("🎧 MP3", () => {
          renderMedia(`
            <iframe 
              src="${convertDriveToPreview(item.media.mp3)}"
              width="100%" 
              height="80"
              allow="autoplay">
            </iframe>
          `);
        }));
      }

      // MP32
      if (item.media.mp32) {
        mediaBox.appendChild(createMediaButton("🎧 MP3-2", () => {
          renderMedia(`
            <iframe 
              src="${convertDriveToPreview(item.media.mp32)}"
              width="100%" 
              height="80"
              allow="autoplay">
            </iframe>
          `);
        }));
      }

      // MP4
      if (item.media.mp4) {
        mediaBox.appendChild(createMediaButton("🎬 Video", () => {
          renderMedia(`
            <iframe 
              src="${convertDriveToPreview(item.media.mp4)}"
              width="100%" 
              height="250"
              allow="autoplay">
            </iframe>
          `);
        }));
      }

      // YOUTUBE
      if (item.media.youtube) {
        mediaBox.appendChild(createMediaButton("▶ YouTube", () => {
          renderMedia(`
            <iframe 
              src="${convertYoutube(item.media.youtube)}"
              width="100%" 
              height="250"
              allowfullscreen>
            </iframe>
          `);
        }));
      }
    }

    /* ===== CONTENT HTML ===== */
    if (item.content_html) {
      if (item.content_html.startsWith("http")) {
        content.innerHTML = `
          <iframe src="${item.content_html}" width="100%" height="500"></iframe>
        `;
      } else {
        content.innerHTML = item.content_html;
      }
    }

  }

  /* ================= BÀI TẬP ================= */
  else {
    content.innerHTML = item.content_html || "<p>Không có nội dung</p>";
  }
}

/* ================= HELPERS ================= */

function convertDrive(link) {
  if (!link) return "";

  return link
    .replace("/view?usp=sharing", "/preview")
    .replace("/view", "/preview");
}

function convertYoutube(link) {
  return link
    .replace("watch?v=", "embed/")
    + "?autoplay=1";
}

function createMediaButton(label, onClick) {
  const btn = document.createElement("button");
  btn.innerText = label;
  btn.className = "media-btn";
  btn.onclick = onClick;
  return btn;
}

function renderMedia(html) {
  const mediaBox = document.getElementById("mediaBox");

  // giữ lại vùng button
  let viewer = mediaBox.querySelector(".media-viewer");

  if (!viewer) {
    viewer = document.createElement("div");
    viewer.className = "media-viewer";
    mediaBox.appendChild(viewer);
  }

  viewer.innerHTML = html;
}

function convertDriveToPreview(url) {
  if (!url) return "";

  const match = url.match(/\/file\/d\/([^/]+)/);
  if (match) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }

  return url;
}