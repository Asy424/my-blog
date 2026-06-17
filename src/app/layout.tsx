import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import { siteConfig } from "@/site.config";
import "./globals.css";

const analyticsSrc = process.env.NEXT_PUBLIC_UMAMI_SRC;
const analyticsWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: {
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
      locale: "zh_CN",
      type: "website",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.name,
      description: siteConfig.description,
      images: ["/opengraph-image"],
    },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={siteConfig.language} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        {analyticsSrc && analyticsWebsiteId && (
          <Script
            src={analyticsSrc}
            data-website-id={analyticsWebsiteId}
            strategy="lazyOnload"
          />
        )}
      </body>
    </html>
  );
}
