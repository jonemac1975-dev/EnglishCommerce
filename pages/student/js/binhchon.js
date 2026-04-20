import {
  readData,
  writeData
} from "../../../scripts/services/firebaseService.js";

// ===== GLOBAL =====
let selectedStar = 0;

// ===== INIT =====
init();

function init() {
  setupStars();
  initTimeSelect();
  loadTeachers();

  document.getElementById("submit").onclick = submitVote;

  document.getElementById("teacher").onchange = (e) => {
    const teacherId = e.target.value;
    if (teacherId) loadList(teacherId);
  };
}

//
// ===== GET USER ID (FIX CHUẨN) =====
//
function getStudentId() {
  return (
    localStorage.getItem("uid") ||
    localStorage.getItem("student_id")
  );
}

//
// ===== LOAD TEACHERS =====
//
async function loadTeachers() {
  const data = await readData("users/teachers");

  const select = document.getElementById("teacher");
  select.innerHTML = "<option value=''>--Chọn GV--</option>";

  if (!data) return;

  Object.entries(data).forEach(([id, t]) => {
    const name = t.profile?.ho_ten || "(Chưa có tên)";
    select.innerHTML += `<option value="${id}">${name}</option>`;
  });
}

//
// ===== STAR UI =====
//
function setupStars() {
  const stars = document.querySelectorAll("#stars span");

  stars.forEach(star => {
    star.addEventListener("click", () => {
      selectedStar = Number(star.dataset.star);
      highlightStars(selectedStar);
    });
  });
}

function highlightStars(n) {
  document.querySelectorAll("#stars span").forEach(s => {
    s.classList.toggle("active", s.dataset.star <= n);
  });
}

//
// ===== TIME SELECT =====
//
function initTimeSelect() {
  const monthEl = document.getElementById("month");
  const weekEl = document.getElementById("week");
  const yearEl = document.getElementById("year");

  const now = new Date();

  yearEl.value = now.getFullYear();

  monthEl.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    monthEl.innerHTML += `<option value="${i}">Tháng ${i}</option>`;
  }

  weekEl.innerHTML = "";
  for (let i = 1; i <= 4; i++) {
    weekEl.innerHTML += `<option value="${i}">Tuần ${i}</option>`;
  }

  monthEl.value = now.getMonth() + 1;

  const week = Math.ceil(now.getDate() / 7);
  weekEl.value = week > 4 ? 4 : week;
}

//
// ===== SUBMIT VOTE =====
//
async function submitVote() {
  const teacherId = document.getElementById("teacher").value;
  const year = +document.getElementById("year").value;
  const month = +document.getElementById("month").value;
  const week = +document.getElementById("week").value;
  const comment = document.getElementById("comment").value;

  const studentId = getStudentId(); // ✅ FIX

  if (!studentId) {
    alert("Bạn chưa đăng nhập");
    return;
  }

  if (!teacherId || !selectedStar) {
    alert("Thiếu dữ liệu");
    return;
  }

  // ===== đọc rating =====
  let rating = await readData(`ratings/${teacherId}`);

  if (!rating) {
    rating = { avg: 0, total: 0, students: {} };
  }

  // ===== CHECK 1 TUẦN 1 LẦN =====
  const old = rating.students[studentId];

  if (
    old &&
    old.year === year &&
    old.month === month &&
    old.week === week
  ) {
    alert("Tuần này bạn đã bình chọn!");
    return;
  }

  // ===== UPDATE AVG =====
  const newTotal = rating.total + 1;
  const newAvg =
    ((rating.avg * rating.total) + selectedStar) / newTotal;

  rating.avg = newAvg;
  rating.total = newTotal;

  // lưu theo student
  rating.students[studentId] = {
    year,
    month,
    week,
    star: selectedStar
  };

  // ===== SAVE =====
  await writeData(`ratings/${teacherId}`, rating);

  // ===== SAVE DETAIL =====
  const id = "r_" + Date.now();

  await writeData(`ratingDetails/${teacherId}/${id}`, {
    studentId,
    star: selectedStar,
    comment,
    year,
    month,
    week,
    time: Date.now()
  });

  alert("Bình chọn thành công!");

  loadList(teacherId);
}

//
// ===== LOAD LIST =====
//
async function loadList(teacherId) {
  const data = await readData(`ratingDetails/${teacherId}`);
  const list = document.getElementById("list");

  list.innerHTML = "";

  const studentId = getStudentId();

  if (!data || !studentId) {
    list.innerHTML = "<tr><td colspan='5'>Chưa có</td></tr>";
    return;
  }

  // ✅ LỌC CHỈ BÌNH CHỌN CỦA CHÍNH SV
  const myRatings = Object.values(data)
    .filter(r => r.studentId === studentId)
    .sort((a, b) => b.time - a.time);

  if (myRatings.length === 0) {
    list.innerHTML = "<tr><td colspan='5'>Bạn chưa bình chọn</td></tr>";
    return;
  }

  myRatings.forEach(r => {
    list.innerHTML += `
      <tr>
        <td>${r.year}</td>
        <td>${r.month}</td>
        <td>${r.week}</td>
        <td>${"⭐".repeat(r.star)}</td>
        <td>${r.comment || ""}</td>
      </tr>
    `;
  });
}