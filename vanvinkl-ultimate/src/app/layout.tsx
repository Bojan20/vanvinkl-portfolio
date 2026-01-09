import type { Metadata } from "next";
import { Syne, Space_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { NoiseOverlay } from "@/components/ui/NoiseOverlay";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VanVinkl | Sound Wizard — Audio Production & Sound Design",
  description:
    "I'm your friendly sound wizard. Turning sounds into vibrant conversations. Professional audio production, sound design, and mixing services.",
  keywords: [
    "sound design",
    "audio production",
    "mixing",
    "mastering",
    "game audio",
    "film scoring",
    "sound wizard",
  ],
  authors: [{ name: "VanVinkl" }],
  openGraph: {
    title: "VanVinkl | Sound Wizard",
    description: "Turning sounds into vibrant conversations",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="lenis">
      <body className={`${syne.variable} ${spaceMono.variable} antialiased`}>
        <SmoothScroll>
          <CustomCursor />
          <NoiseOverlay />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
