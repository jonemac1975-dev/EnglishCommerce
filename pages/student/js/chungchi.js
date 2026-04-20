import { readData } from "../../../scripts/services/firebaseService.js";

const student = JSON.parse(localStorage.getItem("studentLogin"));

init();

async function init() {

  if (!student) return;

  // ===== Load profile học viên =====
  const profile =
    await readData(`users/students/${student.id}/profile`);

  if (!profile) return;

  // ===== Load chứng chỉ =====
  const data =
    await readData("tieubieu/chungchihv");

  if (!data) return;

  const ds = Object.values(data)
    .filter(item => item.hocvien === student.id);

  if (ds.length === 0) return;

  const item = ds[0]; // vì mỗi học viên 1 chứng chỉ

  // ===== Đổ dữ liệu ra giao diện =====
  document.getElementById("ccName").innerText =
    profile.ho_ten;

  document.getElementById("ccThanhTich").innerText =
    item.thanhtich;

  document.getElementById("ccThang").innerText =
    item.thang;
const avatar = document.getElementById("ccAvatar");
if (avatar && item.img) avatar.src = item.img;

}