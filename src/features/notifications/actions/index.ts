"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/features/auth/actions";
import { revalidatePath } from "next/cache";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  eventId: string | null;
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export async function getNotifications(limit = 50) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        eventId: true,
        readAt: true,
        sentAt: true,
        createdAt: true,
      },
    });

    const serialized: NotificationItem[] = notifications.map((n: (typeof notifications)[number]) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      eventId: n.eventId,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      sentAt: n.sentAt ? n.sentAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    }));

    return { success: true, data: serialized };
  } catch (err) {
    console.error("getNotifications error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function getUnreadCount() {
  try {
    const session = await getSession();
    if (!session) return { success: true, data: 0 };

    const count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        readAt: null,
      },
    });

    return { success: true, data: count };
  } catch (err) {
    console.error("getUnreadCount error:", err);
    return { success: true, data: 0 };
  }
}

export async function markAsRead(notificationId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== session.user.id) {
      return { success: false, error: { code: "FORBIDDEN" } };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch (err) {
    console.error("markAsRead error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function markAllAsRead() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch (err) {
    console.error("markAllAsRead error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function savePushSubscription(subscription: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
      create: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("savePushSubscription error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== session.user.id) {
      return { success: false, error: { code: "FORBIDDEN" } };
    }

    await prisma.notification.delete({ where: { id: notificationId } });

    revalidatePath("/notifications");
    return { success: true };
  } catch (err) {
    console.error("deleteNotification error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}
