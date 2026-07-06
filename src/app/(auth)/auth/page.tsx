"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Heart } from "lucide-react";
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
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: "var(--accent-soft)" }}
        >
          <Heart size={40} style={{ color: "var(--accent)" }} />
        </div>

        <h1
          className="font-bold tracking-[-0.03em] mb-2"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            color: "var(--text-primary)",
          }}
        >
          Detto
        </h1>
        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--text-secondary)",
            marginBottom: "2rem",
          }}
        >
          Every moment has a story.
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
