"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Calendar,
  Heart,
  ArrowRight,
  Image as ImageIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/feedback/EmptyState";
import { MiniGallery } from "@/features/media/components/MiniGallery";
import { NotesStack } from "@/features/notes/components/NotesStack";
import { EventCard, type EventItem } from "@/features/events/components/EventCard";
import { getDashboardData } from "@/features/home/actions";
import { useUserStore } from "@/stores/user";

interface DashboardData {
  relationship: Record<string, unknown> | null;
  nextEvent: { id: string; title: string; category: string; date: string; locationName: string | null } | null;
  upcomingEvents: { id: string; title: string; category: string; date: string; locationName: string | null }[];
  recentPhotos: { id: string; url: string; caption: string | null }[];
  stats: { totalEvents: number; totalPhotos: number; avgRating: string };
}

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUserId = useUserStore((s) => s.user?.id);

  useEffect(() => {
    getDashboardData().then((result) => {
      if (result.success && result.data) setData(result.data as unknown as DashboardData);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  if (!data?.relationship) {
    return (
      <EmptyState
        icon={Heart}
        title="No relationship yet"
        description="Create a new relationship or join with an invitation from your partner"
        action={{ label: "Start Relationship", href: "/relation/setup" }}
      />
    );
  }

  const { upcomingEvents, recentPhotos } = data;

  return (
    <div className="px-4 py-6 flex flex-col gap-5">
      {/* Notes */}
      <NotesStack currentUserId={currentUserId} />

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-[1.15rem] font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Upcoming Events
          </h2>
          <Link
            href="/calendar"
            className="flex items-center gap-1 text-[0.8rem] font-medium transition-colors"
            style={{ color: "var(--accent)" }}
          >
            See All <ArrowRight size={12} />
          </Link>
        </div>

        {upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="flex flex-col gap-3">
            {upcomingEvents.map((ev, i) => (
              <Link key={ev.id} href="/calendar">
                <EventCard event={ev as EventItem} index={i} />
              </Link>
            ))}
          </div>
        ) : (
          <Card variant="elevated" padding="lg">
            <EmptyState
              icon={Calendar}
              title="No events yet"
              description="Let's plan your first date!"
              className="py-4"
              action={{ label: "Create Event" }}
            />
          </Card>
        )}
      </div>

      {/* Gallery Slideshow or Create Memory CTA */}
      {recentPhotos && recentPhotos.length > 0 ? (
        <MiniGallery photos={recentPhotos} />
      ) : (
        <div
          className="rounded-[var(--radius-lg)] p-8 flex flex-col items-center text-center"
          style={{ background: "var(--surface)" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: "var(--accent-soft)" }}
          >
            <ImageIcon size={28} style={{ color: "var(--accent)" }} />
          </div>
          <h3
            className="text-[1.1rem] font-bold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Keep your first memory
          </h3>
          <p
            className="text-[0.85rem] mb-5"
            style={{ color: "var(--text-secondary)" }}
          >
            Capture and share moments from your dates
          </p>
          <Link href="/memories">
            <Button size="sm">Go to Gallery</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
