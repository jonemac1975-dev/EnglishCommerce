import { readData, writeData, updateData } from "../scripts/services/firebaseService.js";

let _lastSessionData = "";
let isStartingSession = false;
let offlineStarted = false;
window._skipAttendanceOnce = false;

/* =========================
   HỎI CÓ ĐIỂM DANH HAY KHÔNG
========================= */
window.askStartSession = async function (classId, className, mode = "online") {
  const ok = confirm(`📋 Bạn có muốn điểm danh lớp "${className}" không?`);

  if (!ok) {
    console.log("⏭️ Bỏ qua điểm danh");
    window._skipAttendanceOnce = true; // 🔥 khóa cứng 1 lần
    return false;
  }

  window._skipAttendanceOnce = false;
  await window.startSession(classId, className, mode);
  return true;
};


/* =========================
   START SESSION (GV)
========================= */
/* =========================
   START SESSION (GV)
========================= */
window.startSession = async function (classId, className, mode = "online") {

  // 🔥 nếu vừa bấm Cancel thì chặn cứng
  if (window._skipAttendanceOnce === true) {
    console.log("⛔ Đã Cancel điểm danh → không start session");
    window._skipAttendanceOnce = false;
    return false;
  }

  if (isStartingSession && mode === "online") {
    return;
  }

  isStartingSession = true;

  try {
    if (!classId || classId.trim() === "") {
      alert("❌ Chưa chọn lớp");
      isStartingSession = false;
      return false;
    }

    const teacherId = localStorage.getItem("teacher_id");
    if (!teacherId) {
      isStartingSession = false;
      return false;
    }

    // 🔥 1. XÓA SESSION CŨ
    const allSessions = await readData("sessions");

    if (allSessions) {
      for (const [sid, s] of Object.entries(allSessions)) {
        if (s.teacherId === teacherId && !s.finalized) {
          await updateData(`sessions/${sid}`, {
            finalized: true
          });
        }
      }
    }

    // 🔥 2. LOAD HỌC SINH
    const studentsData = await readData("users/students");
    const students = {};

    Object.entries(studentsData || {}).forEach(([id, s]) => {
      if (s?.profile?.lop !== classId) return;

      students[id] = {
        name: s?.profile?.ho_ten || "Không tên",
        joined: false,
        lastSeen: 0
      };
    });

    // 🔥 3. TẠO SESSION
    const sessionId = "session_" + Date.now();

    const session = {
      classId,
      className,
      teacherId,
      mode,
      startTime: Date.now(),
      students
    };

    await writeData(`sessions/${sessionId}`, session);
    localStorage.setItem("currentSessionId", sessionId);

    alert("✅ Đã bắt đầu điểm danh");

    // 🔥 4. START LISTEN
    if (mode === "online") {
      waitForFooterAndStart(sessionId);
    } else {
      const studentsArr = Object.values(students);
      const total = studentsArr.length;
      const joined = 0;

      renderFooter({
        className,
        startTime: Date.now(),
        total,
        joined,
        absent: total,
        absentList: studentsArr.map(s => s.name)
      });
    }

    // 🔥 5. AUTO CHỐT
    setTimeout(() => finalizeSession(sessionId), 5 * 60 * 1000);

    // 🔥 6. OFFLINE → hiện bảng tick + QR
    if (mode === "offline") {
      if (offlineStarted) {
        isStartingSession = false;
        return true;
      }

      offlineStarted = true;

      setTimeout(() => {
        renderOfflinePanel(sessionId, students);
        generateQRCode(sessionId);
      }, 300);
    }

    isStartingSession = false;
    return true;

  } catch (err) {
    console.error("❌ startSession lỗi:", err);
    isStartingSession = false;
    return false;
  }
};

/* =========================
   HỌC VIÊN VÀO HỌC
========================= */
window.joinSession = async function (classId) {

  const student = JSON.parse(localStorage.getItem("studentLogin"));
  if (!student?.id) return false;

  const sessions = await readData("sessions");
  if (!sessions) return false;

  const found = Object.entries(sessions).find(([id, s]) =>
    s.classId === classId && !s.finalized
  );

  if (!found) return false;

  const [sessionId] = found;

  await updateData(`sessions/${sessionId}/students/${student.id}`, {
    joined: true,
    joinTime: Date.now(),
    lastSeen: Date.now()
  });

  // 🔥 heartbeat
  setInterval(() => {
    updateData(`sessions/${sessionId}/students/${student.id}`, {
      lastSeen: Date.now()
    });
  }, 15000);

  return true; // 👈 QUAN TRỌNG
};


/* =========================
   LISTEN REALTIME
========================= */
window.listenSession = function (sessionId) {

  const refPath = `sessions/${sessionId}`;

  const interval = setInterval(async () => {

    const session = await readData(refPath);
    if (!session) return;

    const snapshot = JSON.stringify(session.students);

    // 🔥 nếu không đổi → bỏ qua
    if (snapshot === _lastSessionData) return;

    _lastSessionData = snapshot;

//    console.log("🔄 DATA CHANGED → render");

    const students = session.students || {};

    let total = 0;
    let joined = 0;
    let absentList = [];

    Object.values(students).forEach(s => {
      total++;
      if (s.joined) joined++;
      else absentList.push(s.name);
    });

    renderFooter({
      className: session.className,
      startTime: session.startTime,
      total,
      joined,
      absent: total - joined,
      absentList
    });

  }, 2000); // giảm xuống 2s cho mượt

  window._sessionInterval = interval;
};

/* =========================
   CHỐT SAU 5 PHÚT
========================= */
async function finalizeSession(sessionId) {

  const session = await readData(`sessions/${sessionId}`);
  if (!session) return;

  await updateData(`sessions/${sessionId}`, {
    finalized: true,
    finalizedAt: Date.now()
  });

//  console.log("✅ Đã chốt điểm danh");
}

/* =========================
   RENDER FOOTER
========================= */
function renderFooter(data) {

  let box = document.getElementById("classSessionBox");

if (!box) {

  // 🔥 đảm bảo footer load xong
  const footer = document.querySelector(".footer") || document.body;

  if (!footer) {
//    console.log("❌ chưa tìm thấy footer");
    return;
  }

  box = document.createElement("div");
  box.id = "classSessionBox";
  box.className = "footer-box";

  footer.appendChild(box);

//  console.log("✅ đã tạo footer box");
}

  box.innerHTML = `
    <h4>📊 Điểm danh lớp</h4>
    <div>⏰ Giờ vào : ${formatTime(data.startTime)}</div>
    <div>🏫 Lớp : ${data.className || ""}</div>
    <div>👥 Tổng : ${data.total}</div>
<div style="color:green">✅ Đã vào : ${data.joined}</div>
<div style="color:red">❌ Vắng : ${data.absent}</div>

    <div style="margin-top:6px;"><strong>Danh sách vắng:</strong></div>
    <ul style="max-height:120px; overflow:auto;">
      ${data.absentList.map(n => `<li>${n}</li>`).join("")}
    </ul>
  `;
}

function formatTime(t) {
  const d = new Date(t);
  return d.toLocaleTimeString();
}


function waitForFooterAndStart(sessionId) {

  const check = setInterval(() => {

    const footer = document.querySelector(".footer");

    if (footer) {
      clearInterval(check);

  //    console.log("✅ Footer sẵn sàng, bắt đầu session");

      listenSession(sessionId);
    }

  }, 300);
}


/* =========================
   OFFLINE PANEL (tick tay)
========================= */

function renderOfflinePanel(sessionId, students) {

  let box = document.getElementById("offlinePanel");

  if (box) return; // 🔥 CHẶN RENDER LẠI

  box = document.createElement("div");
  box.id = "offlinePanel";
  box.style.marginTop = "10px";

  document.body.appendChild(box); // 👈 KHÔNG dùng main nữa


  let html = "<h3>📋 Điểm danh Offline</h3><ul>";

  Object.entries(students).forEach(([id, s]) => {
    html += `
      <li>
        <label>
          <input type="checkbox" data-id="${id}">
          ${s.name}
        </label>
      </li>
    `;
  });

  html += "</ul>";

  box.innerHTML = html;

  document.querySelectorAll("#offlinePanel input[type=checkbox]").forEach(cb => {
    cb.onchange = async () => {
  const id = cb.dataset.id;

  await updateData(`sessions/${sessionId}/students/${id}`, {
    joined: cb.checked,
    lastSeen: Date.now()
  });

  // 🔥 update footer ngay
  const session = await readData(`sessions/${sessionId}`);
  if (!session) return;

  const students = Object.values(session.students || {});
  const total = students.length;
  const joined = students.filter(s => s.joined).length;

  renderFooter({
    className: session.className,
    startTime: session.startTime,
    total,
    joined,
    absent: total - joined,
    absentList: students.filter(s => !s.joined).map(s => s.name)
  });
};
  });
}



/* =========================
  QR CODE (CHO OFFLINE)
========================= */
function generateQRCode(sessionId) {

  let box = document.getElementById("qrBox");

  if (!box) {
    box = document.createElement("div");
    box.id = "qrBox";
    box.style.marginTop = "10px";

    document.body.appendChild(box);
  }

  const url = `${location.origin}/student.html?session=${sessionId}`;

  box.innerHTML = `
    <p>📱 Quét QR để vào lớp:</p>
    <div id="qrCanvas"></div>
  `;

  new QRCode(document.getElementById("qrCanvas"), {
    text: url,
    width: 120,
    height: 120
  });
}


window.addEventListener("load", () => {
  offlineStarted = false;
});


window.addEventListener("load", () => {
//  console.log("🧹 Reset session UI");

  // ❌ KHÔNG auto load session nữa
  localStorage.removeItem("currentSessionId");

  if (window._sessionInterval) {
    clearInterval(window._sessionInterval);
  }

  const box = document.getElementById("classSessionBox");
  if (box) box.remove();
});


window.addEventListener("load", async () => {

  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get("session");

  if (!sessionId) return;

  const student = JSON.parse(localStorage.getItem("studentLogin"));
  if (!student?.id) return;

  // 🔥 join trực tiếp bằng sessionId
  await updateData(`sessions/${sessionId}/students/${student.id}`, {
    joined: true,
    joinTime: Date.now(),
    lastSeen: Date.now()
  });

  alert("✅ Đã vào lớp (QR)");

  // 🔥 heartbeat
  setInterval(() => {
    updateData(`sessions/${sessionId}/students/${student.id}`, {
      lastSeen: Date.now()
    });
  }, 15000);

});
