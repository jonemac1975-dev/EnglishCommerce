const teacherId = localStorage.getItem("teacher_id");
if (!teacherId) location.href = "gvdangnhap.html";

const content = document.getElementById("content");
const menuItems = document.querySelectorAll(".menu-item");

/* ===== LOAD TAB ===== */
async function loadTab(tab) {
  try {
    const res = await fetch(`./tab/${tab}.html`);
    if (!res.ok) throw new Error("Tab không tồn tại");

    content.innerHTML = await res.text();

    import(`./${tab}.js`)
  .then(module => {
        if (module.init) module.init();
  })
  .catch(e => {
    console.error("❌ Lỗi thật sự khi load tab:", e);
  });


  } catch (e) {
    console.error("❌ Load tab lỗi:", tab, e);
    content.innerHTML = `<p style="color:red">Chưa có nội dung cho tab này</p>`;
  }
}

/* ===== MENU CLICK ===== */
menuItems.forEach(item => {
  item.onclick = () => {
  menuItems.forEach(i => i.classList.remove("active"));
  item.classList.add("active");

  const parent = item.closest(".menu-children");
  if (parent) {
    document.querySelectorAll(".menu-children").forEach(el => el.classList.remove("open"));
    parent.classList.add("open");
  }

  loadTab(item.dataset.tab);
};
});

/* ===== HEADER ACTION ===== */
window.openProfile = () => {
  location.href = "hosogiaovien.html";
};

window.openChangePass = () => {
  location.href = "gvdoipass.html";
};

window.goHome = () => location.href = "../../index.html";
/* ===== INIT ===== */
loadTab("giaovienview");
// mở group đầu tiên
document.querySelector(".menu-children")?.classList.add("open");



window.showToast = function(message, type = "info", time = 2500) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerText = message;
  toast.className = "";

  setTimeout(() => {
    toast.classList.add("show", type);
  }, 10);

  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, time);
};


window.addEventListener("DOMContentLoaded", () => {

  const menuItems = document.querySelectorAll(".menu-item");
  const groups = document.querySelectorAll(".menu-group");
  const childrenList = document.querySelectorAll(".menu-children");

  // ===== CLICK GROUP =====
  groups.forEach(group => {
    group.onclick = () => {

      const children = group.nextElementSibling;
      if (!children) return;

      const isOpen = children.classList.contains("open");

      // đóng tất cả
      childrenList.forEach(c => c.classList.remove("open"));

      // mở lại nếu đang đóng
      if (!isOpen) {
        children.classList.add("open");
      }
    };
  });

});