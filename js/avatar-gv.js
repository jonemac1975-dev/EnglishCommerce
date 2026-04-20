/*************************************************
 * AVATAR GIÁO VIÊN – INDEX
 * - Không dùng Firebase Auth
 * - Chỉ đọc teacherId đã login
 * - Load avatar từ Realtime DB
 *************************************************/

import { readData } from "../scripts/services/firebaseService.js";

const logoGV = document.querySelector(".logo.small");

async function loadTeacherAvatar() {
  if (!logoGV) return;

  // teacherId đã lưu khi đăng nhập giáo viên
  const teacherId = localStorage.getItem("teacherId");
  if (!teacherId) return;

  const avatar = await readData(`users/teachers/${teacherId}/profile/avatar`);
  if (!avatar) return;

  // Đổi div thành avatar
  logoGV.innerHTML = "";
  const img = document.createElement("img");
  img.src = avatar;
  img.alt = "Giáo viên";
  img.style.width = "48px";
  img.style.height = "48px";
  img.style.borderRadius = "50%";
  img.style.objectFit = "cover";

  logoGV.appendChild(img);
}

loadTeacherAvatar();
