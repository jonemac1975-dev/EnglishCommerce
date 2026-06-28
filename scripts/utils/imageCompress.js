export function compressImage(file, type = "avatar") {
  return new Promise((resolve) => {
    const img = new Image();

    const url = URL.createObjectURL(file);
    img.src = url;

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      let maxW = 800;
      let format = "image/jpeg";
      let quality = 0.7;

      if (type === "signature") {
        maxW = 450;
        format = "image/png";
        quality = 1;
      }

      const scale = Math.min(1, maxW / img.width);

      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // =========================
      // REMOVE BACKGROUND (ONLY SIGNATURE)
      // =========================
      if (type === "signature") {
        const imageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);
      }

      canvas.toBlob(
        (blob) => resolve(blob),
        format,
        quality
      );
    };

    img.onerror = () => {
      console.error("❌ Không load được ảnh");
      resolve(file);
    };
  });
}

function removeBackground(img, threshold = 240) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );

  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // nếu gần trắng → trong suốt
    if (r > threshold && g > threshold && b > threshold) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas;
}