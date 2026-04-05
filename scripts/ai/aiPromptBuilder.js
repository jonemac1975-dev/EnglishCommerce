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
   LESSON
========================= */
function buildLessonPrompt(p = {}) {
  return `
Bạn là trợ lý AI cho giáo viên.

Hãy tạo BÀI GIẢNG bằng tiếng Việt với thông tin sau:
- Môn học: ${p.monHoc || ""}
- Chủ đề: ${p.chuDe || ""}
- Trình độ / Lớp: ${p.trinhDo || ""}
- Mục tiêu: ${p.mucTieu || ""}
- Số phần chính: ${p.soPhan || ""}
- Phong cách: ${p.phongCach || ""}
- Mức chi tiết: ${p.mucChiTiet || ""}
- Ghi chú thêm: ${p.ghiChu || ""}

Dữ liệu gốc / tham khảo:
${p.duLieuGoc || "Không có"}

Yêu cầu đầu ra:
- Viết rõ ràng, dễ đọc, dễ dạy
- Có tiêu đề bài học
- Có mục tiêu bài học
- Có nội dung chia phần rõ ràng
- Có ví dụ minh họa
- Có câu hỏi cuối bài
- Có phần tóm tắt
- Có thể dùng HTML đơn giản nếu phù hợp
`;
}

/* =========================
   EXERCISE
========================= */
function buildExercisePrompt(p = {}) {
  return `
Bạn là trợ lý AI cho giáo viên.

Hãy tạo BÀI TẬP theo đúng format dùng để preview hệ thống.

THÔNG TIN:
- Môn học: ${p.monHoc || ""}
- Chủ đề: ${p.chuDe || ""}
- Dạng bài: ${p.dangBai || ""}
- Độ khó: ${p.doKho || ""}
- Số lượng câu: ${p.soLuong || ""}
- Có đáp án: ${p.dapAn || ""}
- Mức chi tiết: ${p.mucChiTiet || ""}
- Ghi chú thêm: ${p.ghiChu || ""}

Dữ liệu gốc / tham khảo:
${p.duLieuGoc || "Không có"}

YÊU CẦU BẮT BUỘC:
- Không markdown
- Không bullet
- Không giải thích dài dòng
- Không thêm phần mở đầu / kết luận
- Chỉ xuất nội dung bài tập thuần text
- Nếu là bài tập trắc nghiệm thì MỖI câu phải có đúng 4 đáp án:
  A.
  B.
  C.
  D.
- MỖI câu phải có đúng 1 đáp án đúng
- Đáp án đúng PHẢI có dấu * ở CUỐI dòng
- Nếu không có dấu * thì output bị xem là SAI FORMAT
- Không được bỏ dấu *
- Không được ghi "Đáp án:", "Answer:", "Correct answer:"
- Không được tách riêng answer key
- Không được dùng A), B), C), D)
- Không được dùng "Question 1"
- Phải dùng đúng "Câu 1."

FORMAT ĐÚNG:
Tiêu đề bài tập

Câu 1. Nội dung câu hỏi
A. Đáp án A
B. Đáp án B*
C. Đáp án C
D. Đáp án D

Câu 2. Nội dung câu hỏi
A. ...
B. ...
C. ...*
D. ...

VÍ DỤ SAI (KHÔNG ĐƯỢC DÙNG):
Question 1
A) ...
B) ...
Answer: B

Nếu có phần tự luận thì thêm cuối bài đúng như sau:

Tự luận
Câu 1. ...
Câu 2. ...

CHỈ TRẢ RA NỘI DUNG CUỐI CÙNG THEO ĐÚNG FORMAT.
KHÔNG THÊM GIẢI THÍCH.
`;
}

/* =========================
   EXAM
========================= */
function buildExamPrompt(p = {}) {
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

NỘI DUNG NGUỒN / BÀI ĐÃ HỌC:
${p.duLieuGoc || "Không có"}

YÊU CẦU BẮT BUỘC:
- Chỉ xuất đúng nội dung đề
- KHÔNG giải thích
- KHÔNG markdown
- KHÔNG bullet
- KHÔNG mở đầu kiểu "Dưới đây là đề kiểm tra..."
- KHÔNG kết luận
- Dòng đầu tiên phải là 1 TIÊU ĐỀ NGẮN

PHẦN TRẮC NGHIỆM PHẢI ĐÚNG 100% FORMAT NÀY:

Câu 1. Nội dung câu hỏi
A. Đáp án A
B. Đáp án B*
C. Đáp án C
D. Đáp án D

Câu 2. Nội dung câu hỏi
A. ...
B. ...
C. ...*
D. ...

QUY TẮC BẮT BUỘC:
- Mỗi câu chỉ có đúng 4 đáp án: A, B, C, D
- Mỗi câu chỉ có đúng 1 đáp án đúng
- Đáp án đúng PHẢI có dấu * ở CUỐI dòng
- Nếu không có dấu * thì output bị xem là SAI FORMAT
- Không được bỏ dấu *
- Phải luôn dùng đúng ký hiệu:
  - Câu 1.
  - A.
  - B.
  - C.
  - D.
- Không được dùng:
  - Question 1
  - A)
  - B)
  - C)
  - D)
  - Answer: B
  - Correct answer: B
  - Đáp án: B
- Không được tách riêng phần đáp án
- Không được thêm answer key ở cuối

VÍ DỤ SAI (KHÔNG ĐƯỢC DÙNG):
Question 1
A) ...
B) ...
Answer: B

Nếu có yêu cầu tự luận thì sau phần trắc nghiệm, ghi đúng:

Tự luận
Câu 1. ...
Câu 2. ...

CHỈ TRẢ RA NỘI DUNG CUỐI CÙNG THEO ĐÚNG FORMAT.
KHÔNG THÊM GIẢI THÍCH.
`;
}

/* =========================
   TOEIC
========================= */
function buildToeicPrompt(p = {}) {
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

SOURCE CONTENT / LESSON CONTENT:
${p.duLieuGoc || "No source content provided"}

STRICT OUTPUT RULES:
- Output PLAIN TEXT only
- NO markdown
- NO bullet points
- NO explanations
- NO intro like "Here is your TOEIC test"
- NO conclusion
- The first line must be a SHORT TITLE
- Then output only the multiple-choice test

EVERY QUESTION MUST FOLLOW THIS EXACT FORMAT:

Câu 1. Question content
A. Option A
B. Option B
C. Option C*
D. Option D

Câu 2. Question content
A. ...
B. ...*
C. ...
D. ...

MANDATORY RULES:
- Every question must have exactly 4 options: A, B, C, D
- Every question must have exactly 1 correct answer
- The correct answer MUST end with *
- If a question has no * at the correct option, the output is INVALID
- Do NOT omit the *
- Always use:
  - Câu 1.
  - A.
  - B.
  - C.
  - D.
- Do NOT use:
  - Question 1
  - A)
  - B)
  - C)
  - D)
  - Correct answer: B
  - Answer: B
  - Answer key
- Do NOT separate the answers into another section
- Do NOT add answer explanations

CORRECT EXAMPLE:
Câu 1. The meeting will begin at 9 AM.
A. stop
B. begin*
C. cancel
D. close

WRONG EXAMPLE (DO NOT USE):
Question 1
A) stop
B) begin
C) cancel
D) close
Correct answer: B

If there is a writing/self-answer section, put it at the end exactly like this:

Tự luận
Câu 1. ...
Câu 2. ...

RETURN ONLY THE FINAL TEST CONTENT IN THE REQUIRED FORMAT.
DO NOT ADD ANY EXTRA TEXT.
`;
}