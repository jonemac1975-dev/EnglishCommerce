import {
  readData,
  writeData
} from "../../../scripts/services/firebaseService.js";

const studentId =
  localStorage.getItem("student_id");

if (!studentId) {
  location.href = "../../index.html";
}

const tb_list =
  document.getElementById("tb_list");

const tbDetail =
  document.getElementById("tbDetail");

const detailTitle =
  document.getElementById("detailTitle");

const detailInfo =
  document.getElementById("detailInfo");

const detailContent =
  document.getElementById("detailContent");

let lopNameMap = {};
let viewedMap = {};


// ================= INIT =================

export async function init() {

  await loadLopMap();

  viewedMap =
  await readData(
    `users/students/${studentId}/thongbao_da_xem`
  ) || {};

  await loadList();
}


// ================= LOAD LOP =================

async function loadLopMap() {

  const data =
    await readData(
      "config/danh_muc/lop"
    );

  lopNameMap = {};

  Object.entries(data || {})
    .forEach(([id, item]) => {

      lopNameMap[id] =
        item.name || id;

    });
}


// ================= LOAD LIST =================

async function loadList() {

  tb_list.innerHTML = "";

    const teachers =
  await readData("teacher");

let dsThongBao = [];

for (const [teacherId, teacherData]
  of Object.entries(teachers || {})) {

  const profile =
    await readData(
      `users/teachers/${teacherId}/profile`
    );

  const teacherName =
    profile?.ho_ten ||
    teacherId;

  const thongbao =
    teacherData.thongbao || {};

  Object.entries(thongbao)
    .forEach(([tbId, tb]) => {

      dsThongBao.push({
        id: tbId,
        teacherId,
        teacherName,
        ...tb
      });

    });

}

  dsThongBao.sort(
  (a, b) =>
    (b.updatedAt || 0) -
    (a.updatedAt || 0)
);

  if (!dsThongBao.length) {

    tb_list.innerHTML = `
      <tr>
        <td colspan="6"
            style="text-align:center">
            Chưa có thông báo
        </td>
      </tr>
    `;

    return;
  }

  let stt = 1;

  dsThongBao.forEach(tb => {

    const tr =
      document.createElement("tr");

const noidungTomTat =
  (tb.noidung || "")
    .replace(/<[^>]*>/g, "")
    .substring(0, 60);

    const daXem =
  viewedMap[tb.id];

tr.innerHTML = `
<td>${stt++}</td>

<td>${tb.teacherName}</td>

<td>${formatDate(tb.updatedAt)}</td>

<td>${lopNameMap[tb.lop] || ""}</td>

<td>${tb.tieude}</td>

<td title="${tb.noidung || ""}">
  ${noidungTomTat}...
</td>

<td>
  <span class="${
    daXem ? "seen" : "unseen"
  }">
    ${
      daXem ? "Đã xem" : "Chưa xem"
    }
  </span>
</td>
`;

    tr.style.cursor = "pointer";

    tr.addEventListener(
      "click",
      () => openThongBao(tb)
    );

    tb_list.appendChild(tr);

  });
}


// ================= OPEN =================

async function openThongBao(tb) {

  detailTitle.textContent = tb.tieude;

  detailInfo.innerHTML = `
    <b>Giáo viên:</b> ${tb.teacherName}<br>
    <b>Lớp:</b> ${lopNameMap[tb.lop] || ""}<br>
    <b>Ngày:</b> ${formatDate(tb.updatedAt)}
  `;

  detailContent.innerHTML = tb.noidung;

  tbDetail.style.display = "block";

  const now = Date.now();

  // ✅ lưu timestamp (QUAN TRỌNG)
  await writeData(
    `users/students/${studentId}/thongbao_da_xem/${tb.id}`,
    now
  );

  // ✅ update local luôn
  viewedMap[tb.id] = now;

  // 🔥 update badge ngay lập tức
  await checkThongBaoMoi(studentId);

  // 🔥 reload list để đổi màu đã xem
  await loadList();
}


function formatDate(timestamp) {

  if (!timestamp) return "";

  return new Date(timestamp)
    .toLocaleDateString("vi-VN");

}