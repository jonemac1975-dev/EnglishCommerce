import { readData, updateData }
from "../../scripts/services/firebaseService.js";

import { compressImage }
from "../../scripts/utils/imageCompress.js";




/* ===== SESSION ===== */
const adminViewId = localStorage.getItem("admin_view_teacher");
const selfId = localStorage.getItem("teacher_id");

// Nếu admin đang xem
let teacherId = null;
let isAdminView = false;

if (adminViewId) {
  teacherId = adminViewId;
  isAdminView = true;
} else if (selfId) {
  teacherId = selfId;
} else {
  location.href = "../../index.html";
}

/* ===== ẨN NÚT NẾU ADMIN ===== */
document.addEventListener("DOMContentLoaded", () => {
  if (isAdminView) {
    const btnRegister = document.querySelector("[onclick='register()']");
    const btnUpdate = document.querySelector("[onclick='updateProfile()']");

    if (btnRegister) btnRegister.style.display = "none";
 //   if (btnUpdate) btnUpdate.style.display = "none";
  }
});



/* ===== DOM ===== */
const username = document.getElementById("username");
const avatarFile = document.getElementById("avatarFile");
const avatarPreview = document.getElementById("avatarPreview");
const msg = document.getElementById("msg");


const ho_ten = document.getElementById("ho_ten");
const gioi_tinh = document.getElementById("gioi_tinh");
const ngay_sinh = document.getElementById("ngay_sinh");
const dien_thoai = document.getElementById("dien_thoai");
const gmail = document.getElementById("gmail");
const facebook = document.getElementById("facebook");
const zalo = document.getElementById("zalo");
const noi_cong_tac = document.getElementById("noi_cong_tac");
const hoc_ham = document.getElementById("hoc_ham");
const chuyen_mon = document.getElementById("chuyen_mon");
const hinh_thuc = document.getElementById("hinh_thuc");

username.value = teacherId;

let avatarBase64 = null;


/* ===== LOAD DANH MỤC ===== */
async function loadDanhMuc() {
  const hh = await readData("config/danh_muc/hocham");
  const cm = await readData("config/danh_muc/chuyenmon");
  fillSelect(hoc_ham, hh);
  fillSelect(chuyen_mon, cm);
}



function fillSelect(select, data) {
  if (!data) return;

  select.innerHTML = `<option value="">-- Chọn --</option>`;

  Object.entries(data).forEach(([key, value]) => {
    const o = document.createElement("option");
    o.value = key;               // ✅ lưu ID
    o.textContent = value.name;  // ✅ hiển thị tên
    select.appendChild(o);
  });
}

/* ===== LOAD PROFILE ===== */
(async function init() {
  await loadDanhMuc();

  const profile =
    await readData(`users/teachers/${teacherId}/profile`);
  if (!profile) return;

  ho_ten.value = profile.ho_ten || "";
  gioi_tinh.value = profile.gioi_tinh || "";
  ngay_sinh.value = profile.ngay_sinh || "";
  dien_thoai.value = profile.dien_thoai || "";
  gmail.value = profile.gmail || "";
  facebook.value = profile.facebook || "";
  zalo.value = profile.zalo || "";
  noi_cong_tac.value = profile.noi_cong_tac || "";
  hoc_ham.value = profile.hoc_ham || "";
  chuyen_mon.value = profile.chuyen_mon || "";
  hinh_thuc.value = profile.hinh_thuc || "";

  /* ✅ LOAD LẠI CHECKBOX */
  if (profile.mon_day) {
    profile.mon_day.forEach(m => {
      const cb = document.querySelector(
        `input[type=checkbox][value="${m}"]`
      );
      if (cb) cb.checked = true;
    });
  }

  if (profile.avatar) {
    avatarPreview.src = profile.avatar;
  }
})();

/* ===== AVATAR ===== */
avatarFile.onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;

  const compressed = await compressImage(file);

  const reader = new FileReader();
  reader.onload = () => {
    avatarBase64 = reader.result;     // Lưu base64
    avatarPreview.src = avatarBase64; // Preview đúng dữ liệu sẽ lưu
  };

  reader.readAsDataURL(compressed);
};


window.removeAvatar = () => {
  avatarBase64 = null;
  avatarPreview.src = "";
};


/* ===== COLLECT ===== */
function collectData() {
  const mon = [...document.querySelectorAll("input[type=checkbox]:checked")]
    .map(i => i.value);

  return {
    ho_ten: ho_ten.value.trim(),
    gioi_tinh: gioi_tinh.value,
    ngay_sinh: ngay_sinh.value,
    dien_thoai: dien_thoai.value.trim(),
    gmail: gmail.value.trim(),
    facebook: facebook.value.trim(),
    zalo: zalo.value.trim(),
    noi_cong_tac: noi_cong_tac.value.trim(),
    hoc_ham: hoc_ham.value,
    chuyen_mon: chuyen_mon.value,
    mon_day: mon,
    hinh_thuc: hinh_thuc.value,
    updated_at: Date.now()
  };
}

function showMsg(text, ok = true) {
  msg.innerText = text;
  msg.style.display = "block";
  msg.style.position = "fixed";
  msg.style.top = "20px";
  msg.style.right = "20px";
  msg.style.zIndex = 9999;

  msg.style.background = ok ? "#e8f5e9" : "#ffebee";
  msg.style.color = ok ? "#2e7d32" : "#c62828";
  msg.style.padding = "10px 16px";
  msg.style.borderRadius = "6px";
  msg.style.boxShadow = "0 4px 12px rgba(0,0,0,.15)";

  setTimeout(() => msg.style.display = "none", 3000);
}


/* ===== ĐĂNG KÝ (GHI THÊM FIELD) ===== */
window.register = async function () {
  try {
    const data = collectData();

    if (avatarBase64) {
  data.avatar = avatarBase64;
}


    data.created_at ??= Date.now();
    data.updated_at = Date.now();

    await updateData(`users/teachers/${teacherId}/profile`, data);
showMsg("Đăng ký hồ sơ thành công");

  } catch (e) {
    console.error(e);
    msg.innerText = "Lỗi khi đăng ký hồ sơ";
  }
};


/* ===== CẬP NHẬT (GHI ĐÈ FIELD ĐÃ CÓ) ===== */
window.updateProfile = async function () {
  try {
    const data = collectData();

    if (avatarBase64) {
  data.avatar = avatarBase64;
}


    data.updated_at = Date.now();

    await updateData(`users/teachers/${teacherId}/profile`, data);
showMsg("Cập nhật hồ sơ thành công");

  } catch (e) {
    console.error(e);
    msg.innerText = "Lỗi khi cập nhật hồ sơ";
  }
};

window.goHome = () => location.href = "../../index.html";
window.gopage = () => location.href = "./giaovien.html";
