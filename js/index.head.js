/*************************************************
 * INDEX.HEAD.JS
 * - Hiển thị logo trung tâm
 * - Hiển thị avatar + tên khi đã login
 * - Hỗ trợ cả giáo viên & học viên
 *************************************************/

document.addEventListener("DOMContentLoaded", () => {

  const header = document.getElementById("header");
  if (!header) {
        return;
  }

  /* ================= LOGO TRUNG TÂM ================= */
  const logoCenter = header.querySelector(".logo.big");
  if (logoCenter) {
    logoCenter.src = "/store/logo.png";
  }

  /* ================= AVATAR + TÊN ================= */
  const avatarBox = header.querySelector(".logo.small");
  const nameBox = document.getElementById("userName");

  let gvLogin = null;
  let hvLogin = null;

  try {
    gvLogin = JSON.parse(localStorage.getItem("teacher_login"));
    hvLogin = JSON.parse(localStorage.getItem("student_login"));
  } catch (e) {
      }

    const user = gvLogin || hvLogin;

  if (user) {

    /* ===== Avatar ===== */
    if (user && avatarBox) {

  if (user.avatar && user.avatar.startsWith("data:image")) {
    avatarBox.src = user.avatar;
  } else {
    avatarBox.src = "/store/avatar.png";
  }

  avatarBox.style.display = "block";
}
    /* ===== Tên ===== */
    if (nameBox) {
      nameBox.innerText = user.ho_ten || "Người dùng";
    }

  } else {

    if (avatarBox) avatarBox.style.display = "none";
    if (nameBox) nameBox.innerText = "";

  }

});


