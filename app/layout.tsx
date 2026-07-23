import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
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
      "A quiet corner for notes, reflections, and thoughts worth keeping.",
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
    },
    openGraph: {
      title: "Purple Journal",
      description:
        "A quiet corner for notes, reflections, and thoughts worth keeping.",
      images: ["/og.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: "Purple Journal",
      description:
        "A quiet corner for notes, reflections, and thoughts worth keeping.",
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="site-shell">
          <SiteHeader />
          <main>{children}</main>
          <footer>
            <span>Thoughtfully kept.</span>
            <span>{new Date().getFullYear()}</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
