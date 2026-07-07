"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/features/auth/actions";
import { getCurrentRelationship } from "@/features/relationship/actions";
import { createEventSchema, updateEventSchema, type CreateEventInput, type UpdateEventInput } from "../schemas";
import { cloudinary } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";

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
        NOT: { description: "[AUTO:NOTES_CONTAINER]" },
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
      select: { id: true, url: true, caption: true, mimeType: true, uploadedBy: true, uploader: { select: { id: true, displayName: true } } },
    });

    return { success: true, data: media };
  } catch (err) {
    console.error("getEventMedia error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function uploadEventMedia(eventId: string, file: File) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const event = await prisma.event.findUnique({ where: { id: eventId, deletedAt: null } });
    if (!event) return { success: false, error: { code: "NOT_FOUND" } };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "detto/events",
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

    revalidatePath("/events");
    revalidatePath("/calendar");

    return { success: true, data: { id: media.id, url: media.url } };
  } catch (err) {
    console.error("uploadEventMedia error:", err);
    return { success: false, error: { code: "UPLOAD_FAILED" } };
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
