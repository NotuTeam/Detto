import { prisma } from "./prisma";
import { sendPushNotification } from "./push";

interface SendNotificationParams {
  userId: string;
  eventId?: string;
  type: string;
  title: string;
  message: string;
  scheduledAt?: Date;
}

export async function createNotification(params: SendNotificationParams) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      eventId: params.eventId,
      type: params.type,
      title: params.title,
      message: params.message,
      scheduledAt: params.scheduledAt,
      sentAt: new Date(),
    },
  });

  // Send push notification
  try {
    await sendPushNotification(params.userId, {
      title: params.title,
      body: params.message,
    });
  } catch {
    // Push notification failed, but we still saved the notification to DB
  }

  return notification;
}

export async function sendEventReminder(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { relationship: true },
  });

  if (!event || !event.relationship) return;

  const userIds = [event.relationship.partnerAId];
  if (event.relationship.partnerBId) {
    userIds.push(event.relationship.partnerBId);
  }

  for (const userId of userIds) {
    await createNotification({
      userId,
      eventId: event.id,
      type: "EVENT_REMINDER",
      title: `${event.title} is coming up`,
      message: `Just a gentle nudge — ${event.title} is around the corner.`,
    });
  }
}
