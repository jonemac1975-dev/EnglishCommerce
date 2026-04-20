import { readData, writeData } from "../../../scripts/services/firebaseService.js";

export async function init() {
  const teacherId = localStorage.getItem("teacher_id");
  if (!teacherId) {
    alert("❌ Không tìm thấy giáo viên");
    return;
  }

  const titleInput   = document.getElementById("headTitle");
  const teacherInput = document.getElementById("headTeacher");
  const sloganInput  = document.getElementById("headSlogan");

  const btnSave    = document.getElementById("btnSaveHead");
  const btnReset   = document.getElementById("btnResetHead");
  const previewBox = document.getElementById("headPreview");

  if (!titleInput || !teacherInput || !sloganInput || !btnSave) return;

  // ===== MẶC ĐỊNH GỐC =====
  const DEFAULT_HEAD = {
    title: "CHƯƠNG TRÌNH ĐÀO TẠO CHUYÊN NGÀNH CHẾ BIẾN MÓN ĂN",
    teacher: "Program Editor: Trần Thị Ngọc Dư - Nguyễn Huỳnh Ngọc Thanh",
    slogan: "Welcome To College of Commerce"
  };

  let isEditMode = false;

  // =========================
  // LOAD DATA CŨ
  // =========================
  async function loadData() {
    try {
      const data = await readData(`teacher/${teacherId}/doihead`);

      titleInput.value   = data?.title   || "";
      teacherInput.value = data?.teacher || "";
      sloganInput.value  = data?.slogan  || "";

      renderPreview();
      setReadonly(true);
      setButtonState("view");
    } catch (err) {
      console.error("Lỗi load doihead:", err);
    }
  }

  // =========================
  // PREVIEW
  // =========================
  function getPreviewData() {
    return {
      title: titleInput.value.trim() || DEFAULT_HEAD.title,
      teacher: teacherInput.value.trim() || DEFAULT_HEAD.teacher,
      slogan: sloganInput.value.trim() || DEFAULT_HEAD.slogan
    };
  }

  function renderPreview() {
    if (!previewBox) return;

    const p = getPreviewData();

    previewBox.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #fff8e1, #fff3bf);
        border: 1px solid #f3d27a;
        border-radius: 14px;
        padding: 18px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.08);
      ">
        <h2 style="margin:0 0 10px;color:#d9480f;">${p.title}</h2>
        <h3 style="margin:0 0 8px;color:#495057;font-weight:600;">${p.teacher}</h3>
        <marquee style="color:#0b7285;font-weight:600;">${p.slogan}</marquee>
      </div>
    `;
  }

  // =========================
  // READONLY
  // =========================
  function setReadonly(lock = true) {
    titleInput.readOnly = lock;
    teacherInput.readOnly = lock;
    sloganInput.readOnly = lock;

    [titleInput, teacherInput, sloganInput].forEach(el => {
      el.style.background = lock ? "#f8f9fa" : "#fff";
      el.style.border = lock ? "1px solid #dee2e6" : "1px solid #fab005";
      el.style.cursor = lock ? "default" : "text";
    });

    isEditMode = !lock;
  }

  // =========================
  // BUTTON UI
  // =========================
  function setButtonState(mode) {
    if (!btnSave) return;

    if (mode === "view") {
      btnSave.textContent = "✏️ Sửa";
      btnSave.style.background = "#f59f00";
    }

    if (mode === "edit") {
      btnSave.textContent = "💾 Lưu cập nhật";
      btnSave.style.background = "#2f9e44";
    }

    if (mode === "saved") {
      btnSave.textContent = "✅ Đã lưu";
      btnSave.style.background = "#2b8a3e";

      setTimeout(() => {
        btnSave.textContent = "✏️ Sửa";
        btnSave.style.background = "#f59f00";
      }, 1500);
    }
  }

  // =========================
  // APPLY HEADER NGAY LẬP TỨC
  // =========================
  function applyHeaderToMain() {
    const p = getPreviewData();

    const siteTitle   = document.getElementById("siteTitle");
    const siteTeacher = document.getElementById("siteTeacher");
    const siteSlogan  = document.getElementById("siteSlogan");

    if (siteTitle)   siteTitle.textContent = p.title;
    if (siteTeacher) siteTeacher.textContent = p.teacher;
    if (siteSlogan)  siteSlogan.textContent = p.slogan;
  }

  // =========================
  // INPUT LIVE PREVIEW
  // =========================
  [titleInput, teacherInput, sloganInput].forEach(el => {
    el.addEventListener("input", () => {
      renderPreview();
      if (isEditMode) applyHeaderToMain();
    });
  });

  // =========================
  // SAVE / EDIT TOGGLE
  // =========================
  btnSave.onclick = async () => {
    // ===== Bật chế độ sửa =====
    if (!isEditMode) {
      setReadonly(false);
      setButtonState("edit");
      titleInput.focus();
      return;
    }

    // ===== Lưu dữ liệu =====
    try {
      const payload = {
        title: titleInput.value.trim(),
        teacher: teacherInput.value.trim(),
        slogan: sloganInput.value.trim(),
        updated_at: Date.now()
      };

      // 🔥 CHO PHÉP LƯU RỖNG
      await writeData(`teacher/${teacherId}/doihead`, payload);

      // cập nhật giao diện ngay
      renderPreview();
      applyHeaderToMain();

      // khóa lại
      setReadonly(true);
      setButtonState("saved");

      alert("✅ Đã cập nhật Header");
    } catch (err) {
      console.error("Lỗi lưu doihead:", err);
      alert("❌ Lỗi khi lưu Header");
    }
  };

  // =========================
  // RESET MẶC ĐỊNH
  // =========================
  if (btnReset) {
    btnReset.onclick = async () => {
      const ok = confirm("Bạn muốn khôi phục về tiêu đề mặc định?");
      if (!ok) return;

      titleInput.value = "";
      teacherInput.value = "";
      sloganInput.value = "";

      renderPreview();
      applyHeaderToMain();

      try {
        await writeData(`teacher/${teacherId}/doihead`, {
          title: "",
          teacher: "",
          slogan: "",
          updated_at: Date.now()
        });

        setReadonly(true);
        setButtonState("saved");

        alert("✅ Đã khôi phục về mặc định");
      } catch (err) {
        console.error(err);
        alert("❌ Không thể khôi phục");
      }
    };
  }

  await loadData();
}