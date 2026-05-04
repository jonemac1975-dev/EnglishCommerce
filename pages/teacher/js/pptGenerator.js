export function exportPPT(slides) {
  if (!slides || !slides.length) {
    alert("Không có dữ liệu slide");
    return;
  }

  const pptx = new window.PptxGenJS();

  // ===== TITLE =====
  const titleSlide = pptx.addSlide();
  titleSlide.background = { fill: "0F172A" };

  titleSlide.addText("BÀI GIẢNG", {
    x: 1,
    y: 1.8,
    fontSize: 36,
    bold: true,
    color: "FFFFFF",
    align: "center"
  });

  // ===== CONTENT =====
  slides.forEach((slide) => {
    const s = pptx.addSlide();

    // background nhẹ
    s.background = { fill: "F8FAFC" };

    // title
    s.addText(slide.title || "Slide", {
      x: 0.8,
      y: 0.5,
      fontSize: 26,
      bold: true,
      color: "0F172A"
    });

    // content
    const content = Array.isArray(slide.content)
      ? slide.content.map(t => "• " + t).join("\n")
      : slide.content || "";

    s.addText(content, {
      x: 0.8,
      y: 1.5,
      w: 6.5,
      fontSize: 18,
      lineSpacing: 28,
      color: "1E293B"
    });

    // image (optional)
    if (slide.image) {
      try {
        s.addImage({
          path: slide.image,
          x: 7,
          y: 1.5,
          w: 3,
          h: 2
        });
      } catch {}
    }
  });

  pptx.writeFile({ fileName: "bai-giang.pptx" });
}