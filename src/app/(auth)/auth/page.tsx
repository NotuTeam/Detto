"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PageBlobs } from "@/components/ui/DecorativeBlobs";

export default function AuthPage() {
  const router = useRouter();
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden relative"
      style={{ background: "var(--bg-page)" }}
    >
      <PageBlobs seed={4} />
      <div className="w-full max-w-[380px] flex flex-col items-center text-center relative z-10">
        {/* Logo */}
        <div className="mb-6">
          <img
            src="/logo/full-primary.png"
            alt="Detto Logo"
            width={400}
            height={80}
          />
        </div>
        <p
          style={{
            fontSize: "1rem",
            color: "var(--text-secondary)",
            marginBottom: "2rem",
          }}
        >
          Moments pass quickly. Let Detto hold onto them.
        </p>

        <div className="flex flex-col gap-3 w-full">
          <Button fullWidth onClick={() => router.push("/register")}>
            Create Account
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => router.push("/login")}
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
