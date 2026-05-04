console.log("SOAN MON KHAC LOADED");

import { askAI } from "../../../scripts/services/aiService.js";
import { exportPPT } from "./pptGenerator.js";

let slidesData = [];

// ================= INIT =================
export function init() {
  initSoanMonKhac();
}

function initSoanMonKhac() {
  document.getElementById("btnGenerate").onclick = handleGenerate;
  document.getElementById("btnClear").onclick = handleClear;
  document.getElementById("btnExport").onclick = handleExport;

  bindPasteHandler();
  bindFileReader();
}

// ================= PASTE HANDLER =================
function bindPasteHandler() {
  const textarea = document.getElementById("aiContent");

  textarea?.addEventListener("paste", function (e) {
    e.preventDefault();

    let text = (e.clipboardData || window.clipboardData)
      .getData("text/plain");

    text = normalizeWord(text);

    document.execCommand("insertText", false, text);
  });
}

// ================= FILE READER =================
function bindFileReader() {
  const btn = document.getElementById("btnReadFile");

  btn?.addEventListener("click", async () => {
    const file = document.getElementById("aiFile").files[0];
    if (!file) return alert("Chưa chọn file");

    let text = "";

    if (file.name.endsWith(".txt")) {
      text = await file.text();
    }

    if (file.name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({
        arrayBuffer: await file.arrayBuffer()
      });
      text = result.value;
    }

    if (file.name.endsWith(".pdf")) {
      const pdf = await pdfjsLib.getDocument({
        data: await file.arrayBuffer()
      }).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(x => x.str).join(" ") + "\n";
      }
    }

    document.getElementById("aiContent").value = normalizeWord(text);

    showToast("Đọc file thành công", "success");
  });
}

// ================= GENERATE =================
async function handleGenerate() {

  const subject = document.getElementById("aiSubject").value;
  const chapter = document.getElementById("aiChapter").value;
  const lesson = document.getElementById("aiLesson").value;

  const rawContent = document.getElementById("aiContent").value;
  const content = cleanWordText(rawContent);

  const loading = document.getElementById("aiLoading");
  loading.classList.remove("hidden");

  const prompt = `
Bạn là AI giáo viên tạo slide.

Chuyển nội dung thành JSON slide.

QUY TẮC:
- CHỈ JSON
- KHÔNG text ngoài
- 6-8 slide

Nội dung:
${content}

Môn: ${subject}
Bài: ${chapter} - ${lesson}

OUTPUT:
[
  {
    "title": "string",
    "content": ["string"]
  }
]
`;

  try {
    const res = await askAI({
      type: "pptx",
      prompt,
      payload: {
        monHoc: subject,
        chuDe: `${chapter} - ${lesson}`
      }
    });

    let raw = res.text || "";

    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");

    if (start === -1 || end === -1) {
      alert("AI sai format JSON");
      console.error(raw);
      return;
    }

    slidesData = JSON.parse(raw.slice(start, end + 1));

    renderPreview(slidesData);

  } catch (err) {
    console.error(err);
    alert("Lỗi AI");
  } finally {
    loading.classList.add("hidden");
  }
}

// ================= PREVIEW =================
function renderPreview(slides) {
  const box = document.getElementById("aiPreview");
  box.innerHTML = "";

  slides.forEach((s, i) => {

    const title = s?.title || `Slide ${i + 1}`;
    const content = Array.isArray(s?.content)
      ? s.content
      : ["No content"];

    const div = document.createElement("div");
    div.className = "slide-item";

    div.innerHTML = `
      <h3 contenteditable="true">${title}</h3>
      <div contenteditable="true">
        ${content.map(x => "• " + x).join("<br>")}
      </div>
    `;

    box.appendChild(div);
  });
}

// ================= ACTION =================
function handleExport() {
  if (!slidesData.length) return alert("Chưa có dữ liệu");
  exportPPT(slidesData);
}

function handleClear() {
  slidesData = [];
  document.getElementById("aiPreview").innerHTML = "";
}

// ================= UTILS =================
function cleanWordText(text) {
  return text
    .replace(/Ầ|Â|Ã/g, "•")
    .replace(/\u2022/g, "•")
    .replace(/\r/g, "")
    .trim();
}

function normalizeWord(text) {
  return text
    .replace(/[•·●◦]/g, "•")
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, "  ")
    .trim();
}