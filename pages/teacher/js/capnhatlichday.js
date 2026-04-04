import { readData, writeData } from "../../../scripts/services/firebaseService.js";

const teacherId = localStorage.getItem("teacher_id");

if (!teacherId) {
  location.href = "../../index.html";
}

/* ========= BIẾN ========= */
let lopSel, monHocSel, namInp, thangSel, tuanSel;
let tuNgay, denNgay;
let btnThem, btnLuu, btnXoa;

let fNam, fThang;
let weeksWrap;

let editId = null;
let lopMap = {};
let monHocMap = {};

/* ========= DOM ========= */
function getDOM() {
  lopSel   = document.getElementById("ldLop");
  monHocSel = document.getElementById("ldMonHoc");
  namInp   = document.getElementById("ldNam");
  thangSel = document.getElementById("ldThang");
  tuanSel  = document.getElementById("ldTuan");
  tuNgay   = document.getElementById("ldTuNgay");
  denNgay  = document.getElementById("ldDenNgay");

  btnThem  = document.getElementById("btnThem");
  btnLuu   = document.getElementById("btnLuu");
  btnXoa   = document.getElementById("btnXoa");

  fNam     = document.getElementById("fNam");
  fThang   = document.getElementById("fThang");
  weeksWrap = document.getElementById("lichdayWeeksWrap");
}

/* ========= TOAST ========= */
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove("show"), 2500);
}

/* ========= TUẦN HIỆN TẠI ========= */
function getCurrentWeekOfMonth() {
  const today = new Date();
  const day = today.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

/* ========= INIT NĂM / THÁNG ========= */
function initTime() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const currentWeek = getCurrentWeekOfMonth();

  namInp.value = y;

  thangSel.innerHTML = "";
  fThang.innerHTML   = "";

  for (let month = 1; month <= 12; month++) {
    thangSel.innerHTML += `<option value="${month}">${month}</option>`;
    fThang.innerHTML   += `<option value="${month}">${month}</option>`;
  }

  thangSel.value = m;
  fThang.value   = m;
  tuanSel.value  = String(currentWeek);

  fNam.innerHTML = `<option value="${y}">${y}</option>`;
}

/* ========= LOAD LỚP ========= */
async function loadLop() {
  const lop = await readData("config/danh_muc/lop");
  lopSel.innerHTML = `<option value="">-- Chọn lớp --</option>`;
  lopMap = {};

  if (lop) {
    Object.entries(lop).forEach(([id, v]) => {
      const name = v.name || id;
      lopMap[id] = name;
      lopSel.innerHTML += `<option value="${id}">${name}</option>`;
    });
  }
}

/* ========= LOAD MÔN HỌC ========= */
async function loadMonHoc() {
  const monhoc = await readData("config/danh_muc/monhoc") || {};
  monHocMap = {};

  monHocSel.innerHTML = `<option value="">-- Chọn môn học --</option>`;

  Object.entries(monhoc).forEach(([id, v]) => {
    const name = v.name || id;
    monHocMap[id] = name;
    monHocSel.innerHTML += `<option value="${id}">${name}</option>`;
  });
}


/* ========= CHECKBOX → INPUT ========= */
function bindDayEvents() {
  document.querySelectorAll(".day-check").forEach(chk => {
    chk.onchange = () => {
      const day = chk.dataset.day;
      const input = document.querySelector(`.day-time[data-day="${day}"]`);
      if (!input) return;

      input.disabled = !chk.checked;
      if (!chk.checked) input.value = "";
    };
  });
}

/* ========= LẤY LỊCH ========= */
function getSchedule() {
  const map = {};
  document.querySelectorAll(".day-check").forEach(chk => {
    if (!chk.checked) return;

    const day = chk.dataset.day;
    const input = document.querySelector(`.day-time[data-day="${day}"]`);
    if (input && input.value.trim()) {
      map[day] = input.value.trim();
    }
  });
  return map;
}

/* ========= Fill lịch ========= */
function fillSchedule(lich = {}) {
  document.querySelectorAll(".day-check").forEach(chk => {
    const day = chk.dataset.day;
    const input = document.querySelector(`.day-time[data-day="${day}"]`);

    if (lich[day]) {
      chk.checked = true;
      input.disabled = false;
      input.value = lich[day];
    } else {
      chk.checked = false;
      input.disabled = true;
      input.value = "";
    }
  });
}

/* ========= CLEAR FORM ========= */
function clearForm() {
  editId = null;

  lopSel.value = "";
  monHocSel.value = "";
  thangSel.value = new Date().getMonth() + 1;
  tuanSel.value = String(getCurrentWeekOfMonth());
  tuNgay.value = "";
  denNgay.value = "";

  document.querySelectorAll(".day-check").forEach(c => c.checked = false);
  document.querySelectorAll(".day-time").forEach(i => {
    i.value = "";
    i.disabled = true;
  });

  btnThem.style.display = "inline-block";
  btnLuu.style.display  = "none";
  btnXoa.style.display  = "none";
}

/* ========= SAVE ========= */
async function save(isEdit = false) {
  if (!lopSel.value || !monHocSel.value) {
  showToast("Vui lòng chọn lớp và môn học", "error");
  return;
}

  const lich = getSchedule();
  if (Object.keys(lich).length === 0) {
    showToast("Bạn chưa chọn lịch dạy", "error");
    return;
  }

  const id = `${namInp.value}_${thangSel.value}_${tuanSel.value}_${lopSel.value}`;

  await writeData(`teacher/${teacherId}/lichday/${id}`, {
  id,
  teacherId,
  lop: lopSel.value,
  lopName: lopMap[lopSel.value] || lopSel.value,
  monhoc: monHocSel.value,
  monhocName: monHocMap[monHocSel.value] || monHocSel.value,
  nam: namInp.value,
  thang: thangSel.value,
  tuan: tuanSel.value,
  tungay: tuNgay.value,
  denngay: denNgay.value,
  lich,
  updated_at: Date.now()
});

  clearForm();
  await renderAllWeeks();
  showToast(isEdit ? "Đã cập nhật lịch" : "Đã thêm lịch");
}

/* ========= XOÁ ========= */
async function xoa() {
  if (!editId) return;
  if (!confirm("Xóa lịch này?")) return;

  await writeData(`teacher/${teacherId}/lichday/${editId}`, null);
  clearForm();
  await renderAllWeeks();
  showToast("Đã xóa lịch");
}

/* ========= LOAD DATA ========= */
async function getTeacherLichData() {
  return await readData(`teacher/${teacherId}/lichday`) || {};
}

/* ========= RENDER 1 TUẦN ========= */
function buildWeekTableRows(arr, weekNum) {
  if (!arr.length) {
    return `
      <tr>
        <td colspan="9" class="empty-row">Chưa có lịch tuần ${weekNum}</td>
      </tr>
    `;
  }

  let stt = 1;

  return arr.map(([id, v]) => `
    <tr class="lich-row" data-id="${id}" data-week="${weekNum}">
      <td>${stt++}</td>
      <td>${lopMap[v.lop] || v.lop}</td>
      ${["t2","t3","t4","t5","t6","t7","cn"]
        .map(d => `<td>${v.lich?.[d] || ""}</td>`).join("")}
    </tr>
  `).join("");
}

/* ========= CLICK ROW ========= */
function bindRowClick(allData) {
  document.querySelectorAll(".lich-row").forEach(row => {
    row.onclick = () => {
      const id = row.dataset.id;
      const v = allData[id];
      if (!v) return;

      editId = id;

      lopSel.value   = v.lop || "";
      monHocSel.value = v.monhoc || "";
      namInp.value   = v.nam || "";
      thangSel.value = v.thang || "";
      tuanSel.value  = v.tuan || "";
      tuNgay.value   = v.tungay || "";
      denNgay.value  = v.denngay || "";

      fillSchedule(v.lich || {});

      btnThem.style.display = "none";
      btnLuu.style.display  = "inline-block";
      btnXoa.style.display  = "inline-block";

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    };
  });
}

/* ========= RENDER 4 TUẦN ========= */
async function renderAllWeeks() {
  if (!weeksWrap) return;

  const data = await getTeacherLichData();
  const selectedYear  = String(fNam.value);
  const selectedMonth = String(fThang.value);

  const now = new Date();
  const isCurrentMonth =
    Number(selectedYear) === now.getFullYear() &&
    Number(selectedMonth) === (now.getMonth() + 1);

  const currentWeek = getCurrentWeekOfMonth();

  weeksWrap.innerHTML = "";

  for (let week = 1; week <= 4; week++) {
    const arr = Object.entries(data)
      .filter(([id, v]) => {
        return (
          String(v.nam) === selectedYear &&
          String(v.thang) === selectedMonth &&
          String(v.tuan) === String(week)
        );
      })
      .sort((a, b) => {
        const lopA = lopMap[a[1].lop] || a[1].lop || "";
        const lopB = lopMap[b[1].lop] || b[1].lop || "";
        return lopA.localeCompare(lopB, "vi");
      });

    const activeClass = isCurrentMonth && week === currentWeek ? "active-week" : "";

    const block = document.createElement("div");
    block.className = `week-block ${activeClass}`;
    block.innerHTML = `
      <div class="week-title-row">
        <div class="week-title">Tuần ${week}</div>
        ${activeClass ? `<span class="week-badge">Tuần hiện hành</span>` : ""}
      </div>

      <div class="table-wrap">
        <table class="admin-table lich-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Lớp</th>
              <th>T2</th>
              <th>T3</th>
              <th>T4</th>
              <th>T5</th>
              <th>T6</th>
              <th>T7</th>
              <th>CN</th>
            </tr>
          </thead>
          <tbody>
            ${buildWeekTableRows(arr, week)}
          </tbody>
        </table>
      </div>
    `;

    weeksWrap.appendChild(block);
  }

  bindRowClick(data);
}

/* ========= INIT ========= */
export async function init() {
  getDOM();
  if (!btnThem) return;

  initTime();
  bindDayEvents();

  await loadLop();
  await loadMonHoc();
  await renderAllWeeks();

  btnThem.onclick = () => save(false);
  btnLuu.onclick  = () => save(true);
  btnXoa.onclick  = xoa;

  fNam.onchange   = renderAllWeeks;
  fThang.onchange = renderAllWeeks;
}