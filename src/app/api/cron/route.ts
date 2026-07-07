import { NextRequest, NextResponse } from "next/server";
import { updateExpiredEventStatuses, sendDayOfEventReminders, sendTomorrowEventReminders } from "@/lib/auto-status";
import { generateAutoEventsForAllRelationships } from "@/lib/auto-events";
import { checkWishlistItemsForPassedEvents } from "@/features/wishlist/actions";

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

    await Promise.all([
      updateExpiredEventStatuses(),
      sendDayOfEventReminders(),
      sendTomorrowEventReminders(),
      checkWishlistItemsForPassedEvents(),
    ]);

    return NextResponse.json({
      success: true,
      message: "Event reminders sent and expired statuses updated",
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
