import { readData } from "../../../scripts/services/firebaseService.js";

/* ===== MAP ===== */
let hocHamMap = {};
let chuyenMonMap = {};

/* ===== LOAD DANH MỤC ===== */
async function loadDanhMuc() {
  const hh = await readData("config/danh_muc/hocham");
  const cm = await readData("config/danh_muc/chuyenmon");

  if (hh) {
    Object.entries(hh).forEach(([id, obj]) => {
      hocHamMap[id] = obj.name;
    });
  }

  if (cm) {
    Object.entries(cm).forEach(([id, obj]) => {
      chuyenMonMap[id] = obj.name;
    });
  }
}

/* ===== LOAD PROFILE ===== */
async function loadTeacherProfile() {
  try {
    const teacherId = localStorage.getItem("teacher_id");
    if (!teacherId) return;

    /* ✅ load danh mục trước */
    await loadDanhMuc();

    const data = await readData(`users/teachers/${teacherId}`);
    if (!data) return;

    const p = data.profile || {};

    document.getElementById("gvId").innerText = teacherId;
    document.getElementById("gvName").innerText = p.ho_ten || "—";
    document.getElementById("gvGender").innerText = p.gioi_tinh || "—";
    document.getElementById("gvBirth").innerText = p.ngay_sinh || "—";
    document.getElementById("gvPhone").innerText = p.dien_thoai || "—";
    document.getElementById("gvEmail").innerText = p.gmail || "—";
    document.getElementById("gvFacebook").innerText = p.facebook || "—";
    document.getElementById("gvZalo").innerText = p.zalo || "—";
    document.getElementById("gvWork").innerText = p.noi_cong_tac || "—";

    /* ✅ MAP ID → NAME */
    document.getElementById("gvHocHam").innerText =
      hocHamMap[p.hoc_ham] || "—";

    document.getElementById("gvChuyenMon").innerText =
      chuyenMonMap[p.chuyen_mon] || "—";

    document.getElementById("gvHinhThuc").innerText =
      p.hinh_thuc || "—";

    if (p.avatar) {
      document.getElementById("gvAvatar").src = p.avatar;
    }

  } catch (error) {
    console.error("Load teacher profile error:", error);
  }
}

/* ===== INIT ===== */
export function init() {
  loadTeacherProfile();
}