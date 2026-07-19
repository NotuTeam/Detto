"use client";

export interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export type AssetResourceType = "image" | "video";

export interface CloudinaryAssetResult {
  secure_url: string;
  public_id: string;
  bytes: number;
  duration?: number;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

/**
 * Upload a file (image or video) directly to Cloudinary (bypassing the server).
 * Uses a signed upload so the file never touches the Next.js server.
 * Reports progress via the onProgress callback (0-100).
 */
export function uploadAssetDirect(
  file: File,
  sig: UploadSignature,
  resourceType: AssetResourceType,
  onProgress?: (pct: number) => void,
): Promise<CloudinaryAssetResult> {
  return new Promise((resolve, reject) => {
    const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("signature", sig.signature);
    formData.append("timestamp", String(sig.timestamp));
    formData.append("api_key", sig.apiKey);
    formData.append("folder", sig.folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as CloudinaryAssetResult);
      } else {
        let detail = `Upload failed (${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText);
          if (body.error?.message) detail = body.error.message;
        } catch {
          /* ignore parse errors */
        }
        reject(new Error(detail));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Network error during upload")),
    );
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.send(formData);
  });
}

/** Maximum file sizes (in MB) for direct uploads. */
export const IMAGE_MAX_SIZE_MB = 8;
export const VIDEO_MAX_SIZE_MB = 60;

/** Validate a File against the given max size. Returns an error message string or null. */
export function validateUploadSize(
  file: File,
  maxSizeMB: number,
): string | null {
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File exceeds ${maxSizeMB}MB limit`;
  }
  return null;
}
