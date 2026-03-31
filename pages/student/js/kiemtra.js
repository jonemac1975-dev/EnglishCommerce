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
let monHocNameMap = {};
let examType = "multiple_choice";
let essayAnswers = {};
let essayImageInputMap = {};


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

const selectedLop = localStorage.getItem("selectedLop");
const selectedMonHoc = localStorage.getItem("selectedMonHoc");

if (!selectedLop || !selectedMonHoc) {
  alert("Vui lòng chọn Lớp và Môn học ở sidebar trước khi vào Kiểm tra");
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
  await loadMonHocDisplay();
  await loadDanhSachBaiKiemTra();

document
  .getElementById("selKyThi")
  .addEventListener("change", async () => {

    clearInterval(timerInterval);

    document.getElementById("ktNoiDung").innerHTML = "";
    document.getElementById("ktTimer").innerText = "";
    document.getElementById("ktDung").innerText = "";
    document.getElementById("ktDiem").innerText = "";
 const coCauEl = document.getElementById("ktCoCauDiem");
    if (coCauEl) coCauEl.innerText = "Cơ cấu điểm: --";

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
   LOAD MÔN HỌC HIỂN THỊ
================================ */
async function loadMonHocDisplay() {
  const monHocId = localStorage.getItem("selectedMonHoc");

  if (!monHocId) {
    const el = document.getElementById("ktMonhoc");
    if (el) el.innerText = "Chưa chọn";
    return;
  }

  const data = await readData("config/danh_muc/monhoc");
  if (!data) return;

  Object.entries(data).forEach(([id, item]) => {
    monHocNameMap[id] = item.name || id;
  });

  const el = document.getElementById("ktMonhoc");
  if (el) {
    el.innerText = monHocNameMap[monHocId] || monHocId;
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
const monHocId = localStorage.getItem("selectedMonHoc");
const kyThiId = document.getElementById("selKyThi").value;

  if (!lopId || !monHocId || !kyThiId) return;

  const data = await readData(`teacher/${teacherId}/kiemtra`);
  if (!data) return;

  Object.entries(data).forEach(([id, kt]) => {

  if (kt.lop !== lopId) return;
  if (kt.kythi !== kyThiId) return;
  if ((kt.monhoc || "") !== monHocId) return;

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
  examType = baiKiemTra.examType || "multiple_choice";

const diemTNMax = Number(baiKiemTra?.diemTN || 0);
const diemTLMax = Number(baiKiemTra?.diemTL || 0);

const coCauEl = document.getElementById("ktCoCauDiem");
if (coCauEl) {
  coCauEl.innerText =
    `Cơ cấu điểm: Trắc nghiệm ${diemTNMax} | Tự luận ${diemTLMax}`;
}
  essayAnswers = {};
  essayImageInputMap = {};
  hienThiCoCauDiem(baiKiemTra);


  // Lấy kỳ thi đang chọn
  const kyThiId = document.getElementById("selKyThi").value;
  let thoiGianPhut = 15;

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

  clearInterval(timerInterval);

  if (daLam) {
    const timerEl = document.getElementById("ktTimer");
    if (timerEl) timerEl.innerText = "Bài đã làm";

    renderTracNghiem(
      baiKiemTra.noidung,
      true,
      daLam.traLoi || {}
    );

    renderEssaySection(
      baiKiemTra.essays || [],
      true,
      daLam.tuLuan || {}
    );

    document.getElementById("btnSubmit").disabled = true;
    hienKetQua(daLam, dapAnDungMap);

  } else {
    renderTracNghiem(baiKiemTra.noidung);
    renderEssaySection(
      baiKiemTra.essays || [],
      false,
      {}
    );

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



function renderEssaySection(essays = [], isDaLam = false, tuLuanCu = {}) {
  const wrap = document.getElementById("ktEssayWrap");
  const list = document.getElementById("ktEssayList");

  if (!wrap || !list) return;

  list.innerHTML = "";

  if (!Array.isArray(essays) || essays.length === 0) {
    wrap.style.display = "none";
    return;
  }

  wrap.style.display = "block";

  essays.forEach((html, index) => {
    const so = index + 1;
    const oldData = tuLuanCu?.[so] || {};

    const box = document.createElement("div");
    box.className = "essay-item";
    box.style.border = "1px solid #ddd";
    box.style.borderRadius = "10px";
    box.style.padding = "14px";
    box.style.marginBottom = "18px";
    box.style.background = "#fff";

    box.innerHTML = `
      <div class="essay-question" style="margin-bottom:12px;">
        <h4 style="margin-bottom:8px;">Câu tự luận ${so}</h4>
        <div class="essay-html">${html}</div>
      </div>

      <div class="essay-answer">
        <label><b>Bài làm:</b></label>
        <textarea
          id="essay_text_${so}"
          rows="6"
          style="width:100%; margin-top:8px; padding:10px; border-radius:8px;"
          placeholder="Nhập câu trả lời của bạn tại đây..."
          ${isDaLam ? "disabled" : ""}
        >${oldData.text || ""}</textarea>

        <div style="margin-top:12px;">
          <label><b>Hoặc chụp / tải ảnh bài làm:</b></label><br>
          <input
            type="file"
            id="essay_img_${so}"
            accept="image/*"
            ${isDaLam ? "disabled" : ""}
          >
        </div>

        <div id="essay_preview_${so}" style="margin-top:12px;">
          ${
            oldData.image
              ? `<img src="${oldData.image}" style="max-width:260px; border-radius:8px; border:1px solid #ddd;">`
              : ""
          }
        </div>
      </div>
    `;

    list.appendChild(box);

    const textArea = document.getElementById(`essay_text_${so}`);
    const imgInput = document.getElementById(`essay_img_${so}`);
    const preview = document.getElementById(`essay_preview_${so}`);

    if (!isDaLam) {
      textArea?.addEventListener("input", () => {
        essayAnswers[so] = {
          ...(essayAnswers[so] || {}),
          text: textArea.value
        };
      });

      imgInput?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const compressed = await compressImage(file, 1200, 0.7);

        essayAnswers[so] = {
          ...(essayAnswers[so] || {}),
          image: compressed
        };

        preview.innerHTML = `
          <img src="${compressed}" style="max-width:260px; border-radius:8px; border:1px solid #ddd;">
        `;
      });

      if (oldData.text || oldData.image) {
        essayAnswers[so] = {
          text: oldData.text || "",
          image: oldData.image || ""
        };
      }
    }
  });
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

//  const paragraphs = tempDiv.querySelectorAll("p");
const paragraphs = tempDiv.querySelectorAll("div, p, br");

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
   HIỂN THỊ CƠ CẤU ĐIỂM
================================ */
function hienThiCoCauDiem(baiKiemTra) {
  const el = document.getElementById("ktCoCauDiem");
  if (!el) return;

  const examType = baiKiemTra.examType || "multiple_choice";

  let diemTN = Number(baiKiemTra.diemTN ?? 0);
  let diemTL = Number(baiKiemTra.diemTL ?? 0);

  // fallback cho dữ liệu cũ chưa có điểm
  if (examType === "multiple_choice") {
    if (diemTN <= 0) diemTN = 10;
    diemTL = 0;
  }

  if (examType === "mixed") {
    if (diemTN === 0 && diemTL === 0) {
      diemTN = 5;
      diemTL = 5;
    }
  }

  el.innerHTML = `
  <b>Cơ cấu điểm bài kiểm tra:</b><br>
  Trắc nghiệm: <span style="color:#0d6efd">${diemTN} điểm</span>
  &nbsp;|&nbsp;
  Tự luận: <span style="color:#dc3545">${diemTL} điểm</span>
`;
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

  // =========================
  // LẤY CƠ CẤU ĐIỂM TỪ ĐỀ
  // =========================
  const diemTNMax = Number(baiKiemTraDangChon?.diemTN || 0);
  const diemTLMax = Number(baiKiemTraDangChon?.diemTL || 0);

  // =========================
  // TÍNH ĐIỂM TRẮC NGHIỆM THỰC TẾ
  // =========================
  let diemTNThucTe = 0;

  if (tong > 0 && diemTNMax > 0) {
    diemTNThucTe = (dung / tong) * diemTNMax;
  }

  diemTNThucTe = Number(diemTNThucTe.toFixed(1));

  // =========================
  // GOM PHẦN TỰ LUẬN
  // =========================
  const tuLuan = {};

  const essays = baiKiemTraDangChon.essays || [];
  essays.forEach((_, index) => {
    const so = index + 1;
    const textEl = document.getElementById(`essay_text_${so}`);

    tuLuan[so] = {
      text: textEl?.value?.trim() || essayAnswers?.[so]?.text || "",
      image: essayAnswers?.[so]?.image || ""
    };
  });

  // =========================
  // TÍNH ĐIỂM TẠM / CUỐI
  // =========================
  const laDeTongHop = examType === "mixed";

  const diemTamThoi = diemTNThucTe;
  const finalScore = laDeTongHop ? null : diemTNThucTe;

  // Header hiển thị
  document.getElementById("ktDung").innerText = `${dung}/${tong}`;
  document.getElementById("ktDiem").innerText = diemTNThucTe;

  const baiId = document.getElementById("selBaiKT").value;

  await writeData(
    `users/students/${student.id}/kiemtra/${baiId}`,
    {
      bai: baiId,
      giao_vien: teacherId,
      lop: localStorage.getItem("selectedLop"),
      monhoc: localStorage.getItem("selectedMonHoc"),
      kythi: document.getElementById("selKyThi").value,

      examType,

      dung,
      tong,

      // 🔥 điểm theo cơ cấu đề
      diem: diemTNThucTe,          // điểm TN thực tế
      diem_tn: diemTNThucTe,       // rõ nghĩa hơn cho file tổng hợp điểm
      diem_tl: null,               // chưa chấm lúc học sinh nộp
      diemTNMax,                   // ví dụ 3
      diemTLMax,                   // ví dụ 7

      traLoi,
      tuLuan,

      essayPending: laDeTongHop,
      essayScore: null,

      // đề tổng hợp thì chưa có điểm cuối
      finalScore,
      tong_diem: finalScore,

      ngay: new Date().toISOString()
    }
  );

  hienKetQua(
    {
      dung,
      tong,
      diem: diemTNThucTe,
      traLoi
    },
    dapAnDungMap
  );

  alert(
    laDeTongHop
      ? `Đã nộp bài!\nTrắc nghiệm: ${diemTNThucTe}/${diemTNMax} điểm\nTự luận tối đa: ${diemTLMax} điểm\nPhần tự luận chờ giáo viên chấm.`
      : `Hoàn thành!\nĐiểm: ${diemTNThucTe}/${diemTNMax}`
  );

  document.getElementById("btnSubmit").disabled = true;
  disableForm();
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


async function compressImage(file, maxWidth = 1200, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL("image/jpeg", quality);
        resolve(base64);
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}



/* ===============================
   DISABLE
================================ */
function disableForm() {
  document
    .querySelectorAll("#ktNoiDung input, #ktNoiDung textarea, #ktEssayWrap input, #ktEssayWrap textarea, select, #btnSubmit")
    .forEach(el => el.disabled = true);
}