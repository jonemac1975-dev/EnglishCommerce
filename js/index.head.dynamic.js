import { readData } from "../scripts/services/firebaseService.js";

/* =========================
   HEADER DEFAULT
========================= */
export const DEFAULT_HEAD = {
  title: "CHƯƠNG TRÌNH ĐÀO TẠO CHUYÊN NGÀNH CHẾ BIẾN MÓN ĂN",
  teacher: "Program Editor: Trần Thị Ngọc Dư - Nguyễn Huỳnh Ngọc Thanh",
  slogan: "Welcome To College of Commerce"
};

/* =========================
   APPLY HEADER
========================= */
export function applyHeaderTheme(data = {}) {
  const siteTitle   = document.getElementById("siteTitle");
  const siteTeacher = document.getElementById("siteTeacher");
  const siteSlogan  = document.getElementById("siteSlogan");

  if (siteTitle) {
    siteTitle.textContent = data.title?.trim() || DEFAULT_HEAD.title;
  }

  if (siteTeacher) {
    siteTeacher.textContent = data.teacher?.trim() || DEFAULT_HEAD.teacher;
  }

  if (siteSlogan) {
    siteSlogan.textContent = data.slogan?.trim() || DEFAULT_HEAD.slogan;
  }
}

/* =========================
   RESET HEADER
========================= */
export function resetHeaderTheme() {
  applyHeaderTheme(DEFAULT_HEAD);
}

/* =========================
   LOAD HEADER THEO GIÁO VIÊN
========================= */
export async function loadTeacherHeaderTheme() {
  const teacherId = localStorage.getItem("teacher_id");

  if (!teacherId) {
    resetHeaderTheme();
    return;
  }

  try {
    const data = await readData(`teacher/${teacherId}/doihead`);

    if (data) {
      applyHeaderTheme(data);
    } else {
      resetHeaderTheme();
    }
  } catch (err) {
    console.log("Lỗi load header giáo viên:", err);
    resetHeaderTheme();
  }
}