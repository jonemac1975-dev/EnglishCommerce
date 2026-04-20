import { readData } from "../../../scripts/services/firebaseService.js";

/* ===== RESET SESSION KHI VÀO LOGIN ===== */
sessionStorage.removeItem("admin_login");

/* ===== DOM ===== */
const passInput = document.getElementById("adminPass");
const msg = document.getElementById("msg");

document.getElementById("btnOK").onclick = loginAdmin;
document.getElementById("btnCancel").onclick = () => {
  location.href = "../../index.html";
};

/* ===== HASH ===== */
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hashBuffer)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ===== LOGIN ===== */
async function loginAdmin() {
  const pass = passInput.value.trim();
  if (!pass) {
    msg.textContent = "Chưa nhập mật khẩu";
    return;
  }

  try {
    const savedHash = await readData("users/admin/pass");
    if (!savedHash) throw "NO_ADMIN";

    const inputHash = await sha256(pass);

    if (inputHash !== savedHash) {
      location.href = "../../index.html";
      return;
    }

    sessionStorage.setItem("admin_login", "true");
    location.href = "./admin.html";

  } catch (e) {
    msg.textContent = "Lỗi đăng nhập";
  }
}
