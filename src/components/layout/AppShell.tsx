"use client";

import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { PageContainer } from "./PageContainer";
import { useUserStore } from "@/stores/user";
import { useRelationshipStore } from "@/stores/relationship";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ScrollToTop } from "./ScrollToTop";

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
  loading?: boolean;
}

export function AppShell({ children, hideNav, loading }: AppShellProps) {
  const isUserLoading = useUserStore((s) => s.isLoading);
  const isRelLoading = useRelationshipStore((s) => s.isLoading);
  const displayName = useUserStore((s) => s.user?.displayName);
  const username = useUserStore((s) => s.user?.username);
  const avatarUrl = useUserStore((s) => s.user?.avatarUrl);

  if (loading || isUserLoading || isRelLoading) {
    return (
      <>
        <AppHeader />
        <PageContainer>
          <LoadingState />
        </PageContainer>
        {!hideNav && <BottomNav />}
      </>
    );
  }

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
    </>
  );
}
