import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { Providers } from "@/providers";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-family",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://detto.app"),
  title: {
    default: "Detto — A Small Space for Your Story, Together",
    template: "%s | Detto",
  },
  description:
    "Detto is a private space for couples to share memories, celebrate milestones, plan dates, exchange notes, and grow together.",
  keywords: [
    "couples app",
    "relationship",
    "memories",
    "shared calendar",
    "love notes",
    "wishlist",
    "timeline",
    "partner",
  ],
  manifest: "/manifest.json",
  authors: [{ name: "NotuTeam" }],
  creator: "NotuTeam",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Detto",
    title: "Detto — A Small Space for Your Story, Together",
    description:
      "A private space for couples to share memories, celebrate milestones, and grow together.",
    images: [
      {
        url: "/og/og-default.png",
        width: 1200,
        height: 630,
        alt: "Detto — A Small Space for Your Story, Together",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Detto — A Small Space for Your Story, Together",
    description:
      "A private space for couples to share memories, celebrate milestones, and grow together.",
    images: ["/og/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Detto",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fe6b5e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" className={`${nunito.variable} h-full`}>
      <head>
        <link rel="icon" href="/logo/main.png" />
        <link rel="apple-touch-icon" href="/logo/main.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
      </head>
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
