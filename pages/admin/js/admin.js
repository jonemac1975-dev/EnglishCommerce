if (sessionStorage.getItem("admin_login") !== "true") {
  location.href = "./adminlogin.html";
}


const content = document.getElementById("adContent");
const menuItems = document.querySelectorAll(".menu-item");

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


menuItems.forEach(item => {
  item.onclick = () => {
    menuItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    loadTab(item.dataset.tab);
  };
});

window.adminchange = () => {
  location.href = "./adminchange.html";
};


window.goHome = () => location.href = "../../index.html";

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

document.querySelectorAll(".menu-group").forEach(group => {

  group.addEventListener("click", () => {

    const children = group.nextElementSibling;

    if (!children) return;

    const isOpen = children.classList.contains("open");

    // 👉 đóng tất cả trước (nếu muốn accordion 1 cái mở)
    document.querySelectorAll(".menu-children").forEach(c => {
      c.classList.remove("open");
    });

    document.querySelectorAll(".menu-group").forEach(g => {
      g.classList.remove("active");
    });

    // 👉 nếu đang đóng thì mở
    if (!isOpen) {
      children.classList.add("open");
      group.classList.add("active");
    }

  });

});