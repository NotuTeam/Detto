import { prisma } from "./prisma";
import { sendPushNotification } from "./push";

export async function updateExpiredEventStatuses() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  await prisma.event.updateMany({
    where: {
      status: "UPCOMING",
      date: { lt: todayStart },
    },
    data: { status: "PAST" },
  });
}

export async function sendDayOfEventReminders() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const todayEvents = await prisma.event.findMany({
    where: {
      deletedAt: null,
      date: { gte: todayStart, lt: todayEnd },
    },
    include: {
      relationship: true,
    },
  });

  for (const event of todayEvents) {
    const userIds = [event.relationship.partnerAId];
    if (event.relationship.partnerBId) {
      userIds.push(event.relationship.partnerBId);
    }

    for (const userId of userIds) {
      // Check if reminder already sent today
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          eventId: event.id,
          type: "EVENT_TODAY",
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            userId,
            eventId: event.id,
            type: "EVENT_TODAY",
            title: `Today: ${event.title}`,
            message: event.locationName
              ? `${event.title} at ${event.locationName}`
              : `${event.title} is happening today!`,
            sentAt: new Date(),
          },
        });

        try {
          await sendPushNotification(userId, {
            title: `Today: ${event.title}`,
            body: event.locationName
              ? `${event.title} at ${event.locationName}`
              : `${event.title} is happening today!`,
          });
        } catch {
          // push failed, but notification saved to DB
        }
      }
    }
  }
}
