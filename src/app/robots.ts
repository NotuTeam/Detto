import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://detto.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/onboarding", "/auth", "/login", "/register", "/invite"],
        disallow: ["/home", "/calendar", "/memories", "/notifications", "/profile", "/relation", "/timeline", "/wishlist", "/api", "/dungeon"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
