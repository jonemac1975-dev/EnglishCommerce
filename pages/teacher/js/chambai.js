import { readData, writeData,  updateData } from "../../../scripts/services/firebaseService.js";


/* ================= CONST ================= */
const teacherId = localStorage.getItem("teacher_id");
if (!teacherId) location.href = "../../index.html";

let hocVienMap = {};
let currentBaiId = "";
let currentStudentId = "";
let currentBaiNop = null;
let currentDeThi = null;
let deThiMap = {};

/* ================= INIT ================= */
export async function init() {

  await loadDanhMuc();
  await loadHocVienMap();
  await loadDeThiMap();

  document.getElementById("cb_kythi")
  ?.addEventListener("change", async () => {
    resetCham();
    await loadDanhSachNopBai();
  });

  document.getElementById("cb_lop")
  ?.addEventListener("change", async () => {
    resetCham();
    await loadDanhSachNopBai();
  });

  document.getElementById("cb_monhoc")
  ?.addEventListener("change", async () => {
    resetCham();
    await loadDanhSachNopBai();
  });

  document.getElementById("cb_save")
  ?.addEventListener("click", saveChamBai);
}

/* ================= DANH MỤC ================= */
async function loadDanhMuc() {
  await loadSelect("kythi", "cb_kythi");
  await loadSelect("lop", "cb_lop");
  await loadSelect("monhoc", "cb_monhoc");
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
    opt.textContent = item.name || id;
    sel.appendChild(opt);
  });
}

/* ================= LOAD HỌC VIÊN ================= */
async function loadHocVienMap() {
  const data = await readData("users/students");
  if (!data) return;

  Object.entries(data).forEach(([id, item]) => {
    hocVienMap[id] = item?.profile?.ho_ten || item?.ho_ten || id;
  });
}

/* ================= LOAD DS BÀI KIỂM TRA ================= */
async function loadDanhSachBaiKT() {
  const sel = document.getElementById("cb_baikt");
  if (!sel) return;

  sel.innerHTML = `<option value="">-- Chọn bài kiểm tra --</option>`;

  const data = await readData(`teacher/${teacherId}/kiemtra`);
  if (!data) return;

  const lop = document.getElementById("cb_lop")?.value || "";
  const kythi = document.getElementById("cb_kythi")?.value || "";
  const monhoc = document.getElementById("cb_monhoc")?.value || "";

  Object.entries(data).forEach(([id, item]) => {
    if (lop && item.lop !== lop) return;
    if (kythi && item.kythi !== kythi) return;
    if (monhoc && (item.monhoc || "") !== monhoc) return;

    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = item.maDe || id;
    sel.appendChild(opt);
  });

  // reset chọn bài khi filter thay đổi
  sel.value = "";
  document.getElementById("cb_list").innerHTML = "";
}

/* ================= LOAD DANH SÁCH NỘP ================= */
async function loadDanhSachNopBai() {

let tongBai = 0;
let daCham = 0;
let chuaCham = 0;

const scoreCount =
  Array(11).fill(0);

  const tbody =
    document.getElementById("cb_list");

  if (!tbody) return;

  tbody.innerHTML = "";

  const kyThi =
    document.getElementById("cb_kythi")?.value || "";

  const lop =
    document.getElementById("cb_lop")?.value || "";

  const monHoc =
    document.getElementById("cb_monhoc")?.value || "";

  if (!kyThi || !lop || !monHoc) {
    return;
  }

  const students =
    await readData("users/students");

  if (!students) return;

  let stt = 1;

  Object.entries(students).forEach(
    ([studentId, studentData]) => {

      const dsBai =
        studentData?.kiemtra || {};

      Object.entries(dsBai).forEach(
        ([baiId, baiNop]) => {

          if (!baiNop) return;

          if (baiNop.kythi !== kyThi)
            return;

          if (baiNop.lop !== lop)
            return;

          if (baiNop.monhoc !== monHoc)
            return;

          const diemTN =
            Number(
              baiNop.diem_tn ??
              baiNop.diem ??
              0
            );

          const diemTL =
            Number(
              baiNop.diem_tl || 0
            );

          const tongDiem =
            Number(
              baiNop.tong_diem ??
              (diemTN + diemTL)
            );

// ===== THỐNG KÊ =====

tongBai++;

if (baiNop.essayPending)
  chuaCham++;
else
  daCham++;

const diemLamTron =
  Math.round(tongDiem);

if (
  diemLamTron >= 0 &&
  diemLamTron <= 10
) {
  scoreCount[diemLamTron]++;
}

          const chamCount =
  Number(
    baiNop.chamCount || 0
  );

const daChamHtml =
  baiNop.essayPending
    ? `
      <span
        style="
          color:#d60000;
          font-weight:900;
        ">
        🚨 Chưa chấm
      </span>
    `
    : `
      <span
        style="
          color:#0a8f3d;
          font-weight:800;
        ">
        ✅ Đã chấm (${chamCount})
      </span>
    `;

const deThi =
  deThiMap[baiId] || {};

const maDe =
  deThi.maDe || "--";

const loaiDeMap = {
  mcq: "Trắc nghiệm",
  essay: "Tự luận",
  mixed: "Tổng hợp"
};

const tenLoaiDe =
  loaiDeMap[
    deThi.examType
  ] ||
  deThi.examType ||
  "--";

          const tr =
            document.createElement("tr");

          tr.innerHTML = `
            <td>${stt++}</td>

            <td>
              ${hocVienMap[studentId] || studentId}
            </td>

            <td>
              ${maDe}
            </td>

            <td>
                ${tenLoaiDe}
            </td>

            <td>${diemTN}</td>

            <td>${diemTL}</td>

            <td>${tongDiem}</td>

            <td>${daChamHtml}</td>

            <td>
              <button
                onclick="
                  window.chamBaiHocVien(
                    '${studentId}',
                    '${baiId}'
                  )
                ">
                Chấm bài
              </button>
            </td>
          `;

          tbody.appendChild(tr);

        }
      );

    }
  );

  if (tbody.innerHTML.trim() === "") {

    tbody.innerHTML = `
      <tr>
        <td colspan="9"
            style="
              text-align:center;
              color:#777;
              padding:16px;
            ">
          Chưa có học viên nào nộp bài
        </td>
      </tr>
    `;
  }

// ======================
// THỐNG KÊ CHẤM BÀI
// ======================

const thongKeDiv =
  document.getElementById(
    "cbThongKe"
  );

if (thongKeDiv) {

  let scoreRow = "";
  let countRow = "";
  let percentRow = "";

  for (let i = 0; i <= 10; i++) {

    scoreRow += `
      <td><b>${i}</b></td>
    `;

    countRow += `
      <td>${scoreCount[i]}</td>
    `;

    const pt =
      tongBai
        ? (
            scoreCount[i]
            * 100
            / tongBai
          ).toFixed(1)
        : 0;

    percentRow += `
      <td>${pt}%</td>
    `;
  }

  thongKeDiv.innerHTML = `

    <div
      style="
        background:#fff;
        border:1px solid #ddd;
        padding:15px;
        border-radius:10px;
        margin-bottom:15px;
      "
    >

      <div
        style="
          font-size:18px;
          font-weight:bold;
          margin-bottom:12px;
        "
      >
        📊 THỐNG KÊ CHẤM BÀI
      </div>

      <div
        style="
          margin-bottom:15px;
          font-size:15px;
        "
      >
        <b>Tổng số bài:</b>
        ${tongBai}

        &nbsp;&nbsp;|&nbsp;&nbsp;

        <span style="color:#0a8f3d">
          <b>Đã chấm:</b>
          ${daCham}
        </span>

        &nbsp;&nbsp;|&nbsp;&nbsp;

        <span style="color:#d60000">
          <b>Còn lại:</b>
          ${chuaCham}
        </span>
      </div>

      <table
        style="
          width:100%;
          border-collapse:collapse;
          text-align:center;
        "
      >

        <tr>
          <td><b>Điểm tổng</b></td>
          ${scoreRow}
        </tr>

        <tr>
          <td><b>Số bài thi</b></td>
          ${countRow}
        </tr>

        <tr>
          <td><b>Tỷ lệ %</b></td>
          ${percentRow}
        </tr>

      </table>

    </div>

  `;
}

}

/* ================= Map Mã đề + loại đề thi ================= */
async function loadDeThiMap() {

  const data =
    await readData(
      `teacher/${teacherId}/kiemtra`
    );

  deThiMap = data || {};

}


/* ================= MỞ BÀI CẦN CHẤM ================= */
window.chamBaiHocVien = async function(
  studentId,
  baiId
) {

  currentStudentId = studentId;
  currentBaiId = baiId;

  const baiNop =
    await readData(
      `users/students/${studentId}/kiemtra/${baiId}`
    );

  if (!baiNop) {
    alert("Không tìm thấy bài nộp");
    return;
  }

  currentBaiNop = baiNop;

  currentDeThi =
    await readData(
      `teacher/${teacherId}/kiemtra/${baiId}`
    );

// ===== LOAD CHỮ KÝ GIÁO VIÊN =====

const profile =
  await readData(
    `users/teachers/${teacherId}/profile`
  );

const signImg =
  document.getElementById(
    "cbTeacherSignature"
  );

const signName =
  document.getElementById(
    "cbTeacherName"
  );

if (
  profile?.chu_ky &&
  signImg
) {
  signImg.src =
    profile.chu_ky;

  signImg.style.display =
    "block";
}
else if (signImg) {
  signImg.style.display =
    "none";
}

if (signName) {
  signName.innerText =
    profile?.ho_ten || "";
}

  const draw =
    await readData(
      `users/students/${studentId}/examDraw/${teacherId}_${baiNop.kythi}`
    );

  document.getElementById(
    "cb_detail"
  ).style.display = "block";

  document.getElementById(
    "cb_hocvien"
  ).innerText =
    hocVienMap[studentId] || studentId;

  const loaiDeMap = {
  mcq: "Trắc nghiệm",
  essay: "Tự luận",
  mixed: "Trắc nghiệm + Tự luận"
};

document.getElementById(
  "cb_tenbai"
).innerText =
  loaiDeMap[currentDeThi?.examType] ||
  currentDeThi?.examType ||
  "--";

  document.getElementById(
    "cb_made"
  ).innerText =
    draw?.maDe ||
    currentDeThi?.maDe ||
    "--";

  document.getElementById(
    "cb_diem_tn"
  ).innerText =
    baiNop.diem_tn ??
    baiNop.diem ??
    0;

  document.getElementById(
    "cb_cocau"
  ).innerText =
    `TN ${baiNop.diemTNMax || 0} | TL ${baiNop.diemTLMax || 0}`;

  document.getElementById(
    "cb_diem_tl_max"
  ).innerText =
    baiNop.diemTLMax || 0;

  document.getElementById(
    "cb_tongdiem"
  ).innerText =
    baiNop.tong_diem ??
    (
      Number(baiNop.diem_tn || baiNop.diem || 0) +
      Number(baiNop.diem_tl || 0)
    );

  renderNoiDungDeThi();

  renderTuLuanCham(
    baiNop.tuLuan || {}
  );

  document
    .getElementById("cb_detail")
    ?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

};

/* ================= RENDER NỘI DUNG ĐỀ THI ================= */
function renderNoiDungDeThi() {
  const container = document.getElementById("cb_noidung_de");
  if (!container) return;

  const noidung = currentDeThi?.noidung || "";

  if (!noidung.trim()) {
    container.innerHTML = `<i>Đề này chưa có nội dung trắc nghiệm.</i>`;
    return;
  }

  container.innerHTML = `
    <div style="background:#f8f9fa; padding:16px; border-radius:10px; border:1px solid #ddd;">
      ${noidung}
    </div>
  `;
}

/* ================= RENDER TỰ LUẬN ================= */
function renderTuLuanCham(tuLuanData) {
  const container = document.getElementById("cb_essay_container");
  if (!container) return;

  container.innerHTML = "";

  const essayHtmlList = currentDeThi?.essays || [];
  const daCham = currentBaiNop?.tuLuanCham || {};

  const soCauDe = essayHtmlList.length;
  const soCauBaiLam = Object.keys(tuLuanData || {}).length;
  const tongSoCau = Math.max(soCauDe, soCauBaiLam);

  if (tongSoCau === 0) {
    container.innerHTML = `<p><i>Bài này không có phần tự luận.</i></p>`;
    return;
  }

  for (let so = 1; so <= tongSoCau; so++) {
    const deHtml = essayHtmlList[so - 1] || `<i>Không có nội dung đề tự luận ${so}</i>`;
    const baiLam = tuLuanData?.[so] || {};
    const diemCu = daCham?.[so]?.diem ?? "";
    const nhanXetCu = daCham?.[so]?.nhanXet ?? "";

    const box = document.createElement("div");
    box.className = "cb-essay-box";
    box.style.border = "1px solid #ddd";
    box.style.borderRadius = "10px";
    box.style.padding = "16px";
    box.style.marginBottom = "20px";
    box.style.background = "#fff";

    box.innerHTML = `
      <h4 style="margin-bottom:12px;">Câu ${so}</h4>

      <div style="margin-bottom:12px;">
        <div style="padding:12px; background:#f8f9fa; border-radius:8px; margin-top:8px;">
          ${deHtml}
        </div>
      </div>

      <div style="margin-bottom:12px;">
        <b>Bài làm</b>
        <div class="cb-bailam" style="padding:12px; background:#fcfcfc; border-radius:8px; margin-top:8px;">
          ${renderBaiLamTuLuan(baiLam)}
        </div>
      </div>

      <div style="display:grid; gap:12px;">
        <div>
          <label><b>Điểm câu ${so}</b></label>
          <input type="number"
                 class="cb_diem_cau"
                 data-cau="${so}"
                 min="0"
                 max="${currentDeThi?.diemTL ?? 10}"
                 step="0.25"
                 value="${diemCu}"
                 style="width:60px; margin-left:8px;">
        </div>

        <div>
          <label><b>Nhận xét</b></label>
          <textarea class="cb_nhanxet_cau"
                    data-cau="${so}"
                    rows="3"
                    style="width:100%; margin-top:8px;">${nhanXetCu}</textarea>
        </div>
      </div>
    `;

    container.appendChild(box);
  }

  const tongCu = currentBaiNop?.diem_tl ?? "";
  const tongWrap = document.createElement("div");

tongWrap.style.marginTop = "20px";
tongWrap.style.padding = "16px";
tongWrap.style.background = "#fff8e1";
tongWrap.style.borderRadius = "10px";

tongWrap.innerHTML = `
  <h3>
    Tổng điểm tự luận:
    <span id="cb_auto_tl">
      ${currentBaiNop?.diem_tl || 0}
    </span>
  </h3>

  <p style="margin-top:8px; color:#666;">
    👉 Tổng điểm tự luận được cộng tự động từ các câu bên trên.
  </p>
`;

setTimeout(() => {

  document
    .querySelectorAll(".cb_diem_cau")
    .forEach(input => {

      input.addEventListener("input", () => {

        let tong = 0;

        document
          .querySelectorAll(".cb_diem_cau")
          .forEach(i => {
            tong += Number(i.value || 0);
          });

        document.getElementById(
          "cb_auto_tl"
        ).innerText =
          tong.toFixed(2);

      });

    });

}, 50);
  container.appendChild(tongWrap);
}

function renderBaiLamTuLuan(baiLam) {
  let html = "";

  if (baiLam?.text) {
    html += `
      <div style="margin-bottom:12px;">
        <b>📝 Sinh viên làm trực tiếp trên máy tính</b>
        <div style="white-space:pre-wrap; margin-top:6px;">${escapeHtml(baiLam.text)}</div>
      </div>
    `;
  }

  if (baiLam?.image) {
    html += `
      <div>
        <b>📷 Bài làm nộp bằng ảnh chụp</b><br>
        <img src="${baiLam.image}" style="max-width:100%; margin-top:8px; border-radius:8px; border:1px solid #ddd;">
      </div>
    `;
  }

  if (!html) {
    html = `<i>Sinh viên chưa làm phần này</i>`;
  }

  return html;
}

/* ================= SAVE CHẤM ================= */
async function saveChamBai() {
  if (!currentStudentId || !currentBaiId || !currentBaiNop) {
    alert("Chưa chọn bài cần chấm");
    return;
  }

  const diemInputs = document.querySelectorAll(".cb_diem_cau");
  const nhanXetInputs = document.querySelectorAll(".cb_nhanxet_cau");

  const tuLuanCham = {};

  diemInputs.forEach(input => {
    const cau = input.dataset.cau;
    tuLuanCham[cau] = {
      diem: Number(input.value || 0),
      nhanXet: ""
    };
  });

  nhanXetInputs.forEach(input => {
    const cau = input.dataset.cau;
    if (!tuLuanCham[cau]) tuLuanCham[cau] = {};
    tuLuanCham[cau].nhanXet = input.value || "";
  });

  const diemTN = Number(currentBaiNop.diem || 0);
 const diemTL =
  Number(
    document.getElementById(
      "cb_auto_tl"
    )?.innerText || 0
  );
  const tongDiem = Number((diemTN + diemTL).toFixed(2));

const chamCount =
  Number(
    currentBaiNop?.chamCount || 0
  ) + 1;

// ===== LẤY CHỮ KÝ GIÁO VIÊN =====
const teacherProfile =
  await readData(
    `users/teachers/${teacherId}/profile`
  );
const teacherSignature =
  teacherProfile?.chu_ky || "";

const teacherName =
  teacherProfile?.ho_ten || "";
  const payload = {
  tuLuanCham,
  diem_tl: diemTL,
  tong_diem: tongDiem,
  essayPending: false,
  finalScore: tongDiem,
  chamAt: Date.now(),
  chamBy: teacherId,
  teacherSignature,
  teacherName
};

await writeData(
  `users/students/${currentStudentId}/kiemtra/${currentBaiId}/tuLuanCham`,
  tuLuanCham
);

await writeData(
  `users/students/${currentStudentId}/kiemtra/${currentBaiId}/diem_tl`,
  diemTL
);

await writeData(
  `users/students/${currentStudentId}/kiemtra/${currentBaiId}/tong_diem`,
  tongDiem
);

await writeData(
  `users/students/${currentStudentId}/kiemtra/${currentBaiId}/finalScore`,
  tongDiem
);

await writeData(
  `users/students/${currentStudentId}/kiemtra/${currentBaiId}/essayPending`,
  false
);

await writeData(
  `users/students/${currentStudentId}/kiemtra/${currentBaiId}/chamAt`,
  Date.now()
);

await writeData(
  `users/students/${currentStudentId}/kiemtra/${currentBaiId}/chamBy`,
  teacherId
);

await writeData(
  `users/students/${currentStudentId}/kiemtra/${currentBaiId}/chamCount`,
  chamCount
);

await writeData(
  `users/students/${currentStudentId}/kiemtra/${currentBaiId}/teacherSignature`,
  teacherSignature
);

await writeData(
  `users/students/${currentStudentId}/kiemtra/${currentBaiId}/teacherName`,
  teacherName
);

  showToast?.("Đã lưu điểm tự luận");
  alert(
  `Đã chấm xong!
Lần chấm: ${chamCount}
Điểm TN: ${diemTN}
Điểm TL: ${diemTL}
Tổng: ${tongDiem}`
);

  resetCham();
  await loadDanhSachNopBai();
}

/* ================= RESET ================= */
function resetCham() {
  currentStudentId = "";
  currentBaiNop = null;

  const detail = document.getElementById("cb_detail");
  if (detail) detail.style.display = "none";

  const essay = document.getElementById("cb_essay_container");
  if (essay) essay.innerHTML = "";

  const deEl = document.getElementById("cb_noidung_de");
  if (deEl) deEl.innerHTML = "";
}

/* ================= UTILS ================= */
function escapeHtml(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}