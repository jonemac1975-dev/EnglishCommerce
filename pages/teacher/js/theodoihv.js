
import { readData } from "../../../scripts/services/firebaseService.js";

// ===== GROUP THEO LỚP =====
function groupByClass(sessionsObj) {
  const result = {};

  Object.values(sessionsObj || {}).forEach(session => {
    const classId = session.classId;

    if (!result[classId]) result[classId] = {};
    result[classId][session.startTime] = session;
  });

  return result;
}

// ===== THỐNG KÊ =====
function thongKeTheoLop(sessionsObj) {
  const sessions = Object.values(sessionsObj);
  if (sessions.length === 0) return null;

  let studentSet = new Set();
  let absentMap = {};
  let totalAbsent = 0;

  sessions.forEach(session => {
    const students = session.students || {};

    Object.entries(students).forEach(([id, st]) => {
      studentSet.add(id);

      if (!st.joined) {
        totalAbsent++;

        if (!absentMap[id]) {
          absentMap[id] = {
            name: st.name || ("Học sinh " + id),
            count: 0,
            dates: []
          };
        }

        absentMap[id].count++;
        absentMap[id].dates.push(
          new Date(session.startTime).toLocaleDateString()
        );
      }
    });
  });

  const totalStudents = studentSet.size;
  const totalSessions = sessions.length;
  const totalPossible = totalStudents * totalSessions;

  const absentRate = totalPossible
    ? ((totalAbsent / totalPossible) * 100).toFixed(1)
    : 0;

  return {
    classId: sessions[0].classId,
    className: sessions[0].className,
    totalStudents,
    totalSessions,
    absentRate,
    absentMap,
    totalAbsent
  };
}



// ===== RENDER UI =====
function renderClass(stats) {
  const div = document.createElement("div");

  const absent = stats.totalAbsent;
  const total = stats.totalStudents * stats.totalSessions;
  const percent = total ? Math.round((absent / total) * 100) : 0;

  div.innerHTML = `
    <hr/>
    <h3>Lớp: ${stats.className}</h3>
    <p>Sỹ số sinh viên: ${stats.totalStudents}</p>
    <p>Tổng số buổi học: ${stats.totalSessions}</p>
    <p>Tỷ lệ vắng: ${stats.absentRate}%</p>

    <!-- 🔥 BIỂU ĐỒ GIẢ -->
    <div style="margin:10px 0;">
      <div style="display:flex; height:20px; border-radius:10px; overflow:hidden;">
        <div style="width:${percent}%; background:#e74c3c;"></div>
        <div style="width:${100 - percent}%; background:#2ecc71;"></div>
      </div>
      🔴 Vắng: ${percent}% | 🟢 Có học: ${100 - percent}%
    </div>

    <h4>Danh sách vắng</h4>
    <table border="1" cellpadding="5">
      <tr>
        <th>Tên</th>
        <th>Số buổi vắng</th>
        <th>Ngày vắng</th>
      </tr>

      ${Object.values(stats.absentMap).map(st => `
        <tr>
          <td>${st.name}</td>
          <td>${st.count}</td>
          <td>${st.dates.join(", ")}</td>
        </tr>
      `).join("")}
    </table>
  `;

  document.getElementById("classContainer").appendChild(div);
}


// ===== INIT =====
async function init() {
  const sessions = await readData("sessions");

  if (!sessions) {
    document.getElementById("classContainer").innerHTML = "Không có dữ liệu";
    return;
  }

  const grouped = groupByClass(sessions);

  Object.values(grouped).forEach(classSessions => {
    const stats = thongKeTheoLop(classSessions);
    if (stats) renderClass(stats);
  });
}

init();