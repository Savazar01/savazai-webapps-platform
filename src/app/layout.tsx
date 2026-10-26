import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { DynamicThemeProvider } from "@/components/dynamic-theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { VisitorTelemetryTracker } from "@/lib/analytics-tracker";
import prisma from "@/lib/prisma";
import { getServerBaseUrl } from "@/lib/get-base-url";
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
  const isBuilding =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.BUILDING === "1";

  const settings = isBuilding
    ? null
    : await prisma.systemSetting.findFirst().catch(() => null);
  const title = settings?.siteName || process.env.NEXT_PUBLIC_APP_NAME || "SavazAI WebApps Platform";
  const description =
    settings?.siteDescription ||
    "Enterprise multi-tenant digital atelier, spatial exhibition corridor, and museum publishing system.";

  const baseUrl = await getServerBaseUrl();
  const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://savazar.com";

  return {
    metadataBase: new URL(appUrl),
    title,
    description,
    icons: settings?.faviconUrl ? [{ rel: "icon", url: settings.faviconUrl }] : undefined,
    openGraph: {
      title,
      description,
      siteName: title,
      images: settings?.logoUrl ? [{ url: settings.logoUrl }] : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <DynamicThemeProvider />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300"
      >
        <ThemeProvider>
          <VisitorTelemetryTracker />
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
