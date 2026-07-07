"use client";

import { useEffect, useRef } from "react";
import { subscribePushNotifications } from "@/lib/push-client";

export function usePushNotifications(isAuthenticated: boolean) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || initialized.current) return;
    if (typeof Notification === "undefined") return;
    if (typeof PushManager === "undefined") return;
    initialized.current = true;

    // Only auto-subscribe if permission already granted.
    // Do NOT auto-request permission — let the install prompt or manual action do that.
    if (Notification.permission !== "granted") return;

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (!sub) {
          subscribePushNotifications();
        }
      });
    });
  }, [isAuthenticated]);
}
