import { readData, writeData } from "../../../scripts/services/firebaseService.js";

/* ===== CHỐNG VÀO NGANG ===== */
if (sessionStorage.getItem("admin_login") !== "true") {
  location.href = "../../index.html";
}

/* ===== DOM ===== */
const msg = document.getElementById("msg");

document.getElementById("btnOK").onclick = changePass;
document.getElementById("btnCancel").onclick = () => history.back();

/* ===== HASH ===== */
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hashBuffer)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ===== CHANGE PASS ===== */
async function changePass() {
  const oldPass = document.getElementById("oldPass").value.trim();
  const newPass = document.getElementById("newPass").value.trim();

  if (!oldPass || !newPass) {
    showMsg("Thiếu thông tin", "red");
    return;
  }

  try {
    const savedHash = await readData("users/admin/pass");
    const oldHash = await sha256(oldPass);

    if (savedHash !== oldHash) {
      sessionStorage.clear();
      location.href = "../../index.html";
      return;
    }

    const newHash = await sha256(newPass);
    await writeData("users/admin/pass", newHash);

    showToast("Pass đã thay đổi thành công");
    document.getElementById("oldPass").value = "";
    document.getElementById("newPass").value = "";

  } catch (e) {
    showMsg("Lỗi đổi pass", "red");
  }
}

/* ===== UI ===== */
function showMsg(text, color) {
  msg.textContent = text;
  msg.style.color = color;
}

function showToast(text) {
  const toast = document.createElement("div");
  toast.textContent = text;
  toast.style.cssText = `
    position:fixed;
    bottom:20px;
    right:20px;
    background:#2ecc71;
    color:#fff;
    padding:10px 16px;
    border-radius:6px;
    z-index:9999;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}
