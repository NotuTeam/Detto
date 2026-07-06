"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/features/auth/actions";
import { cloudinary } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

export async function uploadAvatarAction(file: File) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: { code: "UNAUTHORIZED" } };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "detto/avatars",
      resource_type: "image",
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: result.secure_url },
    });

    revalidatePath("/home");
    revalidatePath("/relation");

    return { success: true, data: { url: result.secure_url, publicId: result.public_id } };
  } catch (err) {
    console.error("uploadAvatarAction error:", err);
    return { success: false, error: { code: "UPLOAD_FAILED", message: "Failed to upload photo" } };
  }
}

export async function uploadFileToCloudinary(file: File, folder: string) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: { code: "UNAUTHORIZED" } };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder,
      resource_type: "image",
    });

    return {
      success: true,
      data: { url: result.secure_url, publicId: result.public_id },
    };
  } catch (err) {
    console.error("uploadFileToCloudinary error:", err);
    return { success: false, error: { code: "UPLOAD_FAILED", message: "Failed to upload photo" } };
  }
}
