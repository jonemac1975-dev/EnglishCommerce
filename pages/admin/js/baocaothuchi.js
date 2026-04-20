import { readData } 
from "../../../scripts/services/firebaseService.js";

/* ========= PATH ========= */
const PATH_THU = "/config/account/thuhocphi";
const PATH_CHI = "/config/account/chiluong";

/* ========= DOM ========= */
let bcMonth, tongThuEl, tongChiEl, bangBaoCao;

/* ========= INIT ========= */
export async function init() {

  bcMonth     = document.getElementById("bcMonth");
  tongThuEl   = document.getElementById("tongThu");
  tongChiEl   = document.getElementById("tongChi");
  bangBaoCao  = document.getElementById("bangBaoCao");

  bcMonth.value = new Date().toISOString().slice(0,7);

  bcMonth.onchange = loadBaoCao;

  await loadBaoCao();
}

/* ========= LOAD BÁO CÁO ========= */
async function loadBaoCao() {

  const monthKey = bcMonth.value;
  if (!monthKey) return;

  const thuData = await readData(PATH_THU) || {};
  const chiData = await readData(PATH_CHI) || {};

  const thuList = [];
  const chiList = [];

  let tongThu = 0;
  let tongChi = 0;

  /* ===== LỌC THU ===== */
  Object.values(thuData).forEach(p => {
    if (p.ngayThu?.startsWith(monthKey)) {
      thuList.push(p);
      tongThu += Number(p.phaiThu || 0);
    }
  });

  /* ===== LỌC CHI ===== */
  Object.values(chiData).forEach(p => {
    if (p.monthKey === monthKey) {
      chiList.push(p);
      tongChi += Number(p.soTien || 0);
    }
  });

  tongThuEl.value = formatMoney(tongThu);
  tongChiEl.value = formatMoney(tongChi);

  renderTable(thuList, chiList);
}

/* ========= RENDER ========= */
function renderTable(thuList, chiList) {

  bangBaoCao.innerHTML = "";

  const max = Math.max(thuList.length, chiList.length);

  for (let i = 0; i < max; i++) {

    const thu = thuList[i];
    const chi = chiList[i];

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${thu?.soPhieu || ""}</td>
      <td>${formatDate(thu?.ngayThu)}</td>
      <td>${thu?.hocVienText || ""}</td>
      <td>${thu ? formatMoney(thu.phaiThu) : ""}</td>

      <td>${chi?.soPhieu || ""}</td>
      <td>${formatDate(chi?.ngayChi)}</td>
      <td>${chi?.giaoVienText || ""}</td>
      <td>${chi ? formatMoney(chi.soTien) : ""}</td>
    `;

    bangBaoCao.appendChild(tr);
  }
}

/* ========= UTIL ========= */
function formatMoney(n) {
  return Number(n || 0).toLocaleString("vi-VN");
}

function formatDate(d) {
  if (!d) return "";
  const parts = d.split("-");
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}