import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { MottoFooter } from "./components/MottoFooter";
import { SiteHeader } from "./components/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ||
    (host?.includes("localhost") ? "http" : "https");
  const metadataBase = new URL(
    host ? `${protocol}://${host}` : "http://localhost:3000"
  );

  return {
    metadataBase,
    title: {
      default: "Purple Journal",
      template: "%s · Purple Journal",
    },
    description:
      "一些我在生活中看过、想过、做过，且想表达的东西。",
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
    },
    openGraph: {
      title: "Echo",
      description:
        "一些我在生活中看过、想过、做过，且想表达的东西。",
    },
    twitter: {
      card: "summary_large_image",
      title: "Echo",
      description:
        "一些我在生活中看过、想过、做过，且想表达的东西。",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="site-shell">
          <SiteHeader />
          <main>{children}</main>
          <MottoFooter />
        </div>
      </body>
    </html>
  );
}
