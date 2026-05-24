import { readData, updateData,writeData }
from "../../../scripts/services/firebaseService.js";

const path = "config/danh_muc/theloainhac";

let currentId = null;

const nameInput = document.getElementById("dmName");
const list = document.getElementById("dmNhac");


async function loadList() {

  const data = await readData(path);

  list.innerHTML = "";

  if (!data) return;

  let i = 1;

  Object.entries(data).forEach(([id, item]) => {

    const tr = document.createElement("tr");

    tr.onclick = () => selectItem(id, item.name);

    tr.innerHTML = `
      <td>${i++}</td>
      <td>${item.name}</td>
    `;

    list.appendChild(tr);

  });
}

window.selectItem = (id, name) => {
  currentId = id;
  nameInput.value = name;
};

window.addItem = async () => {
  const name = nameInput.value.trim();
  if (!name) return showToast("Nhập tên trước");

  const id = "nh_" + Date.now();
  await updateData(path + "/" + id, {
    name,
    created_at: Date.now()
  });

  nameInput.value = "";
  showToast("Đã thêm");
  loadList();
};

window.saveItem = async () => {
  if (!currentId) return showToast("Chọn dòng để sửa");

  const name = nameInput.value.trim();
  if (!name) return showToast("Tên trống");

  await updateData(path + "/" + currentId, {
    name,
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

init();
