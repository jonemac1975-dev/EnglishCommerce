import { readData } from "../scripts/services/firebaseService.js";

/* =========================
   HEADER DEFAULT
========================= */
export const DEFAULT_HEAD = {
  title: "CHƯƠNG TRÌNH MÔN HỌC TIẾNG ANH NGÀNH CHẾ BIẾN MÓN ĂN",
  teacher: "Program Editor: Nguyễn Huỳnh Ngọc Thanh - Trần Thị Ngọc Dư",
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

async function renderUserRating(teacherId) {

  const box =
    document.getElementById("userRating");

  if (!box) return;

  try {

    const data =
      await readData(
        `ratingDetails/${teacherId}`
      );

    if (!data) {
      box.innerHTML = "";
      return;
    }

    const now = new Date();

    const month =
      now.getMonth() + 1;

    const week =
      Math.ceil(
        now.getDate() / 7
      );

    const stars = [];

    Object.values(data).forEach(r => {

      if (
        r.year === now.getFullYear() &&
        r.month === month &&
        r.week === week
      ) {
        stars.push(
          Number(r.star || 0)
        );
      }

    });

    if (!stars.length) {

      box.innerHTML =
        `<div class="stars">☆☆☆☆☆</div>`;

      return;
    }

    const avg =
      stars.reduce(
        (a,b)=>a+b,
        0
      ) / stars.length;

    const full =
      Math.round(avg);

    let html = "";

    for(let i=1;i<=5;i++){

      html +=
        i <= full
        ? "⭐"
        : "☆";

    }

    box.innerHTML = `
      <div class="stars">
        ${html}
      </div>
       
    `;

  } catch(err) {

    console.log(err);

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

    // 🔥 đảm bảo DOM có rồi mới render
    setTimeout(() => {
      renderUserRating(teacherId);
    }, 0);

  } catch (err) {
    console.log("Lỗi load header giáo viên:", err);
    resetHeaderTheme();
  }
}
