const AI_DRAFT_KEY = "teacher_ai_draft_history";
const MAX_DRAFTS = 5;

export function saveAIDraft(draft = {}) {
  try {
    const oldList = loadAIDraftHistory();

    const item = {
      id: "ai_" + Date.now(),
      type: draft.type || "lesson",
      title: draft.title || "AI Draft",
      prompt: draft.prompt || "",
      raw: draft.raw || "",
      html: draft.html || "",
      plainText: draft.plainText || draft.raw || "",
      createdAt: Date.now()
    };

    // bỏ bản trùng nội dung gần nhất
    const filtered = oldList.filter(x => x.raw !== item.raw);

    const next = [item, ...filtered].slice(0, MAX_DRAFTS);
    localStorage.setItem(AI_DRAFT_KEY, JSON.stringify(next));

    // giữ tương thích cũ: draft mới nhất
    localStorage.setItem("teacher_ai_draft", JSON.stringify({
      type: item.type,
      text: item.raw,
      payload: {},
      provider: "local_history",
      fakeMode: true,
      created_at: item.createdAt
    }));

    return item;
  } catch (err) {
    console.warn("saveAIDraft error:", err);
    return null;
  }
}

export function loadAIDraft() {
  const list = loadAIDraftHistory();
  return list[0] || null;
}

export function loadAIDraftHistory() {
  try {
    return JSON.parse(localStorage.getItem(AI_DRAFT_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearAIDraft() {
  localStorage.removeItem(AI_DRAFT_KEY);
  localStorage.removeItem("teacher_ai_draft");
}

export function removeAIDraftById(id = "") {
  const list = loadAIDraftHistory().filter(x => x.id !== id);
  localStorage.setItem(AI_DRAFT_KEY, JSON.stringify(list));
}