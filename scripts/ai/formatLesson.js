export function formatLesson(text) {
  if (typeof text !== "string") return "";

  const escape = (s) =>
    s.replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;");

  let safe = escape(text);

  // ✅ split chuẩn: UNIT + --- + SECTION WORD
  let parts = safe.split(/\n(?=UNIT|---|VOCABULARY|GRAMMAR|READING|SPEAKING|WRITING|EXERCISE|SUMMARY)/gi);

  let html = `
    <div style="font-family:Arial;line-height:1.6;padding:20px;background:#f8f9fb">
  `;

  for (let p of parts) {
    if (!p.trim()) continue;

    const block = p.trim();

    // ===== UNIT =====
    if (/^UNIT/i.test(block)) {
      html += `<h2 style="color:#2c3e50;margin-top:20px">${block}</h2>`;
      continue;
    }

    // ===== SECTION (---) =====
    if (/^---/.test(block)) {
      html += `
        <div style="margin:15px 0;padding:10px;background:#eaf2ff;border-left:4px solid #3498db;font-weight:bold">
          ${block.replace(/-/g, "").trim()}
        </div>`;
      continue;
    }

    // ===== SECTION TEXT (VOCAB, GRAMMAR...) =====
    // ===== SECTION TEXT (có hoặc không có :) =====
if (/^(VOCABULARY|GRAMMAR|READING|SPEAKING|WRITING|EXERCISE|SUMMARY)\s*:?\s*$/i.test(block.split("\n")[0])) {
  const title = block.split("\n")[0].replace(":", "").trim();
  const content = block.substring(block.indexOf("\n")).trim();

  html += `
    <div style="margin:15px 0">
      <div style="padding:10px;background:#dff9fb;border-left:4px solid #00a8ff;font-weight:bold">
        ${title}
      </div>
      <div style="background:#fff;padding:10px;border:1px solid #eee;white-space:pre-wrap">
        ${content}
      </div>
    </div>
  `;
  continue;
}


    // ===== QUESTIONS =====
    if (/^\d+\./.test(block)) {
      html += `
        <div style="background:#fff3cd;padding:10px;border-left:3px solid orange;margin:8px 0">
          ${block}
        </div>`;
      continue;
    }

    // ===== DIALOGUE =====
    if (block.includes(":") && block.split("\n").length > 2) {
      html += `
        <div style="background:#fff;padding:12px;border-radius:8px;white-space:pre-wrap;margin:10px 0;border:1px solid #eee">
          ${block}
        </div>`;
      continue;
    }

// ===== READING / EXERCISE SPECIAL SPLIT =====
if (/^(READING|EXERCISE)/i.test(block)) {
  let content = block;

  // tách Text
  content = content.replace(/Text:\s*/i, `
    <div style="margin-top:10px;font-weight:bold">📖 Text:</div>
  `);

  // tách Question
  content = content.replace(/Question(s)?:\s*/i, `
    <div style="margin-top:10px;font-weight:bold">❓ Questions:</div>
  `);

  // tách Answer
  content = content.replace(/Answer:\s*/gi, `
    <div style="margin-top:10px;font-weight:bold;color:green">✔ Answer:</div>
  `);

  html += `
    <div style="margin:15px 0">
      <div style="padding:10px;background:#dff9fb;border-left:4px solid #00a8ff;font-weight:bold">
        ${block.split("\n")[0].replace(":", "").trim()}
      </div>
      <div style="background:#fff;padding:10px;border:1px solid #eee;white-space:pre-wrap">
        ${content.replace(block.split("\n")[0], "").trim()}
      </div>
    </div>
  `;
  continue;
}

    // ===== DEFAULT =====
    html += `
      <div style="background:#fff;margin:6px 0;padding:10px;border:1px solid #eee;white-space:pre-wrap">
        ${block}
      </div>`;
  }

  html += `</div>`;
  return html;
}
