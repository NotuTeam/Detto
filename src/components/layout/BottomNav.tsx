"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Image, Star, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/calendar", icon: Calendar, label: "Events" },
  { href: "/wishlist", icon: Star, label: "Wishlist" },
  { href: "/memories", icon: Image, label: "Gallery" },
  { href: "/relation", icon: Heart, label: "Relationship" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div
        className="max-w-[320px] mx-auto flex items-center justify-around h-16 px-2 rounded-full mb-2"
        style={{ background: "var(--surface)" }}
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors duration-150",
                isActive
                  ? "text-[var(--accent)]"
                  : "text-[var(--text-primary)] opacity-40",
              )}
            >
              <item.icon size={20} strokeWidth={2} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
