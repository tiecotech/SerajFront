import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import { SerajSplash } from "@/components/SerajLoader";
import "./globals.css";

const plex = localFont({
  variable: "--font-plex",
  display: "swap",
  src: [
    { path: "../fonts/IBMPlexSansArabic-Regular.woff2", weight: "400" },
    { path: "../fonts/IBMPlexSansArabic-Medium.woff2", weight: "500" },
    { path: "../fonts/IBMPlexSansArabic-SemiBold.woff2", weight: "600" },
    { path: "../fonts/IBMPlexSansArabic-Bold.woff2", weight: "700" },
  ],
});

const alexandria = localFont({
  variable: "--font-alexandria",
  display: "swap",
  src: [{ path: "../fonts/Alexandria.woff2", weight: "100 900" }],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "السراج المضيء | أنظمة الإضاءة", template: "%s" },
  description: "السراج المضيء — حلول الإنارة والتجهيزات الكهربائية.",
};

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Arabic-first, RTL by default. `lang`/`dir` are the single switch for a future English locale.
  return (
    <html lang="ar" dir="rtl" className={`${plex.variable} ${alexandria.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preload" as="image" href="/brand/seraj-icon-loader.webp" type="image/webp" />
      </head>
      <body>
        <SerajSplash />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
