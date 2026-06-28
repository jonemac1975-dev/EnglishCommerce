import {
  readData,
  writeData,
 onDataChange
} from "../../../scripts/services/firebaseService.js";

let OPEN_TOADAM_ID = null;
let hasNewBienBan = false;
let tab2Cache = {};

export async function init() {
  try {
    localStorage.setItem("last_view_toadam", Date.now());
    const urlParams = new URLSearchParams(window.location.search);
    const openId = urlParams.get("open");
    if (openId) {
      OPEN_TOADAM_ID = openId;
      await markAsSeen(openId);
    }
    setupTabs();
    await loadTab1();
    const data = await readData("teacher/toadam") || {};
tab2Cache = structuredClone(data);
renderTab2(data);
listenBienBanRealtime();

  } catch (err) {
    console.error("TOADAM INIT ERROR:", err);
  }
}

async function loadTab1() {

  const tbody = document.getElementById("listLich");
  if (!tbody) return;

  const teacherId = localStorage.getItem("teacher_id");
  const data = (await readData("config/danh_muc/linktoadam")) || {};

  const list = Object.entries(data)
    .filter(([id, r]) => r && r.ngay && r.chude)
    .map(([id, r]) => ({ id, ...r }));

  tbody.innerHTML = list.length
    ? list.map((r, i) => {

        const seen = r.seenBy || {};
        const isSeen = !!seen[teacherId];
        const rowClass =
          r.id === OPEN_TOADAM_ID
            ? "row-highlight"
            : (isSeen ? "row-seen" : "row-unseen");

        return `
          <tr id="row-${r.id}" class="${rowClass}">
            <td>${i + 1}</td>
            <td>${r.ngay || ""}</td>
            <td>${r.chude || ""}</td>
            <td>${r.thamdu || ""}</td>

            <td>
              <button
                class="${isSeen ? 'btn-da-xem' : 'btn-chua-xem'}"
                onclick="previewToaDam('${r.id}')">

                ${isSeen ? '✅ Đã xem' : '🔴 Chưa xem'}

              </button>
            </td>

            <td>
              ${
                r.gmeet
                  ? `<a href="${r.gmeet}" target="_blank">🟢 Google Meet</a>`
                  : r.zoom
                    ? `<a href="${r.zoom}" target="_blank">🔵 Zoom</a>`
                    : ""
              }
            </td>

            <td>
              <button onclick="joinMeeting('${r.gmeet}','${r.zoom}')">
                THAM GIA
              </button>
            </td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="7">Không có dữ liệu</td></tr>`;
}

function renderTab2(data) {
  const tbody =
    document.getElementById("listBienBan");
  if (!tbody) return;

  const teacherId =
    localStorage.getItem("teacher_id");

  const list =
    Object.entries(data || {});

  tbody.innerHTML = list.length

    ? list.map(([id, r], i) => {
        const seen =
          r.seenBy || {};
        const isSeen =
          !!seen[teacherId];
        
        const rowClass =
  isSeen
    ? "row-seen"
    : "row-new";

        return `
          <tr class="${rowClass}">
            <td>${i + 1}</td>
            <td>${r.ngay || ""}</td>
            <td>${r.chude || ""}</td>

            <td>
              ${
                r.link
                  ? `<button class="btn-clip" onclick="window.open('${r.link}', '_blank')">
                      🎥 Xem clip
                    </button>`
                  : `<button class="btn-clip disabled" disabled>
                      ⛔ Chưa có clip
                    </button>`
              }
            </td>

            <td title="${(r.noidung || "").replace(/<[^>]*>/g, "")}">
              ${(r.noidung || "").replace(/<[^>]*>/g, "").substring(0, 80)}
            </td>

            <td>
              <button onclick="previewBienBan('${id}')">
                👁 Xem biên bản
              </button>
            </td>

            <td>
              <button onclick="downloadWord('${id}')">
                📄 Word
              </button>
            </td>
          </tr>
        `;
      }).join("")

    : `<tr><td colspan="6">Không có biên bản</td></tr>`;

  // PHẢI ĐẶT NGOÀI map
  tab2Cache = structuredClone(data);
}


window.joinMeeting = function(gmeet, zoom) {
  const link = gmeet || zoom;
  if (!link) return alert("Chưa có link");
  window.open(link, "_blank");
};

window.viewBB = function(link) {

  if (!link) {
    alert("Chưa có biên bản");
    return;
  }
  window.open(link, "_blank");
};

window.previewToaDam = async function(id) {
  const teacherId = localStorage.getItem("teacher_id");
  const data = await readData(`config/danh_muc/linktoadam/${id}`);
  if (!data) return;
  localStorage.setItem("lesson_preview", JSON.stringify({
    title: data.chude || "",
    content_html: data.noidung || ""
  }));
  if (teacherId) {

  await writeData(
    `config/danh_muc/linktoadam/${id}/seenBy/${teacherId}`,
    true
  );

  await loadTab1();
}
 await loadTab1();
  window.open("/preview.html", "_blank");
};

  
window.previewBienBan = async function(id) {

  const teacherId =
    localStorage.getItem("teacher_id");

  if (teacherId) {

    await writeData(
      `teacher/toadam/${id}/seenBy/${teacherId}`,
      true
    );
  }

  const data =
    await readData(`teacher/toadam/${id}`);

  if (!data) return;

  localStorage.setItem(
    "lesson_preview",
    JSON.stringify({
      title: data.chude || "",
      content_html: data.noidung || ""
    })
  );

  const allData =
    await readData("teacher/toadam");

  renderTab2(allData);

  window.open("/preview.html", "_blank");
};


function setupTabs() {

  const buttons = document.querySelectorAll(".tab-btn");
  const tabs = document.querySelectorAll(".tab-content");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
    buttons.forEach(b => b.classList.remove("active"));
      tabs.forEach(t => t.classList.remove("active"));
      btn.classList.add("active");
      document
        .getElementById(btn.dataset.tab)
        .classList.add("active");
    });
  });
}


async function markAsSeen(id) {
  const teacherId = localStorage.getItem("teacher_id");
  if (!teacherId) return;
  await writeData(
    `config/danh_muc/linktoadam/${id}/seenBy/${teacherId}`,
    true
  );
}

window.downloadWord = async function(id) {
  const data = await readData(`teacher/toadam/${id}`);
  if (!data || !data.noidung) {
    alert("Không có nội dung để xuất Word");
    return;
  }
  const html = `
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial; }
      h2 { text-align:center; }
      h3 { margin-top:15px; }
      table { width:100%; margin-top:20px; }
    </style>
  </head>
  <body>
    ${data.noidung}
  </body>
  </html>
  `;

  const blob = htmlDocx.asBlob(html);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const name = (data.chude || "BienBan")
    .replace(/\s+/g, "_");
  a.download = name + ".docx";
  a.click();
};

function listenBienBanRealtime() {
  onDataChange("teacher/toadam", (data) => {
    
    renderTab2(data); // CHỈ 1 nơi render
  });
}

function showRealtimeIndicator() {
  let el = document.getElementById("realtimeBadge");
  if (!el) {
    el = document.createElement("div");
    el.id = "realtimeBadge";
    el.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #ff3b3b;
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 13px;
      z-index: 9999;
      animation: pulse 1s infinite;
    `;
    el.innerText = "🔴 Có cập nhật mới";
    document.body.appendChild(el);
  }
  el.style.display = "block";
  setTimeout(() => {
    el.style.display = "none";
    hasNewBienBan = false;
  }, 4000);
}

