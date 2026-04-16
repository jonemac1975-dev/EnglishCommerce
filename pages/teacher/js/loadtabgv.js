import { readData } from "../../../scripts/services/firebaseService.js";

/* ===== LOAD PROFILE ===== */
async function loadTeacherProfile() {
  try {
    const teacherId = localStorage.getItem("teacher_id");
    if (!teacherId) return;
    const data = await readData(`users/teachers/${teacherId}`);
    if (!data) return;
    const p = data.profile || {};
    document.getElementById("gvName").innerText = p.ho_ten || "—";
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