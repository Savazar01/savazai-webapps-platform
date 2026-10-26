"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, ExternalLink, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProtectedImage } from "@/components/public/protected-image";
import { SocialShareBar } from "@/components/public/social-share-bar";
import dynamic from "next/dynamic";

const KenBurnsCanvas = dynamic(
  () =>
    import("./gallery-3d/ken-burns-canvas").then((mod) => mod.KenBurnsCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[450px] flex items-center justify-center rounded-2xl bg-neutral-900/40 border border-amber-500/20 text-amber-300 text-sm font-serif">
        Loading Archival Motion...
      </div>
    ),
  }
);

const ExhibitionWallBlock = dynamic(
  () =>
    import("./gallery-exhibition-wall/exhibition-wall-block").then(
      (mod) => mod.ExhibitionWallBlock
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[560px] flex items-center justify-center rounded-2xl bg-stone-950 border border-amber-500/20 text-amber-300 text-sm font-serif">
        Constructing Architectural Exhibition Wall...
      </div>
    ),
  }
);

export interface ArtworkMetadata {
  id?: string;
  title?: string;
  slug?: string;
  medium?: string;
  dimensions?: string;
  yearCreated?: number | string;
  traditionalSchool?: string;
  description?: string;
  category?: { name: string };
  primaryImageUrl?: string;
  watermarkedWebpUrl?: string;
}

export interface MediaGalleryItem {
  id: string;
  url: string;
  alt?: string;
  title?: string;
  caption?: string;
  artworkId?: string;       // Linked Artwork Record ID
  slug?: string;
  medium?: string;          // Materials used (e.g. 22k Gold Foil, Teakwood, Gemstones)
  dimensions?: string;      // Dimensions (e.g. 24 x 36 inches / 61 x 91.4 cm)
  year?: string;
  traditionalSchool?: string;
  altText?: string;
  description?: string;
  linkType?: "none" | "artwork" | "category" | "custom";
  linkTarget?: string; // slug for artwork/category, or full url
  artwork?: ArtworkMetadata;
}

export type MediaGalleryDisplayMode =
  | "carousel"
  | "scroll"
  | "collage"
  | "ken-burns"
  | "soft-crossfade"
  | "filmstrip"
  | "exhibition-wall";

import type { ExhibitionWallConfig } from "./gallery-exhibition-wall/exhibition-wall-block";

export interface MediaGalleryBlockProps {
  items?: MediaGalleryItem[];
  displayMode?: MediaGalleryDisplayMode;
  autoplayTimer?: number; // in seconds (2 to 10)
  aspectRatio?: "landscape" | "portrait" | "square" | "natural";
  frameStyle?: "heritage" | "minimal" | "floating" | "none";
  kenBurnsOverlayTheme?: "dark-velvet" | "parchment-gold" | "minimal-subtle";
  overlayTitleColor?: string;
  overlayTextColor?: string;
  className?: string;
  canvasBgColor?: string;
  canvasBgImageUrl?: string;
  canvasBgMode?: "cover" | "contain" | "tile" | "blur";
  canvasBgOpacity?: number;
  borderFilletColor?: string;
  borderWidth?: number;
  framePadding?: number;
  showCaptionRibbon?: boolean;
  environmentId?: string;
  culturalEnvironment?: string;
  customWallUrl?: string;
  customWallBackdropUrl?: string;
  wallBackgroundMode?: "uniform" | "per-wall";
  wallCustomBackgrounds?: string[];
  wallEnvironments?: string[];
  wallConfigs?: ExhibitionWallConfig[];
  cameraTourStyle?: "overview" | "drone" | "walkthrough" | "inspection";
  cameraTransitionStyle?: "pan-zoom" | "dolly" | "crossfade" | "cinematic-arc";
  wallLayout?: "salon" | "linear" | "grid";
  autoplayTour?: boolean;
  overviewDwellSeconds?: number;
  showExhibitionBadge?: boolean;
  maxArtworksPerWall?: number;
  showMetadataCardBelowWall?: boolean;
  showFrameHeader?: boolean;
  frameHeaderBg?: string;
  frameHeaderTextColor?: string;
}

// Helper to resolve item link
function getItemHref(item: MediaGalleryItem): string | null {
  if (!item.linkType || item.linkType === "none" || !item.linkTarget) return null;
  if (item.linkType === "artwork") {
    return item.linkTarget.startsWith("/") ? item.linkTarget : `/artwork/${item.linkTarget}`;
  }
  if (item.linkType === "category") {
    return item.linkTarget.startsWith("/") ? item.linkTarget : `/gallery/${item.linkTarget}`;
  }
  return item.linkTarget;
}

// Wrapper component to conditionally render Link or div
function ItemLinkWrapper({
  item,
  children,
  className = "",
}: {
  item: MediaGalleryItem;
  children: React.ReactNode;
  className?: string;
}) {
  const href = getItemHref(item);
  if (!href) return <div className={className}>{children}</div>;

  const isExternal = href.startsWith("http://") || href.startsWith("https://");
  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={cn("group block relative cursor-pointer", className)}
    >
      {children}
    </Link>
  );
}

/**
 * Computes responsive grid spans and heights for Curated Bento Collage
 * dynamically supporting 1 to 12 items without awkward whitespace or truncation.
 */
export function getBentoItemClass(index: number, total: number): string {
  if (total <= 1) {
    return "col-span-12 h-[380px] sm:h-[480px]";
  }
  if (total === 2) {
    return "col-span-12 sm:col-span-6 h-[300px] sm:h-[400px]";
  }
  if (total === 3) {
    return index === 0
      ? "col-span-12 md:col-span-8 md:row-span-2 h-[340px] sm:h-[440px]"
      : "col-span-12 sm:col-span-6 md:col-span-4 h-[165px] sm:h-[212px]";
  }
  if (total === 4) {
    return index === 0 || index === 3
      ? "col-span-12 md:col-span-7 h-[260px] sm:h-[320px]"
      : "col-span-12 md:col-span-5 h-[260px] sm:h-[320px]";
  }
  if (total === 5) {
    if (index === 0) return "col-span-12 md:col-span-7 md:row-span-2 h-[380px] sm:h-[460px]";
    if (index === 1 || index === 2) return "col-span-12 sm:col-span-6 md:col-span-5 h-[180px] sm:h-[222px]";
    return "col-span-12 sm:col-span-6 md:col-span-6 h-[220px] sm:h-[280px]";
  }
  if (total === 6) {
    if (index === 0) return "col-span-12 md:col-span-8 md:row-span-2 h-[380px] sm:h-[460px]";
    if (index === 1 || index === 2) return "col-span-12 sm:col-span-6 md:col-span-4 h-[180px] sm:h-[222px]";
    return "col-span-12 sm:col-span-4 md:col-span-4 h-[200px] sm:h-[240px]";
  }
  if (total === 7) {
    if (index === 0) return "col-span-12 md:col-span-8 md:row-span-2 h-[380px] sm:h-[460px]";
    if (index === 1 || index === 2) return "col-span-12 sm:col-span-6 md:col-span-4 h-[180px] sm:h-[222px]";
    return "col-span-12 sm:col-span-6 md:col-span-6 h-[220px] sm:h-[260px]";
  }
  if (total === 8) {
    if (index === 0) return "col-span-12 md:col-span-8 md:row-span-2 h-[380px] sm:h-[460px]";
    if (index === 1 || index === 2) return "col-span-12 sm:col-span-6 md:col-span-4 h-[180px] sm:h-[222px]";
    if (index >= 3 && index <= 5) return "col-span-12 sm:col-span-4 md:col-span-4 h-[190px] sm:h-[230px]";
    return "col-span-12 sm:col-span-6 md:col-span-6 h-[210px] sm:h-[250px]";
  }
  if (total === 9) {
    if (index === 0) return "col-span-12 md:col-span-8 md:row-span-2 h-[380px] sm:h-[460px]";
    if (index === 1 || index === 2) return "col-span-12 sm:col-span-6 md:col-span-4 h-[180px] sm:h-[222px]";
    return "col-span-12 sm:col-span-4 md:col-span-4 h-[190px] sm:h-[230px]";
  }
  if (total === 10) {
    if (index === 0 || index === 1) return "col-span-12 sm:col-span-6 md:col-span-6 h-[260px] sm:h-[340px]";
    return "col-span-12 sm:col-span-6 md:col-span-3 h-[180px] sm:h-[220px]";
  }
  if (total === 11) {
    if (index === 0) return "col-span-12 md:col-span-8 md:row-span-2 h-[380px] sm:h-[460px]";
    if (index === 1 || index === 2) return "col-span-12 sm:col-span-6 md:col-span-4 h-[180px] sm:h-[222px]";
    return "col-span-12 sm:col-span-6 md:col-span-3 h-[180px] sm:h-[220px]";
  }
  // 12 or more items
  if (index === 0) return "col-span-12 md:col-span-8 md:row-span-2 h-[380px] sm:h-[460px]";
  if (index === 1 || index === 2) return "col-span-12 sm:col-span-6 md:col-span-4 h-[180px] sm:h-[222px]";
  if (index === 3 || index === 4 || index === 5) return "col-span-12 sm:col-span-4 md:col-span-4 h-[200px] sm:h-[240px]";
  if (index === 6 || index === 7) return "col-span-12 sm:col-span-6 md:col-span-6 h-[220px] sm:h-[270px]";
  return "col-span-12 sm:col-span-6 md:col-span-3 h-[180px] sm:h-[220px]";
}

export function ArtworkPlacard({
  item,
  className = "",
  overlayTitleColor,
  overlayTextColor,
  alwaysLight = false,
}: {
  item?: MediaGalleryItem;
  className?: string;
  overlayTitleColor?: string;
  overlayTextColor?: string;
  alwaysLight?: boolean;
}) {
  if (!item) return null;
  const hasMetadata =
    Boolean(item.title) ||
    Boolean(item.medium) ||
    Boolean(item.traditionalSchool) ||
    Boolean(item.dimensions) ||
    Boolean(item.description) ||
    Boolean(item.caption);

  if (!hasMetadata) return null;

  const schoolMedium = [item.traditionalSchool, item.medium].filter(Boolean).join(" • ");
  const href = getItemHref(item);

  return (
    <div
      className={cn(
        "mt-4 p-4 rounded-xl border shadow-xs text-left transition-colors",
        alwaysLight
          ? "border-stone-200/90 bg-white text-stone-900 isolate [color-scheme:light]"
          : "border-border bg-card text-card-foreground",
        className
      )}
      style={alwaysLight ? { backgroundColor: "#FFFFFF", color: "#111827" } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h4
            className={cn(
              "font-serif text-base font-bold tracking-wide",
              alwaysLight ? "text-stone-950" : "text-foreground"
            )}
            style={{ color: overlayTitleColor || (alwaysLight ? "#111827" : undefined) }}
          >
            {item.title || "Curated Masterwork"}
          </h4>
          {schoolMedium && (
            <p
              className={cn(
                "text-xs font-serif font-medium",
                alwaysLight ? "text-amber-800" : "text-amber-700 dark:text-amber-400"
              )}
            >
              {schoolMedium}
            </p>
          )}
          {item.dimensions && (
            <p
              className={cn(
                "text-[11px] font-mono",
                alwaysLight ? "text-stone-600" : "text-muted-foreground"
              )}
            >
              {item.dimensions}
            </p>
          )}
          {(item.description || item.caption) && (
            <p
              className={cn(
                "text-xs font-serif mt-2 leading-relaxed",
                alwaysLight ? "text-stone-700" : "text-foreground/80"
              )}
              style={{ color: overlayTextColor || (alwaysLight ? "#374151" : undefined) }}
            >
              {item.description || item.caption}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SocialShareBar
            title={item.title || "Curated Masterwork"}
            description={schoolMedium || item.description || item.caption}
            url={href || undefined}
            mediaUrl={item.url}
            entityLabel="Gallery Plate"
            variant="minimal"
          />
          {href && (
            <Link
              href={href}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif font-semibold shrink-0 transition-colors cursor-pointer",
                alwaysLight
                  ? "bg-stone-900 text-white hover:bg-stone-800 shadow-xs"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
            >
              <span>View Work</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function MediaGalleryBlock({
  items = [],
  displayMode = "carousel",
  autoplayTimer = 5,
  aspectRatio = "landscape",
  frameStyle = "heritage",
  kenBurnsOverlayTheme = "dark-velvet",
  overlayTitleColor,
  overlayTextColor,
  className = "",
  canvasBgColor,
  canvasBgImageUrl,
  canvasBgMode = "cover",
  canvasBgOpacity = 85,
  borderFilletColor = "#D4AF37",
  borderWidth = 0,
  framePadding = 0,
  showCaptionRibbon = false,
  environmentId = "london-school-arts",
  culturalEnvironment,
  customWallUrl,
  customWallBackdropUrl,
  wallBackgroundMode = "uniform",
  wallCustomBackgrounds = [],
  wallEnvironments = [],
  wallConfigs = [],
  cameraTourStyle = "drone",
  cameraTransitionStyle = "pan-zoom",
  wallLayout = "salon",
  autoplayTour = true,
  overviewDwellSeconds = 4,
  showExhibitionBadge = true,
  maxArtworksPerWall = 4,
  showMetadataCardBelowWall = true,
  showFrameHeader = false,
  frameHeaderBg = "",
  frameHeaderTextColor = "",
}: MediaGalleryBlockProps) {
  // Filter out empty items
  const validItems = React.useMemo(() => {
    return (items || []).filter((item) => item && typeof item.url === "string" && item.url.trim() !== "");
  }, [items]);

  // Carousel state
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  // Scroll container ref for Horizontal Scroll & Filmstrip modes
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-advance Carousel and Soft Crossfade
  React.useEffect(() => {
    if (
      (displayMode !== "carousel" && displayMode !== "soft-crossfade") ||
      validItems.length <= 1 ||
      isPaused
    )
      return;

    const intervalMs = Math.max(2, Math.min(10, autoplayTimer || 5)) * 1000;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validItems.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [displayMode, validItems.length, autoplayTimer, isPaused]);

  // Handle manual carousel navigation
  const prevSlide = React.useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + validItems.length) % validItems.length);
  }, [validItems.length]);

  const nextSlide = React.useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % validItems.length);
  }, [validItems.length]);

  // Scroll buttons for Horizontal Scroll & Filmstrip
  const scrollTrack = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const offset = direction === "left" ? -400 : 400;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  // Frame styling
  const frameClasses = React.useMemo(() => {
    switch (frameStyle) {
      case "heritage":
        return "border-2 border-[#D4AF37]/50 shadow-[0_4px_24px_rgba(212,175,55,0.18)] rounded-xl overflow-hidden";
      case "minimal":
        return "border border-border/70 shadow-md rounded-xl overflow-hidden";
      case "floating":
        return "shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10";
      case "none":
      default:
        return "rounded-lg overflow-hidden";
    }
  }, [frameStyle]);

  // Aspect ratio styling
  const aspectClass = React.useMemo(() => {
    switch (aspectRatio) {
      case "landscape":
        return "aspect-[16/10]";
      case "portrait":
        return "aspect-[3/4]";
      case "square":
        return "aspect-square";
      case "natural":
      default:
        return "h-[420px]";
    }
  }, [aspectRatio]);

  // Render fallback if no items
  if (validItems.length === 0) {
    return (
      <div className="w-full rounded-xl border border-dashed border-border/80 bg-card/40 p-8 text-center space-y-2">
        <ImageIcon className="w-8 h-8 text-muted-foreground/60 mx-auto" />
        <p className="font-serif text-sm font-semibold text-foreground">
          Media Gallery Empty
        </p>
        <p className="text-xs text-muted-foreground">
          Configure images, captions, and links in the builder inspector.
        </p>
      </div>
    );
  }

  /* -------------------------------------------------------------
   * MODE: ARCHITECTURAL 3D EXHIBITION SALON WALL
   * ----------------------------------------------------------- */
  if (displayMode === "exhibition-wall") {
    return (
      <ExhibitionWallBlock
        items={validItems}
        environmentId={environmentId}
        culturalEnvironment={culturalEnvironment}
        customWallUrl={customWallUrl}
        customWallBackdropUrl={customWallBackdropUrl}
        wallBackgroundMode={wallBackgroundMode}
        wallCustomBackgrounds={wallCustomBackgrounds}
        wallEnvironments={wallEnvironments}
        wallConfigs={wallConfigs}
        cameraTourStyle={cameraTourStyle}
        cameraTransitionStyle={cameraTransitionStyle}
        wallLayout={wallLayout}
        autoplayTour={autoplayTour}
        tourSpeedSeconds={autoplayTimer}
        overviewDwellSeconds={overviewDwellSeconds}
        showExhibitionBadge={showExhibitionBadge}
        maxArtworksPerWall={maxArtworksPerWall}
        showMetadataCardBelowWall={showMetadataCardBelowWall}
        className={className}
      />
    );
  }

  /* -------------------------------------------------------------
   * CINEMA KEN BURNS MODE
   * ----------------------------------------------------------- */
  if (displayMode === "ken-burns") {
    return (
      <KenBurnsCanvas
        items={validItems}
        autoplayTimer={autoplayTimer}
        aspectRatio={aspectRatio}
        frameStyle={frameStyle}
        kenBurnsOverlayTheme={kenBurnsOverlayTheme}
        overlayTitleColor={overlayTitleColor}
        overlayTextColor={overlayTextColor}
        className={className}
        canvasBgColor={canvasBgColor}
        canvasBgImageUrl={canvasBgImageUrl}
        canvasBgMode={canvasBgMode}
        canvasBgOpacity={canvasBgOpacity}
        borderFilletColor={borderFilletColor}
        borderWidth={borderWidth}
        framePadding={framePadding}
        showCaptionRibbon={showCaptionRibbon}
      />
    );
  }

  /* -------------------------------------------------------------
   * MODE: SOFT CROSSFADE & SLOW ZOOM
   * ----------------------------------------------------------- */
  if (displayMode === "soft-crossfade") {
    const activeItem = validItems[currentIndex] || validItems[0];

    return (
      <div
        className={cn("relative w-full select-none group/crossfade", className)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Outer Matting & Border Frame Container */}
        <div
          className={cn(
            "relative w-full rounded-2xl overflow-hidden transition-all duration-300 shadow-2xl",
            frameStyle === "heritage" && "ring-1 ring-amber-500/30 shadow-[0_8px_32px_rgba(212,175,55,0.15)]",
            frameStyle === "floating" && "shadow-2xl ring-1 ring-black/10 dark:ring-white/10",
            frameStyle === "minimal" && "border border-border/80"
          )}
          style={{
            backgroundColor: canvasBgColor || "transparent",
            backgroundImage: canvasBgImageUrl ? `url("${canvasBgImageUrl}")` : undefined,
            backgroundSize: canvasBgMode === "contain" ? "contain" : canvasBgMode === "tile" ? "auto" : "cover",
            backgroundRepeat: canvasBgMode === "tile" ? "repeat" : "no-repeat",
            backgroundPosition: "center",
            padding: framePadding ? `${framePadding}px` : undefined,
            border: borderWidth > 0 ? `${borderWidth}px solid ${borderFilletColor}` : undefined,
          }}
        >
          <div className={cn("relative w-full overflow-hidden bg-stone-950 rounded-xl", aspectClass)}>
            {validItems.map((item, idx) => (
              <div
                key={item.id || idx}
                className={cn(
                  "absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out",
                  idx === currentIndex ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
                )}
              >
                <ItemLinkWrapper item={item} className="w-full h-full relative block flex items-center justify-center p-2 sm:p-4">
                  <ProtectedImage
                    src={item.url}
                    alt={item.alt || item.title || "Gallery image"}
                    useImg={true}
                    className={cn(
                      "max-w-full max-h-full w-auto h-auto object-contain drop-shadow-xl select-none transition-transform duration-7000 ease-out",
                      idx === currentIndex ? "scale-105" : "scale-100"
                    )}
                    wrapperClassName="w-full h-full flex items-center justify-center"
                  />
                </ItemLinkWrapper>
              </div>
            ))}

            {/* Prev / Next Controls (Appear on subtle hover) */}
            {validItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevSlide();
                  }}
                  aria-label="Previous Slide"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-25 w-9 h-9 rounded-full bg-stone-950/70 hover:bg-stone-900 border border-amber-500/40 text-amber-300 flex items-center justify-center transition-all opacity-0 group-hover/crossfade:opacity-100 shadow-md cursor-pointer hover:scale-105"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextSlide();
                  }}
                  aria-label="Next Slide"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-25 w-9 h-9 rounded-full bg-stone-950/70 hover:bg-stone-900 border border-amber-500/40 text-amber-300 flex items-center justify-center transition-all opacity-0 group-hover/crossfade:opacity-100 shadow-md cursor-pointer hover:scale-105"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Dots Indicator */}
            {validItems.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-stone-950/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 opacity-70 group-hover/crossfade:opacity-100 transition-opacity">
                {validItems.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                      currentIndex === idx ? "w-5 bg-amber-400" : "w-1.5 bg-stone-400/60 hover:bg-stone-200"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Artwork Placard Card (Underneath Visual Canvas) */}
        <ArtworkPlacard
          item={activeItem}
          overlayTitleColor={overlayTitleColor}
          overlayTextColor={overlayTextColor}
        />
      </div>
    );
  }

  /* -------------------------------------------------------------
   * MODE: ARCHIVAL FILMSTRIP REEL
   * ----------------------------------------------------------- */
  if (displayMode === "filmstrip") {
    return (
      <div className={cn("relative w-full space-y-3 group/filmstrip", className)}>
        {/* Header Bar */}
        <div className="flex items-center justify-between px-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Archival Filmstrip Reel • {validItems.length} Masterworks
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollTrack("left")}
              aria-label="Scroll left"
              className="w-8 h-8 rounded-full bg-card hover:bg-accent border border-border text-foreground flex items-center justify-center transition-all shadow-xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollTrack("right")}
              aria-label="Scroll right"
              className="w-8 h-8 rounded-full bg-card hover:bg-accent border border-border text-foreground flex items-center justify-center transition-all shadow-xs cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filmstrip Track */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-5 overflow-x-auto scroll-smooth py-3 px-2 scrollbar-none bg-stone-950/10 dark:bg-stone-950/40 rounded-2xl border border-amber-500/20 p-3"
          style={{
            scrollbarWidth: "none",
            backgroundColor: canvasBgColor || undefined,
            backgroundImage: canvasBgImageUrl ? `url("${canvasBgImageUrl}")` : undefined,
            backgroundSize: canvasBgMode === "contain" ? "contain" : canvasBgMode === "tile" ? "auto" : "cover",
            backgroundRepeat: canvasBgMode === "tile" ? "repeat" : "no-repeat",
            backgroundPosition: "center",
          }}
        >
          {validItems.map((item, idx) => {
            const isLinked = !!getItemHref(item);
            return (
              <div
                key={item.id || idx}
                className={cn(
                  "shrink-0 w-[300px] sm:w-[340px] md:w-[380px] flex flex-col justify-between group rounded-xl overflow-hidden border-2 border-amber-500/40 dark:border-amber-400/30 bg-card shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]",
                  frameClasses
                )}
              >
                <ItemLinkWrapper item={item} className="h-full flex flex-col">
                  {/* Top Film Sprocket / Index Header (Optional) */}
                  {showFrameHeader && (
                    <div
                      className="px-3 py-1.5 text-[10px] font-mono flex items-center justify-between border-b border-white/10"
                      style={{
                        backgroundColor: frameHeaderBg || "#1c1917",
                        color: frameHeaderTextColor || "#f5f5f4",
                      }}
                    >
                      <span className="font-bold">FRAME #{String(idx + 1).padStart(2, "0")}</span>
                      <span>ARCHIVAL 35MM</span>
                    </div>
                  )}

                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-950 flex items-center justify-center">
                    <ProtectedImage
                      src={item.url}
                      alt={item.alt || item.title || `Filmstrip Item ${idx + 1}`}
                      useImg={true}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      wrapperClassName="w-full h-full"
                    />
                    {isLinked && (
                      <div className="absolute top-2.5 right-2.5 bg-stone-950/70 backdrop-blur-md p-1.5 rounded-full text-amber-300 opacity-90 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {(item.title || item.medium || item.traditionalSchool || item.dimensions || item.caption || item.description) && (
                    <div className="p-3.5 bg-card border-t border-border/60 flex-1 flex flex-col justify-center text-left">
                      {item.title && (
                        <h4 className="font-serif font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                      )}
                      {(item.medium || item.traditionalSchool) && (
                        <p className="text-[11px] font-serif text-amber-950/80 dark:text-amber-300/80 mt-0.5 line-clamp-1">
                          {[item.traditionalSchool, item.medium].filter(Boolean).join(" • ")}
                        </p>
                      )}
                      {item.dimensions && (
                        <p className="text-[10px] font-mono text-slate-500 dark:text-stone-400 mt-0.5">
                          {item.dimensions}
                        </p>
                      )}
                      {(item.description || item.caption) && (
                        <p className="text-xs text-muted-foreground leading-snug line-clamp-2 mt-1">
                          {item.description || item.caption}
                        </p>
                      )}
                    </div>
                  )}
                </ItemLinkWrapper>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------
   * MODE A: AUTO-PLAYING CAROUSEL
   * ----------------------------------------------------------- */
  if (displayMode === "carousel") {
    const activeItem = validItems[currentIndex] || validItems[0];

    return (
      <div
        className={cn("relative w-full select-none group/carousel", className)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Outer Matting & Border Frame Container */}
        <div
          className={cn(
            "relative w-full rounded-2xl overflow-hidden transition-all duration-300 shadow-2xl",
            frameStyle === "heritage" && "ring-1 ring-amber-500/30 shadow-[0_8px_32px_rgba(212,175,55,0.15)]",
            frameStyle === "floating" && "shadow-2xl ring-1 ring-black/10 dark:ring-white/10",
            frameStyle === "minimal" && "border border-border/80"
          )}
          style={{
            backgroundColor: canvasBgColor || "transparent",
            backgroundImage: canvasBgImageUrl ? `url("${canvasBgImageUrl}")` : undefined,
            backgroundSize: canvasBgMode === "contain" ? "contain" : canvasBgMode === "tile" ? "auto" : "cover",
            backgroundRepeat: canvasBgMode === "tile" ? "repeat" : "no-repeat",
            backgroundPosition: "center",
            padding: framePadding ? `${framePadding}px` : undefined,
            border: borderWidth > 0 ? `${borderWidth}px solid ${borderFilletColor}` : undefined,
          }}
        >
          <div className={cn("relative w-full overflow-hidden bg-stone-950/40 rounded-xl", aspectClass)}>
            <ItemLinkWrapper item={activeItem} className="w-full h-full relative block flex items-center justify-center p-2 sm:p-4">
              <ProtectedImage
                src={activeItem.url}
                alt={activeItem.alt || activeItem.title || "Gallery image"}
                useImg={true}
                className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-xl select-none transition-transform duration-700 group-hover:scale-105"
                wrapperClassName="w-full h-full flex items-center justify-center"
              />
            </ItemLinkWrapper>

            {/* Previous / Next Controls */}
            {validItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevSlide();
                  }}
                  aria-label="Previous Slide"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-stone-950/70 hover:bg-stone-900 border border-amber-500/40 text-amber-300 flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 shadow-md cursor-pointer hover:scale-105"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextSlide();
                  }}
                  aria-label="Next Slide"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-stone-950/70 hover:bg-stone-900 border border-amber-500/40 text-amber-300 flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 shadow-md cursor-pointer hover:scale-105"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Dots Indicator Bar */}
            {validItems.length > 1 && (
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-stone-950/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 opacity-70 group-hover/carousel:opacity-100 transition-opacity">
                {validItems.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                      currentIndex === idx
                        ? "w-5 bg-amber-400"
                        : "w-1.5 bg-stone-400/60 hover:bg-stone-200"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Artwork Placard Card (Underneath Visual Canvas) */}
        <ArtworkPlacard
          item={activeItem}
          overlayTitleColor={overlayTitleColor}
          overlayTextColor={overlayTextColor}
        />
      </div>
    );
  }

  /* -------------------------------------------------------------
   * MODE B: SMOOTH HORIZONTAL SCROLL
   * ----------------------------------------------------------- */
  if (displayMode === "scroll") {
    return (
      <div className={cn("relative w-full space-y-3 group/scroll", className)}>
        {/* Navigation Arrows for Track */}
        <div className="flex items-center justify-between px-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            Atelier Gallery Stream ({validItems.length})
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollTrack("left")}
              aria-label="Scroll left"
              className="w-7 h-7 rounded-full bg-card hover:bg-accent border border-border text-foreground flex items-center justify-center transition-all shadow-xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollTrack("right")}
              aria-label="Scroll right"
              className="w-7 h-7 rounded-full bg-card hover:bg-accent border border-border text-foreground flex items-center justify-center transition-all shadow-xs cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Track */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 px-1 scrollbar-none rounded-2xl"
          style={{
            scrollbarWidth: "none",
            backgroundColor: canvasBgColor || undefined,
            backgroundImage: canvasBgImageUrl ? `url("${canvasBgImageUrl}")` : undefined,
            backgroundSize: canvasBgMode === "contain" ? "contain" : canvasBgMode === "tile" ? "auto" : "cover",
            backgroundRepeat: canvasBgMode === "tile" ? "repeat" : "no-repeat",
            backgroundPosition: "center",
            padding: framePadding ? `${framePadding}px` : undefined,
            border: borderWidth > 0 ? `${borderWidth}px solid ${borderFilletColor}` : undefined,
          }}
        >
          {validItems.map((item, idx) => {
            const isLinked = !!getItemHref(item);
            return (
              <div
                key={item.id || idx}
                className={cn(
                  "snap-start shrink-0 w-[280px] sm:w-[320px] md:w-[360px] flex flex-col justify-between group",
                  frameClasses
                )}
              >
                <ItemLinkWrapper item={item} className="h-full flex flex-col">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-950/40">
                    <ProtectedImage
                      src={item.url}
                      alt={item.alt || item.title || `Gallery Item ${idx + 1}`}
                      useImg={true}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      wrapperClassName="w-full h-full"
                    />
                    {isLinked && (
                      <div className="absolute top-2.5 right-2.5 bg-stone-950/70 backdrop-blur-md p-1.5 rounded-full text-amber-300 opacity-90 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  {(item.title || item.caption) && (
                    <div className="p-3.5 bg-card border-t border-border/60 flex-1 flex flex-col justify-center">
                      {item.title && (
                        <h4 className="font-serif font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                      )}
                      {item.caption && (
                        <p className="text-xs text-muted-foreground leading-snug line-clamp-2 mt-0.5">
                          {item.caption}
                        </p>
                      )}
                    </div>
                  )}
                </ItemLinkWrapper>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------
   * MODE C: CURATED BENTO COLLAGE (Up to 12 Photos)
   * ----------------------------------------------------------- */
  const collageItems = validItems.slice(0, 12);
  const totalCollage = collageItems.length;

  return (
    <div
      className={cn("grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 w-full rounded-2xl", className)}
      style={{
        backgroundColor: canvasBgColor || undefined,
        backgroundImage: canvasBgImageUrl ? `url("${canvasBgImageUrl}")` : undefined,
        backgroundSize: canvasBgMode === "contain" ? "contain" : canvasBgMode === "tile" ? "auto" : "cover",
        backgroundRepeat: canvasBgMode === "tile" ? "repeat" : "no-repeat",
        backgroundPosition: "center",
        padding: framePadding ? `${framePadding}px` : undefined,
        border: borderWidth > 0 ? `${borderWidth}px solid ${borderFilletColor}` : undefined,
      }}
    >
      {collageItems.map((item, idx) => {
        const itemClass = getBentoItemClass(idx, totalCollage);
        const isFeatured = idx === 0 && totalCollage >= 3;
        const isLinked = !!getItemHref(item);

        return (
          <div key={item.id || idx} className={itemClass}>
            <ItemLinkWrapper
              item={item}
              className={cn(
                "relative w-full h-full group overflow-hidden block",
                frameClasses
              )}
            >
              <ProtectedImage
                src={item.url}
                alt={item.alt || item.title || `Atelier Masterwork ${idx + 1}`}
                useImg={true}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                wrapperClassName="w-full h-full"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/25 to-transparent pointer-events-none" />

              {/* External Link Pill (if applicable) */}
              {isLinked && (
                <div className="absolute top-2.5 right-2.5 bg-stone-950/70 backdrop-blur-md p-1.5 rounded-full text-amber-300 opacity-90 group-hover:opacity-100 transition-opacity z-10">
                  <ExternalLink className="w-3 h-3" />
                </div>
              )}

              {/* Overlay Metadata */}
              <div
                className={cn(
                  "absolute left-3 right-3 text-left z-10 pointer-events-none",
                  isFeatured
                    ? "bottom-4 sm:bottom-6 sm:left-6 sm:right-6"
                    : "bottom-2.5 sm:bottom-3"
                )}
              >
                {isFeatured && (
                  <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 uppercase tracking-wider mb-1 bg-stone-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    <Sparkles className="w-2.5 h-2.5" /> Featured Plate
                  </div>
                )}
                {item.title && (
                  <h4
                    className={cn(
                      "font-serif font-bold text-white drop-shadow-sm line-clamp-1",
                      isFeatured ? "text-base sm:text-xl" : "text-xs sm:text-sm"
                    )}
                  >
                    {item.title}
                  </h4>
                )}
                {item.caption && (
                  <p
                    className={cn(
                      "text-stone-300 drop-shadow-xs line-clamp-1 mt-0.5",
                      isFeatured
                        ? "text-xs sm:text-sm text-stone-200/90 line-clamp-2 mt-1"
                        : "text-[11px]"
                    )}
                  >
                    {item.caption}
                  </p>
                )}
              </div>
            </ItemLinkWrapper>
          </div>
        );
      })}
    </div>
  );
}
