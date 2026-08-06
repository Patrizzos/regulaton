// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { CookieBanner } from "@/components/shared/CookieBanner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#121316",
};

export const metadata: Metadata = {
  title: "Regulaton, EU AI Act Compliance for SMBs",
  description:
    "EU AI Act compliance in 20 minutes. Generate required compliance documents, track your AI tool inventory, and stay ahead of EU regulations, without lawyers.",
  openGraph: {
    title:       "Regulaton, EU AI Act Compliance for SMBs",
    description: "Get compliant with the EU AI Act in 20 minutes. Built for small businesses.",
    type:        "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ margin: 0, fontFamily: "Inter, sans-serif" }}>
        <Providers>
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}
