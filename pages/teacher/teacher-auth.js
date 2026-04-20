import { registerUser, loginUser } from "../../scripts/core/authService.js";
import { readData } from "../../scripts/services/firebaseService.js";


window.register = async function () {
  const u = username.value.trim();
  const p = password.value;
  const r = repass.value;
  const msg = document.getElementById("msg");

  if (!u || !p) return msg.innerText = "Thiếu thông tin";
  if (p !== r) return msg.innerText = "Mật khẩu không khớp";

  try {
    const id = await registerUser("teachers", u, p);

    localStorage.setItem("teacher_id", id);
    window.location = "hosogiaovien.html";

  } catch (e) {
    msg.innerText = e;
  }
};


window.login = async function () {

  const u = username.value.trim();
  const p = password.value;
  const msg = document.getElementById("msg");

  try {

    const user = await loginUser("teachers", u, p);

    // Giữ teacher_id để teacher page không bắt login lại
    localStorage.setItem("teacher_id", user.id);

    // 🔥 ĐỌC PROFILE ĐÚNG ĐƯỜNG DẪN
    const profile = await readData("users/teachers/" + user.id + "/profile");

    if (!profile) {
      throw "Không tìm thấy hồ sơ giáo viên";
    }

    // 🔥 LƯU SESSION CHO INDEX HIỂN THỊ
    localStorage.setItem("teacher_login", JSON.stringify({
  id: user.id,
  ho_ten: profile.ho_ten || "",
  avatar: profile.avatar.startsWith("data:")
           ? profile.avatar
           : "data:image/jpeg;base64," + profile.avatar
}));

    window.location = "../../index.html";

  } catch (e) {
    msg.innerText = e;
  }

};