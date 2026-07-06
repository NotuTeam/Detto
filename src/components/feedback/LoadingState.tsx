import { cn } from "@/lib/utils";

interface LoadingStateProps {
  className?: string;
}

export function LoadingState({ className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col gap-4 p-4", className)}>
      <div className="h-8 w-48 rounded-[var(--radius-md)] animate-pulse" style={{ background: "var(--surface-alt)" }} />
      <div className="h-32 rounded-[var(--radius-lg)] animate-pulse" style={{ background: "var(--surface-alt)" }} />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 rounded-[var(--radius-lg)] animate-pulse" style={{ background: "var(--surface-alt)" }} />
        <div className="h-20 rounded-[var(--radius-lg)] animate-pulse" style={{ background: "var(--surface-alt)" }} />
      </div>
      <div className="h-24 rounded-[var(--radius-lg)] animate-pulse" style={{ background: "var(--surface-alt)" }} />
    </div>
  );
}
