// /scripts/ai/aiPromptBuilder.js
import { AI_TYPES } from "./aiTypes.js";

export function buildAIPrompt(type, payload = {}) {
  switch (type) {
    case AI_TYPES.LESSON:
      return buildLessonPrompt(payload);

    case AI_TYPES.EXERCISE:
      return buildExercisePrompt(payload);

    case AI_TYPES.EXAM:
      return buildExamPrompt(payload);

    case AI_TYPES.TOEIC:
      return buildToeicPrompt(payload);

    default:
      return "Hãy tạo nội dung giảng dạy phù hợp.";
  }
}

/* =========================
   SMART HELPERS
========================= */
function smartInferExerciseMode(p = {}) {
  const raw = `
    ${p.dangBai || ""}
    ${p.ghiChu || ""}
    ${p.chuDe || ""}
  `.toLowerCase();

  if (
    raw.includes("hội thoại") ||
    raw.includes("dialogue") ||
    raw.includes("conversation")
  ) {
    return "dialogue";
  }

  if (
    raw.includes("đọc hiểu") ||
    raw.includes("reading") ||
    raw.includes("passage")
  ) {
    return "reading";
  }

  if (
    raw.includes("điền từ") ||
    raw.includes("fill in") ||
    raw.includes("fill-in")
  ) {
    return "fill";
  }

  if (
    raw.includes("tự luận") ||
    raw.includes("essay") ||
    raw.includes("viết")
  ) {
    return "essay";
  }

  if (
    raw.includes("trắc nghiệm") ||
    raw.includes("multiple choice") ||
    raw.includes("mcq")
  ) {
    return "mcq";
  }

  return "smart";
}

function smartInferExamMode(p = {}) {
  const raw = `
    ${p.loaiDe || ""}
    ${p.ghiChu || ""}
    ${p.chuDe || ""}
  `.toLowerCase();

  if (raw.includes("mix")) return "mix";
  if (raw.includes("tự luận") || raw.includes("essay")) return "essay";
  if (raw.includes("đọc hiểu") || raw.includes("reading")) return "reading";
  if (raw.includes("trắc nghiệm") || raw.includes("multiple")) return "mcq";

  return "smart";
}

function smartInferToeicMode(p = {}) {
  const part = String(p.toeicPart || "").toLowerCase();

  if (part.includes("part 1") || part === "1") return "part1";
  if (part.includes("part 2") || part === "2") return "part2";
  if (part.includes("part 3") || part === "3") return "part3";
  if (part.includes("part 4") || part === "4") return "part4";
  if (part.includes("part 5") || part === "5") return "part5";
  if (part.includes("part 6") || part === "6") return "part6";
  if (part.includes("part 7") || part === "7") return "part7";

  return "smart";
}

/* =========================
   LESSON
========================= */
function buildLessonPrompt(p = {}) {
  return `
Bạn là trợ lý AI cao cấp cho giáo viên.

NHIỆM VỤ:
Từ dữ liệu giáo viên cung cấp, hãy tạo ra 1 BÀI GIẢNG hoàn chỉnh, dễ dạy, dễ hiểu, sạch format.

THÔNG TIN:
- Môn học: ${p.monHoc || ""}
- Chủ đề: ${p.chuDe || ""}
- Trình độ / Lớp: ${p.trinhDo || ""}
- Mục tiêu: ${p.mucTieu || ""}
- Số phần chính: ${p.soPhan || ""}
- Phong cách: ${p.phongCach || ""}
- Mức chi tiết: ${p.mucChiTiet || ""}
- Ghi chú thêm: ${p.ghiChu || ""}

DỮ LIỆU GỐC:
${p.duLieuGoc || "Không có"}

YÊU CẦU:
- Viết bằng tiếng Việt rõ ràng
- Có tiêu đề bài học
- Có mục tiêu bài học
- Chia nội dung thành từng phần rõ ràng
- Có giải thích dễ hiểu
- Có ví dụ minh họa
- Có mini practice / câu hỏi cuối bài
- Có phần tóm tắt cuối

QUAN TRỌNG:
- Nếu giáo viên đã dán nội dung từ Word thì hãy ƯU TIÊN bám sát nội dung đó
- Không viết lan man ngoài chủ đề
- Không dùng markdown kiểu ### hoặc ** nếu không cần
- Chỉ trả ra nội dung bài giảng cuối cùng
`.trim();
}

/* =========================
   EXERCISE
========================= */
function buildExercisePrompt(p = {}) {
  const mode = smartInferExerciseMode(p);

  if (mode === "dialogue") {
    return `
Bạn là trợ lý AI cho giáo viên.

NHIỆM VỤ:
Từ nội dung được cung cấp, hãy tạo BÀI TẬP DẠNG HỘI THOẠI.

THÔNG TIN:
- Môn học: ${p.monHoc || ""}
- Chủ đề: ${p.chuDe || ""}
- Số lượng: ${p.soLuong || "5"}
- Độ khó: ${p.doKho || ""}
- Ghi chú thêm: ${p.ghiChu || ""}

DỮ LIỆU GỐC:
${p.duLieuGoc || "Không có"}

YÊU CẦU BẮT BUỘC:
- KHÔNG tạo trắc nghiệm
- KHÔNG tạo A/B/C/D
- Hãy tạo đúng dạng hội thoại ngắn
- Tên nhân vật để AI tự đặt tự nhiên
- Mỗi câu / đoạn hội thoại phải rõ ràng, dễ dùng trong lớp
- Có thể tạo hội thoại theo tình huống thực tế
- Chỉ trả ra nội dung bài tập cuối cùng
- Plain text, dễ copy

FORMAT GỢI Ý:
Bài tập hội thoại: ${p.chuDe || "Chủ đề"}

Hội thoại 1
Lan: ...
Minh: ...

Hội thoại 2
...
`.trim();
  }

  if (mode === "reading") {
    return `
Bạn là trợ lý AI cho giáo viên.

NHIỆM VỤ:
Từ nội dung được cung cấp, hãy tạo BÀI TẬP ĐỌC HIỂU.

THÔNG TIN:
- Môn học: ${p.monHoc || ""}
- Chủ đề: ${p.chuDe || ""}
- Số lượng câu hỏi: ${p.soLuong || "5"}
- Độ khó: ${p.doKho || ""}
- Có đáp án: ${p.dapAn || ""}
- Ghi chú thêm: ${p.ghiChu || ""}

DỮ LIỆU GỐC:
${p.duLieuGoc || "Không có"}

YÊU CẦU:
- Tạo 1 đoạn văn / passage phù hợp
- Sau đó tạo câu hỏi đọc hiểu dựa trên đoạn văn
- Nếu có đáp án thì dùng đúng format hệ thống:
  Câu 1.
  A.
  B.*
  C.
  D.
- Nếu giáo viên không yêu cầu trắc nghiệm thì có thể tạo câu hỏi trả lời ngắn
- Không viết giải thích dài
- Chỉ xuất nội dung cuối cùng
`.trim();
  }

  if (mode === "essay") {
    return `
Bạn là trợ lý AI cho giáo viên.

Hãy tạo BÀI TẬP TỰ LUẬN từ nội dung sau.

THÔNG TIN:
- Môn học: ${p.monHoc || ""}
- Chủ đề: ${p.chuDe || ""}
- Số lượng câu: ${p.soLuong || "5"}
- Độ khó: ${p.doKho || ""}
- Ghi chú thêm: ${p.ghiChu || ""}

DỮ LIỆU GỐC:
${p.duLieuGoc || "Không có"}

YÊU CẦU:
- KHÔNG tạo trắc nghiệm
- KHÔNG tạo A/B/C/D
- Chỉ tạo câu hỏi tự luận
- Dễ dùng trong lớp học
- Chỉ trả ra nội dung cuối cùng

FORMAT:
Tiêu đề bài tập

Tự luận
Câu 1. ...
Câu 2. ...
`.trim();
  }

  return `
Bạn là trợ lý AI cho giáo viên.

Hãy tạo BÀI TẬP theo đúng yêu cầu giáo viên và đúng format preview hệ thống.

THÔNG TIN:
- Môn học: ${p.monHoc || ""}
- Chủ đề: ${p.chuDe || ""}
- Dạng bài: ${p.dangBai || ""}
- Độ khó: ${p.doKho || ""}
- Số lượng câu: ${p.soLuong || ""}
- Có đáp án: ${p.dapAn || ""}
- Mức chi tiết: ${p.mucChiTiet || ""}
- Ghi chú thêm: ${p.ghiChu || ""}

DỮ LIỆU GỐC:
${p.duLieuGoc || "Không có"}

QUAN TRỌNG:
- Phải hiểu đúng ý giáo viên
- Nếu giáo viên yêu cầu hội thoại => KHÔNG tạo trắc nghiệm
- Nếu giáo viên yêu cầu đọc hiểu => tạo passage + câu hỏi phù hợp
- Nếu giáo viên yêu cầu tự luận => KHÔNG tạo A/B/C/D
- Chỉ khi thật sự là trắc nghiệm mới tạo A/B/C/D

NẾU LÀ TRẮC NGHIỆM:
- Không markdown
- Không bullet
- Không giải thích dài dòng
- Chỉ xuất nội dung bài tập thuần text
- MỖI câu phải có đúng 4 đáp án:
  A.
  B.
  C.
  D.
- MỖI câu phải có đúng 1 đáp án đúng
- Đáp án đúng PHẢI có dấu * ở CUỐI dòng
- Không được ghi "Đáp án:", "Answer:", "Correct answer:"
- Không được tách riêng answer key
- Phải dùng đúng "Câu 1."

NẾU LÀ TỰ LUẬN:
Tự luận
Câu 1. ...
Câu 2. ...

CHỈ TRẢ RA NỘI DUNG CUỐI CÙNG.
`.trim();
}



const STRICT_MC_FORMAT_RULES = `
QUY TẮC FORMAT TRẮC NGHIỆM BẮT BUỘC:

Mỗi câu trắc nghiệm PHẢI đúng CHÍNH XÁC từng ký tự như sau:

Câu 1. Nội dung câu hỏi
A. Đáp án A
B. Đáp án B*
C. Đáp án C
D. Đáp án D

LƯU Ý BẮT BUỘC:
- Phải viết đúng chữ "Câu", KHÔNG được viết sai như: "C. âu", "C âu", "Question 1:", "1)"
- Phải có dấu chấm ngay sau số câu: "Câu 1."
- Mỗi đáp án phải bắt đầu đúng bằng: "A. ", "B. ", "C. ", "D. "

CẤM TUYỆT ĐỐI các kiểu sau:
- Đáp án: B
- Answer: C
- B*
- C*
- Key: A
- Answer Key
- Correct answer: D

BẮT BUỘC:
- Mỗi câu chỉ có đúng 4 đáp án: A, B, C, D
- Chỉ có đúng 1 đáp án đúng
- Dấu * phải nằm ở CUỐI dòng đáp án đúng
- Không được viết dòng đáp án riêng
- Không được gom đáp án ở cuối đề
`;

/* =========================
   EXAM
========================= */
function buildExamPrompt(p = {}) {
  const mode = smartInferExamMode(p);

  if (mode === "essay") {
    return `
Bạn là trợ lý AI cho giáo viên.

Hãy tạo ĐỀ KIỂM TRA TỰ LUẬN dựa trên nội dung được cung cấp.

THÔNG TIN:
- Môn học: ${p.monHoc || ""}
- Chủ đề: ${p.chuDe || ""}
- Thời gian: ${p.thoiGian || ""}
- Số câu: ${p.soCau || ""}
- Độ khó: ${p.doKho || ""}
- Ghi chú: ${p.ghiChu || ""}

NỘI DUNG NGUỒN:
${p.duLieuGoc || "Không có"}

YÊU CẦU:
- KHÔNG tạo trắc nghiệm
- Chỉ tạo câu hỏi tự luận
- Có thể chia section nếu phù hợp
- Chỉ trả nội dung cuối cùng

FORMAT:
ĐỀ KIỂM TRA

Tự luận
Câu 1. ...
Câu 2. ...
`.trim();
  }

  if (mode === "reading") {
    return `
Bạn là trợ lý AI cho giáo viên.

Hãy tạo ĐỀ KIỂM TRA DẠNG ĐỌC HIỂU.

THÔNG TIN:
- Môn học: ${p.monHoc || ""}
- Chủ đề: ${p.chuDe || ""}
- Thời gian: ${p.thoiGian || ""}
- Số câu: ${p.soCau || ""}
- Độ khó: ${p.doKho || ""}
- Có đáp án: ${p.dapAn || ""}
- Ghi chú: ${p.ghiChu || ""}

NỘI DUNG NGUỒN:
${p.duLieuGoc || "Không có"}

YÊU CẦU:
- Tạo đoạn đọc phù hợp
- Tạo câu hỏi đọc hiểu dựa trên đoạn văn
- Nếu là trắc nghiệm thì phải có đúng format A/B/C/D và có *
- Không giải thích dài
- Chỉ xuất nội dung đề cuối cùng
`.trim();
  }

  if (mode === "mix") {
    return `
Bạn là trợ lý AI cho giáo viên.

Hãy tạo ĐỀ KIỂM TRA MIX dựa trên nội dung được cung cấp.

THÔNG TIN:
- Môn học: ${p.monHoc || ""}
- Chủ đề: ${p.chuDe || ""}
- Thời gian làm bài: ${p.thoiGian || ""}
- Số câu: ${p.soCau || ""}
- Độ khó: ${p.doKho || ""}
- Có đáp án: ${p.dapAn || ""}
- Ghi chú thêm: ${p.ghiChu || ""}

NỘI DUNG NGUỒN:
${p.duLieuGoc || "Không có"}

YÊU CẦU:
- Chia đề thành nhiều phần nếu phù hợp:
  + Trắc nghiệm
  + Đọc hiểu
  + Tự luận
- Phải bám sát nội dung nguồn
- Nếu có phần trắc nghiệm thì dùng đúng format hệ thống:

Câu 1. Nội dung câu hỏi
A. Đáp án A
B. Đáp án B*
C. Đáp án C
D. Đáp án D

QUY TẮC:
- Mỗi câu trắc nghiệm chỉ có 1 đáp án đúng
- Đáp án đúng phải có *
- Không tách answer key riêng
- Chỉ trả ra nội dung đề cuối cùng
`.trim();
  }

 return `
Bạn là trợ lý AI cho giáo viên.

Hãy tạo ĐỀ KIỂM TRA bằng tiếng Việt dựa trên nội dung được cung cấp.

THÔNG TIN:
- Môn học: ${p.monHoc || ""}
- Chủ đề: ${p.chuDe || ""}
- Thời gian làm bài: ${p.thoiGian || ""}
- Số câu trắc nghiệm: ${p.soCau || ""}
- Độ khó: ${p.doKho || ""}
- Loại đề: ${p.loaiDe || ""}
- Có đáp án: ${p.dapAn || ""}
- Ghi chú thêm: ${p.ghiChu || ""}

NỘI DUNG NGUỒN:
${p.duLieuGoc || "Không có"}

YÊU CẦU BẮT BUỘC:
- Chỉ xuất đúng nội dung đề
- KHÔNG giải thích
- KHÔNG markdown
- KHÔNG bullet
- KHÔNG mở đầu kiểu "Dưới đây là đề kiểm tra..."
- Dòng đầu tiên phải là 1 TIÊU ĐỀ NGẮN

${STRICT_MC_FORMAT_RULES}

Nếu có yêu cầu tự luận thì sau phần trắc nghiệm, ghi đúng:

Tự luận
Câu 1. ...
Câu 2. ...

CHỈ TRẢ RA NỘI DUNG CUỐI CÙNG.
`.trim();
}
/* =========================
   TOEIC
========================= */
function buildToeicPrompt(p = {}) {
  const mode = smartInferToeicMode(p);

  if (mode === "part5") {
    return `
You are an AI TOEIC test generator for teachers.

TASK:
Create a TOEIC Part 5 grammar/vocabulary test.

INFO:
- Topic: ${p.chuDe || ""}
- Number of questions: ${p.soCau || ""}
- Difficulty: ${p.doKho || ""}
- Vocabulary: ${p.vocab || ""}
- Style: ${p.style || ""}
- Target: ${p.target || ""}
- Extra note: ${p.ghiChu || ""}

SOURCE:
${p.duLieuGoc || "No source content"}

STRICT RULES:
- Output plain text only
- Each question must follow EXACTLY:

Câu 1. Question content
A. Option A
B. Option B*
C. Option C
D. Option D

- Exactly 4 options
- Exactly 1 correct answer
- Correct answer MUST end with *
- No answer key section
- No explanations
- Return only final content
`.trim();
  }

  if (mode === "part7") {
    return `
You are an AI TOEIC test generator for teachers.

TASK:
Create a TOEIC Part 7 reading test.

INFO:
- Topic: ${p.chuDe || ""}
- Number of questions: ${p.soCau || ""}
- Difficulty: ${p.doKho || ""}
- Style: ${p.style || ""}
- Target: ${p.target || ""}
- Extra note: ${p.ghiChu || ""}

SOURCE:
${p.duLieuGoc || "No source content"}

REQUIREMENTS:
- First create a realistic TOEIC reading passage (email, notice, article, ad, memo, etc.)
- Then create questions based on the passage
- If multiple-choice is used, follow exact format:

Câu 1. Question content
A. Option A
B. Option B*
C. Option C
D. Option D

- No separate answer key
- No explanation
- Return only final TOEIC content
`.trim();
  }

  return `
You are an AI TOEIC test generator for teachers.

Create a MINI TOEIC TEST based on the provided information.

INFORMATION:
- TOEIC Part: ${p.toeicPart || ""}
- Topic: ${p.chuDe || ""}
- Number of multiple-choice questions: ${p.soCau || ""}
- Difficulty: ${p.doKho || ""}
- Target vocabulary: ${p.vocab || ""}
- Style: ${p.style || ""}
- Target output: ${p.target || ""}
- Extra note: ${p.ghiChu || ""}

SOURCE CONTENT:
${p.duLieuGoc || "No source content provided"}

STRICT OUTPUT RULES:
- Output PLAIN TEXT only
- NO markdown
- NO bullet points
- NO explanations
- The first line must be a SHORT TITLE

EVERY QUESTION MUST FOLLOW THIS EXACT FORMAT:

Câu 1. Question content
A. Option A
B. Option B
C. Option C*
D. Option D

MANDATORY RULES:
- Exactly 4 options
- Exactly 1 correct answer
- Correct answer MUST end with *
- No answer key section
- No explanations

If there is a writing/self-answer section, put it at the end:

Tự luận
Câu 1. ...
Câu 2. ...

RETURN ONLY THE FINAL TEST CONTENT.
`.trim();
}