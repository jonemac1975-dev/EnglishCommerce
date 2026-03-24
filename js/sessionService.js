import { readData, writeData, updateData } from "../scripts/services/firebaseService.js";

/* =========================
   START SESSION (GV)
========================= */
window.startSession = async function (classId, className) {

  try {
    const teacherId = localStorage.getItem("teacher_id");
    if (!teacherId) return;

    // 🔥 1. XÓA SESSION CŨ CỦA GIÁO VIÊN (QUAN TRỌNG)
    const allSessions = await readData("sessions");

    if (allSessions) {
      for (const [sid, s] of Object.entries(allSessions)) {
        if (s.teacherId === teacherId) {
          await writeData(`sessions/${sid}`, null); // xoá
        }
      }
    }

    // 🔥 2. LOAD HỌC SINH
    const studentsData = await readData("users/students");

    const students = {};

    Object.entries(studentsData || {}).forEach(([id, s]) => {
      const studentClass = s?.profile?.lop;

      if (studentClass !== classId) return;

      students[id] = {
        joined: false, // ✅ luôn reset
        name: s?.profile?.ho_ten || "Không tên"
      };
    });

    // 🔥 3. TẠO SESSION MỚI
    const sessionId = "session_" + Date.now();

    const session = {
      classId,
      className,
      teacherId,
      startTime: Date.now(),
      students
    };

    await writeData(`sessions/${sessionId}`, session);

    localStorage.setItem("currentSessionId", sessionId);

    console.log("✅ START SESSION:", sessionId, session);

    // 🔥 4. FOOTER LISTENER
    if (typeof waitForFooterAndStart === "function") {
      waitForFooterAndStart(sessionId);
    }

    // 🔥 5. AUTO CHỐT
    setTimeout(() => {
      if (typeof finalizeSession === "function") {
        finalizeSession(sessionId);
      }
    }, 5 * 60 * 1000);

  } catch (err) {
    console.error("❌ startSession lỗi:", err);
  }
};

/* =========================
   HỌC VIÊN VÀO HỌC
========================= */
window.joinSession = async function (classId) {

  const student = JSON.parse(localStorage.getItem("studentLogin"));
  if (!student?.id) return;

  const sessions = await readData("sessions");
  if (!sessions) return;

  const found = Object.entries(sessions).find(([id, s]) =>
    s.classId === classId && !s.finalized
  );

  if (!found) return;

  const [sessionId] = found;

  await updateData(
    `sessions/${sessionId}/students/${student.id}`,
    {
      joined: true,
      joinTime: Date.now()
    }
  );
};

/* =========================
   LISTEN REALTIME
========================= */
window.listenSession = function (sessionId) {

  const refPath = `sessions/${sessionId}`;

  const interval = setInterval(async () => {

    const session = await readData(refPath);
    if (!session) return;

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

  }, 3000); // 3s refresh

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

  console.log("✅ Đã chốt điểm danh");
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
    console.log("❌ chưa tìm thấy footer");
    return;
  }

  box = document.createElement("div");
  box.id = "classSessionBox";
  box.className = "footer-box";

  footer.appendChild(box);

  console.log("✅ đã tạo footer box");
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

      console.log("✅ Footer sẵn sàng, bắt đầu session");

      listenSession(sessionId);
    }

  }, 300);
}

window.addEventListener("load", () => {

  const sessionId = localStorage.getItem("currentSessionId");

  if (sessionId) {
    console.log("🔄 Khôi phục session");
    waitForFooterAndStart(sessionId);
  }

});


window.addEventListener("load", () => {
  console.log("🧹 Reset session UI");

  // ❌ KHÔNG auto load session nữa
  localStorage.removeItem("currentSessionId");

  if (window._sessionInterval) {
    clearInterval(window._sessionInterval);
  }

  const box = document.getElementById("classSessionBox");
  if (box) box.remove();
});

