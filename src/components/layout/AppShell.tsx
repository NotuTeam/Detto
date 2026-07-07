"use client";

import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { PageContainer } from "./PageContainer";
import { useUserStore } from "@/stores/user";
import { ScrollToTop } from "./ScrollToTop";
import { PWAInstallPrompt } from "@/components/ui/PWAInstallPrompt";
import { NotificationPrompt } from "@/components/ui/NotificationPrompt";

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppShell({ children, hideNav }: AppShellProps) {
  const displayName = useUserStore((s) => s.user?.displayName);
  const username = useUserStore((s) => s.user?.username);
  const avatarUrl = useUserStore((s) => s.user?.avatarUrl);

  return (
    <>
      <ScrollToTop />
      <AppHeader
        displayName={displayName || undefined}
        username={username || undefined}
        avatarUrl={avatarUrl}
      />
      <PageContainer>{children}</PageContainer>
      {!hideNav && <BottomNav />}
      <PWAInstallPrompt />
      <NotificationPrompt />
    </>
  );
}
