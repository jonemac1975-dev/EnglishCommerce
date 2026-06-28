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
let timeRemaining = 0; // giây
let daCanhBao5Phut = false;
let lopNameMap = {};
let monHocNameMap = {};
let examType = "multiple_choice";
let essayAnswers = {};
let currentExamSession = null;
let draftSaveInterval = null;
let examOpenCountdownInterval = null;
let currentSelectedBaiId = null;
let examBank = [];
let currentRandomExam = null;
let currentDrawCount = 0;

// 🔥 Cho phép vào trễ tối đa 15 phút kể từ giờ mở đề
//const EXAM_LATE_WINDOW_MINUTES = 15;



/* ===============================
   DRAFT LOCAL
================================ */
function getDraftKey(baiId) {
  return `exam_draft_${student?.id || "unknown"}_${baiId}`;
}

function getFirebaseDraftPath(baiId) {
  return `users/students/${student?.id}/kiemtra_draft/${baiId}`;
}

async function saveDraftToFirebase() {
  if (!baiKiemTraDangChon || !currentSelectedBaiId) return;

  const tracNghiem = {};
  Object.keys(dapAnDungMap).forEach((cau) => {
    const checked = document.querySelector(`input[name="cau${cau}"]:checked`);
    if (checked) tracNghiem[cau] = checked.value;
  });

  const essays = {};
  const essayList = baiKiemTraDangChon.essays || [];
  essayList.forEach((_, index) => {
    const so = index + 1;
    const textEl = document.getElementById(`essay_text_${so}`);

    essays[so] = {
      text: textEl?.value?.trim() || essayAnswers?.[so]?.text || "",
      image: essayAnswers?.[so]?.image || ""
    };
  });

  await writeData(getFirebaseDraftPath(currentSelectedBaiId), {
    tracNghiem,
    essays,
    savedAt: Date.now()
  });
}

function saveDraftToLocal() {
  if (!baiKiemTraDangChon || !currentSelectedBaiId) return;

  const baiId = currentSelectedBaiId;

  const tracNghiem = {};
  Object.keys(dapAnDungMap).forEach((cau) => {
    const checked = document.querySelector(`input[name="cau${cau}"]:checked`);
    if (checked) tracNghiem[cau] = checked.value;
  });

  const essays = {};
  const essayList = baiKiemTraDangChon.essays || [];
  essayList.forEach((_, index) => {
    const so = index + 1;
    const textEl = document.getElementById(`essay_text_${so}`);

    essays[so] = {
      text: textEl?.value?.trim() || essayAnswers?.[so]?.text || "",
      image: essayAnswers?.[so]?.image || ""
    };
  });

  localStorage.setItem(
    getDraftKey(baiId),
    JSON.stringify({
      tracNghiem,
      essays,
      savedAt: Date.now()
    })
  );
}

async function loadBestDraft(baiId) {
  try {
    const localRaw = localStorage.getItem(getDraftKey(baiId));
    const localDraft = localRaw ? JSON.parse(localRaw) : null;

    const fireDraft = await readData(getFirebaseDraftPath(baiId));

    if (fireDraft && localDraft) {
      return (fireDraft.savedAt || 0) > (localDraft.savedAt || 0)
        ? fireDraft
        : localDraft;
    }

    return fireDraft || localDraft || null;
  } catch {
    return null;
  }
}

function clearDraftLocal(baiId) {
  localStorage.removeItem(getDraftKey(baiId));
}

async function clearDraftFirebase(baiId) {
  await writeData(getFirebaseDraftPath(baiId), null);
}

/* ===============================
   FIREBASE SERVER TIME
================================ */
async function getServerNow() {
  return Date.now();
}



function formatTsVN(ts) {
  if (!ts) return "--";
  return new Date(ts).toLocaleString("vi-VN");
}

/* ===============================
   HELPERS
================================ */
function removeResultSummary() {
  document.querySelectorAll(".kt-summary").forEach(el => el.remove());
}

function getSafeTNMax(bai) {
  let diemTN = Number(bai?.diemTN ?? 0);
  let diemTL = Number(bai?.diemTL ?? 0);
  const type = bai?.examType || "multiple_choice";

  if (type === "multiple_choice") {
    if (diemTN <= 0) diemTN = 10;
    diemTL = 0;
  }

  if (type === "mixed") {
    if (diemTN === 0 && diemTL === 0) {
      diemTN = 5;
      diemTL = 5;
    }
  }

  return diemTN;
}

function getSafeTLMax(bai) {
  let diemTN = Number(bai?.diemTN ?? 0);
  let diemTL = Number(bai?.diemTL ?? 0);
  const type = bai?.examType || "multiple_choice";

  if (type === "multiple_choice") {
    return 0;
  }

  if (type === "mixed" && diemTN === 0 && diemTL === 0) {
    return 5;
  }

  return diemTL;
}

/* ===============================
   CLEAR UI
================================ */
function clearExamUI(message = "") {
  clearInterval(timerInterval);
  clearInterval(draftSaveInterval);
  clearInterval(examOpenCountdownInterval);

  baiKiemTraDangChon = null;
  dapAnDungMap = {};
  essayAnswers = {};
  currentExamSession = null;
  examType = "multiple_choice";
  timeRemaining = 0;
  daCanhBao5Phut = false;

  removeResultSummary();

  const noiDung = document.getElementById("ktNoiDung");
  const essayWrap = document.getElementById("ktEssayWrap");
  const essayList = document.getElementById("ktEssayList");
  const timerEl = document.getElementById("ktTimer");
  const dungEl = document.getElementById("ktDung");
  const diemEl = document.getElementById("ktDiem");
  const btnSubmit = document.getElementById("btnSubmit");
  const coCauEl = document.getElementById("ktCoCauDiem");

  if (noiDung) {
    noiDung.innerHTML = message
      ? `<div style="padding:16px;border:1px dashed #f59f00;background:#fff8db;border-radius:12px;color:#8a5a00;">
          ${message}
        </div>`
      : "";
  }

  if (essayWrap) essayWrap.style.display = "none";
  if (essayList) essayList.innerHTML = "";
  if (timerEl) {
    timerEl.innerText = "";
    timerEl.style.color = "";
  }
  if (dungEl) dungEl.innerText = "";
  if (diemEl) diemEl.innerText = "";
  if (coCauEl) coCauEl.innerText = "Cơ cấu điểm: --";
  if (btnSubmit) btnSubmit.disabled = true;
}

/* ===============================
   KIỂM TRA MỞ ĐỀ
================================ */

/* ===============================
   INIT
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
    alert("Vui lòng chọn Giáo viên + Lớp + Môn học trước khi vào Kiểm tra");
    return;
  }

  document.getElementById("ktHocVien").innerText = `${student.ho_ten}`;
  document.getElementById("ktGiaoVien").innerText = teacherName;

  const nowTs = await getServerNow(true);
  document.getElementById("ktNgay").innerText =
    new Date(nowTs).toLocaleDateString("vi-VN");

  await loadDanhMuc();
  await loadLopDisplay();
  await loadMonHocDisplay();
  await loadDanhSachBaiKiemTra();

  document.getElementById("selKyThi").addEventListener("change", async () => {
document.getElementById(
  "examStatusCode"
).innerText = "Chưa bóc";

document.getElementById(
  "examStatusName"
).innerText =
  document.getElementById("selKyThi")
  ?.selectedOptions?.[0]?.text || "--";

document.getElementById(
  "btnBocXam"
).style.display = "";

const kyThiId =
  document.getElementById("selKyThi").value;

const draw =
  await readData(
    `users/students/${student.id}/examDraw/${teacherId}_${kyThiId}`
  );

let daNop = false;

if (draw?.baiId) {

  const baiDaLam =
    await readData(
      `users/students/${student.id}/kiemtra/${draw.baiId}`
    );

  daNop = !!baiDaLam;
}

if (daNop) {

  document.getElementById(
    "btnBocXam"
  ).style.display = "none";

  document.getElementById(
    "btnXemLaiBai"
  ).style.display = "";

} else {

  document.getElementById(
    "btnBocXam"
  ).style.display = "";

  document.getElementById(
    "btnXemLaiBai"
  ).style.display = "none";
}

document.getElementById(
  "examStatusCode"
).innerText =
  draw?.maDe || "Chưa bóc";

document.getElementById(
  "examStatusName"
).innerText =
  document.getElementById("selKyThi")
    ?.selectedOptions?.[0]?.text || "--";


    currentSelectedBaiId = null;
    clearExamUI();
    await loadDanhSachBaiKiemTra();
  });



document
  .getElementById("btnBocXam")
  ?.addEventListener("click", bocXamDe);

  document
    .getElementById("btnSubmit")
    .addEventListener("click", () => nopBai(false));

document
  .getElementById("btnXemLaiBai")
  ?.addEventListener(
    "click",
    xemLaiBaiDaNop
  );
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

  const data = await readData(`config/danh_muc/${dm}`);
  if (!data) return;

  Object.entries(data).forEach(([id, item]) => {
    const opt = document.createElement("option");
    opt.value = id;

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
   LOAD DANH SÁCH ĐỀ TRONG NGÂN HÀNG
================================ */
async function loadDanhSachBaiKiemTra() {

  examBank = [];

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

  if (kt.opened === false) return;

  examBank.push({
    id,
    maDe: kt.maDe || kt.tieude || "",
    ...kt
  });
});

  //renderExamBankButtons();
}

  // ==================================================
  // Bóc Xăm
  // ==================================================

async function bocXamDe() {

  console.log("🔥 BOC XAM CLICK");
console.log("examBank FULL =", examBank);
  if (!examBank.length) {
    alert("Không có đề nào được mở");
    return;
  }
  const kyThiId =
    document.getElementById("selKyThi").value;

  const drawPath =
    `users/students/${student.id}/examDraw/${teacherId}_${kyThiId}`;

  // ==================================================
  // ĐÃ XÁC NHẬN BÓC RỒI
  // ==================================================
  const oldDraw = await readData(drawPath);

  if (oldDraw?.confirmed) {

document.getElementById(
  "examStatusCode"
).innerText =
  oldDraw.maDe;

document.getElementById(
  "examStatusName"
).innerText =
  document.getElementById("selKyThi")
  ?.selectedOptions?.[0]?.text || "";

document.getElementById(
  "btnBocXam"
).style.display = "none";

    alert(
      `Bạn đã bóc mã đề ${oldDraw.maDe}`
    );

    currentSelectedBaiId =
      oldDraw.baiId;

    await loadExamById(
      oldDraw.baiId
    );

    return;
  }

showRandomExam(drawPath, oldDraw);
}

  // ==================================================
  // showRandomExam
  // ==================================================

  function showRandomExam(drawPath, oldDraw = null) {

  currentDrawCount =
    Number(oldDraw?.drawCount || 0);

  const randomIndex =
    Math.floor(
      Math.random() * examBank.length
    );

  currentRandomExam =
    examBank[randomIndex];

  const maDe =
    currentRandomExam.maDe ||
    currentRandomExam.tieude ||
    "???";

  const resultBox =
    document.getElementById(
      "randomExamResult"
    );

  const conDuocBoc =
    currentDrawCount < 2;

  resultBox.innerHTML = `
    <div class="draw-box">

      <h3>🎲 Kết quả bốc xăm</h3>

      <div>
        <b>Mã đề:</b>
        ${maDe}
      </div>

      <div style="margin-top:8px;">
        Lần bóc:
        ${currentDrawCount + 1}/3
      </div>

      ${
        !conDuocBoc
        ? `
          <div style="
            color:red;
            margin-top:8px;
          ">
            Đã hết lượt bốc lại
          </div>
        `
        : ""
      }

      <div style="
        margin-top:15px;
        display:flex;
        gap:10px;
        justify-content:center;
      ">

        ${
          conDuocBoc
          ? `
          <button id="btnDrawAgain">
            🔄 Bốc lại
          </button>
          `
          : ""
        }

        <button id="btnAcceptExam">
          ✅ Nhận đề
        </button>

      </div>

    </div>
  `;

  document
    .getElementById("btnAcceptExam")
    ?.addEventListener(
      "click",
      () => acceptExam(drawPath)
    );

  document
    .getElementById("btnDrawAgain")
    ?.addEventListener(
      "click",
      async () => {

        await writeData(
          drawPath,
          {
            drawCount:
              currentDrawCount + 1
          }
        );

        showRandomExam(
          drawPath,
          {
            drawCount:
              currentDrawCount + 1
          }
        );
      }
    );
}

async function acceptExam(drawPath) {

  const maDe =
    currentRandomExam.maDe ||
    currentRandomExam.tieude;

  await writeData(
    drawPath,
    {
      baiId:
        currentRandomExam.id,

      maDe,

      confirmed: true,

      drawCount:
        currentDrawCount + 1,

      createdAt:
        Date.now()
    }
  );

  document.getElementById(
    "randomExamResult"
  ).innerHTML = "";

  document.getElementById(
    "examStatusCode"
  ).innerText = maDe;

  document.getElementById(
    "btnBocXam"
  ).style.display = "none";

  currentSelectedBaiId =
    currentRandomExam.id;

  await loadExamById(
    currentRandomExam.id
  );
}


/* ===============================
   LOAD BÀI THEO ID
================================ */
async function loadExamById(baiId, isAutoRetryOpen = false) {
  if (!baiId) {
    clearExamUI();
    return;
  }

  currentSelectedBaiId = baiId;
  removeResultSummary();
  clearInterval(timerInterval);
  clearInterval(draftSaveInterval);
  clearInterval(examOpenCountdownInterval);

  const baiKiemTra = await readData(`teacher/${teacherId}/kiemtra/${baiId}`);

  if (!baiKiemTra || !baiKiemTra.noidung) {
    alert("Bài kiểm tra chưa có nội dung");
    clearExamUI();
    return;
  }

const examControl =
  await readData(
    `teacher/${teacherId}/exam_control`
  );
if (!examControl?.opened) {
  clearExamUI(
    "⛔ Giáo viên chưa mở đề thi."
  );
  return;
}

  // Gán state trước
  baiKiemTraDangChon = baiKiemTra;
  examType = baiKiemTra.examType || "multiple_choice";
  essayAnswers = {};

  const diemTNMax = getSafeTNMax(baiKiemTra);
  const diemTLMax = getSafeTLMax(baiKiemTra);

  const coCauEl = document.getElementById("ktCoCauDiem");
  if (coCauEl) {
    coCauEl.innerText =
      `Cơ cấu điểm: Trắc nghiệm ${diemTNMax} | Tự luận ${diemTLMax}`;
  }

  hienThiCoCauDiem(baiKiemTra);

  // 🔥 CHECK BÀI ĐÃ LÀM TRƯỚC
  const daLam = await readData(`users/students/${student.id}/kiemtra/${baiId}`);

  // =========================================================
  // 🔥 NẾU ĐÃ NỘP BÀI → CHỈ CHO XEM, KHÔNG TẠO SESSION NỮA
  // =========================================================
  if (daLam) {
    // Xóa rác nếu lỡ còn sót
    await writeData(`users/students/${student.id}/kiemtra_danglam/${baiId}`, null);
    await clearDraftFirebase(baiId);
    clearDraftLocal(baiId);

    const timerEl = document.getElementById("ktTimer");
    if (timerEl) {
      timerEl.innerText = "📄 Đang xem bài đã nộp";
      timerEl.style.color = "#198754";
    }

    renderTracNghiem(
      baiKiemTra.noidung,
      true,
      daLam.traLoi || {},
      false // KHÔNG tick đúng trước
    );

    renderEssaySection(
      baiKiemTra.essays || [],
      true,
      daLam.tuLuan || {}
    );

    document.getElementById("btnSubmit").disabled = true;
    hienKetQua(daLam, dapAnDungMap);
    return;
  }
  
  const kyThiId = document.getElementById("selKyThi").value;
  let thoiGianPhut = 15;

  if (kyThiId) {
    const kyThiData = await readData(`config/danh_muc/kythi/${kyThiId}`);
    if (kyThiData?.thoigian) {
      thoiGianPhut = Number(kyThiData.thoigian);
    }
  }

  // =========================================================
  // 🔥 CHỈ TẠO SESSION KHI CHƯA NỘP BÀI
  // =========================================================
  const now = Date.now();

const session = {
  startedAt: now,
  deadlineAt: now + thoiGianPhut * 60 * 1000
};

currentExamSession = session;
  clearInterval(timerInterval);
  clearInterval(draftSaveInterval);

  const draft = await loadBestDraft(baiId);

  renderTracNghiem(
    baiKiemTra.noidung,
    false,
    draft?.tracNghiem || {},
    false
  );

  renderEssaySection(
  baiKiemTra.essays || [],
  false,
  draft?.essays || {}
);

const btnSubmit =
  document.getElementById("btnSubmit");

btnSubmit.style.display = "inline-block";
btnSubmit.disabled = false;

  const freshNow = await getServerNow(true);
  const remainSeconds = Math.max(
    0,
    Math.floor((session.deadlineAt - freshNow) / 1000)
  );

  startTimerFromRemaining(remainSeconds);

  draftSaveInterval = setInterval(async () => {
    saveDraftToLocal();
    await saveDraftToFirebase();
  }, 5000);
}

/* ===============================
   RENDER ESSAY
================================ */
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
        saveDraftToLocal();
      });

      imgInput?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const compressed = await compressImage(file, 1200, 0.7);

        essayAnswers[so] = {
          ...(essayAnswers[so] || {}),
          image: compressed
        };

        saveDraftToLocal();

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
function renderTracNghiem(html, isDaLam = false, traLoiCu = {}, showCorrectNow = false) {
  const container = document.getElementById("ktNoiDung");
  if (!container) return;

  container.innerHTML = "";
  dapAnDungMap = {};

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const allLines = [];

  function walk(node) {
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const txt = node.textContent?.trim();
      if (txt) allLines.push(txt);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName?.toLowerCase();

    if (["img", "iframe", "audio", "video"].includes(tag)) {
      allLines.push({ html: node.outerHTML });
      return;
    }

    if (tag === "br") {
      allLines.push("\n");
      return;
    }

    Array.from(node.childNodes).forEach(walk);

    if (["p", "div", "li"].includes(tag)) {
      allLines.push("\n");
    }
  }

  walk(tempDiv);

  const normalized = [];
  let buffer = "";

  allLines.forEach(item => {
    if (typeof item === "object" && item.html) {
      if (buffer.trim()) {
        normalized.push(buffer.trim());
        buffer = "";
      }
      normalized.push(item);
      return;
    }

    if (item === "\n") {
      if (buffer.trim()) {
        normalized.push(buffer.trim());
        buffer = "";
      }
      return;
    }

    buffer += " " + item;
  });

  if (buffer.trim()) normalized.push(buffer.trim());

  let cauSo = 0;
  let cauDiv = null;
  let daGapCauHoi = false;

  normalized.forEach(item => {
    if (typeof item === "object" && item.html) {
      if (cauDiv) {
        cauDiv.insertAdjacentHTML("beforeend", item.html);
      } else {
        container.insertAdjacentHTML("beforeend", item.html);
      }
      return;
    }

    const line = String(item || "").trim();
    if (!line) return;

    if (!/^Câu\s*\d+/i.test(line) && !/^[A-D]\./.test(line) && !daGapCauHoi) {
      container.innerHTML += `<p>${line}</p>`;
      return;
    }

    if (/^Câu\s*\d+/i.test(line)) {
      daGapCauHoi = true;
      cauSo++;

      cauDiv = document.createElement("div");
      cauDiv.className = "cau";
      cauDiv.id = `cau${cauSo}`;
      cauDiv.dataset.cau = cauSo;

      cauDiv.innerHTML = `<h4>${line}</h4>`;
      container.appendChild(cauDiv);
      return;
    }

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
      input.addEventListener("change", saveDraftToLocal);

      if (isDaLam) input.disabled = true;

       label.appendChild(input);
      label.appendChild(document.createTextNode(textHienThi));
      cauDiv.appendChild(label);
      return;
    }

    if (cauDiv) {
      cauDiv.innerHTML += `<p>${line}</p>`;
    } else {
      container.innerHTML += `<p>${line}</p>`;
    }
  });
}

/* ===============================
   HIỂN THỊ CƠ CẤU ĐIỂM
================================ */
function hienThiCoCauDiem(baiKiemTra) {
  const el = document.getElementById("ktCoCauDiem");
  if (!el) return;

  const diemTN = getSafeTNMax(baiKiemTra);
  const diemTL = getSafeTLMax(baiKiemTra);

  el.innerHTML = `
    <b>Cơ cấu điểm bài kiểm tra:</b><br>
    Trắc nghiệm: <span style="color:#0d6efd">${diemTN} điểm</span>
    &nbsp;|&nbsp;
    Tự luận: <span style="color:#dc3545">${diemTL} điểm</span>
  `;
}

/* ===============================
   TIMER
================================ */
function startTimerFromRemaining(seconds) {
  clearInterval(timerInterval);

  timeRemaining = seconds;
  daCanhBao5Phut = false;

  updateTimerDisplay();

  timerInterval = setInterval(async () => {
    timeRemaining--;
    updateTimerDisplay();

    if (timeRemaining === 300 && !daCanhBao5Phut) {
      daCanhBao5Phut = true;
      alert("⚠️ Còn 5 phút! Vui lòng kiểm tra lại bài.");
    }

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      alert("⏰ Hết giờ! Hệ thống tự động nộp bài.");
      await nopBai(true);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById("ktTimer");
  if (!el) return;

  const phut = Math.floor(timeRemaining / 60);
  const giay = timeRemaining % 60;

  el.innerText =
    `⏳ Thời gian còn lại: ${phut.toString().padStart(2,"0")}:${giay.toString().padStart(2,"0")}`;

  if (timeRemaining <= 300) {
    el.style.color = "red";
  } else {
    el.style.color = "";
  }
}

/* ===============================
   NỘP BÀI
================================ */
async function nopBai(isAutoSubmit = false) {
  clearInterval(timerInterval);
  clearInterval(draftSaveInterval);
  clearInterval(examOpenCountdownInterval);

  if (!baiKiemTraDangChon) {
    alert("Chưa chọn bài kiểm tra");
    return;
  }

  const baiId = currentSelectedBaiId;
  const nowServer = await getServerNow(true);

  if (!baiId) {
    alert("Không xác định được bài kiểm tra");
    return;
  }

  let dung = 0;
  const tong = Object.keys(dapAnDungMap).length;
  const traLoi = {};

  Object.entries(dapAnDungMap).forEach(([cau, dapAnDung]) => {
    const checked = document.querySelector(`input[name="cau${cau}"]:checked`);

    if (checked) {
      traLoi[cau] = checked.value;
      if (checked.value === dapAnDung) dung++;
    }
  });

  const diemTNMax = getSafeTNMax(baiKiemTraDangChon);
  const diemTLMax = getSafeTLMax(baiKiemTraDangChon);

  let diemTNThucTe = 0;
  if (tong > 0 && diemTNMax > 0) {
    diemTNThucTe = (dung / tong) * diemTNMax;
  }
  diemTNThucTe = Number(diemTNThucTe.toFixed(1));

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

  const laDeTongHop = examType === "mixed";
  const finalScore = laDeTongHop ? null : diemTNThucTe;

  document.getElementById("ktDung").innerText = `${dung}/${tong}`;
  document.getElementById("ktDiem").innerText = diemTNThucTe;

  await writeData(`users/students/${student.id}/kiemtra/${baiId}`, {
    bai: baiId,
    giao_vien: teacherId,
    lop: localStorage.getItem("selectedLop"),
    monhoc: localStorage.getItem("selectedMonHoc"),
    kythi: document.getElementById("selKyThi").value,
    examType,
    dung,
    tong,
    diem: diemTNThucTe,
    diem_tn: diemTNThucTe,
    diem_tl: null,
    diemTNMax,
    diemTLMax,
    traLoi,
    tuLuan,
    essayPending: laDeTongHop,
    essayScore: null,
    finalScore,
    tong_diem: finalScore,
    ngay: new Date(nowServer).toISOString(),
    submittedAt: nowServer
  });

  clearDraftLocal(baiId);
  await clearDraftFirebase(baiId);
  await writeData(`users/students/${student.id}/kiemtra_danglam/${baiId}`, null);

  hienKetQua(
    {
      dung,
      tong,
      diem: diemTNThucTe,
      traLoi
    },
    dapAnDungMap
  );

  if (!isAutoSubmit) {
    alert(
      laDeTongHop
        ? `Đã nộp bài!\nTrắc nghiệm: ${diemTNThucTe}/${diemTNMax} điểm\nTự luận tối đa: ${diemTLMax} điểm\nPhần tự luận chờ giáo viên chấm.`
        : `Hoàn thành!\nĐiểm: ${diemTNThucTe}/${diemTNMax}`
    );
  }
  document.getElementById("btnSubmit").disabled = true;
  disableForm();
}

/* ===============================
   HIỂN THỊ KẾT QUẢ
================================ */
function hienKetQua(duLieuNop, dapAnDung) {
  removeResultSummary();
  document.getElementById("ktDung").innerText =
    `${duLieuNop.dung}/${duLieuNop.tong || Object.keys(dapAnDung).length}`;
  document.getElementById("ktDiem").innerText = duLieuNop.diem;
  const traLoi = duLieuNop.traLoi || {};
  let cauSaiList = [];
  let firstSaiElement = null;

  Object.keys(dapAnDung).forEach((soCau) => {
    const dapAn = dapAnDung[soCau];
    const dapAnChon = traLoi[soCau];
    const cauDiv = document.getElementById(`cau${soCau}`);
    if (!cauDiv) return;

    const radios = document.querySelectorAll(`input[name="cau${soCau}"]`);

    radios.forEach(radio => {
      radio.disabled = true;

      if (radio.value === dapAnChon) {
        radio.checked = true;
      }

      const label = radio.closest("label");
      if (!label) return;

      label.querySelectorAll(".answer-icon").forEach(el => el.remove());
      label.classList.remove("dung", "sai");

      if (radio.value === dapAn) {
        label.classList.add("dung");

        const icon = document.createElement("span");
        icon.className = "answer-icon icon-dung";
        icon.innerText = "✔";
        label.appendChild(icon);
      }

      if (dapAnChon && dapAnChon !== dapAn && radio.value === dapAnChon) {
        label.classList.add("sai");

        const icon = document.createElement("span");
        icon.className = "answer-icon icon-sai";
        icon.innerText = "✖";
        label.appendChild(icon);
      }
    });

    cauDiv.classList.remove("dung-cau", "sai-cau");

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

  if (cauSaiList.length > 0) {
    const summary = document.createElement("div");
    summary.className = "kt-summary";
    summary.innerHTML = `❌ Bạn sai câu: ${cauSaiList.join(", ")}`;

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
   COMPRESS ẢNH
================================ */
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
   DISABLE FORM
================================ */
function disableForm() {
  document
    .querySelectorAll("#ktNoiDung input, #ktNoiDung textarea, #ktEssayWrap input, #ktEssayWrap textarea, #btnSubmit")
    .forEach(el => el.disabled = true);
}

/* ===============================
   AUTO SAVE TRƯỚC KHI THOÁT
================================ */
window.addEventListener("beforeunload", () => {
  saveDraftToLocal();
});

/* ===============================
   XEM LẠI BÀI ĐÃ NỘP
================================ */
async function xemLaiBaiDaNop() {

  const kyThiId =
    document.getElementById("selKyThi").value;

  if (!kyThiId) {
    alert("Chọn kỳ thi trước");
    return;
  }

  const draw =
    await readData(
      `users/students/${student.id}/examDraw/${teacherId}_${kyThiId}`
    );
  if (!draw?.baiId) {
    document.getElementById(
      "examStatusCode"
    ).innerText = "Chưa bóc";
    alert("Bạn chưa bóc xăm đề");
    return;
  }

  document.getElementById(
    "examStatusCode"
  ).innerText =
    draw.maDe || "--";

  document.getElementById(
    "examStatusName"
  ).innerText =
    document.getElementById("selKyThi")
      ?.selectedOptions?.[0]?.text || "--";

  await loadExamById(
    draw.baiId
  );
}