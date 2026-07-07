"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/features/auth/components/PasswordInput";
import { loginUser } from "@/features/auth/actions";
import { LogIn, ArrowLeft } from "lucide-react";
import { PageBlobs } from "@/components/ui/DecorativeBlobs";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--bg-page)" }} />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await loginUser({ username, password });

    if (result.success) {
      router.push("/home");
    } else {
      setError(result.error?.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 relative overflow-hidden" style={{ background: "var(--bg-page)" }}>
      <PageBlobs seed={1} />

      {/* Back button */}
      <button
        onClick={() => router.push("/auth")}
        className="transition-colors mb-8 relative z-10 cursor-pointer"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft size={20} />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1 flex flex-col items-center justify-center w-full max-w-[380px] mx-auto relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
          >
            <LogIn size={28} style={{ color: "var(--accent)" }} />
          </div>
          <h1
            className="font-bold tracking-[-0.02em] mb-1"
            style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--text-primary)" }}
          >
            Sign In
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
            Welcome back
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
          <Input
            label="Username"
            name="username"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <PasswordInput
            label="Password"
            name="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {inviteCode && (
            <p className="text-[0.8rem] text-center" style={{ color: "var(--accent)" }}>
              You'll be brought back to your shared space right after signing in
            </p>
          )}

          {error && (
            <p className="text-[0.8rem] text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" fullWidth loading={loading}>
            <LogIn size={16} /> Sign In
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-[0.9rem] mt-8" style={{ color: "var(--text-secondary)" }}>
          Don&apos;t have an account?{" "}
          <Link
            href={`/register${inviteCode ? `?invite=${inviteCode}` : ""}`}
            className="font-semibold hover:underline"
            style={{ color: "var(--accent)" }}
          >
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
