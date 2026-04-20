import { readData, updateData }
from "../../../scripts/services/firebaseService.js";


/* ===== SESSION ===== */
const student = JSON.parse(localStorage.getItem("studentLogin"));

if (!student) {
  location.href = "../../index.html";
}

const studentId = student.id;


/* ===== DOM ===== */
const oldPass = document.getElementById("oldPass");
const newPass = document.getElementById("newPass");
const toast = document.getElementById("toast");

/* ===== HASH SHA-256 ===== */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/* ===== TOAST ===== */
function showToast(message, ok = true) {
  toast.innerText = message;
  toast.style.display = "block";
  toast.style.position = "fixed";
  toast.style.top = "20px";
  toast.style.right = "20px";
  toast.style.padding = "10px 16px";
  toast.style.borderRadius = "6px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,.15)";
  toast.style.zIndex = 9999;

  toast.style.background = ok ? "#e8f5e9" : "#ffebee";
  toast.style.color = ok ? "#2e7d32" : "#c62828";

  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

/* ===== ĐỔI PASS ===== */
window.changePass = async function () {
  try {

    if (!oldPass.value || !newPass.value) {
      showToast("Vui lòng nhập đầy đủ thông tin", false);
      return;
    }

    if (newPass.value.length < 6) {
      showToast("Mật khẩu mới phải >= 6 ký tự", false);
      return;
    }

    const authPath = `users/students/${studentId}/auth`;
    const authData = await readData(authPath);

    if (!authData) {
      showToast("Không tìm thấy tài khoản", false);
      return;
    }

    const oldHash = await hashPassword(oldPass.value);

    if (oldHash !== authData.pass_hash) {
      showToast("Mật khẩu cũ không đúng", false);
      return;
    }

    const newHash = await hashPassword(newPass.value);

    await updateData(authPath, {
      pass_hash: newHash,
      updated_at: Date.now()
    });

    showToast("Đổi mật khẩu thành công");

    oldPass.value = "";
    newPass.value = "";

  } catch (e) {
    console.error(e);
    showToast("Có lỗi xảy ra", false);
  }
};

/* ===== BACK ===== */
window.goBack = function () {
  location.href = "hocvien.html";
};