// /scripts/services/aiService.js
import { AI_CONFIG } from "../../config/aiConfig.js";

export async function askAI({
  type = "lesson",
  prompt = "",
  payload = {},
  userId = null,
  role = "teacher"
} = {}) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      AI_CONFIG.TIMEOUT_MS || 60000
    );

    const normalizedPayload = normalizePayload(type, payload);

    const res = await fetch(AI_CONFIG.WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        userId: userId || getCurrentUserId(),
        role,
        mode: normalizeMode(type),
        prompt,
        payload: normalizedPayload
      })
    });

    clearTimeout(timeout);

    const data = await res.json().catch(() => ({}));

    console.log("🧠 Worker AI Response FULL:", JSON.stringify(data, null, 2));

    if (!res.ok || !data?.ok) {
      return buildSmartFallback(
        type,
        normalizedPayload,
        data?.error || "AI request failed",
        "worker_error"
      );
    }

    const workerText = String(data?.result || "").trim();

    if (!workerText) {
      return buildSmartFallback(
        type,
        normalizedPayload,
        "Worker returned empty result",
        "worker_empty"
      );
    }

    return {
      success: true,
      text: workerText,
      fakeMode: !!data?.fakeMode,
      provider: data?.provider || "live_ai",
      mode: data?.mode || normalizeMode(type),
      raw: data
    };
  } catch (error) {
    console.error("❌ askAI error:", error);

    return buildSmartFallback(
      type,
      normalizePayload(type, payload),
      error?.message || "Network error",
      "network_smart_fake_v3_pro"
    );
  }
}

/* =========================================
   TEST AI KEY
========================================= */
export async function testAIKey() {
  try {
    const res = await fetch(AI_CONFIG.WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        testKey: true
      })
    });

    const data = await res.json().catch(() => ({}));

    console.log("🔑 AI KEY TEST:", data);

    return {
      success: !!data?.ok,
      text: data?.result || "NO_RESPONSE",
      provider: data?.provider || "unknown",
      fakeMode: !!data?.fakeMode,
      raw: data
    };
  } catch (error) {
    console.error("❌ testAIKey error:", error);

    return {
      success: false,
      text: "KEY_FAIL",
      provider: "network_error",
      fakeMode: true,
      raw: { error: error?.message || "Unknown network error" }
    };
  }
}

/* =========================================
   NORMALIZE PAYLOAD
========================================= */
function normalizePayload(type = "lesson", payload = {}) {
  const mode = normalizeMode(type);
  const inferredTask = inferTaskIntent(payload, mode);

  return {
    ...payload,

    mode,

    chuDe: payload?.chuDe || payload?.topic || payload?.title || "",
    monHoc: payload?.monHoc || payload?.subject || "Tiếng Anh",
    trinhDo: payload?.trinhDo || payload?.level || "A2",

    soLuong: parseInt(payload?.soLuong || payload?.soCau || payload?.slideCount || 5) || 5,
    soCau: parseInt(payload?.soCau || payload?.soLuong || payload?.slideCount || 5) || 5,
    slideCount: parseInt(payload?.slideCount || payload?.soLuong || payload?.soCau || 12) || 12,

    questionType: normalizeQuestionType(
      payload?.questionType ||
      payload?.dangCauHoi ||
      payload?.loaiCauHoi ||
      payload?.dangBai ||
      payload?.loaiDe ||
      ""
    ),

    inferredTask,
    outputStyle: inferOutputStyle(payload, mode),
    sourceLength: getTextLength(payload?.duLieuGoc || payload?.sourceText || ""),

    extra:
      payload?.extra ||
      payload?.yeuCauThem ||
      payload?.ghiChu ||
      payload?.note ||
      "",

    // PPTX-specific
    sourceType: payload?.sourceType || "custom",
    audience: payload?.audience || "secondary",
    language: payload?.language || "vi",
    style: payload?.style || "modern",
    includeActivities: !!payload?.includeActivities,
    includeQuestions: !!payload?.includeQuestions,
    includeHomework: !!payload?.includeHomework,
    includeNotes: !!payload?.includeNotes
  };
}

function normalizeQuestionType(type = "") {
  const t = String(type).toLowerCase().trim();

  if (
    t.includes("essay") ||
    t.includes("tự luận") ||
    t.includes("tu_luan") ||
    t.includes("writing")
  ) {
    return "essay";
  }

  if (
    t.includes("mixed") ||
    t.includes("mix") ||
    t.includes("trộn")
  ) {
    return "mixed";
  }

  if (
    t.includes("dialogue") ||
    t.includes("hội thoại")
  ) {
    return "dialogue";
  }

  if (
    t.includes("reading") ||
    t.includes("đọc hiểu")
  ) {
    return "reading";
  }

  if (
    t.includes("fill") ||
    t.includes("điền từ")
  ) {
    return "fill_blank";
  }

  if (
    t.includes("qa") ||
    t.includes("trả lời câu hỏi") ||
    t.includes("question answer")
  ) {
    return "qa";
  }

  return "multiple_choice";
}

function inferTaskIntent(payload = {}, mode = "lesson") {
  const raw = [
    payload?.dangBai,
    payload?.ghiChu,
    payload?.extra,
    payload?.loaiDe,
    payload?.chuDe,
    payload?.mode
  ]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();

  if (mode === "lesson") return "lesson_builder";
  if (mode === "pptx") return "pptx_slide_generation";

  if (raw.includes("hội thoại") || raw.includes("dialogue")) return "dialogue_generation";
  if (raw.includes("đọc hiểu") || raw.includes("reading")) return "reading_comprehension";
  if (raw.includes("điền từ") || raw.includes("fill")) return "fill_blank";
  if (raw.includes("trả lời câu hỏi") || raw.includes("qa")) return "question_answer";
  if (raw.includes("tự luận") || raw.includes("essay")) return "essay_generation";
  if (raw.includes("mix") || raw.includes("trộn")) return "mixed_assessment";
  if (raw.includes("toeic")) return "toeic_generation";

  if (mode === "exercise") return "exercise_generation";
  if (mode === "exam") return "exam_generation";
  if (mode === "toeic") return "toeic_generation";

  return "generic_teaching_content";
}

function inferOutputStyle(payload = {}, mode = "lesson") {
  const raw = [
    payload?.dangBai,
    payload?.ghiChu,
    payload?.loaiDe
  ]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();

  if (mode === "lesson") return "structured_lesson";
  if (mode === "pptx") return "structured_slide_json";
  if (raw.includes("hội thoại")) return "dialogue_blocks";
  if (raw.includes("đọc hiểu")) return "passage_with_questions";
  if (raw.includes("điền từ")) return "gap_fill";
  if (raw.includes("trả lời câu hỏi")) return "short_answer";
  if (raw.includes("tự luận")) return "essay_questions";
  if (raw.includes("mix")) return "mixed_sections";

  return "mcq_or_requested";
}

function getTextLength(text = "") {
  return String(text || "").trim().length;
}

/* =========================================
   SMART FALLBACK CORE
========================================= */
function buildSmartFallback(type, payload, reason = "", provider = "smart_fake_v3_pro_local") {
  const text = generateSmartFakeAI(type, payload);

  console.warn("⚠️ Smart Fake AI activated:", {
    provider,
    reason,
    type,
    payload
  });

  return {
    success: true,
    text,
    fakeMode: true,
    provider,
    mode: normalizeMode(type),
    raw: { reason }
  };
}

function generateSmartFakeAI(type = "lesson", payload = {}) {
  const mode = normalizeMode(type);
  const topic = payload?.chuDe || payload?.title || "Chủ đề bài học";
  const count = parseInt(payload?.soLuong || payload?.soCau || payload?.slideCount || 5) || 5;
  const inferredTask = payload?.inferredTask || "generic";
  const questionType = String(payload?.questionType || "multiple_choice").toLowerCase();
  const source = String(payload?.duLieuGoc || payload?.sourceText || "").trim();

  // ✅ PPTX FALLBACK
  if (mode === "pptx") {
    return JSON.stringify({
      title: topic || "AI Presentation",
      mode: payload?.mode || "teaching",
      theme: payload?.style || "modern",
      language: payload?.language || "vi",
      audience: payload?.audience || "secondary",
      slides: buildFakePptxSlides({
        topic,
        count,
        source,
        includeActivities: payload?.includeActivities,
        includeQuestions: payload?.includeQuestions,
        includeHomework: payload?.includeHomework,
        includeNotes: payload?.includeNotes
      })
    }, null, 2);
  }

  if (mode === "lesson") {
    return `
BÀI GIẢNG: ${topic}

1. Mục tiêu bài học
- Hiểu nội dung trọng tâm của ${topic}
- Biết áp dụng vào bài tập và giao tiếp thực tế
- Ghi nhớ từ vựng / cấu trúc chính liên quan đến chủ đề

2. Nội dung chính
- Giới thiệu khái niệm / bối cảnh của ${topic}
- Phân tích các điểm quan trọng
- Ví dụ minh họa dễ hiểu
- Gợi ý cách áp dụng vào thực hành

3. Ví dụ minh họa
- Ví dụ 1: Ứng dụng nội dung vào tình huống quen thuộc
- Ví dụ 2: So sánh đúng / sai
- Ví dụ 3: Mở rộng theo trình độ học sinh

4. Mini Practice
1. Hãy nêu 2 ý chính của ${topic}
2. Viết 2 câu ví dụ liên quan đến ${topic}
3. Trả lời 1 câu hỏi ngắn theo nội dung bài học

5. Tóm tắt
- Ghi nhớ khái niệm
- Ghi nhớ ví dụ
- Ghi nhớ cách áp dụng
    `.trim();
  }

  if (mode === "exercise") {
    if (inferredTask === "dialogue_generation" || questionType === "dialogue") {
      let out = `BÀI TẬP HỘI THOẠI - ${topic}\n\n`;
      for (let i = 1; i <= count; i++) {
        out += `Hội thoại ${i}.\n`;
        out += `Lan: Hello! How are you today?\n`;
        out += `Minh: I'm fine, thank you. We are talking about ${topic}.\n`;
        out += `Lan: That's great. Can you tell me more?\n`;
        out += `Minh: Sure. It is useful and interesting.\n\n`;
      }
      return out.trim();
    }

    if (inferredTask === "reading_comprehension" || questionType === "reading") {
      let out = `BÀI TẬP ĐỌC HIỂU - ${topic}\n\n`;
      out += `Đoạn văn\n${source || `This passage is about ${topic}. It helps students understand the main idea, supporting details, and useful vocabulary in context.`}\n\n`;
      for (let i = 1; i <= count; i++) {
        out += `Câu ${i}. Trả lời câu hỏi về đoạn văn số ${i}.\n\n`;
      }
      return out.trim();
    }

    if (inferredTask === "fill_blank" || questionType === "fill_blank") {
      let out = `BÀI TẬP ĐIỀN TỪ - ${topic}\n\n`;
      for (let i = 1; i <= count; i++) {
        out += `Câu ${i}. Complete the sentence about ${topic}: ____________.\n\n`;
      }
      return out.trim();
    }

    if (inferredTask === "question_answer" || questionType === "qa") {
      let out = `BÀI TẬP TRẢ LỜI CÂU HỎI - ${topic}\n\n`;
      for (let i = 1; i <= count; i++) {
        out += `Câu ${i}. Hãy trả lời câu hỏi liên quan đến ${topic}.\n\n`;
      }
      return out.trim();
    }

    if (inferredTask === "essay_generation" || questionType === "essay") {
      let out = `BÀI TẬP TỰ LUẬN - ${topic}\n\n`;
      for (let i = 1; i <= count; i++) {
        out += `Câu ${i}. Trình bày nội dung liên quan đến ${topic}.\n\n`;
      }
      return out.trim();
    }
  }

  let out = `${mode.toUpperCase()} - ${topic}\n\n`;

  for (let i = 1; i <= count; i++) {
    if (questionType === "essay") {
      out += `Câu ${i}. Trình bày nội dung liên quan đến ${topic}.\n\n`;
    } else if (questionType === "mixed") {
      if (i % 2 === 0) {
        out += `Câu ${i}. Trình bày nội dung liên quan đến ${topic}.\n\n`;
      } else {
        out += `Câu ${i}. Nội dung câu hỏi về ${topic}\n`;
        out += `A. Đáp án A\n`;
        out += `B. Đáp án B*\n`;
        out += `C. Đáp án C\n`;
        out += `D. Đáp án D\n\n`;
      }
    } else {
      out += `Câu ${i}. Nội dung câu hỏi về ${topic}\n`;
      out += `A. Đáp án A\n`;
      out += `B. Đáp án B*\n`;
      out += `C. Đáp án C\n`;
      out += `D. Đáp án D\n\n`;
    }
  }

  return out.trim();
}

function buildFakePptxSlides({
  topic = "Chủ đề bài học",
  count = 8,
  source = "",
  includeActivities = true,
  includeQuestions = true,
  includeHomework = true,
  includeNotes = true
} = {}) {
  const slides = [];

  slides.push({
    type: "cover",
    title: topic,
    subtitle: "AI Generated Presentation",
    speakerNotes: includeNotes ? "Giới thiệu nhanh nội dung bài trình chiếu." : ""
  });

  slides.push({
    type: "objectives",
    title: "Mục tiêu",
    bullets: [
      `Hiểu nội dung chính của ${topic}`,
      `Nắm được các ý trọng tâm`,
      `Có thể áp dụng vào thực hành hoặc thảo luận`
    ],
    speakerNotes: includeNotes ? "Nhấn mạnh mục tiêu trước khi vào nội dung chính." : ""
  });

  slides.push({
    type: "agenda",
    title: "Nội dung chính",
    bullets: [
      "Khái niệm / giới thiệu",
      "Phân tích nội dung",
      "Ví dụ minh họa",
      "Thực hành / tương tác",
      "Tổng kết"
    ],
    speakerNotes: includeNotes ? "Cho học viên biết cấu trúc buổi học." : ""
  });

  slides.push({
    type: "example",
    title: "Ví dụ minh họa",
    bullets: [
      `Ví dụ thực tế liên quan đến ${topic}`,
      "Tình huống áp dụng dễ hiểu",
      "Mở rộng theo trình độ người học"
    ],
    speakerNotes: includeNotes ? "Dùng ví dụ để làm mềm nội dung." : ""
  });

  if (includeActivities) {
    slides.push({
      type: "activity",
      title: "Hoạt động lớp học",
      questions: [
        `Thảo luận nhanh: bạn hiểu gì về ${topic}?`,
        `Làm việc nhóm: tìm 2 ví dụ liên quan đến ${topic}.`
      ],
      speakerNotes: includeNotes ? "Cho học viên trao đổi nhóm nhỏ." : ""
    });
  }

  if (includeQuestions) {
    slides.push({
      type: "practice",
      title: "Câu hỏi tương tác",
      questions: [
        `Câu hỏi 1: Ý chính của ${topic} là gì?`,
        `Câu hỏi 2: Bạn có thể nêu một ví dụ không?`,
        `Câu hỏi 3: Nội dung này áp dụng khi nào?`
      ],
      speakerNotes: includeNotes ? "Dùng để kiểm tra mức độ hiểu bài." : ""
    });
  }

  slides.push({
    type: "summary",
    title: "Tổng kết",
    bullets: [
      `Tóm tắt lại nội dung chính của ${topic}`,
      "Nhớ các ý quan trọng",
      "Sẵn sàng chuyển sang luyện tập / áp dụng"
    ],
    speakerNotes: includeNotes ? "Chốt bài ngắn gọn, rõ ý." : ""
  });

  if (includeHomework) {
    slides.push({
      type: "homework",
      title: "Bài tập / nhiệm vụ về nhà",
      bullets: [
        `Ôn lại nội dung về ${topic}`,
        "Viết 3-5 ý hoặc ví dụ liên quan",
        "Chuẩn bị cho buổi học tiếp theo"
      ],
      speakerNotes: includeNotes ? "Giao nhiệm vụ ngắn, dễ làm." : ""
    });
  }

  slides.push({
    type: "thankyou",
    title: "Thank You!",
    subtitle: "Cảm ơn đã theo dõi",
    speakerNotes: includeNotes ? "Kết thúc buổi dạy / trình bày." : ""
  });

  return slides.slice(0, Math.max(5, count));
}

/* =========================================
   NORMALIZE MODE
========================================= */
function normalizeMode(type = "") {
  const t = String(type).toLowerCase().trim();

  if (t === "lesson" || t === "bai_giang" || t === "baigiang") return "lesson";
  if (t === "exercise" || t === "bai_tap" || t === "baitap") return "exercise";
  if (t === "exam" || t === "test" || t === "kiem_tra" || t === "kiemtra") return "exam";
  if (t === "toeic") return "toeic";
  if (t === "pptx" || t === "slide" || t === "presentation") return "pptx";

  return "lesson";
}

/* =========================================
   USER ID
========================================= */
function getCurrentUserId() {
  return (
    localStorage.getItem("teacher_id") ||
    localStorage.getItem("user_id") ||
    "teacher_demo_001"
  );
}