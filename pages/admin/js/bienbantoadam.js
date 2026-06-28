import {
  readData,
  writeData,
  deleteData
}
from "../../../scripts/services/firebaseService.js";
import { askAI } from "../../../scripts/services/aiService.js";

let editId = null;

export async function init() {

  document
    .getElementById("btnLuuBB")
    ?.addEventListener(
      "click",
      saveBienBan
    );

  document
    .getElementById("btnPreviewBB")
    ?.addEventListener(
      "click",
      previewBienBan
    );

  // ⭐ AI tạo biên bản
  document
    .getElementById("btnAiBienBan")
    ?.addEventListener(
      "click",
      taoBienBanAI
    );

  // ⭐ Chuyển vào biên bản
  document
    .getElementById("btnChuyenBienBan")
    ?.addEventListener(
      "click",
      chuyenVaoBienBan
    );

document
.getElementById("btnExportWord")
?.addEventListener(
  "click",
  exportWord
);

  await loadList();
}

//====LƯU BIÊN BẢN=====/

async function saveBienBan() {
  const id = editId || "bb_" + Date.now();
  const data = {
  ngay: bbNgay.value,
  chude: bbChuDe.value,
  link: bbLink.value,
  noidung: bbNoiDung.innerHTML,
  updatedAt: Date.now(),
  seenBy: editId
    ? {}
    : {}
};
  await writeData(
    `teacher/toadam/${id}`,
    data
  );
  alert(editId ? "Đã cập nhật" : "Đã thêm mới");
  editId = null;
  bbNgay.value = "";
  bbChuDe.value = "";
  bbLink.value = "";
  bbNoiDung.innerHTML = "";
  await loadList();
}

//====LOAD DANH SÁCH=====/
async function loadList() {
  const data =
    await readData(
      "teacher/toadam"
    ) || {};
  const tbody =
    document.getElementById(
      "bienbanList"
    );
  let stt = 1;
  tbody.innerHTML =
    Object.entries(data)
    .map(([id,r]) => `
      <tr>
        <td>${stt++}</td>
        <td>${r.ngay || ""}</td>
        <td>${r.chude || ""}</td>
        <td>
          <a
            href="${r.link}"
            target="_blank">
            Xem
          </a>
        </td>
        <td>
  ${String(r.noidung || "")
    .replace(/<[^>]*>/g, "")
    .substring(0, 80)}
</td>
        <td>
          <button
            onclick="editBB('${id}')">
            ✏️
          </button>

          <button
            onclick="deleteBB('${id}')">
            🗑️
          </button>
        </td>
      </tr>
    `).join("");

  window.editBB = function(id){
    const r = data[id];
    editId = id;
    bbNgay.value = r.ngay || "";
    bbChuDe.value = r.chude || "";
    bbLink.value = r.link || "";
    bbNoiDung.innerHTML = r.noidung || "";
  };

  window.deleteBB = async function(id){
    if(!confirm("Xóa biên bản?"))
      return;
    await deleteData(
  `teacher/toadam/${id}`
);
    loadList();
  };
}

//====XEM TRƯỚC BIÊN BẢN=====/

function previewBienBan() {
  localStorage.setItem(
    "lesson_preview",
    JSON.stringify({
      title: "Biên bản tọa đàm",
      content_html:
        bbNoiDung.innerHTML
    })
  );
  window.open(
    "/preview.html",
    "_blank"
  );
}


/* =========================
   AI BIÊN BẢN
========================= */

async function taoBienBanAI() {
  const transcript =
    document
      .getElementById("bbTranscript")
      ?.value
      ?.trim();
  if (!transcript) {
    alert(
      "Chưa có transcript"
    );
    return;
  }
  const resultBox =
    document.getElementById(
      "bbAiResult"
    );
  resultBox.innerHTML =
    "⏳ AI đang tạo biên bản...";
  try {

    const prompt = `
Bạn là thư ký chuyên môn của khoa ngoại ngữ.

Hãy chuyển transcript thành BIÊN BẢN TỌA ĐÀM CHUYÊN MÔN.

Yêu cầu:

- Viết theo văn phong hành chính giáo dục.
- Không bịa nội dung ngoài transcript.
- Tuyệt đối không suy đoán tên người, chức vụ,
  thành phần tham dự, kết luận hoặc nhiệm vụ
  nếu transcript không nêu rõ.
- Không được tự tạo:
  + Thủ khoa
  + Chủ trì
  + Thư ký
  + Người tham dự
  + Ý kiến thảo luận
  + Kết luận
  + Nhiệm vụ
- Nếu không có dữ liệu thì ghi:
  "Chưa ghi nhận trong transcript."
- Chỉ sử dụng thông tin xuất hiện trong transcript.
- Tự tổng hợp và diễn đạt lại cho mạch lạc.
- Kết quả trả về HTML.
- Dùng h2, h3, ul, li, p.
- Không dùng markdown.
QUAN TRỌNG : 
- Mỗi thông tin trong biên bản
phải tìm thấy trong transcript.
- Nếu không tìm thấy,
không được tự suy luận.

Cấu trúc:

<h2 style="text-align:center">
BIÊN BẢN TỌA ĐÀM CHUYÊN MÔN
</h2>

<h3>I. Chủ đề</h3>

<h3>II. Thành phần tham dự</h3>

<h3>III. Mục đích buổi tọa đàm</h3>

<h3>IV. Nội dung trao đổi</h3>

<h3>V. Ý kiến thảo luận</h3>

<h3>VI. Kết luận</h3>

<h3>VII. Kiến nghị - Đề xuất</h3>

<h3>VIII. Nhiệm vụ sau tọa đàm</h3>

Cuối biên bản thêm:

<br><br>

<table style="width:100%">
<tr>
<td align="center">
<b>THƯ KÝ</b>
<br><br><br>
(Ký và ghi rõ họ tên)
</td>

<td align="center">
<b>CHỦ TRÌ</b>
<br><br><br>
(Ký và ghi rõ họ tên)
</td>
</tr>
</table>

Transcript:

${transcript}
`;

    const result =
      await askAI({
        type: "meeting_minutes",
        prompt,
        payload: {
          transcript
        },

        role: "admin"

      });

    if (
      !result ||
      !result.success
    ) {

      throw new Error(
        result?.text ||
        "AI thất bại"
      );
    }

    resultBox.innerHTML =
      result.text || "";

  }

  catch(err) {
    console.error(err);
    resultBox.innerHTML = `
      <div style="
        color:red;
        padding:10px">
        ${err.message}
      </div>
    `;
  }
}

/* =========================
   CHUYỂN VÀO BIÊN BẢN
========================= */

function chuyenVaoBienBan() {
  const aiHtml =
    document.getElementById(
      "bbAiResult"
    ).innerHTML;
  if (!aiHtml.trim()) {
    alert(
      "Chưa có kết quả AI"
    );
    return;
  }

  document.getElementById(
    "bbNoiDung"
  ).innerHTML = aiHtml;

}

/*===========
XUẤT WORD
==============*/

function exportWord() {
  const html = `
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial; }
      h2 { text-align: center; }
      h3 { margin-top: 20px; }
      table { width: 100%; margin-top: 30px; }
    </style>
  </head>
  <body>
    ${bbNoiDung.innerHTML}
  </body>
  </html>
  `;

  const blob = htmlDocx.asBlob(html);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (bbChuDe.value || "BienBan") + ".docx";
  a.click();
}