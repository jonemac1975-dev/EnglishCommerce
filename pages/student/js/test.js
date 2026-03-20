import { readData, writeData } from "../../../scripts/services/firebaseService.js";

let student;
let teacherId;
let dapAnDungMap = {};
let deDangChon = null;
let thoiGian = 30 * 60; // 30 phút
let timerInterval;

/* ===================== INIT ===================== */
export async function init() {

  student = JSON.parse(localStorage.getItem("studentLogin") || "null");
  teacherId = localStorage.getItem("selectedTeacher");
console.log("TeacherId:", teacherId); // 👈 thêm dòng này
  if (!student || !teacherId) {
    alert("Thiếu thông tin học viên / giáo viên");
    return;
  }

  document.getElementById("testId").innerText = student.id;
  document.getElementById("testName").innerText = student.ho_ten;
await loadDanhSachDe();
//   startTimer();

  document.getElementById("btnSubmitTest")
    .addEventListener("click", nopBai);
}


async function loadDanhSachDe() {

  const grid = document.getElementById("testGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const selectedTeacher =
    localStorage.getItem("selectedTeacher");

  const selectedLop =
    localStorage.getItem("selectedLop");

  if (!selectedTeacher || !selectedLop) {
    console.warn("Chưa chọn giáo viên hoặc lớp");
    return;
  }

  const data =
    await readData(`teacher/${selectedTeacher}/test`);

  if (!data) {
    grid.innerHTML = "<p>Chưa có đề nào</p>";
    return;
  }

  const daLam =
    await readData(`users/students/${student.id}/test`)
    || {};

  let count = 0;

  Object.entries(data).forEach(([id, item]) => {

    // 🔥 FILTER THEO LỚP ĐANG CHỌN
    if (item.lop !== selectedLop) return;

    count++;

    const btn = document.createElement("button");
    btn.innerText = item.made || "??";
    btn.className = "test-btn";

    if (!item.noidung) btn.disabled = true;
    if (daLam[id]) btn.classList.add("da-lam");

    btn.onclick = () =>
      loadDe(id, item.noidung, daLam[id] || null);

    grid.appendChild(btn);
  });

  if (count === 0) {
    grid.innerHTML =
      "<p>Không có đề kiểm tra cho lớp này</p>";
  }
}

/* ===================== LOAD ĐỀ ===================== */
function loadDe(id, html, duLieuDaLam = null) {

  deDangChon = id;

  // 🔥 Luôn dừng timer cũ trước
  clearInterval(timerInterval);

  // reset thời gian về 30 phút
  thoiGian = 30 * 60;

  renderTracNghiem(
    html,
    !!duLieuDaLam,
    duLieuDaLam?.traLoi || {}
  );

  if (duLieuDaLam) {

    // ===== ĐÃ LÀM =====
    const time = new Date(duLieuDaLam.ngay)
  .toLocaleTimeString("vi-VN");

document.getElementById("testTimer").innerText =
  "Nộp lúc " + time;

    setTimeout(() => {
      hienKetQuaTest(duLieuDaLam);
    }, 100);

    document.getElementById("btnSubmitTest").disabled = true;

  } else {

    // ===== CHƯA LÀM =====
    document.getElementById("btnSubmitTest").disabled = false;

    startTimer();   // 🔥 CHỈ CHẠY Ở ĐÂY
  }
}

/* ===================== RENDER ===================== */
function renderTracNghiem(html, isDaLam = false, traLoiCu = {}) {

  const container = document.getElementById("testNoiDung");
  container.innerHTML = "";
  dapAnDungMap = {};

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

//  const paragraphs = tempDiv.querySelectorAll("p");
const paragraphs = tempDiv.querySelectorAll("div, p, br");
  let cauSo = 0;
  let cauDiv = null;
  let daGapCauHoi = false;

  paragraphs.forEach(p => {

    const line = p.innerText.trim();
    if (!line) return;

    if (!/^Câu\s*\d+/i.test(line) && !daGapCauHoi) {
      container.innerHTML += `<p>${line}</p>`;
      return;
    }

    if (/^Câu\s*\d+/i.test(line)) {
      daGapCauHoi = true;
      cauSo++;

      cauDiv = document.createElement("div");
      cauDiv.className = "cau";
      cauDiv.id = `cau${cauSo}`;
      cauDiv.innerHTML = `<b>${line}</b>`;
      container.appendChild(cauDiv);
      return;
    }

    if (/^[A-D]\./.test(line) && cauDiv) {

      const dapAn = line[0];
      const isDung = line.includes("*");

      if (isDung) dapAnDungMap[cauSo] = dapAn;

      const text = line.replace("*", "").trim();

      const label = document.createElement("label");

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `cau${cauSo}`;
      input.value = dapAn;

      if (isDaLam) input.disabled = true;

      if (traLoiCu[cauSo] === dapAn) {
        input.checked = true;
      }

      label.appendChild(input);
      label.append(" " + text);

      cauDiv.appendChild(label);
    }
  });
}

/* ===================== NỘP BÀI ===================== */
async function nopBai() {
clearInterval(timerInterval);
  if (!deDangChon) {
    alert("Chưa chọn đề");
    return;
  }

  let dung = 0;
  const tong = Object.keys(dapAnDungMap).length;
  const traLoi = {};

  Object.entries(dapAnDungMap).forEach(([cau, dapAn]) => {

    const checked = document.querySelector(
      `input[name="cau${cau}"]:checked`
    );

    if (checked) {
      traLoi[cau] = checked.value;
      if (checked.value === dapAn) dung++;
    }
  });

  const diem = Math.round((dung / tong) * 10);

  document.getElementById("testDung").innerText = `${dung}/${tong}`;
  document.getElementById("testDiem").innerText = diem;

  await writeData(
  `users/students/${student.id}/test/${deDangChon}`,
  {
    giao_vien: teacherId,
    made: deDangChon,
    dung,
    tong,
    diem,
    traLoi,   // 🔥 nên thêm dòng này
    ngay: new Date().toISOString()
  }
);

  alert("Hoàn thành bài test!");
}

/* ==========HIỂN THỊ KẾT QUẢ=============== */
function hienKetQuaTest(data) {

  // ===== HEADER =====
  document.getElementById("testDung")
    .innerText = `${data.dung}/${data.tong}`;

  document.getElementById("testDiem")
    .innerText = data.diem;

  const traLoi = data.traLoi || {};

  let cauSaiList = [];
  let firstSai = null;

  Object.keys(dapAnDungMap).forEach(cau => {

    const dapAn = dapAnDungMap[cau];
    const chon = traLoi[cau];

    const cauDiv = document.getElementById(`cau${cau}`);
    const radios =
      document.querySelectorAll(`input[name="cau${cau}"]`);

    radios.forEach(radio => {

      radio.disabled = true;

      const label = radio.closest("label");

      // ĐÁP ÁN ĐÚNG
      if (radio.value === dapAn) {
        label.classList.add("dung");
        label.innerHTML +=
          `<span class="answer-icon icon-dung">✔</span>`;
      }

      // ĐÁP ÁN CHỌN SAI
      if (chon &&
          chon !== dapAn &&
          radio.value === chon) {

        label.classList.add("sai");
        label.innerHTML +=
          `<span class="answer-icon icon-sai">✖</span>`;
      }

      if (radio.value === chon) {
        radio.checked = true;
      }
    });

    if (chon !== dapAn) {
      cauSaiList.push(cau);

      if (!firstSai) {
        firstSai = cauDiv;
      }
    }
  });

  // ===== THỐNG KÊ =====
  if (cauSaiList.length > 0) {

    const summary = document.createElement("div");
    summary.className = "kt-summary";
    summary.innerHTML =
      `❌ Bạn sai câu: ${cauSaiList.join(", ")}`;

    document
      .getElementById("testNoiDung")
      .prepend(summary);

    // cuộn tới câu sai đầu tiên
    setTimeout(() => {
      firstSai.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 400);
  }
}
/* ===================== TIMER ===================== */
function startTimer() {

  const el = document.getElementById("testTimer");

  timerInterval = setInterval(() => {

    const minutes = Math.floor(thoiGian / 60);
    const seconds = thoiGian % 60;

    el.innerText =
      `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

    thoiGian--;

    if (thoiGian < 0) {
      clearInterval(timerInterval);
      nopBai();
    }

  }, 1000);
}