console.log("🔥 kiemtra.js LOADED");

import { readData, writeData } from "../../../scripts/services/firebaseService.js";

/* ===============================
   STATE
================================ */
let student;
let teacherId;
let teacherName;
let baiKiemTraDangChon = null;
let dapAnDungMap = {};
let timerInterval = null;
let timeRemaining = 0; // tính bằng giây
let daCanhBao5Phut = false;
let lopNameMap = {};

/* ===============================
   INIT (BẮT BUỘC)
================================ */
export async function init() {
  console.log("🔥🔥 INIT KIEMTRA CHẠY");

  student = JSON.parse(localStorage.getItem("studentLogin") || "null");
  teacherId = localStorage.getItem("selectedTeacher");
  teacherName = localStorage.getItem("selectedTeacherName") || "Giáo viên";

  if (!student || !teacherId) {
    alert("Chưa đăng nhập hoặc chưa chọn giáo viên");
    return;
  }

  document.getElementById("ktHocVien").innerText =
    `${student.ho_ten}`;

  document.getElementById("ktGiaoVien").innerText =
    teacherName;

  document.getElementById("ktNgay").innerText =
    new Date().toLocaleDateString("vi-VN");

  await loadDanhMuc();
  await loadLopDisplay();
  await loadDanhSachBaiKiemTra();

document
  .getElementById("selKyThi")
  .addEventListener("change", async () => {

    clearInterval(timerInterval);

    document.getElementById("ktNoiDung").innerHTML = "";
    document.getElementById("ktTimer").innerText = "";
    document.getElementById("ktDung").innerText = "";
    document.getElementById("ktDiem").innerText = "";

    await loadDanhSachBaiKiemTra();
  });

document
    .getElementById("selBaiKT")
    .addEventListener("change", onChonBaiKiemTra);

  document
    .getElementById("btnSubmit")
    .addEventListener("click", nopBai);
}



/* ===============================
   LOAD DANH MỤC
================================ */
async function loadDanhMuc() {
  await loadSelect("kythi", "selKyThi");
  }

async function loadSelect(dm, selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;

  sel.innerHTML = `<option value="">-- Chọn --</option>`;

  // ✅ ĐÚNG: đọc theo danh mục truyền vào
  const data = await readData(`config/danh_muc/${dm}`);
  if (!data) return;

  Object.entries(data).forEach(([id, item]) => {
    const opt = document.createElement("option");
    opt.value = id;

    // Nếu là kỳ thi thì hiển thị thêm thời gian
    if (dm === "kythi" && item.thoigian) {
      opt.textContent = `${item.name} (${item.thoigian} phút)`;
    } else {
      opt.textContent = item.name || id;
    }

    sel.appendChild(opt);
  });
}

/* ===============================
   LOAD LỚP
================================ */
async function loadLopDisplay() {

  const lopId = localStorage.getItem("selectedLop");

  if (!lopId) {
    alert("⚠️ Bạn chưa chọn lớp ở sidebar");
    return;
  }

  const data = await readData("config/danh_muc/lop");
  if (!data) return;

  Object.entries(data).forEach(([id, item]) => {
    lopNameMap[id] = item.name || id;
  });

  const el = document.getElementById("ktLop");
  if (el) {
    el.innerText = lopNameMap[lopId] || lopId;
  }
}
/* ===============================
   LOAD BÀI KIỂM TRA
================================ */
async function loadDanhSachBaiKiemTra() {

  const select = document.getElementById("selBaiKT");
  if (!select) return;

  select.innerHTML = `<option value="">-- chọn bài kiểm tra --</option>`;

  const lopId = localStorage.getItem("selectedLop");
  const kyThiId = document.getElementById("selKyThi").value;

  if (!lopId || !kyThiId) return;

  const data = await readData(`teacher/${teacherId}/kiemtra`);
  if (!data) return;

  Object.entries(data).forEach(([id, kt]) => {

    if (kt.lop !== lopId) return;
    if (kt.kythi !== kyThiId) return;

    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = kt.tieude || "Bài kiểm tra";

    select.appendChild(opt);
  });
}

/* ===============================
   CHỌN BÀI
================================ */
async function onChonBaiKiemTra(e) {
  const baiId = e.target.value;
  if (!baiId) return;

  const baiKiemTra =
    await readData(`teacher/${teacherId}/kiemtra/${baiId}`);

  if (!baiKiemTra || !baiKiemTra.noidung) {
    alert("Bài kiểm tra chưa có nội dung");
    return;
  }

  baiKiemTraDangChon = baiKiemTra;

// Set thời gian theo kỳ thi

// Lấy kỳ thi đang chọn
const kyThiId = document.getElementById("selKyThi").value;

let thoiGianPhut = 15; // mặc định

if (kyThiId) {
  const kyThiData = await readData(`config/danh_muc/kythi/${kyThiId}`);
  if (kyThiData?.thoigian) {
    thoiGianPhut = kyThiData.thoigian;
  }
}

// 🔥 KIỂM TRA ĐÃ LÀM CHƯA
const daLam = await readData(
  `users/students/${student.id}/kiemtra/${baiId}`
);

// 🔥 LUÔN CLEAR TIMER CŨ TRƯỚC
clearInterval(timerInterval);

if (daLam) {

  // ===== ĐÃ LÀM =====
  const timerEl = document.getElementById("ktTimer");
  if (timerEl) timerEl.innerText = "Bài đã nộp";

  renderTracNghiem(
    baiKiemTra.noidung,
    true,
    daLam.traLoi
  );

  document.getElementById("btnSubmit").disabled = true;

  hienKetQua(daLam, dapAnDungMap);

} else {

  renderTracNghiem(baiKiemTra.noidung);
  document.getElementById("btnSubmit").disabled = false;
  startTimer(thoiGianPhut);
}
}


/* ===============================
   RENDER Nội dung
================================ */
function renderHTMLNoiDung(html) {
  const container = document.getElementById("ktNoiDung");

  if (!html) {
    container.innerHTML = "<i>Chưa có nội dung</i>";
    return;
  }

  container.innerHTML = html; // ✅ HTML chạy đúng
}


/* ===============================
   RENDER TRẮC NGHIỆM
================================ */
function renderTracNghiem(html, isDaLam = false, traLoiCu = {}) {
  const container = document.getElementById("ktNoiDung");
  container.innerHTML = "";
  dapAnDungMap = {};

  // 👉 Parse HTML thành DOM thật
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const paragraphs = tempDiv.querySelectorAll("p");

  let cauSo = 0;
  let cauDiv = null;
let daGapCauHoi = false;

paragraphs.forEach(p => {
  const line = p.innerText.trim();
  if (!line) return;

// ===== TIÊU ĐỀ / MÔ TẢ =====
  if (!/^Câu\s*\d+/i.test(line) && !daGapCauHoi) {
    container.innerHTML += `<p>${line}</p>`;
    return;
  }

    // ===== CÂU HỎI =====
  if (/^Câu\s*\d+/i.test(line)) {
  daGapCauHoi = true;
  cauSo++;

  cauDiv = document.createElement("div");
  cauDiv.className = "cau";
  cauDiv.id = `cau${cauSo}`; // 🔥 QUAN TRỌNG
  cauDiv.dataset.cau = cauSo;

  cauDiv.innerHTML = `<h4>${line}</h4>`;
  container.appendChild(cauDiv);
  return;
}

    // ===== ĐÁP ÁN =====
  if (/^[A-D]\./.test(line) && cauDiv) {
      const dapAn = line[0];
      const isDung = line.includes("*");

      if (isDung) {
        dapAnDungMap[cauSo] = dapAn;
      }

      const textHienThi = line.replace("*", "").trim();

      const label = document.createElement("label");
label.style.display = "flex";
label.style.alignItems = "center";
label.style.gap = "8px";
label.style.margin = "6px 0";

const input = document.createElement("input");
input.type = "radio";
input.name = `cau${cauSo}`;
input.value = dapAn;

if (isDaLam) input.disabled = true;

if (traLoiCu?.[cauSo] === dapAn) {
  input.checked = true;
  if (isDaLam) {
    label.style.color =
      dapAnDungMap[cauSo] === dapAn
        ? "green"
        : "red";
  }
}

label.appendChild(input);
label.appendChild(document.createTextNode(textHienThi));

cauDiv.appendChild(label);
    }
  });
}


/* ===============================
   ĐẾM NGƯỢC
================================ */
function startTimer(phut) {
  clearInterval(timerInterval);

  timeRemaining = phut * 60;
  daCanhBao5Phut = false;

  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeRemaining--;

    updateTimerDisplay();

    // 🔔 Cảnh báo còn 5 phút
    if (timeRemaining === 300 && !daCanhBao5Phut) {
      daCanhBao5Phut = true;
      alert("⚠️ Còn 5 phút! Vui lòng kiểm tra lại bài.");
    }

    // ⏰ Hết giờ
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      alert("⏰ Hết giờ! Hệ thống tự động nộp bài.");
      nopBai();
    }

  }, 1000);
}

/* ===============================
   HIỂN THỊ THỜI GIAN
================================ */
function updateTimerDisplay() {
  const el = document.getElementById("ktTimer");
  if (!el) return;

  const phut = Math.floor(timeRemaining / 60);
  const giay = timeRemaining % 60;

  el.innerText =
    `⏳ Thời gian còn lại: ${phut.toString().padStart(2,"0")}:${giay.toString().padStart(2,"0")}`;

  if (timeRemaining <= 300) {
    el.style.color = "red";
  }
}

/* ===============================
   NỘP BÀI
================================ */
async function nopBai() {
clearInterval(timerInterval);
  if (!baiKiemTraDangChon) {
    alert("Chưa chọn bài kiểm tra");
    return;
  }

  let dung = 0;
  const tong = Object.keys(dapAnDungMap).length;
  const traLoi = {};

  Object.entries(dapAnDungMap).forEach(([cau, dapAnDung]) => {
    const checked = document.querySelector(
      `input[name="cau${cau}"]:checked`
    );

    if (checked) {
      traLoi[cau] = checked.value;
      if (checked.value === dapAnDung) dung++;
    }
  });

if (tong === 0) {
  alert("Bài chưa có đáp án đúng!");
  return;
}
  const diem = Math.round((dung / tong) * 10);

// 👉 HIỂN THỊ LÊN HEADER
document.getElementById("ktDung").innerText = `${dung}/${tong}`;
document.getElementById("ktDiem").innerText = diem;

  await writeData(
    `users/students/${student.id}/kiemtra/${document.getElementById("selBaiKT").value}`,
    {
      bai: document.getElementById("selBaiKT").value,
      giao_vien: teacherId,
      lop: localStorage.getItem("selectedLop"),
      kythi: document.getElementById("selKyThi").value,
      dung,
      tong,
      diem,
      traLoi,
      ngay: new Date().toISOString()
    }
  );
hienKetQua(
  {
    dung,
    diem,
    traLoi
  },
  dapAnDungMap
);
  alert(`Hoàn thành! Điểm: ${diem}`);
  document.getElementById("btnSubmit").disabled = true;
}


/* ===============================
  HIỂN THỊ KẾT QUẢ
================================ */

function hienKetQua(duLieuNop, dapAnDung) {

  document.getElementById("ktDung").innerText =
    `${duLieuNop.dung}/${duLieuNop.tong || Object.keys(dapAnDung).length}`;

  document.getElementById("ktDiem").innerText =
    duLieuNop.diem;

  const traLoi = duLieuNop.traLoi || {};
  let cauSaiList = [];
  let firstSaiElement = null;

  Object.keys(dapAnDung).forEach((soCau) => {

    const dapAn = dapAnDung[soCau];
    const dapAnChon = traLoi[soCau];
    const cauDiv = document.getElementById(`cau${soCau}`);
    if (!cauDiv) return;

    const radios =
      document.querySelectorAll(`input[name="cau${soCau}"]`);

    radios.forEach(radio => {

      radio.disabled = true;

      if (radio.value === dapAnChon) {
        radio.checked = true;
      }

      const label = radio.closest("label");

      // Xóa icon cũ nếu có
      label.querySelectorAll(".answer-icon")
        .forEach(el => el.remove());

      // ĐÁP ÁN ĐÚNG
      if (radio.value === dapAn) {
        label.classList.add("dung");

        const icon = document.createElement("span");
        icon.className = "answer-icon icon-dung";
        icon.innerText = "✔";
        label.appendChild(icon);
      }

      // ĐÁP ÁN SAI
      if (dapAnChon && dapAnChon !== dapAn && radio.value === dapAnChon) {
        label.classList.add("sai");

        const icon = document.createElement("span");
        icon.className = "answer-icon icon-sai";
        icon.innerText = "✖";
        label.appendChild(icon);
      }

    });

    // Đánh dấu câu
    if (dapAnChon === dapAn) {
      cauDiv.classList.add("dung-cau");
    } else {
      cauDiv.classList.add("sai-cau");
      cauSaiList.push(soCau);

      if (!firstSaiElement) {
        firstSaiElement = cauDiv;
      }
    }

  });

  // ===== THỐNG KÊ =====
  if (cauSaiList.length > 0) {

    const summary = document.createElement("div");
    summary.className = "kt-summary";
    summary.innerHTML =
      `❌ Bạn sai câu: ${cauSaiList.join(", ")}`;

    const old = document.querySelector(".kt-summary");
    if (old) old.remove();

    document.getElementById("ktNoiDung")
      .insertAdjacentElement("beforebegin", summary);

    setTimeout(() => {
      firstSaiElement?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 400);
  }

}
/* ===============================
   DISABLE
================================ */
function disableForm() {
  document
    .querySelectorAll("#ktNoiDung input, select, #btnSubmit")
    .forEach(el => el.disabled = true);
}