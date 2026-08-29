export async function compressImageFile(file: File, maxDimension = 1200): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG, etc.).");
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = image;
      const scale = Math.min(1, maxDimension / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not process image."));
        return;
      }

      const preserveAlpha = file.type === "image/png" || file.type === "image/webp";
      if (!preserveAlpha) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(image, 0, 0, width, height);
      resolve(
        canvas.toDataURL(preserveAlpha ? "image/png" : "image/jpeg", preserveAlpha ? undefined : 0.82),
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load that image."));
    };

    image.src = objectUrl;
  });
}

export function imageAspectHeightPercent(widthPercent: number, aspectRatio: number) {
  // aspectRatio = naturalWidth / naturalHeight
  return (widthPercent / aspectRatio) * (816 / 595);
}
