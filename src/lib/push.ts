import webPush from "web-push";
import { prisma } from "./prisma";

let vapidInitialized = false;

function ensureVapid() {
  if (vapidInitialized) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (publicKey && privateKey) {
    webPush.setVapidDetails(
      process.env.WEB_PUSH_EMAIL || "mailto:dev@detto.app",
      publicKey,
      privateKey
    );
    vapidInitialized = true;
  }
}

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  ensureVapid();
  if (!vapidInitialized) {
    console.warn("[push] VAPID keys not configured -- skipping push notification");
    return [];
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    console.warn(`[push] No push subscriptions found for user ${userId}`);
    return [];
  }

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  );

  // Log and clean up expired/invalid subscriptions
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const statusCode = (result.reason as { statusCode?: number })?.statusCode;
      console.error(`[push] Failed to send to subscription ${subscriptions[index].id}:`, result.reason?.message || result.reason);
      // Delete any subscription that fails -- 404/410 = expired, other codes = key mismatch or invalid
      prisma.pushSubscription.delete({
        where: { id: subscriptions[index].id },
      }).catch(() => {});
    }
  });

  return results;
}

export { webPush };
