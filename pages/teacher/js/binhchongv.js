import { readData } from "../../../scripts/services/firebaseService.js";

const teacherId =
  localStorage.getItem("view_teacher_id") ||
  localStorage.getItem("teacher_id");

let chartInstance = null;
let studentMap = {};

init();

/* =========================
   INIT
========================= */
async function init() {
  if (!teacherId) {
    alert("Không có ID giáo viên");
    return;
  }

  await loadStudents();
  await loadList();
}

/* =========================
   LOAD STUDENTS
========================= */
async function loadStudents() {
  const data = await readData("users/students");

  if (!data) return;

  Object.entries(data).forEach(([id, u]) => {
    studentMap[id] = u?.profile?.ho_ten || "(Không tên)";
  });
}

/* =========================
   LOAD LIST + TABLE
========================= */
async function loadList() {
  const list = document.getElementById("list");
  const avgEl = document.getElementById("avg");

  const data = await readData(`ratingDetails/${teacherId}`);

  list.innerHTML = "";

  // 👉 lấy tuần + tháng hiện tại
  const now = new Date();
  const month = now.getMonth() + 1;
  const week = Math.ceil(now.getDate() / 7);

  // 👉 update header
  const titleEl = document.querySelector(".top-bar h2");
  if (titleEl) {
    titleEl.innerText = `📊 Tuần ${week} - Tháng ${month}`;
  }

  if (!data) {
    list.innerHTML =
      "<tr><td colspan='4'>Chưa có bình chọn</td></tr>";
    avgEl.innerText = "Chưa có dữ liệu";
    return;
  }

  let stars = [];
  let index = 1;

  Object.values(data).forEach(r => {
    if (!r?.star) return;

    stars.push(r.star);

    const name =
      studentMap[r.studentId] || r.studentId;

    list.innerHTML += `
      <tr>
        <td>${index++}</td>
        <td style="text-align:left">${name}</td>
        <td>${"⭐".repeat(r.star)}</td>
        <td style="text-align:left">${r.comment || ""}</td>
      </tr>
    `;
  });

  // 👉 nếu không có dữ liệu hợp lệ
  if (stars.length === 0) {
    list.innerHTML =
      "<tr><td colspan='4'>Chưa có dữ liệu hợp lệ</td></tr>";
    avgEl.innerText = "Chưa có dữ liệu";
    return;
  }

  // 👉 tính điểm trung bình
  const avg =
    stars.reduce((a, b) => a + b, 0) / stars.length;

  avgEl.innerText =
    `⭐ ${avg.toFixed(1)} / 5 (${stars.length} lượt)`;

  // 👉 vẽ chart + summary
  drawChart(stars);
  renderSummary(stars);
}


/* =========================
   CHART (FIX FULL)
========================= */
function drawChart(data) {

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const count = [0, 0, 0, 0, 0];
  data.forEach(s => count[s - 1]++);

  const ctx = document.getElementById("chart").getContext("2d");

  chartInstance = new Chart(ctx, {
    type: "bar",

    data: {
      labels: ["1⭐", "2⭐", "3⭐", "4⭐", "5⭐"],
      datasets: [{
        data: count,
        borderRadius: 10,
        borderSkipped: false
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",

      plugins: {
        legend: { display: false }
      },

      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            precision: 0
          },
          grid: {
            color: "#eee"
          }
        },
        y: {
          grid: { display: false }
        }
      }
    },

    plugins: [{
      id: "label",
      afterDatasetsDraw(chart) {
        const { ctx } = chart;

        chart.data.datasets.forEach((dataset, i) => {
          const meta = chart.getDatasetMeta(i);

          meta.data.forEach((bar, index) => {
            const value = dataset.data[index];

            if (value > 0) {
              ctx.fillStyle = "#111";
              ctx.font = "12px system-ui";
              ctx.textAlign = "left";
              ctx.fillText(value, bar.x + 6, bar.y + 4);
            }
          });
        });
      }
    }]
  });
}


/* =========================
   SUMMARY BAR
========================= */
function renderSummary(data) {
  const count = [0, 0, 0, 0, 0];

  data.forEach(s => count[s - 1]++);

  const total = data.length;

  const html = count
    .map((c, i) => {
      const percent = total
        ? (c / total) * 100
        : 0;

      return `
        <div class="row">
          <span>${i + 1}⭐</span>
          <div class="bar">
            <div style="width:${percent}%"></div>
          </div>
          <span>${c}</span>
        </div>
      `;
    })
    .reverse()
    .join("");

  document.getElementById("summary").innerHTML = html;
}