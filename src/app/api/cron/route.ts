import { NextRequest, NextResponse } from "next/server";
import { updateExpiredEventStatuses, sendDayOfEventReminders, sendTomorrowEventReminders } from "@/lib/auto-status";
import { generateAutoEventsForAllRelationships } from "@/lib/auto-events";
import { checkWishlistItemsForPassedEvents } from "@/features/wishlist/actions";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // On January 1st, generate auto events for the new year
    if (now.getMonth() === 0 && now.getDate() === 1) {
      await generateAutoEventsForAllRelationships(now.getFullYear());
    }

    const results = await Promise.allSettled([
      updateExpiredEventStatuses(),
      sendDayOfEventReminders(),
      sendTomorrowEventReminders(),
      checkWishlistItemsForPassedEvents(),
    ]);

    const settled = results.map((r, i) => {
      const names = ["updateExpired", "dayOfReminders", "tomorrowReminders", "wishlistCheck"];
      return {
        task: names[i],
        status: r.status,
        ...(r.status === "rejected" ? { error: String(r.reason) } : {}),
      };
    });

    return NextResponse.json({
      success: true,
      message: "Cron job executed",
      timestamp: now.toISOString(),
      tasks: settled,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Manual test -- sends a test notification to the current user
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // 1. Generate auto-events for all relationships
    await generateAutoEventsForAllRelationships(now.getFullYear());

    // 2. Run all cron tasks
    const results = await Promise.allSettled([
      updateExpiredEventStatuses(),
      sendDayOfEventReminders(),
      sendTomorrowEventReminders(),
      checkWishlistItemsForPassedEvents(),
    ]);

    const taskNames = ["updateExpired", "dayOfReminders", "tomorrowReminders", "wishlistCheck"];
    const tasks = results.map((r, i) => ({
      task: taskNames[i],
      status: r.status,
      ...(r.status === "rejected" ? { error: String(r.reason) } : {}),
    }));

    // 3. Count notifications and subscriptions
    const subs = await prisma.pushSubscription.count();
    const notifs = await prisma.notification.count({
      where: { createdAt: { gte: new Date(now.getTime() - 60000) } },
    });

    return NextResponse.json({
      success: true,
      message: "Manual cron test executed",
      timestamp: now.toISOString(),
      tasks,
      stats: {
        totalPushSubscriptions: subs,
        notificationsCreatedLastMinute: notifs,
      },
    });
  } catch (error) {
    console.error("Cron test failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
