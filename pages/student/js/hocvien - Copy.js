/* ===== SESSION ===== */
const student = JSON.parse(localStorage.getItem("studentLogin"));

if (!student) {
  location.href = "../../index.html";
}

/* ===== DOM ===== */
const content = document.getElementById("content");
const menuItems = document.querySelectorAll(".menu-item");
const menu = document.querySelector(".hv-menu");

/* ===== LOAD TAB ===== */
async function loadTab(tab) {
  try {
    const res = await fetch(`./tab/${tab}.html`);
    content.innerHTML = await res.text();

    const module = await import(`./${tab}.js`);
    module?.init?.();

  } catch (err) {
    console.warn("Tab load error:", err);
  }
}

/* ===== ACTIVE MENU ===== */
function setActive(item) {
  menuItems.forEach(i => i.classList.remove("active"));
  item.classList.add("active");
}

/* ===== MENU CLICK (CHỈ 1 LẦN DUY NHẤT) ===== */
menuItems.forEach(item => {
  item.addEventListener("click", () => {
    setActive(item);
    loadTab(item.dataset.tab);

    // auto close mobile
    if (menu) menu.classList.remove("open");
  });
});

/* ===== TOGGLE MENU MOBILE ===== */
window.toggleMenu = function () {
  menu?.classList.toggle("open");
};

/* ===== HEADER ACTION ===== */
window.openProfile = () => {
  location.href = "hosohocvien.html";
};

window.openChangePass = () => {
  location.href = "hvdoipass.html";
};

window.goHome = () => {
  location.href = "../../index.html";
};

/* ===== INIT ===== */
loadTab("hocvienpreview");