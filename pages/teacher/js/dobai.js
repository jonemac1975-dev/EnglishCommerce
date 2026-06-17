import { readData } from "../../../scripts/services/firebaseService.js";

let dsLop = {};
let students = {};

export async function init() {

  dsLop =
    await readData("config/danh_muc/lop") || {};

  students =
    await readData("users/students") || {};

  renderLop();

  document
    .getElementById("btnStartDoBai")
    ?.addEventListener(
      "click",
      startDoBai
    );

  document
    .getElementById("btnPickAgain")
    ?.addEventListener(
      "click",
      startDoBai
    );

  document
  .getElementById("btnCloseWinner")
  ?.addEventListener("click", () => {

    if (typeof window.goHome === "function") {
      window.goHome();
      return;
    }

    const mainContent =
      document.getElementById("mainContent");

    const mainBg =
      document.getElementById("mainBg");

    if (mainContent)
      mainContent.innerHTML = "";

    if (mainBg)
      mainBg.style.display = "block";

      }
    );
}

function renderLop() {

  const select =
    document.getElementById("dobaiLop");

  let html =
    `<option value="">-- Chọn lớp --</option>`;

  Object.entries(dsLop)
    .forEach(([id,item])=>{

      html += `
        <option value="${id}">
          ${item.name}
        </option>
      `;

    });

  select.innerHTML = html;
}

async function startDoBai() {

  const lopId =
    document.getElementById("dobaiLop").value;

  if(!lopId){

    alert("Chọn lớp");

    return;
  }

  const list = [];

  Object.entries(students)
    .forEach(([id,sv])=>{

      const profile =
        sv.profile || {};

      if(profile.lop !== lopId)
        return;

      list.push({
        id,
        name:
          profile.ho_ten ||
          sv.auth?.username ||
          "Không rõ tên"
      });

    });

  if(!list.length){

    alert("Lớp chưa có sinh viên");

    return;
  }

  const status =
    document.getElementById("dobaiStatus");

  const resultBox =
    document.getElementById("dobaiResult");

  resultBox.classList.add("hidden");

  let count = 0;

  const timer =
    setInterval(()=>{

      const random =
        list[
          Math.floor(
            Math.random() * list.length
          )
        ];

      status.textContent =
        random.name;

      count++;

      if(count > 30){

  clearInterval(timer);

  const winner =
    list[
      Math.floor(
        Math.random() * list.length
      )
    ];

  document
    .getElementById("winnerName")
    .textContent =
    winner.name;

  status.textContent =
    "🎉 CHÚC MỪNG";

  resultBox
    .classList
    .remove("hidden");

  // 🔊 Âm thanh
  document
    .getElementById("winnerSound")
    ?.play()
    .catch(()=>{});

  // 🎉 Pháo giấy

  fireConfetti();

}

    },100);
}

function fireConfetti() {

  if (typeof confetti !== "function") return;

  const duration = 6000;
  const end = Date.now() + duration;

  (function frame() {

    confetti({
      particleCount: 2,
      angle: 90,
      spread: 180,
      startVelocity: 2,
      gravity: 0.08,
      scalar: 0.9,
      ticks: 600,
      origin: {
        x: 0.5,
        y: 0.45
      }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }

  })();

}