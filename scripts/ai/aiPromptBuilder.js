import { AI_TEMPLATES } from "./aiTemplates.js";

export function buildAIPrompt(type, payload = {}) {
  const templateFn = AI_TEMPLATES[type];

  if (!templateFn) {
    return `Hãy tạo nội dung giáo dục phù hợp với dữ liệu sau:\n${JSON.stringify(payload, null, 2)}`;
  }

  return templateFn(payload);
}