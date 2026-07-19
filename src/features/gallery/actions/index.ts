"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/features/auth/actions";
import { getCurrentRelationship } from "@/features/relationship/actions";
import { cloudinary, generateSignature } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

const GALLERY_FOLDER = "detto/gallery";

export interface GalleryPhoto {
  id: string;
  url: string;
  caption: string | null;
  mimeType: string;
  thumbnailUrl: string | null;
  uploadedBy: string;
  createdAt: string;
  displayDate: string;
  event: {
    id: string;
    title: string;
    category: string;
    date: string;
    description: string | null;
  };
  uploader: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

const NOTES_EVENT_TAG = "[AUTO:NOTES_CONTAINER]";

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
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        url: true,
        caption: true,
        mimeType: true,
        thumbnailUrl: true,
        uploadedBy: true,
        createdAt: true,
        event: {
          select: { id: true, title: true, category: true, date: true, description: true },
        },
        uploader: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });

    const withDisplayDate = photos.map((p: (typeof photos)[number]) => {
      const isNotes = p.event.description?.startsWith("[AUTO:");
      const displayDate = isNotes ? p.createdAt : p.event.date;
      return {
        ...p,
        displayDate: displayDate.toISOString(),
        createdAt: p.createdAt.toISOString(),
        event: {
          ...p.event,
          date: p.event.date.toISOString(),
        },
      };
    });

    withDisplayDate.sort(
      (a: (typeof withDisplayDate)[number], b: (typeof withDisplayDate)[number]) =>
        new Date(b.displayDate).getTime() - new Date(a.displayDate).getTime(),
    );

    // Paginate after sorting
    const startIdx = cursor
      ? withDisplayDate.findIndex((p: (typeof withDisplayDate)[number]) => p.createdAt === cursor) + 1
      : 0;
    const page = withDisplayDate.slice(startIdx, startIdx + limit);
    const nextCursor =
      startIdx + limit < withDisplayDate.length
        ? page[page.length - 1]?.createdAt ?? null
        : null;

    return { success: true, data: { photos: page, nextCursor } };
  } catch (err) {
    console.error("getGalleryPhotos error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

/** Signed signature for direct image uploads to the gallery folder. */
export async function getGalleryPhotoSignature() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const relationship = await getCurrentRelationship();
    if (!relationship) return { success: false, error: { code: "NO_RELATIONSHIP" } };

    const timestamp = Math.round(Date.now() / 1000);
    const params: Record<string, string | number> = {
      timestamp,
      folder: GALLERY_FOLDER,
    };
    const signature = generateSignature(params);

    return {
      success: true,
      data: {
        signature,
        timestamp,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
        folder: GALLERY_FOLDER,
        resourceType: "image" as const,
      },
    };
  } catch (err) {
    console.error("getGalleryPhotoSignature error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

/** Save metadata for an already-uploaded gallery photo. */
export async function saveGalleryPhoto(input: {
  eventId: string;
  url: string;
  publicId: string;
  mimeType: string;
  size: number;
  caption?: string | null;
}) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const media = await prisma.media.create({
      data: {
        eventId: input.eventId,
        uploadedBy: session.user.id,
        publicId: input.publicId,
        url: input.url,
        mimeType: input.mimeType,
        size: input.size,
        caption: input.caption || null,
      },
    });

    revalidatePath("/memories");
    revalidatePath("/home");

    return { success: true, data: { id: media.id, url: media.url } };
  } catch (err) {
    console.error("saveGalleryPhoto error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
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

    // If this belonged to the auto-created notes container, clean it up when empty
    const parentEvent = await prisma.event.findUnique({
      where: { id: media.eventId },
      select: { id: true, description: true },
    });
    if (parentEvent?.description === NOTES_EVENT_TAG) {
      const remaining = await prisma.media.count({ where: { eventId: parentEvent.id } });
      if (remaining === 0) {
        await prisma.event.update({
          where: { id: parentEvent.id },
          data: { deletedAt: new Date() },
        });
      }
    }

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
      },
      orderBy: { date: "desc" },
      select: { id: true, title: true, category: true, date: true, description: true },
    });

    return {
      success: true,
      data: events
        .filter((e: (typeof events)[number]) => !e.description?.startsWith("[AUTO:"))
        .map((e: (typeof events)[number]) => ({
          id: e.id,
          title: e.title,
          category: e.category,
          date: e.date.toISOString(),
        })),
    };
  } catch (err) {
    console.error("getRelationshipEvents error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}
