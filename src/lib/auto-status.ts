import { prisma } from "./prisma";
import { sendPushNotification } from "./push";
import { toLocalDateString, localDayString } from "./timezone";

export async function updateExpiredEventStatuses() {
  const now = new Date();
  // Use a wide window to be timezone-safe: any UPCOMING event whose date
  // is before the start of "today" in its own relationship timezone gets
  // marked PAST. We resolve "today" per-relationship below.
  const relationships = await prisma.relationship.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: { id: true, timezone: true },
  });

  let total = 0;
  for (const rel of relationships) {
    const tz = rel.timezone || "Asia/Jakarta";
    const todayStr = toLocalDateString(now, tz);
    // Anchor to start-of-day today in the relationship timezone, expressed
    // as a UTC instant. We approximate by computing the local date string
    // and parsing it as UTC midnight, which is guaranteed to be strictly
    // after the previous local day in any timezone with offset >= -12h.
    const todayStartUtc = new Date(`${todayStr}T00:00:00Z`);

    const result = await prisma.event.updateMany({
      where: {
        relationshipId: rel.id,
        status: "UPCOMING",
        date: { lt: todayStartUtc },
      },
      data: { status: "PAST" },
    });
    total += result.count;
  }

  if (total > 0) {
    console.log(`[cron] Marked ${total} events as PAST`);
  }
}

export async function sendDayOfEventReminders() {
  const now = new Date();

  // Pull all candidate events (active, not deleted, not auto-container)
  // in a generous window around today. We'll filter per-relationship
  // timezone using YYYY-MM-DD calendar comparison to avoid off-by-one
  // bugs when the server runs in a different timezone than the user.
  const windowStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const candidates = (await prisma.event.findMany({
    where: {
      deletedAt: null,
      date: { gte: windowStart, lte: windowEnd },
    },
    include: { relationship: true },
  })).filter((e) => !e.description?.startsWith("[AUTO:NOTES_CONTAINER]"));

  let sent = 0;

  for (const event of candidates) {
    const tz = event.relationship?.timezone || "Asia/Jakarta";
    const eventDay = toLocalDateString(event.date, tz);
    const todayDay = toLocalDateString(now, tz);
    if (eventDay !== todayDay) continue;

    const userIds = [event.relationship.partnerAId];
    if (event.relationship.partnerBId) {
      userIds.push(event.relationship.partnerBId);
    }

    for (const userId of userIds) {
      // Only send once per event
      const existing = await prisma.notification.findFirst({
        where: { userId, eventId: event.id, type: "EVENT_TODAY" },
      });
      if (existing) continue;

      const title = `Today is ${event.title} Day!`;
      const body = buildDayOfMessage(event);

      await prisma.notification.create({
        data: {
          userId,
          eventId: event.id,
          type: "EVENT_TODAY",
          title,
          message: body,
          sentAt: new Date(),
        },
      });

      try {
        await sendPushNotification(userId, {
          title,
          body,
          url: "/calendar",
        });
        sent++;
      } catch (err) {
        console.error(`[cron] Push failed for EVENT_TODAY ${event.id} user ${userId}:`, err);
      }
    }
  }

  if (sent > 0) {
    console.log(`[cron] Sent ${sent} day-of event reminders`);
  }
}

export async function sendTomorrowEventReminders() {
  const now = new Date();

  const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const candidates = (await prisma.event.findMany({
    where: {
      deletedAt: null,
      date: { gte: windowStart, lte: windowEnd },
    },
    include: { relationship: true },
  })).filter((e) => !e.description?.startsWith("[AUTO:NOTES_CONTAINER]"));

  let sent = 0;

  for (const event of candidates) {
    const tz = event.relationship?.timezone || "Asia/Jakarta";
    const eventDay = toLocalDateString(event.date, tz);
    const tomorrowDay = localDayString(now, 1, tz);
    if (eventDay !== tomorrowDay) continue;

    const userIds = [event.relationship.partnerAId];
    if (event.relationship.partnerBId) {
      userIds.push(event.relationship.partnerBId);
    }

    for (const userId of userIds) {
      const existing = await prisma.notification.findFirst({
        where: { userId, eventId: event.id, type: "EVENT_REMINDER" },
      });
      if (existing) continue;

      const title = `Tomorrow: ${event.title}`;
      const body = buildTomorrowMessage(event);

      await prisma.notification.create({
        data: {
          userId,
          eventId: event.id,
          type: "EVENT_REMINDER",
          title,
          message: body,
          sentAt: new Date(),
        },
      });

      try {
        await sendPushNotification(userId, {
          title,
          body,
          url: "/calendar",
        });
        sent++;
      } catch (err) {
        console.error(`[cron] Push failed for EVENT_REMINDER ${event.id} user ${userId}:`, err);
      }
    }
  }

  if (sent > 0) {
    console.log(`[cron] Sent ${sent} tomorrow event reminders`);
  }
}

// ── Notification copy ─────────────────────────────────────────

function buildDayOfMessage(event: { title: string; locationName: string | null; category: string }): string {
  const title = event.title.trim();
  const loc = event.locationName?.trim();

  // Category-flavored copy
  const categoryLine: Record<string, string> = {
    BIRTHDAY: `It's ${title} today. Time to make them feel special.`,
    ANNIVERSARY: `Another year together — happy ${title}!`,
    DATE: `Today's the day for ${title}.`,
    TRAVEL: `Bon voyage! ${title} starts today.`,
    RESTAURANT: `Your table at ${title} is waiting.`,
  };

  if (categoryLine[event.category] && !loc) {
    return categoryLine[event.category];
  }

  if (loc) {
    return `${title} is today at ${loc}. Have the best time!`;
  }

  return `${title} is today. Enjoy every moment.`;
}

function buildTomorrowMessage(event: { title: string; locationName: string | null; category: string }): string {
  const title = event.title.trim();
  const loc = event.locationName?.trim();

  const categoryLine: Record<string, string> = {
    BIRTHDAY: `Tomorrow is ${title}. Don't forget to wish them!`,
    ANNIVERSARY: `${title} is tomorrow — got something planned?`,
    DATE: `Get ready — ${title} is tomorrow.`,
    TRAVEL: `Pack your bags: ${title} is tomorrow.`,
    RESTAURANT: `Your table at ${title} is booked for tomorrow.`,
  };

  if (categoryLine[event.category] && !loc) {
    return categoryLine[event.category];
  }

  if (loc) {
    return `${title} is tomorrow at ${loc}. Set your alarms!`;
  }

  return `Tomorrow is the day for ${title}.`;
}
