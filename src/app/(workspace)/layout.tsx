import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StoreInitializer } from "@/stores/StoreInitializer";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StoreInitializer />
      <AppShell>{children}</AppShell>
    </>
  );
}
