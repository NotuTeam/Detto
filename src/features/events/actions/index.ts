"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/features/auth/actions";
import { getCurrentRelationship } from "@/features/relationship/actions";
import { createEventSchema, updateEventSchema, type CreateEventInput, type UpdateEventInput } from "../schemas";
import { cloudinary, generateSignature } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

const EVENT_MEDIA_FOLDER = "detto/events";

/** Parse "YYYY-MM-DD" into a Date at noon UTC to avoid timezone drift. */
function parseDateNoonUTC(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export async function getEventsByMonth(year: number, month: number) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const relationship = await getCurrentRelationship();
    if (!relationship) return { success: true, data: [] };

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const events = await prisma.event.findMany({
      where: {
        relationshipId: relationship.id,
        deletedAt: null,
        OR: [
          { description: null },
          { description: { not: "[AUTO:NOTES_CONTAINER]" } },
        ],
        date: { gte: start, lte: end },
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        date: true,
        locationName: true,
        locationUrl: true,
        status: true,
        createdBy: true,
        wishlistItemId: true,
        creator: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    const serialized = events.map((e: (typeof events)[number]) => ({
      ...e,
      date: e.date.toISOString(),
    }));

    return { success: true, data: serialized };
  } catch (err) {
    console.error("getEventsByMonth error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function getEventDetail(eventId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const event = await prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      include: {
        creator: { select: { id: true, displayName: true, avatarUrl: true } },
        media: { select: { id: true, url: true, caption: true, mimeType: true }, take: 10 },
        ratings: { select: { id: true, rating: true, userId: true } },
      },
    });

    if (!event) return { success: false, error: { code: "NOT_FOUND" } };

    return {
      success: true,
      data: {
        ...event,
        date: event.date.toISOString(),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      },
    };
  } catch (err) {
    console.error("getEventDetail error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function createEvent(input: CreateEventInput) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const relationship = await getCurrentRelationship();
    if (!relationship) return { success: false, error: { code: "NO_RELATIONSHIP" } };

    const parsed = createEventSchema.parse(input);

    const event = await prisma.event.create({
      data: {
        relationshipId: relationship.id,
        createdBy: session.user.id,
        title: parsed.title,
        description: parsed.description || null,
        category: parsed.category,
        date: parseDateNoonUTC(parsed.date),
        locationName: parsed.locationName || null,
        locationUrl: parsed.locationUrl || null,
      },
    });

    revalidatePath("/events");
    revalidatePath("/home");

    return {
      success: true,
      data: { id: event.id, date: event.date.toISOString() },
    };
  } catch (err) {
    console.error("createEvent error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function updateEvent(eventId: string, input: UpdateEventInput) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const existing = await prisma.event.findUnique({ where: { id: eventId, deletedAt: null } });
    if (!existing || existing.createdBy !== session.user.id) {
      return { success: false, error: { code: "FORBIDDEN" } };
    }

    const parsed = updateEventSchema.parse(input);

    const data: Record<string, unknown> = {};
    if (parsed.title !== undefined) data.title = parsed.title;
    if (parsed.description !== undefined) data.description = parsed.description || null;
    if (parsed.category !== undefined) data.category = parsed.category;
    if (parsed.date !== undefined) data.date = parseDateNoonUTC(parsed.date);
    if (parsed.locationName !== undefined) data.locationName = parsed.locationName || null;
    if (parsed.locationUrl !== undefined) data.locationUrl = parsed.locationUrl || null;
    if (parsed.status !== undefined) data.status = parsed.status;

    await prisma.event.update({ where: { id: eventId }, data });

    revalidatePath("/events");
    revalidatePath("/home");

    return { success: true };
  } catch (err) {
    console.error("updateEvent error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function deleteEvent(eventId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const existing = await prisma.event.findUnique({ where: { id: eventId, deletedAt: null } });
    if (!existing || existing.createdBy !== session.user.id) {
      return { success: false, error: { code: "FORBIDDEN" } };
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/events");
    revalidatePath("/home");

    return { success: true };
  } catch (err) {
    console.error("deleteEvent error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function updateEventStatus(eventId: string, status: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const existing = await prisma.event.findUnique({ where: { id: eventId, deletedAt: null } });
    if (!existing) return { success: false, error: { code: "NOT_FOUND" } };

    await prisma.event.update({
      where: { id: eventId },
      data: { status },
    });

    revalidatePath("/events");
    revalidatePath("/home");

    return { success: true };
  } catch (err) {
    console.error("updateEventStatus error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function getEventMedia(eventId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const media = await prisma.media.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      select: { id: true, url: true, caption: true, mimeType: true, thumbnailUrl: true, uploadedBy: true, uploader: { select: { id: true, displayName: true } } },
    });

    return { success: true, data: media };
  } catch (err) {
    console.error("getEventMedia error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

/** Returns a signed signature for direct-to-Cloudinary uploads (image or video). */
export async function getEventMediaSignature(resourceType: "image" | "video" = "image") {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const timestamp = Math.round(Date.now() / 1000);
    const params: Record<string, string | number> = {
      timestamp,
      folder: EVENT_MEDIA_FOLDER,
    };
    const signature = generateSignature(params);

    return {
      success: true,
      data: {
        signature,
        timestamp,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
        folder: EVENT_MEDIA_FOLDER,
        resourceType,
      },
    };
  } catch (err) {
    console.error("getEventMediaSignature error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function deleteEventMedia(mediaId: string) {
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

    revalidatePath("/events");
    revalidatePath("/calendar");

    return { success: true };
  } catch (err) {
    console.error("deleteEventMedia error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function getWishlistItemForEvent(eventId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const event = await prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: {
        wishlistItemId: true,
        wishlistItem: {
          select: {
            id: true,
            imageUrl: true,
            linkUrl: true,
            isChecked: true,
            checkedAt: true,
          },
        },
      },
    });

    if (!event || !event.wishlistItem) {
      return { success: true, data: null };
    }

    const wi = event.wishlistItem;
    let imageUrls: string[] = [];
    let linkUrls: string[] = [];
    try { if (wi.imageUrl) imageUrls = JSON.parse(wi.imageUrl); } catch { imageUrls = wi.imageUrl ? [wi.imageUrl] : []; }
    try { if (wi.linkUrl) linkUrls = JSON.parse(wi.linkUrl); } catch { linkUrls = []; }

    return {
      success: true,
      data: {
        id: wi.id,
        imageUrls,
        linkUrls,
        isChecked: wi.isChecked,
        checkedAt: wi.checkedAt ? wi.checkedAt.toISOString() : null,
      },
    };
  } catch (err) {
    console.error("getWishlistItemForEvent error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

// ── Event Comments ──────────────────────────────────────────

export async function getEventComments(eventId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const comments = await prisma.eventComment.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        message: true,
        createdAt: true,
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    return {
      success: true,
      data: comments.map((c: (typeof comments)[number]) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  } catch (err) {
    console.error("getEventComments error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function addEventComment(eventId: string, message: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    if (!message.trim()) return { success: false, error: { code: "INVALID_INPUT" } };

    const comment = await prisma.eventComment.create({
      data: {
        eventId,
        userId: session.user.id,
        message: message.trim(),
      },
      select: {
        id: true,
        message: true,
        createdAt: true,
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    return {
      success: true,
      data: {
        ...comment,
        createdAt: comment.createdAt.toISOString(),
      },
    };
  } catch (err) {
    console.error("addEventComment error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function deleteEventComment(commentId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const existing = await prisma.eventComment.findUnique({ where: { id: commentId } });
    if (!existing || existing.userId !== session.user.id) {
      return { success: false, error: { code: "FORBIDDEN" } };
    }

    await prisma.eventComment.delete({ where: { id: commentId } });

    return { success: true };
  } catch (err) {
    console.error("deleteEventComment error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function saveEventMedia(input: {
  eventId: string;
  url: string;
  publicId: string;
  mimeType: string;
  size: number;
  thumbnailUrl?: string | null;
}) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const event = await prisma.event.findUnique({ where: { id: input.eventId, deletedAt: null } });
    if (!event) return { success: false, error: { code: "NOT_FOUND" } };

    const media = await prisma.media.create({
      data: {
        eventId: input.eventId,
        uploadedBy: session.user.id,
        publicId: input.publicId,
        url: input.url,
        thumbnailUrl: input.thumbnailUrl || null,
        mimeType: input.mimeType,
        size: input.size,
      },
    });

    revalidatePath("/events");
    revalidatePath("/calendar");

    return { success: true, data: { id: media.id, url: media.url } };
  } catch (err) {
    console.error("saveEventMedia error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}
