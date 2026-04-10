const PPTX_HISTORY_KEY = "pptx_recent_slides";

// Lấy danh sách
export function getRecentSlides() {
  try {
    const raw = JSON.parse(localStorage.getItem(PPTX_HISTORY_KEY) || "[]");

    return raw.map(item => {
      // nếu đã là format mới
      if (item.data) return item;

      // convert format cũ
      return {
        id: item.time || Date.now(),
        title: "AI Slides",
        createdAt: new Date(item.time || Date.now()).toISOString(),
        data: {
          slides: item.slides || []
        }
      };
    });
  } catch {
    return [];
  }
}

// Lưu mới
export function saveRecentSlides(pptData) {
  const list = getRecentSlides();

  const newItem = {
    id: Date.now(),
    title: pptData?.title || "AI Slides",
    createdAt: new Date().toISOString(),
    data: pptData
  };

  const updated = [newItem, ...list].slice(0, 5);

  localStorage.setItem(PPTX_HISTORY_KEY, JSON.stringify(updated));
}

// 🔥 KHÔI PHỤC (QUAN TRỌNG NHẤT)
export function restoreRecentSlide(id) {
  const list = getRecentSlides();

  const found = list.find(item => item.id === id);

  if (!found) {
    console.warn("❌ Không tìm thấy slide để restore");
    return null;
  }

  console.log("✅ Restore:", found);

  return found.data;
}