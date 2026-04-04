import { readData, writeData } from "../../../scripts/services/firebaseService.js";

let student;
let teacherId;
let dapAnDungMap = {};
let deDangChon = null;
let thoiGian = 30 * 60; // 30 phút
let timerInterval;
let tongSoCau = 0;
let flaggedQuestions = new Set();
let reviewWrongSet = new Set();
let isSubmitted = false;

/* ===================== INIT ===================== */
export async function init() {
  student = JSON.parse(localStorage.getItem("studentLogin") || "null");
  teacherId = localStorage.getItem("selectedTeacher");

  console.log("TeacherId:", teacherId);

  if (!student || !teacherId) {
    alert("Thiếu thông tin học viên / giáo viên");
    return;
  }

  document.getElementById("testId").innerText = student.id || "";
  document.getElementById("testName").innerText = student.ho_ten || "";

  await loadDanhSachDe();

  document.getElementById("btnSubmitTest")
    .addEventListener("click", moModalNopBai);

  document.getElementById("btnScrollTop")
    ?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

  document.getElementById("btnScrollBottom")
    ?.addEventListener("click", () => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    });

  document.getElementById("btnCloseModal")
    ?.addEventListener("click", dongModalNopBai);

  document.getElementById("btnCancelSubmit")
    ?.addEventListener("click", dongModalNopBai);

  document.getElementById("btnConfirmSubmit")
    ?.addEventListener("click", nopBai);

  document.getElementById("submitModal")
    ?.addEventListener("click", (e) => {
      if (e.target.id === "submitModal") dongModalNopBai();
    });

  initToolbarFilter();
}

/* ===================== LOAD DANH SÁCH ĐỀ ===================== */
async function loadDanhSachDe() {
  const grid = document.getElementById("testGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const selectedTeacher = localStorage.getItem("selectedTeacher");
  const selectedLop = localStorage.getItem("selectedLop");

  if (!selectedTeacher || !selectedLop) {
    console.warn("Chưa chọn giáo viên hoặc lớp");
    grid.innerHTML = "<p>Chưa chọn giáo viên hoặc lớp</p>";
    return;
  }

  const data = await readData(`teacher/${selectedTeacher}/test`);

  if (!data) {
    grid.innerHTML = "<p>Chưa có đề nào</p>";
    return;
  }

  const daLam = await readData(`users/students/${student.id}/test`) || {};
  let count = 0;

  Object.entries(data).forEach(([id, item]) => {
    if (item.lop !== selectedLop) return;

    count++;

    const btn = document.createElement("button");
    btn.innerText = item.made || "??";
    btn.className = "test-btn";

    if (!item.noidung) btn.disabled = true;
    if (daLam[id]) btn.classList.add("da-lam");

    btn.onclick = () => {
      document.querySelectorAll(".test-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadDe(id, item.noidung, daLam[id] || null);
    };

    grid.appendChild(btn);
  });

  if (count === 0) {
    grid.innerHTML = "<p>Không có đề kiểm tra cho lớp này</p>";
  }
}

/* ===================== LOAD ĐỀ ===================== */
function loadDe(id, html, duLieuDaLam = null) {
  deDangChon = id;
  clearInterval(timerInterval);
  thoiGian = 30 * 60;
  tongSoCau = 0;
  flaggedQuestions = new Set();
  reviewWrongSet = new Set();
  isSubmitted = !!duLieuDaLam;

  document.getElementById("testSummaryWrap").innerHTML = "";
  document.getElementById("testDung").innerText = "0";
  document.getElementById("testDiem").innerText = "0";
  document.getElementById("testProgress").innerText = "0/0";
  document.getElementById("testProgressPercent").innerText = "0%";
  document.getElementById("testProgressBar").style.width = "0%";

  renderTracNghiem(
    html,
    !!duLieuDaLam,
    duLieuDaLam?.traLoi || {}
  );

  setTimeout(() => {
    buildQuestionNavigator();
    updateProgress();
    observeCurrentQuestion();
    document.getElementById("testToolbar").style.display = "flex";
  }, 100);

  const intro = document.getElementById("testIntroBox");
  if (intro) intro.style.display = "none";

  if (duLieuDaLam) {
    const time = new Date(duLieuDaLam.ngay).toLocaleTimeString("vi-VN");
    document.getElementById("testTimer").innerText = "Nộp lúc " + time;

    setTimeout(() => {
      hienKetQuaTest(duLieuDaLam);
    }, 100);

    document.getElementById("btnSubmitTest").disabled = true;
    document.getElementById("btnSubmitTest").innerText = "Đã nộp bài";
  } else {
    document.getElementById("btnSubmitTest").disabled = false;
    document.getElementById("btnSubmitTest").innerText = "Nộp bài";
    startTimer();
  }
}

/* ===================== RENDER ===================== */
function renderTracNghiem(html, isDaLam = false, traLoiCu = {}) {
  const container = document.getElementById("testNoiDung");
  container.innerHTML = "";
  dapAnDungMap = {};
  tongSoCau = 0;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const paragraphs = tempDiv.querySelectorAll("div, p, br");
  let cauSo = 0;
  let cauDiv = null;
  let daGapCauHoi = false;

  paragraphs.forEach(p => {
    const line = p.innerText?.trim();
    if (!line) return;

    if (!/^Câu\s*\d+/i.test(line) && !daGapCauHoi) {
      const introLine = document.createElement("p");
      introLine.className = "toeic-intro-line";
      introLine.innerText = line;
      container.appendChild(introLine);
      return;
    }

    if (/^Câu\s*\d+/i.test(line)) {
      daGapCauHoi = true;
      cauSo++;
      tongSoCau = cauSo;

      cauDiv = document.createElement("div");
      cauDiv.className = "toeic-question-card";
      cauDiv.id = `cau${cauSo}`;
      cauDiv.dataset.cau = cauSo;
      cauDiv.dataset.flagged = "false";
      cauDiv.dataset.wrong = "false";

      cauDiv.innerHTML = `
        <div class="question-top">
          <span class="question-badge">Question ${cauSo}</span>
          <button class="flag-btn" data-cau="${cauSo}" title="Đánh dấu câu này">🚩</button>
        </div>
        <div class="question-text"><b>${line}</b></div>
        <div class="question-options" id="options-${cauSo}"></div>
      `;
      container.appendChild(cauDiv);
      return;
    }

    if (/^[A-D]\./.test(line) && cauDiv) {
      const dapAn = line[0];
      const isDung = line.includes("*");

      if (isDung) dapAnDungMap[cauSo] = dapAn;

      const text = line.replace("*", "").trim();
      const optionWrap = cauDiv.querySelector(`#options-${cauSo}`);

      const label = document.createElement("label");
      label.className = "toeic-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `cau${cauSo}`;
      input.value = dapAn;

      if (isDaLam) input.disabled = true;

      if (traLoiCu[cauSo] === dapAn) {
        input.checked = true;
        label.classList.add("selected");
      }

      input.addEventListener("change", () => {
        document.querySelectorAll(`input[name="cau${cauSo}"]`).forEach(i => {
          i.closest(".toeic-option")?.classList.remove("selected");
        });

        if (input.checked) {
          label.classList.add("selected");
        }

        updateProgress();
        updateNavigatorState(cauSo);
      });

      const optionLetter = document.createElement("span");
      optionLetter.className = "option-letter";
      optionLetter.innerText = dapAn;

      const optionText = document.createElement("span");
      optionText.className = "option-text";
      optionText.innerText = text;

      label.appendChild(input);
      label.appendChild(optionLetter);
      label.appendChild(optionText);

      optionWrap.appendChild(label);
    }
  });

  bindFlagButtons();
}

/* ===================== FLAG ===================== */
function bindFlagButtons() {
  document.querySelectorAll(".flag-btn").forEach(btn => {
    btn.onclick = () => {
      if (isSubmitted) return;

      const cau = Number(btn.dataset.cau);
      const card = document.getElementById(`cau${cau}`);
      const navBtn = document.querySelector(`.q-nav-btn[data-cau="${cau}"]`);

      if (flaggedQuestions.has(cau)) {
        flaggedQuestions.delete(cau);
        btn.classList.remove("active");
        card?.classList.remove("flagged-card");
        card.dataset.flagged = "false";
        navBtn?.classList.remove("flagged");
      } else {
        flaggedQuestions.add(cau);
        btn.classList.add("active");
        card?.classList.add("flagged-card");
        card.dataset.flagged = "true";
        navBtn?.classList.add("flagged");
      }
    };
  });
}

/* ===================== QUESTION NAV ===================== */
function buildQuestionNavigator() {
  const nav = document.getElementById("questionNav");
  if (!nav) return;

  nav.innerHTML = "";

  if (!tongSoCau) {
    nav.innerHTML = `<div class="nav-empty">Không có câu hỏi</div>`;
    return;
  }

  for (let i = 1; i <= tongSoCau; i++) {
    const btn = document.createElement("button");
    btn.className = "q-nav-btn unanswered";
    btn.innerText = i;
    btn.dataset.cau = i;

    btn.onclick = () => {
      document.getElementById(`cau${i}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    };

    nav.appendChild(btn);
    updateNavigatorState(i);
  }
}

function updateNavigatorState(cauSo) {
  const btn = document.querySelector(`.q-nav-btn[data-cau="${cauSo}"]`);
  if (!btn) return;

  const checked = document.querySelector(`input[name="cau${cauSo}"]:checked`);
  btn.classList.remove("answered", "unanswered");

  if (checked) {
    btn.classList.add("answered");
  } else {
    btn.classList.add("unanswered");
  }

  if (flaggedQuestions.has(Number(cauSo))) {
    btn.classList.add("flagged");
  }
}

function observeCurrentQuestion() {
  const cards = document.querySelectorAll(".toeic-question-card");
  const navBtns = document.querySelectorAll(".q-nav-btn");

  if (!cards.length || !navBtns.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id?.replace("cau", "");
      const btn = document.querySelector(`.q-nav-btn[data-cau="${id}"]`);
      if (!btn) return;

      if (entry.isIntersecting) {
        navBtns.forEach(b => b.classList.remove("current"));
        btn.classList.add("current");
      }
    });
  }, {
    threshold: 0.45
  });

  cards.forEach(card => observer.observe(card));
}

/* ===================== PROGRESS ===================== */
function updateProgress() {
  let answered = 0;

  for (let i = 1; i <= tongSoCau; i++) {
    const checked = document.querySelector(`input[name="cau${i}"]:checked`);
    if (checked) answered++;
  }

  const percent = tongSoCau ? Math.round((answered / tongSoCau) * 100) : 0;

  document.getElementById("testProgress").innerText = `${answered}/${tongSoCau}`;
  document.getElementById("testProgressPercent").innerText = `${percent}%`;
  document.getElementById("testProgressBar").style.width = `${percent}%`;
}

/* ===================== FILTER ===================== */
function initToolbarFilter() {
  document.querySelectorAll(".toolbar-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".toolbar-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      applyQuestionFilter(filter);
    });
  });
}

function applyQuestionFilter(filter) {
  const cards = document.querySelectorAll(".toeic-question-card");

  cards.forEach(card => {
    const cau = Number(card.dataset.cau);
    const checked = document.querySelector(`input[name="cau${cau}"]:checked`);
    const isFlagged = flaggedQuestions.has(cau);
    const isWrong = reviewWrongSet.has(cau);

    let show = true;

    if (filter === "answered") show = !!checked;
    if (filter === "unanswered") show = !checked;
    if (filter === "flagged") show = isFlagged;
    if (filter === "wrong") show = isWrong;
    if (filter === "all") show = true;

    card.style.display = show ? "block" : "none";
  });
}

/* ===================== MODAL ===================== */
function moModalNopBai() {
  if (!deDangChon) {
    alert("Chưa chọn đề");
    return;
  }

  let answered = 0;
  for (let i = 1; i <= tongSoCau; i++) {
    const checked = document.querySelector(`input[name="cau${i}"]:checked`);
    if (checked) answered++;
  }

  const unanswered = tongSoCau - answered;

  document.getElementById("modalTong").innerText = tongSoCau;
  document.getElementById("modalDaLam").innerText = answered;
  document.getElementById("modalChuaLam").innerText = unanswered;
  document.getElementById("modalFlagged").innerText = flaggedQuestions.size;

  document.getElementById("submitModal").classList.add("show");
}

function dongModalNopBai() {
  document.getElementById("submitModal").classList.remove("show");
}

/* ===================== NỘP BÀI ===================== */
async function nopBai() {
  dongModalNopBai();
  clearInterval(timerInterval);

  if (!deDangChon) {
    alert("Chưa chọn đề");
    return;
  }

  let dung = 0;
  const tong = Object.keys(dapAnDungMap).length;
  const traLoi = {};

  Object.entries(dapAnDungMap).forEach(([cau, dapAn]) => {
    const checked = document.querySelector(`input[name="cau${cau}"]:checked`);

    if (checked) {
      traLoi[cau] = checked.value;
      if (checked.value === dapAn) dung++;
    }
  });

  const diem = Math.round((dung / tong) * 10);

  document.getElementById("testDung").innerText = `${dung}/${tong}`;
  document.getElementById("testDiem").innerText = diem;

  await writeData(`users/students/${student.id}/test/${deDangChon}`, {
    giao_vien: teacherId,
    made: deDangChon,
    dung,
    tong,
    diem,
    traLoi,
    ngay: new Date().toISOString()
  });

  isSubmitted = true;

  hienKetQuaTest({
    dung,
    tong,
    diem,
    traLoi,
    ngay: new Date().toISOString()
  });

  document.getElementById("btnSubmitTest").disabled = true;
  document.getElementById("btnSubmitTest").innerText = "Đã nộp bài";

  alert("Hoàn thành bài test!");
}

/* ===================== KẾT QUẢ ===================== */
function hienKetQuaTest(data) {
  document.getElementById("testDung").innerText = `${data.dung}/${data.tong}`;
  document.getElementById("testDiem").innerText = data.diem;

  const traLoi = data.traLoi || {};
  let cauSaiList = [];
  let firstSai = null;
  reviewWrongSet = new Set();

  Object.keys(dapAnDungMap).forEach(cau => {
    const dapAn = dapAnDungMap[cau];
    const chon = traLoi[cau];

    const cauDiv = document.getElementById(`cau${cau}`);
    const radios = document.querySelectorAll(`input[name="cau${cau}"]`);

    radios.forEach(radio => {
      radio.disabled = true;

      const label = radio.closest(".toeic-option");
      if (!label) return;

      if (radio.value === dapAn) {
        label.classList.add("dung");
        if (!label.querySelector(".answer-icon")) {
          label.innerHTML += `<span class="answer-icon icon-dung">✔</span>`;
        }
      }

      if (chon && chon !== dapAn && radio.value === chon) {
        label.classList.add("sai");
        if (!label.querySelector(".answer-icon")) {
          label.innerHTML += `<span class="answer-icon icon-sai">✖</span>`;
        }
      }

      if (radio.value === chon) {
        radio.checked = true;
      }
    });

    const navBtn = document.querySelector(`.q-nav-btn[data-cau="${cau}"]`);

    if (chon !== dapAn) {
      const cauNum = Number(cau);
      cauSaiList.push(cau);
      reviewWrongSet.add(cauNum);
      navBtn?.classList.add("wrong");
      cauDiv.dataset.wrong = "true";

      if (!firstSai) firstSai = cauDiv;
    }
  });

  renderSummaryResult(data, cauSaiList);

  if (cauSaiList.length > 0 && firstSai) {
    setTimeout(() => {
      firstSai.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 500);
  }
}

function renderSummaryResult(data, cauSaiList) {
  const wrap = document.getElementById("testSummaryWrap");
  if (!wrap) return;

  const unanswered = data.tong - Object.keys(data.traLoi || {}).length;

  wrap.innerHTML = `
    <div class="toeic-result-box">
      <div class="result-header">
        <h3>Exam Result Summary</h3>
        <span class="result-score">Score: ${data.diem}/10</span>
      </div>

      <div class="result-grid">
        <div class="result-item">
          <span>Correct</span>
          <b>${data.dung}/${data.tong}</b>
        </div>
        <div class="result-item">
          <span>Wrong</span>
          <b>${cauSaiList.length}</b>
        </div>
        <div class="result-item">
          <span>Blank</span>
          <b>${unanswered}</b>
        </div>
        <div class="result-item">
          <span>Accuracy</span>
          <b>${Math.round((data.dung / data.tong) * 100)}%</b>
        </div>
      </div>

      ${
        cauSaiList.length
          ? `<div class="wrong-list">❌ Câu sai: ${cauSaiList.join(", ")}</div>`
          : `<div class="all-correct">🎉 Xuất sắc! Bạn làm đúng toàn bộ câu hỏi.</div>`
      }
    </div>
  `;
}

/* ===================== TIMER ===================== */
function startTimer() {
  clearInterval(timerInterval);

  const el = document.getElementById("testTimer");

  timerInterval = setInterval(() => {
    const minutes = Math.floor(thoiGian / 60);
    const seconds = thoiGian % 60;

    el.innerText = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

    el.classList.remove("warning", "danger");
    if (thoiGian <= 300) el.classList.add("warning");
    if (thoiGian <= 60) el.classList.add("danger");

    thoiGian--;

    if (thoiGian < 0) {
      clearInterval(timerInterval);
      nopBai();
    }
  }, 1000);
}