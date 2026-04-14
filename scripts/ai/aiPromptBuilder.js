import { AI_TYPES } from "./aiTypes.js";

/* =========================
   MAIN BUILDER
========================= */
export function buildAIPrompt(type, payload = {}) {
  const duLieuGoc = (payload.duLieuGoc || "").trim();

  switch (type) {
    case AI_TYPES.LESSON:
      return buildLessonPrompt(duLieuGoc);

    case AI_TYPES.EXERCISE:
      return buildExercisePrompt(duLieuGoc);

    case AI_TYPES.EXAM:
      return buildExamPrompt(duLieuGoc);

    case AI_TYPES.TOEIC:
      return buildToeicPrompt(duLieuGoc);

    default:
      return buildLessonPrompt(duLieuGoc);
  }
}

/* =========================
   LESSON PROMPT (CORE)
========================= */
export function buildLessonPrompt(payload = {}) {
  return `
You are an English teacher.

Create a COMPLETE lesson using ONLY the content provided.

⚠️ STRICT RULES:
- DO NOT skip any section
- DO NOT leave any section empty
- DO NOT add "---" randomly
- DO NOT use markdown (** or ###)
- KEEP EXACT FORMAT below
- MUST include SPEAKING and EXERCISE with real content

================ TEMPLATE =================

=== UNIT 1: ${payload.chuDe || "Topic"} ===

--- OBJECTIVES ---
- Write 3 clear learning objectives

--- VOCABULARY ---
Từ: ...
Meaning (EN): ...
Example: ...

--- GRAMMAR ---
Explanation: ...
Example: ...

--- READING ---
Text:
(Write a short dialogue or paragraph based on the input)

Questions:
1. ...
2. ...
3. ...

--- SPEAKING ---
Task 1:
Student A: ...
Student B: ...

Task 2:
(Role-play related to the topic)

--- WRITING ---
Task: Write a short paragraph using the lesson topic.

--- EXERCISE ---
1. Multiple choice (3 questions, 4 options each)

2. Fill in the blanks (3 sentences)

Answer:
...

--- SUMMARY ---
Write a short summary.

=================================================

INPUT CONTENT:
${payload.duLieuGoc || ""}
`;
}


/* =========================
   EXERCISE PROMPT
========================= */
function buildExercisePrompt(duLieuGoc = "") {
  return `
Create English exercises based ONLY on the input.

⚠️ RULES:
- Do NOT add new knowledge
- Keep format clean
- No markdown

FORMAT:

--- EXERCISE ---
1. ...
A. ...
B. ...
C. ...
D. ...

Answer:
...

==============================
INPUT:
${duLieuGoc}
==============================

Generate now.
`.trim();
}

/* =========================
   EXAM PROMPT
========================= */
function buildExamPrompt(duLieuGoc = "") {
  return `
Create a short English test based ONLY on input.

⚠️ RULES:
- No markdown
- Clear structure
- Each question has 4 options

FORMAT:

--- EXAM ---
1. ...
A. ...
B. ...
C. ...
D. ...

Answer:
1. A
2. B

==============================
INPUT:
${duLieuGoc}
==============================

Generate now.
`.trim();
}

/* =========================
   TOEIC PROMPT
========================= */
function buildToeicPrompt(duLieuGoc = "") {
  return `
Create TOEIC-style questions based ONLY on input.

⚠️ RULES:
- No markdown
- Follow TOEIC format

FORMAT:

--- TOEIC ---
1. ...
A. ...
B. ...
C. ...
D. ...

Answer:
...

==============================
INPUT:
${duLieuGoc}
==============================

Generate now.
`.trim();
}
