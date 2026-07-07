import { prisma } from "./prisma";
import { sendPushNotification } from "./push";

export async function updateExpiredEventStatuses() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const result = await prisma.event.updateMany({
    where: {
      status: "UPCOMING",
      date: { lt: todayStart },
    },
    data: { status: "PAST" },
  });

  if (result.count > 0) {
    console.log(`[cron] Marked ${result.count} events as PAST`);
  }
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
      description: { not: { contains: "[AUTO:" } },
    },
    include: {
      relationship: true,
    },
  });

  let sent = 0;

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
        const body = event.locationName
          ? `Let's ${event.title} at ${event.locationName} yuhuuu`
          : `Finally, ${event.title} is happening today!`;

        await prisma.notification.create({
          data: {
            userId,
            eventId: event.id,
            type: "EVENT_TODAY",
            title: `Today is ${event.title} Day !`,
            message: body,
            sentAt: new Date(),
          },
        });

        try {
          await sendPushNotification(userId, {
            title: `Today is ${event.title} Day !`,
            body,
            url: "/calendar",
          });
          sent++;
        } catch (err) {
          console.error(`[cron] Push failed for EVENT_TODAY ${event.id} user ${userId}:`, err);
        }
      }
    }
  }

  if (sent > 0) {
    console.log(`[cron] Sent ${sent} day-of event reminders`);
  }
}

export async function sendTomorrowEventReminders() {
  const now = new Date();
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  const tomorrowEvents = await prisma.event.findMany({
    where: {
      deletedAt: null,
      date: { gte: tomorrowStart, lt: tomorrowEnd },
      description: { not: { contains: "[AUTO:" } },
    },
    include: {
      relationship: true,
    },
  });

  let sent = 0;

  for (const event of tomorrowEvents) {
    const userIds = [event.relationship.partnerAId];
    if (event.relationship.partnerBId) {
      userIds.push(event.relationship.partnerBId);
    }

    for (const userId of userIds) {
      // Check if reminder already sent
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          eventId: event.id,
          type: "EVENT_REMINDER",
        },
      });

      if (!existing) {
        const body = event.locationName
          ? `${event.title} tomorrow at ${event.locationName}`
          : `${event.title} is coming up tomorrow!`;

        await prisma.notification.create({
          data: {
            userId,
            eventId: event.id,
            type: "EVENT_REMINDER",
            title: `Tomorrow: ${event.title}`,
            message: body,
            sentAt: new Date(),
          },
        });

        try {
          await sendPushNotification(userId, {
            title: `Tomorrow: ${event.title}`,
            body,
            url: "/calendar",
          });
          sent++;
        } catch (err) {
          console.error(`[cron] Push failed for EVENT_REMINDER ${event.id} user ${userId}:`, err);
        }
      }
    }
  }

  if (sent > 0) {
    console.log(`[cron] Sent ${sent} tomorrow event reminders`);
  }
}
