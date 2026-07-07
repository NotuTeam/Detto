"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Heart, AlertTriangle } from "lucide-react";
import {
  validateInvitationByCode,
  joinByShortCode,
  getCurrentRelationship,
} from "@/features/relationship/actions";
import { getSession } from "@/features/auth/actions";
import { PageBlobs } from "@/components/ui/DecorativeBlobs";

export default function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);
  const [code, setCode] = useState("");
  const [isInRelation, setIsInRelation] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    params.then(async ({ code }) => {
      setCode(code.toUpperCase());
      const session = await getSession();
      setIsLoggedIn(!!session);

      if (session) {
        const rel = await getCurrentRelationship();
        if (rel) {
          setIsInRelation(true);
          setValidating(false);
          return;
        }
      }

      const result = await validateInvitationByCode(code);
      if (result.success) {
        setInviterName(result.data?.inviterName || null);
      } else {
        setError(result.error?.message || "Invalid invitation");
      }
      setValidating(false);
    });
  }, [params]);

  async function handleJoin() {
    setLoading(true);
    setError("");
    const result = await joinByShortCode(code);
    setLoading(false);
    if (result.success) {
      router.push("/home");
    } else {
      setError(result.error?.message || "Failed to join");
    }
  }

  const iconCircle = (icon: React.ReactNode, bg: string) => (
    <div
      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
      style={{ background: bg }}
    >
      {icon}
    </div>
  );

  // Validating
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[0.95rem]"
          style={{ color: "var(--text-secondary)" }}
        >
          Checking invitation...
        </motion.div>
      </div>
    );
  }

  // Already in relation
  if (isInRelation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden relative" style={{ background: "var(--bg-page)" }}>
        <PageBlobs seed={5} />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[380px] text-center relative z-10">
          {iconCircle(<AlertTriangle size={36} style={{ color: "var(--warning)" }} />, "color-mix(in srgb, var(--warning) 15%, transparent)")}
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
            Already in a relationship
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "2rem" }}>
            Close this chapter before starting a new one
          </p>
          <Button fullWidth onClick={() => router.push("/relation")}>
            View Current Relationship
          </Button>
          <Button variant="ghost" fullWidth onClick={() => router.push("/home")} className="mt-3">
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden relative" style={{ background: "var(--bg-page)" }}>
        <PageBlobs seed={6} />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[380px] text-center relative z-10">
          {iconCircle(<Heart size={36} style={{ color: "var(--accent)" }} />, "var(--accent-soft)")}
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            {inviterName ? `${inviterName} invited you` : "Relationship Invitation"}
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "2rem" }}>
            One step away from writing this story together
          </p>
          <Button fullWidth onClick={() => router.push(`/register?invite=${code}`)}>
            Create Account & Join
          </Button>
          <Button variant="ghost" fullWidth onClick={() => router.push(`/login?invite=${code}`)} className="mt-3">
            Sign In & Join
          </Button>
        </motion.div>
      </div>
    );
  }

  // Logged in + not in relation
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden relative" style={{ background: "var(--bg-page)" }}>
      <PageBlobs seed={7} />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[380px] text-center relative z-10">
        {iconCircle(<Heart size={36} style={{ color: "var(--accent)" }} />, "var(--accent-soft)")}
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          {inviterName ? `${inviterName} invited you` : "Relationship Invitation"}
        </h2>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "2rem" }}>
          Join the relationship and start your journey together
        </p>
        {error && <p className="text-[0.8rem] text-red-500 mb-4">{error}</p>}
        <Button fullWidth loading={loading} onClick={handleJoin}>
          Accept Invitation & Join
        </Button>
        <Button variant="ghost" fullWidth onClick={() => router.push("/home")} className="mt-3">
          Skip
        </Button>
      </motion.div>
    </div>
  );
}
