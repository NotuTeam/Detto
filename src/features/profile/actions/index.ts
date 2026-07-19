"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/features/auth/actions";
import { updateProfileSchema, changePasswordSchema, type UpdateProfileInput, type ChangePasswordInput } from "../schemas";
import { deleteFromCloudinaryByUrl, generateSignature } from "@/lib/cloudinary";
import { hash, verify } from "argon2";
import { revalidatePath } from "next/cache";
import { updateAutoEventDateForYear } from "@/lib/auto-events";

const AVATAR_FOLDER = "detto/avatars";

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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { birthDate: true },
    });

    const newBirthDate = new Date(parsed.birthDate);
    const birthDateChanged = user?.birthDate.getTime() !== newBirthDate.getTime();

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        displayName: parsed.displayName,
        birthDate: newBirthDate,
      },
    });

    // Update birthday auto-event for current year if birthDate changed
    if (birthDateChanged) {
      const rel = await prisma.relationship.findFirst({
        where: {
          OR: [{ partnerAId: session.user.id }, { partnerBId: session.user.id }],
          deletedAt: null,
          status: "ACTIVE",
        },
        select: { id: true, partnerAId: true },
      });

      if (rel) {
        const tag = rel.partnerAId === session.user.id
          ? "[AUTO:BIRTHDAY:PARTNER_A]"
          : "[AUTO:BIRTHDAY:PARTNER_B]";
        await updateAutoEventDateForYear(rel.id, tag, newBirthDate);
      }
    }

    revalidatePath("/profile");
    revalidatePath("/home");
    revalidatePath("/calendar");

    return { success: true };
  } catch (err) {
    console.error("updateProfile error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

/** Signed signature for direct avatar image uploads (with face-crop transformation hint). */
export async function getAvatarSignature() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const timestamp = Math.round(Date.now() / 1000);
    const folder = AVATAR_FOLDER;
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
    console.error("getAvatarSignature error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

/** Persist a freshly-uploaded avatar URL and delete the previous one. */
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

    if (user?.avatarUrl && user.avatarUrl !== url) {
      await deleteFromCloudinaryByUrl(user.avatarUrl);
    }

    revalidatePath("/profile");
    revalidatePath("/home");

    return { success: true, data: { url } };
  } catch (err) {
    console.error("saveAvatarUrl error:", err);
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
