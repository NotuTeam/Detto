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
    // Do NOT auto-request permission here -- browsers require a user gesture.
    // The NotificationPrompt component handles the initial permission request.
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
