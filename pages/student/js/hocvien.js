/* ===== SESSION ===== */
const student = JSON.parse(localStorage.getItem("studentLogin"));

if (!student) {
 location.href = "../../index.html";
}

/* ===== DOM ===== */
const content = document.getElementById("content");
const menuItems = document.querySelectorAll(".menu-item");

/* ===== LOAD TAB ===== */
async function loadTab(tab) {

  // load html
  const res = await fetch(`./tab/${tab}.html`);
  content.innerHTML = await res.text();

  // load js tab
  try {
    const module = await import(`./${tab}.js`);
    if (module.init) {
      module.init();
    }
  } catch (err) {
    
  }
}

/* ===== MENU CLICK ===== */
menuItems.forEach(item => {
  item.onclick = () => {
    menuItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    loadTab(item.dataset.tab);
  };
});

/* ===== HEADER ACTION ===== */
window.openProfile = () => {
  location.href = "hosohocvien.html";
};

window.openChangePass = () => {
  location.href = "hvdoipass.html";
};

window.goHome = () => location.href = "../../index.html";

/* ===== INIT ===== */
loadTab("hocvienpreview");

