export function compressImage(file, maxW = 200) {
  return new Promise(resolve => {
    const img = new Image();

    const url = URL.createObjectURL(file);
    img.src = url;

    img.onload = () => {
      URL.revokeObjectURL(url);

      const scale = Math.min(1, maxW / img.width);

      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        blob => resolve(blob),
        "image/jpeg",
        0.6
      );
    };
  });
}