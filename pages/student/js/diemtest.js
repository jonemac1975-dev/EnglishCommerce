import { readData } from "../../../scripts/services/firebaseService.js";

const student = JSON.parse(localStorage.getItem("studentLogin"));

init();

async function init() {
  if (!student?.id) {
    console.warn("❌ Không tìm thấy studentLogin");
    return;
  }

  const body = document.getElementById("diemTestBody");
  if (!body) {
    console.error("❌ Không tìm thấy #diemTestBody");
    return;
  }

  body.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center; padding:20px;">
        Đang tải dữ liệu...
      </td>
    </tr>
  `;

  try {
    const [testData, teachers] = await Promise.all([
      readData(`users/students/${student.id}/test`),
      readData("users/teachers")
    ]);

    if (!testData) {
      renderEmpty("Chưa có dữ liệu thi TOEIC");
      resetSummary();
      return;
    }

    const testList = Object.entries(testData).map(([attemptId, item]) => ({
      attemptId,
      ...item
    }));

    // 👉 sort mới nhất lên trước
    testList.sort((a, b) => {
      const ta = new Date(a.ngay || 0).getTime();
      const tb = new Date(b.ngay || 0).getTime();
      return tb - ta;
    });

    // 👉 load map đề để lấy số đề đẹp + nội dung đề
    const teacherTestMap = await buildTeacherTestMap(testList);

    let html = "";
    let stt = 1;
    const scoreList = [];

    testList.forEach(item => {
      const tenGV =
        teachers?.[item.giao_vien]?.profile?.ho_ten ||
        item.giao_vien ||
        "Không rõ";

      const deSo = getTestMadeLabel(item, teacherTestMap);
      const diem = getSafeScore(item);
      const rank = getToeicRank(diem);
      const ngay = formatDate(item.ngay);

      scoreList.push(diem);

      html += `
        <tr>
          <td>${stt++}</td>
          <td>${escapeHtml(tenGV)}</td>
          <td>${escapeHtml(deSo)}</td>
          <td><b>${formatScore(diem)}</b></td>
          <td>${renderRankBadge(rank)}</td>
          <td>${escapeHtml(ngay)}</td>
          <td>
            <button class="hv-detail-btn" onclick="window.xemChiTietToeic('${item.giao_vien}', '${item.made}')">
              👁 Xem
            </button>
          </td>
        </tr>
      `;
    });

    body.innerHTML = html || `
      <tr>
        <td colspan="7" style="text-align:center; padding:20px;">
          Chưa có dữ liệu thi TOEIC
        </td>
      </tr>
    `;

    updateSummary(scoreList, testList);

    // expose detail function
    window.xemChiTietToeic = (giaoVienId, testId) => {
      xemChiTietToeic(giaoVienId, testId, teacherTestMap);
    };

  } catch (err) {
    console.error("❌ Lỗi load bảng điểm TOEIC:", err);
    renderEmpty("Lỗi tải dữ liệu bảng điểm");
    resetSummary();
  }
}

/* =========================
   BUILD MAP ĐỀ THI
========================= */
async function buildTeacherTestMap(testList) {
  const teacherIds = [...new Set(
    testList
      .map(x => x.giao_vien)
      .filter(Boolean)
  )];

  const map = {};

  await Promise.all(
    teacherIds.map(async (gvId) => {
      const teacherTests = await readData(`teacher/${gvId}/test`);
      map[gvId] = teacherTests || {};
    })
  );

  return map;
}

/* =========================
   CHI TIẾT BÀI THI
========================= */
function xemChiTietToeic(giaoVienId, testId, teacherTestMap) {
  const deThi = teacherTestMap?.[giaoVienId]?.[testId];
  if (!deThi) {
    alert("Không tìm thấy nội dung đề thi!");
    return;
  }

  localStorage.setItem(
    "lesson_preview",
    JSON.stringify({
      name: `Đề TOEIC ${deThi.made || ""}`,
      meta: `Xem lại đề thi`,
      content: deThi.noidung || "<p>Không có nội dung</p>"
    })
  );

  window.open("/preview.html", "_blank");
}

/* =========================
   GET ĐỀ SỐ ĐẸP
========================= */
function getTestMadeLabel(item, teacherTestMap) {
  const gvId = item.giao_vien || "";
  const testId = item.made || "";

  const testInfo = teacherTestMap?.[gvId]?.[testId];
  if (testInfo?.made) return String(testInfo.made);

  return testId || "Không rõ";
}

/* =========================
   SCORE
========================= */
function getSafeScore(item) {
  if (isValidNumber(item.diem)) return Number(item.diem);
  if (isValidNumber(item.finalScore)) return Number(item.finalScore);
  if (isValidNumber(item.tong_diem)) return Number(item.tong_diem);
  return 0;
}

function isValidNumber(v) {
  return v !== undefined && v !== null && v !== "" && !isNaN(Number(v));
}

function formatScore(score) {
  const num = Number(score) || 0;
  if (Number.isInteger(num)) return String(num);
  return num.toFixed(1).replace(".", ",");
}

/* =========================
   RANK
========================= */
function getToeicRank(score) {
  const s = Number(score) || 0;

  if (s >= 9) return "Xuất sắc";
  if (s >= 8) return "Giỏi";
  if (s >= 6.5) return "Khá";
  if (s >= 5) return "Trung bình";
  return "Yếu";
}

function renderRankBadge(rank) {
  const map = {
    "Xuất sắc": "hv-rank-badge hv-rank-xuatsac",
    "Giỏi": "hv-rank-badge hv-rank-gioi",
    "Khá": "hv-rank-badge hv-rank-kha",
    "Trung bình": "hv-rank-badge hv-rank-tb",
    "Yếu": "hv-rank-badge hv-rank-yeu"
  };

  return `<span class="${map[rank] || "hv-rank-badge"}">${rank}</span>`;
}

/* =========================
   SUMMARY
========================= */
function updateSummary(scoreList, testList) {
  const tongBai = scoreList.length;
  const maxScore = tongBai ? Math.max(...scoreList) : 0;
  const avgScore = tongBai
    ? scoreList.reduce((a, b) => a + b, 0) / tongBai
    : 0;

  const latestDate = testList?.[0]?.ngay
    ? formatDate(testList[0].ngay)
    : "--";

  setText("sumTongBai", tongBai);
  setText("sumMaxScore", formatScore(maxScore));
  setText("sumAvgScore", formatScore(avgScore));
  setText("sumLastDate", latestDate);
}

function resetSummary() {
  setText("sumTongBai", "0");
  setText("sumMaxScore", "0");
  setText("sumAvgScore", "0");
  setText("sumLastDate", "--");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* =========================
   DATE
========================= */
function formatDate(iso) {
  if (!iso) return "";

  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();

    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");

    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  } catch {
    return iso;
  }
}

/* =========================
   EMPTY
========================= */
function renderEmpty(message) {
  const body = document.getElementById("diemTestBody");
  if (!body) return;

  body.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center; padding:20px;">
        ${message}
      </td>
    </tr>
  `;
}

/* =========================
   SAFE HTML
========================= */
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}