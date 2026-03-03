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

  /* ===== DOM ===== */
  const avatarBox = document.getElementById("studentAvatar");
  const nameBox   = document.getElementById("studentName");
  const teacherSelect = document.getElementById("teacherSelect");
  const lopSelect = document.getElementById("lopSelect");

  const btnRegister = document.querySelector(".sidebar.student button:nth-of-type(1)");
  const btnLogin    = document.querySelector(".sidebar.student button:nth-of-type(2)");

  const hvBaigiang = document.getElementById("hv-baigiang");
  const hvBaitap   = document.getElementById("hv-baitap");

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

  if (avatarBox) {
    avatarBox.innerHTML = `
      <img src="${studentData.avatar || './store/default-avatar.png'}"
           style="width:100px;height:100px;border-radius:50%;object-fit:cover;">
    `;
  }

  if (nameBox) {
    nameBox.textContent = studentData.ho_ten || "Học viên";
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
     CHỌN LỚP
  ============================== */
if (lopSelect) {
  lopSelect.addEventListener("change", function () {
    localStorage.setItem("selectedLop", this.value);
  });
}
 await loadLop();

  /* ==============================
     LOAD NỘI DUNG GIÁO VIÊN
  ============================== */
  async function loadTeacherContent(teacherId) {
    localStorage.setItem("selectedTeacher", teacherId);
    localStorage.setItem(
      "selectedTeacherName",
      teacherNameMap[teacherId] || teacherId
    );

    const map = {
      baigiang: hvBaigiang,
      baitap: hvBaitap
    };

    for (const type in map) {
      const container = map[type];
      if (!container) continue;

      const data = await readData(`teacher/${teacherId}/${type}`);
      if (!data) {
        container.innerHTML = "<li>Chưa có dữ liệu</li>";
        continue;
      }

      container.innerHTML = Object.entries(data)
        .sort((a, b) => (b[1].created_at || 0) - (a[1].created_at || 0))
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
  }

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

      const d = await readData(`teacher/${teacherId}/${type}/${id}`);
      if (!d) return alert("Không tìm thấy nội dung");

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
   LOAD TAB STUDENT
============================== */
async function loadStudentTab(htmlPath, jsPath) {
  const main = document.getElementById("main");
  if (!main) return;

  // 1️⃣ Load HTML
  const html = await fetch(htmlPath).then(r => r.text());
  main.innerHTML = html;

  // 2️⃣ ĐỢI DOM GẮN XONG
  await new Promise(r => requestAnimationFrame(r));

  // 3️⃣ Import JS & gọi init
  if (jsPath) {
    const mod = await import(jsPath.startsWith("/") ? jsPath : "/" + jsPath);
    if (mod.init) {
      await mod.init(); // 🔥🔥🔥 PHẢI Ở SAU HTML
    }
  }
}