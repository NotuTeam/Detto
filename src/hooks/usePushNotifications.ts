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

    // If already granted, just make sure we have an active subscription
    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (!sub) {
            subscribePushNotifications();
          }
        });
      });
      return;
    }

    // If not denied, prompt the user after a short delay so it doesn't
    // feel like the very first thing the app does.
    if (Notification.permission === "default") {
      const timer = setTimeout(() => {
        subscribePushNotifications();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);
}
