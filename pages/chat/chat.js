import { db } from "../../config/firebaseConfig.js";
import {
  ref,
  onValue,
  push,
  update,
  onDisconnect,
  query,
  limitToLast,
  endBefore,
  get,
  set,
  remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

let currentUser, role, currentChatUser;
let unsubscribeMsg = null;
let lastKey = null;
let loadingMore = false;
let unreadCount = 0;

/* INIT */
export function initChat(userId, userRole) {
  currentUser = userId;
  role = userRole;

  setTimeout(() => {
    bindUI();
    loadUsers();
    setOnline();
  }, 0);
}

/* UI */
function bindUI() {
  const toggle = document.getElementById("chat-toggle");
  const container = document.getElementById("chat-container");
  const input = document.getElementById("chat-text");

  toggle.onclick = () => {
    container.classList.toggle("hidden");
    unreadCount = 0;
    updateBadge();
  };

  document.getElementById("close-chat").onclick = () =>
    container.classList.add("hidden");

  document.getElementById("back-chat").onclick = () =>
    document.getElementById("chat-box").classList.add("hidden");

  document.getElementById("send-btn").onclick = sendMessage;

  // ✅ KEYDOWN
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();

    sendTyping(true);
    clearTimeout(input._typingTimer);
    input._typingTimer = setTimeout(() => sendTyping(false), 1500);
  });

  // ✅ CHẶN PASTE ẢNH
  input.addEventListener("paste", e => {
    const items = e.clipboardData.items;

    for (let item of items) {
      if (item.type.startsWith("image")) {
        e.preventDefault();
        alert("Không được dán ảnh vào chat");
        return;
      }
    }
  });

  // ✅ CHẶN DRAG ẢNH
  input.addEventListener("drop", e => {
    e.preventDefault();
    alert("Không được kéo thả ảnh");
  });

  // SEARCH
  document.getElementById("chat-search").oninput = e => {
    filterUsers(e.target.value.toLowerCase());
  };
}

/* USERS */
function loadUsers() {
  const path =
    role === "teacher" ? "users/students" : "users/teachers";

  onValue(ref(db, path), snap => {
    const data = snap.val();
    const list = document.getElementById("chat-list");

    list.innerHTML = "";

    if (!data) return;

    Object.entries(data).forEach(([id, u]) => {
      if (id === currentUser) return;

      const name = u?.profile?.ho_ten || "User";
      const avatar = u?.profile?.avatar;

      const div = document.createElement("div");
      div.className = "chat-user";

      // ✅ fallback nếu không có avatar
      const avatarHTML = avatar
        ? `<img src="${avatar}" alt="avatar"
               onerror="this.style.display='none'; this.parentNode.innerHTML='${name.charAt(0)}'">`
        : name.charAt(0);

      div.innerHTML = `
        <div class="avatar">${avatarHTML}</div>
        <div class="name">${name}</div>
        ${u.online ? '<div class="online-dot"></div>' : ''}
      `;

      div.onclick = () => openChat(id, name);

      list.appendChild(div);
    });
  });
}

/* OPEN CHAT */

let unsubscribeTyping = null;

function openChat(userId, name) {
  currentChatUser = userId;

  // ✅ reset đúng chỗ
  lastKey = null;
  loadingMore = false;

  document.getElementById("chat-box").classList.remove("hidden");
  document.getElementById("chat-name").innerText = name;

  const box = document.getElementById("chat-messages");
  box.innerHTML = "";

  const convId = getConvId(currentUser, userId);
  const baseRef = ref(db, `chats/${convId}/messages`);

  // ✅ unsubscribe message
  if (unsubscribeMsg) {
    unsubscribeMsg();
    unsubscribeMsg = null;
  }

  // ✅ unsubscribe typing
  if (unsubscribeTyping) {
    unsubscribeTyping();
    unsubscribeTyping = null;
  }

  const q = query(baseRef, limitToLast(20));

  unsubscribeMsg = onValue(q, snap => {
    const data = snap.val() || {};
    box.innerHTML = "";

    const keys = Object.keys(data);
    lastKey = keys.length ? keys[0] : null;

    renderMessages(data);
  });

  // ✅ typing listener
  unsubscribeTyping = listenTyping(convId);

  // cleanup nhẹ
  if (Math.random() < 0.1) {
    cleanupOldMessages(convId);
  }

  setupScrollLoad(convId);
}

/* SCROLL LOAD */
function setupScrollLoad(convId) {
  const box = document.getElementById("chat-messages");

  box.onscroll = async () => {
    if (box.scrollTop === 0 && !loadingMore && lastKey) {
      loadingMore = true;

      const q = query(
        ref(db, `chats/${convId}/messages`),
        endBefore(lastKey),
        limitToLast(20)
      );

      const snap = await get(q);
      const data = snap.val() || {};

      if (Object.keys(data).length) {
        lastKey = Object.keys(data)[0];
        renderMessages(data, true);
      }

      loadingMore = false;
    }
  };
}

/* SEND */
let lastSend = 0;

function sendMessage() {
  if (Date.now() - lastSend < 500) return;
  lastSend = Date.now();

  const input = document.getElementById("chat-text");
  const text = input.value.trim();

  if (!currentChatUser) return alert("Chọn người chat");
  if (!isValidMessage(text)) return;

  const convId = getConvId(currentUser, currentChatUser);
  const msgRef = ref(db, `chats/${convId}/messages`);

  push(msgRef, {
    senderId: currentUser,
    text,
    time: Date.now()
  });

  // cleanup nhẹ
  limitMessages(convId).catch(console.error);

  input.value = "";
}

/* VALID */
function isValidMessage(text) {
  if (!text) return false;

  // ❌ giới hạn 200 → nâng lên 500 nếu bạn muốn
  if (text.length > 500) {
    alert("Tối đa 500 ký tự");
    return false;
  }

  // ❌ chặn tất cả dạng ảnh (đuôi + data base64)
  if (
    /\.(jpg|jpeg|png|gif|webp|bmp|svg)/i.test(text) ||
    text.startsWith("data:image")
  ) {
    alert("Không được gửi ảnh");
    return false;
  }

  return true;
}


async function limitMessages(convId) {
  const MAX = 500;

  const snap = await get(
    query(ref(db, `chats/${convId}/messages`), limitToLast(MAX + 50))
  );

  const data = snap.val();
  if (!data) return;

  const keys = Object.keys(data);

  if (keys.length > MAX) {
    const removeList = keys.slice(0, keys.length - MAX);

    removeList.forEach(k => {
      remove(ref(db, `chats/${convId}/messages/${k}`));
    });
  }
}


/* TYPING */
function sendTyping(val) {
  if (!currentChatUser) return;

  const convId = getConvId(currentUser, currentChatUser);
  set(ref(db, `typing/${convId}/${currentUser}`), val);
}

function listenTyping(convId) {
  return onValue(ref(db, `typing/${convId}`), snap => {
    const data = snap.val() || {};

    const typing = Object.entries(data).some(
      ([id, val]) => id !== currentUser && val
    );

    let el = document.getElementById("typing");

    if (typing && !el) {
      el = document.createElement("div");
      el.id = "typing";
      el.innerText = "Đang nhập...";
      document.getElementById("chat-messages").appendChild(el);
    }

    if (!typing) el?.remove();
  });
}

/* ONLINE */
function setOnline() {
  const path =
    role === "teacher"
      ? `users/teachers/${currentUser}`
      : `users/students/${currentUser}`;

  const userRef = ref(db, path);
  update(userRef, { online: true });
  onDisconnect(userRef).update({ online: false });
}

/* CLEAN */
async function cleanupOldMessages(convId) {
  const LIMIT_TIME = 30 * 24 * 60 * 60 * 1000;

  const snap = await get(
    query(ref(db, `chats/${convId}/messages`), limitToLast(500))
  );

  const data = snap.val();
  if (!data) return;

  const now = Date.now();

  Object.entries(data).forEach(([k, m]) => {
    if (now - m.time > LIMIT_TIME) {
      remove(ref(db, `chats/${convId}/messages/${k}`));
    }
  });
}

/* SEARCH */
function filterUsers(keyword) {
  document.querySelectorAll(".chat-user").forEach(u => {
    u.style.display = u.innerText.toLowerCase().includes(keyword)
      ? "flex"
      : "none";
  });
}

/* DARK MODE */
window.toggleDarkMode = function () {
  document.body.classList.toggle("dark");
};

/* BADGE */
function updateBadge() {
  const badge = document.getElementById("chat-badge");
  if (!badge) return;

  if (unreadCount > 0) {
    badge.innerText = unreadCount;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

/* UTIL */
function getConvId(a, b) {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

/* RENDER */
function renderMessages(data, prepend = false) {
  const box = document.getElementById("chat-messages");

  const msgs = Object.values(data).sort((a, b) => a.time - b.time);

  msgs.forEach(m => {
    const div = document.createElement("div");

    div.className = "msg " + (m.senderId === currentUser ? "me" : "");

    div.innerHTML = `
      <div class="bubble">${m.text}</div>
      <div class="time">${formatTime(m.time)}</div>
    `;

    if (prepend) box.prepend(div);
    else box.appendChild(div);
  });

  if (!prepend) {
    box.scrollTop = box.scrollHeight;
  }
}

function formatTime(t) {
  const d = new Date(t);
  return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
}


window.toggleDarkMode = function () {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", isDark);
};

if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
}