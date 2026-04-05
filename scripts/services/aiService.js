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
    const timeout = setTimeout(() => controller.abort(), AI_CONFIG.TIMEOUT_MS || 60000);

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
        payload
      })
    });

    clearTimeout(timeout);

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      return buildSmartFallback(type, payload, data?.error || "AI request failed", "worker_error");
    }

    // Worker đang fake -> thay bằng smart fake local xịn hơn
    if (data?.fakeMode === true || data?.provider === "fallback_fake") {
      return buildSmartFallback(type, payload, "Worker fallback fake activated", "smart_fake_v5_local");
    }

    return {
      success: true,
      text: data?.result || "",
      fakeMode: false,
      provider: data?.provider || "live_ai",
      mode: data?.mode || normalizeMode(type),
      raw: data
    };
  } catch (error) {
    console.error("❌ askAI error:", error);
    return buildSmartFallback(type, payload, error.message || "Network error", "network_smart_fake_v5");
  }
}

/* =========================================
   SMART FALLBACK CORE
========================================= */
function buildSmartFallback(type, payload, reason = "", provider = "smart_fake_v5") {
  const text = generateSmartFakeAI(type, payload);

  console.warn("⚠️ Smart Fake AI V5 activated:", {
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
  switch (normalizeMode(type)) {
    case "lesson":
      return generateLesson(payload);
    case "exercise":
      return generateExercise(payload);
    case "exam":
      return generateExam(payload);
    case "toeic":
      return generateToeic(payload);
    default:
      return "Không thể tạo nội dung AI.";
  }
}

/* =========================================
   LESSON
========================================= */
function generateLesson(p = {}) {
  const topic = cleanTopic(p.chuDe || "Chủ đề bài học");
  const subject = p.monHoc || "Môn học";
  const level = p.trinhDo || "Cơ bản";
  const objective = p.mucTieu || `Hiểu và vận dụng ${topic}`;
  const parts = clamp(parseInt(p.soPhan || 4), 3, 6);
  const sourceText = extractSourceText(p);

  const explainBlocks = [
    `Khái niệm nền tảng của ${topic}`,
    `Cấu trúc và cách sử dụng ${topic}`,
    `Các lỗi thường gặp khi học ${topic}`,
    `Cách áp dụng ${topic} trong thực tế`,
    `Mẹo ghi nhớ nhanh ${topic}`
  ];

  let out = `${subject}: ${topic}\n\n`;

  out += `1. Mục tiêu bài học\n`;
  out += `- ${objective}\n`;
  out += `- Nắm được kiến thức trọng tâm của ${topic}\n`;
  out += `- Vận dụng được ${topic} vào bài tập và ví dụ thực tế\n\n`;

  if (sourceText) {
    out += `2. Nội dung cốt lõi\n`;
    extractKeyIdeas(sourceText, 5).forEach((idea) => {
      out += `- ${idea}\n`;
    });
    out += `\n`;
  }

  for (let i = 0; i < parts; i++) {
    out += `${i + 3}. Phần ${i + 1}: ${explainBlocks[i % explainBlocks.length]}\n`;
    out += `- Giải thích nội dung chính\n`;
    out += `- Điểm cần lưu ý\n`;
    out += `- Cách nhận diện lỗi sai thường gặp\n\n`;
  }

  out += `${parts + 3}. Ví dụ minh họa\n`;
  out += `- Ví dụ 1: Ứng dụng ${topic} trong bài học\n`;
  out += `- Ví dụ 2: Phân tích lỗi sai và cách sửa\n\n`;

  out += `${parts + 4}. Mini Practice\n`;
  out += `- Câu 1: Nêu khái niệm chính của ${topic}\n`;
  out += `- Câu 2: Cho ví dụ minh họa về ${topic}\n\n`;

  out += `${parts + 5}. Tóm tắt\n`;
  out += `- Ghi nhớ kiến thức cốt lõi\n`;
  out += `- Ôn lại ví dụ và luyện tập thêm\n`;
  out += `- Trình độ áp dụng: ${level}`;

  return out.trim();
}

/* =========================================
   EXERCISE
========================================= */
function generateExercise(p = {}) {
  const subject = p.monHoc || "Tiếng Anh";
  const topic = cleanTopic(p.chuDe || "Ngữ pháp");
  const count = clamp(parseInt(p.soLuong || p.soCau || 5), 3, 30);
  const difficulty = (p.doKho || "medium").toLowerCase();
  const mode = normalizeQuestionType(
    p.dangBai || p.questionType || p.kieuBai || "mcq"
  );
  const sourceText = extractSourceText(p);

  if (mode === "essay") {
    return generateExerciseEssay({
      subject,
      topic,
      count,
      difficulty,
      sourceText
    });
  }

  if (mode === "mixed") {
    return generateExerciseMixed({
      subject,
      topic,
      count,
      difficulty,
      sourceText
    });
  }

  return generateExerciseMCQ({
    subject,
    topic,
    count,
    difficulty,
    sourceText
  });
}

function generateExerciseMCQ({ subject, topic, count, difficulty, sourceText }) {
  const bank = buildSmartQuestionBank(topic, difficulty, sourceText);
  const selected = pickMany(bank, count);

  let out = `${subject} - Bài tập ${topic} (Trắc nghiệm)\n\n`;

  selected.forEach((q, idx) => {
    out += formatMCQ(idx + 1, q.question, q.options, q.correct) + "\n\n";
  });

  return out.trim();
}

function generateExerciseEssay({ subject, topic, count, difficulty, sourceText }) {
  const questions = buildEssayQuestions(topic, sourceText, count, difficulty);

  let out = `${subject} - Bài tập ${topic} (Tự luận)\n\n`;

  questions.forEach((q, idx) => {
    out += `Câu ${idx + 1}. ${q}\n\n`;
  });

  return out.trim();
}

function generateExerciseMixed({ subject, topic, count, difficulty, sourceText }) {
  const mcqCount = Math.max(2, Math.floor(count * 0.6));
  const essayCount = Math.max(2, count - mcqCount);

  const bank = buildSmartQuestionBank(topic, difficulty, sourceText);
  const selectedMCQ = pickMany(bank, mcqCount);
  const essayQuestions = buildEssayQuestions(topic, sourceText, essayCount, difficulty);

  let out = `${subject} - Bài tập ${topic} (Hỗn hợp)\n\n`;

  out += `PHẦN I. TRẮC NGHIỆM\n\n`;
  selectedMCQ.forEach((q, idx) => {
    out += formatMCQ(idx + 1, q.question, q.options, q.correct) + "\n\n";
  });

  out += `PHẦN II. TỰ LUẬN\n\n`;
  essayQuestions.forEach((q, idx) => {
    out += `Câu ${idx + 1}. ${q}\n\n`;
  });

  return out.trim();
}

/* =========================================
   EXAM
========================================= */
function generateExam(p = {}) {
  const subject = p.monHoc || "Tiếng Anh";
  const topic = cleanTopic(p.chuDe || "Chủ đề kiểm tra");
  const count = clamp(parseInt(p.soCau || p.soLuong || 5), 3, 40);
  const difficulty = (p.doKho || "medium").toLowerCase();
  const mode = normalizeQuestionType(
    p.dangBai || p.questionType || p.kieuBai || "mcq"
  );
  const sourceText = extractSourceText(p);

  if (mode === "essay") {
    return generateExamEssay({
      subject,
      topic,
      count,
      difficulty,
      sourceText
    });
  }

  if (mode === "mixed") {
    return generateExamMixed({
      subject,
      topic,
      count,
      difficulty,
      sourceText
    });
  }

  return generateExamMCQ({
    subject,
    topic,
    count,
    difficulty,
    sourceText
  });
}

function generateExamMCQ({ subject, topic, count, difficulty, sourceText }) {
  const bank = buildSmartExamBank(topic, difficulty, sourceText);
  const selected = pickMany(bank, count);

  let out = `ĐỀ KIỂM TRA\nMôn: ${subject}\nChủ đề: ${topic}\nHình thức: Trắc nghiệm\n\n`;

  selected.forEach((q, idx) => {
    out += formatMCQ(idx + 1, q.question, q.options, q.correct) + "\n\n";
  });

  out += `ĐÁP ÁN\n\n`;
  selected.forEach((q, idx) => {
    out += `Câu ${idx + 1}: ${q.correct}\n`;
  });

  return out.trim();
}

function generateExamEssay({ subject, topic, count, difficulty, sourceText }) {
  const questions = buildEssayQuestions(topic, sourceText, count, difficulty);

  let out = `ĐỀ KIỂM TRA\nMôn: ${subject}\nChủ đề: ${topic}\nHình thức: Tự luận\n\n`;

  questions.forEach((q, idx) => {
    out += `Câu ${idx + 1}. ${q}\n`;
    out += `Điểm: ${calculateEssayPoints(count)}\n\n`;
  });

  out += `GỢI Ý CHẤM\n\n`;
  questions.forEach((q, idx) => {
    out += `Câu ${idx + 1}: Trả lời đúng trọng tâm, có ví dụ minh họa phù hợp.\n`;
  });

  return out.trim();
}

function generateExamMixed({ subject, topic, count, difficulty, sourceText }) {
  const mcqCount = Math.max(3, Math.floor(count * 0.6));
  const essayCount = Math.max(2, count - mcqCount);

  const bank = buildSmartExamBank(topic, difficulty, sourceText);
  const selectedMCQ = pickMany(bank, mcqCount);
  const essayQuestions = buildEssayQuestions(topic, sourceText, essayCount, difficulty);

  let out = `ĐỀ KIỂM TRA\nMôn: ${subject}\nChủ đề: ${topic}\nHình thức: Hỗn hợp\n\n`;

  out += `PHẦN I. TRẮC NGHIỆM\n\n`;
  selectedMCQ.forEach((q, idx) => {
    out += formatMCQ(idx + 1, q.question, q.options, q.correct) + "\n\n";
  });

  out += `PHẦN II. TỰ LUẬN\n\n`;
  essayQuestions.forEach((q, idx) => {
    out += `Câu ${idx + 1}. ${q}\n`;
    out += `Điểm: ${calculateEssayPoints(essayCount)}\n\n`;
  });

  out += `ĐÁP ÁN & GỢI Ý CHẤM\n\n`;
  selectedMCQ.forEach((q, idx) => {
    out += `Trắc nghiệm - Câu ${idx + 1}: ${q.correct}\n`;
  });

  out += `\n`;
  essayQuestions.forEach((q, idx) => {
    out += `Tự luận - Câu ${idx + 1}: Trả lời đúng nội dung, có ví dụ minh họa.\n`;
  });

  return out.trim();
}

/* =========================================
   TOEIC
========================================= */
function generateToeic(p = {}) {
  const part = (p.toeicPart || "Part 5").toLowerCase();
  const topic = cleanTopic(p.chuDe || "Workplace Communication");
  const count = clamp(parseInt(p.soCau || 5), 3, 30);
  const difficulty = (p.doKho || "medium").toLowerCase();
  const vocab = p.vocab || "";
  const target = p.target || "";

  let out = `Mini TOEIC Test - ${normalizeToeicPart(part)} - ${topic}\n\n`;

  const bank = buildToeicBank(part, topic, difficulty, vocab, target);
  const selected = pickMany(bank, count);

  selected.forEach((q, idx) => {
    out += formatMCQ(idx + 1, q.question, q.options, q.correct) + "\n\n";
  });

  return out.trim();
}

/* =========================================
   FORMATTER
========================================= */
function formatMCQ(index, question, options, correctLetter) {
  return `Câu ${index}. ${question}
A. ${cleanOption(options.A)}${correctLetter === "A" ? "*" : ""}
B. ${cleanOption(options.B)}${correctLetter === "B" ? "*" : ""}
C. ${cleanOption(options.C)}${correctLetter === "C" ? "*" : ""}
D. ${cleanOption(options.D)}${correctLetter === "D" ? "*" : ""}`;
}

function cleanOption(str = "") {
  return String(str).replace(/\*+/g, "").trim();
}

/* =========================================
   SMART CONTENT READER
========================================= */
function extractSourceText(p = {}) {
  return String(
    p.duLieuGoc ||
    p.noiDung ||
    p.lessonContent ||
    p.content ||
    p.text ||
    ""
  ).trim();
}

function extractKeyIdeas(text = "", max = 5) {
  const lines = String(text)
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => s.length > 20);

  if (!lines.length) return ["Nội dung trọng tâm của bài học"];

  return lines.slice(0, max);
}

function buildSmartQuestionBank(topic, difficulty, sourceText = "") {
  const sourceBank = buildSourceBasedMCQ(sourceText, topic);
  if (sourceBank.length >= 4) return sourceBank;
  return buildGrammarBank(topic, difficulty);
}

function buildSmartExamBank(topic, difficulty, sourceText = "") {
  const sourceBank = buildSourceBasedMCQ(sourceText, topic);
  if (sourceBank.length >= 4) return sourceBank;
  return buildExamBank(topic, difficulty);
}

function buildSourceBasedMCQ(sourceText = "", topic = "") {
  const text = sourceText.toLowerCase();
  const t = topic.toLowerCase();
  const bank = [];

  if (text.includes("present simple") || t.includes("present simple")) {
    bank.push(
      qShuffle("Which sentence is in the Present Simple tense?", [
        "She goes to school every day.",
        "She is going to school now.",
        "She went to school yesterday.",
        "She has gone to school."
      ], 0),

      qShuffle("Present Simple is commonly used to describe ________.", [
        "habits and routines",
        "actions happening right now",
        "future plans only",
        "unfinished past actions"
      ], 0),

      qShuffle("Choose the correct sentence.", [
        "He plays football every Sunday.",
        "He play football every Sunday.",
        "He is play football every Sunday.",
        "He played football every Sunday."
      ], 0),

      qShuffle("Which signal word often goes with Present Simple?", [
        "usually",
        "now",
        "at the moment",
        "currently"
      ], 0)
    );
  }

  if (text.includes("present continuous") || t.includes("present continuous")) {
    bank.push(
      qShuffle("Which sentence is in the Present Continuous tense?", [
        "She is reading a book now.",
        "She reads a book every day.",
        "She read a book yesterday.",
        "She has read a book."
      ], 0),

      qShuffle("Present Continuous is used for ________.", [
        "actions happening now",
        "general truths",
        "past habits",
        "completed actions"
      ], 0),

      qShuffle("Choose the correct sentence.", [
        "They are studying English now.",
        "They studying English now.",
        "They studies English now.",
        "They study English now."
      ], 0),

      qShuffle("Which signal word often goes with Present Continuous?", [
        "now",
        "last week",
        "yesterday",
        "ago"
      ], 0)
    );
  }

  if (text.includes("present perfect") || t.includes("present perfect")) {
    bank.push(
      qShuffle("Which sentence is in the Present Perfect tense?", [
        "I have finished my homework.",
        "I finished my homework yesterday.",
        "I am finishing my homework.",
        "I finish my homework every day."
      ], 0),

      qShuffle("Present Perfect often connects the ________ with the present.", [
        "past",
        "future",
        "adjective",
        "subject"
      ], 0),

      qShuffle("Choose the correct sentence.", [
        "She has lived here for five years.",
        "She have lived here for five years.",
        "She lived here for five years now.",
        "She is live here for five years."
      ], 0)
    );
  }

  if (text.includes("past simple") || t.includes("past simple")) {
    bank.push(
      qShuffle("Which sentence is in the Past Simple tense?", [
        "She visited her grandmother yesterday.",
        "She visits her grandmother every Sunday.",
        "She is visiting her grandmother now.",
        "She has visited her grandmother."
      ], 0),

      qShuffle("Past Simple is mainly used for ________.", [
        "finished actions in the past",
        "actions happening now",
        "future intentions",
        "daily routines"
      ], 0),

      qShuffle("Choose the correct sentence.", [
        "They watched a movie last night.",
        "They watch a movie last night.",
        "They are watched a movie last night.",
        "They have watch a movie last night."
      ], 0)
    );
  }

  return bank;
}

function buildEssayQuestions(topic, sourceText = "", count = 5, difficulty = "medium") {
  const t = topic.toLowerCase();
  const text = sourceText.toLowerCase();

  let bank = [];

  if (text.includes("present simple") || t.includes("present simple")) {
    bank.push(
      "Viết 5 câu sử dụng thì Present Simple để nói về thói quen hằng ngày của em.",
      "Nêu công thức của thì Present Simple và cho 3 ví dụ minh họa.",
      "Phân biệt cách dùng của động từ thường và động từ 'to be' trong thì Present Simple.",
      "Viết một đoạn văn ngắn (4–5 câu) về lịch sinh hoạt hằng ngày bằng thì Present Simple.",
      "Tìm 3 trạng từ chỉ tần suất thường dùng với Present Simple và đặt câu với mỗi từ."
    );
  }

  if (text.includes("present continuous") || t.includes("present continuous")) {
    bank.push(
      "Viết 5 câu sử dụng thì Present Continuous để mô tả những gì đang diễn ra lúc này.",
      "Nêu công thức của thì Present Continuous và cho 3 ví dụ minh họa.",
      "Phân biệt Present Continuous với Present Simple bằng ví dụ cụ thể.",
      "Viết đoạn văn ngắn (4–5 câu) mô tả hoạt động của gia đình em vào buổi tối.",
      "Cho 5 động từ và chia ở thì Present Continuous."
    );
  }

  if (text.includes("present perfect") || t.includes("present perfect")) {
    bank.push(
      "Nêu công thức của thì Present Perfect và cho 3 ví dụ minh họa.",
      "Viết 5 câu sử dụng Present Perfect với các trạng từ: already, just, ever, never, yet.",
      "Phân biệt Present Perfect và Past Simple bằng 3 cặp ví dụ.",
      "Viết đoạn văn ngắn (4–5 câu) kể về những trải nghiệm em đã từng có.",
      "Đặt 5 câu hỏi với 'Have you ever...?' và tự trả lời."
    );
  }

  if (text.includes("past simple") || t.includes("past simple")) {
    bank.push(
      "Viết 5 câu sử dụng thì Past Simple để kể về ngày hôm qua của em.",
      "Nêu công thức của thì Past Simple và cho 3 ví dụ minh họa.",
      "Viết đoạn văn ngắn (4–5 câu) kể về một chuyến đi đáng nhớ trong quá khứ.",
      "Phân biệt Past Simple với Present Perfect bằng ví dụ.",
      "Cho 5 động từ và chia ở thì Past Simple."
    );
  }

  if (bank.length < count) {
    bank.push(
      `Trình bày khái niệm chính của chủ đề ${topic}.`,
      `Cho 3 ví dụ minh họa về ${topic}.`,
      `Nêu các lỗi thường gặp khi học ${topic} và cách sửa.`,
      `Viết đoạn văn ngắn có sử dụng kiến thức về ${topic}.`,
      `Tạo 5 câu vận dụng liên quan đến ${topic}.`,
      `So sánh ${topic} với một cấu trúc hoặc chủ điểm ngữ pháp gần giống.`,
      `Nêu dấu hiệu nhận biết quan trọng của ${topic}.`
    );
  }

  return pickMany(bank, count);
}

function calculateEssayPoints(count = 5) {
  const point = (10 / Math.max(1, count)).toFixed(1);
  return `${point} điểm`;
}

/* =========================================
   TOEIC BANK
========================================= */
function buildToeicBank(part, topic, difficulty, vocab = "", target = "") {
  const t = `${topic} ${vocab} ${target}`.toLowerCase();

  const raw = [];

  if (t.includes("email") || t.includes("office") || t.includes("business")) {
    raw.push(
      qShuffle("Please send the revised contract to the client before the end of the ________.", ["day", "daily", "days", "daytime"], 0),
      qShuffle("All employees are required to ________ the updated company policy this week.", ["review", "reviewed", "reviewing", "reviews"], 0),
      qShuffle("The meeting has been postponed ________ the manager is out of town.", ["because", "although", "unless", "despite"], 0),
      qShuffle("Please make sure the report is ________ by noon tomorrow.", ["completed", "complete", "completing", "completes"], 0),
      qShuffle("Visitors must check in at the reception ________ upon arrival.", ["desk", "desks", "desking", "desked"], 0),
      qShuffle("The company plans to ________ a new training program next month.", ["launch", "launched", "launching", "launches"], 0),
      qShuffle("The sales team exceeded its monthly ________ by 15 percent.", ["target", "targeted", "targeting", "targets"], 0),
      qShuffle("Employees should submit travel expense forms no later ________ Friday.", ["than", "then", "to", "for"], 0),
      qShuffle("The marketing department will ________ the final brochure this afternoon.", ["approve", "approved", "approving", "approves"], 0),
      qShuffle("Applicants are expected to have strong communication ________.", ["skills", "skillful", "skilled", "skill"], 0)
    );
  } else {
    raw.push(
      qShuffle("The manager asked all staff to ________ the updated handbook before Monday.", ["read", "reads", "reading", "reads again"], 0),
      qShuffle("Our company will open a new branch office in ________ July.", ["in", "at", "on", "by"], 0),
      qShuffle("The shipment was delayed due to an unexpected problem at the ________ center.", ["distribution", "distribute", "distributed", "distributing"], 0),
      qShuffle("Customers are advised to keep their receipts for future ________.", ["reference", "refer", "referring", "referred"], 0),
      qShuffle("The presentation was both informative and highly ________.", ["engaging", "engage", "engaged", "engagement"], 0),
      qShuffle("Applicants should have at least three years of relevant work ________.", ["experience", "experienced", "experiencing", "experiences"], 0),
      qShuffle("Please attach the invoice to your reimbursement ________.", ["form", "formal", "formation", "format"], 0),
      qShuffle("The conference room has been reserved ________ 2 p.m. to 4 p.m.", ["from", "by", "until", "during"], 0),
      qShuffle("Employees who arrive late must notify their supervisor in ________.", ["advance", "advanced", "advancing", "advancement"], 0),
      qShuffle("The software update will improve the system's overall ________.", ["performance", "perform", "performing", "performed"], 0)
    );
  }

  return raw;
}

/* =========================================
   EXAM BANK
========================================= */
function buildExamBank(topic, difficulty) {
  const t = topic.toLowerCase();

  if (t.includes("present perfect")) {
    return [
      qShuffle("She ________ in this company for five years.", ["has worked", "works", "worked", "working"], 0),
      qShuffle("They ________ their homework yet.", ["haven't finished", "didn't finish", "don't finish", "aren't finishing"], 0),
      qShuffle("________ you ever been to Da Nang?", ["Have", "Did", "Do", "Are"], 0),
      qShuffle("I ________ this movie before.", ["have seen", "see", "saw", "am seeing"], 0),
      qShuffle("He has just ________ the door.", ["opened", "open", "opening", "opens"], 0),
      qShuffle("We ________ here since last year.", ["have lived", "lived", "live", "are living"], 0),
      qShuffle("Lan ________ her lunch already.", ["has eaten", "eats", "ate", "eating"], 0),
      qShuffle("I ________ never ________ that restaurant before.", ["have / visited", "did / visit", "am / visiting", "was / visited"], 0)
    ];
  }

  if (t.includes("past simple")) {
    return [
      qShuffle("Yesterday, we ________ to the park.", ["went", "go", "gone", "going"], 0),
      qShuffle("She ________ a letter last night.", ["wrote", "writes", "written", "writing"], 0),
      qShuffle("They ________ football after school yesterday.", ["played", "play", "plays", "playing"], 0),
      qShuffle("I ________ my keys this morning.", ["lost", "lose", "losing", "loses"], 0),
      qShuffle("He ________ at home all weekend.", ["stayed", "stays", "stay", "staying"], 0),
      qShuffle("My brother ________ me yesterday evening.", ["called", "calls", "calling", "call"], 0),
      qShuffle("We ________ dinner at 7 p.m. yesterday.", ["had", "have", "having", "has"], 0),
      qShuffle("The students ________ the lesson carefully.", ["studied", "study", "studies", "studying"], 0)
    ];
  }

  return [
    qShuffle("Từ nào sau đây là danh từ?", ["teacher", "beautiful", "quickly", "run"], 0),
    qShuffle("Từ nào sau đây là động từ?", ["write", "happiness", "careful", "slowly"], 0),
    qShuffle("Câu nào đúng ngữ pháp?", ["She goes to school.", "She go to school.", "She going to school.", "She gone to school."], 0),
    qShuffle("Chọn từ trái nghĩa với 'happy'.", ["sad", "glad", "cheerful", "excited"], 0),
    qShuffle("Từ nào sau đây là tính từ?", ["beautiful", "beauty", "beautify", "beautifully"], 0),
    qShuffle("Từ nào sau đây là trạng từ?", ["quickly", "quick", "quicken", "quickness"], 0),
    qShuffle("Từ nào sau đây là giới từ?", ["under", "beautiful", "run", "teacher"], 0),
    qShuffle("Chọn từ đồng nghĩa gần nhất với 'begin'.", ["start", "stop", "finish", "close"], 0)
  ];
}

/* =========================================
   EXERCISE BANK
========================================= */
function buildGrammarBank(topic, difficulty) {
  const t = topic.toLowerCase();

  if (t.includes("present simple")) {
    return [
      qShuffle("She ________ to school every day.", ["goes", "go", "going", "gone"], 0),
      qShuffle("My father ________ coffee every morning.", ["drinks", "drink", "drinking", "drank"], 0),
      qShuffle("They ________ football after class.", ["play", "plays", "playing", "played"], 0),
      qShuffle("He usually ________ up at 6 a.m.", ["gets", "get", "got", "getting"], 0),
      qShuffle("The sun ________ in the east.", ["rises", "rise", "rose", "rising"], 0),
      qShuffle("Lan ________ English very well.", ["speaks", "speak", "speaking", "spoke"], 0),
      qShuffle("My sister ________ TV in the evening.", ["watches", "watch", "watched", "watching"], 0),
      qShuffle("We ________ breakfast at 7 o'clock.", ["have", "has", "having", "had"], 0)
    ];
  }

  if (t.includes("present perfect")) {
    return [
      qShuffle("I ________ my homework already.", ["have finished", "finished", "finish", "finishing"], 0),
      qShuffle("She ________ here since 2020.", ["has worked", "works", "worked", "working"], 0),
      qShuffle("They ________ to Hue before.", ["have been", "were", "go", "went"], 0),
      qShuffle("We ________ this lesson yet.", ["haven't studied", "don't study", "didn't study", "aren't studying"], 0),
      qShuffle("________ you ever tried sushi?", ["Have", "Did", "Do", "Are"], 0),
      qShuffle("Nam ________ his project recently.", ["has completed", "completed", "completes", "completing"], 0),
      qShuffle("I ________ never ________ that movie.", ["have / seen", "did / see", "am / seeing", "was / seen"], 0),
      qShuffle("My parents ________ to Ha Long Bay several times.", ["have traveled", "traveled", "travel", "are traveling"], 0)
    ];
  }

  return [
    qShuffle("She ________ to school every day.", ["goes", "go", "going", "gone"], 0),
    qShuffle("They ________ football after class.", ["play", "plays", "playing", "played"], 0),
    qShuffle("My mother ________ dinner at 6 p.m.", ["cooks", "cook", "cooking", "cooked"], 0),
    qShuffle("We ________ English every Monday.", ["study", "studies", "studying", "studied"], 0),
    qShuffle("He ________ a new book yesterday.", ["bought", "buy", "buys", "buying"], 0),
    qShuffle("Lan ________ to music every evening.", ["listens", "listen", "listening", "listened"], 0),
    qShuffle("My brother ________ soccer on weekends.", ["plays", "play", "playing", "played"], 0),
    qShuffle("The teacher ________ the lesson clearly.", ["explains", "explain", "explained", "explaining"], 0)
  ];
}

/* =========================================
   RANDOMIZER
========================================= */
function qShuffle(question, optionsArray, correctIndex = 0) {
  const letters = ["A", "B", "C", "D"];
  const items = optionsArray.map((text, idx) => ({
    text,
    correct: idx === correctIndex
  }));

  shuffle(items);

  const options = {};
  let correct = "A";

  items.forEach((item, idx) => {
    const letter = letters[idx];
    options[letter] = item.text;
    if (item.correct) correct = letter;
  });

  return { question, options, correct };
}

function pickMany(arr = [], count = 5) {
  const cloned = [...arr];
  shuffle(cloned);

  const result = [];
  while (result.length < count && cloned.length > 0) {
    result.push(cloned[result.length % cloned.length]);
  }
  return result;
}

function shuffle(arr = []) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* =========================================
   HELPERS
========================================= */
function normalizeToeicPart(part = "") {
  const p = String(part).toLowerCase();

  if (p.includes("5")) return "Part 5";
  if (p.includes("6")) return "Part 6";
  if (p.includes("7")) return "Part 7";

  return "Part 5";
}

function normalizeQuestionType(type = "") {
  const t = String(type).toLowerCase().trim();

  if (
    t.includes("essay") ||
    t.includes("tu luan") ||
    t.includes("tự luận") ||
    t.includes("viet") ||
    t.includes("viết")
  ) return "essay";

  if (
    t.includes("mixed") ||
    t.includes("hon hop") ||
    t.includes("hỗn hợp") ||
    t.includes("mix")
  ) return "mixed";

  return "mcq";
}

function cleanTopic(str = "") {
  return String(str).trim() || "Chủ đề";
}

function clamp(num, min, max) {
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
}

function normalizeMode(type = "") {
  const t = String(type).toLowerCase().trim();

  if (t === "lesson") return "lesson";
  if (t === "exercise") return "exercise";
  if (t === "exam") return "exam";
  if (t === "toeic") return "toeic";

  return "lesson";
}

function getCurrentUserId() {
  return (
    localStorage.getItem("teacher_id") ||
    localStorage.getItem("user_id") ||
    "teacher_demo_001"
  );
}