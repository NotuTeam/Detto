"use server";

import { getCurrentRelationship } from "@/features/relationship/actions";
import { getSession } from "@/features/auth/actions";
import { prisma } from "@/lib/prisma";

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
      },
      orderBy: { date: "asc" },
      take: 3,
      select: { id: true, title: true, date: true, category: true, locationName: true },
    }),
    prisma.media.findMany({
      where: { event: { relationshipId: relationship.id, deletedAt: null } },
      orderBy: { createdAt: "desc" },
      take: 10,
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

  return {
    success: true,
    data: {
      relationship,
      nextEvent,
      upcomingEvents,
      recentPhotos,
      stats: {
        totalEvents,
        totalPhotos,
        avgRating: avgRatingResult._avg.rating?.toFixed(1) || "0.0",
      },
    },
  };
}
