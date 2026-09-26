import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RoomProvider } from "@/components/room-provider";
import SiteHeader from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kinoo — watch YouTube together, in sync",
  description:
    "Create a room, share the link, and watch the same YouTube video in perfect sync with live chat. No sign-up.",
  openGraph: {
    title: "Kinoo — watch YouTube together, in sync",
    description:
      "Create a room, share the link, and watch the same YouTube video in perfect sync with live chat.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <RoomProvider>
          <SiteHeader />
          {children}
        </RoomProvider>
      </body>
    </html>
  );
}
