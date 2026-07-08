"use client";

const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

/**
 * Compress an image file to fit within maxSizeBytes using Canvas API.
 * Iteratively reduces quality first, then dimensions if needed.
 * Returns the original file if already under the limit.
 */
export async function compressImage(
  file: File,
  maxSizeBytes = MAX_SIZE_BYTES,
): Promise<File> {
  if (file.size <= maxSizeBytes) return file;

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  // Step 1: Try reducing quality at full resolution
  for (let quality = 0.92; quality >= 0.5; quality -= 0.05) {
    const blob = await canvasToBlob(bitmap, width, height, quality, file.type);
    if (blob.size <= maxSizeBytes) {
      return new File([blob], file.name, { type: blob.type });
    }
  }

  // Step 2: Still too large -- reduce dimensions and retry
  for (let scale = 0.85; scale >= 0.3; scale -= 0.1) {
    const newW = Math.round(width * scale);
    const newH = Math.round(height * scale);
    for (let quality = 0.92; quality >= 0.5; quality -= 0.1) {
      const blob = await canvasToBlob(bitmap, newW, newH, quality, file.type);
      if (blob.size <= maxSizeBytes) {
        return new File([blob], file.name, { type: blob.type });
      }
    }
  }

  bitmap.close();
  // Could not compress below limit
  throw new Error(`Could not compress image below ${Math.round(maxSizeBytes / 1024 / 1024)}MB`);
}

function canvasToBlob(
  source: ImageBitmap,
  width: number,
  height: number,
  quality: number,
  mimeType: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Canvas not supported"));
    ctx.drawImage(source, 0, 0, width, height);
    const outputType = mimeType === "image/png" ? "image/png" : "image/jpeg";
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Compression failed"));
      },
      outputType,
      quality,
    );
  });
}
