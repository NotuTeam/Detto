import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function generateSignature(params: Record<string, string | number>) {
  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );
  return signature;
}

/**
 * Extract the Cloudinary public_id from a full URL.
 * e.g. "https://res.cloudinary.com/demo/image/upload/v1234/detto/avatars/abc.jpg"
 *      → "detto/avatars/abc"
 * Returns null if the URL is not a Cloudinary URL or parsing fails.
 */
export function getPublicIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only handle cloudinary URLs
    if (!parsed.hostname.includes("cloudinary.com")) return null;

    // Path looks like: /<cloud_name>/image/upload/v<version>/<folder>/<public_id>.<ext>
    const segments = parsed.pathname.split("/");
    const uploadIdx = segments.indexOf("upload");
    if (uploadIdx === -1 || uploadIdx + 1 >= segments.length) return null;

    // Everything after "upload" (skip version if present) is the public_id path
    let afterUpload = segments.slice(uploadIdx + 1);
    // Skip version segment (starts with "v" followed by digits)
    if (afterUpload.length > 0 && /^v\d+$/.test(afterUpload[0])) {
      afterUpload = afterUpload.slice(1);
    }

    const fullPath = afterUpload.join("/");
    if (!fullPath) return null;

    // Remove file extension from the last segment
    return fullPath.replace(/\.[^.]+$/, "");
  } catch {
    return null;
  }
}

/**
 * Best-effort delete of a Cloudinary image by URL.
 * Silently returns null on failure so callers can use it in fire-and-forget patterns.
 */
export async function deleteFromCloudinaryByUrl(url: string): Promise<void> {
  try {
    const publicId = getPublicIdFromUrl(url);
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // Best effort — don't throw on cleanup failures
  }
}

export { cloudinary };
