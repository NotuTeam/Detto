"use client";

import { useEffect } from "react";
import { getSession } from "@/features/auth/actions";
import { getCurrentRelationship } from "@/features/relationship/actions";
import { useUserStore } from "@/stores/user";
import { useRelationshipStore } from "@/stores/relationship";
import { useAppStore } from "@/stores/app";

export function StoreInitializer() {
  const setUser = useUserStore((s) => s.setUser);
  const setRelationship = useRelationshipStore((s) => s.setRelationship);
  const setInitialized = useAppStore((s) => s.setInitialized);
  const isInitialized = useAppStore((s) => s.isInitialized);

  useEffect(() => {
    if (isInitialized) return;

    async function init() {
      try {
        const [session, rel] = await Promise.all([
          getSession(),
          getCurrentRelationship(),
        ]);

        if (session?.user) {
          setUser({
            id: session.user.id,
            username: session.user.username,
            displayName: session.user.displayName,
            avatarUrl: session.user.avatarUrl,
            birthDate:
              session.user.birthDate instanceof Date
                ? session.user.birthDate.toISOString()
                : String(session.user.birthDate),
          });
        } else {
          setUser(null);
        }

        if (rel) {
          const relData = rel as typeof rel & {
            partnerANickname?: string | null;
            partnerBNickname?: string | null;
            bannerUrl?: string | null;
          };

          const serializePartner = (p: { id: string; displayName: string; username?: string; avatarUrl?: string | null; birthDate?: Date | string | null } | null) =>
            p
              ? {
                  id: p.id,
                  displayName: p.displayName,
                  username: p.username || "",
                  avatarUrl: p.avatarUrl || null,
                  birthDate: p.birthDate
                    ? p.birthDate instanceof Date
                      ? p.birthDate.toISOString()
                      : String(p.birthDate)
                    : null,
                }
              : null;

          setRelationship({
            id: rel.id,
            name: rel.name,
            status: rel.status,
            partnerA: serializePartner(rel.partnerA)!,
            partnerB: serializePartner(rel.partnerB),
            partnerANickname: relData.partnerANickname || null,
            partnerBNickname: relData.partnerBNickname || null,
            bannerUrl: relData.bannerUrl || null,
            startedAt:
              rel.startedAt instanceof Date
                ? rel.startedAt.toISOString()
                : String(rel.startedAt),
            engagementDate: rel.engagementDate
              ? rel.engagementDate instanceof Date
                ? rel.engagementDate.toISOString()
                : String(rel.engagementDate)
              : null,
            marriedAt: rel.marriedAt
              ? rel.marriedAt instanceof Date
                ? rel.marriedAt.toISOString()
                : String(rel.marriedAt)
              : null,
            timezone: rel.timezone || null,
          });
        } else {
          setRelationship(null);
        }

        setInitialized();
      } catch (err) {
        console.error("StoreInitializer error:", err);
        setInitialized();
      }
    }

    init();
  }, [isInitialized, setUser, setRelationship, setInitialized]);

  return null;
}
