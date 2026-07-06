"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/features/auth/actions";
import { getCurrentRelationship } from "@/features/relationship/actions";
import { cloudinary } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

export interface GalleryPhoto {
  id: string;
  url: string;
  caption: string | null;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
  event: {
    id: string;
    title: string;
    category: string;
    date: string;
  };
  uploader: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export async function getGalleryPhotos(cursor?: string, limit = 20) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const relationship = await getCurrentRelationship();
    if (!relationship) return { success: true, data: { photos: [], nextCursor: null } };

    const photos = await prisma.media.findMany({
      where: {
        event: {
          relationshipId: relationship.id,
          deletedAt: null,
        },
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      select: {
        id: true,
        url: true,
        caption: true,
        mimeType: true,
        uploadedBy: true,
        createdAt: true,
        event: {
          select: { id: true, title: true, category: true, date: true },
        },
        uploader: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (photos.length > limit) {
      const next = photos.pop();
      nextCursor = next!.createdAt.toISOString();
    }

    const serialized = photos.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      event: {
        ...p.event,
        date: p.event.date.toISOString(),
      },
    }));

    return { success: true, data: { photos: serialized, nextCursor } };
  } catch (err) {
    console.error("getGalleryPhotos error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function uploadGalleryPhoto(eventId: string, file: File) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "detto/gallery",
      resource_type: "image",
    });

    const media = await prisma.media.create({
      data: {
        eventId,
        uploadedBy: session.user.id,
        publicId: result.public_id,
        url: result.secure_url,
        mimeType: file.type,
        size: file.size,
      },
    });

    revalidatePath("/memories");
    revalidatePath("/home");

    return { success: true, data: { id: media.id, url: media.url } };
  } catch (err) {
    console.error("uploadGalleryPhoto error:", err);
    return { success: false, error: { code: "UPLOAD_FAILED" } };
  }
}

export async function deleteGalleryPhoto(mediaId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media || media.uploadedBy !== session.user.id) {
      return { success: false, error: { code: "FORBIDDEN" } };
    }

    try {
      await cloudinary.uploader.destroy(media.publicId);
    } catch {
      // best effort
    }

    await prisma.media.delete({ where: { id: mediaId } });

    revalidatePath("/memories");
    revalidatePath("/home");

    return { success: true };
  } catch (err) {
    console.error("deleteGalleryPhoto error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function updateGalleryPhotoCaption(mediaId: string, caption: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media || media.uploadedBy !== session.user.id) {
      return { success: false, error: { code: "FORBIDDEN" } };
    }

    await prisma.media.update({
      where: { id: mediaId },
      data: { caption: caption || null },
    });

    revalidatePath("/memories");

    return { success: true };
  } catch (err) {
    console.error("updateGalleryPhotoCaption error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function getRelationshipEvents() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const relationship = await getCurrentRelationship();
    if (!relationship) return { success: true, data: [] };

    const events = await prisma.event.findMany({
      where: {
        relationshipId: relationship.id,
        deletedAt: null,
        description: { not: { contains: "[AUTO:" } },
      },
      orderBy: { date: "desc" },
      select: { id: true, title: true, category: true, date: true },
    });

    return {
      success: true,
      data: events.map((e) => ({
        ...e,
        date: e.date.toISOString(),
      })),
    };
  } catch (err) {
    console.error("getRelationshipEvents error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}
