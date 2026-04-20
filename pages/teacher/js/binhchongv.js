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

  if (!data) {
    list.innerHTML =
      "<tr><td colspan='4'>Chưa có bình chọn</td></tr>";
    avgEl.innerText = "Chưa có dữ liệu";
    return;
  }

  let stars = [];

  Object.values(data).forEach(r => {
    stars.push(r.star);

    const name =
      studentMap[r.studentId] || r.studentId;

    list.innerHTML += `
      <tr>
        <td>${r.week}</td>
        <td>${name}</td>
        <td>${"⭐".repeat(r.star)}</td>
        <td>${r.comment || ""}</td>
      </tr>
    `;
  });

  const avg =
    stars.reduce((a, b) => a + b, 0) / stars.length;

  avgEl.innerText =
    `⭐ ${avg.toFixed(1)} / 5 (${stars.length} lượt)`;

  drawChart(stars);
}

/* =========================
   CHART (FIX FULL)
========================= */
function drawChart(data) {

  // 🔥 chống render đè
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const count = [0, 0, 0, 0, 0];
  data.forEach(s => count[s - 1]++);

  const canvas = document.getElementById("chart");
  const ctx = canvas.getContext("2d");

  // gradient đẹp
  const gradient = ctx.createLinearGradient(0, 0, 200, 0);
  gradient.addColorStop(0, "#ff7a00");
  gradient.addColorStop(1, "#ffb347");

  chartInstance = new Chart(ctx, {
    type: "bar",

    data: {
      labels: ["1⭐", "2⭐", "3⭐", "4⭐", "5⭐"],

      datasets: [{
        data: count,
        backgroundColor: gradient,
        borderRadius: 8,
        borderSkipped: false
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      indexAxis: "y", // 🔥 FIX QUAN TRỌNG: bar ngang chuẩn

      plugins: {
        legend: { display: false },

        tooltip: {
          backgroundColor: "#333"
        }
      },

      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "#eee" }
        },

        y: {
          grid: { display: false }
        }
      }
    },

    plugins: [
      {
        id: "valueLabel",
        afterDatasetsDraw(chart) {
          const { ctx } = chart;

          chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);

            meta.data.forEach((bar, index) => {
              const value = dataset.data[index];

              if (value > 0) {
                ctx.fillStyle = "#333";
                ctx.font = "12px Arial";
                ctx.textAlign = "left";

                ctx.fillText(
                  value,
                  bar.x + 8,
                  bar.y + 4
                );
              }
            });
          });
        }
      }
    ]
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