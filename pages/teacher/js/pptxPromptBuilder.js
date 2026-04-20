// /pages/teacher/js/pptxPromptBuilder.js

export function buildPptxPrompt({
  sourceType = "custom",
  mode = "teaching",
  audience = "secondary",
  language = "vi",
  style = "modern",
  slideCount = 10,
  fileName = "AI_Presentation",
  sourceText = "",
  includeActivities = true,
  includeQuestions = true,
  includeHomework = true,
  includeNotes = true
} = {}) {
  const safeText = trimSource(sourceText, 9000);

  return `
Bạn là AI chuyên tạo JSON slide PowerPoint cho giáo viên.

==============================
NHIỆM VỤ CỦA BẠN
==============================
Bạn phải tạo slide PowerPoint dựa trên NỘI DUNG HỌC THẬT được cung cấp ở phần:
SOURCE_MATERIAL

CỰC KỲ QUAN TRỌNG:
- CHỈ dùng nội dung trong SOURCE_MATERIAL để tạo slide
- KHÔNG được dùng phần hướng dẫn này làm nội dung slide
- KHÔNG được biến yêu cầu hệ thống thành nội dung bài học
- KHÔNG được đưa các dòng như:
  "Slide 1: Trang bìa"
  "Có hoạt động lớp học"
  "Tạo nội dung slide PowerPoint"
  "Đọc kỹ nội dung nguồn"
  vào nội dung slide
- Nếu nội dung nguồn ít, hãy tóm tắt đúng phần ít đó
- Nếu nội dung nguồn nhiều, hãy chia thành các ý chính logic
- SlideCount chỉ là gợi ý, không phải giới hạn cứng
- Ưu tiên đầy đủ nội dung hơn là đúng số lượng
BẮT BUỘC:
- Phải tạo đủ {slideCount} slides
- Slide phải theo flow dạy học:
  1. Cover
  2. Objectives
  3. Warm-up
  4. Content
  5. Example
  6. Practice
  7. Summary
  8. Homework

- Không được viết chung chung
- Mỗi bullet phải cụ thể, có ý nghĩa giảng dạy
- Không dùng placeholder như "ý chính", "ghi chú"

==============================
THÔNG TIN THIẾT KẾ SLIDE
==============================
- Loại nguồn: ${sourceType}
- Kiểu trình chiếu: ${mode}
- Đối tượng học viên: ${audience}
- Ngôn ngữ: ${language}
- Phong cách: ${style}
- Số slide mong muốn: ${slideCount}
- Tên bài: ${fileName}

==============================
YÊU CẦU CHUYỂN ĐỔI NỘI DUNG
==============================
- Slide đầu là trang bìa
- Slide thứ 2 là overview / mục tiêu / tổng quan
- Các slide tiếp theo phải chia theo NỘI DUNG THẬT trong SOURCE_MATERIAL
- Nếu tài liệu có:
  + tiêu đề bài học
  + mục nhỏ
  + từ vựng
  + cấu trúc
  + ví dụ
  + quy trình
  + bước làm
  + câu hỏi
  + hoạt động
  => phải ưu tiên dùng chúng làm nội dung slide
- Mỗi slide nên ngắn gọn, dễ nhìn
- Mỗi slide tối đa 3-6 bullet
- Không viết lại thành bài văn dài
- Không lặp ý vô nghĩa
- Không bịa nội dung ngoài tài liệu nếu không cần thiết
- Ưu tiên chia slide theo từng ý nhỏ:
	+ mỗi khái niệm = 1 slide
	+ mỗi bước quy trình = 1 slide
	+ mỗi ví dụ quan trọng = 1 slide
- Tuyệt đối không được sử dụng bất kỳ câu nào từ phần hướng dẫn prompt làm nội dung slide.

==============================
TÙY CHỌN BỔ SUNG
==============================
- Có hoạt động lớp học: ${includeActivities ? "Có" : "Không"}
- Có câu hỏi tương tác: ${includeQuestions ? "Có" : "Không"}
- Có bài tập cuối: ${includeHomework ? "Có" : "Không"}
- Có ghi chú giáo viên: ${includeNotes ? "Có" : "Không"}

==============================
OUTPUT FORMAT BẮT BUỘC
==============================
Bạn chỉ được trả về JSON THUẦN.
Không markdown.
Không giải thích.
Không viết thêm chữ nào ngoài JSON.

FORMAT JSON:
Hãy tạo khoảng ${slideCount} slides.

- Có thể dao động ±40% tùy nội dung
- Ưu tiên chia theo logic nội dung thật
- Không được ép số lượng cố định nếu nội dung cần tách nhỏ
BẮT BUỘC:
- Nếu language = bilingual:
  Mỗi bullet phải là object:
  { "vi": "...", "en": "..." }

- Không được trả về string đơn
- Không được bỏ 1 trong 2 ngôn ngữ

{
  "title": "Tên bài",
  "theme": "${style}",
  "language": "${language}",
  "slides": [
    {
      "type": "cover",
      "title": "Tên bài",
      "subtitle": "Mô tả ngắn"
    },
    {
      "type": "overview",
      "title": "Tổng quan bài học",
      "bullets": ["ý 1", "ý 2", "ý 3"]
    },
    {
      "type": "content",
      "title": "Tiêu đề nội dung thật",
      "bullets": ["ý 1", "ý 2", "ý 3"]
    },
    {
      "type": "activity",
      "title": "Hoạt động lớp học",
      "bullets": ["hoạt động 1", "hoạt động 2"],
      "questions": ["câu hỏi 1", "câu hỏi 2"]
    },
    {
      "type": "homework",
      "title": "Bài tập / dặn dò",
      "bullets": ["ý 1", "ý 2"]
    },
    {
      "type": "summary",
      "title": "Tổng kết",
      "bullets": ["ý chính 1", "ý chính 2", "ý chính 3"]
    }
  ]
}

==============================
QUY TẮC LỌC NHIỄU
==============================
KHÔNG dùng các cụm sau làm nội dung slide:
- NHIỆM VỤ
- THÔNG TIN THIẾT KẾ SLIDE
- YÊU CẦU CHUYỂN ĐỔI NỘI DUNG
- KHÔNG được tự động rút gọn số slide. Nếu nội dung dài thì phải chia nhỏ thành nhiều slide.
- Mỗi ý chính phải có ít nhất 1 slide riêng nếu cần.
- TÙY CHỌN BỔ SUNG
- OUTPUT FORMAT
- QUY TẮC JSON
- Slide 1
- Slide 2
- JSON
- bullet
- title
- subtitle
- questions
- theme
- language

Nếu SOURCE_MATERIAL không có nội dung học thuật rõ ràng,
hãy cố gắng trích ra chủ đề thật và tạo slide bám sát nhất có thể.
- Không được gộp nhiều ý quan trọng vào 1 slide chỉ để giảm số lượng
- Mỗi khái niệm / bước / ví dụ quan trọng nên có slide riêng
- Nếu nội dung dài → phải tăng số slide tương ứng

==============================
SOURCE_MATERIAL (ĐÂY MỚI LÀ NỘI DUNG THẬT)
==============================
${safeText}
`.trim();
}

function trimSource(text = "", max = 9000) {
  const clean = String(text || "").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max) + "\n\n[Nội dung đã được cắt bớt để tối ưu AI]";
}