"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/features/auth/actions";
import { getCurrentRelationship } from "@/features/relationship/actions";
import { validateFileSize } from "@/lib/utils";
import { createWishlistSchema, updateWishlistSchema, type CreateWishlistInput, type UpdateWishlistInput } from "../schemas";
import { cloudinary, deleteFromCloudinaryByUrl } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import { EVENT_CATEGORIES } from "@/config/constants";

function parseLinks(val: string | null): string[] {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

function parseImages(val: string | null): string[] {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return val ? [val] : []; }
}

export async function getWishlistItems() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const relationship = await getCurrentRelationship();
    if (!relationship) return { success: true, data: [] };

    const items = await prisma.wishlistItem.findMany({
      where: {
        relationshipId: relationship.id,
        deletedAt: null,
      },
      orderBy: [
        { isFavourite: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        title: true,
        content: true,
        imageUrl: true,
        linkUrl: true,
        category: true,
        isFavourite: true,
        isChecked: true,
        checkedAt: true,
        createdAt: true,
        createdBy: true,
        creator: { select: { id: true, displayName: true, avatarUrl: true } },
        events: {
          where: { deletedAt: null },
          select: { id: true, date: true, status: true },
          take: 1,
        },
      },
    });

    const serialized = items.map((item) => ({
      ...item,
      imageUrls: parseImages(item.imageUrl),
      linkUrls: parseLinks(item.linkUrl),
      createdAt: item.createdAt.toISOString(),
      checkedAt: item.checkedAt ? item.checkedAt.toISOString() : null,
      linkedEvent: item.events[0]
        ? { id: item.events[0].id, date: item.events[0].date.toISOString(), status: item.events[0].status }
        : null,
      events: undefined,
    }));

    return { success: true, data: serialized };
  } catch (err) {
    console.error("getWishlistItems error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function createWishlistItem(input: CreateWishlistInput) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const relationship = await getCurrentRelationship();
    if (!relationship) return { success: false, error: { code: "NO_RELATIONSHIP" } };

    const parsed = createWishlistSchema.parse(input);

    const item = await prisma.wishlistItem.create({
      data: {
        relationshipId: relationship.id,
        createdBy: session.user.id,
        title: parsed.title,
        content: parsed.content || null,
        imageUrl: parsed.imageUrls ? JSON.stringify(parsed.imageUrls) : null,
        linkUrl: parsed.linkUrls ? JSON.stringify(parsed.linkUrls) : null,
        category: parsed.category,
      },
    });

    revalidatePath("/wishlist");

    return { success: true, data: { id: item.id } };
  } catch (err) {
    console.error("createWishlistItem error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function updateWishlistItem(itemId: string, input: UpdateWishlistInput) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const existing = await prisma.wishlistItem.findUnique({ where: { id: itemId } });
    if (!existing || existing.createdBy !== session.user.id) {
      return { success: false, error: { code: "FORBIDDEN" } };
    }

    const parsed = updateWishlistSchema.parse(input);

    const data: Record<string, unknown> = {};
    if (parsed.title !== undefined) data.title = parsed.title;
    if (parsed.content !== undefined) data.content = parsed.content || null;
    if (parsed.imageUrls !== undefined) {
      data.imageUrl = JSON.stringify(parsed.imageUrls);
      // Clean up removed images from Cloudinary
      const oldImages = parseImages(existing.imageUrl);
      const removedImages = oldImages.filter((url) => !parsed.imageUrls!.includes(url));
      for (const url of removedImages) {
        await deleteFromCloudinaryByUrl(url);
      }
    }
    if (parsed.linkUrls !== undefined) data.linkUrl = JSON.stringify(parsed.linkUrls);
    if (parsed.category !== undefined) data.category = parsed.category;

    await prisma.wishlistItem.update({ where: { id: itemId }, data });

    revalidatePath("/wishlist");

    return { success: true };
  } catch (err) {
    console.error("updateWishlistItem error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function deleteWishlistItem(itemId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const existing = await prisma.wishlistItem.findUnique({
      where: { id: itemId },
      include: { events: { select: { id: true } } },
    });
    if (!existing || existing.createdBy !== session.user.id) {
      return { success: false, error: { code: "FORBIDDEN" } };
    }

    // Cascade: delete linked events
    if (existing.events.length > 0) {
      await prisma.event.updateMany({
        where: { id: { in: existing.events.map((e) => e.id) } },
        data: { deletedAt: new Date() },
      });
    }

    await prisma.wishlistItem.update({
      where: { id: itemId },
      data: { deletedAt: new Date() },
    });

    // Clean up images from Cloudinary
    const images = parseImages(existing.imageUrl);
    for (const url of images) {
      await deleteFromCloudinaryByUrl(url);
    }

    revalidatePath("/wishlist");
    revalidatePath("/calendar");

    return { success: true };
  } catch (err) {
    console.error("deleteWishlistItem error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function toggleFavourite(itemId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const existing = await prisma.wishlistItem.findUnique({ where: { id: itemId } });
    if (!existing) return { success: false, error: { code: "NOT_FOUND" } };

    await prisma.wishlistItem.update({
      where: { id: itemId },
      data: { isFavourite: !existing.isFavourite },
    });

    revalidatePath("/wishlist");

    return { success: true, data: { isFavourite: !existing.isFavourite } };
  } catch (err) {
    console.error("toggleFavourite error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function uploadWishlistImage(file: File) {
  try {
    validateFileSize(file, 1);
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "detto/wishlist",
      resource_type: "image",
    });

    return { success: true, data: { url: result.secure_url } };
  } catch (err) {
    console.error("uploadWishlistImage error:", err);
    return { success: false, error: { code: "UPLOAD_FAILED" } };
  }
}

export async function toggleWishlistCheck(itemId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const existing = await prisma.wishlistItem.findUnique({ where: { id: itemId } });
    if (!existing) return { success: false, error: { code: "NOT_FOUND" } };

    const nowChecked = !existing.isChecked;

    await prisma.wishlistItem.update({
      where: { id: itemId },
      data: {
        isChecked: nowChecked,
        checkedAt: nowChecked ? new Date() : null,
      },
    });

    revalidatePath("/wishlist");

    return { success: true, data: { isChecked: nowChecked } };
  } catch (err) {
    console.error("toggleWishlistCheck error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function createEventFromWishlist(itemId: string, date: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const relationship = await getCurrentRelationship();
    if (!relationship) return { success: false, error: { code: "NO_RELATIONSHIP" } };

    const item = await prisma.wishlistItem.findUnique({ where: { id: itemId } });
    if (!item || item.relationshipId !== relationship.id) {
      return { success: false, error: { code: "NOT_FOUND" } };
    }

    const description = item.content || "";

    // Use wishlist category directly (now unified with event categories)
    const validCategories = EVENT_CATEGORIES.map((c) => c.value);
    const category = validCategories.includes(item.category as typeof validCategories[number])
      ? item.category
      : "OTHER";

    const event = await prisma.event.create({
      data: {
        relationshipId: relationship.id,
        createdBy: session.user.id,
        title: item.title,
        description: description || null,
        category,
        date: new Date(date),
        wishlistItemId: item.id,
      },
    });

    // Carry over wishlist images as Media records linked to this event
    const images = parseImages(item.imageUrl);
    for (const url of images) {
      await prisma.media.create({
        data: {
          eventId: event.id,
          uploadedBy: session.user.id,
          publicId: `wishlist/${url.split("/").pop()}`,
          url,
          mimeType: "image/jpeg",
          size: 0,
        },
      });
    }

    revalidatePath("/calendar");
    revalidatePath("/wishlist");

    return { success: true, data: { eventId: event.id } };
  } catch (err) {
    console.error("createEventFromWishlist error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function checkWishlistItemsForPassedEvents() {
  try {
    const now = new Date();

    // Find all events that passed today or earlier and have a wishlist item that's not yet checked
    const passedEvents = await prisma.event.findMany({
      where: {
        deletedAt: null,
        date: { lt: now },
        wishlistItemId: { not: null },
        wishlistItem: { isChecked: false },
      },
      select: {
        id: true,
        title: true,
        relationshipId: true,
        wishlistItemId: true,
        relationship: {
          select: { partnerAId: true, partnerBId: true },
        },
      },
    });

    const ids = passedEvents
      .map((e) => e.wishlistItemId)
      .filter((id): id is string => id !== null);

    if (ids.length > 0) {
      await prisma.wishlistItem.updateMany({
        where: { id: { in: ids } },
        data: { isChecked: true, checkedAt: now },
      });
    }

    // Create notifications and send push for each checked wishlist item
    const { sendPushNotification } = await import("@/lib/push");

    let notified = 0;
    for (const event of passedEvents) {
      if (!event.wishlistItemId) continue;

      const userIds = [event.relationship.partnerAId];
      if (event.relationship.partnerBId) {
        userIds.push(event.relationship.partnerBId);
      }

      for (const userId of userIds) {
        await prisma.notification.create({
          data: {
            userId,
            eventId: event.id,
            type: "EVENT_TODAY",
            title: `Wishlist item checked off!`,
            message: `${event.title} has been marked as done`,
            sentAt: new Date(),
          },
        });

        try {
          await sendPushNotification(userId, {
            title: "Wishlist item checked off!",
            body: `${event.title} has been marked as done`,
            url: "/wishlist",
          });
          notified++;
        } catch (err) {
          console.error(`[cron] Push failed for wishlist check ${event.id} user ${userId}:`, err);
        }
      }
    }

    if (notified > 0) {
      console.log(`[cron] Sent ${notified} wishlist completion notifications`);
    }

    return { success: true, data: { checked: ids.length } };
  } catch (err) {
    console.error("checkWishlistItemsForPassedEvents error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}
