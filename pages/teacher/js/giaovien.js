const teacherId = localStorage.getItem("teacher_id");
if (!teacherId) location.href = "gvdangnhap.html";

const content = document.getElementById("content");

/* =========================
   LOAD TAB
========================= */
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
        console.error("❌ Lỗi import tab JS:", e);
      });

  } catch (e) {
    console.error("❌ Load tab lỗi:", tab, e);
    content.innerHTML = `<p style="color:red">Chưa có nội dung cho tab này</p>`;
  }
}

/* =========================
   MENU CLICK
========================= */
function bindMenu() {
  const menuItems = document.querySelectorAll(".menu-item");

  menuItems.forEach(item => {
    item.onclick = () => {

      // active
      menuItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      // open group
      const parent = item.closest(".menu-children");
      if (parent) {
        document.querySelectorAll(".menu-children")
          .forEach(el => el.classList.remove("open"));
        parent.classList.add("open");
      }

      // load tab
      loadTab(item.dataset.tab);

      // 🔥 AUTO CLOSE MENU MOBILE
      const menu = document.querySelector(".gv-menu");
      if (window.innerWidth <= 768) {
        menu?.classList.remove("open");
      }
    };
  });
}

/* =========================
   HEADER ACTION
========================= */
window.openProfile = () => {
  location.href = "hosogiaovien.html";
};

window.openChangePass = () => {
  location.href = "gvdoipass.html";
};

window.goHome = () => location.href = "../../index.html";

/* =========================
   TOAST
========================= */
window.showToast = function (message, type = "info", time = 2500) {
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

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {

  // menu toggle mobile
  const menu = document.querySelector(".gv-menu");
  const btn = document.querySelector(".menu-toggle");

  btn?.addEventListener("click", () => {
    menu?.classList.toggle("open");
  });

  // group toggle
  const groups = document.querySelectorAll(".menu-group");
  const childrenList = document.querySelectorAll(".menu-children");

  groups.forEach(group => {
    group.onclick = () => {
      const children = group.nextElementSibling;
      if (!children) return;

      const isOpen = children.classList.contains("open");

      childrenList.forEach(c => c.classList.remove("open"));

      if (!isOpen) {
        children.classList.add("open");
      }
    };
  });

  // bind menu items
  bindMenu();

  // mở group đầu tiên
  document.querySelector(".menu-children")?.classList.add("open");

  // load default tab
  loadTab("giaovienview");
});


import { initChat } from "../../chat/chat.js";

document.addEventListener("DOMContentLoaded", () => {
  initChat(teacherId, "teacher");
});