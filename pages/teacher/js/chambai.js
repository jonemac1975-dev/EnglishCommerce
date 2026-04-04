import { readData, writeData } from "../../../scripts/services/firebaseService.js";

/* ================= CONST ================= */
const teacherId = localStorage.getItem("teacher_id");
if (!teacherId) location.href = "../../index.html";

let hocVienMap = {};
let currentBaiId = "";
let currentStudentId = "";
let currentBaiNop = null;
let currentDeThi = null;

/* ================= INIT ================= */
export async function init() {
  await loadDanhMuc();
  await loadHocVienMap();
  await loadDanhSachBaiKT();

  cb_kythi.addEventListener("change", async () => {
    resetCham();
    await loadDanhSachBaiKT();
  });

  cb_lop.addEventListener("change", async () => {
    resetCham();
    await loadDanhSachBaiKT();
  });

  cb_monhoc.addEventListener("change", async () => {
    resetCham();
    await loadDanhSachBaiKT();
  });

  cb_baikt.addEventListener("change", async () => {
    resetCham();
    await loadDanhSachNopBai();
  });

  cb_save.addEventListener("click", saveChamBai);
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
    opt.textContent = item.tieude || id;
    sel.appendChild(opt);
  });

  // reset chọn bài khi filter thay đổi
  sel.value = "";
  document.getElementById("cb_list").innerHTML = "";
}

/* ================= LOAD DANH SÁCH NỘP ================= */
async function loadDanhSachNopBai() {
  const tbody = document.getElementById("cb_list");
  if (!tbody) return;

  tbody.innerHTML = "";

  currentBaiId = document.getElementById("cb_baikt")?.value || "";
  if (!currentBaiId) return;

  currentDeThi = await readData(`teacher/${teacherId}/kiemtra/${currentBaiId}`);

  const students = await readData("users/students");
  if (!students) return;

  let stt = 1;

  Object.entries(students).forEach(([studentId, studentData]) => {
    const baiNop = studentData?.kiemtra?.[currentBaiId];
    if (!baiNop) return;

    const diemTN = Number(baiNop.diem || 0);
    const diemTL = Number(baiNop.diem_tuluan || 0);
    const tongDiem = Number(baiNop.tong_diem ?? (diemTN + diemTL));

    const daChamHtml = baiNop.essayPending
      ? `<span class="cb-status-chua-cham"
          style="
            color:#d60000;
            font-weight:900;
            font-size:15px;
            animation: cbBlink 1s infinite;
            display:inline-block;
          ">🚨 Chưa chấm</span>`
      : `<span class="cb-status-da-cham"
          style="
            color:#0a8f3d;
            font-weight:800;
          ">✅ Đã chấm</span>`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${stt++}</td>
      <td>${hocVienMap[studentId] || studentId}</td>
      <td>${diemTN}</td>
      <td>${diemTL}</td>
      <td>${tongDiem}</td>
      <td>${daChamHtml}</td>
      <td>
        <button onclick="window.chamBaiHocVien('${studentId}')">Chấm bài</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (tbody.innerHTML.trim() === "") {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; color:#777; padding:16px;">
          Chưa có học viên nào nộp bài này
        </td>
      </tr>
    `;
  }
}

/* ================= MỞ BÀI CẦN CHẤM ================= */
window.chamBaiHocVien = async function(studentId) {
  currentStudentId = studentId;

  const baiNop = await readData(`users/students/${studentId}/kiemtra/${currentBaiId}`);
  if (!baiNop) {
    alert("Không tìm thấy bài nộp");
    return;
  }

  currentBaiNop = baiNop;

  document.getElementById("cb_detail").style.display = "block";
  document.getElementById("cb_hocvien").innerText = hocVienMap[studentId] || studentId;
  document.getElementById("cb_tenbai").innerText = currentDeThi?.tieude || "Bài kiểm tra";
  document.getElementById("cb_diem_tn").innerText = baiNop.diem || 0;

  renderNoiDungDeThi();
  renderTuLuanCham(baiNop.tuLuan || {});
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
                 max="10"
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

  const tongCu = currentBaiNop?.diem_tuluan ?? "";
  const tongWrap = document.createElement("div");
  tongWrap.style.marginTop = "20px";
  tongWrap.style.padding = "16px";
  tongWrap.style.background = "#fff8e1";
  tongWrap.style.borderRadius = "10px";
  tongWrap.innerHTML = `
    <label><b>Tổng điểm tự luận</b></label>
    <input type="number"
           id="cb_tong_diem_tuluan"
           min="0"
           max="${currentDeThi?.diemTL ?? 10}"
           step="0.25"
           value="${tongCu}"
           style="width:60px; margin-left:8px;">
    <p style="margin-top:8px; color:#666;">
      👉 Giáo viên tự nhập tổng điểm tự luận theo cơ cấu của đề.
    </p>
  `;
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
    html = `<i>Học viên chưa làm phần này</i>`;
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
  const diemTL = Number(document.getElementById("cb_tong_diem_tuluan")?.value || 0);
  const tongDiem = Number((diemTN + diemTL).toFixed(2));

  await writeData(
    `users/students/${currentStudentId}/kiemtra/${currentBaiId}`,
    {
      ...currentBaiNop,
      tuLuanCham,
      diem_tuluan: diemTL,
      tong_diem: tongDiem,
      essayPending: false,
      finalScore: tongDiem,
      chamAt: Date.now(),
      chamBy: teacherId
    }
  );

  showToast?.("Đã lưu điểm tự luận");
  alert(`Đã chấm xong!\nĐiểm TN: ${diemTN}\nĐiểm TL: ${diemTL}\nTổng: ${tongDiem}`);

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