// ========================================
// AI SERVICE - SMART MOCK AI LEVEL 2
// Tương thích hệ thống hiện tại
// Output chuẩn:
// { success: true, text: "..." }
// ========================================

import { AI_TYPES } from "../ai/aiTypes.js";

/* =========================
   HELPERS
========================= */
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalizeText(text = "") {
  return String(text).toLowerCase().trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function num(val, fallback = 10) {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function yesNo(val = "") {
  const t = normalizeText(val);
  return t === "có" || t === "co" || t === "yes" || t === "y";
}

function buildSectionTitle(title) {
  return `${title}`;
}

function safe(val, fallback = "") {
  return String(val || fallback).trim();
}

/* =========================
   MAIN ENTRY
========================= */
export async function askAI({ type = "", prompt = "", payload = {} } = {}) {
  try {
    await sleep(900 + Math.random() * 1200);

    let text = "";

    switch (type) {
      case AI_TYPES.LESSON:
        text = generateLessonContent(prompt, payload);
        break;

      case AI_TYPES.EXERCISE:
        text = generateExerciseContent(prompt, payload);
        break;

      case AI_TYPES.EXAM:
        text = generateExamContent(prompt, payload);
        break;

      case AI_TYPES.TOEIC:
        text = generateToeicContent(prompt, payload);
        break;

      case AI_TYPES.SUMMARY:
        text = generateSummaryContent(prompt, payload);
        break;

      case AI_TYPES.EXPLAIN:
        text = generateExplainContent(prompt, payload);
        break;

      case AI_TYPES.CHAT:
        text = generateChatContent(prompt, payload);
        break;

      default:
        text = generateGeneralContent(prompt, payload);
        break;
    }

    return {
      success: true,
      text
    };
  } catch (error) {
    console.error("❌ askAI mock error:", error);
    return {
      success: false,
      text: "AI giả lập đang hơi bối rối 😅. Anh thử nhập lại yêu cầu rõ hơn giúp em nhé."
    };
  }
}

/* =========================
   LESSON
========================= */
function generateLessonContent(prompt, payload = {}) {
  const monHoc = safe(payload.monHoc, "Tiếng Anh");
  const chuDe = safe(payload.chuDe, "Chủ đề bài học");
  const trinhDo = safe(payload.trinhDo, "Lớp 10");
  const mucTieu = safe(payload.mucTieu);
  const soPhan = num(payload.soPhan, 4);
  const phongCach = safe(payload.phongCach, "Dễ hiểu, thực tế");
  const mucChiTiet = safe(payload.mucChiTiet, "Vừa");
  const ghiChu = safe(payload.ghiChu);
  const duLieuGoc = safe(payload.duLieuGoc);

  const moDau = randomPick([
    `Bài học "${chuDe}" nên được triển khai theo hướng gần gũi, dễ tiếp cận và có ví dụ minh họa rõ ràng.`,
    `Với chủ đề "${chuDe}", giáo viên nên ưu tiên cách dẫn dắt ngắn gọn nhưng có chiều sâu.`,
    `Nội dung "${chuDe}" phù hợp để tổ chức theo kiểu vừa học lý thuyết vừa luyện phản xạ trên lớp.`
  ]);

  return `
📘 GIÁO ÁN AI: ${chuDe.toUpperCase()}

${buildSectionTitle("1. THÔNG TIN CHUNG")}
- Môn học: ${monHoc}
- Trình độ / Lớp: ${trinhDo}
- Chủ đề: ${chuDe}
- Phong cách giảng dạy: ${phongCach}
- Mức chi tiết: ${mucChiTiet}

${buildSectionTitle("2. ĐỊNH HƯỚNG BÀI DẠY")}
- ${moDau}
- Bài học nên được tổ chức theo khoảng ${soPhan} phần chính để học sinh dễ theo dõi.
- Giáo viên nên kết hợp trình bày, hỏi đáp và hoạt động tương tác ngắn.

${buildSectionTitle("3. MỤC TIÊU BÀI HỌC")}
${mucTieu
  ? `- ${mucTieu}`
  : `- Học sinh nắm được kiến thức trọng tâm của chủ đề "${chuDe}".
- Biết áp dụng nội dung vừa học vào bài tập hoặc tình huống thực tế.
- Tăng khả năng phản xạ, trình bày và ghi nhớ bài học.`}

${buildSectionTitle("4. TIẾN TRÌNH DẠY HỌC")}

4.1. Khởi động (5 phút)
- Giáo viên đặt 1–2 câu hỏi dẫn nhập liên quan đến "${chuDe}".
- Học sinh trả lời nhanh để kích hoạt kiến thức nền.
- Có thể dùng ví dụ đời sống hoặc tình huống quen thuộc để mở bài.

4.2. Hình thành kiến thức (12–15 phút)
- Giới thiệu khái niệm / nội dung chính của bài.
- Phân tích cấu trúc, đặc điểm hoặc nguyên tắc cốt lõi.
- Cho 2–3 ví dụ minh họa rõ ràng.
- Học sinh ghi lại các ý chính.

4.3. Luyện tập có hướng dẫn (10–12 phút)
- Giáo viên cho bài tập ngắn hoặc câu hỏi kiểm tra mức độ hiểu bài.
- Học sinh làm cá nhân hoặc theo cặp.
- Chữa lỗi ngay tại lớp để củng cố kiến thức.

4.4. Vận dụng / mở rộng (8–10 phút)
- Học sinh áp dụng kiến thức vào tình huống mới.
- Có thể yêu cầu trình bày, thảo luận hoặc viết ngắn.
- Giáo viên chốt lại nội dung cốt lõi.

${buildSectionTitle("5. CÂU HỎI GỢI MỞ TRÊN LỚP")}
- Nội dung trọng tâm của "${chuDe}" là gì?
- Hãy cho một ví dụ minh họa phù hợp.
- Nếu áp dụng trong thực tế thì em sẽ sử dụng như thế nào?
- Phần nào trong bài em thấy dễ nhầm nhất?

${buildSectionTitle("6. BÀI TẬP / NHIỆM VỤ VỀ NHÀ")}
- Ôn lại kiến thức chính của bài.
- Hoàn thành 3–5 câu hỏi luyện tập ngắn.
- Chuẩn bị nội dung liên quan cho buổi học tiếp theo.

${buildSectionTitle("7. GHI CHÚ CHO GIÁO VIÊN")}
${ghiChu ? `- ${ghiChu}` : "- Có thể tùy chỉnh độ khó theo thực tế lớp học."}
${duLieuGoc ? `- Dựa trên dữ liệu gốc / giáo trình tham khảo đã nhập.` : "- Có thể kết hợp thêm slide hoặc worksheet nếu cần."}

💡 GỢI Ý MỞ RỘNG
- Có thể chuyển ngay thành bài giảng trên web.
- Có thể sinh thêm bài tập hoặc mini test từ nội dung này.
`.trim();
}

/* =========================
   EXERCISE
========================= */
function generateExerciseContent(prompt, payload = {}) {
  const monHoc = safe(payload.monHoc, "Tiếng Anh");
  const chuDe = safe(payload.chuDe, "Chủ đề luyện tập");
  const dangBai = safe(payload.dangBai, "Trắc nghiệm");
  const doKho = safe(payload.doKho, "Trung bình");
  const soLuong = num(payload.soLuong, 10);
  const coDapAn = yesNo(payload.dapAn);
  const mucChiTiet = safe(payload.mucChiTiet, "Vừa");
  const ghiChu = safe(payload.ghiChu);
  const duLieuGoc = safe(payload.duLieuGoc);

  let content = "";

  if (normalizeText(dangBai).includes("điền") || normalizeText(dangBai).includes("dien")) {
    for (let i = 1; i <= soLuong; i++) {
      content += `
Câu ${i}. Hoàn thành câu sau với nội dung phù hợp về "${chuDe}".
→ ________________________________________
`;
    }
  } else if (normalizeText(dangBai).includes("tự luận") || normalizeText(dangBai).includes("tu luan")) {
    for (let i = 1; i <= soLuong; i++) {
      content += `
Câu ${i}. Trình bày ngắn gọn nội dung liên quan đến "${chuDe}".
`;
    }
  } else if (normalizeText(dangBai).includes("đọc hiểu") || normalizeText(dangBai).includes("doc hieu")) {
    content += `
Đọc đoạn văn sau và trả lời câu hỏi:

"${chuDe}" là một nội dung quan trọng trong học tập và ứng dụng thực tế. Người học cần hiểu rõ bản chất, từ khóa chính và cách vận dụng vào từng ngữ cảnh cụ thể.

`;
    for (let i = 1; i <= soLuong; i++) {
      content += `Câu ${i}. Câu hỏi đọc hiểu số ${i} liên quan đến đoạn văn trên.\n`;
    }
  } else {
    for (let i = 1; i <= soLuong; i++) {
      content += `
Câu ${i}. Chọn đáp án đúng nhất về chủ đề "${chuDe}".
A. Phương án A
B. Phương án B
C. Phương án C
D. Phương án D
`;
    }
  }

  let dapAnText = "";
  if (coDapAn) {
    dapAnText = `
${buildSectionTitle("4. ĐÁP ÁN THAM KHẢO")}
${Array.from({ length: soLuong }, (_, i) => `- Câu ${i + 1}: ${randomPick(["A", "B", "C", "D"])}`).join("\n")}
`;
  }

  return `
📝 BÀI TẬP AI: ${chuDe.toUpperCase()}

${buildSectionTitle("1. THÔNG TIN BÀI TẬP")}
- Môn học: ${monHoc}
- Chủ đề: ${chuDe}
- Dạng bài: ${dangBai}
- Độ khó: ${doKho}
- Số lượng câu: ${soLuong}
- Mức chi tiết: ${mucChiTiet}

${buildSectionTitle("2. HƯỚNG DẪN")}
- Đọc kỹ từng yêu cầu trước khi làm.
- Trả lời ngắn gọn, đúng trọng tâm.
- Nếu là câu hỏi vận dụng, ưu tiên lập luận rõ ràng.

${buildSectionTitle("3. NỘI DUNG BÀI TẬP")}
${content.trim()}

${dapAnText.trim()}

${buildSectionTitle("5. GỢI Ý SỬ DỤNG")}
- Có thể dùng làm bài trên lớp hoặc bài tập về nhà.
- Có thể chia tiếp thành mức độ dễ / trung bình / nâng cao.
- Có thể nhập trực tiếp sang module bài tập.

${buildSectionTitle("6. GHI CHÚ")}
${ghiChu ? `- ${ghiChu}` : "- Có thể tùy chỉnh thêm theo trình độ học sinh."}
${duLieuGoc ? `- Có tham chiếu dữ liệu gốc đã nhập.` : ""}
`.trim();
}

/* =========================
   EXAM
========================= */
function generateExamContent(prompt, payload = {}) {
  const monHoc = safe(payload.monHoc, "Tiếng Anh");
  const chuDe = safe(payload.chuDe, "Nội dung kiểm tra");
  const thoiGian = safe(payload.thoiGian, "45 phút");
  const soCau = num(payload.soCau, 10);
  const doKho = safe(payload.doKho, "Trung bình");
  const loaiDe = safe(payload.loaiDe, "Trắc nghiệm");
  const coDapAn = yesNo(payload.dapAn);
  const ghiChu = safe(payload.ghiChu);
  const duLieuGoc = safe(payload.duLieuGoc);

  let partA = "";
  let partB = "";

  const soTracNghiem = Math.max(5, Math.floor(soCau * 0.7));
  const soTuLuan = Math.max(1, soCau - soTracNghiem);

  for (let i = 1; i <= soTracNghiem; i++) {
    partA += `
Câu ${i}. Chọn đáp án đúng nhất cho nội dung liên quan đến "${chuDe}".
A. Đáp án A
B. Đáp án B
C. Đáp án C
D. Đáp án D
`;
  }

  for (let i = 1; i <= soTuLuan; i++) {
    partB += `Câu ${i + soTracNghiem}. Trình bày / phân tích ngắn gọn một nội dung thuộc chủ đề "${chuDe}".\n`;
  }

  let dapAnText = "";
  if (coDapAn) {
    dapAnText = `
${buildSectionTitle("IV. ĐÁP ÁN THAM KHẢO")}
${Array.from({ length: soTracNghiem }, (_, i) => `- Câu ${i + 1}: ${randomPick(["A", "B", "C", "D"])}`).join("\n")}
${Array.from({ length: soTuLuan }, (_, i) => `- Câu ${i + soTracNghiem + 1}: Chấm theo ý đúng, đủ, rõ ràng.`).join("\n")}
`;
  }

  return `
📋 ĐỀ KIỂM TRA AI: ${chuDe.toUpperCase()}

${buildSectionTitle("I. THÔNG TIN ĐỀ")}
- Môn học: ${monHoc}
- Nội dung kiểm tra: ${chuDe}
- Loại đề: ${loaiDe}
- Thời gian làm bài: ${thoiGian}
- Số câu: ${soCau}
- Độ khó: ${doKho}

${buildSectionTitle("II. PHẦN A - TRẮC NGHIỆM")}
${partA.trim()}

${buildSectionTitle("III. PHẦN B - TỰ LUẬN / VẬN DỤNG")}
${partB.trim()}

${dapAnText.trim()}

${buildSectionTitle("V. GỢI Ý TRIỂN KHAI")}
- Có thể tách đề A / B nếu cần.
- Có thể thêm thang điểm chi tiết.
- Có thể đẩy trực tiếp sang module kiểm tra.

${buildSectionTitle("VI. GHI CHÚ")}
${ghiChu ? `- ${ghiChu}` : "- Nên rà soát lần cuối trước khi giao chính thức."}
${duLieuGoc ? `- Có tham chiếu dữ liệu gốc / ma trận đề đã nhập.` : ""}
`.trim();
}

/* =========================
   TOEIC
========================= */
function generateToeicContent(prompt, payload = {}) {
  const toeicPart = safe(payload.toeicPart, "Part 5");
  const chuDe = safe(payload.chuDe, "Business English");
  const soCau = num(payload.soCau, 10);
  const doKho = safe(payload.doKho, "Trung bình");
  const vocab = safe(payload.vocab);
  const style = safe(payload.style, "Business / Office");
  const target = safe(payload.target, "450-650");
  const ghiChu = safe(payload.ghiChu);
  const duLieuGoc = safe(payload.duLieuGoc);

  let questions = "";

  if (normalizeText(toeicPart).includes("part 5")) {
    for (let i = 1; i <= soCau; i++) {
      questions += `
Question ${i}. The manager asked all employees to submit their reports ______ Friday afternoon.
A. in
B. by
C. on
D. at
`;
    }
  } else if (normalizeText(toeicPart).includes("part 6")) {
    questions += `
Read the text below and choose the best answer for each blank.

Dear Staff,

Please be informed that the company meeting will be held next Monday at 9:00 a.m. All department heads are requested to bring the monthly performance summary.

`;
    for (let i = 1; i <= soCau; i++) {
      questions += `
Question ${i}. Choose the best answer.
A. option A
B. option B
C. option C
D. option D
`;
    }
  } else if (normalizeText(toeicPart).includes("part 7")) {
    questions += `
Read the passage below and answer the questions.

The Human Resources Department will organize a training workshop for newly hired employees next week. The session will cover internal communication, workflow procedures, and customer interaction standards.

`;
    for (let i = 1; i <= soCau; i++) {
      questions += `Question ${i}. Reading comprehension question ${i}.\n`;
    }
  } else {
    for (let i = 1; i <= soCau; i++) {
      questions += `
Question ${i}. Choose the best answer.
A. option A
B. option B
C. option C
D. option D
`;
    }
  }

  return `
🎧 TOEIC AI: ${toeicPart.toUpperCase()}

${buildSectionTitle("1. THÔNG TIN BỘ ĐỀ")}
- TOEIC Part: ${toeicPart}
- Chủ đề: ${chuDe}
- Số câu: ${soCau}
- Độ khó: ${doKho}
- Style: ${style}
- Mục tiêu đầu ra: ${target}
${vocab ? `- Từ vựng trọng tâm: ${vocab}` : ""}

${buildSectionTitle("2. HƯỚNG DẪN LÀM BÀI")}
- Đọc nhanh từ khóa quan trọng.
- Chú ý loại bẫy thường gặp trong TOEIC.
- Ưu tiên câu chắc trước, không mắc kẹt quá lâu.
- Sau khi làm xong nên rà lại ngữ cảnh và từ loại.

${buildSectionTitle("3. NỘI DUNG LUYỆN TẬP")}
${questions.trim()}

${buildSectionTitle("4. GỢI Ý ÔN TẬP")}
- Ôn từ vựng theo chủ đề ${chuDe}.
- Luyện phản xạ với cấu trúc thường gặp.
- Nếu mục tiêu là ${target}, nên luyện đều cả từ vựng, ngữ pháp và tốc độ đọc.

${buildSectionTitle("5. GHI CHÚ")}
${ghiChu ? `- ${ghiChu}` : "- Có thể mở rộng thêm mini test hoặc full test theo từng part."}
${duLieuGoc ? `- Có tham chiếu dữ liệu gốc đã nhập.` : ""}
`.trim();
}

/* =========================
   SUMMARY / EXPLAIN / CHAT
========================= */
function generateSummaryContent(prompt, payload = {}) {
  return `
📌 TÓM TẮT NỘI DUNG

- Đây là phần tóm tắt tự động từ AI mock.
- Hệ thống sẽ gom các ý chính, rút gọn nội dung và giữ lại trọng tâm.
- Có thể dùng để tóm tắt bài giảng, tài liệu hoặc bài đọc.

Yêu cầu gốc:
"${prompt || "Không có nội dung"}"
`.trim();
}

function generateExplainContent(prompt, payload = {}) {
  return `
📖 GIẢI THÍCH NỘI DUNG

Yêu cầu:
"${prompt || "Không có nội dung"}"

Giải thích ngắn gọn:
- Đây là phần AI giả lập dùng để giải thích kiến thức theo cách dễ hiểu hơn.
- Có thể mở rộng thêm ví dụ, bài tập hoặc câu hỏi tương tự nếu cần.
`.trim();
}

function generateChatContent(prompt, payload = {}) {
  return `
💬 AI CHAT

Anh vừa nhập:
"${prompt || "Không có nội dung"}"

Phản hồi mock:
- Hệ thống đã nhận câu hỏi và tạo phản hồi mô phỏng.
- Có thể dùng phần này để test giao diện hội thoại AI trong web.
`.trim();
}

function generateGeneralContent(prompt, payload = {}) {
  return `
🤖 AI MOCK RESPONSE

YÊU CẦU:
${prompt || "Không có prompt"}

GỢI Ý XỬ LÝ:
- Hệ thống đã nhận yêu cầu và mô phỏng phản hồi AI.
- Anh có thể dùng module này để test UI / flow / trải nghiệm người dùng.
- Khi cần đổi sang AI thật, chỉ cần thay đúng hàm askAI().

💡 Gợi ý:
- Hãy nhập yêu cầu cụ thể hơn để AI giả lập trả lời đẹp hơn.
`.trim();
}