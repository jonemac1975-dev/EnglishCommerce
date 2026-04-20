import { readData, updateData,writeData }
from "../../../scripts/services/firebaseService.js";

const path = "config/danh_muc/monhoc";

let currentId = null;

const nameInput = document.getElementById("dmName");
const list = document.getElementById("dmList");

//function showMsg(text) {
//  alert(text);
//}

async function loadList() {
  const data = await readData(path);
  list.innerHTML = "";
  if (!data) return;

  let i = 1;
  Object.entries(data).forEach(([id, item]) => {
    list.innerHTML += `
      <tr onclick="selectItem('${id}','${item.name}')">
        <td>${i++}</td>
        <td>${item.name}</td>
      </tr>
    `;
  });
}

window.selectItem = (id, name) => {
  currentId = id;
  nameInput.value = name;
};

window.addItem = async () => {
  const name = nameInput.value.trim();
  if (!name) return showMsg("Nhập tên trước");

  const id = "mh_" + Date.now();
  await updateData(path + "/" + id, {
    name,
    created_at: Date.now()
  });

  nameInput.value = "";
  showToast("Đã thêm");
  loadList();
};

window.saveItem = async () => {
  if (!currentId) return showMsg("Chọn dòng để sửa");

  const name = nameInput.value.trim();
  if (!name) return showMsg("Tên trống");

  await updateData(path + "/" + currentId, {
    name,
    updated_at: Date.now()
  });

  showToast("Đã cập nhật");
  loadList();
};

window.deleteItem = async () => {
  if (!currentId) return showMsg("Chọn dòng để xóa");

  await writeData(path + "/" + currentId, null);

  currentId = null;
  nameInput.value = "";
  showToast("Đã xóa");
  loadList();
};

export function init() {
  loadList();
}
