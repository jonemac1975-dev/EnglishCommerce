import { readData, updateData, writeData }
from "../../../scripts/services/firebaseService.js";

const path = "config/danh_muc/kythi";

let currentId = null;

const nameInput = document.getElementById("dmName");
const thoiGianInput = document.getElementById("dmThoiGian");
const list = document.getElementById("dmList");

async function loadList() {
  const data = await readData(path);
  list.innerHTML = "";
  if (!data) return;

  let i = 1;
  Object.entries(data).forEach(([id, item]) => {
    list.innerHTML += `
      <tr onclick="selectItem('${id}','${item.name}','${item.thoigian || 15}')">
        <td>${i++}</td>
        <td>${item.name}</td>
        <td>${item.thoigian || 15}</td>
      </tr>
    `;
  });
}

window.selectItem = (id, name, thoigian) => {
  currentId = id;
  nameInput.value = name;
  thoiGianInput.value = thoigian;
};

window.addItem = async () => {
  const name = nameInput.value.trim();
  const thoigian = parseInt(thoiGianInput.value) || 15;

  if (!name) return showToast("Nhập tên trước");

  const id = "kt_" + Date.now();

  await updateData(path + "/" + id, {
    name,
    thoigian,
    created_at: Date.now()
  });

  nameInput.value = "";
  thoiGianInput.value = "";
  showToast("Đã thêm");
  loadList();
};

window.saveItem = async () => {
  if (!currentId) return showToast("Chọn dòng để sửa");

  const name = nameInput.value.trim();
  const thoigian = parseInt(thoiGianInput.value) || 15;

  if (!name) return showToast("Tên trống");

  await updateData(path + "/" + currentId, {
    name,
    thoigian,
    updated_at: Date.now()
  });

  showToast("Đã cập nhật");
  loadList();
};

window.deleteItem = async () => {
  if (!currentId) return showToast("Chọn dòng để xóa");

  try {
    await writeData(path + "/" + currentId, null);
    currentId = null;
    nameInput.value = "";
    thoiGianInput.value = "";
    showToast("Đã xóa");
    loadList();
  } catch (e) {
    console.error(e);
    showToast("Lỗi khi xóa dữ liệu");
  }
};

export function init() {
  loadList();
}