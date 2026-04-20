/*************************************************
 * INDEX FOOTER
 * - Load dữ liệu từ Firebase
 * - News
 * - Hoạt động
 * - Thư viện (Sách + Tài liệu)
 *************************************************/

import { readData } from "../scripts/services/firebaseService.js";

/* ===== LẤY ELEMENT ===== */
const ftNews      = document.getElementById("ftNews");
const ftHoatDong  = document.getElementById("ftHoatDong");
const ftSach      = document.getElementById("ftSach");
const ftTaiLieu   = document.getElementById("ftTaiLieu");

/* ===== HÀM RENDER LIST ===== */
function renderList(container, data, textField) {
  if (!container) return;

  if (!data) {
    container.innerHTML = "<li>Chưa có dữ liệu</li>";
    return;
  }

  container.innerHTML = Object.values(data)
    .map(item => `
      <li>
        <a href="${item.link}" target="_blank">
          ${item[textField]}
        </a>
      </li>
    `)
    .join("");
}

/* ===== LOAD FOOTER ===== */
async function loadFooter() {

  try {

    /* ===== NEWS ===== */
    const newsData = await readData("thoisuhoatdong/thoisu");
    renderList(ftNews, newsData, "tieuDe");

    /* ===== HOẠT ĐỘNG ===== */
    const hdData = await readData("thoisuhoatdong/hoatdong");
    renderList(ftHoatDong, hdData, "tieuDe");

    /* ===== SÁCH ===== */
    const sachData = await readData("sachtailieu/sach");
    renderList(ftSach, sachData, "ten");

    /* ===== TÀI LIỆU ===== */
    const taiLieuData = await readData("sachtailieu/tailieu");
    renderList(ftTaiLieu, taiLieuData, "ten");

  } catch (error) {
    console.error("Lỗi load footer:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadFooter);