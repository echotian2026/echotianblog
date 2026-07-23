import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "Echo Tian Blog",
    template: "%s_echo_tian",
  },
  description: "Personal journal, thoughts, and essays by Echo Tian.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "Echo Tian Blog",
    description: "Personal journal, thoughts, and essays by Echo Tian.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Echo Tian Blog",
    description: "Personal journal, thoughts, and essays by Echo Tian.",
  },
};

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
