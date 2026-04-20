// /pages/teacher/js/wordReader.js

export async function readWordFile(file) {
  if (!file) {
    throw new Error("Không có file để đọc.");
  }

  const fileName = String(file.name || "").toLowerCase();
  const fileSizeMB = file.size / (1024 * 1024);

  if (fileSizeMB > 5) {
    throw new Error("File quá nặng. Chỉ nên dùng file dưới 5MB.");
  }

  // TXT
  if (fileName.endsWith(".txt")) {
    return await readTextFile(file);
  }

  // DOCX
  if (fileName.endsWith(".docx")) {
    return await readDocxFile(file);
  }

  // DOC cũ thì báo nhẹ nhàng
  if (fileName.endsWith(".doc")) {
    throw new Error("File .doc cũ chưa hỗ trợ tốt. Hãy lưu lại thành .docx rồi thử lại.");
  }

  // PDF chưa parse local trong V1
  if (fileName.endsWith(".pdf")) {
    throw new Error("V1 chưa hỗ trợ đọc PDF upload trực tiếp. Hãy dán nội dung hoặc dùng .docx / .txt.");
  }

  throw new Error("Định dạng file chưa hỗ trợ. Hãy dùng .docx hoặc .txt.");
}

export async function extractDriveTextMock({
  wordUrl = "",
  pdfUrl = ""
} = {}) {
  const w = String(wordUrl || "").trim();
  const p = String(pdfUrl || "").trim();

  if (!w && !p) {
    throw new Error("Chưa có link Google Drive để xử lý.");
  }

  // V1 chỉ mock hướng xử lý, chưa fetch trực tiếp từ Drive
  let out = "DỮ LIỆU MÔ PHỎNG TỪ GOOGLE DRIVE\n\n";

  if (w) {
    out += `Nguồn Word: ${w}\n`;
  }

  if (p) {
    out += `Nguồn PDF: ${p}\n`;
  }

  out += `
Lưu ý:
- Phiên bản V1 hiện chỉ mô phỏng đọc link Google Drive.
- Nếu muốn AI tạo slide chính xác hơn, nên:
  1) tải file về máy rồi upload .docx
  2) hoặc copy nội dung Word/PDF và dán trực tiếp
  3) hoặc sau này tích hợp Drive API / Cloud Function để đọc thật

Nội dung mẫu:
- Đây là phần nội dung được lấy giả lập từ tài liệu Word/PDF.
- Giáo viên có thể dùng để tạo bài giảng slide.
- Hệ thống sẽ chuyển nội dung này thành JSON slide rồi xuất PPTX.
  `.trim();

  return out.trim();
}

/* =========================
   INTERNAL HELPERS
========================= */

async function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = String(reader.result || "").trim();

        if (!text) {
          reject(new Error("File TXT không có nội dung."));
          return;
        }

        resolve(cleanText(text));
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Không đọc được file TXT."));
    reader.readAsText(file, "utf-8");
  });
}

async function readDocxFile(file) {
  if (!window.mammoth) {
    throw new Error("Thiếu thư viện Mammoth để đọc file .docx");
  }

  const buffer = await file.arrayBuffer();

  const result = await window.mammoth.extractRawText({ arrayBuffer: buffer });
  const text = String(result?.value || "").trim();

  if (!text) {
    throw new Error("Không đọc được nội dung từ file DOCX.");
  }

  return cleanText(text);
}

function cleanText(text = "") {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}