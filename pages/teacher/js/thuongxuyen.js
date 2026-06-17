import {
  readData,
  writeData
} from "../../../scripts/services/firebaseService.js";

/* ================= CONST ================= */

const teacherId =
  localStorage.getItem("teacher_id");

if (!teacherId)
  location.href = "../../index.html";

let currentEditId = null;

let lopMap = {};
let monMap = {};

/* ================= INIT ================= */

export async function init() {

  await loadTeacherName();

  await loadDanhMuc();

  await loadDanhSach();

  kt_add.onclick = addDiemTX;

  kt_save.onclick = saveDiemTX;

  kt_lop.onchange =
    loadSinhVienTheoLop;

  kt_ngay.value =
    new Date()
      .toISOString()
      .split("T")[0];
}

/* ================= LOAD TEACHER ================= */

async function loadTeacherName() {

  const profile =
    await readData(
      `users/teachers/${teacherId}/profile`
    );

  kt_giaovien.value =
    profile?.ho_ten ||
    teacherId;
}

/* ================= DANH MUC ================= */

async function loadDanhMuc() {

  await loadSelect(
    "lop",
    "kt_lop",
    lopMap
  );

  await loadSelect(
    "monhoc",
    "kt_monhoc",
    monMap
  );
}

async function loadSelect(
  dm,
  selectId,
  mapObj
) {

  const sel =
    document.getElementById(
      selectId
    );

  if (!sel) return;

  const data =
    await readData(
      `config/danh_muc/${dm}`
    );

  if (!data) return;

  Object.entries(data)
    .forEach(([id, item]) => {

      mapObj[id] =
        item.name || id;

      const opt =
        document.createElement(
          "option"
        );

      opt.value = id;
      opt.textContent =
        item.name || id;

      sel.appendChild(opt);

    });
}

/* ================= LOAD SINH VIEN ================= */

async function loadSinhVienTheoLop() {

  kt_sinhvien.innerHTML = `
    <option value="">
      -- Chọn sinh viên --
    </option>
  `;

  const lop =
    kt_lop.value;

  if (!lop) return;

  const students =
    await readData(
      "users/students"
    );

  Object.entries(
    students || {}
  ).forEach(([id, sv]) => {

    if (
      sv?.profile?.lop === lop
    ) {

      const opt =
        document.createElement(
          "option"
        );

      opt.value = id;

      opt.textContent =
        sv.profile?.ho_ten || id;

      kt_sinhvien.appendChild(
        opt
      );
    }
  });
}

/* ================= FORM ================= */

function getFormData() {

  const studentId =
    kt_sinhvien.value;

  const studentName =
    kt_sinhvien.options[
      kt_sinhvien.selectedIndex
    ]?.textContent || "";

  const lop =
    kt_lop.value;

  const monhoc =
    kt_monhoc.value;

  const kythi =
    kt_kythi.value;

  const diem =
    Number(
      kt_diemTX.value
    );

  const ngay =
    kt_ngay.value;

  if (
    !studentId ||
    !lop ||
    !monhoc ||
    !kythi
  ) {

    showToast(
      "Chọn đầy đủ thông tin"
    );

    return null;
  }

  if (
    isNaN(diem) ||
    diem < 0 ||
    diem > 10
  ) {

    showToast(
      "Điểm phải từ 0 đến 10"
    );

    return null;
  }

  return {

    studentId,
    studentName,

    lop,
    monhoc,

    kythi,

    loaikt: "TX",

    diem,

    ngay,

    updatedAt:
      Date.now()
  };
}

/* ================= ADD ================= */

async function addDiemTX() {

  const data =
    getFormData();

  if (!data) return;

  const id = "tx_" + Date.now();

const saveData = {
  ...data,
  giao_vien: teacherId,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

// ===== giáo viên =====
await writeData(
  `teacher/${teacherId}/diemthuongxuyen/${id}`,
  saveData
);

// ===== học viên =====
await writeData(
  `users/students/${data.studentId}/kiemtra/${id}`,
  {
    bai: id,
    giao_vien: teacherId,

    loaikt: "TX",
    kythi: data.kythi,

    monhoc: data.monhoc,
    lop: data.lop,

    diem: data.diem,
    tong_diem: data.diem,

    ngay: data.ngay,

    createdAt: Date.now(),
    updatedAt: Date.now()
  }
);

  showToast(
    "Đã thêm điểm"
  );

  clearForm();

  loadDanhSach();
}

/* ================= SAVE ================= */

async function saveDiemTX() {

  if (!currentEditId) {

    showToast(
      "Chưa chọn dữ liệu sửa"
    );

    return;
  }

  const data =
    getFormData();

  if (!data) return;

  const oldCreatedAt =
    await readData(
      `teacher/${teacherId}/diemthuongxuyen/${currentEditId}/createdAt`
    );

  const saveData = {
  ...data,
  giao_vien: teacherId,
  updatedAt: Date.now()
};

// ===== giáo viên =====
await writeData(
  `teacher/${teacherId}/diemthuongxuyen/${currentEditId}`,
  saveData
);

// ===== học viên =====
await writeData(
  `users/students/${data.studentId}/kiemtra/${currentEditId}`,
  {
    bai: currentEditId,
    giao_vien: teacherId,

    loaikt: "TX",
    kythi: data.kythi,

    monhoc: data.monhoc,
    lop: data.lop,

    diem: data.diem,
    tong_diem: data.diem,

    ngay: data.ngay,

    updatedAt: Date.now()
  }
);

  showToast(
    "Đã lưu thay đổi"
  );

  clearForm();

  loadDanhSach();
}



/* ================= LIST ================= */
async function loadDanhSach() {

  const tbody = document.getElementById("kt_list");

  if (!tbody) return;

  tbody.innerHTML = "";

  const data =
    await readData(
      `teacher/${teacherId}/diemthuongxuyen`
    );

  if (!data) {

    tbody.innerHTML = `
      <tr>
        <td colspan="8"
            style="text-align:center">
          Chưa có dữ liệu
        </td>
      </tr>
    `;

    return;
  }

  // ================= GROUP DATA =================

  const grouped = {};

  Object.entries(data).forEach(([id, item]) => {

    const ky =
      item.kythi || "khac";

    const lop =
      item.lop || "khac";

    if (!grouped[ky]) {
      grouped[ky] = {};
    }

    if (!grouped[ky][lop]) {
      grouped[ky][lop] = [];
    }

    grouped[ky][lop].push({
      id,
      ...item
    });

  });

  // ================= RENDER =================

  let html = "";

  for (const ky in grouped) {

    const tenKy =
      ky === "tx_hk1"
        ? "Thường xuyên HK1"
        : ky === "tx_hk2"
        ? "Thường xuyên HK2"
        : ky;

    html += `
<tr class="group-title-row">
  <td colspan="8">
    📚 Kỳ kiểm tra:
    ${tenKy}
  </td>
</tr>
`;

    for (const lop in grouped[ky]) {

      html += `
<tr class="group-lop-row">
  <td colspan="8">
    👨‍🎓 Lớp:
    ${lopMap[lop] || lop}
  </td>
</tr>
`;

      let stt = 1;

      grouped[ky][lop]

      .sort(
        (a, b) =>
        (b.createdAt || 0) -
        (a.createdAt || 0)
      )

      .forEach(item => {

        html += `
          <tr>

            <td>
              ${stt++}
            </td>

            <td>
              ${item.studentName || ""}
            </td>

            <td>
              ${lopMap[item.lop] || ""}
            </td>

            <td>
              ${item.ngay || ""}
            </td>

            <td>
              ${monMap[item.monhoc] || ""}
            </td>

            <td>
              TX
            </td>

            <td>
              ${item.diem ?? ""}
            </td>

            <td>

              <button
                onclick="window.editTX('${item.id}')">
                Sửa
              </button>

              <button
                onclick="window.deleteTX('${item.id}')">
                Xóa
              </button>

            </td>

          </tr>
        `;

      });

    }

  }

  tbody.innerHTML = html;
}

/* ================= EDIT ================= */

window.editTX =
async function(id) {

  const d =
    await readData(
      `teacher/${teacherId}/diemthuongxuyen/${id}`
    );

  if (!d) return;

  currentEditId = id;

  kt_kythi.value =
    d.kythi || "";

  kt_lop.value =
    d.lop || "";

  await loadSinhVienTheoLop();

  kt_sinhvien.value =
    d.studentId || "";

  kt_monhoc.value =
    d.monhoc || "";

  kt_diemTX.value =
    d.diem || "";

  kt_ngay.value =
    d.ngay || "";
};

/* ================= DELETE ================= */

window.deleteTX = async (id) => {

  if (!confirm("Xóa điểm này?")) return;

  const item =
    await readData(
      `teacher/${teacherId}/diemthuongxuyen/${id}`
    );

  if (!item) return;

  // xóa phía giáo viên
  await writeData(
    `teacher/${teacherId}/diemthuongxuyen/${id}`,
    null
  );

 
  // xóa phía học viên
await writeData(
  `users/students/${item.studentId}/kiemtra/${id}`,
  null
);

  loadDanhSach();
};

/* ================= CLEAR ================= */

function clearForm() {

  currentEditId = null;

  kt_lop.value = "";

  kt_monhoc.value = "";

  kt_sinhvien.innerHTML = `
    <option value="">
      -- Chọn sinh viên --
    </option>
  `;

  kt_diemTX.value = "";

  kt_kythi.value =
    "tx_hk1";

  kt_ngay.value =
    new Date()
      .toISOString()
      .split("T")[0];
}

/* ================= TOAST ================= */

function showToast(msg) {

  alert(msg);
}