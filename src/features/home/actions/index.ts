"use server";

import { getCurrentRelationship } from "@/features/relationship/actions";
import { getSession } from "@/features/auth/actions";
import { prisma } from "@/lib/prisma";

const NOTES_EVENT_TAG = "[AUTO:NOTES_CONTAINER]";
const excludeAutoEvents = {
  OR: [
    { description: null },
    { description: { not: NOTES_EVENT_TAG } },
  ],
};

export async function getDashboardData() {
  const session = await getSession();
  if (!session) return { success: false, error: { code: "UNAUTHORIZED", message: "Please login" } };

  const relationship = await getCurrentRelationship();
  if (!relationship) return { success: true, data: { relationship: null } };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneMonthLater = new Date(startOfToday);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  const [nextEvent, upcomingEvents, recentPhotos, totalEvents, totalPhotos, avgRatingResult] = await Promise.all([
    prisma.event.findFirst({
      where: {
        relationshipId: relationship.id,
        date: { gte: startOfToday, lte: oneMonthLater },
        deletedAt: null,
        status: "UPCOMING",
        ...excludeAutoEvents,
      },
      orderBy: { date: "asc" },
      select: { id: true, title: true, date: true, category: true, locationName: true },
    }),
    prisma.event.findMany({
      where: {
        relationshipId: relationship.id,
        deletedAt: null,
        date: { gte: startOfToday, lte: oneMonthLater },
        status: "UPCOMING",
        ...excludeAutoEvents,
      },
      orderBy: { date: "asc" },
      take: 3,
      select: { id: true, title: true, date: true, category: true, locationName: true },
    }),
    prisma.media.findMany({
      where: { event: { relationshipId: relationship.id, deletedAt: null } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, url: true, caption: true },
    }),
    prisma.event.count({
      where: { relationshipId: relationship.id, deletedAt: null },
    }),
    prisma.media.count({
      where: { event: { relationshipId: relationship.id } },
    }),
    prisma.rating.aggregate({
      where: { event: { relationshipId: relationship.id } },
      _avg: { rating: true },
    }),
  ]);

  // Randomize photos for slideshow variety (max 10 shown, changes each load)
  const randomizedPhotos = [...recentPhotos]
    .sort(() => Math.random() - 0.5)
    .slice(0, 10);

  return {
    success: true,
    data: {
      relationship,
      nextEvent,
      upcomingEvents,
      recentPhotos: randomizedPhotos,
      stats: {
        totalEvents,
        totalPhotos,
        avgRating: avgRatingResult._avg.rating?.toFixed(1) || "0.0",
      },
    },
  };
}
