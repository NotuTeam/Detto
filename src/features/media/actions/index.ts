"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/features/auth/actions";
import { generateSignature } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

const AVATAR_FOLDER = "detto/avatars";
const GENERIC_IMAGE_FOLDER = "detto/misc";

/** Signed signature for direct avatar image uploads. */
export async function getAvatarSignature() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const timestamp = Math.round(Date.now() / 1000);
    const params: Record<string, string | number> = {
      timestamp,
      folder: AVATAR_FOLDER,
    };
    const signature = generateSignature(params);

    return {
      success: true,
      data: {
        signature,
        timestamp,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
        folder: AVATAR_FOLDER,
        resourceType: "image" as const,
      },
    };
  } catch (err) {
    console.error("getAvatarSignature error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

/** Persist a freshly-uploaded avatar URL (deletes the previous one if any). */
export async function saveAvatarUrl(url: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: url },
    });

    // Best-effort cleanup of old avatar
    if (user?.avatarUrl && user.avatarUrl !== url) {
      const { deleteFromCloudinaryByUrl } = await import("@/lib/cloudinary");
      await deleteFromCloudinaryByUrl(user.avatarUrl).catch(() => {});
    }

    revalidatePath("/home");
    revalidatePath("/relation");
    revalidatePath("/profile");

    return { success: true, data: { url } };
  } catch (err) {
    console.error("saveAvatarUrl error:", err);
    return { success: false, error: { code: "UPLOAD_FAILED" } };
  }
}

/** Signed signature for direct image uploads to a generic/misc folder. */
export async function getGenericImageSignature(folder: string = GENERIC_IMAGE_FOLDER) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const timestamp = Math.round(Date.now() / 1000);
    const params: Record<string, string | number> = {
      timestamp,
      folder,
    };
    const signature = generateSignature(params);

    return {
      success: true,
      data: {
        signature,
        timestamp,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
        folder,
        resourceType: "image" as const,
      },
    };
  } catch (err) {
    console.error("getGenericImageSignature error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}
