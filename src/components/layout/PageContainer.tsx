import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  noBottomPadding?: boolean;
}

export function PageContainer({ children, className, noBottomPadding }: PageContainerProps) {
  return (
    <main
      className={cn(
        "max-w-[430px] mx-auto w-full min-h-screen",
        !noBottomPadding && "pb-24",
        className
      )}
    >
      {children}
    </main>
  );
}
