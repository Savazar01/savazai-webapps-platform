"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  BookOpen,
  Palette,
  FileText,
  Image as ImageIcon,
  Check,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Loader2,
  Eye,
  FileDown,
  Star,
  Search,
  Sparkles,
  LayoutTemplate,
  QrCode,
  Download,
  ChevronDown,
  Sliders,
  Sun,
  Moon,
  RotateCcw,
  Printer,
} from "lucide-react";
import { ArtworkPlacardSheet, type PlacardArtwork } from "@/components/admin/artwork-placard-sheet";
import {
  ECatalogThemeTokens,
  DEFAULT_CATALOG_THEME_TOKENS,
  type EditorialPageMode,
  type SpineDecoratorSlot,
  type UniversalPageConfig,
} from "@/types/catalog";
import {
  CatalogSinglePlateEditor,
  EditorialModeSwitcher,
  type SinglePlateConfigState,
} from "@/components/admin/catalog-single-plate-editor";
import {
  PAGE_SIZE_OPTIONS,
  getCatalogDimensions,
  type CatalogPageSize,
  type CatalogOrientation,
} from "@/lib/catalog-geometry";
import { printIsolatedHtml } from "@/lib/print-isolated-html";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MediaUploader } from "@/components/admin/media-uploader";
import { TiptapEditor } from "@/components/builder/tiptap-editor";
import { AiAssistantModal } from "@/components/admin/ai-assistant-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { BACKGROUND_PATTERNS } from "@/lib/background-patterns";
import {
  CatalogBackgroundControl,
  type CatalogBackgroundConfig,
} from "@/components/admin/catalog-background-control";
import {
  CatalogMatrixStudio,
  reconcileMatrixCells,
  type MatrixCellSegment,
  type CatalogMatrixConfig,
} from "@/components/admin/catalog-matrix-studio";

export type MagazineLayoutType =
  | "1_COL"
  | "2_COL"
  | "ASYMMETRIC_70_30"
  | "ASYMMETRIC_30_70"
  | "3_COL"
  | "4_COL"
  | "6_COL"
  | "MATRIX";

export interface CustomPageSegment {
  id: string;
  title?: string;
  contentHtml: string;
  image?: string;
  caption?: string;
  widthRatio?: string;
}

export function getColumnCount(layout: MagazineLayoutType): number {
  switch (layout) {
    case "1_COL":
      return 1;
    case "2_COL":
    case "ASYMMETRIC_70_30":
    case "ASYMMETRIC_30_70":
      return 2;
    case "3_COL":
      return 3;
    case "4_COL":
      return 4;
    case "6_COL":
      return 6;
    default:
      return 2;
  }
}

export function initSegmentsForLayout(
  layout: MagazineLayoutType,
  existingSegments?: CustomPageSegment[],
  fallbackHtml?: string
): CustomPageSegment[] {
  const count = getColumnCount(layout);
  const segments: CustomPageSegment[] = [];

  for (let i = 0; i < count; i++) {
    if (existingSegments && existingSegments[i]) {
      segments.push(existingSegments[i]);
    } else if (i === 0 && fallbackHtml) {
      segments.push({
        id: `seg-${i}-${Date.now()}`,
        title: `Column ${i + 1}`,
        contentHtml: fallbackHtml,
      });
    } else {
      segments.push({
        id: `seg-${i}-${Date.now() + i}`,
        title: `Column ${i + 1}`,
        contentHtml: "",
      });
    }
  }
  return segments;
}

interface ArtworkOption {
  id: string;
  title: string;
  slug: string;
  primaryImageUrl: string;
  materials?: string | null;
  surface?: string | null;
  medium: string | null;
  dimensions: string | null;
  yearCreated: number | null;
  price?: number | string | null;
  currency?: string | null;
  category?: {
    name: string;
  };
}

interface CatalogPlate {
  id?: string;
  artworkId: string;
  pageNumber: number;
  curatorialNote?: string | null;
  highlightPlate: boolean;
  plateLayout?: "SIDE_BY_SIDE" | "STACKED" | "TOP_LEFT_FLOW" | null;
  plateRatio?: "40:60" | "45:55" | "50:50" | "55:45" | "60:40" | null;
  customTitle?: string | null;
  customSubtitle?: string | null;
  showPlateNumber?: boolean;
  artwork: ArtworkOption;
}

interface ECatalogThemeConfig {
  backgroundMode?: "COLOR" | "PATTERN" | "IMAGE";
  backgroundColor?: string;
  backgroundPattern?: string;
  patternOpacity?: number;
  backgroundImage?: string;
  overlayOpacity?: number;
  textColor?: string;
  frameStyle?: "none" | "gold-fillet" | "double-fillet" | "silk-border";
  accentColor?: string;
  readerTheme?: ECatalogThemeTokens;
}

interface ECatalogCoverConfig extends CatalogBackgroundConfig {
  mode?: EditorialPageMode;
  showDate?: boolean;
  showCurator?: boolean;
  coverDesignMode?: "IMAGE_PLATE" | "WYSIWYG" | "MATRIX";
  contentHtml?: string;
  useMatrixLayout?: boolean;
  matrixConfig?: CatalogMatrixConfig;
  singlePlateConfig?: SinglePlateConfigState;
  borderConfig?: {
    outerColor?: string;
    innerColor?: string;
    thicknessPx?: number;
    mattingBgColor?: string;
    canvasBgColor?: string;
    syncGlobal?: boolean;
    syncArtworkPlates?: boolean;
  };
  syncGlobal?: boolean;
  syncArtworkPlates?: boolean;
  headerSlot?: SpineDecoratorSlot;
  footerSlot?: SpineDecoratorSlot;
  leftSpineSlot?: SpineDecoratorSlot;
  rightSpineSlot?: SpineDecoratorSlot;
  coverMattingColor?: string;
  mattingBgColor?: string;
  innerBorderColor?: string;
  mattingPadding?: number;
  coverBgColor?: string;
  coverTextColor?: string;
  titleColor?: string;
  titleFont?: string;
  subtitleColor?: string;
  subtitleFont?: string;
  eyebrowColor?: string;
  eyebrowText?: string;
  coverEyebrowText?: string;
  hideCoverEyebrow?: boolean;
  coverFooterNote?: string;
  hideCoverFooter?: boolean;
  imagePlatePresentation?: "contained" | "full-bleed";
  imageFocalPosition?: string;
}

interface ECatalogEssayConfig extends CatalogBackgroundConfig {
  mode?: EditorialPageMode;
  title?: string;
  footerLabel?: string;
  contentHtml?: string;
  useMatrixLayout?: boolean;
  matrixConfig?: CatalogMatrixConfig;
  singlePlateConfig?: SinglePlateConfigState;
  borderConfig?: {
    outerColor?: string;
    innerColor?: string;
    thicknessPx?: number;
    mattingBgColor?: string;
    canvasBgColor?: string;
    syncGlobal?: boolean;
    syncArtworkPlates?: boolean;
  };
}

interface ECatalogEndPageConfig extends CatalogBackgroundConfig {
  mode?: EditorialPageMode;
  isEnabled?: boolean;
  title?: string;
  eyebrowText?: string;
  contentHtml?: string;
  contactDetails?: string;
  legalNotice?: string;
  useMatrixLayout?: boolean;
  matrixConfig?: CatalogMatrixConfig;
  singlePlateConfig?: SinglePlateConfigState;
  borderConfig?: {
    outerColor?: string;
    innerColor?: string;
    thicknessPx?: number;
    mattingBgColor?: string;
    canvasBgColor?: string;
    syncGlobal?: boolean;
    syncArtworkPlates?: boolean;
  };
  endPageBgColor?: string;
  colophonTitleColor?: string;
  colophonTextColor?: string;
}

interface ECatalogCustomPageItem extends CatalogBackgroundConfig {
  id?: string;
  pageNumber: number;
  title: string;
  subtitle: string;
  mode?: EditorialPageMode;
  layoutType: MagazineLayoutType;
  pageLayout?: string;
  contentHtml?: string;
  singlePlateConfig?: SinglePlateConfigState;
  pageConfig?: UniversalPageConfig;
  borderConfig?: {
    outerColor?: string;
    innerColor?: string;
    thicknessPx?: number;
    mattingBgColor?: string;
    syncGlobal?: boolean;
  };
  segments: CustomPageSegment[];
  matrixRows?: number;
  matrixCols?: number;
  rowHeights?: string;
  colWidths?: string;
  hasHeader?: boolean;
  headerHtml?: string | null;
  hasFooter?: boolean;
  footerHtml?: string | null;
  verticalSpineMode?: "NONE" | "LEFT" | "RIGHT";
  verticalSpineHtml?: string | null;
  verticalSpineWidth?: string;
  matrixSegments?: MatrixCellSegment[];
}

interface ECatalogDetail {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  curatorialEssay: string | null;
  forewordBy: string | null;
  coverImageUrl: string | null;
  themeColor: string;
  orientation?: string;
  pageSize?: string;
  plateLayout?: "SIDE_BY_SIDE" | "STACKED" | "TOP_LEFT_FLOW";
  plateRatio?: "40:60" | "45:55" | "50:50" | "55:45" | "60:40";
  themeConfig?: ECatalogThemeConfig | null;
  coverConfig?: ECatalogCoverConfig | null;
  essayConfig?: ECatalogEssayConfig | null;
  endPageConfig?: ECatalogEndPageConfig | null;
  isPublished: boolean;
  downloadablePdfUrl: string | null;
  eventId: string | null;
  event?: {
    id: string;
    title: string;
  } | null;
  customPages?: ECatalogCustomPageItem[];
  items: CatalogPlate[];
}

export default function AdminCatalogStudioPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [catalog, setCatalog] = React.useState<ECatalogDetail | null>(null);
  const [availableArtworks, setAvailableArtworks] = React.useState<ArtworkOption[]>([]);
  const [events, setEvents] = React.useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);

  // Studio form state
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [curatorialEssay, setCuratorialEssay] = React.useState("");
  const [forewordBy, setForewordBy] = React.useState("");
  const [coverImageUrl, setCoverImageUrl] = React.useState("");
  const [themeColor, setThemeColor] = React.useState("gold");
  const [pageSize, setPageSize] = React.useState<CatalogPageSize>("A4");
  const [orientation, setOrientation] = React.useState<"portrait" | "landscape">("portrait");
  const [plateLayout, setPlateLayout] = React.useState<"SIDE_BY_SIDE" | "STACKED" | "TOP_LEFT_FLOW">("SIDE_BY_SIDE");
  const [plateRatio, setPlateRatio] = React.useState<"40:60" | "45:55" | "50:50" | "55:45" | "60:40">("55:45");
  const [isPublished, setIsPublished] = React.useState(false);
  const [downloadablePdfUrl, setDownloadablePdfUrl] = React.useState("");
  const [eventId, setEventId] = React.useState<string>("none");

  // Advanced Layout, Framing & Publication configs
  const [themeConfig, setThemeConfig] = React.useState<ECatalogThemeConfig>({
    backgroundMode: "COLOR",
    backgroundColor: "#1C1814",
    backgroundPattern: "mandala-filigree",
    patternOpacity: 0.15,
    backgroundImage: "",
    overlayOpacity: 0.5,
    textColor: "#FAF7F2",
    frameStyle: "gold-fillet",
    accentColor: "#D4AF37",
    readerTheme: DEFAULT_CATALOG_THEME_TOKENS,
  });

  const [coverConfig, setCoverConfig] = React.useState<ECatalogCoverConfig>({
    backgroundColor: "#1C1814",
    coverBgColor: "#FAF7F2",
    backgroundImage: "",
    frameStyle: "gold-fillet",
    showDate: true,
    showCurator: true,
    titleColor: "#0F172A",
    titleFont: "var(--font-cinzel), serif",
    subtitleColor: "#334155",
    subtitleFont: "var(--font-cinzel), serif",
    eyebrowColor: "#B45309",
  });

  const [readerThemeMode, setReaderThemeMode] = React.useState<"light" | "dark">("light");

  const [essayConfig, setEssayConfig] = React.useState<ECatalogEssayConfig>({
    title: "Curatorial Monograph & Scholarly Statement",
    backgroundImage: "",
    backgroundColor: "#1C1814",
    frameStyle: "gold-fillet",
  });

  const [endPageConfig, setEndPageConfig] = React.useState<ECatalogEndPageConfig>({
    isEnabled: true,
    title: "Colophon & Atelier Heritage",
    contentHtml: "<p>Published by SavazAI Atelier. Specializing in classical fine art, 22k gold leaf iconography and classical musicianship.</p><p>For acquisitions, private viewing recitals, or scholarly monograph requests, contact the studio directly.</p>",
    backgroundImage: "",
    backgroundColor: "#FAF7F2",
    endPageBgColor: "#FAF7F2",
    colophonTitleColor: "#0F172A",
    colophonTextColor: "#334155",
    frameStyle: "gold-fillet",
    contactDetails: "Email: contact@savazar.com | Web: savazar.com",
  });

  // Artwork plates state
  const [plates, setPlates] = React.useState<CatalogPlate[]>([]);
  const [artworkPickerOpen, setArtworkPickerOpen] = React.useState(false);
  const [artworkSearch, setArtworkSearch] = React.useState("");

  // Printable Placard Sheet State
  const [isPlacardSheetOpen, setIsPlacardSheetOpen] = React.useState(false);

  const catalogPlacardArtworks = React.useMemo<PlacardArtwork[]>(() => {
    return plates
      .filter((p) => p && p.artwork)
      .map((plate) => ({
        id: plate.artwork.id,
        title: plate.customTitle || plate.artwork.title,
        slug: plate.artwork.slug,
        materials: plate.artwork.materials || undefined,
        surface: plate.artwork.surface || undefined,
        medium: plate.artwork.medium || undefined,
        dimensions: plate.artwork.dimensions || undefined,
        yearCreated: plate.artwork.yearCreated || undefined,
        price: plate.artwork.price ?? undefined,
        currency: plate.artwork.currency ?? "INR",
        category: plate.artwork.category ? { name: plate.artwork.category.name } : undefined,
        primaryImageUrl: plate.artwork.primaryImageUrl,
        additionalNotes: plate.curatorialNote || undefined,
      }));
  }, [plates]);

  // Custom Magazine & Editorial Pages state
  const [customPages, setCustomPages] = React.useState<ECatalogCustomPageItem[]>([]);

  React.useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [catRes, artRes, evtRes] = await Promise.all([
          fetch(`/api/admin/catalogs/${id}`),
          fetch("/api/admin/artworks?limit=100"),
          fetch("/api/admin/events"),
        ]);

        const [catData, artData, evtData] = await Promise.all([
          catRes.json(),
          artRes.json(),
          evtRes.json(),
        ]);

        if (!ignore && catRes.ok && catData) {
          setCatalog(catData);
          setTitle(catData.title || "");
          setSlug(catData.slug || "");
          setSubtitle(catData.subtitle || "");
          setCuratorialEssay(catData.curatorialEssay || "");
          setForewordBy(catData.forewordBy || "");
          setCoverImageUrl(catData.coverImageUrl || "");
          setThemeColor(catData.themeColor || "gold");
          setPageSize((catData.pageSize as CatalogPageSize) || "A4");
          setOrientation(catData.orientation === "landscape" ? "landscape" : "portrait");
          setPlateLayout(
            catData.plateLayout === "STACKED"
              ? "STACKED"
              : catData.plateLayout === "TOP_LEFT_FLOW"
              ? "TOP_LEFT_FLOW"
              : "SIDE_BY_SIDE"
          );
          if (catData.plateRatio) {
            setPlateRatio(catData.plateRatio as "40:60" | "45:55" | "50:50" | "55:45" | "60:40");
          }
          if (catData.themeConfig) {
            setThemeConfig({
              backgroundMode: catData.themeConfig.backgroundMode || "COLOR",
              backgroundColor: catData.themeConfig.backgroundColor || "#1C1814",
              backgroundPattern: catData.themeConfig.backgroundPattern || "mandala-filigree",
              patternOpacity: typeof catData.themeConfig.patternOpacity === "number" ? catData.themeConfig.patternOpacity : 0.15,
              backgroundImage: catData.themeConfig.backgroundImage || "",
              overlayOpacity: typeof catData.themeConfig.overlayOpacity === "number" ? catData.themeConfig.overlayOpacity : 0.5,
              textColor: catData.themeConfig.textColor || "#FAF7F2",
              frameStyle: catData.themeConfig.frameStyle || "gold-fillet",
              accentColor: catData.themeConfig.accentColor || "#D4AF37",
            });
          }
          if (catData.coverConfig) setCoverConfig((prev) => ({ ...prev, ...catData.coverConfig }));
          if (catData.essayConfig || catData.curatorialConfig) {
            setEssayConfig((prev) => ({
              ...prev,
              ...catData.essayConfig,
              ...catData.curatorialConfig,
            }));
          }
          if (catData.endPageConfig) setEndPageConfig((prev) => ({ ...prev, ...catData.endPageConfig }));
          setIsPublished(Boolean(catData.isPublished));
          setDownloadablePdfUrl(catData.downloadablePdfUrl || "");
          setEventId(catData.eventId || "none");
          setPlates(catData.items || []);
          setCustomPages(
            (catData.customPages || []).map((cp: {
              id?: string;
              pageNumber: number;
              title?: string;
              subtitle?: string;
              layoutType?: string;
              pageLayout?: string;
              contentHtml?: string;
              segments?: CustomPageSegment[] | MatrixCellSegment[];
              matrixRows?: number;
              matrixCols?: number;
              rowHeights?: string;
              colWidths?: string;
              hasHeader?: boolean;
              headerHtml?: string | null;
              hasFooter?: boolean;
              footerHtml?: string | null;
              verticalSpineMode?: "NONE" | "LEFT" | "RIGHT";
              verticalSpineHtml?: string | null;
              verticalSpineWidth?: string;
              backgroundType?: "COLOR" | "PATTERN" | "IMAGE";
              backgroundColor?: string;
              backgroundPattern?: string;
              patternOpacity?: number;
              backgroundImage?: string;
              overlayOpacity?: number;
              frameStyle?: "none" | "gold-fillet" | "double-fillet" | "silk-border";
              pageConfig?: UniversalPageConfig;
            }) => {
              const pageCfg = cp.pageConfig as UniversalPageConfig | undefined;
              const layout = (cp.layoutType || cp.pageLayout || "2_COL") as MagazineLayoutType;
              const isMatrix = layout === "MATRIX" || pageCfg?.mode === "MATRIX";
              const matrixRows = cp.matrixRows || 2;
              const matrixCols = cp.matrixCols || 2;

              let matrixSegments: MatrixCellSegment[] | undefined;
              let segments: CustomPageSegment[];

              if (isMatrix) {
                matrixSegments = reconcileMatrixCells(
                  matrixRows,
                  matrixCols,
                  (Array.isArray(cp.segments) ? cp.segments : []) as MatrixCellSegment[],
                  cp.contentHtml || ""
                );
                segments = matrixSegments.map((ms) => ({
                  id: ms.id,
                  title: ms.title,
                  contentHtml: ms.contentHtml,
                }));
              } else {
                segments = initSegmentsForLayout(layout, cp.segments as CustomPageSegment[], cp.contentHtml);
              }

              return {
                id: cp.id,
                pageNumber: cp.pageNumber,
                title: cp.title || "",
                subtitle: cp.subtitle || "",
                mode: pageCfg?.mode || (isMatrix ? "MATRIX" : pageCfg?.singlePlateConfig?.primaryImageUrl ? "SINGLE_PLATE" : "WYSIWYG"),
                layoutType: layout,
                pageLayout: layout,
                contentHtml: cp.contentHtml || "",
                singlePlateConfig: pageCfg?.singlePlateConfig,
                borderConfig: pageCfg?.borderConfig,
                segments,
                matrixRows,
                matrixCols,
                rowHeights: cp.rowHeights || Array(matrixRows).fill("1fr").join(" "),
                colWidths: cp.colWidths || Array(matrixCols).fill("1fr").join(" "),
                hasHeader: Boolean(cp.hasHeader),
                headerHtml: cp.headerHtml || null,
                hasFooter: Boolean(cp.hasFooter),
                footerHtml: cp.footerHtml || null,
                verticalSpineMode: cp.verticalSpineMode || "NONE",
                verticalSpineHtml: cp.verticalSpineHtml || null,
                verticalSpineWidth: cp.verticalSpineWidth || "25%",
                matrixSegments,
                backgroundType: cp.backgroundType || "COLOR",
                backgroundColor: cp.backgroundColor || "#FAF7F2",
                backgroundPattern: cp.backgroundPattern || "mandala-filigree",
                patternOpacity: typeof cp.patternOpacity === "number" ? cp.patternOpacity : 0.15,
                backgroundImage: cp.backgroundImage || "",
                overlayOpacity: typeof cp.overlayOpacity === "number" ? cp.overlayOpacity : 0.2,
                frameStyle: cp.frameStyle || "gold-fillet",
              };
            })
          );
        }

        if (!ignore && artRes.ok) {
          if (Array.isArray(artData)) {
            setAvailableArtworks(artData);
          } else if (artData && Array.isArray(artData.artworks)) {
            setAvailableArtworks(artData.artworks);
          }
        }

        if (!ignore && evtRes.ok && Array.isArray(evtData)) {
          setEvents(evtData);
        }
      } catch (err) {
        console.error("Failed to load catalog studio data:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [id]);

  // Save All Changes
  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error("Title and slug are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        subtitle: subtitle.trim() || null,
        curatorialEssay: curatorialEssay || null,
        forewordBy: forewordBy.trim() || null,
        coverImageUrl: coverImageUrl || null,
        themeColor,
        pageSize,
        orientation,
        plateLayout,
        plateRatio,
        themeConfig,
        coverConfig: (() => {
          const activeCoverBg = coverConfig.coverBgColor || "#FAF7F2";
          const activeCoverPadding = typeof coverConfig.mattingPadding === "number" ? coverConfig.mattingPadding : 0;
          const activeOuterColor = coverConfig.coverMattingColor || themeConfig.backgroundColor || "#1C1814";
          const activeInnerColor = coverConfig.innerBorderColor || "#D4AF37";
          const isUniversalSyncActive = Boolean(coverConfig.borderConfig?.syncGlobal ?? coverConfig.syncGlobal);
          const isArtworkPlatesSyncActive = Boolean(coverConfig.borderConfig?.syncArtworkPlates ?? coverConfig.syncArtworkPlates ?? false);

          return {
            ...coverConfig,
            coverBgColor: activeCoverBg,
            mattingBgColor: activeCoverBg,
            canvasBgColor: activeCoverBg,
            mattingPadding: activeCoverPadding,
            coverMattingColor: activeOuterColor,
            innerBorderColor: activeInnerColor,
            syncGlobal: isUniversalSyncActive,
            syncArtworkPlates: isArtworkPlatesSyncActive,
            singlePlateConfig: {
              ...(coverConfig.singlePlateConfig || {}),
              primaryImageUrl: coverImageUrl || undefined,
              presentation: coverConfig.imagePlatePresentation || "contained",
              mattingBgColor: activeCoverBg,
              canvasBgColor: activeCoverBg,
              outerBorderColor: activeOuterColor,
              innerBorderColor: activeInnerColor,
              mattingPadding: activeCoverPadding,
              focalPosition: coverConfig.imageFocalPosition,
              headerSlot: coverConfig.headerSlot,
              footerSlot: coverConfig.footerSlot,
              leftSpineSlot: coverConfig.leftSpineSlot,
              rightSpineSlot: coverConfig.rightSpineSlot,
            },
            borderConfig: {
              ...(coverConfig.borderConfig || {}),
              syncGlobal: isUniversalSyncActive,
              syncArtworkPlates: isArtworkPlatesSyncActive,
              outerColor: activeOuterColor,
              innerColor: activeInnerColor,
              thicknessPx: activeCoverPadding,
              mattingBgColor: activeOuterColor,
              canvasBgColor: activeCoverBg,
            },
            mode: coverConfig.mode || (coverConfig.coverDesignMode === "WYSIWYG" ? "WYSIWYG" : coverConfig.coverDesignMode === "MATRIX" || coverConfig.useMatrixLayout ? "MATRIX" : "SINGLE_PLATE"),
          };
        })(),
        essayConfig: {
          ...essayConfig,
          contentHtml: curatorialEssay,
          mode: essayConfig.mode || (essayConfig.useMatrixLayout ? "MATRIX" : "WYSIWYG"),
        },
        curatorialConfig: {
          ...essayConfig,
          contentHtml: curatorialEssay,
          mode: essayConfig.mode || (essayConfig.useMatrixLayout ? "MATRIX" : "WYSIWYG"),
        },
        magazineConfig: {
          customPagesCount: customPages.length,
        },
        endPageConfig: {
          ...endPageConfig,
          mode: endPageConfig.mode || (endPageConfig.useMatrixLayout ? "MATRIX" : "WYSIWYG"),
        },
        isPublished,
        downloadablePdfUrl: downloadablePdfUrl.trim() || null,
        eventId: eventId === "none" ? null : eventId,
        customPages: customPages.map((cp, idx) => {
          const effectiveMode = cp.mode || (cp.layoutType === "MATRIX" ? "MATRIX" : cp.singlePlateConfig?.primaryImageUrl ? "SINGLE_PLATE" : "WYSIWYG");
          return {
            pageNumber: idx + 1,
            title: cp.title.trim() || null,
            subtitle: cp.subtitle.trim() || null,
            layoutType: effectiveMode === "MATRIX" ? "MATRIX" : cp.layoutType || "2_COL",
            pageLayout: effectiveMode === "MATRIX" ? "MATRIX" : cp.layoutType || "2_COL",
            contentHtml: cp.contentHtml || null,
            segments: (effectiveMode === "MATRIX" || cp.layoutType === "MATRIX") ? (cp.matrixSegments || cp.segments || []) : (cp.segments || []),
            matrixRows: cp.matrixRows || 2,
            matrixCols: cp.matrixCols || 2,
            rowHeights: cp.rowHeights || null,
            colWidths: cp.colWidths || null,
            hasHeader: Boolean(cp.hasHeader),
            headerHtml: cp.headerHtml || null,
            hasFooter: Boolean(cp.hasFooter),
            footerHtml: cp.footerHtml || null,
            verticalSpineMode: cp.verticalSpineMode || "NONE",
            verticalSpineHtml: cp.verticalSpineHtml || null,
            verticalSpineWidth: cp.verticalSpineWidth || "25%",
            backgroundType: cp.backgroundType || "COLOR",
            backgroundColor: cp.backgroundColor || "#FAF7F2",
            backgroundPattern: cp.backgroundPattern || null,
            patternOpacity: cp.patternOpacity ?? 0.15,
            backgroundImage: cp.backgroundImage || null,
            overlayOpacity: cp.overlayOpacity ?? 0.2,
            frameStyle: cp.frameStyle || "gold-fillet",
            pageConfig: {
              mode: effectiveMode,
              singlePlateConfig: cp.singlePlateConfig,
              wysiwygContent: cp.contentHtml,
              borderConfig: cp.borderConfig,
            },
          };
        }),
        items: plates.map((p, idx) => ({
          artworkId: p.artworkId,
          pageNumber: idx + 1,
          curatorialNote: p.curatorialNote || null,
          highlightPlate: p.highlightPlate,
          plateLayout: p.plateLayout || null,
          plateRatio: p.plateRatio || null,
          customTitle: p.customTitle ? p.customTitle.trim() : null,
          customSubtitle: p.customSubtitle ? p.customSubtitle.trim() : null,
          showPlateNumber: p.showPlateNumber !== false,
        })),
      };

      const res = await fetch(`/api/admin/catalogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save catalog");
      }

      toast.success("Catalog updated successfully!");
      setCatalog(data);
      setPlates(data.items || []);
      if (data.customPages) {
        setCustomPages(
          data.customPages.map((cp: {
            id?: string;
            pageNumber: number;
            title?: string;
            subtitle?: string;
            layoutType?: string;
            pageLayout?: string;
            contentHtml?: string;
            segments?: CustomPageSegment[] | MatrixCellSegment[];
            matrixRows?: number;
            matrixCols?: number;
            rowHeights?: string;
            colWidths?: string;
            hasHeader?: boolean;
            headerHtml?: string | null;
            hasFooter?: boolean;
            footerHtml?: string | null;
            verticalSpineMode?: "NONE" | "LEFT" | "RIGHT";
            verticalSpineHtml?: string | null;
            verticalSpineWidth?: string;
            backgroundType?: "COLOR" | "PATTERN" | "IMAGE";
            backgroundColor?: string;
            backgroundPattern?: string;
            patternOpacity?: number;
            backgroundImage?: string;
            overlayOpacity?: number;
            frameStyle?: "none" | "gold-fillet" | "double-fillet" | "silk-border";
          }) => {
            const layout = (cp.layoutType || cp.pageLayout || "2_COL") as MagazineLayoutType;
            const isMatrix = layout === "MATRIX";
            const matrixRows = cp.matrixRows || 2;
            const matrixCols = cp.matrixCols || 2;

            let matrixSegments: MatrixCellSegment[] | undefined;
            let segments: CustomPageSegment[];

            if (isMatrix) {
              matrixSegments = reconcileMatrixCells(
                matrixRows,
                matrixCols,
                (Array.isArray(cp.segments) ? cp.segments : []) as MatrixCellSegment[],
                cp.contentHtml || ""
              );
              segments = matrixSegments.map((ms) => ({
                id: ms.id,
                title: ms.title,
                contentHtml: ms.contentHtml,
              }));
            } else {
              segments = initSegmentsForLayout(layout, cp.segments as CustomPageSegment[], cp.contentHtml);
            }

            return {
              id: cp.id,
              pageNumber: cp.pageNumber,
              title: cp.title || "",
              subtitle: cp.subtitle || "",
              layoutType: layout,
              pageLayout: layout,
              contentHtml: cp.contentHtml || "",
              segments,
              matrixRows,
              matrixCols,
              rowHeights: cp.rowHeights || Array(matrixRows).fill("1fr").join(" "),
              colWidths: cp.colWidths || Array(matrixCols).fill("1fr").join(" "),
              hasHeader: Boolean(cp.hasHeader),
              headerHtml: cp.headerHtml || null,
              hasFooter: Boolean(cp.hasFooter),
              footerHtml: cp.footerHtml || null,
              verticalSpineMode: cp.verticalSpineMode || "NONE",
              verticalSpineHtml: cp.verticalSpineHtml || null,
              verticalSpineWidth: cp.verticalSpineWidth || "25%",
              matrixSegments,
              backgroundType: cp.backgroundType || "COLOR",
              backgroundColor: cp.backgroundColor || "#FAF7F2",
              backgroundPattern: cp.backgroundPattern || "mandala-filigree",
              patternOpacity: typeof cp.patternOpacity === "number" ? cp.patternOpacity : 0.15,
              backgroundImage: cp.backgroundImage || "",
              overlayOpacity: typeof cp.overlayOpacity === "number" ? cp.overlayOpacity : 0.2,
              frameStyle: cp.frameStyle || "gold-fillet",
            };
          })
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error saving catalog");
    } finally {
      setSaving(false);
    }
  };

  // High-Resolution Archival Publication Exporter
  const handleAdminPrintCatalog = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    const toastId = toast.loading("Generating High-Resolution Archival Publication PDF...");
    try {
      const res = await fetch(`/catalogs/${slug}?adminPrint=true`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Failed to load catalog reader (${res.status})`);
      }
      const htmlText = await res.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");

      const toolbar = doc.querySelector("[data-catalog-toolbar='true']");
      if (toolbar) toolbar.remove();
      const guard = doc.querySelector(".public-catalog-print-guard");
      if (guard) guard.remove();

      const catalogDoc = doc.querySelector(".catalog-document") || doc.body;

      toast.loading("Preloading and decoding all masterwork plates...", { id: toastId });
      await printIsolatedHtml(
        catalogDoc.outerHTML,
        `${title || "Catalog"} — Archival Publication`
      );
      toast.success("Catalog Print / PDF Dialog ready", { id: toastId });
    } catch (err: unknown) {
      console.error("Admin catalog print failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to generate High-Res PDF", { id: toastId });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Reorder Plates
  const movePlate = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= plates.length) return;

    const newPlates = [...plates];
    const temp = newPlates[index];
    newPlates[index] = newPlates[targetIdx];
    newPlates[targetIdx] = temp;

    // re-assign page numbers
    const updated = newPlates.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    setPlates(updated);
  };

  // Custom Editorial Pages Handlers
  const addCustomPage = () => {
    const layoutType: MagazineLayoutType = "2_COL";
    const newPage: ECatalogCustomPageItem = {
      pageNumber: customPages.length + 1,
      title: "Historical Context & Iconography",
      subtitle: "Scholarly commentary and cultural heritage",
      layoutType,
      pageLayout: layoutType,
      contentHtml: "",
      segments: [
        {
          id: `seg-1-${Date.now()}`,
          title: "Column 1 (Primary Thesis)",
          contentHtml: "<p>Compose fine art scholarly essay, Nayaka patronage lineage, or iconographical symbolism...</p>",
        },
        {
          id: `seg-2-${Date.now() + 1}`,
          title: "Column 2 (Patronage & Context)",
          contentHtml: "<p>Detail historical court documentation, pigment chemistry, or comparative temple iconography...</p>",
        },
      ],
      backgroundType: "COLOR",
      backgroundColor: "#FAF7F2",
      backgroundPattern: "mandala-filigree",
      patternOpacity: 0.15,
      backgroundImage: "",
      overlayOpacity: 0.2,
      frameStyle: "gold-fillet",
    };
    setCustomPages((prev) => [...prev, newPage]);
    toast.success("Added new editorial magazine page");
  };

  const removeCustomPage = (index: number) => {
    const updated = customPages
      .filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, pageNumber: i + 1 }));
    setCustomPages(updated);
    toast.info("Removed editorial page");
  };

  const moveCustomPage = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= customPages.length) return;

    const copy = [...customPages];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    const updated = copy.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    setCustomPages(updated);
  };

  const updateCustomPage = (index: number, updates: Partial<ECatalogCustomPageItem>) => {
    setCustomPages((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const updateCustomPageSegment = (pageIdx: number, segIdx: number, html: string) => {
    setCustomPages((prev) => {
      const copy = [...prev];
      const target = { ...copy[pageIdx] };
      const segments = [...(target.segments || [])];
      if (segments[segIdx]) {
        segments[segIdx] = { ...segments[segIdx], contentHtml: html };
      }
      target.segments = segments;
      target.contentHtml = segments.map((s) => s.contentHtml).filter(Boolean).join("");
      copy[pageIdx] = target;
      return copy;
    });
  };

  const changeCustomPageLayout = (pageIdx: number, newLayout: MagazineLayoutType) => {
    setCustomPages((prev) => {
      const copy = [...prev];
      const target = { ...copy[pageIdx] };
      target.layoutType = newLayout;
      target.pageLayout = newLayout;
      if (newLayout === "MATRIX") {
        const rows = target.matrixRows || 2;
        const cols = target.matrixCols || 2;
        target.matrixRows = rows;
        target.matrixCols = cols;
        target.rowHeights = target.rowHeights || Array(rows).fill("1fr").join(" ");
        target.colWidths = target.colWidths || Array(cols).fill("1fr").join(" ");
        target.verticalSpineMode = target.verticalSpineMode || "NONE";
        target.verticalSpineWidth = target.verticalSpineWidth || "25%";
        const reconciled = reconcileMatrixCells(
          rows,
          cols,
          target.matrixSegments || [],
          target.contentHtml || ""
        );
        target.matrixSegments = reconciled;
        target.segments = reconciled.map((ms) => ({
          id: ms.id,
          title: ms.title,
          contentHtml: ms.contentHtml,
        }));
      } else {
        target.segments = initSegmentsForLayout(newLayout, target.segments, target.contentHtml);
      }
      copy[pageIdx] = target;
      return copy;
    });
  };

  const removePlate = (index: number) => {
    const updated = plates.filter((_, i) => i !== index).map((p, i) => ({ ...p, pageNumber: i + 1 }));
    setPlates(updated);
  };

  const toggleHighlightPlate = (index: number) => {
    setPlates((prev) => {
      const copy = [...prev];
      copy[index].highlightPlate = !copy[index].highlightPlate;
      return copy;
    });
  };

  const toggleArtworkPlate = (art: ArtworkOption) => {
    const existingIndex = plates.findIndex((p) => p.artworkId === art.id);
    if (existingIndex >= 0) {
      removePlate(existingIndex);
      toast.info(`Removed "${art.title}" from catalog plates`);
    } else {
      const newPlate: CatalogPlate = {
        artworkId: art.id,
        pageNumber: plates.length + 1,
        curatorialNote: "",
        highlightPlate: false,
        artwork: art,
      };
      setPlates((prev) => [...prev, newPlate]);
      toast.success(`Added "${art.title}" to catalog plates`);
    }
  };


  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading e-Catalog Studio...</p>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-destructive">Catalog not found.</p>
        <Button onClick={() => router.push("/admin/catalogs")} variant="outline" size="sm">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Catalogs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/catalogs")}
            className="h-8 w-8 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-foreground truncate max-w-md">
                {title || "Untitled Catalog"}
              </h1>
              <Badge
                variant={isPublished ? "default" : "secondary"}
                className={`text-[10px] ${isPublished ? "bg-primary/20 text-primary border-primary/30" : ""}`}
              >
                {isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              /catalogs/{slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdminPrintCatalog}
            disabled={isExportingPdf}
            className="text-xs h-8.5 gap-1.5 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 shadow-xs cursor-pointer font-medium"
            title="Export complete high-resolution e-catalog as PDF or print archival document"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-primary" />
            )}
            <span>{isExportingPdf ? "Compiling PDF..." : "Download High-Res PDF / Print"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPlacardSheetOpen(true)}
            disabled={catalogPlacardArtworks.length === 0}
            className="text-xs h-8.5 gap-1.5 border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
            title="Print display placards for all artworks in this catalog"
          >
            <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Print Catalog Placards ({catalogPlacardArtworks.length})</span>
          </Button>

          <Link
            href={`/catalogs/${slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary px-3 py-1.5 rounded-md border border-border bg-card"
          >
            <Eye className="w-3.5 h-3.5" /> Preview Reader
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8.5 gap-1.5 border-border bg-card hover:bg-muted cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-primary" />
                <span>Download QR Code</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs w-48">
              <DropdownMenuItem asChild>
                <a
                  href={`/api/admin/catalogs/${id}/qrcode?format=svg&download=true`}
                  download={`${slug}-qr.svg`}
                  className="flex items-center gap-2 cursor-pointer w-full text-foreground"
                >
                  <Download className="w-3.5 h-3.5 text-primary" />
                  <span>Vector SVG (Print)</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={`/api/admin/catalogs/${id}/qrcode?format=png&download=true`}
                  download={`${slug}-qr.png`}
                  className="flex items-center gap-2 cursor-pointer w-full text-foreground"
                >
                  <Download className="w-3.5 h-3.5 text-primary" />
                  <span>High-Res PNG (1024px)</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Catalog
          </Button>
        </div>
      </div>

      {/* Curation Studio Tabs */}
      <Tabs defaultValue="metadata" className="space-y-6">
        <TabsList className="bg-muted/60 p-1 border border-border/80 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="metadata" className="text-xs flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> 1. Cover &amp; Framing
          </TabsTrigger>
          <TabsTrigger value="editorial" className="text-xs flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> 2. Curatorial Essay
          </TabsTrigger>
          <TabsTrigger value="custom-pages" className="text-xs flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-primary" /> 3. Magazine Pages ({customPages.length})
          </TabsTrigger>
          <TabsTrigger value="plates" className="text-xs flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" /> 4. Artwork Plates ({plates.length})
          </TabsTrigger>
          <TabsTrigger value="colophon" className="text-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> 5. Colophon &amp; End Page
          </TabsTrigger>
          <TabsTrigger value="pdf" className="text-xs flex items-center gap-1.5">
            <FileDown className="w-3.5 h-3.5" /> 6. Publication &amp; Export
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Metadata & Cover */}
        <TabsContent value="metadata" className="space-y-5">
          <Card className="border border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif font-bold">Catalog Identity</CardTitle>
              <CardDescription className="text-xs">
                Exhibition title, monograph subtitle, associated showcase, and publication status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Catalog Title *</label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Swarna Bindu: Sacred Tanjore Masterworks"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Slug (URL Permalink) *</label>
                  <Input
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. swarna-bindu-tanjore-masterworks"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Subtitle / Monograph Theme</label>
                <Input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. An Exhibition Monograph on 22k Gold Foil Iconography"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Linked Exhibition / Event</label>
                  <Select value={eventId} onValueChange={setEventId}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Associate with an Event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Standalone Monograph (No Event)</SelectItem>
                      {events.map((evt) => (
                        <SelectItem key={evt.id} value={evt.id}>
                          {evt.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Catalog Foil Theme</label>
                  <Select value={themeColor} onValueChange={setThemeColor}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select Foil Theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gold">Antique Temple Gold (22k)</SelectItem>
                      <SelectItem value="terracotta">Sacred Terracotta</SelectItem>
                      <SelectItem value="obsidian">Deep Obsidian Royal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-border/60">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Page Dimension Format</label>
                  <Select
                    value={pageSize}
                    onValueChange={(val: CatalogPageSize) => setPageSize(val)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select Page Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Standardizes all editorial &amp; print sheet dimensions.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Publication Orientation</label>
                    {pageSize === "SQUARE" && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 text-amber-600 dark:text-amber-400 border-amber-500/30">
                        1:1 Square
                      </Badge>
                    )}
                  </div>
                  <Select
                    value={orientation}
                    disabled={pageSize === "SQUARE"}
                    onValueChange={(val: "portrait" | "landscape") => setOrientation(val)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select Print Orientation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait (Classical Monograph)</SelectItem>
                      <SelectItem value="landscape">Landscape (Panoramic Gallery Album)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    {pageSize === "SQUARE"
                      ? "Square format enforces equal 1:1 width and height."
                      : "Determines viewport ratio and print sheet dimensions."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Ornamental Frame Style</label>
                  <Select
                    value={themeConfig.frameStyle || "gold-fillet"}
                    onValueChange={(val: "none" | "gold-fillet" | "double-fillet" | "silk-border") =>
                      setThemeConfig((prev) => ({ ...prev, frameStyle: val }))
                    }
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select Framing Style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gold-fillet">Classical Gold Fillet (22k Temple Border)</SelectItem>
                      <SelectItem value="double-fillet">Royal Double Fillet (Museum Archival)</SelectItem>
                      <SelectItem value="silk-border">Sacred Silk Border (Terracotta / Parchment)</SelectItem>
                      <SelectItem value="none">Minimal Frame (Border-less Modern)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Applies gold leaf borders, corner medallions, and framing accents across all catalog pages.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Plate Display Layout</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 text-primary border-primary/30">
                      {plateLayout === "SIDE_BY_SIDE" ? `Side-by-Side (${plateRatio})` : plateLayout === "TOP_LEFT_FLOW" ? "Top-Left Flow" : "Stacked"}
                    </Badge>
                  </label>
                  <Select
                    value={plateLayout}
                    onValueChange={(val: "SIDE_BY_SIDE" | "STACKED" | "TOP_LEFT_FLOW") => setPlateLayout(val)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select Plate Layout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SIDE_BY_SIDE">Side-by-Side Split</SelectItem>
                      <SelectItem value="STACKED">Stacked (Centered Image Above)</SelectItem>
                      <SelectItem value="TOP_LEFT_FLOW">Top-Left Floated (Long Narrative Flow)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Artwork floated top-left with wrapped text, 2-column split, or centered stack.
                  </p>
                </div>

                {plateLayout === "SIDE_BY_SIDE" && (
                  <div className="space-y-1.5 pt-2 border-t border-border/40 sm:col-span-2 lg:col-span-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-primary" /> Column Split Ratio (Artwork : Curatorial Text)
                      </label>
                      <span className="text-xs font-mono font-bold text-primary">{plateRatio}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { ratio: "40:60", label: "40:60 (Expanded Text)" },
                        { ratio: "45:55", label: "45:55" },
                        { ratio: "50:50", label: "50:50" },
                        { ratio: "55:45", label: "55:45 (Standard)" },
                        { ratio: "60:40", label: "60:40 (Expanded Image)" },
                      ].map((r) => (
                        <button
                          key={r.ratio}
                          type="button"
                          onClick={() => setPlateRatio(r.ratio as "40:60" | "45:55" | "50:50" | "55:45" | "60:40")}
                          className={`px-2.5 py-1 text-xs rounded-md border transition-all cursor-pointer font-medium ${
                            plateRatio === r.ratio
                              ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold ring-1 ring-primary"
                              : "border-border/80 bg-background hover:bg-muted text-foreground"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-primary" /> Front Cover Image Plate
                </label>
                <MediaUploader
                  value={coverImageUrl}
                  onUploadComplete={(url) => setCoverImageUrl(url)}
                  onRemove={() => setCoverImageUrl("")}
                  mediaType="general"
                  description="High-resolution visual representing the front cover of the digital book."
                />
              </div>

              {/* Cover Plate Presentation Controls */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-background/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-primary" /> Cover Plate Presentation
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Control how the front cover image formats within the catalog sheet geometry.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/50">
                    <button
                      type="button"
                      onClick={() =>
                        setCoverConfig((prev) => ({
                          ...prev,
                          imagePlatePresentation: "contained",
                        }))
                      }
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                        (coverConfig.imagePlatePresentation || "contained") === "contained"
                          ? "bg-card text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Contained with Matting
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCoverConfig((prev) => ({
                          ...prev,
                          imagePlatePresentation: "full-bleed",
                        }))
                      }
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                        coverConfig.imagePlatePresentation === "full-bleed"
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Full Bleed Cover / Fill Page
                    </button>
                  </div>
                </div>

                {coverConfig.imagePlatePresentation === "full-bleed" && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40 text-xs">
                    <span className="text-xs font-medium text-foreground">Focal Position:</span>
                    {[
                      { label: "Center", value: "center center" },
                      { label: "Top", value: "center top" },
                      { label: "Bottom", value: "center bottom" },
                      { label: "Left", value: "left center" },
                      { label: "Right", value: "right center" },
                    ].map((pos) => {
                      const current = coverConfig.imageFocalPosition || "center center";
                      const active = current === pos.value;
                      return (
                        <button
                          key={pos.value}
                          type="button"
                          onClick={() =>
                            setCoverConfig((prev) => ({
                              ...prev,
                              imageFocalPosition: pos.value,
                            }))
                          }
                          className={`px-2 py-0.5 rounded text-[11px] border font-mono transition-all cursor-pointer ${
                            active
                              ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                              : "border-border/80 bg-background hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          {pos.label}
                        </button>
                      );
                    })}
                    <span className="text-[10px] text-muted-foreground">
                      Scales edge-to-edge with protective text scrim overlay.
                    </span>
                  </div>
                )}
              </div>

              {/* Cover Matting & Framing Customization */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-4 pt-4">
                <div>
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Cover Matting &amp; Framing Customization
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    Customize the outer matting canvas, inner framing fillet, and matting thickness around the e-catalog cover.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Outer Matting / Border Color */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>Outer Matting / Border Color</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={coverConfig.coverMattingColor || themeConfig.backgroundColor || "#1C1814"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCoverConfig((prev) => ({
                            ...prev,
                            coverMattingColor: val,
                            borderConfig: {
                              ...(prev.borderConfig || {}),
                              outerColor: val,
                              mattingBgColor: val,
                            },
                          }));
                        }}
                        className="w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent shrink-0"
                      />
                      <Input
                        value={coverConfig.coverMattingColor || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCoverConfig((prev) => ({
                            ...prev,
                            coverMattingColor: val,
                            borderConfig: {
                              ...(prev.borderConfig || {}),
                              outerColor: val,
                              mattingBgColor: val,
                            },
                          }));
                        }}
                        className="text-xs font-mono"
                        placeholder="Inherit / #1C1814"
                      />
                    </div>
                    {/* Quick Outer Matting Presets */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {[
                        { name: "Charcoal", hex: "#151B26" },
                        { name: "Deep Teak", hex: "#1C130D" },
                        { name: "Obsidian", hex: "#0B0F17" },
                        { name: "Amethyst", hex: "#b62db9" },
                        { name: "Raw Silk", hex: "#F4EFEA" },
                        { name: "Parchment", hex: "#FAF7F2" },
                      ].map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => {
                            setCoverConfig((prev) => ({
                              ...prev,
                              coverMattingColor: preset.hex,
                              borderConfig: {
                                ...(prev.borderConfig || {}),
                                outerColor: preset.hex,
                                mattingBgColor: preset.hex,
                              },
                            }));
                          }}
                          className="px-1.5 py-0.5 text-[9px] rounded border border-border/80 bg-background hover:bg-muted font-mono flex items-center gap-1 cursor-pointer transition-colors"
                          title={preset.name}
                        >
                          <span
                            className="w-2 h-2 rounded-full border border-black/20"
                            style={{ backgroundColor: preset.hex }}
                          />
                          {preset.name}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground pt-0.5">Surrounds the framed artwork/content</p>
                  </div>

                  {/* Cover Canvas Background Color */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">Cover Canvas Background</label>
                      <button
                        type="button"
                        onClick={() =>
                          setCoverConfig((prev) => ({
                            ...prev,
                            coverBgColor: themeConfig.backgroundColor || "#FAF7F2",
                            canvasBgColor: themeConfig.backgroundColor || "#FAF7F2",
                            borderConfig: {
                              ...(prev.borderConfig || {}),
                              canvasBgColor: themeConfig.backgroundColor || "#FAF7F2",
                            },
                          }))
                        }
                        className="text-[10px] text-primary hover:underline cursor-pointer font-medium"
                      >
                        Match Base
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={coverConfig.coverBgColor || "#FAF7F2"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCoverConfig((prev) => ({
                            ...prev,
                            coverBgColor: val,
                            canvasBgColor: val,
                            singlePlateConfig: {
                              ...(prev.singlePlateConfig || {}),
                              canvasBgColor: val,
                              mattingBgColor: val,
                            },
                            borderConfig: {
                              ...(prev.borderConfig || {}),
                              canvasBgColor: val,
                            },
                          }));
                        }}
                        className="w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent shrink-0"
                      />
                      <Input
                        value={coverConfig.coverBgColor || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCoverConfig((prev) => ({
                            ...prev,
                            coverBgColor: val,
                            canvasBgColor: val,
                            singlePlateConfig: {
                              ...(prev.singlePlateConfig || {}),
                              canvasBgColor: val,
                              mattingBgColor: val,
                            },
                            borderConfig: {
                              ...(prev.borderConfig || {}),
                              canvasBgColor: val,
                            },
                          }));
                        }}
                        className="text-xs font-mono"
                        placeholder="#FAF7F2"
                      />
                    </div>
                    {/* Swatch Presets */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {[
                        { name: "Parchment", hex: "#FAF7F2" },
                        { name: "White", hex: "#FFFFFF" },
                        { name: "Obsidian", hex: "#0B0F17" },
                        { name: "Deep Teak", hex: "#1C130D" },
                        { name: "Raw Silk", hex: "#F4EFEA" },
                      ].map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => {
                            setCoverConfig((prev) => ({
                              ...prev,
                              coverBgColor: preset.hex,
                              canvasBgColor: preset.hex,
                              singlePlateConfig: {
                                ...(prev.singlePlateConfig || {}),
                                canvasBgColor: preset.hex,
                                mattingBgColor: preset.hex,
                              },
                              borderConfig: {
                                ...(prev.borderConfig || {}),
                                canvasBgColor: preset.hex,
                              },
                            }));
                          }}
                          className="px-1.5 py-0.5 text-[9px] rounded border border-border/80 bg-background hover:bg-muted font-mono flex items-center gap-1 cursor-pointer transition-colors"
                          title={preset.name}
                        >
                          <span
                            className="w-2 h-2 rounded-full border border-black/20"
                            style={{ backgroundColor: preset.hex }}
                          />
                          {preset.name}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground pt-0.5">Inner content sheet background</p>
                  </div>

                  {/* Inner Framing Border Color */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Inner Framing Border Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={coverConfig.innerBorderColor || "#D4AF37"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCoverConfig((prev) => ({
                            ...prev,
                            innerBorderColor: val,
                            borderConfig: {
                              ...(prev.borderConfig || {}),
                              innerColor: val,
                            },
                          }));
                        }}
                        className="w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent shrink-0"
                      />
                      <Input
                        value={coverConfig.innerBorderColor || "#D4AF37"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCoverConfig((prev) => ({
                            ...prev,
                            innerBorderColor: val,
                            borderConfig: {
                              ...(prev.borderConfig || {}),
                              innerColor: val,
                            },
                          }));
                        }}
                        className="text-xs font-mono"
                        placeholder="#D4AF37"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground pt-1">Inner gold fillet or decorative accent</p>
                  </div>

                  {/* Matting Thickness / Padding */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Matting Thickness / Padding</label>
                    <div className="flex items-center gap-1">
                      {[0, 4, 8, 16, 24, 32].map((pad) => {
                        const current = typeof coverConfig.mattingPadding === "number" ? coverConfig.mattingPadding : 24;
                        const isSelected = current === pad;
                        return (
                          <button
                            key={pad}
                            type="button"
                            onClick={() => {
                              setCoverConfig((prev) => ({
                                ...prev,
                                mattingPadding: pad,
                                borderConfig: {
                                  ...(prev.borderConfig || {}),
                                  thicknessPx: pad,
                                },
                              }));
                            }}
                            className={`flex-1 py-1 text-xs rounded-md border font-mono transition-all cursor-pointer ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs ring-1 ring-primary"
                                : "border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {pad}px
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Set 0px to eliminate the outer matting container and expand frame edge-to-edge.
                    </p>
                  </div>

                  {/* Universal Framing Sync Toggle */}
                  <div className="pt-3 border-t border-border/60 sm:col-span-2 lg:col-span-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-serif font-bold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" /> Universal Exhibition Framing Sync
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        Synchronize outer matting color, inner framing fillet, and margin thickness across exhibition pages.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/30 shrink-0">
                        <input
                          type="checkbox"
                          checked={coverConfig.borderConfig?.syncGlobal ?? coverConfig.syncGlobal ?? false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setCoverConfig((prev) => ({
                              ...prev,
                              syncGlobal: checked,
                              borderConfig: {
                                ...(prev.borderConfig || {}),
                                syncGlobal: checked,
                                outerColor: prev.coverMattingColor || "#1C1814",
                                innerColor: prev.innerBorderColor || "#D4AF37",
                                thicknessPx: typeof prev.mattingPadding === "number" ? prev.mattingPadding : 24,
                                mattingBgColor: prev.coverMattingColor || "#1C1814",
                                canvasBgColor: prev.coverBgColor || "#FAF7F2",
                              },
                            }));
                          }}
                          className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-primary font-bold">Apply to Editorial Pages</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30 shrink-0">
                        <input
                          type="checkbox"
                          checked={coverConfig.borderConfig?.syncArtworkPlates ?? coverConfig.syncArtworkPlates ?? false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setCoverConfig((prev) => ({
                              ...prev,
                              syncArtworkPlates: checked,
                              borderConfig: {
                                ...(prev.borderConfig || {}),
                                syncArtworkPlates: checked,
                              },
                            }));
                          }}
                          className="rounded border-border text-amber-600 focus:ring-amber-500 h-4 w-4"
                        />
                        <span className="text-amber-700 dark:text-amber-400 font-bold">Apply to Artwork Plates</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover Typography & Editorial Colors */}
              <div className="space-y-4 pt-4 border-t border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" /> 🖋️ Cover Typography &amp; Editorial Colors
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Ensure crisp, readable contrast across title, subtitle, badges, and metadata on light or custom cover canvases.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCoverConfig((prev) => ({
                        ...prev,
                        titleColor: "#0F172A",
                        titleFont: "var(--font-cinzel), serif",
                        subtitleColor: "#334155",
                        subtitleFont: "var(--font-cinzel), serif",
                        eyebrowColor: "#B45309",
                      }))
                    }
                    className="h-7 text-[11px] border-primary/40 text-primary hover:bg-primary/10 gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset to High-Contrast Editorial Defaults
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border border-border/80 bg-muted/20">
                  {/* Title Color */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Cover Title Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={coverConfig.titleColor || "#0F172A"}
                        onChange={(e) =>
                          setCoverConfig((prev) => ({ ...prev, titleColor: e.target.value }))
                        }
                        className="w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent shrink-0"
                      />
                      <Input
                        value={coverConfig.titleColor || ""}
                        onChange={(e) =>
                          setCoverConfig((prev) => ({ ...prev, titleColor: e.target.value }))
                        }
                        className="text-xs font-mono"
                        placeholder="#0F172A"
                      />
                    </div>
                  </div>

                  {/* Title Font Family */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Cover Title Font</label>
                    <select
                      value={coverConfig.titleFont || "var(--font-cinzel), serif"}
                      onChange={(e) =>
                        setCoverConfig((prev) => ({ ...prev, titleFont: e.target.value }))
                      }
                      className="w-full h-8 px-2 text-xs rounded-md border border-input bg-background text-foreground font-medium focus:ring-1 focus:ring-primary"
                    >
                      <option value="var(--font-cinzel), serif">Cinzel (Classical Serif)</option>
                      <option value="var(--font-cinzel-decorative), serif">Cinzel Decorative</option>
                      <option value="var(--font-playfair), serif">Playfair Display</option>
                      <option value="var(--font-cormorant), serif">Cormorant Garamond</option>
                      <option value="var(--font-inter), sans-serif">Inter (Modern Sans)</option>
                    </select>
                  </div>

                  {/* Subtitle Color */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Subtitle / Metadata Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={coverConfig.subtitleColor || "#334155"}
                        onChange={(e) =>
                          setCoverConfig((prev) => ({ ...prev, subtitleColor: e.target.value }))
                        }
                        className="w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent shrink-0"
                      />
                      <Input
                        value={coverConfig.subtitleColor || ""}
                        onChange={(e) =>
                          setCoverConfig((prev) => ({ ...prev, subtitleColor: e.target.value }))
                        }
                        className="text-xs font-mono"
                        placeholder="#334155"
                      />
                    </div>
                  </div>

                  {/* Eyebrow Badge Color */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Eyebrow / Badge Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={coverConfig.eyebrowColor || "#B45309"}
                        onChange={(e) =>
                          setCoverConfig((prev) => ({ ...prev, eyebrowColor: e.target.value }))
                        }
                        className="w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent shrink-0"
                      />
                      <Input
                        value={coverConfig.eyebrowColor || ""}
                        onChange={(e) =>
                          setCoverConfig((prev) => ({ ...prev, eyebrowColor: e.target.value }))
                        }
                        className="text-xs font-mono"
                        placeholder="#B45309"
                      />
                    </div>
                  </div>
                </div>

                {/* Editorial Verbiage & Dynamic Labels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/60">
                  {/* Eyebrow Badge Text */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">Eyebrow Badge Text</label>
                      <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={coverConfig.hideCoverEyebrow ?? false}
                          onChange={(e) =>
                            setCoverConfig((prev) => ({ ...prev, hideCoverEyebrow: e.target.checked }))
                          }
                          className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span>Hide Badge</span>
                      </label>
                    </div>
                    <Input
                      value={coverConfig.coverEyebrowText ?? coverConfig.eyebrowText ?? ""}
                      onChange={(e) =>
                        setCoverConfig((prev) => ({
                          ...prev,
                          coverEyebrowText: e.target.value,
                          eyebrowText: e.target.value,
                        }))
                      }
                      placeholder="e.g. Exhibition Monograph & Archival Collection"
                      className="text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Displays above the monograph title in the gold-accented pill.
                    </p>
                  </div>

                  {/* Cover Footer Note */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">Cover Footer / Publisher Note</label>
                      <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={coverConfig.hideCoverFooter ?? false}
                          onChange={(e) =>
                            setCoverConfig((prev) => ({ ...prev, hideCoverFooter: e.target.checked }))
                          }
                          className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span>Hide Footer</span>
                      </label>
                    </div>
                    <Input
                      value={coverConfig.coverFooterNote ?? ""}
                      onChange={(e) =>
                        setCoverConfig((prev) => ({ ...prev, coverFooterNote: e.target.value }))
                      }
                      placeholder="e.g. Published by SavazAI Atelier • Sacred Art & Heritage"
                      className="text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Colophon/curator publisher credit displayed at the bottom of the cover plate.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" /> Catalog Background Styling
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Configure how backgrounds render across all digital reader pages and PDF prints.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg border border-border bg-muted/30">
                    <button
                      type="button"
                      onClick={() => setThemeConfig((prev) => ({ ...prev, backgroundMode: "COLOR" }))}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                        (themeConfig.backgroundMode || "COLOR") === "COLOR"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Solid Color
                    </button>
                    <button
                      type="button"
                      onClick={() => setThemeConfig((prev) => ({ ...prev, backgroundMode: "PATTERN" }))}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                        themeConfig.backgroundMode === "PATTERN"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Sacred Patterns
                    </button>
                    <button
                      type="button"
                      onClick={() => setThemeConfig((prev) => ({ ...prev, backgroundMode: "IMAGE" }))}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                        themeConfig.backgroundMode === "IMAGE"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Background Image
                    </button>
                  </div>
                </div>

                {/* Mode 1: Solid Color */}
                {(themeConfig.backgroundMode || "COLOR") === "COLOR" && (
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Base Background Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={themeConfig.backgroundColor || "#1C1814"}
                            onChange={(e) =>
                              setThemeConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))
                            }
                            className="w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent"
                          />
                          <Input
                            value={themeConfig.backgroundColor || "#1C1814"}
                            onChange={(e) =>
                              setThemeConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))
                            }
                            className="text-xs font-mono"
                            placeholder="#1C1814"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Typography Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={themeConfig.textColor || "#FAF7F2"}
                            onChange={(e) =>
                              setThemeConfig((prev) => ({ ...prev, textColor: e.target.value }))
                            }
                            className="w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent"
                          />
                          <Input
                            value={themeConfig.textColor || "#FAF7F2"}
                            onChange={(e) =>
                              setThemeConfig((prev) => ({ ...prev, textColor: e.target.value }))
                            }
                            className="text-xs font-mono"
                            placeholder="#FAF7F2"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40">
                      <span className="text-[11px] text-muted-foreground font-medium block mb-2">Heritage Color Presets:</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: "Obsidian Night", bg: "#1C1814", text: "#FAF7F2" },
                          { name: "Deep Charcoal", bg: "#121110", text: "#F5EBE1" },
                          { name: "Warm Parchment", bg: "#FBF8F1", text: "#1C1814" },
                          { name: "Antique Raw Silk", bg: "#EFECE6", text: "#1C1814" },
                          { name: "Sacred Terracotta", bg: "#2A1810", text: "#FAF7F2" },
                          { name: "Temple Teak", bg: "#241E19", text: "#FAF7F2" },
                        ].map((preset) => {
                          const isSelected =
                            themeConfig.backgroundColor?.toLowerCase() === preset.bg.toLowerCase() &&
                            themeConfig.textColor?.toLowerCase() === preset.text.toLowerCase();
                          return (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() =>
                                setThemeConfig((prev) => ({
                                  ...prev,
                                  backgroundColor: preset.bg,
                                  textColor: preset.text,
                                }))
                              }
                              className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
                                isSelected
                                  ? "border-primary bg-primary/15 ring-2 ring-primary/60 font-bold text-foreground shadow-xs"
                                  : "border-border/80 hover:border-primary/50 bg-background text-foreground"
                              }`}
                            >
                              <span className="w-2.5 h-2.5 rounded-full border border-border" style={{ backgroundColor: preset.bg }} />
                              <span>{preset.name}</span>
                              {isSelected && <Check className="w-3 h-3 text-primary ml-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode 2: Sacred Patterns */}
                {themeConfig.backgroundMode === "PATTERN" && (
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Base Canvas Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={themeConfig.backgroundColor || "#1C1814"}
                            onChange={(e) =>
                              setThemeConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))
                            }
                            className="w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent"
                          />
                          <Input
                            value={themeConfig.backgroundColor || "#1C1814"}
                            onChange={(e) =>
                              setThemeConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))
                            }
                            className="text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-foreground">Pattern Opacity</label>
                          <span className="text-xs font-mono text-primary font-bold">
                            {Math.round(((themeConfig.patternOpacity ?? 0.15)) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="0.6"
                          step="0.01"
                          value={themeConfig.patternOpacity ?? 0.15}
                          onChange={(e) =>
                            setThemeConfig((prev) => ({ ...prev, patternOpacity: parseFloat(e.target.value) }))
                          }
                          className="w-full accent-primary cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground block">Select Sacred Heritage Pattern</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {BACKGROUND_PATTERNS.map((p) => {
                          const isSelected = (themeConfig.backgroundPattern || "mandala-filigree") === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setThemeConfig((prev) => ({ ...prev, backgroundPattern: p.id }))}
                              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-28 relative overflow-hidden group cursor-pointer ${
                                isSelected
                                  ? "border-primary bg-primary/10 ring-1 ring-primary shadow-sm"
                                  : "border-border/80 bg-background hover:border-primary/40"
                              }`}
                            >
                              <div
                                className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity"
                                style={{
                                  backgroundImage: `url("${p.svgDataUri}")`,
                                  backgroundRepeat: "repeat",
                                }}
                              />
                              <div className="relative z-10 flex items-center justify-between w-full">
                                <span className="text-[10px] font-mono uppercase text-primary font-semibold">
                                  {p.category}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                              </div>
                              <div className="relative z-10">
                                <h5 className="text-xs font-serif font-bold text-foreground truncate">{p.name}</h5>
                                <p className="text-[10px] text-muted-foreground line-clamp-1">{p.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode 3: Background Image */}
                {themeConfig.backgroundMode === "IMAGE" && (
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-primary" /> Full-Bleed Background Image
                      </label>
                      <MediaUploader
                        value={themeConfig.backgroundImage || ""}
                        onUploadComplete={(url) => setThemeConfig((prev) => ({ ...prev, backgroundImage: url }))}
                        onRemove={() => setThemeConfig((prev) => ({ ...prev, backgroundImage: "" }))}
                        mediaType="general"
                        description="High-resolution textural background or fine art wash for catalog pages."
                      />
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-border/40">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground">Dark Overlay Scrim Opacity</label>
                        <span className="text-xs font-mono text-primary font-bold">
                          {Math.round(((themeConfig.overlayOpacity ?? 0.5)) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.9"
                        step="0.05"
                        value={themeConfig.overlayOpacity ?? 0.5}
                        onChange={(e) =>
                          setThemeConfig((prev) => ({ ...prev, overlayOpacity: parseFloat(e.target.value) }))
                        }
                        className="w-full accent-primary cursor-pointer"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Controls dark scrim overlay to ensure optimal legibility for typography and gold plate frames.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reader Dual-Theme Color System */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-4 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" /> Reader Dual-Theme Color System
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Configure independent Light and Dark mode palettes for the public reader to guarantee crisp cultural contrast.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setThemeConfig((prev) => ({
                          ...prev,
                          readerTheme: DEFAULT_CATALOG_THEME_TOKENS,
                        }))
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer font-mono transition-colors"
                      title="Reset both Light and Dark palettes to cultural gold defaults"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Defaults
                    </button>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg border border-border bg-muted/30">
                      <button
                        type="button"
                        onClick={() => setReaderThemeMode("light")}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                          readerThemeMode === "light"
                            ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" /> Light Mode
                      </button>
                      <button
                        type="button"
                        onClick={() => setReaderThemeMode("dark")}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                          readerThemeMode === "dark"
                            ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" /> Dark Mode
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Palette Configurator */}
                {(() => {
                  const currentTokens = themeConfig.readerTheme || DEFAULT_CATALOG_THEME_TOKENS;
                  const activeMode = readerThemeMode;
                  const palette = currentTokens[activeMode];

                  const updateField = (field: keyof typeof palette, value: string) => {
                    setThemeConfig((prev) => {
                      const base = prev.readerTheme || DEFAULT_CATALOG_THEME_TOKENS;
                      return {
                        ...prev,
                        readerTheme: {
                          ...base,
                          [activeMode]: {
                            ...base[activeMode],
                            [field]: value,
                          },
                        },
                      };
                    });
                  };

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground">Canvas Background Fill</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={palette.canvasBg}
                            onChange={(e) => updateField("canvasBg", e.target.value)}
                            className="w-7 h-7 rounded border border-border cursor-pointer p-0 bg-transparent shrink-0"
                          />
                          <Input
                            value={palette.canvasBg}
                            onChange={(e) => updateField("canvasBg", e.target.value)}
                            className="text-xs font-mono h-8"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Main document background</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground">Plate Card Surface Fill</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={palette.cardBg}
                            onChange={(e) => updateField("cardBg", e.target.value)}
                            className="w-7 h-7 rounded border border-border cursor-pointer p-0 bg-transparent shrink-0"
                          />
                          <Input
                            value={palette.cardBg}
                            onChange={(e) => updateField("cardBg", e.target.value)}
                            className="text-xs font-mono h-8"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Surface color for plate & editorial frames</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground">Primary Heading Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={palette.headingColor}
                            onChange={(e) => updateField("headingColor", e.target.value)}
                            className="w-7 h-7 rounded border border-border cursor-pointer p-0 bg-transparent shrink-0"
                          />
                          <Input
                            value={palette.headingColor}
                            onChange={(e) => updateField("headingColor", e.target.value)}
                            className="text-xs font-mono h-8"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Titles (H1, H2, H3)</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground">Curatorial Body Text Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={palette.textColor}
                            onChange={(e) => updateField("textColor", e.target.value)}
                            className="w-7 h-7 rounded border border-border cursor-pointer p-0 bg-transparent shrink-0"
                          />
                          <Input
                            value={palette.textColor}
                            onChange={(e) => updateField("textColor", e.target.value)}
                            className="text-xs font-mono h-8"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Essays, metadata & paragraphs</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground">Ornamental Gold Accent</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={palette.accentGold}
                            onChange={(e) => updateField("accentGold", e.target.value)}
                            className="w-7 h-7 rounded border border-border cursor-pointer p-0 bg-transparent shrink-0"
                          />
                          <Input
                            value={palette.accentGold}
                            onChange={(e) => updateField("accentGold", e.target.value)}
                            className="text-xs font-mono h-8"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Badges, links & decorative ornaments</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground">Card Structural Border</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={palette.borderColor}
                            onChange={(e) => updateField("borderColor", e.target.value)}
                            className="w-7 h-7 rounded border border-border cursor-pointer p-0 bg-transparent shrink-0"
                          />
                          <Input
                            value={palette.borderColor}
                            onChange={(e) => updateField("borderColor", e.target.value)}
                            className="text-xs font-mono h-8"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Frame borders and divider rules</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

                {/* Cover Presentation & Layout Engine (Image Plate vs. WYSIWYG vs. Matrix) */}
                <div className="pt-4 border-t border-border/60 space-y-4">
                  <EditorialModeSwitcher
                    label="Front Cover Presentation Engine"
                    mode={
                      coverConfig.mode ||
                      (coverConfig.coverDesignMode === "WYSIWYG"
                        ? "WYSIWYG"
                        : coverConfig.coverDesignMode === "MATRIX" || coverConfig.useMatrixLayout
                        ? "MATRIX"
                        : "SINGLE_PLATE")
                    }
                    onChange={(newMode) => {
                      setCoverConfig((prev) => ({
                        ...prev,
                        mode: newMode,
                        coverDesignMode: newMode === "SINGLE_PLATE" ? "IMAGE_PLATE" : newMode,
                        useMatrixLayout: newMode === "MATRIX",
                      }));
                    }}
                  />

                  {/* Mode 1: Single Image Plate with Spine Embellishments */}
                  {(coverConfig.mode === "SINGLE_PLATE" || (!coverConfig.mode && coverConfig.coverDesignMode !== "WYSIWYG" && !coverConfig.useMatrixLayout && coverConfig.coverDesignMode !== "MATRIX")) && (
                    <div className="pt-2">
                      <CatalogSinglePlateEditor
                        sectionLabel="Front Cover"
                        config={{
                          primaryImageUrl: coverImageUrl,
                          presentation: coverConfig.imagePlatePresentation || "contained",
                          mattingBgColor: coverConfig.coverBgColor || coverConfig.mattingBgColor || "#FAF7F2",
                          focalPosition: coverConfig.imageFocalPosition,
                          headerSlot: coverConfig.headerSlot,
                          footerSlot: coverConfig.footerSlot,
                          leftSpineSlot: coverConfig.leftSpineSlot,
                          rightSpineSlot: coverConfig.rightSpineSlot,
                        }}
                        onChange={(upd) => {
                          if (upd.primaryImageUrl !== undefined) {
                            setCoverImageUrl(upd.primaryImageUrl);
                          }
                          setCoverConfig((prev) => {
                            const nextMatting = upd.mattingBgColor !== undefined ? upd.mattingBgColor : (prev.coverBgColor || prev.mattingBgColor);
                            return {
                              ...prev,
                              ...(upd.presentation ? { imagePlatePresentation: upd.presentation } : {}),
                              ...(upd.mattingBgColor !== undefined ? { coverBgColor: upd.mattingBgColor, mattingBgColor: upd.mattingBgColor } : {}),
                              ...(upd.focalPosition ? { imageFocalPosition: upd.focalPosition } : {}),
                              ...(upd.headerSlot ? { headerSlot: upd.headerSlot } : {}),
                              ...(upd.footerSlot ? { footerSlot: upd.footerSlot } : {}),
                              ...(upd.leftSpineSlot ? { leftSpineSlot: upd.leftSpineSlot } : {}),
                              ...(upd.rightSpineSlot ? { rightSpineSlot: upd.rightSpineSlot } : {}),
                              singlePlateConfig: {
                                ...(prev.singlePlateConfig || {}),
                                ...upd,
                                mattingBgColor: nextMatting,
                              },
                              borderConfig: {
                                ...(prev.borderConfig || {}),
                                mattingBgColor: nextMatting,
                              },
                            };
                          });
                        }}
                      />
                    </div>
                  )}

                  {/* Mode 2: Bespoke WYSIWYG Cover Editor */}
                  {coverConfig.coverDesignMode === "WYSIWYG" && (
                    <div className="pt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-primary" /> Bespoke Front Cover Typography &amp; Layout
                        </label>
                        <span className="text-[11px] text-muted-foreground">
                          Universal Full-Viewport Portal WYSIWYG Suite
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Compose custom front-cover titles, sub-headings, awards, royal patron credits, publisher stamps, and decorative dividers using the complete rich-text suite.
                      </p>
                      <div className="border border-border/80 rounded-xl overflow-hidden shadow-xs">
                        <TiptapEditor
                          content={coverConfig.contentHtml || ""}
                          onChange={(_, html) =>
                            setCoverConfig((prev) => ({
                              ...prev,
                              contentHtml: html,
                            }))
                          }
                          contrast={themeConfig.backgroundMode === "IMAGE" ? "dark-bg" : undefined}
                          catalogPageSize={pageSize}
                          catalogOrientation={orientation}
                          className="min-h-[380px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Advanced Matrix Studio */}
                  {(coverConfig.coverDesignMode === "MATRIX" || (coverConfig.useMatrixLayout && coverConfig.coverDesignMode !== "WYSIWYG")) && (
                    <div className="pt-2">
                      <CatalogMatrixStudio
                        pageTitle={title || "Catalog Front Cover"}
                        pageType="COVER"
                        config={
                          coverConfig.matrixConfig || {
                            matrixRows: 2,
                            matrixCols: 2,
                            rowHeights: "1fr 1fr",
                            colWidths: "1fr 1fr",
                            hasHeader: false,
                            hasFooter: false,
                            verticalSpineMode: "NONE",
                            segments: reconcileMatrixCells(2, 2, []),
                          }
                        }
                        onChange={(upd) =>
                          setCoverConfig((prev) => {
                            const currentMatrix = prev.matrixConfig || {
                              matrixRows: 2,
                              matrixCols: 2,
                              rowHeights: "1fr 1fr",
                              colWidths: "1fr 1fr",
                              hasHeader: false,
                              hasFooter: false,
                              verticalSpineMode: "NONE",
                              segments: reconcileMatrixCells(2, 2, []),
                            };
                            const newRows = upd.matrixRows ?? currentMatrix.matrixRows;
                            const newCols = upd.matrixCols ?? currentMatrix.matrixCols;
                            let newSegments = upd.segments ?? currentMatrix.segments;
                            if (newSegments) {
                              newSegments = reconcileMatrixCells(newRows, newCols, newSegments);
                            }
                            return {
                              ...prev,
                              useMatrixLayout: true,
                              coverDesignMode: "MATRIX",
                              matrixConfig: {
                                ...currentMatrix,
                                ...upd,
                                matrixRows: newRows,
                                matrixCols: newCols,
                                segments: newSegments,
                              },
                            };
                          })
                        }
                      />
                    </div>
                  )}
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Curatorial Essay & Foreword */}
        <TabsContent value="editorial" className="space-y-5">
          <Card className="border border-border/80 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-serif font-bold">Curatorial Foreword &amp; Essay</CardTitle>
                  <CardDescription className="text-xs">
                    Curatorial statement, scholarly foreword, and historical commentary introducing the collection.
                  </CardDescription>
                </div>
                <AiAssistantModal
                  initialContext={`${title ? `Catalog: ${title}\n` : ""}${forewordBy ? `Foreword: ${forewordBy}\n` : ""}${curatorialEssay || ""}`}
                  onApply={(aiText) => {
                    setCuratorialEssay((prev) => {
                      const newParagraph = `<p>${aiText.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`;
                      return prev ? `${prev}${newParagraph}` : newParagraph;
                    });
                  }}
                  triggerLabel="✨ AI Curatorial Essay"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Section Heading</label>
                  <Input
                    value={essayConfig.title || ""}
                    onChange={(e) => setEssayConfig((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Curatorial Monograph & Scholarly Statement"
                    className="text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Header title displayed above the curatorial statement.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Curatorial Footer Tag</label>
                  <Input
                    value={essayConfig.footerLabel || ""}
                    onChange={(e) => setEssayConfig((prev) => ({ ...prev, footerLabel: e.target.value }))}
                    placeholder="e.g. Curatorial Preface"
                    className="text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Bottom right label on the curatorial essay sheet.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Foreword / Curated By</label>
                <Input
                  value={forewordBy}
                  onChange={(e) => setForewordBy(e.target.value)}
                  placeholder="e.g. Master Artist & Dr. R. Swaminathan (Art Historian)"
                  className="text-xs"
                />
              </div>

              {/* Curatorial Page Presentation Engine */}
              <div className="pt-2 border-t border-border/60 space-y-4">
                <EditorialModeSwitcher
                  label="Curatorial Page Presentation Engine"
                  mode={
                    essayConfig.mode ||
                    (essayConfig.useMatrixLayout ? "MATRIX" : "WYSIWYG")
                  }
                  onChange={(newMode) => {
                    setEssayConfig((prev) => ({
                      ...prev,
                      mode: newMode,
                      useMatrixLayout: newMode === "MATRIX",
                    }));
                  }}
                />

                {/* Mode A: Single Image Plate */}
                {essayConfig.mode === "SINGLE_PLATE" && (
                  <div className="pt-2">
                    <CatalogSinglePlateEditor
                      sectionLabel="Curatorial Foreword Plate"
                      config={{
                        primaryImageUrl: essayConfig.singlePlateConfig?.primaryImageUrl || "",
                        presentation: essayConfig.singlePlateConfig?.presentation || "contained",
                        mattingBgColor: essayConfig.singlePlateConfig?.mattingBgColor || essayConfig.backgroundColor || "#FAF7F2",
                        focalPosition: essayConfig.singlePlateConfig?.focalPosition,
                        headerSlot: essayConfig.singlePlateConfig?.headerSlot,
                        footerSlot: essayConfig.singlePlateConfig?.footerSlot,
                        leftSpineSlot: essayConfig.singlePlateConfig?.leftSpineSlot,
                        rightSpineSlot: essayConfig.singlePlateConfig?.rightSpineSlot,
                      }}
                      onChange={(upd) => {
                        setEssayConfig((prev) => ({
                          ...prev,
                          singlePlateConfig: {
                            ...prev.singlePlateConfig,
                            ...upd,
                          },
                        }));
                      }}
                    />
                  </div>
                )}

                {/* Mode B: WYSIWYG Monograph Editor */}
                {(essayConfig.mode === "WYSIWYG" || (!essayConfig.mode && !essayConfig.useMatrixLayout)) && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Curatorial Monograph Body</label>
                    <div className="rounded-md border border-input bg-card/60 p-1 shadow-sm">
                      <TiptapEditor
                        content={curatorialEssay}
                        onChange={(_, html) => setCuratorialEssay(html)}
                        placeholder="Compose the scholastic curatorial statement, historical lineage of the paintings, and thematic spiritual symbolism..."
                        catalogPageSize={pageSize}
                        catalogOrientation={orientation}
                        className="min-h-[280px]"
                      />
                    </div>
                  </div>
                )}

                {/* Mode C: Advanced Matrix Studio */}
                {(essayConfig.mode === "MATRIX" || (essayConfig.useMatrixLayout && essayConfig.mode !== "WYSIWYG" && essayConfig.mode !== "SINGLE_PLATE")) && (
                  <div className="pt-2">
                    <CatalogMatrixStudio
                      pageTitle={essayConfig.title || "Curatorial Foreword & Statement"}
                      pageType="ESSAY"
                      config={
                        essayConfig.matrixConfig || {
                          matrixRows: 2,
                          matrixCols: 2,
                          rowHeights: "1fr 1fr",
                          colWidths: "1fr 1fr",
                          hasHeader: false,
                          hasFooter: false,
                          verticalSpineMode: "NONE",
                          segments: reconcileMatrixCells(2, 2, [], curatorialEssay || ""),
                        }
                      }
                      onChange={(upd) =>
                        setEssayConfig((prev) => {
                          const currentMatrix = prev.matrixConfig || {
                            matrixRows: 2,
                            matrixCols: 2,
                            rowHeights: "1fr 1fr",
                            colWidths: "1fr 1fr",
                            hasHeader: false,
                            hasFooter: false,
                            verticalSpineMode: "NONE",
                            segments: reconcileMatrixCells(2, 2, [], curatorialEssay || ""),
                          };
                          const newRows = upd.matrixRows ?? currentMatrix.matrixRows;
                          const newCols = upd.matrixCols ?? currentMatrix.matrixCols;
                          let newSegments = upd.segments ?? currentMatrix.segments;
                          if (newSegments) {
                            newSegments = reconcileMatrixCells(newRows, newCols, newSegments);
                          }
                          return {
                            ...prev,
                            useMatrixLayout: true,
                            matrixConfig: {
                              ...currentMatrix,
                              ...upd,
                              matrixRows: newRows,
                              matrixCols: newCols,
                              segments: newSegments,
                            },
                          };
                        })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="pt-2">
                <CatalogBackgroundControl
                  config={{
                    backgroundType: essayConfig.backgroundType || "COLOR",
                    backgroundColor: essayConfig.backgroundColor || "#FAF7F2",
                    backgroundPattern: essayConfig.backgroundPattern || "mandala-filigree",
                    patternOpacity: essayConfig.patternOpacity ?? 0.15,
                    backgroundImage: essayConfig.backgroundImage || "",
                    overlayOpacity: essayConfig.overlayOpacity ?? 0.2,
                    frameStyle: essayConfig.frameStyle || "gold-fillet",
                  }}
                  onChange={(upd) => setEssayConfig((prev) => ({ ...prev, ...upd }))}
                  title="Curatorial Essay Background & Framing"
                  description="Customize canvas backdrop, sacred pattern, and framing specifically for this foreword."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Magazine & Editorial Pages */}
        <TabsContent value="custom-pages" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-serif font-bold text-foreground">
                  Arbitrary Publication &amp; Magazine Pages ({customPages.length})
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add multi-column feature articles, historical essays, patron biographies, and sacred iconography monographs.
              </p>
            </div>

            <Button
              onClick={addCustomPage}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Editorial Page
            </Button>
          </div>

          {customPages.length === 0 ? (
            <Card className="border-dashed p-10 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">No Magazine Articles Added Yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                You can add rich magazine pages between the Curatorial Foreword and the Artwork Plates.
              </p>
              <Button onClick={addCustomPage} size="sm" variant="outline">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add First Editorial Page
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {customPages.map((page, pIdx) => (
                <Card key={page.id || `custom-page-${pIdx}`} className="border border-border/80 bg-card overflow-hidden">
                  <CardHeader className="bg-muted/20 border-b border-border/60 pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center font-mono font-bold text-xs text-primary">
                          {pIdx + 1}
                        </div>
                        <div>
                          <CardTitle className="font-serif text-base font-bold">
                            {page.title || `Editorial Page ${pIdx + 1}`}
                          </CardTitle>
                          {page.subtitle && (
                            <p className="text-xs text-muted-foreground font-serif italic">{page.subtitle}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pIdx === 0}
                          onClick={() => moveCustomPage(pIdx, "up")}
                          className="h-8 w-8 p-0"
                          title="Move Page Up"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pIdx === customPages.length - 1}
                          onClick={() => moveCustomPage(pIdx, "down")}
                          className="h-8 w-8 p-0"
                          title="Move Page Down"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomPage(pIdx)}
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4">
                    {/* Header Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 sm:col-span-1">
                        <label className="text-xs font-semibold text-foreground">Page Title</label>
                        <Input
                          value={page.title}
                          onChange={(e) => updateCustomPage(pIdx, { title: e.target.value })}
                          placeholder="e.g. Sacred Iconography & Nayaka Influence"
                          className="text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-1">
                        <label className="text-xs font-semibold text-foreground">Subtitle / Running Tagline</label>
                        <Input
                          value={page.subtitle}
                          onChange={(e) => updateCustomPage(pIdx, { subtitle: e.target.value })}
                          placeholder="e.g. Dynastic Patronage and Ritual Lineage"
                          className="text-xs"
                        />
                      </div>
                    </div>

                    {/* Editorial Page Mode Switcher */}
                    <div className="pt-2 border-t border-border/60">
                      <EditorialModeSwitcher
                        label={`Page ${pIdx + 1} Presentation Engine`}
                        mode={
                          page.mode ||
                          (page.layoutType === "MATRIX"
                            ? "MATRIX"
                            : page.singlePlateConfig?.primaryImageUrl && page.layoutType === "1_COL" && (!page.segments || page.segments.length === 0)
                            ? "SINGLE_PLATE"
                            : "WYSIWYG")
                        }
                        onChange={(newMode) => {
                          updateCustomPage(pIdx, {
                            mode: newMode,
                            layoutType: newMode === "MATRIX" ? "MATRIX" : page.layoutType === "MATRIX" ? "2_COL" : (page.layoutType || "2_COL"),
                          });
                        }}
                      />
                    </div>

                    {/* Mode A: Single Image Plate */}
                    {page.mode === "SINGLE_PLATE" && (
                      <div className="pt-2">
                        <CatalogSinglePlateEditor
                          sectionLabel={page.title || `Editorial Page ${pIdx + 1}`}
                          config={{
                            primaryImageUrl: page.singlePlateConfig?.primaryImageUrl || "",
                            presentation: page.singlePlateConfig?.presentation || "contained",
                            mattingBgColor: page.singlePlateConfig?.mattingBgColor || page.backgroundColor || "#FAF7F2",
                            focalPosition: page.singlePlateConfig?.focalPosition,
                            headerSlot: page.singlePlateConfig?.headerSlot,
                            footerSlot: page.singlePlateConfig?.footerSlot,
                            leftSpineSlot: page.singlePlateConfig?.leftSpineSlot,
                            rightSpineSlot: page.singlePlateConfig?.rightSpineSlot,
                          }}
                          onChange={(upd) => {
                            updateCustomPage(pIdx, {
                              singlePlateConfig: {
                                ...page.singlePlateConfig,
                                ...upd,
                              },
                            });
                          }}
                        />
                      </div>
                    )}

                    {/* Universal Background & Framing Suite for this page */}
                    <div className="pt-1">
                      <CatalogBackgroundControl
                        config={page}
                        onChange={(upd) => updateCustomPage(pIdx, upd)}
                        title="Page Background & Framing Suite"
                        description="Select canvas backdrop, sacred heritage pattern, or custom image for this discrete magazine page."
                      />
                    </div>

                    {(page.mode === "MATRIX" || (page.layoutType === "MATRIX" && page.mode !== "SINGLE_PLATE" && page.mode !== "WYSIWYG")) ? (
                      /* Advanced InDesign Matrix Grid Studio */
                      <div className="pt-2">
                        <CatalogMatrixStudio
                          pageTitle={page.title || `Editorial Page ${pIdx + 1}`}
                          pageType="MAGAZINE"
                          config={{
                            matrixRows: page.matrixRows || 2,
                            matrixCols: page.matrixCols || 2,
                            rowHeights: page.rowHeights,
                            colWidths: page.colWidths,
                            hasHeader: Boolean(page.hasHeader),
                            headerHtml: page.headerHtml,
                            hasFooter: Boolean(page.hasFooter),
                            footerHtml: page.footerHtml,
                            verticalSpineMode: page.verticalSpineMode || "NONE",
                            verticalSpineHtml: page.verticalSpineHtml,
                            verticalSpineWidth: page.verticalSpineWidth,
                            segments: page.matrixSegments || reconcileMatrixCells(page.matrixRows || 2, page.matrixCols || 2, [], page.contentHtml || ""),
                          }}
                          onChange={(upd) => {
                            const newRows = upd.matrixRows ?? page.matrixRows ?? 2;
                            const newCols = upd.matrixCols ?? page.matrixCols ?? 2;
                            let newMatrixSegments = upd.segments ?? page.matrixSegments;
                            if (newMatrixSegments) {
                              newMatrixSegments = reconcileMatrixCells(newRows, newCols, newMatrixSegments);
                            }
                            updateCustomPage(pIdx, {
                              ...upd,
                              matrixRows: newRows,
                              matrixCols: newCols,
                              matrixSegments: newMatrixSegments,
                              segments: newMatrixSegments ? newMatrixSegments.map((ms) => ({
                                id: ms.id,
                                title: ms.title,
                                contentHtml: ms.contentHtml,
                              })) : page.segments,
                            });
                          }}
                        />
                      </div>
                    ) : page.mode === "SINGLE_PLATE" ? null : (
                      /* Mode B: Multi-Segment Independent Column Studio */
                      <div className="space-y-3 pt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
                          <div className="space-y-0.5">
                            <label className="text-xs font-serif font-bold text-foreground">
                              Magazine Multi-Column Grid Layout
                            </label>
                            <p className="text-[11px] text-muted-foreground">
                              Choose the column distribution and proportion for this editorial article.
                            </p>
                          </div>
                          <div className="w-full sm:w-64">
                            <Select
                              value={page.layoutType || "2_COL"}
                              onValueChange={(val: MagazineLayoutType) => changeCustomPageLayout(pIdx, val)}
                            >
                              <SelectTrigger className="text-xs">
                                <SelectValue placeholder="Layout Mode" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1_COL">1-Column Full Feature (Scholarly)</SelectItem>
                                <SelectItem value="2_COL">2-Column Balanced (50:50)</SelectItem>
                                <SelectItem value="ASYMMETRIC_70_30">2-Column Asymmetric (70:30)</SelectItem>
                                <SelectItem value="ASYMMETRIC_30_70">2-Column Asymmetric (30:70)</SelectItem>
                                <SelectItem value="3_COL">3-Column Magazine Spread (33:33:33)</SelectItem>
                                <SelectItem value="4_COL">4-Column Grid (Archival &amp; Footnotes)</SelectItem>
                                <SelectItem value="6_COL">6-Column Gallery Matrix</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div
                          className={`grid gap-4 ${
                            page.layoutType === "1_COL"
                              ? "grid-cols-1"
                              : page.layoutType === "2_COL"
                              ? "grid-cols-1 md:grid-cols-2"
                              : page.layoutType === "ASYMMETRIC_70_30"
                              ? "grid-cols-1 md:grid-cols-12"
                              : page.layoutType === "ASYMMETRIC_30_70"
                              ? "grid-cols-1 md:grid-cols-12"
                              : page.layoutType === "3_COL"
                              ? "grid-cols-1 md:grid-cols-3"
                              : page.layoutType === "4_COL"
                              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
                              : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
                          }`}
                        >
                          {page.segments?.map((seg, sIdx) => {
                            const colSpan =
                              page.layoutType === "ASYMMETRIC_70_30"
                                ? sIdx === 0
                                  ? "md:col-span-8"
                                  : "md:col-span-4"
                                : page.layoutType === "ASYMMETRIC_30_70"
                                ? sIdx === 0
                                  ? "md:col-span-4"
                                  : "md:col-span-8"
                                : "";

                            return (
                              <div
                                key={seg.id || `seg-${sIdx}`}
                                className={`space-y-2 p-3 rounded-xl border border-border/80 bg-card/90 flex flex-col justify-between shadow-xs ${colSpan}`}
                              >
                                <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/50">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary border border-primary/30 flex items-center justify-center text-[10px] font-mono font-bold">
                                      {sIdx + 1}
                                    </span>
                                    <span className="text-xs font-serif font-bold text-foreground">
                                      {seg.title || `Column ${sIdx + 1}`}
                                    </span>
                                  </div>

                                  <AiAssistantModal
                                    initialContext={`Article: ${page.title || "Sacred Art Monograph"}\nColumn ${sIdx + 1}:\n${seg.contentHtml || ""}`}
                                    onApply={(aiText) => {
                                      const newP = `<p>${aiText.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`;
                                      updateCustomPageSegment(
                                        pIdx,
                                        sIdx,
                                        seg.contentHtml ? `${seg.contentHtml}${newP}` : newP
                                      );
                                    }}
                                    triggerLabel="✨ AI Polish"
                                  />
                                </div>

                                <div className="rounded-md border border-input bg-card/60 p-1 shadow-sm flex-1">
                                  <TiptapEditor
                                    content={seg.contentHtml}
                                    onChange={(_, html) => updateCustomPageSegment(pIdx, sIdx, html)}
                                    placeholder={`Compose text, drop caps, or insert photos for Column ${sIdx + 1}...`}
                                    catalogPageSize={pageSize}
                                    catalogOrientation={orientation}
                                    className="min-h-[200px]"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 4: Artwork Plates */}
        <TabsContent value="plates" className="space-y-5">
          <div className="flex flex-col gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <LayoutTemplate className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <span>Plate Display Presentation:</span>
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary bg-primary/10">
                      {plateLayout === "SIDE_BY_SIDE" ? `Side-by-Side (${plateRatio})` : plateLayout === "TOP_LEFT_FLOW" ? "Top-Left Flow" : "Stacked"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Default layout for all plates. You can also override layout individually per masterwork below.
                  </p>
                </div>
              </div>
              <Select value={plateLayout} onValueChange={(val: "SIDE_BY_SIDE" | "STACKED" | "TOP_LEFT_FLOW") => setPlateLayout(val)}>
                <SelectTrigger className="w-[240px] text-xs h-8 bg-background">
                  <SelectValue placeholder="Select Plate Layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIDE_BY_SIDE">Side-by-Side Split</SelectItem>
                  <SelectItem value="STACKED">Stacked (Centered Image Above)</SelectItem>
                  <SelectItem value="TOP_LEFT_FLOW">Top-Left Floated (Long Narrative Flow)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {plateLayout === "SIDE_BY_SIDE" && (
              <div className="flex items-center justify-between pt-2 border-t border-primary/20 flex-wrap gap-2">
                <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-primary" /> Column Ratio:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { ratio: "40:60", label: "40:60 (Expanded Text)" },
                    { ratio: "45:55", label: "45:55" },
                    { ratio: "50:50", label: "50:50" },
                    { ratio: "55:45", label: "55:45 (Standard)" },
                    { ratio: "60:40", label: "60:40 (Expanded Image)" },
                  ].map((r) => (
                    <button
                      key={r.ratio}
                      type="button"
                      onClick={() => setPlateRatio(r.ratio as "40:60" | "45:55" | "50:50" | "55:45" | "60:40")}
                      className={`px-2 py-0.5 text-[11px] rounded-md border font-medium cursor-pointer transition-all ${
                        plateRatio === r.ratio
                          ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs ring-1 ring-primary"
                          : "border-border/80 bg-background hover:bg-muted text-foreground"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Masterwork Plates Exhibition Framing Customization */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <span>Masterwork Plates Exhibition Framing:</span>
                  <Badge variant="outline" className={`text-[10px] font-mono ${
                    (coverConfig.borderConfig?.syncArtworkPlates ?? coverConfig.syncArtworkPlates)
                      ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10"
                      : "border-border text-muted-foreground bg-muted/40"
                  }`}>
                    {(coverConfig.borderConfig?.syncArtworkPlates ?? coverConfig.syncArtworkPlates) ? "Exhibition Matting Active" : "Default Border"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Wrap each artwork masterwork plate in the same outer matting canvas, inner framing fillet, and margin thickness configured on the Cover Page.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 shrink-0 transition-colors">
              <input
                type="checkbox"
                checked={coverConfig.borderConfig?.syncArtworkPlates ?? coverConfig.syncArtworkPlates ?? false}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setCoverConfig((prev) => ({
                    ...prev,
                    syncArtworkPlates: checked,
                    borderConfig: {
                      ...(prev.borderConfig || {}),
                      syncArtworkPlates: checked,
                    },
                  }));
                }}
                className="rounded border-border text-amber-600 focus:ring-amber-500 h-4 w-4"
              />
              <span className="text-amber-800 dark:text-amber-300 font-bold">Apply Exhibition Frame to Plates</span>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-serif font-bold text-foreground">
                Exhibition Artwork Plates ({plates.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Sequence the masterworks in order of exhibition display. Add custom curatorial notes for each plate.
              </p>
            </div>
            <Button
              onClick={() => setArtworkPickerOpen(true)}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Artworks to Catalog
            </Button>
          </div>

          {plates.length === 0 ? (
            <Card className="border-dashed p-10 text-center">
              <Palette className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">No Artwork Plates Added</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Select paintings from your collection to include as high-fidelity plates in this e-catalog.
              </p>
              <Button onClick={() => setArtworkPickerOpen(true)} size="sm" variant="outline">
                <Plus className="w-3.5 h-3.5 mr-1" /> Select Artworks
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {plates.map((plate, index) => (
                <Card
                  key={plate.artworkId}
                  className="border border-border/80 bg-card p-4 transition-all hover:border-primary/40"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Artwork Preview & Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                        {index + 1}
                      </div>

                      <div className="w-14 h-14 rounded-md overflow-hidden border border-border bg-background shrink-0 shadow-sm">
                        <img
                          src={plate.artwork.primaryImageUrl}
                          alt={plate.artwork.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-serif font-bold text-foreground truncate">
                            {plate.artwork.title}
                          </h4>
                          {plate.highlightPlate && (
                            <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">
                              Highlight
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {plate.artwork.medium || "Traditional Classical Fine Art"}
                          {plate.artwork.yearCreated ? ` • ${plate.artwork.yearCreated}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Controls & Ordering */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <Button
                        variant={plate.highlightPlate ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleHighlightPlate(index)}
                        className={`h-7 px-2 text-[11px] gap-1 cursor-pointer ${
                          plate.highlightPlate
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="Toggle Exhibition Highlight Plate"
                      >
                        <Star className={`w-3 h-3 ${plate.highlightPlate ? "fill-current" : ""}`} />
                        {plate.highlightPlate ? "Highlight" : "Feature"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => movePlate(index, "up")}
                        disabled={index === 0}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => movePlate(index, "down")}
                        disabled={index === plates.length - 1}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePlate(index)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="Remove Plate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Custom Page Heading & Subheading Configuration */}
                  <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-5 space-y-1">
                      <label className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                        <span>Plate Heading</span>
                        <span className="text-[10px] text-muted-foreground font-normal">Defaults to title</span>
                      </label>
                      <Input
                        value={plate.customTitle || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPlates((prev) => {
                            const copy = [...prev];
                            copy[index].customTitle = val;
                            return copy;
                          });
                        }}
                        placeholder={plate.artwork.title}
                        className="text-xs bg-muted/20"
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                        <span>Subheading / Provenance</span>
                        <span className="text-[10px] text-muted-foreground font-normal">Tagline</span>
                      </label>
                      <Input
                        value={plate.customSubtitle || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPlates((prev) => {
                            const copy = [...prev];
                            copy[index].customSubtitle = val;
                            return copy;
                          });
                        }}
                        placeholder={`${plate.artwork.category?.name || "Traditional Indian School"}${plate.artwork.yearCreated ? ` • ${plate.artwork.yearCreated}` : ""}`}
                        className="text-xs bg-muted/20"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1 pb-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          checked={plate.showPlateNumber ?? true}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setPlates((prev) => {
                              const copy = [...prev];
                              copy[index].showPlateNumber = checked;
                              return copy;
                            });
                          }}
                          className="rounded border-border accent-primary w-4 h-4 cursor-pointer"
                        />
                        <span className="text-[11px] font-medium text-foreground">Show &quot;Plate X of Y&quot;</span>
                      </label>
                    </div>
                  </div>

                  {/* Curatorial Plate Note & Plate Layout Override */}
                  <div className="mt-2.5 pt-2.5 border-t border-border/40 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                    <div className="md:col-span-3">
                      <Input
                        value={plate.curatorialNote || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPlates((prev) => {
                            const copy = [...prev];
                            copy[index].curatorialNote = val;
                            return copy;
                          });
                        }}
                        placeholder="Add plate commentary, iconographic symbolism, or provenance note for this artwork..."
                        className="text-xs bg-muted/20"
                      />
                    </div>
                    <div>
                      <Select
                        value={plate.plateLayout || "DEFAULT"}
                        onValueChange={(val) => {
                          setPlates((prev) => {
                            const copy = [...prev];
                            copy[index].plateLayout = val === "DEFAULT" ? null : (val as "SIDE_BY_SIDE" | "STACKED" | "TOP_LEFT_FLOW");
                            return copy;
                          });
                        }}
                      >
                        <SelectTrigger className="text-xs h-9 bg-muted/20">
                          <SelectValue placeholder="Plate Layout" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DEFAULT">
                            Default ({plateLayout === "SIDE_BY_SIDE" ? `Side-by-Side (${plateRatio})` : plateLayout === "TOP_LEFT_FLOW" ? "Top-Left Flow" : "Stacked"})
                          </SelectItem>
                          <SelectItem value="SIDE_BY_SIDE">Side-by-Side Split</SelectItem>
                          <SelectItem value="STACKED">Stacked (Top/Bottom)</SelectItem>
                          <SelectItem value="TOP_LEFT_FLOW">Top-Left Floated (Flow)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 4: Colophon & End Page */}
        <TabsContent value="colophon" className="space-y-5">
          <Card className="border border-border/80 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-serif font-bold">Colophon &amp; Closing Page</CardTitle>
                  <CardDescription className="text-xs">
                    Scholarly colophon, artist biography, atelier provenance, copyright, and studio contact details.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">Include End Page:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={endPageConfig.isEnabled ?? true}
                      onChange={(e) =>
                        setEndPageConfig((prev) => ({ ...prev, isEnabled: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </CardHeader>

            {endPageConfig.isEnabled !== false && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Colophon Eyebrow Badge</label>
                    <Input
                      value={endPageConfig.eyebrowText || ""}
                      onChange={(e) =>
                        setEndPageConfig((prev) => ({ ...prev, eyebrowText: e.target.value }))
                      }
                      placeholder="e.g. Colophon & Publication Details"
                      className="text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Header pill displayed above the colophon title.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Colophon Title</label>
                    <Input
                      value={endPageConfig.title || ""}
                      onChange={(e) =>
                        setEndPageConfig((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="e.g. Colophon & Atelier Heritage"
                      className="text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Main title for the concluding page.
                    </p>
                  </div>
                </div>

                {/* Colophon Presentation Engine */}
                <div className="pt-2 border-t border-border/60 space-y-4">
                  <EditorialModeSwitcher
                    label="Colophon Presentation Engine"
                    mode={
                      endPageConfig.mode ||
                      (endPageConfig.useMatrixLayout ? "MATRIX" : "WYSIWYG")
                    }
                    onChange={(newMode) => {
                      setEndPageConfig((prev) => ({
                        ...prev,
                        mode: newMode,
                        useMatrixLayout: newMode === "MATRIX",
                      }));
                    }}
                  />

                  {/* Mode A: Single Image Plate */}
                  {endPageConfig.mode === "SINGLE_PLATE" && (
                    <div className="pt-2">
                      <CatalogSinglePlateEditor
                        sectionLabel="Colophon Closing Plate"
                        config={{
                          primaryImageUrl: endPageConfig.singlePlateConfig?.primaryImageUrl || "",
                          presentation: endPageConfig.singlePlateConfig?.presentation || "contained",
                          mattingBgColor: endPageConfig.singlePlateConfig?.mattingBgColor || endPageConfig.backgroundColor || "#FAF7F2",
                          focalPosition: endPageConfig.singlePlateConfig?.focalPosition,
                          headerSlot: endPageConfig.singlePlateConfig?.headerSlot,
                          footerSlot: endPageConfig.singlePlateConfig?.footerSlot,
                          leftSpineSlot: endPageConfig.singlePlateConfig?.leftSpineSlot,
                          rightSpineSlot: endPageConfig.singlePlateConfig?.rightSpineSlot,
                        }}
                        onChange={(upd) => {
                          setEndPageConfig((prev) => ({
                            ...prev,
                            singlePlateConfig: {
                              ...prev.singlePlateConfig,
                              ...upd,
                            },
                          }));
                        }}
                      />
                    </div>
                  )}

                  {/* Mode B: WYSIWYG Editor */}
                  {(endPageConfig.mode === "WYSIWYG" || (!endPageConfig.mode && !endPageConfig.useMatrixLayout)) && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Closing Statement / Artist Biography</label>
                      <div className="rounded-md border border-input bg-card/60 p-1 shadow-sm">
                        <TiptapEditor
                          content={endPageConfig.contentHtml || ""}
                          onChange={(_, html) =>
                            setEndPageConfig((prev) => ({ ...prev, contentHtml: html }))
                          }
                          placeholder="Compose concluding scholarly remarks, artist background, technique provenance, or exhibition credits..."
                          catalogPageSize={pageSize}
                          catalogOrientation={orientation}
                          className="min-h-[220px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Mode C: Advanced Matrix Studio */}
                  {(endPageConfig.mode === "MATRIX" || (endPageConfig.useMatrixLayout && endPageConfig.mode !== "WYSIWYG" && endPageConfig.mode !== "SINGLE_PLATE")) && (
                    <div className="pt-2">
                      <CatalogMatrixStudio
                        pageTitle={endPageConfig.title || "Colophon & Atelier Heritage"}
                        pageType="END_PAGE"
                        config={
                          endPageConfig.matrixConfig || {
                            matrixRows: 2,
                            matrixCols: 2,
                            rowHeights: "1fr 1fr",
                            colWidths: "1fr 1fr",
                            hasHeader: false,
                            hasFooter: false,
                            verticalSpineMode: "NONE",
                            segments: reconcileMatrixCells(2, 2, []),
                          }
                        }
                        onChange={(upd) =>
                          setEndPageConfig((prev) => {
                            const currentMatrix = prev.matrixConfig || {
                              matrixRows: 2,
                              matrixCols: 2,
                              rowHeights: "1fr 1fr",
                              colWidths: "1fr 1fr",
                              hasHeader: false,
                              hasFooter: false,
                              verticalSpineMode: "NONE",
                              segments: reconcileMatrixCells(2, 2, []),
                            };
                            const newRows = upd.matrixRows ?? currentMatrix.matrixRows;
                            const newCols = upd.matrixCols ?? currentMatrix.matrixCols;
                            let newSegments = upd.segments ?? currentMatrix.segments;
                            if (newSegments) {
                              newSegments = reconcileMatrixCells(newRows, newCols, newSegments);
                            }
                            return {
                              ...prev,
                              useMatrixLayout: true,
                              matrixConfig: {
                                ...currentMatrix,
                                ...upd,
                                matrixRows: newRows,
                                matrixCols: newCols,
                                segments: newSegments,
                              },
                            };
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <CatalogBackgroundControl
                    config={{
                      backgroundType: endPageConfig.backgroundType || "COLOR",
                      backgroundColor: endPageConfig.backgroundColor || "#FAF7F2",
                      backgroundPattern: endPageConfig.backgroundPattern || "mandala-filigree",
                      patternOpacity: endPageConfig.patternOpacity ?? 0.15,
                      backgroundImage: endPageConfig.backgroundImage || "",
                      overlayOpacity: endPageConfig.overlayOpacity ?? 0.2,
                      frameStyle: endPageConfig.frameStyle || "gold-fillet",
                    }}
                    onChange={(upd) => setEndPageConfig((prev) => ({ ...prev, ...upd }))}
                    title="Colophon & End Page Background & Framing"
                    description="Customize canvas backdrop, sacred pattern, and framing specifically for this closing page."
                  />
                </div>

                {/* Colophon Typography & Colors */}
                <div className="space-y-4 pt-4 border-t border-border/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" /> 🖋️ Colophon Typography &amp; Text Colors
                      </label>
                      <p className="text-[11px] text-muted-foreground">
                        Configure high-contrast text and title colors for concluding remarks and atelier credentials.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEndPageConfig((prev) => ({
                          ...prev,
                          colophonTitleColor: "#0F172A",
                          colophonTextColor: "#334155",
                        }))
                      }
                      className="h-7 text-[11px] border-primary/40 text-primary hover:bg-primary/10 gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset to Defaults
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border/80 bg-muted/20">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Colophon Title Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={endPageConfig.colophonTitleColor || "#0F172A"}
                          onChange={(e) =>
                            setEndPageConfig((prev) => ({ ...prev, colophonTitleColor: e.target.value }))
                          }
                          className="w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent shrink-0"
                        />
                        <Input
                          value={endPageConfig.colophonTitleColor || ""}
                          onChange={(e) =>
                            setEndPageConfig((prev) => ({ ...prev, colophonTitleColor: e.target.value }))
                          }
                          className="text-xs font-mono"
                          placeholder="#0F172A"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Colophon Body Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={endPageConfig.colophonTextColor || "#334155"}
                          onChange={(e) =>
                            setEndPageConfig((prev) => ({ ...prev, colophonTextColor: e.target.value }))
                          }
                          className="w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent shrink-0"
                        />
                        <Input
                          value={endPageConfig.colophonTextColor || ""}
                          onChange={(e) =>
                            setEndPageConfig((prev) => ({ ...prev, colophonTextColor: e.target.value }))
                          }
                          className="text-xs font-mono"
                          placeholder="#334155"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-foreground">Atelier Contact &amp; Copyright Notice</label>
                  <Input
                    value={endPageConfig.contactDetails || ""}
                    onChange={(e) =>
                      setEndPageConfig((prev) => ({ ...prev, contactDetails: e.target.value }))
                    }
                    placeholder="e.g. SavazAI Atelier | contact@savazar.com | All rights reserved."
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-foreground">Legal &amp; Reproduction Prohibition Notice</label>
                  <Input
                    value={endPageConfig.legalNotice || ""}
                    onChange={(e) =>
                      setEndPageConfig((prev) => ({ ...prev, legalNotice: e.target.value }))
                    }
                    placeholder="e.g. Reproduction of sacred iconography and Tanjore masterworks strictly prohibited without written consent."
                    className="text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Displayed at the very bottom of the closing colophon page.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Tab 5: Publication & PDF */}
        <TabsContent value="pdf" className="space-y-5">
          <Card className="border border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif font-bold">
                Publication Status &amp; PDF Distribution
              </CardTitle>
              <CardDescription className="text-xs">
                Publish this volume to the public directory and attach pre-rendered printable PDF brochures.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border/80 bg-muted/20">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground">Public Availability</span>
                  <p className="text-[11px] text-muted-foreground">
                    When published, visitors can access the full interactive e-catalog at <span className="font-mono text-primary">/catalogs/{slug}</span>.
                  </p>
                </div>
                <Button
                  type="button"
                  variant={isPublished ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsPublished(!isPublished)}
                  className="cursor-pointer text-xs"
                >
                  {isPublished ? "Published (Live)" : "Draft (Private)"}
                </Button>
              </div>

              {/* Layout & Specs Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg border border-border/60 bg-muted/10 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">Orientation</span>
                  <span className="font-semibold text-foreground capitalize">{orientation}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">Plate Layout</span>
                  <span className="font-semibold text-primary">{plateLayout === "SIDE_BY_SIDE" ? "Side-by-Side (55:45)" : "Stacked"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">Framing Style</span>
                  <span className="font-semibold text-foreground capitalize">{themeConfig.frameStyle || "gold-fillet"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-muted-foreground block">Total Plates</span>
                  <span className="font-semibold text-foreground">{plates.length} Masterworks</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileDown className="w-3.5 h-3.5 text-primary" /> Downloadable PDF Catalog Document
                </label>
                <MediaUploader
                  value={downloadablePdfUrl}
                  onUploadComplete={(url) => setDownloadablePdfUrl(url)}
                  onRemove={() => setDownloadablePdfUrl("")}
                  mediaType="document"
                  description="Upload a print-ready PDF monograph (supports high-res vector catalogs up to 50MB)."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Artwork Picker Dialog */}
      <Dialog open={artworkPickerOpen} onOpenChange={setArtworkPickerOpen}>
        <DialogContent className="max-w-3xl w-full max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Select Masterworks for Catalog</DialogTitle>
            <DialogDescription className="text-xs">
              Click any artwork card to toggle its inclusion in this digital exhibition catalog. Selected masterworks will appear in the plate sequence.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search artworks by title, school, or medium..."
                value={artworkSearch}
                onChange={(e) => setArtworkSearch(e.target.value)}
                className="text-xs pl-8"
              />
            </div>
            <Badge variant="outline" className="text-xs shrink-0 font-mono py-1 px-2.5">
              {plates.length} of {availableArtworks.length} Selected
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[55vh]">
            {availableArtworks.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                No artworks found in your collection archive. Add masterworks in the Artwork Catalog first.
              </div>
            ) : availableArtworks.filter((a) =>
                a.title.toLowerCase().includes(artworkSearch.toLowerCase()) ||
                (a.medium && a.medium.toLowerCase().includes(artworkSearch.toLowerCase())) ||
                (a.category?.name && a.category.name.toLowerCase().includes(artworkSearch.toLowerCase()))
              ).length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                No artworks matched your search query &ldquo;{artworkSearch}&rdquo;.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableArtworks
                  .filter((a) =>
                    a.title.toLowerCase().includes(artworkSearch.toLowerCase()) ||
                    (a.medium && a.medium.toLowerCase().includes(artworkSearch.toLowerCase())) ||
                    (a.category?.name && a.category.name.toLowerCase().includes(artworkSearch.toLowerCase()))
                  )
                  .map((art) => {
                    const isSelected = plates.some((p) => p.artworkId === art.id);
                    const plateIndex = plates.findIndex((p) => p.artworkId === art.id);

                    return (
                      <div
                        key={art.id}
                        onClick={() => toggleArtworkPlate(art)}
                        className={`group relative flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? "border-primary/80 bg-primary/10 shadow-sm ring-2 ring-primary/30"
                            : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30"
                        }`}
                      >
                        {/* Artwork Thumbnail */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-border bg-background shrink-0 shadow-sm relative">
                          <img
                            src={art.primaryImageUrl}
                            alt={art.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {isSelected && (
                            <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-mono font-bold shadow-md">
                              {plateIndex + 1}
                            </div>
                          )}
                        </div>

                        {/* Artwork Metadata */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-serif font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {art.title}
                            </h4>
                            {isSelected ? (
                              <Badge className="text-[10px] bg-primary text-primary-foreground shrink-0 px-1.5 py-0">
                                <Check className="w-2.5 h-2.5 mr-0.5" /> Included
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0 px-1.5 py-0">
                                + Add
                              </Badge>
                            )}
                          </div>

                          <p className="text-[11px] text-primary/90 font-mono truncate">
                            {art.category?.name || "Traditional School"}
                          </p>

                          <p className="text-[10px] text-muted-foreground truncate">
                            {art.medium}
                            {art.dimensions ? ` • ${art.dimensions}` : ""}
                            {art.yearCreated ? ` • ${art.yearCreated}` : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-border flex items-center justify-between sm:justify-between">
            <span className="text-xs text-muted-foreground font-mono">
              {plates.length} plate{plates.length === 1 ? "" : "s"} ready for sequencing
            </span>
            <Button size="sm" onClick={() => setArtworkPickerOpen(false)} className="cursor-pointer">
              Done Selecting ({plates.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cross-Module Printable Placards Sheet */}
      {catalogPlacardArtworks.length > 0 && (
        <ArtworkPlacardSheet
          open={isPlacardSheetOpen}
          onOpenChange={setIsPlacardSheetOpen}
          artworks={catalogPlacardArtworks}
        />
      )}
    </div>
  );
}
