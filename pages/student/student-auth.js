import { registerUser, loginUser } from "../../scripts/core/authService.js";
import { readData } from "../../scripts/services/firebaseService.js";

/* ===== ĐĂNG KÝ ===== */
window.register = async function () {
  const u = username.value.trim();
  const p = password.value;
  const r = repass.value;
  const msg = document.getElementById("msg");

  if (!u || !p) return msg.innerText = "Thiếu thông tin";
  if (p !== r) return msg.innerText = "Mật khẩu không khớp";

  try {
    const id = await registerUser("students", u, p);

    // 🔐 LƯU SESSION TẠM
    localStorage.setItem("student_id", id);
    localStorage.setItem("studentLogin", JSON.stringify({
      id
    }));

    // 🔥 ĐIỀU HƯỚNG ĐÚNG: TRANG NHẬP HỒ SƠ
    window.location = "hosohocvien.html";

  } catch (e) {
    msg.innerText = e;
msg.style.display = "block";
  }
};


/* ===== ĐĂNG NHẬP ===== */
window.login = async function () {
  const u = username.value.trim();
  const p = password.value;
  const msg = document.getElementById("msg");

  try {
    const user = await loginUser("students", u, p);

    localStorage.setItem("student_id", user.id);

    // 🔥 CHECK PROFILE
    const profile =
      await readData(`users/students/${user.id}/profile`);

    // 🔐 LƯU LOGIN
    localStorage.setItem("studentLogin", JSON.stringify({
  id: user.id,
  ho_ten: profile?.ho_ten || "",
  avatar: profile?.avatar || "",
  logged: true
}));

    // 👉 CHƯA CÓ PROFILE → NHẬP HỒ SƠ
    if (!profile) {
      window.location = "hosohocvien.html";
      return;
    }

    // 👉 CÓ PROFILE → INDEX
    window.location = "../../index.html";

  } catch (e) {
    msg.innerText = e;
   msg.style.display = "block";
  }
};