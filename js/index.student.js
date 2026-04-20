// ----- PHẦN HỌC VIÊN -------//

import { readData } from "../scripts/services/firebaseService.js";

const teacherNameMap = {};

/* ==============================
   DOM READY
============================== */
document.addEventListener("DOMContentLoaded", async () => {

  /* ===== SESSION ===== */
  const studentData = JSON.parse(localStorage.getItem("studentLogin"));
  const isLogged = studentData?.logged === true;

// Thêm phần login để đánh giá giáo viên
if (isLogged) {
  window.currentUser = {
    uid: studentData.id,
    role: "student"
  };

  // (bonus) cho rating dùng luôn localStorage chuẩn
  localStorage.setItem("user", JSON.stringify(window.currentUser));
}


  /* ===== DOM ===== */
  const avatarBox = document.getElementById("studentAvatar");
  const nameBox   = document.getElementById("studentName");
  const teacherSelect = document.getElementById("teacherSelect");
  const lopSelect = document.getElementById("lopSelect");
  const monhocSelect = document.getElementById("monhocSelect");

  const btnRegister = document.querySelector(".sidebar.student button:nth-of-type(1)");
  const btnLogin    = document.querySelector(".sidebar.student button:nth-of-type(2)");

  const hvBaigiang = document.getElementById("hv-baigiang");
const hvBaitap   = document.getElementById("hv-baitap");
const hvDuan     = document.getElementById("hv-duan");

  /* ==============================
     CHƯA LOGIN
  ============================== */
  if (!isLogged) {
    if (avatarBox) avatarBox.innerHTML = "";
    if (nameBox) nameBox.textContent = "";

    if (btnRegister) btnRegister.style.display = "block";
    if (btnLogin) btnLogin.style.display = "block";
    return;
  }

  /* ==============================
   ĐÃ LOGIN
============================== */
if (btnRegister) btnRegister.style.display = "none";
if (btnLogin) btnLogin.style.display = "none";

try {
  // 👉 load profile mới nhất từ Firebase
  const profile = await readData(`users/students/${studentData.id}/profile`);

  const avatar = profile?.avatar || "./store/default-avatar.png";
  const hoTen  = profile?.ho_ten || "Học viên";

  // 👉 render avatar
  if (avatarBox) {
    avatarBox.innerHTML = `
      <img src="${avatar}"
           style="
             width:80px;
             height:80px;
             border-radius:50%;
             object-fit:cover;
             border:2px solid #e3e8f0;
           ">
    `;
  }

  // 👉 render tên
  if (nameBox) {
    nameBox.textContent = hoTen;
  }

  // 👉 update lại localStorage cho đồng bộ (optional nhưng nên có)
  const updatedLogin = {
    ...studentData,
    avatar: avatar,
    ho_ten: hoTen
  };
  localStorage.setItem("studentLogin", JSON.stringify(updatedLogin));

} catch (err) {
//  console.error("Lỗi load profile:", err);

  // fallback nếu lỗi Firebase
  if (avatarBox) {
    avatarBox.innerHTML = `
      <img src="./store/default-avatar.png"
           style="width:80px;height:80px;border-radius:50%;">
    `;
  }

  if (nameBox) {
    nameBox.textContent = "Học viên";
  }
}

/* ==============================
   NÚT KIỂM TRA (HỌC VIÊN)
============================== */
const btnKiemTra = document.getElementById("btnKiemTra");

if (btnKiemTra) {
  btnKiemTra.onclick = () => {
    loadStudentTab(
      "/pages/student/tab/kiemtra.html",
      "/pages/student/js/kiemtra.js"
    );
  };
}
  /* ==============================
     LOAD GIÁO VIÊN
  ============================== */
  async function loadTeachers() {
    if (!teacherSelect) return;

    const teacherData = await readData("teacher");
    if (!teacherData) return;

    const teacherProfiles = await readData("users/teachers");

    teacherSelect.innerHTML = `<option value="">Chọn giáo viên</option>`;

    Object.keys(teacherData).forEach(id => {
      const profile = teacherProfiles?.[id];
      const hoTen =
        profile?.profile?.ho_ten ||
        profile?.auth?.username ||
        id;

      teacherNameMap[id] = hoTen;

      const option = document.createElement("option");
      option.value = id;
      option.textContent = hoTen;
      teacherSelect.appendChild(option);
    });

    const savedTeacher = localStorage.getItem("selectedTeacher");
    if (savedTeacher && teacherData[savedTeacher]) {
      teacherSelect.value = savedTeacher;
      await loadTeacherContent(savedTeacher);
    }
  }


// ===== Trực tiêp / Online =====
// ===== ELEMENTS =====
const studentLinksDiv = document.getElementById("studentLinks");
const studentModeRadios = document.getElementsByName("student_mode");

// ===== HELPER =====
function getStudentMode() {
  const val = Array.from(studentModeRadios).find(r => r.checked)?.value;

  // 🔥 map về chuẩn hệ thống
  if (val === "truc_tiep") return "offline";

  return val; // online
}

// ===== HIỂN THỊ LINK =====
async function updateStudentLinks() {
  studentLinksDiv.innerHTML = "";

  // chỉ hiện khi Online + đã chọn GV + lớp
  if (getStudentMode() !== "online") {
  studentLinksDiv.style.display = "block";
  studentLinksDiv.innerHTML = `
    <div style="color:#555; font-style:italic;">
      📱 Vui lòng quét QR hoặc nhập mã lớp từ giáo viên
    </div>
  `;
  return;
}
  studentLinksDiv.style.display = "block";

  // lấy danh sách link từ Firebase
  const list = await readData(`teacher/${teacherSelect.value}/linkday`);
  if (!list) return;

  const lopLinks = Object.values(list).filter(l => l.lop === lopSelect.value);

  if (lopLinks.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.textContent = "Chưa có Link";
    emptyMsg.style.fontStyle = "italic";
    emptyMsg.style.color = "#888";
    studentLinksDiv.appendChild(emptyMsg);
    return;
  }

  lopLinks.forEach(l => {
  const btn = document.createElement("button");

  btn.textContent = "🎓 Vào lớp";

  btn.style.setProperty("background", "#ffa94d", "important");
  btn.style.setProperty("color", "#fff", "important");
  btn.style.padding = "6px 12px";
  btn.style.borderRadius = "6px";
  btn.style.border = "none";
  btn.style.cursor = "pointer";
  btn.style.margin = "4px 6px 4px 0";

  btn.addEventListener("mouseover", () => {
    btn.style.setProperty("background", "#ff922b", "important");
  });

  btn.addEventListener("mouseout", () => {
    btn.style.setProperty("background", "#ffa94d", "important");
  });

  btn.addEventListener("click", async () => {

  const mode = getStudentMode();
  const classId = lopSelect.value;

  if (!classId) {
    alert("❌ Chưa chọn lớp");
    return;
  }

  // 🔥 1. join session
  const ok = await window.joinSession(classId);

  if (!ok) {
    alert("❌ Chưa có lớp đang học");
    return;
  }

  // 🔥 2. nếu ONLINE → mở link
  if (mode === "online") {
    window.open(l.made, "_blank");
  }

});

  studentLinksDiv.appendChild(btn);
});
}

// ===== EVENTS =====
teacherSelect?.addEventListener("change", updateStudentLinks);
lopSelect?.addEventListener("change", updateStudentLinks);
studentModeRadios.forEach(r => r.addEventListener("change", updateStudentLinks));


/* ==============================
     LOAD Lớp
  ============================== */
async function loadLop() {
  if (!lopSelect) return;

  const data = await readData("config/danh_muc/lop");
  if (!data) return;

  lopSelect.innerHTML = `<option value="">Chọn lớp</option>`;

  Object.entries(data).forEach(([id, item]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = item.name || id;
    lopSelect.appendChild(option);
  });

  // nếu đã chọn trước đó
  const savedLop = localStorage.getItem("selectedLop");
  if (savedLop) {
    lopSelect.value = savedLop;
  }
}

/* ==============================
   LOAD MÔN HỌC
============================== */
async function loadMonHoc() {
  if (!monhocSelect) return;

  const data = await readData("config/danh_muc/monhoc");
  if (!data) return;

  monhocSelect.innerHTML = `<option value="">Chọn môn</option>`;

  Object.entries(data).forEach(([id, item]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = item.name || id;
    monhocSelect.appendChild(option);
  });

  // nếu đã chọn trước đó
  const savedMonHoc = localStorage.getItem("selectedMonHoc");
  if (savedMonHoc) {
    monhocSelect.value = savedMonHoc;
  }
}

/* ==============================
     CHỌN LỚP
  ============================== */
if (lopSelect) {
  lopSelect.addEventListener("change", function () {
    localStorage.setItem("selectedLop", this.value);
  });
}
/* ==============================
   CHỌN MÔN HỌC
============================== */
if (monhocSelect) {
  monhocSelect.addEventListener("change", function () {
    localStorage.setItem("selectedMonHoc", this.value);
  });
}
 await loadLop();
 await loadMonHoc();

  /* ==============================
     LOAD NỘI DUNG GIÁO VIÊN THEO LỚP
============================== */
async function loadTeacherContent(teacherId) {
  if (!teacherId) return;

  const selectedLop = lopSelect?.value || "";
  const selectedMonHoc = monhocSelect?.value || "";
  localStorage.setItem("selectedTeacher", teacherId);
  localStorage.setItem("selectedTeacherName", teacherNameMap[teacherId] || teacherId);

  const map = {
  baigiang: hvBaigiang,
  baitap: hvBaitap,
  duan: hvDuan
};

  for (const type in map) {
    const container = map[type];
    if (!container) continue;

    let data = null;

if (type === "duan") {
  data = await readData(`users/students/${studentData.id}/duan`);
} else {
  data = await readData(`teacher/${teacherId}/${type}`);
}

    if (!data) {
      container.innerHTML = "<li>Chưa có dữ liệu</li>";
      continue;
    }

    // ===== Lọc theo lớp =====
    const filtered = Object.entries(data)
  .filter(([id, item]) => {
    const itemLop = item.classId || item.lop || "";
    const itemMon = item.subjectId || item.monhoc || "";

    const dungLop = itemLop === selectedLop;
    const dungMon = !selectedMonHoc || itemMon === selectedMonHoc;

    return dungLop && dungMon;
  })
  .sort((a, b) => (b[1].created_at || 0) - (a[1].created_at || 0));

    if (!filtered.length) {
      container.innerHTML = "<li>Không có dữ liệu cho lớp này</li>";
      continue;
    }

    container.innerHTML = filtered
      .map(([id, item]) => `
        <li>
          <a href="#" data-id="${id}" data-type="${type}">
            ${item.title || item.tieude || "Không tên"}
          </a>
        </li>
      `)
      .join("");

    bindPreviewClick(container, teacherId);
  }

  // ===== XỬ LÝ LINK ONLINE =====
  const studentMode = document.querySelector('input[name="student_mode"]:checked')?.value;
  const studentLinks = document.getElementById("studentLinks");
  if (!studentLinks) return;

  if (studentMode === "online" && selectedLop) {
    const linksData = await readData(`teacher/${teacherId}/linkday`);
    const links = linksData
      ? Object.values(linksData).filter(l => l.lop === selectedLop)
      : [];

    if (links.length) {
      studentLinks.innerHTML = links
        .map(l => `
  <button class="btn-class" onclick="
    if(window.joinSession){
      window.joinSession('${lopSelect.value}');
    }
    window.open('${l.made}', '_blank');
  ">
    Vào lớp
  </button>
`)
        .join(" ");
    } else {
      studentLinks.innerHTML = "<p>Chưa có link</p>";
    }
  } else {
    studentLinks.innerHTML = "";
  }
}

// ===== GẮN SỰ KIỆN CHO GIÁO VIÊN + LỚP =====
teacherSelect.addEventListener("change", async () => {
  await loadTeacherContent(teacherSelect.value);
});

lopSelect.addEventListener("change", async () => {
  await loadTeacherContent(teacherSelect.value);
});

monhocSelect?.addEventListener("change", async () => {
  await loadTeacherContent(teacherSelect.value);
});

document.querySelectorAll('input[name="student_mode"]').forEach(radio => {
  radio.addEventListener("change", async () => {
    await loadTeacherContent(teacherSelect.value);
  });
});


  /* ==============================
     CHỌN GIÁO VIÊN
  ============================== */
if (teacherSelect) {
 teacherSelect.addEventListener("change", async function () {
 if (!this.value) return;
     await loadTeacherContent(this.value);
   });
  }

  await loadTeachers();
});

/* ==============================
   PREVIEW CLICK
============================== */
function bindPreviewClick(container, teacherId) {
  container.querySelectorAll("a").forEach(a => {
    a.onclick = async e => {
      e.preventDefault();

      const type = a.dataset.type;
      const id   = a.dataset.id;

      let d = null;

if (type === "duan") {
  const studentData = JSON.parse(localStorage.getItem("studentLogin"));
  d = await readData(`users/students/${studentData.id}/duan/${id}`);
} else {
  d = await readData(`teacher/${teacherId}/${type}/${id}`);
}

      if (!d) return alert("Không tìm thấy nội dung");

      // ===== PROJECT => LOAD THẲNG TRONG MAIN =====
      if (type === "duan") {
        loadStudentProject(d);
        return;
      }

      // ===== CÁC LOẠI KHÁC => giữ preview cũ =====
      openPreview({
        title: d.title || d.tieude || "Bài học",
        meta: `
          Giáo viên: ${teacherNameMap[teacherId] || teacherId}
          ${d.monhoc ? " | Môn: " + d.monhoc : ""}
          ${d.lop ? " | Lớp: " + d.lop : ""}
        `,
        content: d.content_html || d.noidung || d.content || ""
      });
    };
  });
}

/* ==============================
   OPEN PREVIEW
============================== */
function openPreview({ title, meta, content }) {
  localStorage.setItem("lesson_preview", JSON.stringify({
    title, meta, content
  }));
  window.open("/preview.html", "_blank");
}


/* ==============================
   STUDENT PROJECT PLAYER
============================== */

function getYoutubeEmbed(url) {
  if (!url) return "";
  const reg = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;
  const match = url.match(reg);
  return match ? `https://www.youtube.com/embed/${match[1]}` : "";
}

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

function renderStudentMedia(el, icon, label, url, title = "") {
  if (!el) return;

  if (!url) {
    el.innerHTML = "";
    el.dataset.url = "";
    return;
  }

  el.dataset.url = url;
  el.innerHTML = `
    <div class="media-item">
      <span class="media-icon">${icon}</span>
      <span class="media-title">${label} - ${title}</span>
    </div>
  `;
}


function resetStudentMediaPanel() {
  const mediaBox = document.getElementById("studentMediaBox");
  const playerBox = document.getElementById("studentPlayer");

  const svMp3  = document.getElementById("svMp3");
  const svMp32 = document.getElementById("svMp32");
  const svMp4  = document.getElementById("svMp4");
  const svYt   = document.getElementById("svYoutube");

  if (svMp3)  svMp3.innerHTML = "";
  if (svMp32) svMp32.innerHTML = "";
  if (svMp4)  svMp4.innerHTML = "";
  if (svYt)   svYt.innerHTML = "";

  if (mediaBox) mediaBox.style.display = "none";
  if (playerBox) playerBox.innerHTML = "";
}



window.loadStudentProject = function(item) {

  if (window.enterWorkingMode) {
    window.enterWorkingMode();
  }

  const mainBg      = document.getElementById("mainBg");
  const mainContent = document.getElementById("mainContent");

  // ===== CỘT PHẢI SINH VIÊN =====
  const mediaBox    = document.getElementById("studentMediaBox");
  const playerBox   = document.getElementById("studentPlayer");

  const svMp3  = document.getElementById("svMp3");
  const svMp32 = document.getElementById("svMp32");
  const svMp4  = document.getElementById("svMp4");
  const svYt   = document.getElementById("svYoutube");

  if (mainBg) mainBg.style.display = "none";
  if (!mainContent) return;

  // ===== LOAD HTML =====
  let content = item.content_html || "<p>Không có nội dung dự án</p>";

  // nếu content là link ngoài thì nhúng iframe
  if (typeof content === "string" && content.startsWith("http")) {
    content = `
      <iframe
        src="${content}"
        width="100%"
        height="600"
        style="border:none;border-radius:12px;"
        allowfullscreen>
      </iframe>
    `;
  }

  // ===== MAIN CHỈ HIỆN NỘI DUNG =====
  mainContent.innerHTML = `
    <div class="lesson-content">
      <button id="studentBackBtn" style="
        margin-bottom:12px;
        padding:3px 10px;
        border:none;
        border-radius:8px;
        background:#ffd700;
        color:Black;
        cursor:pointer;
      ">⬅ Quay lại</button>

      <h2 style="margin-bottom:12px;">📁 ${item.title || "Dự án"}</h2>
      ${content}
    </div>
  `;

  // ===== BACK =====
  document.getElementById("studentBackBtn")?.addEventListener("click", () => {
    location.reload();
  });

  // ===== MEDIA =====
  const media = item.media || {};

  renderStudentMedia(svMp3,  "🎧", "MP3",     media.mp3, item.title || "");
  renderStudentMedia(svMp32, "🎧", "MP32",    media.mp32, item.title || "");
  renderStudentMedia(svMp4,  "🎬", "MP4",     media.mp4, item.title || "");
  renderStudentMedia(svYt,   "▶️", "YouTube", media.youtube, item.title || "");

  const hasMedia = media.mp3 || media.mp32 || media.mp4 || media.youtube;

  // ===== ÉP MEDIA BOX RA CỘT PHẢI =====
  if (mediaBox) {
    mediaBox.style.display = hasMedia ? "flex" : "none";
    mediaBox.style.flexDirection = "column";
    mediaBox.style.gap = "10px";
  }

  if (playerBox) {
    playerBox.innerHTML = hasMedia
      ? `<div style="color:#64748b;font-style:italic;">🎤 Chọn media để phát khi thuyết trình</div>`
      : "";
  }
};


/* ==============================
   LOAD TAB STUDENT
============================== */
//async function loadStudentTab(htmlPath, jsPath) {
window.loadStudentTab = async function (htmlPath, jsPath) {
 resetStudentMediaPanel();

  if (window.enterWorkingMode) {
    window.enterWorkingMode();
  }

  const mainBg = document.getElementById("mainBg");
  if (mainBg) mainBg.style.display = "none";

  const mainContent = document.getElementById("mainContent");
  if (!mainContent) return;

  const html = await fetch(htmlPath).then(r => r.text());

  mainContent.innerHTML = `
    <div class="lesson-content">
      <button id="studentBackBtn" style="
        margin-bottom:14px;
        padding:6px 10px;
        border:none;
        border-radius:8px;
        background:#ffd700;
        color:#fff;
        cursor:pointer;
      ">⬅ Quay lại</button>

      <div id="studentTabBody">${html}</div>
    </div>
  `;

  document.getElementById("studentBackBtn")?.addEventListener("click", () => {
    location.reload();
  });

  await new Promise(r => requestAnimationFrame(r));

  if (jsPath) {
    const mod = await import(jsPath.startsWith("/") ? jsPath : "/" + jsPath);
    if (mod.init) {
      await mod.init();
    }
  }
}

document.addEventListener("click", async function (e) {

  const el = e.target.closest(".class-item");
  if (!el) return;

  const id = el.dataset.id;
  const classMap = await readData("config/danh_muc/lop");
const className = classMap?.[id]?.name || "Lớp";

//  console.log("🔥 CLICK CLASS:", id, className);

  // 🔥 CHỐNG GỌI LẠI NHIỀU LẦN
  if (window._startingSession) return;
  window._startingSession = true;

  if (typeof window.startSession === "function") {
    await window.startSession(id, className);
//    console.log("✅ SESSION ĐÃ TẠO");
  } else {
//    console.log("❌ KHÔNG TÌM THẤY startSession");
  }

  // reset flag sau 1s
  setTimeout(() => window._startingSession = false, 1000);

});

document.addEventListener("click", function(e) {
  const parent = e.target.closest("#svMp3, #svMp32, #svMp4, #svYoutube");
  if (!parent) return;

  const id = parent.id;
  const rawUrl = parent.dataset.url;
  if (!rawUrl) return;

  const box = document.getElementById("studentPlayer");
  if (!box) return;

  // active UI
  document.querySelectorAll("#studentMediaBox .media-item")
    .forEach(el => el.classList.remove("active"));

  parent.querySelector(".media-item")?.classList.add("active");

  // ===== YouTube =====
  if (id === "svYoutube") {
    const embed = getYoutubeEmbed(rawUrl);

    box.innerHTML = embed
      ? `
        <iframe width="100%" height="130"
          src="${embed}"
          frameborder="0"
          allowfullscreen>
        </iframe>
      `
      : `<p>Link YouTube không hợp lệ</p>`;
  }

  // ===== MP4 =====
  else if (id === "svMp4") {
    const previewUrl = convertDriveToPreview(rawUrl);

    box.innerHTML = previewUrl
      ? `
        <iframe src="${previewUrl}" width="100%" height="130" allow="autoplay"></iframe>
      `
      : `<p>Link MP4 không hợp lệ</p>`;
  }

  // ===== MP3 / MP32 =====
  else if (id === "svMp3" || id === "svMp32") {
    const previewUrl = convertDriveToPreview(rawUrl);

    box.innerHTML = previewUrl
      ? `
        <iframe src="${previewUrl}" width="100%" height="50" allow="autoplay"></iframe>
      `
      : `<p>Link MP3 không hợp lệ</p>`;
  }
});


