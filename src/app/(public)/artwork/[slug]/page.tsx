import { cache, Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { ArtCanvasViewer } from "@/components/public/art-canvas-viewer";
import { ExhibitionQrModal } from "@/components/public/exhibition-qr-modal";
import { TiptapRenderer } from "@/components/public/tiptap-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { generateQRCodeDataUrl } from "@/lib/qr";
import { getServerBaseUrl } from "@/lib/get-base-url";
import {
  Sparkles,
  Music,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  QrCode,
  Download,
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

const getArtworkBySlug = cache(async (slug: string) => {
  return await prisma.artwork.findUnique({
    where: { slug },
    include: {
      category: true,
      events: {
        include: { event: true },
      },
      ragaLinks: {
        include: { raga: true },
      },
    },
  });
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [artwork, settings] = await Promise.all([
    getArtworkBySlug(slug),
    prisma.systemSetting.findFirst(),
  ]);
  const siteName = settings?.siteName || "SavazAI WebApps";
  const artistName = settings?.siteName || "Master Artist";

  if (!artwork) {
    return { title: `Artwork Not Found — ${siteName}` };
  }

  const materialsText = artwork.materials || artwork.medium;
  const fullMediumDesc = artwork.surface ? `${materialsText} on ${artwork.surface}` : materialsText;

  return {
    title: `${artwork.title} (${artwork.yearCreated}) — Fine Art by ${artistName}`,
    description: `${fullMediumDesc}. ${artwork.description.slice(0, 160)}...`,
    openGraph: {
      title: artwork.title,
      description: fullMediumDesc,
      images: [{ url: artwork.watermarkedWebpUrl }],
    },
  };
}

export default async function ArtworkDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const artwork = await getArtworkBySlug(slug);

  if (!artwork || !artwork.isActive || artwork.isDeleted) {
    notFound();
  }

  const baseUrl = await getServerBaseUrl();
  const settings = await prisma.systemSetting.findFirst({
    select: {
      watermarkConfig: true,
      siteName: true,
      formSecurityConfig: true,
      copyrightNoticeHeader: true,
      copyrightNoticeContent: true,
      qrGateBadgeText: true,
      qrGateHeaderTitle: true,
      qrGatePromptText: true,
      qrGateButtonLabel: true,
      qrGateAllowSkip: true,
      enableSocialShare: true,
    },
  });
  const watermarkConfig = (settings?.watermarkConfig as Record<string, unknown>) || {};
  const defaultFoilText = (watermarkConfig.defaultFoilEarmarkText as string) || "Gold Foil";
  const showFoilEarmark = watermarkConfig.showFoilEarmark !== false;
  const foilBadgeText = artwork.customFoilLabel || defaultFoilText;

  const formSecurity = (settings?.formSecurityConfig as Record<string, unknown> | null) || {};
  const qrSecurity = (formSecurity.qrScanGate as Record<string, unknown> | undefined) || {};
  const enableCaptcha = Boolean(qrSecurity.enableCaptcha);
  const enableEmailOtp = Boolean(qrSecurity.enableEmailOtp);

  const targetScanUrl = `${baseUrl}/artwork/${artwork.slug}?qr=true`;
  const qrDataUrl = await generateQRCodeDataUrl(targetScanUrl, {
    width: 480,
    margin: 2,
    color: {
      dark: "#0F0E0D",
      light: "#FFFFFF",
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      {/* Exhibition QR Scan Interactive Lead Capture */}
      <Suspense fallback={null}>
        <ExhibitionQrModal
          artworkId={artwork.id}
          artworkTitle={artwork.title}
          enableCaptcha={enableCaptcha}
          enableEmailOtp={enableEmailOtp}
          qrGateBadgeText={settings?.qrGateBadgeText || undefined}
          qrGateHeaderTitle={settings?.qrGateHeaderTitle || undefined}
          qrGatePromptText={settings?.qrGatePromptText || undefined}
          qrGateButtonLabel={settings?.qrGateButtonLabel || undefined}
          qrGateAllowSkip={settings?.qrGateAllowSkip !== false}
        />
      </Suspense>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Art Gallery
          </Link>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {artwork.category.name}
            </Badge>
            {artwork.hasGoldFoil && showFoilEarmark && (
              <Badge variant="gold" className="text-xs">
                {foilBadgeText}
              </Badge>
            )}
          </div>
        </div>

        {/* Two-Column Masterwork Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Protected Canvas Viewer */}
          <div className="lg:col-span-7 space-y-4">
            <ArtCanvasViewer
              title={artwork.title}
              watermarkedUrl={artwork.watermarkedWebpUrl}
              medium={
                (artwork.materials || artwork.medium) +
                (artwork.surface ? ` on ${artwork.surface}` : "")
              }
              dimensions={artwork.dimensions}
              hasGoldFoil={artwork.hasGoldFoil && showFoilEarmark}
              goldPurity={artwork.goldPurity || undefined}
              customFoilLabel={artwork.customFoilLabel || undefined}
              defaultFoilText={defaultFoilText}
              yearCreated={artwork.yearCreated}
              artistName={settings?.siteName || "Master Artist"}
            />

            {/* Copyright & Provenance Notice (Configurable via Admin System Settings -> General tab) */}
            {Boolean(settings?.copyrightNoticeContent !== undefined && settings?.copyrightNoticeContent !== null ? settings.copyrightNoticeContent.trim() : true) && (
              <div className="p-4 rounded-xl border border-border/80 bg-card/60 flex items-start gap-3 text-xs text-muted-foreground">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-serif font-bold text-foreground block mb-0.5">
                    {settings?.copyrightNoticeHeader?.trim() || "Archival Provenance & Copyright Notice"}
                  </span>
                  {settings?.copyrightNoticeContent !== undefined && settings?.copyrightNoticeContent !== null
                    ? settings.copyrightNoticeContent.trim()
                    : `Original hand-crafted masterwork by ${settings?.siteName || "the master artist"}. Layered on unblemished teakwood planks, gilded with certified ${artwork.customFoilLabel || artwork.goldPurity || defaultFoilText || "authentic gold foil"}, and finished with semi-precious gemstones. Unauthorized reproduction or digital harvesting is prohibited.`}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Curatorial Details & Inquiries */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
                Classical Indian Fine Art • Year {artwork.yearCreated}
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-foreground mt-1 mb-2">
                {artwork.title}
              </h1>

              {/* Price & Availability */}
              <div className="flex items-center gap-3 pt-2">
                {artwork.price ? (
                  <span className="font-mono text-xl sm:text-2xl font-bold text-primary">
                    {formatCurrency(artwork.price, artwork.currency || "INR")}
                  </span>
                ) : (
                  <span className="font-serif italic text-sm text-muted-foreground">
                    Private Collection / Price Upon Request
                  </span>
                )}
                <Badge
                  variant={artwork.isAvailable ? "gold" : "outline"}
                  className="text-xs uppercase"
                >
                  {artwork.isAvailable ? "Available for Acquisition" : "Acquired"}
                </Badge>
              </div>
            </div>

            {/* Specifications Matrix */}
            <div className="p-4 rounded-xl border border-border bg-card/50 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Materials</span>
                <span className="font-serif text-right text-foreground max-w-[220px]">
                  {artwork.materials || artwork.medium}
                </span>
              </div>
              {artwork.surface && artwork.surface.trim() !== "" && (
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Surface</span>
                  <span className="font-serif text-right text-foreground max-w-[220px]">
                    {artwork.surface}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground font-medium">Dimensions</span>
                <span className="font-mono text-foreground">{artwork.dimensions}</span>
              </div>
              {artwork.goldPurity && (
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Gold Purity</span>
                  <span className="font-serif text-primary font-semibold">{artwork.goldPurity}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground font-medium">Traditional School</span>
                <span className="font-serif text-foreground">{artwork.category.name}</span>
              </div>
            </div>

            {/* Artistic Commentary & Iconography */}
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-sm text-foreground uppercase tracking-wider">
                Iconographic Commentary &amp; Symbolism
              </h3>
              <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                <TiptapRenderer content={artwork.description} />
              </div>
            </div>

            {/* Carnatic Musical Synesthesia Card */}
            {artwork.ragaLinks && artwork.ragaLinks.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="flex items-center gap-2 text-primary font-serif font-bold text-sm">
                  <Music className="w-4 h-4" />
                  Carnatic Synesthesia Connection
                </div>
                {artwork.ragaLinks.map((link) => (
                  <div key={link.ragaId} className="text-xs space-y-1 text-muted-foreground">
                    <span className="font-serif font-semibold text-foreground">
                      Raga {link.raga.name}
                    </span>
                    {link.raga.rasa && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        Rasa: {link.raga.rasa}
                      </Badge>
                    )}
                    <p className="italic text-[11px]">
                      &quot;{link.harmonyNote || "Visual depiction harmonizes with the contemplative mood of this raga."}&quot;
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Exhibited At Events */}
            {artwork.events && artwork.events.length > 0 && (
              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1 text-xs">
                <span className="text-[10px] uppercase font-mono text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary" />
                  Exhibition Provenance:
                </span>
                {artwork.events.map((ae) => (
                  <Link
                    key={ae.eventId}
                    href={`/events/${ae.event.slug}`}
                    className="block font-serif font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    • {ae.event.title} ({ae.event.city})
                  </Link>
                ))}
              </div>
            )}

            {/* Exhibition Floor QR Code Card */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-card/60 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${artwork.title}`}
                  className="w-16 h-16 rounded-md border border-border bg-white p-1 shrink-0 shadow-xs"
                />
                <div className="space-y-0.5">
                  <span className="font-serif font-bold text-xs text-foreground flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-primary" />
                    Exhibition Placard QR
                  </span>
                  <p className="text-[10px] text-muted-foreground leading-tight max-w-[200px]">
                    Scan in physical gallery or exhibition floor for curatorial provenance.
                  </p>
                </div>
              </div>
              <a
                href={qrDataUrl}
                download={`placard-qr-${artwork.slug}.png`}
                title="Download High-Res Printable QR Code"
              >
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1 cursor-pointer">
                  <Download className="w-3.5 h-3.5" />
                  Print QR
                </Button>
              </a>
            </div>

            {/* Action Button: Acquisition Inquiries */}
            <div className="pt-2 space-y-4">
              <Link href="/commission" className="block w-full">
                <Button variant="gold" className="w-full font-serif font-bold gap-2 cursor-pointer h-11 text-sm shadow-md">
                  <Sparkles className="w-4 h-4" />
                  Inquire for Acquisition
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
