import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { TiptapRenderer } from "@/components/public/tiptap-renderer";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  ECatalogThemeTokens,
  DEFAULT_CATALOG_THEME_TOKENS,
  type SpineDecoratorSlot,
} from "@/types/catalog";
import { getPatternById } from "@/lib/background-patterns";
import {
  BookOpen,
  ArrowLeft,
  Calendar,
  Sparkles,
  Download,
  ExternalLink,
  Compass,
} from "lucide-react";
import { CatalogMatrixPage } from "@/components/public/catalog-matrix-page";
import { ProtectedImage } from "@/components/public/protected-image";
import {
  resolveContainerThemeScope,
  resolveContainerContrast,
  getContrastTypographyClasses,
  parseColorToRgb,
  computeRelativeLuminance,
} from "@/lib/theme-contrast";
import {
  getCatalogDimensions,
  type CatalogPageSize,
  type CatalogOrientation,
} from "@/lib/catalog-geometry";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ adminPrint?: string }>;
}

export const dynamic = "force-dynamic";

function getFrameClass(style?: string | null) {
  if (style === "double-fillet") {
    return "catalog-frame-double border-4 border-double border-primary/60";
  }
  if (style === "silk-border") {
    return "catalog-frame-silk border-2 border-amber-600/70 shadow-[inset_0_0_0_3px_#1C1814,inset_0_0_0_4.5px_#D4AF37]";
  }
  if (style === "none") {
    return "border-none";
  }
  return "catalog-frame-gold border-2 border-primary/50 shadow-[inset_0_0_0_2px_#1C1814,inset_0_0_0_3.5px_#D4AF37]";
}

function getMagazineGridClass(layoutType?: string | null, fallbackLayout?: string | null) {
  const type = layoutType || (fallbackLayout === "TWO_COLUMN" ? "2_COL" : "1_COL");
  switch (type) {
    case "1_COL":
      return "grid grid-cols-1 gap-6 magazine-grid-1col";
    case "2_COL":
      return "grid grid-cols-1 md:grid-cols-2 gap-8 magazine-grid-2col";
    case "ASYMMETRIC_70_30":
      return "grid grid-cols-1 md:grid-cols-[70%_30%] gap-8 magazine-grid-asym-70-30";
    case "ASYMMETRIC_30_70":
      return "grid grid-cols-1 md:grid-cols-[30%_70%] gap-8 magazine-grid-asym-30-70";
    case "3_COL":
      return "grid grid-cols-1 md:grid-cols-3 gap-6 magazine-grid-3col";
    case "4_COL":
      return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 magazine-grid-4col";
    case "6_COL":
      return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 magazine-grid-6col";
    default:
      return "grid grid-cols-1 md:grid-cols-2 gap-8 magazine-grid-2col";
  }
}

function SpineDecoratorSlotView({
  slot,
  position,
}: {
  slot?: SpineDecoratorSlot | null;
  position: "top" | "bottom" | "left" | "right";
}) {
  if (!slot || slot.visible === false) return null;
  if (!slot.text?.trim() && !slot.imageUrl?.trim()) return null;

  const isVertical = position === "left" || position === "right";
  const isRepeat =
    slot.imageMode === "repeat-pattern" ||
    (!slot.imageMode && (Boolean(slot.patternId) || slot.imageUrl?.startsWith("data:image/svg+xml")));

  return (
    <div
      className={cn(
        "z-20 relative flex items-center justify-center shrink-0 transition-all font-mono overflow-hidden",
        isVertical
          ? "h-full py-4 px-2 [writing-mode:vertical-rl] select-none text-center"
          : "w-full px-6 py-2 select-none text-center",
        position === "left" ? "rotate-180 border-r border-primary/20" : "",
        position === "right" ? "border-l border-primary/20" : "",
        position === "top" ? "border-b border-primary/20" : "",
        position === "bottom" ? "border-t border-primary/20" : ""
      )}
      style={{
        backgroundColor: slot.bgColor || "transparent",
        color: slot.textColor || "#D4AF37",
        height: isVertical ? undefined : slot.heightPx ? `${slot.heightPx}px` : undefined,
        width: isVertical && slot.widthPx ? `${slot.widthPx}px` : undefined,
        fontSize: "11px",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
      }}
    >
      {/* Decorative Ribbon Pattern Background Layer */}
      {slot.imageUrl && isRepeat && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `url("${slot.imageUrl}")`,
            backgroundRepeat: isVertical ? "repeat-y" : "repeat-x",
            backgroundPosition: "center center",
            opacity: typeof slot.opacity === "number" ? slot.opacity : 1.0,
          }}
        />
      )}

      {/* Contained Ornamental Crest / Image */}
      {slot.imageUrl && !isRepeat && (
        <img
          src={slot.imageUrl}
          alt={slot.text || "Spine Ornament"}
          className={cn(
            "object-contain max-h-full inline-block relative z-10",
            isVertical ? "max-w-[28px]" : "max-h-[28px]"
          )}
          style={{ opacity: typeof slot.opacity === "number" ? slot.opacity : 1.0 }}
        />
      )}

      {/* Text with backdrop contrast pill if ribbon pattern is present */}
      {slot.text ? (
        <span
          className={cn(
            "relative z-10 font-bold",
            slot.imageUrl && isRepeat
              ? "px-2.5 py-0.5 rounded bg-black/60 backdrop-blur-xs shadow-xs"
              : ""
          )}
        >
          {slot.text}
        </span>
      ) : null}
    </div>
  );
}

function CatalogSinglePlateView({
  primaryImageUrl,
  presentation = "contained",
  mattingBgColor,
  outerMattingColor,
  canvasBgColor,
  focalPosition = "center center",
  headerSlot,
  footerSlot,
  leftSpineSlot,
  rightSpineSlot,
  frameClass,
  aspectRatio,
  children,
  innerBorderColor,
  mattingPadding = 24,
  backgroundLayer,
  imageMaxHeightClass = "max-h-[44vh] print:max-h-[50vh]",
}: {
  primaryImageUrl?: string;
  presentation?: "contained" | "full-bleed";
  mattingBgColor?: string;
  outerMattingColor?: string;
  canvasBgColor?: string;
  focalPosition?: string;
  headerSlot?: SpineDecoratorSlot;
  footerSlot?: SpineDecoratorSlot;
  leftSpineSlot?: SpineDecoratorSlot;
  rightSpineSlot?: SpineDecoratorSlot;
  frameClass?: string;
  aspectRatio: number;
  children?: React.ReactNode;
  innerBorderColor?: string;
  mattingPadding?: number;
  backgroundLayer?: React.ReactNode;
  imageMaxHeightClass?: string;
}) {
  const isFullBleed = presentation === "full-bleed";

  if (isFullBleed && primaryImageUrl) {
    return (
      <div
        className="catalog-page relative rounded-3xl overflow-hidden flex flex-col justify-between print:rounded-none min-h-0 md:min-h-[640px] text-white"
        style={{ aspectRatio: `${aspectRatio}` }}
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <ProtectedImage
            useImg={true}
            priority={true}
            loading="eager"
            decoding="sync"
            src={primaryImageUrl}
            alt="Masterwork Plate"
            className="w-full h-full object-cover"
            style={{ objectPosition: focalPosition || "center center" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/65 pointer-events-none" />
        </div>

        {headerSlot && <SpineDecoratorSlotView slot={headerSlot} position="top" />}

        <div className="flex-1 flex flex-row items-stretch relative z-10 w-full overflow-hidden">
          {leftSpineSlot && <SpineDecoratorSlotView slot={leftSpineSlot} position="left" />}

          <div className={cn("flex-1 flex flex-col justify-between p-6 sm:p-10", frameClass)}>
            {children}
          </div>

          {rightSpineSlot && <SpineDecoratorSlotView slot={rightSpineSlot} position="right" />}
        </div>

        {footerSlot && <SpineDecoratorSlotView slot={footerSlot} position="bottom" />}
      </div>
    );
  }

  // Contained with Matting & Spines
  const resolvedInnerBg = canvasBgColor || mattingBgColor || "var(--cat-canvas-bg, #FAF7F2)";
  const resolvedOuterBg = (mattingPadding > 0 && outerMattingColor)
    ? outerMattingColor
    : resolvedInnerBg;

  return (
    <div
      className="catalog-page relative rounded-3xl overflow-hidden flex flex-col justify-between print:rounded-none"
      style={{
        aspectRatio: `${aspectRatio}`,
        backgroundColor: resolvedOuterBg,
        padding: `${mattingPadding}px`,
      }}
    >
      {backgroundLayer}
      <div
        className={cn(
          "relative z-10 flex flex-col justify-between h-full w-full rounded-2xl overflow-hidden transition-colors border",
          frameClass
        )}
        style={{
          backgroundColor: resolvedInnerBg,
          ...(innerBorderColor ? { borderColor: innerBorderColor } : {}),
        }}
      >
        {headerSlot && <SpineDecoratorSlotView slot={headerSlot} position="top" />}

        <div className="flex-1 flex flex-row items-stretch overflow-hidden w-full">
          {leftSpineSlot && <SpineDecoratorSlotView slot={leftSpineSlot} position="left" />}

          <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 overflow-visible md:overflow-y-auto print:overflow-visible w-full">
            {children}

            {primaryImageUrl && (
              <div className="plate-image-container py-3 flex-1 flex items-center justify-center">
                <div className={cn("rounded-xl overflow-hidden border border-primary/30 shadow-2xl", imageMaxHeightClass)}>
                  <ProtectedImage
                    useImg={true}
                    priority={true}
                    loading="eager"
                    decoding="sync"
                    src={primaryImageUrl}
                    alt="Masterwork Plate"
                    className={cn("w-full h-auto object-contain mx-auto", imageMaxHeightClass)}
                  />
                </div>
              </div>
            )}
          </div>

          {rightSpineSlot && <SpineDecoratorSlotView slot={rightSpineSlot} position="right" />}
        </div>

        {footerSlot && <SpineDecoratorSlotView slot={footerSlot} position="bottom" />}
      </div>
    </div>
  );
}

function CatalogBackgroundLayer({
  bgType,
  patternId,
  patternOpacity,
  bgImage,
  overlayOpacity,
  fallbackBgMode,
  fallbackPattern,
  fallbackPatternOpacity,
  fallbackBgImage,
  fallbackOverlayOpacity,
}: {
  bgType?: string;
  patternId?: string;
  patternOpacity?: number;
  bgImage?: string;
  overlayOpacity?: number;
  fallbackBgMode: string;
  fallbackPattern?: ReturnType<typeof getPatternById>;
  fallbackPatternOpacity: number;
  fallbackBgImage?: string;
  fallbackOverlayOpacity: number;
}) {
  const mode = bgType
    ? bgType.toUpperCase()
    : bgImage
    ? "IMAGE"
    : fallbackBgMode.toUpperCase();

  if (mode === "PATTERN") {
    const pat = getPatternById(patternId) || fallbackPattern;
    const op = typeof patternOpacity === "number" ? patternOpacity : fallbackPatternOpacity;
    if (pat) {
      return (
        <div
          aria-hidden="true"
          className="catalog-bg-layer absolute inset-0 pointer-events-none z-0 overflow-hidden"
          style={{
            backgroundImage: `url("${pat.svgDataUri}")`,
            backgroundRepeat: "repeat",
            opacity: op,
          }}
        />
      );
    }
  }

  if (mode === "IMAGE") {
    const img = bgImage || fallbackBgImage;
    const op = typeof overlayOpacity === "number" ? overlayOpacity : fallbackOverlayOpacity;
    if (img) {
      return (
        <div
          aria-hidden="true"
          className="catalog-bg-layer absolute inset-0 pointer-events-none z-0 overflow-hidden"
        >
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url("${img}")` }}
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: op }}
          />
        </div>
      );
    }
  }

  // Fallback to global catalog background
  if (fallbackBgMode.toUpperCase() === "PATTERN" && fallbackPattern) {
    return (
      <div
        aria-hidden="true"
        className="catalog-bg-layer absolute inset-0 pointer-events-none z-0 overflow-hidden"
        style={{
          backgroundImage: `url("${fallbackPattern.svgDataUri}")`,
          backgroundRepeat: "repeat",
          opacity: fallbackPatternOpacity,
        }}
      />
    );
  }

  if (fallbackBgMode.toUpperCase() === "IMAGE" && fallbackBgImage) {
    return (
      <div
        aria-hidden="true"
        className="catalog-bg-layer absolute inset-0 pointer-events-none z-0 overflow-hidden"
      >
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url("${fallbackBgImage}")` }}
        />
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: fallbackOverlayOpacity }}
        />
      </div>
    );
  }

  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [catalog, settings] = await Promise.all([
    prisma.eCatalog.findUnique({
      where: { slug },
    }),
    prisma.systemSetting.findFirst(),
  ]);
  const siteName = settings?.siteName || "SavazAI WebApps";
  const artistName = settings?.siteName || "the Atelier";

  if (!catalog) {
    return { title: `Catalog Not Found — ${siteName}` };
  }

  return {
    title: `${catalog.title} — Digital Exhibition e-Catalog | ${siteName}`,
    description:
      catalog.subtitle ||
      `Explore the digital exhibition catalog and curated plates of ${catalog.title} featuring traditional fine art by ${artistName}.`,
  };
}

export default async function ECatalogReaderPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const search = searchParams ? await searchParams : {};
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders }).catch(() => null);
  const isAdmin = Boolean(session?.user);
  const isAdminPrint = isAdmin && search.adminPrint === "true";

  const [catalog, settings] = await Promise.all([
    prisma.eCatalog.findUnique({
      where: { slug },
      include: {
        event: true,
        customPages: {
          orderBy: { pageNumber: "asc" },
        },
        items: {
          orderBy: { pageNumber: "asc" },
          include: {
            artwork: {
              include: { category: true },
            },
          },
        },
      },
    }),
    prisma.systemSetting.findFirst(),
  ]);

  if (!catalog || !catalog.isActive || catalog.isDeleted || (!catalog.isPublished && !isAdmin && process.env.NODE_ENV === "production")) {
    notFound();
  }

  const themeConfig = (catalog.themeConfig as Record<string, unknown> | null) || {};
  const coverConfig = (catalog.coverConfig as Record<string, unknown> | null) || {};
  const essayConfig = (catalog.essayConfig as Record<string, unknown> | null) || {};
  const endPageConfig = (catalog.endPageConfig as Record<string, unknown> | null) || {};

  const orientation = catalog.orientation === "landscape" ? "landscape" : "portrait";
  const frameStyle = (themeConfig.frameStyle as string) || "gold-fillet";
  const frameClass = getFrameClass(frameStyle);

  // Dual-Theme Reader Palette
  const readerTheme = (themeConfig.readerTheme as ECatalogThemeTokens | null) || DEFAULT_CATALOG_THEME_TOKENS;
  const catalogThemeStyles = {
    "--cat-light-canvas-bg": readerTheme?.light?.canvasBg || "#FAF7F2",
    "--cat-light-card-bg": readerTheme?.light?.cardBg || "#FFFFFF",
    "--cat-light-heading-color": readerTheme?.light?.headingColor || "#0F172A",
    "--cat-light-text-color": readerTheme?.light?.textColor || "#334155",
    "--cat-light-accent-gold": readerTheme?.light?.accentGold || "#B45309",
    "--cat-light-border-color": readerTheme?.light?.borderColor || "#E2E8F0",

    "--cat-dark-canvas-bg": readerTheme?.dark?.canvasBg || "#0B0F17",
    "--cat-dark-card-bg": readerTheme?.dark?.cardBg || "#151B26",
    "--cat-dark-heading-color": readerTheme?.dark?.headingColor || "#F8FAFC",
    "--cat-dark-text-color": readerTheme?.dark?.textColor || "#CBD5E1",
    "--cat-dark-accent-gold": readerTheme?.dark?.accentGold || "#F59E0B",
    "--cat-dark-border-color": readerTheme?.dark?.borderColor || "#334155",
  } as React.CSSProperties;

  const bgColor = (themeConfig.backgroundColor as string) || "#1C1814";
  const textColor = (themeConfig.textColor as string) || "#FAF7F2";

  const bgMode = (themeConfig.backgroundMode as string) || "color";
  const bgPatternId = themeConfig.backgroundPattern as string | undefined;
  const patternOpacity =
    typeof themeConfig.patternOpacity === "number" ? themeConfig.patternOpacity : 0.15;
  const bgImage = themeConfig.backgroundImage as string | undefined;
  const overlayOpacity =
    typeof themeConfig.overlayOpacity === "number" ? themeConfig.overlayOpacity : 0.4;
  const pattern = getPatternById(bgPatternId);

  // Cover Page configuration
  const coverFrameClass = getFrameClass((coverConfig.frameStyle as string) || frameStyle);
  const coverBgColor = (coverConfig.coverBgColor as string) || (coverConfig.backgroundColor as string) || undefined;
  const coverBgType = (coverConfig.backgroundType as string) || (coverConfig.backgroundImage ? "IMAGE" : undefined);
  const coverBgPattern = coverConfig.backgroundPattern as string | undefined;
  const coverPatternOpacity = typeof coverConfig.patternOpacity === "number" ? coverConfig.patternOpacity : undefined;
  const coverBgImage = (coverConfig.backgroundImage as string) || undefined;
  const coverOverlayOpacity = typeof coverConfig.overlayOpacity === "number" ? coverConfig.overlayOpacity : undefined;
  const coverDesignMode = (coverConfig.coverDesignMode as string) || (coverConfig.useMatrixLayout ? "MATRIX" : coverConfig.contentHtml ? "WYSIWYG" : "IMAGE_PLATE");
  const coverContentHtml = coverConfig.contentHtml as string | undefined;

  // Dynamic Luminance & Contrast Resolution for Cover Plate
  const coverRgb = parseColorToRgb(coverBgColor || "#FAF7F2");
  const isCoverDark = coverRgb ? computeRelativeLuminance(coverRgb) <= 0.45 : false;

  const resolvedTitleColor =
    (coverConfig.titleColor as string) && (coverConfig.titleColor !== "#0F172A" || !isCoverDark)
      ? (coverConfig.titleColor as string)
      : isCoverDark
      ? "#FFFFFF"
      : "#0F172A";

  const resolvedSubtitleColor =
    (coverConfig.subtitleColor as string) && (coverConfig.subtitleColor !== "#334155" || !isCoverDark)
      ? (coverConfig.subtitleColor as string)
      : isCoverDark
      ? "#E2E8F0"
      : "#334155";

  const resolvedEyebrowColor =
    (coverConfig.eyebrowColor as string) && (coverConfig.eyebrowColor !== "#B45309" || !isCoverDark)
      ? (coverConfig.eyebrowColor as string)
      : isCoverDark
      ? "#F59E0B"
      : "#B45309";

  const coverEyebrowText =
    (coverConfig.coverEyebrowText as string) ||
    (coverConfig.eyebrowText as string) ||
    ((catalog as unknown as { eyebrow?: string }).eyebrow) ||
    "Exhibition Monograph & Archival Collection";

  const coverFooterNote =
    (coverConfig.coverFooterNote as string) ||
    `Published by the Atelier • ${settings?.siteName || "SavazAI WebApps"}`;

  const coverScope = resolveContainerThemeScope({
    backgroundType: coverBgType,
    backgroundColor: coverBgColor || bgColor,
    backgroundImage: coverBgImage || (bgMode === "image" ? bgImage : undefined),
    overlayOpacity: coverOverlayOpacity ?? overlayOpacity,
    backgroundPattern: coverBgPattern || bgPatternId,
  });

  // Curatorial Essay configuration
  const essayFrameClass = getFrameClass((essayConfig.frameStyle as string) || frameStyle);
  const essayBgColor = (essayConfig.backgroundColor as string) || undefined;
  const essayBgType = (essayConfig.backgroundType as string) || (essayConfig.backgroundImage ? "IMAGE" : undefined);
  const essayBgPattern = essayConfig.backgroundPattern as string | undefined;
  const essayPatternOpacity = typeof essayConfig.patternOpacity === "number" ? essayConfig.patternOpacity : undefined;
  const essayBgImage = (essayConfig.backgroundImage as string) || undefined;
  const essayOverlayOpacity = typeof essayConfig.overlayOpacity === "number" ? essayConfig.overlayOpacity : undefined;
  const essayTitle = (essayConfig.title as string) || (catalog as unknown as { curatorPrefaceTitle?: string }).curatorPrefaceTitle || "Curatorial Monograph & Scholarly Statement";
  const essayFooterLabel = (essayConfig.footerLabel as string) || "Curatorial Preface";

  // End Page configuration
  const endFrameClass = getFrameClass((endPageConfig.frameStyle as string) || frameStyle);
  const endBgColor = (endPageConfig.backgroundColor as string) || undefined;
  const endBgType = (endPageConfig.backgroundType as string) || (endPageConfig.backgroundImage ? "IMAGE" : undefined);
  const endBgPattern = endPageConfig.backgroundPattern as string | undefined;
  const endPatternOpacity = typeof endPageConfig.patternOpacity === "number" ? endPageConfig.patternOpacity : undefined;
  const endBgImage = (endPageConfig.backgroundImage as string) || undefined;
  const endOverlayOpacity = typeof endPageConfig.overlayOpacity === "number" ? endPageConfig.overlayOpacity : undefined;
  const colophonEyebrow = (endPageConfig.eyebrowText as string) || "Colophon & Publication Details";
  const colophonTitle = (endPageConfig.title as string) || "Colophon & Atelier Heritage";
  const colophonLegalNotice = (endPageConfig.legalNotice as string) || "Reproduction of sacred iconography and Tanjore masterworks strictly prohibited without written consent.";

  // Dynamic print page geometry and aspect ratio calculation
  const pageSize = ((catalog as unknown as { pageSize?: string }).pageSize as CatalogPageSize) || "A4";
  const geometry = getCatalogDimensions(pageSize, orientation);

  // Dedicated Cover Canvas Background Color (Primary source of truth for Cover Sheet/Canvas)
  const coverBorderConfig = (coverConfig.borderConfig as Record<string, unknown> | undefined) || {};
  const activeCoverCanvasBg =
    (coverConfig.coverBgColor as string) ||
    (coverBorderConfig.canvasBgColor as string) ||
    "#FAF7F2";

  // Dedicated Cover Matting Padding (0px eliminates outer matting for full edge-to-edge frame)
  const coverMattingPadding =
    typeof coverConfig.mattingPadding === "number"
      ? coverConfig.mattingPadding
      : (typeof coverBorderConfig.thicknessPx === "number"
      ? (coverBorderConfig.thicknessPx as number)
      : 24);

  // Dedicated Outer Matting / Border Color
  const coverOuterBorderColor =
    (coverConfig.coverMattingColor as string) ||
    (coverBorderConfig.outerColor as string) ||
    (coverBorderConfig.mattingBgColor as string) ||
    "#1C1814";

  // Dedicated Inner Border Fillet
  const coverInnerBorderColor =
    (coverConfig.innerBorderColor as string) ||
    (coverBorderConfig.innerColor as string) ||
    "#D4AF37";

  // Universal Framing Synchronization across all pages
  const isUniversalSync = Boolean(coverBorderConfig.syncGlobal ?? coverConfig.syncGlobal);
  const syncArtworkPlates = Boolean(coverBorderConfig.syncArtworkPlates ?? coverConfig.syncArtworkPlates ?? false);
  const universalOuterBorder = isUniversalSync ? coverOuterBorderColor : undefined;
  const universalInnerBorder = isUniversalSync ? coverInnerBorderColor : undefined;
  const universalThickness = isUniversalSync ? coverMattingPadding : undefined;
  const universalMattingBgColor = isUniversalSync ? coverOuterBorderColor : undefined;

  // Curatorial Section Configuration & Multi-Mode Parity
  const curatorialConfig = ((catalog.curatorialConfig || catalog.essayConfig) as Record<string, unknown> | null) || {};
  const curatorialSinglePlateConfig = (curatorialConfig.singlePlateConfig as Record<string, unknown> | undefined) || {};
  const essayMode = (curatorialConfig.mode as string) || (curatorialConfig.useMatrixLayout ? "MATRIX" : curatorialSinglePlateConfig.primaryImageUrl ? "SINGLE_PLATE" : "WYSIWYG");

  // End Page Configuration & Multi-Mode Parity
  const endSinglePlateConfig = (endPageConfig.singlePlateConfig as Record<string, unknown> | undefined) || {};
  const endMode = (endPageConfig.mode as string) || (endPageConfig.useMatrixLayout ? "MATRIX" : endSinglePlateConfig.primaryImageUrl ? "SINGLE_PLATE" : "WYSIWYG");

  return (
    <div
      data-catalog-reader="true"
      style={{
        ...catalogThemeStyles,
        colorScheme: "light",
      }}
      className={`light bg-[#FAF7F2] text-slate-900 min-h-screen flex flex-col selection:bg-amber-200 selection:text-slate-900 ${
        geometry.isLandscape ? "catalog-landscape" : "catalog-portrait"
      }`}
    >
      {/* Dynamic Print Page Size Override & Robust Color/Page-Break Print Engine */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: ${geometry.cssSize} !important;
                margin: 0 !important;
              }
              *, *::before, *::after {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
              }
              *::-webkit-scrollbar {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
              }
              html, body {
                width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #FAF7F2 !important;
                overflow: visible !important;
              }
              img {
                max-width: 100% !important;
                height: auto !important;
                display: block !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .catalog-plate-page, .plate-page, .catalog-page, .cover-page, .essay-page, .editorial-page {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-after: always !important;
                break-after: page !important;
                overflow: visible !important;
                max-height: none !important;
              }
              .catalog-frame, .plate-details-col, .plate-body-flow, .magazine-layout-container, .magazine-col {
                overflow: visible !important;
                max-height: none !important;
                background-color: #FAF7F2 !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
              }
              .print-hidden, .print\\:hidden {
                display: none !important;
                visibility: hidden !important;
              }
            }
            @media screen and (max-width: 767px) {
              .catalog-document .catalog-page,
              .catalog-document .plate-page,
              .catalog-document .cover-page,
              .catalog-document .essay-page,
              .catalog-document .editorial-page,
              .catalog-document .end-page,
              .catalog-document .catalog-matrix-page-wrapper {
                aspect-ratio: auto !important;
                height: auto !important;
                min-height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                padding: 10px !important;
                border-radius: 1.25rem !important;
              }
              .catalog-document .catalog-frame,
              .catalog-document .plate-details-col,
              .catalog-document .plate-body-flow,
              .catalog-document .magazine-col,
              .catalog-document .catalog-matrix-body,
              .catalog-document .catalog-matrix-spine,
              .catalog-document .catalog-matrix-cell {
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                overflow-y: visible !important;
                padding: 1.25rem 1rem !important;
                border-radius: 1rem !important;
              }
              .catalog-document .catalog-plate-body.plate-body-grid {
                display: flex !important;
                flex-direction: column !important;
                gap: 1.25rem !important;
                width: 100% !important;
              }
              .catalog-document .plate-image-col {
                width: 100% !important;
                max-height: none !important;
                margin-bottom: 0.5rem !important;
                display: flex !important;
                justify-content: center !important;
              }
              .catalog-document .plate-image-col img,
              .catalog-document .plate-image-container img {
                max-height: 48vh !important;
                width: auto !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                object-fit: contain !important;
              }
              .catalog-document .plate-details-col {
                width: 100% !important;
                max-height: none !important;
                overflow: visible !important;
                padding: 0 !important;
              }
              .catalog-document .plate-image-float {
                float: none !important;
                max-width: 100% !important;
                margin: 0 auto 1.25rem auto !important;
                display: flex !important;
                justify-content: center !important;
              }
              .catalog-document .plate-image-float img {
                max-height: 48vh !important;
                width: auto !important;
                max-width: 100% !important;
              }
              .catalog-document .catalog-matrix-body {
                flex-direction: column !important;
                gap: 1rem !important;
              }
              .catalog-document .catalog-matrix-spine {
                width: 100% !important;
                border: none !important;
                border-bottom: 1px solid rgba(180, 83, 9, 0.25) !important;
                padding: 0.75rem 0 !important;
              }
              .catalog-document .catalog-matrix-grid {
                display: flex !important;
                flex-direction: column !important;
                gap: 1rem !important;
                height: auto !important;
              }
              .catalog-document .catalog-matrix-cell {
                grid-column: auto !important;
                grid-row: auto !important;
                height: auto !important;
                overflow: visible !important;
              }
              .catalog-document .magazine-layout-container {
                display: flex !important;
                flex-direction: column !important;
                gap: 1.25rem !important;
              }
              .catalog-document .magazine-col {
                width: 100% !important;
                max-height: none !important;
                overflow: visible !important;
              }
            }
          `,
        }}
      />

      {/* Hide standard navbar when printing */}
      <div className="print-hidden">
        <Navbar />
      </div>

      <main
        className="catalog-document flex-1 mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-12 print:p-0 print:m-0 print:max-w-none print:space-y-0"
        style={{ maxWidth: `${geometry.maxWidthPx}px` }}
      >
        {/* Navigation & Actions Top Bar */}
        <div
          data-catalog-toolbar="true"
          className="flex items-center justify-between border-b border-primary/20 pb-4 print-hidden"
        >
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Gallery
          </Link>

          <div className="flex items-center gap-3">
            {catalog.downloadablePdfUrl ? (
              <a
                href={catalog.downloadablePdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3.5 py-1.5 rounded-md border border-border shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Pre-Compiled PDF
              </a>
            ) : null}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* PAGE 1: BOOK COVER (Strict Single Page on Print)                   */}
        {/* ------------------------------------------------------------------ */}
        {coverDesignMode === "MATRIX" && coverConfig.matrixConfig ? (
          (() => {
            const mc = coverConfig.matrixConfig as Record<string, unknown>;
            const matrixSegments = Array.isArray(mc.segments)
              ? (mc.segments as unknown as { id: string; row: number; col: number; rowSpan?: number; colSpan?: number; title?: string; contentHtml: string }[])
              : [];
            return (
              <CatalogMatrixPage
                pageNumber="1"
                pageTitle={catalog.title}
                pageSubtitle={catalog.subtitle}
                matrixRows={(mc.matrixRows as number) || 2}
                matrixCols={(mc.matrixCols as number) || 2}
                rowHeights={mc.rowHeights as string | undefined}
                colWidths={mc.colWidths as string | undefined}
                hasHeader={Boolean(mc.hasHeader)}
                headerHtml={mc.headerHtml as string | undefined}
                hasFooter={Boolean(mc.hasFooter)}
                footerHtml={mc.footerHtml as string | undefined}
                verticalSpineMode={(mc.verticalSpineMode as string) || "NONE"}
                verticalSpineHtml={mc.verticalSpineHtml as string | undefined}
                verticalSpineWidth={mc.verticalSpineWidth as string | undefined}
                segments={matrixSegments}
                frameClass={coverFrameClass}
                backgroundColor={coverOuterBorderColor}
                canvasBgColor={activeCoverCanvasBg}
                outerBorderColor={coverOuterBorderColor}
                innerBorderColor={coverInnerBorderColor}
                mattingPadding={coverMattingPadding}
                backgroundLayer={
                  <CatalogBackgroundLayer
                    bgType={coverBgType}
                    patternId={coverBgPattern}
                    patternOpacity={coverPatternOpacity}
                    bgImage={coverBgImage}
                    overlayOpacity={coverOverlayOpacity}
                    fallbackBgMode={bgMode}
                    fallbackPattern={pattern}
                    fallbackPatternOpacity={patternOpacity}
                    fallbackBgImage={bgImage}
                    fallbackOverlayOpacity={overlayOpacity}
                  />
                }
                catalogTitle={catalog.title}
                aspectRatio={geometry.ratio}
              />
            );
          })()
        ) : coverDesignMode === "WYSIWYG" && coverContentHtml ? (
          <section
            className={cn(
              "catalog-page cover-page relative rounded-3xl overflow-hidden text-center flex flex-col justify-between print:rounded-none",
              coverScope.wrapperClass
            )}
            style={{
              ...coverScope.wrapperStyle,
              aspectRatio: `${geometry.ratio}`,
              backgroundColor: (coverMattingPadding > 0 && coverOuterBorderColor) ? coverOuterBorderColor : activeCoverCanvasBg,
              padding: `${coverMattingPadding}px`,
            }}
          >
            <CatalogBackgroundLayer
              bgType={coverBgType}
              patternId={coverBgPattern}
              patternOpacity={coverPatternOpacity}
              bgImage={coverBgImage}
              overlayOpacity={coverOverlayOpacity}
              fallbackBgMode={bgMode}
              fallbackPattern={pattern}
              fallbackPatternOpacity={patternOpacity}
              fallbackBgImage={bgImage}
              fallbackOverlayOpacity={overlayOpacity}
            />
            <div
              className={`catalog-frame relative z-10 ${coverFrameClass} p-6 sm:p-10 rounded-2xl flex flex-col justify-between h-full transition-colors`}
              style={{
                backgroundColor: activeCoverCanvasBg,
                ...(coverInnerBorderColor ? { borderColor: coverInnerBorderColor } : {}),
              }}
            >
              {/* Bespoke WYSIWYG Front Cover Content with container contrast scoping */}
              <div className="w-full flex-1 flex flex-col justify-center my-auto">
                <TiptapRenderer
                  content={coverContentHtml}
                  contrast={coverScope.contrastMode}
                  className="w-full max-w-4xl mx-auto"
                />
              </div>

              {/* Footer Notice */}
              <div className="pt-4 border-t border-primary/20 space-y-1">
                {catalog.event && (
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <Calendar className="w-3 h-3 text-primary" />
                    <span>Official Monograph of {catalog.event.title} • {catalog.event.venue}</span>
                  </div>
                )}
                {!coverConfig.hideCoverFooter && (
                  <p className="text-[11px] font-mono text-muted-foreground/70">
                    {coverFooterNote}
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : (
          <CatalogSinglePlateView
            primaryImageUrl={catalog.coverImageUrl || undefined}
            presentation={((coverConfig.singlePlateConfig as Record<string, unknown> | undefined)?.presentation as "contained" | "full-bleed") || coverConfig.imagePlatePresentation || "contained"}
            canvasBgColor={activeCoverCanvasBg}
            mattingBgColor={coverOuterBorderColor}
            outerMattingColor={coverOuterBorderColor}
            focalPosition={((coverConfig.singlePlateConfig as Record<string, unknown> | undefined)?.focalPosition as string) || (coverConfig.imageFocalPosition as string)}
            headerSlot={((coverConfig.singlePlateConfig as Record<string, unknown> | undefined)?.headerSlot as SpineDecoratorSlot) || (coverConfig.headerSlot as SpineDecoratorSlot)}
            footerSlot={((coverConfig.singlePlateConfig as Record<string, unknown> | undefined)?.footerSlot as SpineDecoratorSlot) || (coverConfig.footerSlot as SpineDecoratorSlot)}
            leftSpineSlot={((coverConfig.singlePlateConfig as Record<string, unknown> | undefined)?.leftSpineSlot as SpineDecoratorSlot) || (coverConfig.leftSpineSlot as SpineDecoratorSlot)}
            rightSpineSlot={((coverConfig.singlePlateConfig as Record<string, unknown> | undefined)?.rightSpineSlot as SpineDecoratorSlot) || (coverConfig.rightSpineSlot as SpineDecoratorSlot)}
            frameClass={coverFrameClass}
            aspectRatio={geometry.ratio}
            innerBorderColor={coverInnerBorderColor}
            mattingPadding={coverMattingPadding}
            backgroundLayer={
              <CatalogBackgroundLayer
                bgType={coverBgType}
                patternId={coverBgPattern}
                patternOpacity={coverPatternOpacity}
                bgImage={coverBgImage}
                overlayOpacity={coverOverlayOpacity}
                fallbackBgMode={bgMode}
                fallbackPattern={pattern}
                fallbackPatternOpacity={patternOpacity}
                fallbackBgImage={bgImage}
                fallbackOverlayOpacity={overlayOpacity}
              />
            }
          >
            {/* Header / Subtitle */}
            <div className="space-y-4 pt-2 text-center">
              {!coverConfig.hideCoverEyebrow && (
                <div
                  className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-xs mx-auto"
                  style={{
                    color: resolvedEyebrowColor,
                    borderColor: (coverConfig.innerBorderColor as string) || resolvedEyebrowColor || "#D4AF37",
                    backgroundColor: `${resolvedEyebrowColor}15`,
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {coverEyebrowText}
                </div>
              )}

              <h1
                className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight max-w-3xl mx-auto drop-shadow-xs"
                style={{
                  color: resolvedTitleColor,
                  fontFamily: (coverConfig.titleFont as string) || "var(--font-cinzel), serif",
                }}
              >
                {catalog.title}
              </h1>

              {catalog.subtitle && (
                <p
                  className="text-sm sm:text-base italic max-w-xl mx-auto font-medium"
                  style={{
                    color: resolvedSubtitleColor,
                    fontFamily: (coverConfig.subtitleFont as string) || "var(--font-cinzel), serif",
                  }}
                >
                  {catalog.subtitle}
                </p>
              )}

              {catalog.forewordBy && (
                <div
                  className="pt-2 text-xs uppercase tracking-widest font-mono"
                  style={{ color: resolvedSubtitleColor }}
                >
                  Curated by{" "}
                  <span
                    className="font-bold"
                    style={{ color: resolvedEyebrowColor }}
                  >
                    {catalog.forewordBy}
                  </span>
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className="pt-4 border-t border-primary/20 space-y-1 text-center mt-auto">
              {catalog.event && (
                <div className="inline-flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <Calendar className="w-3 h-3 text-primary" />
                  <span>Official Monograph of {catalog.event.title} • {catalog.event.venue}</span>
                </div>
              )}
              {!coverConfig.hideCoverFooter && (
                <p className="text-[11px] font-mono text-muted-foreground/70">
                  {coverFooterNote}
                </p>
              )}
            </div>
          </CatalogSinglePlateView>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* PAGE 2: CURATORIAL FOREWORD & ESSAY (Multi-Mode Parity)            */}
        {/* ------------------------------------------------------------------ */}
        {essayMode === "MATRIX" && curatorialConfig.matrixConfig ? (
          (() => {
            const mc = curatorialConfig.matrixConfig as Record<string, unknown>;
            const matrixSegments = Array.isArray(mc.segments)
              ? (mc.segments as unknown as { id: string; row: number; col: number; rowSpan?: number; colSpan?: number; title?: string; contentHtml: string }[])
              : [];
            return (
              <CatalogMatrixPage
                pageNumber="2"
                pageTitle={essayTitle}
                pageSubtitle={catalog.title}
                matrixRows={(mc.matrixRows as number) || 2}
                matrixCols={(mc.matrixCols as number) || 2}
                rowHeights={mc.rowHeights as string | undefined}
                colWidths={mc.colWidths as string | undefined}
                hasHeader={Boolean(mc.hasHeader)}
                headerHtml={mc.headerHtml as string | undefined}
                hasFooter={Boolean(mc.hasFooter)}
                footerHtml={mc.footerHtml as string | undefined}
                verticalSpineMode={(mc.verticalSpineMode as string) || "NONE"}
                verticalSpineHtml={mc.verticalSpineHtml as string | undefined}
                verticalSpineWidth={mc.verticalSpineWidth as string | undefined}
                segments={matrixSegments}
                frameClass={essayFrameClass}
                backgroundColor={isUniversalSync ? universalMattingBgColor || essayBgColor : essayBgColor}
                canvasBgColor={activeCoverCanvasBg}
                outerBorderColor={isUniversalSync ? universalOuterBorder : undefined}
                innerBorderColor={isUniversalSync ? universalInnerBorder : undefined}
                mattingPadding={isUniversalSync && typeof universalThickness === "number" ? universalThickness : undefined}
                backgroundLayer={
                  <CatalogBackgroundLayer
                    bgType={essayBgType}
                    patternId={essayBgPattern}
                    patternOpacity={essayPatternOpacity}
                    bgImage={essayBgImage}
                    overlayOpacity={essayOverlayOpacity}
                    fallbackBgMode={bgMode}
                    fallbackPattern={pattern}
                    fallbackPatternOpacity={patternOpacity}
                    fallbackBgImage={bgImage}
                    fallbackOverlayOpacity={overlayOpacity}
                  />
                }
                catalogTitle={catalog.title}
                fallbackContentHtml={catalog.curatorialEssay || (curatorialConfig.contentHtml as string)}
                aspectRatio={geometry.ratio}
              />
            );
          })()
        ) : essayMode === "SINGLE_PLATE" && (curatorialSinglePlateConfig.primaryImageUrl || curatorialConfig.primaryImageUrl) ? (
          <CatalogSinglePlateView
            primaryImageUrl={(curatorialSinglePlateConfig.primaryImageUrl as string) || (curatorialConfig.primaryImageUrl as string)}
            presentation={(curatorialSinglePlateConfig.presentation as "contained" | "full-bleed") || "contained"}
            canvasBgColor={activeCoverCanvasBg}
            outerMattingColor={isUniversalSync ? universalMattingBgColor : (curatorialSinglePlateConfig.outerMattingColor as string)}
            mattingBgColor={isUniversalSync ? universalMattingBgColor || essayBgColor : (curatorialSinglePlateConfig.mattingBgColor as string) || essayBgColor}
            focalPosition={curatorialSinglePlateConfig.focalPosition as string}
            headerSlot={curatorialSinglePlateConfig.headerSlot as SpineDecoratorSlot}
            footerSlot={curatorialSinglePlateConfig.footerSlot as SpineDecoratorSlot}
            leftSpineSlot={curatorialSinglePlateConfig.leftSpineSlot as SpineDecoratorSlot}
            rightSpineSlot={curatorialSinglePlateConfig.rightSpineSlot as SpineDecoratorSlot}
            frameClass={essayFrameClass}
            aspectRatio={geometry.ratio}
            innerBorderColor={isUniversalSync ? universalInnerBorder : (curatorialSinglePlateConfig.innerBorderColor as string)}
            mattingPadding={isUniversalSync && typeof universalThickness === "number" ? universalThickness : 24}
            backgroundLayer={
              <CatalogBackgroundLayer
                bgType={essayBgType}
                patternId={essayBgPattern}
                patternOpacity={essayPatternOpacity}
                bgImage={essayBgImage}
                overlayOpacity={essayOverlayOpacity}
                fallbackBgMode={bgMode}
                fallbackPattern={pattern}
                fallbackPatternOpacity={patternOpacity}
                fallbackBgImage={bgImage}
                fallbackOverlayOpacity={overlayOpacity}
              />
            }
          >
            <div className="border-b border-primary/20 pb-3 flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
                {essayTitle}
              </span>
              <BookOpen className="w-4 h-4 text-primary" />
            </div>

            {catalog.forewordBy && (
              <div className="py-2 text-xs font-serif italic text-muted-foreground">
                Foreword &amp; scholarly notes by <span className="font-semibold text-foreground">{catalog.forewordBy}</span>
              </div>
            )}

            <div className="pt-3 border-t border-primary/20 flex items-center justify-between text-[11px] font-mono text-muted-foreground mt-auto">
              <span>{catalog.title}</span>
              <span>{essayFooterLabel}</span>
            </div>
          </CatalogSinglePlateView>
        ) : catalog.curatorialEssay ? (
          <section
            className={cn(
              "catalog-page essay-page relative rounded-3xl overflow-hidden flex flex-col justify-between print:rounded-none",
              isUniversalSync && typeof universalThickness === "number" ? "" : "p-6 sm:p-12"
            )}
            style={{
              aspectRatio: `${geometry.ratio}`,
              ...((isUniversalSync ? universalMattingBgColor || essayBgColor : essayBgColor) ? { backgroundColor: isUniversalSync ? universalMattingBgColor || essayBgColor : essayBgColor } : {}),
              ...(isUniversalSync && typeof universalThickness === "number" ? { padding: `${universalThickness}px` } : {}),
            }}
          >
            <CatalogBackgroundLayer
              bgType={essayBgType}
              patternId={essayBgPattern}
              patternOpacity={essayPatternOpacity}
              bgImage={essayBgImage}
              overlayOpacity={essayOverlayOpacity}
              fallbackBgMode={bgMode}
              fallbackPattern={pattern}
              fallbackPatternOpacity={patternOpacity}
              fallbackBgImage={bgImage}
              fallbackOverlayOpacity={overlayOpacity}
            />
            <div
              className={`catalog-frame relative z-10 ${essayFrameClass} p-6 sm:p-10 rounded-2xl flex flex-col justify-between h-full bg-card/40 backdrop-blur-xs`}
              style={isUniversalSync && universalInnerBorder ? { borderColor: universalInnerBorder } : undefined}
            >
              <div className="border-b border-primary/20 pb-3 flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
                  {essayTitle}
                </span>
                <BookOpen className="w-4 h-4 text-primary" />
              </div>

              <div className="prose prose-sm sm:prose-base dark:prose-invert font-serif leading-relaxed text-foreground/90 max-w-none flex-1 overflow-visible md:overflow-y-auto print:overflow-visible py-4 text-justify">
                <TiptapRenderer
                  content={catalog.curatorialEssay}
                  catalogPageSize={geometry.size}
                  catalogOrientation={geometry.orientation}
                />
              </div>

              <div className="pt-3 border-t border-primary/20 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>{catalog.title}</span>
                <span>{essayFooterLabel}</span>
              </div>
            </div>
          </section>
        ) : null}

        {/* ------------------------------------------------------------------ */}
        {/* EDITORIAL & MAGAZINE PAGES: (Multi-Segment Layouts & Per-Page BG)  */}
        {/* ------------------------------------------------------------------ */}
        {catalog.customPages && catalog.customPages.map((page, pIdx) => {
          const pageCustomConfig = (page.pageConfig as Record<string, unknown> | null) || {};
          const pageSinglePlate = (pageCustomConfig.singlePlateConfig as Record<string, unknown> | undefined) || ((page as unknown as { singlePlateConfig?: Record<string, unknown> }).singlePlateConfig);
          const effectivePageMode = (pageCustomConfig.mode as string) || (page as unknown as { mode?: string }).mode || (page.layoutType === "MATRIX" ? "MATRIX" : pageSinglePlate?.primaryImageUrl ? "SINGLE_PLATE" : "WYSIWYG");
          const pageFrameClass = getFrameClass(page.frameStyle || frameStyle);

          const bgLayerNode = (
            <CatalogBackgroundLayer
              bgType={page.backgroundType || undefined}
              patternId={page.backgroundPattern || undefined}
              patternOpacity={page.patternOpacity ?? undefined}
              bgImage={page.backgroundImage || undefined}
              overlayOpacity={page.overlayOpacity ?? undefined}
              fallbackBgMode={bgMode}
              fallbackPattern={pattern}
              fallbackPatternOpacity={patternOpacity}
              fallbackBgImage={bgImage}
              fallbackOverlayOpacity={overlayOpacity}
            />
          );

          // Mode C: InDesign Matrix Grid Engine Page
          if (effectivePageMode === "MATRIX") {
            const matrixSegments = Array.isArray(page.segments)
              ? (page.segments as unknown as { id: string; row: number; col: number; rowSpan?: number; colSpan?: number; title?: string; contentHtml: string }[])
              : [];

            return (
              <CatalogMatrixPage
                key={page.id || pIdx}
                pageNumber={page.pageNumber || pIdx + 1}
                pageTitle={page.title}
                pageSubtitle={page.subtitle}
                matrixRows={page.matrixRows || 2}
                matrixCols={page.matrixCols || 2}
                rowHeights={page.rowHeights}
                colWidths={page.colWidths}
                hasHeader={page.hasHeader}
                headerHtml={page.headerHtml}
                hasFooter={page.hasFooter}
                footerHtml={page.footerHtml}
                verticalSpineMode={page.verticalSpineMode || "NONE"}
                verticalSpineHtml={page.verticalSpineHtml}
                verticalSpineWidth={page.verticalSpineWidth}
                segments={matrixSegments}
                frameClass={pageFrameClass}
                backgroundColor={(isUniversalSync ? universalMattingBgColor || page.backgroundColor : page.backgroundColor) ?? undefined}
                canvasBgColor={activeCoverCanvasBg}
                outerBorderColor={isUniversalSync ? universalOuterBorder : undefined}
                innerBorderColor={isUniversalSync ? universalInnerBorder : undefined}
                mattingPadding={isUniversalSync && typeof universalThickness === "number" ? universalThickness : undefined}
                backgroundLayer={bgLayerNode}
                catalogTitle={catalog.title}
                fallbackContentHtml={page.contentHtml}
                aspectRatio={geometry.ratio}
              />
            );
          }

          // Mode A: Single Image Plate with Spine Embellishments
          if (effectivePageMode === "SINGLE_PLATE" && pageSinglePlate?.primaryImageUrl) {
            return (
              <CatalogSinglePlateView
                key={page.id || pIdx}
                primaryImageUrl={pageSinglePlate.primaryImageUrl as string}
                presentation={(pageSinglePlate.presentation as "contained" | "full-bleed") || "contained"}
                canvasBgColor={activeCoverCanvasBg}
                outerMattingColor={isUniversalSync ? universalMattingBgColor : (pageSinglePlate.outerMattingColor as string)}
                mattingBgColor={(isUniversalSync ? universalMattingBgColor || page.backgroundColor : (pageSinglePlate.mattingBgColor as string) || page.backgroundColor) ?? undefined}
                focalPosition={pageSinglePlate.focalPosition as string}
                headerSlot={pageSinglePlate.headerSlot as SpineDecoratorSlot}
                footerSlot={pageSinglePlate.footerSlot as SpineDecoratorSlot}
                leftSpineSlot={pageSinglePlate.leftSpineSlot as SpineDecoratorSlot}
                rightSpineSlot={pageSinglePlate.rightSpineSlot as SpineDecoratorSlot}
                frameClass={pageFrameClass}
                aspectRatio={geometry.ratio}
                innerBorderColor={isUniversalSync ? universalInnerBorder : (pageSinglePlate.innerBorderColor as string)}
                mattingPadding={isUniversalSync && typeof universalThickness === "number" ? universalThickness : 24}
                backgroundLayer={bgLayerNode}
              >
                {(page.title || page.subtitle) && (
                  <div className="border-b border-primary/20 pb-3 mb-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
                        Editorial Monograph • Page {page.pageNumber || pIdx + 1}
                      </span>
                      <BookOpen className="w-4 h-4 text-primary shrink-0" />
                    </div>
                    {page.title && (
                      <h2 className="text-xl sm:text-2xl font-serif font-bold leading-tight">
                        {page.title}
                      </h2>
                    )}
                    {page.subtitle && (
                      <p className="text-xs font-serif italic text-muted-foreground mt-0.5">
                        {page.subtitle}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-primary/20 flex items-center justify-between text-[11px] font-mono text-muted-foreground mt-auto">
                  <span>{catalog.title} • Atelier Monograph</span>
                  <span>Page {page.pageNumber || pIdx + 1}</span>
                </div>
              </CatalogSinglePlateView>
            );
          }

          // Mode B: Multi-Segment Column Studio
          const gridClass = getMagazineGridClass(page.layoutType, page.pageLayout);
          const segments = Array.isArray(page.segments)
            ? (page.segments as unknown as { id: string; colSpan: number; contentHtml: string }[])
            : [];
          const resolvedPageBg = (isUniversalSync ? universalMattingBgColor || page.backgroundColor : page.backgroundColor) ?? undefined;
          const pageScope = resolveContainerThemeScope({
            backgroundColor: resolvedPageBg,
            backgroundMode: resolvedPageBg ? "color" : "none",
          });
          const pageTypographyClasses = getContrastTypographyClasses(pageScope.contrastMode);

          return (
            <section
              key={page.id || pIdx}
              className={cn(
                "catalog-page catalog-magazine-page editorial-page relative rounded-3xl overflow-hidden flex flex-col justify-between print:rounded-none",
                isUniversalSync && typeof universalThickness === "number" ? "" : "p-6 sm:p-12",
                pageScope.wrapperClass,
                pageTypographyClasses
              )}
              style={{
                ...pageScope.wrapperStyle,
                aspectRatio: `${geometry.ratio}`,
                ...(resolvedPageBg ? { backgroundColor: resolvedPageBg } : {}),
                ...(isUniversalSync && typeof universalThickness === "number" ? { padding: `${universalThickness}px` } : {}),
              }}
            >
              {bgLayerNode}
              <div
                className={`catalog-frame relative z-10 ${pageFrameClass} p-6 sm:p-10 rounded-2xl flex flex-col justify-between h-full bg-card/40 backdrop-blur-xs`}
                style={isUniversalSync && universalInnerBorder ? { borderColor: universalInnerBorder } : undefined}
              >
                {/* Editorial Page Header */}
                {(page.title || page.subtitle) && (
                  <div className="border-b border-primary/20 pb-4 mb-4">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
                        Editorial Monograph • Page {page.pageNumber || pIdx + 1}
                      </span>
                      <BookOpen className="w-4 h-4 text-primary shrink-0" />
                    </div>
                    {page.title && (
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold leading-tight">
                        {page.title}
                      </h2>
                    )}
                    {page.subtitle && (
                      <p className="text-xs sm:text-sm font-serif italic text-muted-foreground mt-1">
                        {page.subtitle}
                      </p>
                    )}
                  </div>
                )}

                {/* Editorial Multi-Segment Content Layout */}
                <div className={`magazine-layout-container flex-1 overflow-visible md:overflow-y-auto print:overflow-visible font-serif leading-relaxed py-2 ${gridClass}`}>
                  {segments.length > 0 ? (
                    segments.map((seg, sIdx) => (
                      <div
                        key={seg.id || sIdx}
                        className={cn("magazine-col font-serif leading-relaxed overflow-visible md:overflow-y-auto print:overflow-visible text-justify", pageTypographyClasses)}
                      >
                        <TiptapRenderer
                          content={seg.contentHtml}
                          contrast={pageScope.contrastMode}
                          catalogPageSize={geometry.size}
                          catalogOrientation={geometry.orientation}
                        />
                      </div>
                    ))
                  ) : page.contentHtml ? (
                    <div className={cn("magazine-col font-serif leading-relaxed overflow-visible md:overflow-y-auto print:overflow-visible text-justify", pageTypographyClasses)}>
                      <TiptapRenderer
                        content={page.contentHtml}
                        contrast={pageScope.contrastMode}
                        catalogPageSize={geometry.size}
                        catalogOrientation={geometry.orientation}
                      />
                    </div>
                  ) : (
                    <p className="italic text-muted-foreground">No editorial content compiled for this page.</p>
                  )}
                </div>

                {/* Editorial Page Footer Stamp */}
                <div className="pt-3 border-t border-primary/20 flex items-center justify-between text-[11px] font-mono text-muted-foreground mt-auto">
                  <span>{catalog.title} • Atelier Monograph</span>
                  <span>Page {page.pageNumber || pIdx + 1}</span>
                </div>
              </div>
            </section>
          );
        })}

        {/* ------------------------------------------------------------------ */}
        {/* PAGES 3 to N: ARTWORK PLATES (Strictly 1 Masterwork Per Page)      */}
        {/* ------------------------------------------------------------------ */}
        {catalog.items.map((item, idx) => {
          const layoutMode = item.plateLayout || catalog.plateLayout || "SIDE_BY_SIDE";
          const displayTitle = item.customTitle?.trim() || item.artwork.title;
          const categoryName = item.artwork.category?.name || "Traditional Indian School";
          const displaySubtitle = item.customSubtitle?.trim() || "";
          const showPlateNumber = item.showPlateNumber !== false;

          return (
            <section
              key={item.id}
              className={cn(
                "catalog-page plate-page relative rounded-3xl overflow-hidden flex flex-col justify-between print:rounded-none",
                !syncArtworkPlates && "p-6 sm:p-10"
              )}
              style={{
                aspectRatio: `${geometry.ratio}`,
                ...(syncArtworkPlates ? { backgroundColor: coverOuterBorderColor, padding: `${coverMattingPadding}px` } : {}),
              }}
            >
              <CatalogBackgroundLayer
                fallbackBgMode={bgMode}
                fallbackPattern={pattern}
                fallbackPatternOpacity={patternOpacity}
                fallbackBgImage={bgImage}
                fallbackOverlayOpacity={overlayOpacity}
              />
              <div
                className={`catalog-frame relative z-10 ${frameClass} p-6 sm:p-8 rounded-2xl flex flex-col justify-between h-full bg-[#FAF7F2] dark:bg-card/40 print:bg-[#FAF7F2]`}
                style={{
                  backgroundColor: "#FAF7F2",
                  ...(syncArtworkPlates && coverInnerBorderColor ? { borderColor: coverInnerBorderColor } : {}),
                }}
              >
                {/* Plate Header (Plate number & Traditional school) */}
                <div className="flex items-center justify-between border-b border-primary/20 pb-2.5 mb-2">
                  {showPlateNumber ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/15 text-primary font-mono font-bold text-xs flex items-center justify-center border border-primary/30">
                        {item.pageNumber || idx + 1}
                      </div>
                      <span className="text-xs font-mono uppercase text-muted-foreground font-semibold">
                        Plate {item.pageNumber || idx + 1} of {catalog.items.length}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-mono uppercase text-primary/80 font-medium tracking-wide">
                      Masterwork Plate
                    </span>
                  )}
                  <span className="text-xs font-mono text-primary font-bold uppercase">
                    {item.artwork.category?.name || "Traditional Indian School"}
                  </span>
                </div>

                {/* Conditional Plate Layout */}
                {layoutMode === "TOP_LEFT_FLOW" ? (
                  /* TOP-LEFT ARTWORK WITH WRAPPED TEXT ARCHETYPE (Eliminates text truncation) */
                  <div className="plate-body-flow flex-1 my-auto w-full text-left overflow-visible md:overflow-y-auto print:overflow-visible">
                    <div className="float-left mr-8 mb-4 max-w-[45%] w-auto max-h-[56vh] print:max-h-[50vh] plate-image-float">
                      <div className="relative rounded-xl overflow-hidden border border-primary/20 bg-background/50 shadow-2xl group">
                        <ProtectedImage
                          useImg={true}
                          priority={true}
                          loading="eager"
                          decoding="sync"
                          src={item.artwork.watermarkedWebpUrl || item.artwork.primaryImageUrl}
                          alt={displayTitle}
                          className="max-h-[52vh] print:max-h-[46vh] max-w-full w-auto object-contain rounded shadow-2xl mx-auto group-hover:scale-101 transition-transform duration-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        {displaySubtitle && (
                          <span className="inline-block px-2.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary border border-primary/30 rounded mb-1.5 font-mono uppercase tracking-wider">
                            {displaySubtitle}
                          </span>
                        )}
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-serif text-foreground font-bold leading-tight">
                          {displayTitle}
                        </h3>
                        {item.artwork.yearCreated && (
                          <p className="text-sm text-stone-400 font-serif mt-1">
                            Year: {item.artwork.yearCreated}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-foreground/90 border-t border-primary/20 pt-2.5">
                        <p>
                          <strong className="text-muted-foreground font-mono text-[11px] uppercase mr-1">Materials:</strong>
                          <span>{item.artwork.materials || item.artwork.medium || "Natural Mineral Pigments & Gold Foil"}</span>
                        </p>
                        {item.artwork.surface && item.artwork.surface.trim() !== "" && (
                          <p>
                            <strong className="text-muted-foreground font-mono text-[11px] uppercase mr-1">Surface:</strong>
                            <span>{item.artwork.surface}</span>
                          </p>
                        )}
                        {item.artwork.dimensions && (
                          <p>
                            <strong className="text-muted-foreground font-mono text-[11px] uppercase mr-1">Dimensions:</strong>
                            <span>{item.artwork.dimensions}</span>
                          </p>
                        )}
                        {item.artwork.goldPurity && (
                          <p>
                            <strong className="text-muted-foreground font-mono text-[11px] uppercase mr-1">Gold Leaf:</strong>
                            <span>{item.artwork.goldPurity}</span>
                          </p>
                        )}
                      </div>

                      {(item.curatorialNote || item.artwork.description) && (
                        <div className="border-t border-primary/20 pt-3">
                          {item.curatorialNote ? (
                            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed italic bg-muted/20 p-3 rounded-lg border border-border/60">
                              &ldquo;{item.curatorialNote}&rdquo;
                            </p>
                          ) : (
                              <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-serif text-justify">
                                <TiptapRenderer
                                  content={item.artwork.description!}
                                  catalogPageSize={geometry.size}
                                  catalogOrientation={geometry.orientation}
                                />
                              </div>
                          )}
                        </div>
                      )}

                      <div className="print-hidden pt-2 clear-both flex flex-wrap items-center gap-3">
                        <Link
                          href={`/artwork/${item.artwork.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
                        >
                          View Full Masterwork Archive <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : layoutMode === "SIDE_BY_SIDE" ? (
                  (() => {
                    const ratio = item.plateRatio || catalog.plateRatio || "55:45";
                    let gridTemplateColumns = "53% 43%";
                    let ratioClass = "plate-ratio-55-45";
                    if (ratio === "40:60") {
                      gridTemplateColumns = "38% 58%";
                      ratioClass = "plate-ratio-40-60";
                    } else if (ratio === "45:55") {
                      gridTemplateColumns = "43% 53%";
                      ratioClass = "plate-ratio-45-55";
                    } else if (ratio === "50:50") {
                      gridTemplateColumns = "48% 48%";
                      ratioClass = "plate-ratio-50-50";
                    } else if (ratio === "60:40") {
                      gridTemplateColumns = "58% 38%";
                      ratioClass = "plate-ratio-60-40";
                    }

                    return (
                      <div
                        className={cn("catalog-plate-body plate-body-grid flex-1 my-auto overflow-hidden w-full", ratioClass)}
                        style={{
                          display: "grid",
                          gridTemplateColumns,
                          gap: "4%",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        {/* Left Column: Framed Masterwork Plate */}
                        <div className="plate-image-col flex items-center justify-center max-h-none md:max-h-[64vh] print:max-h-[60vh] w-full">
                          <div className="relative rounded-xl overflow-hidden border border-primary/20 bg-background/50 shadow-2xl group max-h-full">
                            <ProtectedImage
                              useImg={true}
                              priority={true}
                              loading="eager"
                              decoding="sync"
                              src={item.artwork.watermarkedWebpUrl || item.artwork.primaryImageUrl}
                              alt={displayTitle}
                              className="max-h-[48vh] md:max-h-[58vh] print:max-h-[56vh] max-w-full w-auto object-contain rounded shadow-2xl mx-auto group-hover:scale-101 transition-transform duration-500"
                            />
                          </div>
                        </div>

                        {/* Right Column: Curatorial Details & Specifications */}
                        <div className="plate-details-col flex flex-col justify-center space-y-3 text-left w-full overflow-visible md:overflow-y-auto print:overflow-visible max-h-none md:max-h-[64vh] print:max-h-none">
                          <div>
                            {displaySubtitle && (
                              <span className="inline-block px-2.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary border border-primary/30 rounded mb-2 font-mono uppercase tracking-wider">
                                {displaySubtitle}
                              </span>
                            )}
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-serif text-foreground font-bold leading-tight">
                              {displayTitle}
                            </h3>
                            {item.artwork.yearCreated && (
                              <p className="text-sm text-stone-400 font-serif mt-1">
                                Year: {item.artwork.yearCreated}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1.5 text-xs text-foreground/90 border-t border-primary/20 pt-3">
                            <p>
                              <strong className="text-muted-foreground font-mono text-[11px] uppercase mr-1">Materials:</strong>
                              <span>{item.artwork.materials || item.artwork.medium || "Natural Mineral Pigments & Gold Foil"}</span>
                            </p>
                            {item.artwork.surface && item.artwork.surface.trim() !== "" && (
                              <p>
                                <strong className="text-muted-foreground font-mono text-[11px] uppercase mr-1">Surface:</strong>
                                <span>{item.artwork.surface}</span>
                              </p>
                            )}
                            {item.artwork.dimensions && (
                              <p>
                                <strong className="text-muted-foreground font-mono text-[11px] uppercase mr-1">Dimensions:</strong>
                                <span>{item.artwork.dimensions}</span>
                              </p>
                            )}
                            {item.artwork.goldPurity && (
                              <p>
                                <strong className="text-muted-foreground font-mono text-[11px] uppercase mr-1">Gold Leaf:</strong>
                                <span>{item.artwork.goldPurity}</span>
                              </p>
                            )}
                          </div>

                          {(item.curatorialNote || item.artwork.description) && (
                            <div className="border-t border-primary/20 pt-3">
                              {item.curatorialNote ? (
                                <p className="text-xs text-foreground/90 leading-relaxed italic bg-muted/20 p-3 rounded-lg border border-border/60">
                                  &ldquo;{item.curatorialNote}&rdquo;
                                </p>
                              ) : (
                                  <div className="text-xs text-foreground/90 leading-relaxed font-serif">
                                    <TiptapRenderer
                                      content={item.artwork.description!}
                                      catalogPageSize={geometry.size}
                                      catalogOrientation={geometry.orientation}
                                    />
                                  </div>
                              )}
                            </div>
                          )}

                          <div className="print-hidden pt-1 flex flex-wrap items-center gap-3">
                            <Link
                              href={`/artwork/${item.artwork.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
                            >
                              View Full Masterwork Archive <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* STACKED LAYOUT FALLBACK */
                  <div className="plate-body-stacked flex flex-col items-center justify-between flex-1 my-auto w-full">
                    {/* Centered Visual Container */}
                    <div className="plate-image-container py-2 flex-1 flex items-center justify-center">
                      <div className="relative rounded-xl overflow-hidden border border-primary/20 bg-background/50 shadow-md group max-h-[50vh] print:max-h-[52vh]">
                        <ProtectedImage
                          useImg={true}
                          priority={true}
                          loading="eager"
                          decoding="sync"
                          src={item.artwork.watermarkedWebpUrl || item.artwork.primaryImageUrl}
                          alt={displayTitle}
                          className="w-full h-auto object-contain max-h-[48vh] print:max-h-[52vh] mx-auto group-hover:scale-101 transition-transform duration-500"
                        />
                      </div>
                    </div>

                    {/* Plate Specifications & Curatorial Commentary */}
                    <div className="pt-3 border-t border-primary/20 space-y-2.5 w-full text-left">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                        <div>
                          <h3 className="text-xl sm:text-2xl font-serif font-bold text-foreground leading-tight">
                            {displayTitle}
                          </h3>
                          <p className="text-xs text-stone-400 font-sans mt-0.5">
                            {[
                              displaySubtitle,
                              item.artwork.materials || item.artwork.medium,
                              item.artwork.surface ? `Surface: ${item.artwork.surface}` : "",
                              item.artwork.dimensions,
                              item.artwork.yearCreated ? String(item.artwork.yearCreated) : "",
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        </div>
                        <div className="print-hidden">
                          <Link
                            href={`/artwork/${item.artwork.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
                          >
                            {(catalog as unknown as { provenanceLabel?: string }).provenanceLabel || "Archive Provenance"} <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      </div>

                      {item.curatorialNote ? (
                        <p className="text-xs text-foreground/90 leading-relaxed italic bg-muted/20 p-2.5 rounded-lg border border-border/60">
                          &ldquo;{item.curatorialNote}&rdquo;
                        </p>
                      ) : item.artwork.description ? (
                        <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          <TiptapRenderer
                            content={item.artwork.description}
                            catalogPageSize={geometry.size}
                            catalogOrientation={geometry.orientation}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Bottom Footer Stamp */}
                <div className="text-[10px] text-muted-foreground/70 text-center border-t border-primary/20 pt-2 mt-auto flex items-center justify-between">
                  <span>{(catalog as unknown as { archiveStampText?: string }).archiveStampText || `© ${catalog.title} • ${settings?.siteName || "SavazAI"} Fine Art Archive`}</span>
                  {showPlateNumber ? (
                    <span className="font-mono text-[9px] uppercase tracking-wider">
                      Plate {item.pageNumber || idx + 1}
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] uppercase tracking-wider">
                      Atelier Monograph
                    </span>
                  )}
                </div>
              </div>
            </section>
          );
        })}

        {/* ------------------------------------------------------------------ */}
        {/* FINAL PAGE: COLOPHON & ATELIER HERITAGE (Multi-Mode Parity)        */}
        {/* ------------------------------------------------------------------ */}
        {endPageConfig.isEnabled !== false && (
          endMode === "MATRIX" && endPageConfig.matrixConfig ? (
            (() => {
              const mc = endPageConfig.matrixConfig as Record<string, unknown>;
              const matrixSegments = Array.isArray(mc.segments)
                ? (mc.segments as unknown as { id: string; row: number; col: number; rowSpan?: number; colSpan?: number; title?: string; contentHtml: string }[])
                : [];
              return (
                <CatalogMatrixPage
                  pageNumber="End"
                  pageTitle={(endPageConfig.title as string) || "Colophon & Atelier Heritage"}
                  pageSubtitle="Publication Details & Atelier Lineage"
                  matrixRows={(mc.matrixRows as number) || 2}
                  matrixCols={(mc.matrixCols as number) || 2}
                  rowHeights={mc.rowHeights as string | undefined}
                  colWidths={mc.colWidths as string | undefined}
                  hasHeader={Boolean(mc.hasHeader)}
                  headerHtml={mc.headerHtml as string | undefined}
                  hasFooter={Boolean(mc.hasFooter)}
                  footerHtml={mc.footerHtml as string | undefined}
                  verticalSpineMode={(mc.verticalSpineMode as string) || "NONE"}
                  verticalSpineHtml={mc.verticalSpineHtml as string | undefined}
                  verticalSpineWidth={mc.verticalSpineWidth as string | undefined}
                  segments={matrixSegments}
                  frameClass={endFrameClass}
                  backgroundColor={isUniversalSync ? universalMattingBgColor || endBgColor : endBgColor}
                  canvasBgColor={activeCoverCanvasBg}
                  outerBorderColor={isUniversalSync ? universalOuterBorder : undefined}
                  innerBorderColor={isUniversalSync ? universalInnerBorder : undefined}
                  mattingPadding={isUniversalSync && typeof universalThickness === "number" ? universalThickness : undefined}
                  backgroundLayer={
                    <CatalogBackgroundLayer
                      bgType={endBgType}
                      patternId={endBgPattern}
                      patternOpacity={endPatternOpacity}
                      bgImage={endBgImage}
                      overlayOpacity={endOverlayOpacity}
                      fallbackBgMode={bgMode}
                      fallbackPattern={pattern}
                      fallbackPatternOpacity={patternOpacity}
                      fallbackBgImage={bgImage}
                      fallbackOverlayOpacity={overlayOpacity}
                    />
                  }
                  catalogTitle={catalog.title}
                  fallbackContentHtml={endPageConfig.contentHtml as string}
                  aspectRatio={geometry.ratio}
                />
              );
            })()
          ) : endMode === "SINGLE_PLATE" && (endSinglePlateConfig.primaryImageUrl || (endPageConfig.primaryImageUrl as string)) ? (
            <CatalogSinglePlateView
              primaryImageUrl={(endSinglePlateConfig.primaryImageUrl as string) || (endPageConfig.primaryImageUrl as string)}
              presentation={(endSinglePlateConfig.presentation as "contained" | "full-bleed") || "contained"}
              canvasBgColor={activeCoverCanvasBg}
              outerMattingColor={isUniversalSync ? universalMattingBgColor : (endSinglePlateConfig.outerMattingColor as string)}
              mattingBgColor={isUniversalSync ? universalMattingBgColor || endBgColor : (endSinglePlateConfig.mattingBgColor as string) || endBgColor}
              focalPosition={endSinglePlateConfig.focalPosition as string}
              headerSlot={endSinglePlateConfig.headerSlot as SpineDecoratorSlot}
              footerSlot={endSinglePlateConfig.footerSlot as SpineDecoratorSlot}
              leftSpineSlot={endSinglePlateConfig.leftSpineSlot as SpineDecoratorSlot}
              rightSpineSlot={endSinglePlateConfig.rightSpineSlot as SpineDecoratorSlot}
              frameClass={endFrameClass}
              aspectRatio={geometry.ratio}
              innerBorderColor={isUniversalSync ? universalInnerBorder : (endSinglePlateConfig.innerBorderColor as string)}
              mattingPadding={isUniversalSync && typeof universalThickness === "number" ? universalThickness : 24}
              backgroundLayer={
                <CatalogBackgroundLayer
                  bgType={endBgType}
                  patternId={endBgPattern}
                  patternOpacity={endPatternOpacity}
                  bgImage={endBgImage}
                  overlayOpacity={endOverlayOpacity}
                  fallbackBgMode={bgMode}
                  fallbackPattern={pattern}
                  fallbackPatternOpacity={patternOpacity}
                  fallbackBgImage={bgImage}
                  fallbackOverlayOpacity={overlayOpacity}
                />
              }
            >
              <div className="space-y-3 pt-4 text-center">
                <span
                  className="text-xs font-mono uppercase tracking-widest font-bold"
                  style={{ color: (coverConfig.eyebrowColor as string) || "#B45309" }}
                >
                  {colophonEyebrow}
                </span>
                <h2
                  className="text-2xl sm:text-3xl font-serif font-bold"
                  style={{
                    color:
                      (endPageConfig.colophonTitleColor as string) ||
                      (coverConfig.titleColor as string) ||
                      "#0F172A",
                  }}
                >
                  {colophonTitle}
                </h2>
              </div>

              <div
                className="pt-6 border-t border-primary/20 space-y-2 text-xs font-mono text-center mt-auto"
                style={{
                  color:
                    (endPageConfig.colophonTextColor as string) ||
                    (coverConfig.subtitleColor as string) ||
                    "#334155",
                }}
              >
                <p>
                  {(endPageConfig.contactDetails as string) ||
                    `Atelier Fine Art Publishing • ${settings?.contactEmail || "contact@savazar.com"} • All rights reserved.`}
                </p>
                <p className="text-[10px] opacity-75">
                  {colophonLegalNotice}
                </p>
              </div>
            </CatalogSinglePlateView>
          ) : (() => {
            const endScope = resolveContainerThemeScope({
              backgroundColor: isUniversalSync ? universalMattingBgColor || endBgColor : endBgColor,
              backgroundImage: endBgImage,
              backgroundType: endBgType,
              overlayOpacity: endOverlayOpacity,
            });

            return (
              <section
                className={cn(
                  "catalog-page end-page relative rounded-3xl overflow-hidden flex flex-col justify-between print:rounded-none",
                  isUniversalSync && typeof universalThickness === "number" ? "" : "p-6 sm:p-12",
                  endScope.wrapperClass
                )}
                style={{
                  aspectRatio: `${geometry.ratio}`,
                  ...((isUniversalSync ? universalMattingBgColor || endBgColor : endBgColor) ? { backgroundColor: isUniversalSync ? universalMattingBgColor || endBgColor : endBgColor } : {}),
                  ...endScope.wrapperStyle,
                  ...(isUniversalSync && typeof universalThickness === "number" ? { padding: `${universalThickness}px` } : {}),
                }}
              >
                <CatalogBackgroundLayer
                  bgType={endBgType}
                  patternId={endBgPattern}
                  patternOpacity={endPatternOpacity}
                  bgImage={endBgImage}
                  overlayOpacity={endOverlayOpacity}
                  fallbackBgMode={bgMode}
                  fallbackPattern={pattern}
                  fallbackPatternOpacity={patternOpacity}
                  fallbackBgImage={bgImage}
                  fallbackOverlayOpacity={overlayOpacity}
                />
                <div
                  className={`catalog-frame relative z-10 ${endFrameClass} p-6 sm:p-10 rounded-2xl flex flex-col justify-between h-full bg-card/40 backdrop-blur-xs text-center space-y-6`}
                  style={isUniversalSync && universalInnerBorder ? { borderColor: universalInnerBorder } : undefined}
                >
                  <div className="space-y-3 pt-4">
                    <span
                      className="text-xs font-mono uppercase tracking-widest font-bold"
                      style={{ color: (coverConfig.eyebrowColor as string) || "#B45309" }}
                    >
                      {colophonEyebrow}
                    </span>
                    <h2
                      className="text-2xl sm:text-3xl font-serif font-bold"
                      style={{
                        color:
                          (endPageConfig.colophonTitleColor as string) ||
                          (coverConfig.titleColor as string) ||
                          "#0F172A",
                      }}
                    >
                      {colophonTitle}
                    </h2>
                  </div>

                  <div
                    className={cn("font-serif leading-relaxed max-w-xl mx-auto flex-1 flex flex-col justify-center", endScope.typographyClass)}
                    style={{
                      color:
                        (endPageConfig.colophonTextColor as string) ||
                        (coverConfig.subtitleColor as string) ||
                        "#334155",
                    }}
                  >
                    {endPageConfig.contentHtml ? (
                      <TiptapRenderer
                        content={endPageConfig.contentHtml as string}
                        contrast={endScope.contrastMode}
                        catalogPageSize={geometry.size}
                        catalogOrientation={geometry.orientation}
                      />
                    ) : (
                      <p>
                        Published by the Atelier of Fine Art. Dedicated to the preservation of authentic cultural heritage and sacred iconography.
                      </p>
                    )}
                  </div>

                <div
                  className="pt-6 border-t border-primary/20 space-y-2 text-xs font-mono"
                  style={{
                    color:
                      (endPageConfig.colophonTextColor as string) ||
                      (coverConfig.subtitleColor as string) ||
                      "#334155",
                  }}
                >
                  <p>
                    {(endPageConfig.contactDetails as string) ||
                      `Atelier Fine Art Publishing • ${settings?.contactEmail || "contact@savazar.com"} • All rights reserved.`}
                  </p>
                  <p className="text-[10px] opacity-75">
                    {colophonLegalNotice}
                  </p>
                </div>
              </div>
            </section>
            );
          })()
        )}
      </main>

      <div className="print-hidden">
        <Footer />
      </div>
    </div>
  );
}
