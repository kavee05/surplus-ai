import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
// Mono is used for figures; not preloaded so it does not compete with the headline and body fonts.
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap", preload: false });
const display = Instrument_Serif({ variable: "--font-instrument-serif", subsets: ["latin"], weight: "400", display: "swap" });

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
    <html lang="en-MY" className={`${geist.variable} ${geistMono.variable} ${display.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
