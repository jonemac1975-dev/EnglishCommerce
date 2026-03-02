import { readData } from "../../../scripts/services/firebaseService.js";

export async function init() {

  const student = JSON.parse(localStorage.getItem("studentLogin") || "null");

  if (!student) {
    alert("Không tìm thấy thông tin học viên");
    return;
  }

  const data = await readData(`users/students/${student.id}/profile`);
  if (!data) return;

  /* ===== LOAD DANH MỤC LỚP ===== */
  const lopMap = await readData("config/danh_muc/lop") || {};

  /* ===== LEFT ===== */
  document.getElementById("pvAvatar").src =
    data.avatar || "https://via.placeholder.com/150";

  document.getElementById("pvHoTen").innerText = data.ho_ten || "";
  document.getElementById("pvGioiTinh").innerText = data.gioi_tinh || "";
  document.getElementById("pvNgaySinh").innerText = data.ngay_sinh || "";

  /* ===== RIGHT ===== */
  document.getElementById("pvId").innerText = student.id;
  document.getElementById("pvDienThoai").innerText = data.dien_thoai || "";
  document.getElementById("pvGmail").innerText = data.gmail || "";
  document.getElementById("pvFacebook").innerText = data.facebook || "";
  document.getElementById("pvZalo").innerText = data.zalo || "";
  document.getElementById("pvTruong").innerText = data.truong_hoc || "";

  /* ===== MAP LỚP ID → NAME ===== */
  let lopText = data.lop || "";

  if (lopText && lopMap[lopText]) {
    lopText = lopMap[lopText].name || lopText;
  }

  document.getElementById("pvLop").innerText = lopText;

  /* ===== MÔN HỌC ===== */
  if (Array.isArray(data.mon_hoc)) {

    if (data.mon_hoc.includes("TiengAnh"))
      document.getElementById("monTiengAnh").classList.add("mon-active");

    if (data.mon_hoc.includes("NguVan"))
      document.getElementById("monNguVan").classList.add("mon-active");

    if (data.mon_hoc.includes("ToanLyHoa"))
      document.getElementById("monToanLyHoa").classList.add("mon-active");
  }
}
