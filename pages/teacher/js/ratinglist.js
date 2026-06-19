import {
  readData
} from "../../../scripts/services/firebaseService.js";

let allRows = [];

export async function init() {

  await loadData();

  document
    .querySelectorAll("[data-star]")
    .forEach(btn => {

      btn.onclick = () => {

        renderList(
          btn.dataset.star
        );

      };

    });
}

async function loadData() {

  const teachers =
    await readData("users/teachers") || {};

  const ratings =
    await readData("ratingDetails") || {};

  const now = new Date();

  const week =
    Math.ceil(now.getDate() / 7);

  const month =
    now.getMonth() + 1;

  const year =
    now.getFullYear();

  allRows = [];

  Object.entries(ratings)
    .forEach(([teacherId, data]) => {

      const teacherName =
        teachers[teacherId]
        ?.profile
        ?.ho_ten || teacherId;

      const stars = [];
      const comments = [];

      Object.values(data)
        .forEach(r => {

          if (
            r.year !== year ||
            r.month !== month ||
            r.week !== week
          ) {
            return;
          }

          stars.push(
            Number(r.star || 0)
          );

          if (r.comment) {
            comments.push(r.comment);
          }

        });

      if (!stars.length) return;

      const avg =
        stars.reduce(
          (a,b)=>a+b,
          0
        ) / stars.length;

      allRows.push({

        teacherName,

        avg,

        star:
          Math.round(avg),

        comment:
          comments[0] || "",

        total:
          stars.length

      });

    });

  renderList("all");
}

function renderList(filter) {

  const box =
    document.getElementById(
      "ratingList"
    );

  let rows = allRows;

  if (filter !== "all") {

    rows = rows.filter(
      r =>
      String(r.star)
      === String(filter)
    );

  }

  rows.sort(
    (a,b) => b.avg - a.avg
  );

  if (!rows.length) {

    box.innerHTML =
      "<p>Không có dữ liệu</p>";

    return;
  }

  box.innerHTML =
    rows.map((r,i)=>`

      <div class="rating-item">

        <b>${i+1}.</b>

        <span class="teacher">
          ${r.teacherName}
        </span>

        <span class="stars">
          ${"⭐".repeat(r.star)}
        </span>

        <span class="avg-score">
          (${r.avg.toFixed(1)}/5)
        </span>

        <div class="comment">
          ${r.comment}
        </div>

      </div>

    `).join("");
}