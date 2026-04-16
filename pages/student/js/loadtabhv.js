import { readData } from "../../../scripts/services/firebaseService.js";

/* ===== LOAD PROFILE ===== */
async function loadstudentProfile() {
  try {
    const studentId = localStorage.getItem("student_id");
    if (!studentId) return;
    const data = await readData(`users/students/${studentId}`);
    if (!data) return;
    const p = data.profile || {};
    document.getElementById("pvName").innerText = p.ho_ten || "—";
    if (p.avatar) {
      document.getElementById("pvAvatar").src = p.avatar;
    }

  } catch (error) {
    console.error("Load teacher profile error:", error);
  }
}

/* ===== INIT ===== */
export function init() {
  loadstudentProfile();
}