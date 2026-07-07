"use client";

import { savePushSubscription } from "@/features/notifications/actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribePushNotifications(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push notifications not supported");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("Notification permission not granted");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.warn("VAPID public key not set");
      return false;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const subJSON = subscription.toJSON();
    const keys = subJSON.keys as { p256dh: string; auth: string } | undefined;

    if (!subJSON.endpoint || !keys?.p256dh || !keys?.auth) {
      console.error("Invalid push subscription keys");
      return false;
    }

    const result = await savePushSubscription({
      endpoint: subJSON.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    return result.success;
  } catch (err) {
    console.error("Push subscription failed:", err);
    return false;
  }
}

export async function checkNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}
