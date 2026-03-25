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
     CHỌN LỚP
  ============================== */
if (lopSelect) {
  lopSelect.addEventListener("change", function () {
    localStorage.setItem("selectedLop", this.value);
  });
}
 await loadLop();

  /* ==============================
     LOAD NỘI DUNG GIÁO VIÊN THEO LỚP
============================== */
async function loadTeacherContent(teacherId) {
  if (!teacherId) return;

  const selectedLop = lopSelect?.value || "";
  localStorage.setItem("selectedTeacher", teacherId);
  localStorage.setItem("selectedTeacherName", teacherNameMap[teacherId] || teacherId);

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

    // ===== Lọc theo lớp =====
    const filtered = Object.entries(data)
      .filter(([id, item]) => (item.classId || item.lop) === selectedLop)
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