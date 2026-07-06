"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/features/auth/actions";
import { updateProfileSchema, changePasswordSchema, type UpdateProfileInput, type ChangePasswordInput } from "../schemas";
import { cloudinary, deleteFromCloudinaryByUrl } from "@/lib/cloudinary";
import { hash, verify } from "argon2";
import { revalidatePath } from "next/cache";

export async function getProfile() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        birthDate: true,
        createdAt: true,
      },
    });

    if (!user) return { success: false, error: { code: "NOT_FOUND" } };

    return {
      success: true,
      data: {
        ...user,
        birthDate: user.birthDate.toISOString(),
        createdAt: user.createdAt.toISOString(),
      },
    };
  } catch (err) {
    console.error("getProfile error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function updateProfile(input: UpdateProfileInput) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const parsed = updateProfileSchema.parse(input);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        displayName: parsed.displayName,
        birthDate: new Date(parsed.birthDate),
      },
    });

    revalidatePath("/profile");
    revalidatePath("/home");

    return { success: true };
  } catch (err) {
    console.error("updateProfile error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function uploadAvatar(file: File) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    // Get current avatar URL to delete later
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "detto/avatars",
      resource_type: "image",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
      ],
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: result.secure_url },
    });

    // Delete old avatar from Cloudinary
    if (user?.avatarUrl) {
      await deleteFromCloudinaryByUrl(user.avatarUrl);
    }

    revalidatePath("/profile");
    revalidatePath("/home");

    return { success: true, data: { url: result.secure_url } };
  } catch (err) {
    console.error("uploadAvatar error:", err);
    return { success: false, error: { code: "UPLOAD_FAILED" } };
  }
}

export async function changePassword(input: ChangePasswordInput) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const parsed = changePasswordSchema.parse(input);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) return { success: false, error: { code: "NOT_FOUND" } };

    const valid = await verify(user.passwordHash, parsed.currentPassword);
    if (!valid) {
      return { success: false, error: { code: "INVALID_PASSWORD", message: "Current password is incorrect" } };
    }

    const newHash = await hash(parsed.newPassword);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    });

    return { success: true };
  } catch (err) {
    console.error("changePassword error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}
