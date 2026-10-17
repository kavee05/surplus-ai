import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"], display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://surplus-ai.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Surplus AI: check before you buy", template: "%s · Surplus AI" },
  description:
    "Surplus AI forecasts construction surplus across township sites and tells buyers to order less. A student prototype for the Township of Tomorrow hackathon, using simulated data.",
  applicationName: "Surplus AI",
  openGraph: {
    type: "website",
    siteName: "Surplus AI",
    title: "Surplus AI: check before you buy",
    description: "Forecast construction surplus across sites before the order is placed. Student prototype with simulated data.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0f4c5c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-MY" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
