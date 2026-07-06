"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/features/auth/actions";
import { getCurrentRelationship } from "@/features/relationship/actions";

export interface TimelineEvent {
  id: string;
  title: string;
  description: string | null;
  category: string;
  date: string;
  locationName: string | null;
  locationUrl: string | null;
  status: string;
  createdBy: string;
  wishlistItemId?: string | null;
  creator?: { id: string; displayName: string; avatarUrl: string | null };
  mediaCount: number;
}

export interface TimelineMonth {
  year: number;
  month: number;
  monthLabel: string;
  events: TimelineEvent[];
}

export async function getTimelineEvents(limit = 200) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: { code: "UNAUTHORIZED" } };

    const relationship = await getCurrentRelationship();
    if (!relationship) return { success: true, data: [] };

    const events = await prisma.event.findMany({
      where: {
        relationshipId: relationship.id,
        deletedAt: null,
        NOT: { description: "[AUTO:NOTES_CONTAINER]" },
      },
      orderBy: { date: "desc" },
      take: limit,
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
        _count: { select: { media: true } },
      },
    });

    // Group by year-month
    const grouped = new Map<string, TimelineMonth>();

    for (const ev of events) {
      const d = ev.date;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          year: d.getFullYear(),
          month: d.getMonth(),
          monthLabel: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          events: [],
        });
      }
      grouped.get(key)!.events.push({
        id: ev.id,
        title: ev.title,
        description: ev.description,
        category: ev.category,
        date: ev.date.toISOString(),
        locationName: ev.locationName,
        locationUrl: ev.locationUrl,
        status: ev.status,
        createdBy: ev.createdBy,
        wishlistItemId: ev.wishlistItemId,
        creator: ev.creator,
        mediaCount: ev._count.media,
      });
    }

    return { success: true, data: Array.from(grouped.values()) };
  } catch (err) {
    console.error("getTimelineEvents error:", err);
    return { success: false, error: { code: "INTERNAL_ERROR" } };
  }
}
