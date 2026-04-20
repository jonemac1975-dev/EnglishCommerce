// ===== CHECK LOGIN =====
if (sessionStorage.getItem("admin_login") !== "true") {
  location.href = "./adminlogin.html";
}

// ===== DOM READY =====
document.addEventListener("DOMContentLoaded", () => {

  const content = document.getElementById("adContent");
  const menuItems = document.querySelectorAll(".menu-item");

  const menuBtn = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".ad-menu");
  const overlay = document.querySelector(".menu-overlay");

  // ===== LOAD TAB =====
  async function loadTab(tab) {
    try {
      const res = await fetch(`./tab/${tab}.html`);
      if (!res.ok) throw new Error("Tab không tồn tại");

      content.innerHTML = await res.text();

      try {
        const module = await import(`./${tab}.js`);
        module.init?.();
      } catch (e) {
        console.warn("Không có JS cho tab:", tab);
      }

    } catch (e) {
      content.innerHTML = `<p style="color:red">Chưa có nội dung</p>`;
    }
  }

  // ===== MENU CLICK =====
  menuItems.forEach(item => {
    item.onclick = () => {
      menuItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      loadTab(item.dataset.tab);

      // 👉 Mobile: auto đóng menu
      if (window.innerWidth <= 768) {
        menu?.classList.remove("open");
        overlay?.classList.remove("show");
      }
    };
  });

  // ===== MENU GROUP (ACCORDION) =====
  document.querySelectorAll(".menu-group").forEach(group => {
    group.addEventListener("click", () => {
      const children = group.nextElementSibling;
      if (!children) return;

      const isOpen = children.classList.contains("open");

      // đóng hết
      document.querySelectorAll(".menu-children").forEach(c => {
        c.classList.remove("open");
      });

      document.querySelectorAll(".menu-group").forEach(g => {
        g.classList.remove("active");
      });

      // mở cái đang chọn
      if (!isOpen) {
        children.classList.add("open");
        group.classList.add("active");
      }
    });
  });

  // ===== MOBILE MENU =====
  if (menuBtn && menu && overlay) {

    menuBtn.addEventListener("click", () => {
      menu.classList.toggle("open");
      overlay.classList.toggle("show");
    });

    overlay.addEventListener("click", () => {
      menu.classList.remove("open");
      overlay.classList.remove("show");
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        menu.classList.remove("open");
        overlay.classList.remove("show");
      }
    });

  } else {
    console.warn("⚠️ Thiếu menu-toggle hoặc overlay");
  }

});


// ===== GLOBAL FUNCTIONS =====
window.adminchange = () => {
  location.href = "./adminchange.html";
};

window.goHome = () => {
  location.href = "../../index.html";
};

// ===== TOAST =====
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