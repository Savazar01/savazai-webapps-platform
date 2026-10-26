"use client";

import * as React from "react";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  ImagePlus,
  Sparkles,
  Link as LinkIcon,
  UploadCloud,
  Clock,
  Layers,
  Square,
  Film,
  Palette,
  Landmark,
  Sliders,
  MoveHorizontal,
  MoveVertical,
  Maximize2,
  LayoutGrid,
  Columns,
  Rows,
  Split,
  ChevronLeft,
  ChevronRight,
  Eye,
  GripVertical,
  RotateCcw,
  Search,
  Frame,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UniversalMediaDialog } from "@/components/admin/universal-media-dialog";
import { optimizeImageForWebpUpload } from "@/lib/client-image-optimizer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaGalleryItem, MediaGalleryDisplayMode } from "@/components/public/blocks/media-gallery-block";
import type {
  ExhibitionWallConfig,
  WallArtworkLayoutType,
  WallFrameStyle,
} from "@/components/public/blocks/gallery-exhibition-wall/exhibition-wall-block";
import { WALL_ENVIRONMENTS } from "@/components/public/blocks/gallery-exhibition-wall/exhibition-environments";
import { cn } from "@/lib/utils";

export function isRawFilenameOrUuid(str?: string | null): boolean {
  if (!str) return false;
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(str) ||
    /\.(webp|jpg|jpeg|png|gif|svg|avif)$/i.test(str) ||
    /^[0-9a-f-]{20,}/i.test(str) ||
    /^https?:\/\/.*\.(webp|jpg|jpeg|png|gif|svg|avif)$/i.test(str)
  );
}

export function stripHtmlTags(str?: string | null): string {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export interface LayoutPresetOption {
  id: WallArtworkLayoutType;
  label: string;
  badge: string;
  desc: string;
}

export function getLayoutPresetsForCount(count: number): LayoutPresetOption[] {
  if (count <= 1) {
    return [
      { id: "single-centered", label: "Centerpiece", badge: "Center", desc: "Centered at 1.55m eye-level" },
      { id: "single-left", label: "Flank Left", badge: "Left", desc: "Shifted 1.8m left for room furniture" },
      { id: "single-right", label: "Flank Right", badge: "Right", desc: "Shifted 1.8m right for room decor" },
    ];
  }
  if (count === 2) {
    return [
      { id: "horizontal-2", label: "Horizontal Line", badge: "Side by Side", desc: "2 artworks at 1.55m centerline" },
      { id: "vertical-2", label: "Vertical Column", badge: "Stacked", desc: "2 artworks vertically stacked (0.28m clearance)" },
    ];
  }
  if (count === 3) {
    return [
      { id: "horizontal-3", label: "Horizontal Line", badge: "1×3 Line", desc: "3 artworks in horizontal promenade" },
      { id: "vertical-3", label: "Vertical Column", badge: "3×1 Stack", desc: "3 artworks vertically stacked centered" },
      { id: "pyramid-1-2", label: "Pyramid", badge: "1 Top / 2 Bottom", desc: "1 crown centerpiece above 2 flanking pieces" },
      { id: "inverted-pyramid-2-1", label: "Inverted Pyramid", badge: "2 Top / 1 Bottom", desc: "2 upper pieces above 1 centered grounding piece" },
    ];
  }
  if (count === 4) {
    return [
      { id: "grid-2x2", label: "Balanced 2×2 Grid", badge: "Quad Grid", desc: "Balanced quad with guaranteed vertical clearance" },
      { id: "horizontal-4", label: "Horizontal Line", badge: "1×4 Line", desc: "4 artworks across eye-level promenade" },
      { id: "pyramid-1-3", label: "Crown + 3 Under", badge: "1 Top / 3 Bottom", desc: "1 centerpiece above 3 lower works" },
      { id: "pyramid-3-1", label: "3 Over + Center", badge: "3 Top / 1 Bottom", desc: "3 upper works above 1 centered work" },
      { id: "salon-4", label: "Classical Salon Quad", badge: "Salon", desc: "Asymmetric classical heights (1.85m / 1.25m)" },
    ];
  }
  if (count === 5) {
    return [
      { id: "centerpiece-flanked-5", label: "Centerpiece + 2 Flanking", badge: "1 Center / 4 Flank", desc: "1 dominant center flanked by 2 stacked pairs" },
      { id: "staggered-2-3", label: "2 Over, 3 Under", badge: "2 Top / 3 Bottom", desc: "2 upper artworks over 3 lower artworks" },
      { id: "staggered-3-2", label: "3 Over, 2 Under", badge: "3 Top / 2 Bottom", desc: "3 upper artworks over 2 lower artworks" },
      { id: "horizontal-5", label: "Horizontal Line", badge: "1×5 Line", desc: "5 artworks in panoramic alignment" },
    ];
  }
  if (count === 6) {
    return [
      { id: "grid-3x2", label: "Wide Grid (3 Col × 2 Row)", badge: "3×2 Matrix", desc: "Wide gallery 6-artwork salon" },
      { id: "grid-2x3", label: "Vertical Grid (2 Col × 3 Row)", badge: "2×3 Matrix", desc: "High-ceiling archival 6-artwork salon" },
      { id: "horizontal-6", label: "Horizontal Line", badge: "1×6 Line", desc: "6 artworks in panoramic promenade" },
    ];
  }
  return [
    { id: "auto-balanced", label: "Automatic Curatorial Multi-Row", badge: "Multi-Row", desc: "Auto-balances artworks evenly into non-overlapping rows" },
  ];
}

export function getSchematicArtworkPositions(
  count: number,
  layout: WallArtworkLayoutType,
  spacingMult: number,
  offX: number,
  offY: number
): { leftPct: number; bottomPct: number }[] {
  const coords: { x: number; y: number }[] = [];

  if (count <= 1) {
    if (layout === "single-left") coords.push({ x: -1.8, y: 1.55 });
    else if (layout === "single-right") coords.push({ x: 1.8, y: 1.55 });
    else coords.push({ x: 0, y: 1.55 });
  } else if (count === 2) {
    if (layout === "vertical-2") {
      coords.push({ x: 0, y: 2.25 }, { x: 0, y: 0.85 });
    } else {
      coords.push({ x: -1.4, y: 1.55 }, { x: 1.4, y: 1.55 });
    }
  } else if (count === 3) {
    if (layout === "vertical-3") {
      coords.push({ x: 0, y: 2.5 }, { x: 0, y: 1.55 }, { x: 0, y: 0.6 });
    } else if (layout === "pyramid-1-2") {
      coords.push({ x: 0, y: 2.35 }, { x: -1.4, y: 0.85 }, { x: 1.4, y: 0.85 });
    } else if (layout === "inverted-pyramid-2-1") {
      coords.push({ x: -1.4, y: 2.25 }, { x: 1.4, y: 2.25 }, { x: 0, y: 0.85 });
    } else {
      coords.push({ x: -2.4, y: 1.55 }, { x: 0, y: 1.55 }, { x: 2.4, y: 1.55 });
    }
  } else if (count === 4) {
    if (layout === "horizontal-4") {
      coords.push({ x: -3.6, y: 1.55 }, { x: -1.2, y: 1.55 }, { x: 1.2, y: 1.55 }, { x: 3.6, y: 1.55 });
    } else if (layout === "pyramid-1-3") {
      coords.push({ x: 0, y: 2.4 }, { x: -2.4, y: 0.85 }, { x: 0, y: 0.85 }, { x: 2.4, y: 0.85 });
    } else if (layout === "pyramid-3-1") {
      coords.push({ x: -2.4, y: 2.25 }, { x: 0, y: 2.25 }, { x: 2.4, y: 2.25 }, { x: 0, y: 0.75 });
    } else if (layout === "salon-4") {
      coords.push({ x: -1.6, y: 2.1 }, { x: 1.6, y: 1.8 }, { x: -1.3, y: 0.85 }, { x: 1.7, y: 0.95 });
    } else {
      coords.push({ x: -1.4, y: 2.25 }, { x: 1.4, y: 2.25 }, { x: -1.4, y: 0.85 }, { x: 1.4, y: 0.85 });
    }
  } else if (count === 5) {
    if (layout === "centerpiece-flanked-5") {
      coords.push({ x: 0, y: 1.55 }, { x: -2.2, y: 2.25 }, { x: -2.2, y: 0.85 }, { x: 2.2, y: 2.25 }, { x: 2.2, y: 0.85 });
    } else if (layout === "staggered-2-3") {
      coords.push({ x: -1.3, y: 2.25 }, { x: 1.3, y: 2.25 }, { x: -2.2, y: 0.85 }, { x: 0, y: 0.85 }, { x: 2.2, y: 0.85 });
    } else if (layout === "staggered-3-2") {
      coords.push({ x: -2.2, y: 2.25 }, { x: 0, y: 2.25 }, { x: 2.2, y: 2.25 }, { x: -1.3, y: 0.85 }, { x: 1.3, y: 0.85 });
    } else {
      coords.push({ x: -4.0, y: 1.55 }, { x: -2.0, y: 1.55 }, { x: 0, y: 1.55 }, { x: 2.0, y: 1.55 }, { x: 4.0, y: 1.55 });
    }
  } else if (count === 6) {
    if (layout === "grid-2x3") {
      coords.push(
        { x: -1.4, y: 2.6 }, { x: 1.4, y: 2.6 },
        { x: -1.4, y: 1.55 }, { x: 1.4, y: 1.55 },
        { x: -1.4, y: 0.5 }, { x: 1.4, y: 0.5 }
      );
    } else if (layout === "horizontal-6") {
      coords.push(
        { x: -4.5, y: 1.55 }, { x: -2.7, y: 1.55 }, { x: -0.9, y: 1.55 },
        { x: 0.9, y: 1.55 }, { x: 2.7, y: 1.55 }, { x: 4.5, y: 1.55 }
      );
    } else {
      coords.push(
        { x: -2.4, y: 2.25 }, { x: 0, y: 2.25 }, { x: 2.4, y: 2.25 },
        { x: -2.4, y: 0.85 }, { x: 0, y: 0.85 }, { x: 2.4, y: 0.85 }
      );
    }
  } else {
    const half = Math.ceil(count / 2);
    for (let i = 0; i < count; i++) {
      const isTop = i < half;
      const rowIdx = isTop ? i : i - half;
      const rowLen = isTop ? half : count - half;
      const rx = (rowIdx - (rowLen - 1) / 2) * 1.5;
      coords.push({ x: rx, y: isTop ? 2.25 : 0.85 });
    }
  }

  return coords.map((pt) => {
    const fx = pt.x * spacingMult + offX;
    const fy = pt.y + offY;
    const leftPct = Math.max(8, Math.min(92, 50 + (fx / 12) * 100));
    const bottomPct = Math.max(10, Math.min(90, (fy / 3.4) * 100));
    return { leftPct, bottomPct };
  });
}

export interface MediaGalleryBlockData {
  displayMode?: MediaGalleryDisplayMode;
  autoplayTimer?: number;
  aspectRatio?: "landscape" | "portrait" | "square" | "natural";
  frameStyle?: "heritage" | "minimal" | "floating" | "none";
  kenBurnsOverlayTheme?: "dark-velvet" | "parchment-gold" | "minimal-subtle";
  overlayTitleColor?: string;
  overlayTextColor?: string;
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
  overviewWallDwell?: number;
  showExhibitionBadge?: boolean;
  maxArtworksPerWall?: number;
  showMetadataCardBelowWall?: boolean;
  showFrameHeader?: boolean;
  frameHeaderBg?: string;
  frameHeaderTextColor?: string;
  items?: MediaGalleryItem[];
}

export interface MediaGalleryInspectorProps {
  data: MediaGalleryBlockData;
  onChange: (updated: MediaGalleryBlockData) => void;
}

export function MediaGalleryInspector({ data, onChange }: MediaGalleryInspectorProps) {
  const displayMode = data.displayMode ?? "carousel";
  const autoplayTimer = data.autoplayTimer ?? 5;
  const aspectRatio = data.aspectRatio ?? "landscape";
  const frameStyle = data.frameStyle ?? "heritage";
  const kenBurnsOverlayTheme = data.kenBurnsOverlayTheme ?? "dark-velvet";
  const overlayTitleColor = data.overlayTitleColor ?? "";
  const overlayTextColor = data.overlayTextColor ?? "";
  const canvasBgColor = data.canvasBgColor ?? "";
  const canvasBgImageUrl = data.canvasBgImageUrl ?? "";
  const canvasBgMode = data.canvasBgMode ?? "cover";
  const canvasBgOpacity = data.canvasBgOpacity ?? 85;
  const borderFilletColor = data.borderFilletColor ?? "#D4AF37";
  const borderWidth = data.borderWidth ?? 0;
  const framePadding = data.framePadding ?? 0;
  const showCaptionRibbon = data.showCaptionRibbon ?? false;
  const environmentId = data.culturalEnvironment ?? data.environmentId ?? "modern-minimalist";
  const customWallUrl = data.customWallBackdropUrl ?? data.customWallUrl ?? "";
  const wallBackgroundMode = data.wallBackgroundMode ?? "uniform";
  const wallCustomBackgrounds = data.wallCustomBackgrounds ?? [];
  const cameraTourStyle = data.cameraTourStyle ?? "drone";
  const cameraTransitionStyle = data.cameraTransitionStyle ?? "pan-zoom";
  const wallLayout = data.wallLayout ?? "salon";
  const autoplayTour = data.autoplayTour ?? true;
  const overviewDwellSeconds = data.overviewDwellSeconds ?? (data as Record<string, unknown>).overviewWallDwell as number ?? 4;
  const maxArtworksPerWall = data.maxArtworksPerWall ?? 4;
  const showMetadataCardBelowWall = data.showMetadataCardBelowWall ?? true;
  const showFrameHeader = data.showFrameHeader ?? false;
  const frameHeaderBg = data.frameHeaderBg ?? "#0F0E0D";
  const frameHeaderTextColor = data.frameHeaderTextColor ?? "#F5EBE1";
  const items = data.items ?? [];
  const wallConfigs = data.wallConfigs;

  // Local state cache for smooth slider drags and reliable persistence
  const [localWallConfigs, setLocalWallConfigs] = React.useState<ExhibitionWallConfig[] | null>(null);

  // Catalog Artworks Search Dialog State
  const [isCatalogSearchOpen, setIsCatalogSearchOpen] = React.useState(false);
  const [catalogArtworks, setCatalogArtworks] = React.useState<{
    id: string;
    title: string;
    primaryImageUrl?: string | null;
    images?: string[];
    medium?: string | null;
    dimensions?: string | null;
    year?: string | number | null;
    slug?: string;
    category?: { id: string; name: string } | null;
  }[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = React.useState(false);
  const [catalogSearchQuery, setCatalogSearchQuery] = React.useState("");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = React.useState("ALL");

  const handleOpenCatalogSearch = React.useCallback(() => {
    setIsCatalogSearchOpen(true);
    setIsLoadingCatalog(true);
    fetch("/api/admin/artworks")
      .then((res) => (res.ok ? res.json() : []))
      .then((artList: unknown) => {
        if (Array.isArray(artList)) {
          setCatalogArtworks(artList);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch artworks catalog:", err);
      })
      .finally(() => {
        setIsLoadingCatalog(false);
      });
  }, []);

  // Filtered catalog list
  const catalogCategories = React.useMemo(() => {
    const set = new Set<string>();
    catalogArtworks.forEach((art) => {
      if (art.category?.name) set.add(art.category.name);
    });
    return Array.from(set).sort();
  }, [catalogArtworks]);

  const filteredCatalogArtworks = React.useMemo(() => {
    return catalogArtworks.filter((art) => {
      const matchesCategory =
        catalogCategoryFilter === "ALL" || art.category?.name === catalogCategoryFilter;
      const q = catalogSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        art.title?.toLowerCase().includes(q) ||
        art.medium?.toLowerCase().includes(q) ||
        art.dimensions?.toLowerCase().includes(q) ||
        art.category?.name?.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [catalogArtworks, catalogCategoryFilter, catalogSearchQuery]);
  const effectiveWallConfigs = React.useMemo<ExhibitionWallConfig[]>(() => {
    if (localWallConfigs && localWallConfigs.length > 0) {
      return localWallConfigs;
    }
    if (wallConfigs && wallConfigs.length > 0) {
      return wallConfigs;
    }
    const count = Math.max(1, Math.ceil(items.length / maxArtworksPerWall));
    const configs: ExhibitionWallConfig[] = [];
    for (let w = 0; w < count; w++) {
      const slice = items.slice(w * maxArtworksPerWall, (w + 1) * maxArtworksPerWall);
      const artIds = slice.map((it) => it.id || it.artworkId || "").filter(Boolean);
      let layout: WallArtworkLayoutType = "auto-balanced";
      if (artIds.length === 1) layout = "single-centered";
      else if (artIds.length === 2) layout = "horizontal-2";
      else if (artIds.length === 3) layout = "horizontal-3";
      else if (artIds.length === 4) layout = "grid-2x2";
      else if (artIds.length === 5) layout = "centerpiece-flanked-5";
      else if (artIds.length === 6) layout = "grid-3x2";

      configs.push({
        wallIndex: w,
        artworkIds: artIds,
        layoutType: layout,
        frameStyle: "curated-mix",
        offsetX: 0,
        offsetY: 0,
        spacingMultiplier: 1.0,
        verticalGap: 0.48,
        customBackgroundUrl: wallCustomBackgrounds[w] || (wallBackgroundMode === "uniform" ? customWallUrl : undefined),
      });
    }
    return configs;
  }, [localWallConfigs, items, maxArtworksPerWall, wallCustomBackgrounds, wallBackgroundMode, customWallUrl]);

  const numWalls = Math.max(1, effectiveWallConfigs.length);
  const [selectedWallTab, setSelectedWallTab] = React.useState<number>(0);
  const [activeItemIndex, setActiveItemIndex] = React.useState<number>(0);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const wallFileInputRef = React.useRef<HTMLInputElement>(null);
  const perWallFileInputRef = React.useRef<HTMLInputElement>(null);
  const canvasBgFileInputRef = React.useRef<HTMLInputElement>(null);

  // Universal Media Dialog state
  const [isMediaDialogOpen, setIsMediaDialogOpen] = React.useState(false);
  const [mediaDialogTargetIndex, setMediaDialogTargetIndex] = React.useState<number | null>(null);
  const [mediaDialogWallIndex, setMediaDialogWallIndex] = React.useState<number>(0);
  const [mediaDialogMode, setMediaDialogMode] = React.useState<"items" | "customWall" | "perWall" | "canvasBg">("items");

  // Cached artworks and categories for item linking
  const [artworksList, setArtworksList] = React.useState<{
    id: string;
    title: string;
    slug: string;
    medium?: string;
    dimensions?: string;
    yearCreated?: number | string;
    description?: string;
    category?: { name: string };
    watermarkedWebpUrl?: string;
    primaryImageUrl?: string;
  }[]>([]);
  const [categoriesList, setCategoriesList] = React.useState<{ id: string; name: string; slug: string }[]>([]);

  React.useEffect(() => {
    // Fetch artworks with full curatorial metadata
    fetch("/api/admin/artworks")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setArtworksList(
            data.map(
              (a: {
                id: string;
                title: string;
                slug: string;
                medium?: string;
                dimensions?: string;
                yearCreated?: number | string;
                description?: string;
                category?: { name: string };
                watermarkedWebpUrl?: string;
                primaryImageUrl?: string;
              }) => ({
                id: a.id,
                title: a.title,
                slug: a.slug,
                medium: a.medium,
                dimensions: a.dimensions,
                yearCreated: a.yearCreated,
                description: a.description,
                category: a.category ? { name: a.category.name } : undefined,
                watermarkedWebpUrl: a.watermarkedWebpUrl,
                primaryImageUrl: a.primaryImageUrl,
              })
            )
          );
        }
      })
      .catch(() => {});

    // Fetch categories
    fetch("/api/admin/art-categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setCategoriesList(data.map((c: { id: string; name: string; slug: string }) => ({ id: c.id, name: c.name, slug: c.slug })));
        }
      })
      .catch(() => {});
  }, []);

  const handleModeChange = (mode: MediaGalleryDisplayMode) => {
    onChange({
      ...data,
      displayMode: mode,
    });
  };

  const handleTimerChange = (val: number) => {
    onChange({
      ...data,
      autoplayTimer: val,
    });
  };

  const handleAspectChange = (ratio: "landscape" | "portrait" | "square" | "natural") => {
    onChange({
      ...data,
      aspectRatio: ratio,
    });
  };

  const handleFrameChange = (style: "heritage" | "minimal" | "floating" | "none") => {
    onChange({
      ...data,
      frameStyle: style,
    });
  };

  const handleOverlayThemeChange = (theme: "dark-velvet" | "parchment-gold" | "minimal-subtle") => {
    onChange({
      ...data,
      kenBurnsOverlayTheme: theme,
    });
  };

  const handleTitleColorChange = (color: string) => {
    onChange({
      ...data,
      overlayTitleColor: color,
    });
  };

  const handleTextColorChange = (color: string) => {
    onChange({
      ...data,
      overlayTextColor: color,
    });
  };

  const handleCanvasBgColorChange = (color: string) => {
    onChange({
      ...data,
      canvasBgColor: color,
    });
  };

  const handleBorderFilletColorChange = (color: string) => {
    onChange({
      ...data,
      borderFilletColor: color,
    });
  };

  const handleBorderWidthChange = (w: number) => {
    onChange({
      ...data,
      borderWidth: w,
    });
  };

  const handleFramePaddingChange = (p: number) => {
    onChange({
      ...data,
      framePadding: p,
    });
  };

  const handleShowCaptionRibbonChange = (show: boolean) => {
    onChange({
      ...data,
      showCaptionRibbon: show,
    });
  };

  const handleEnvironmentChange = (env: string) => {
    onChange({
      ...data,
      environmentId: env,
      culturalEnvironment: env,
    });
  };

  const handleCustomWallUrlChange = (url: string) => {
    onChange({
      ...data,
      customWallUrl: url,
      customWallBackdropUrl: url,
      environmentId: url ? "custom" : data.environmentId,
      culturalEnvironment: url ? "custom" : data.culturalEnvironment,
    });
  };

  const handleWallBackgroundModeChange = (mode: "uniform" | "per-wall") => {
    onChange({
      ...data,
      wallBackgroundMode: mode,
    });
  };

  const handlePerWallUrlChange = (wallIndex: number, url: string) => {
    const copy = [...wallCustomBackgrounds];
    while (copy.length <= wallIndex) {
      copy.push("");
    }
    copy[wallIndex] = url;
    onChange({
      ...data,
      wallCustomBackgrounds: copy,
      environmentId: url ? "custom" : data.environmentId,
      culturalEnvironment: url ? "custom" : data.culturalEnvironment,
    });
  };

  const handleApplyWallToAll = (sourceIndex: number) => {
    const sourceUrl = wallCustomBackgrounds[sourceIndex] || customWallUrl;
    if (!sourceUrl) {
      toast.error("No background image on this wall to apply.");
      return;
    }
    const updated = Array(numWalls).fill(sourceUrl);
    onChange({
      ...data,
      customWallUrl: sourceUrl,
      customWallBackdropUrl: sourceUrl,
      wallCustomBackgrounds: updated,
      environmentId: "custom",
      culturalEnvironment: "custom",
    });
    toast.success(`Applied Wall #${sourceIndex + 1} background to all walls!`);
  };

  const handleUpdateWallConfig = (wIndex: number, updates: Partial<ExhibitionWallConfig>) => {
    const current = [...effectiveWallConfigs];
    while (current.length <= wIndex) {
      current.push({
        wallIndex: current.length,
        artworkIds: [],
        layoutType: "auto-balanced",
        frameStyle: "curated-mix",
        offsetX: 0,
        offsetY: 0,
        spacingMultiplier: 1.0,
        verticalGap: 0.48,
      });
    }
    current[wIndex] = {
      ...current[wIndex],
      ...updates,
      wallIndex: wIndex,
    };
    setLocalWallConfigs(current);
    onChange({
      ...data,
      wallConfigs: current,
    });
  };

  const handleAddWall = () => {
    const current = [...effectiveWallConfigs];
    const newWallIndex = current.length;
    current.push({
      wallIndex: newWallIndex,
      artworkIds: [],
      layoutType: "auto-balanced",
      frameStyle: "curated-mix",
      offsetX: 0,
      offsetY: 0,
      spacingMultiplier: 1.0,
      verticalGap: 0.48,
    });
    setLocalWallConfigs(current);
    onChange({
      ...data,
      wallConfigs: current,
    });
    setSelectedWallTab(newWallIndex);
    toast.success(`Created Wall #${newWallIndex + 1}!`);
  };

  const handleDeleteWall = (wIndex: number) => {
    if (effectiveWallConfigs.length <= 1) {
      toast.error("At least one wall must remain.");
      return;
    }
    const current = effectiveWallConfigs.filter((_, idx) => idx !== wIndex).map((w, idx) => ({
      ...w,
      wallIndex: idx,
    }));
    setLocalWallConfigs(current);
    onChange({
      ...data,
      wallConfigs: current,
    });
    setSelectedWallTab(Math.max(0, wIndex - 1));
    toast.success(`Deleted Wall #${wIndex + 1}.`);
  };

  const handleAddCatalogArtworkToWall = (
    wIndex: number,
    catalogArt: {
      id: string;
      title: string;
      primaryImageUrl?: string | null;
      images?: string[];
      medium?: string | null;
      dimensions?: string | null;
      year?: string | number | null;
      slug?: string;
    }
  ) => {
    // 1. Ensure artwork item is present in data.items
    const existingIndex = items.findIndex((it) => it.id === catalogArt.id || it.artworkId === catalogArt.id);
    const updatedItems = [...items];
    const artUrl = catalogArt.primaryImageUrl || catalogArt.images?.[0] || "";

    if (existingIndex < 0) {
      const newItem: MediaGalleryItem = enrichItemWithArtwork({
        id: catalogArt.id,
        artworkId: catalogArt.id,
        url: artUrl,
        title: catalogArt.title,
        alt: "",
        medium: catalogArt.medium || undefined,
        dimensions: catalogArt.dimensions || undefined,
        year: catalogArt.year ? String(catalogArt.year) : undefined,
        slug: catalogArt.slug,
      });
      updatedItems.push(newItem);
      onChange({
        ...data,
        items: updatedItems,
      });
    }

    // 2. Add artwork ID to current wall
    handleAddArtworkToWall(wIndex, catalogArt.id);
    setIsCatalogSearchOpen(false);
    toast.success(`Added "${catalogArt.title}" to Wall #${wIndex + 1}!`);
  };

  const handleReorderWallArtwork = (wIndex: number, slotIdx: number, direction: "prev" | "next") => {
    const wall = effectiveWallConfigs[wIndex];
    if (!wall || !wall.artworkIds) return;
    const targetIdx = direction === "prev" ? slotIdx - 1 : slotIdx + 1;
    if (targetIdx < 0 || targetIdx >= wall.artworkIds.length) return;
    const copy = [...wall.artworkIds];
    const [moved] = copy.splice(slotIdx, 1);
    copy.splice(targetIdx, 0, moved);
    handleUpdateWallConfig(wIndex, { artworkIds: copy });
  };

  const handleSwapWallArtwork = (wIndex: number, slotIdx: number, newArtworkId: string) => {
    const wall = effectiveWallConfigs[wIndex];
    if (!wall) return;
    const copy = [...(wall.artworkIds || [])];
    copy[slotIdx] = newArtworkId;
    handleUpdateWallConfig(wIndex, { artworkIds: copy });
  };

  const handleAddArtworkToWall = (wIndex: number, artworkId: string) => {
    const wall = effectiveWallConfigs[wIndex];
    const currentIds = wall?.artworkIds ? [...wall.artworkIds] : [];
    if (currentIds.length >= 8) {
      toast.error("Maximum 8 artworks allowed per wall for museum elegance.");
      return;
    }
    currentIds.push(artworkId);
    const newCount = currentIds.length;
    let nextLayout = wall?.layoutType || "auto-balanced";
    if (newCount === 1) nextLayout = "single-centered";
    else if (newCount === 2) nextLayout = "horizontal-2";
    else if (newCount === 3) nextLayout = "horizontal-3";
    else if (newCount === 4) nextLayout = "grid-2x2";
    else if (newCount === 5) nextLayout = "centerpiece-flanked-5";
    else if (newCount === 6) nextLayout = "grid-3x2";

    handleUpdateWallConfig(wIndex, { artworkIds: currentIds, layoutType: nextLayout });
  };

  const handleRemoveArtworkFromWall = (wIndex: number, slotIdx: number) => {
    const wall = effectiveWallConfigs[wIndex];
    if (!wall || !wall.artworkIds) return;
    const copy = wall.artworkIds.filter((_, idx) => idx !== slotIdx);
    const newCount = copy.length;
    let nextLayout = wall.layoutType;
    if (newCount === 1) nextLayout = "single-centered";
    else if (newCount === 2) nextLayout = "horizontal-2";
    else if (newCount === 3) nextLayout = "horizontal-3";
    else if (newCount === 4) nextLayout = "grid-2x2";
    else if (newCount === 5) nextLayout = "centerpiece-flanked-5";
    else if (newCount === 6) nextLayout = "grid-3x2";
    else if (newCount === 0) nextLayout = "auto-balanced";

    handleUpdateWallConfig(wIndex, { artworkIds: copy, layoutType: nextLayout });
  };

  const handleCanvasBgImageUrlChange = (url: string) => {
    onChange({
      ...data,
      canvasBgImageUrl: url,
    });
  };

  const handleCanvasBgModeChange = (mode: "cover" | "contain" | "tile" | "blur") => {
    onChange({
      ...data,
      canvasBgMode: mode,
    });
  };

  const handleCanvasBgOpacityChange = (opacity: number) => {
    onChange({
      ...data,
      canvasBgOpacity: opacity,
    });
  };

  const handleUploadFile = async (
    rawFile: File,
    target: "customWall" | "perWall" | "canvasBg",
    targetWallIndex = 0
  ) => {
    const file = await optimizeImageForWebpUpload(rawFile);
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    body.append("mediaType", "general");
    body.append("isArtwork", "false");

    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body,
      });
      if (res.ok) {
        const json = await res.json();
        const uploadedUrl = json.publicUrl || json.watermarkedUrl || json.primaryImageUrl;
        if (uploadedUrl) {
          if (target === "customWall") {
            handleCustomWallUrlChange(uploadedUrl);
            toast.success("Wall background image uploaded successfully!");
          } else if (target === "perWall") {
            handlePerWallUrlChange(targetWallIndex, uploadedUrl);
            toast.success(`Wall #${targetWallIndex + 1} background uploaded successfully!`);
          } else if (target === "canvasBg") {
            handleCanvasBgImageUrlChange(uploadedUrl);
            toast.success("Canvas background image uploaded successfully!");
          }
        } else {
          toast.error("Upload succeeded but URL was missing.");
        }
      } else {
        toast.error("Upload failed.");
      }
    } catch {
      toast.error("Network error during image upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleCameraTourStyleChange = (style: "overview" | "drone" | "walkthrough" | "inspection") => {
    onChange({
      ...data,
      cameraTourStyle: style,
    });
  };

  const handleWallLayoutChange = (layout: "salon" | "linear" | "grid") => {
    onChange({
      ...data,
      wallLayout: layout,
    });
  };

  const handleAutoplayTourChange = (auto: boolean) => {
    onChange({
      ...data,
      autoplayTour: auto,
    });
  };

  const handleOverviewDwellSecondsChange = (val: number) => {
    onChange({
      ...data,
      overviewDwellSeconds: val,
      overviewWallDwell: val,
    } as typeof data);
  };

  const handleMaxArtworksPerWallChange = (val: number) => {
    onChange({
      ...data,
      maxArtworksPerWall: val,
    });
  };

  const handleCameraTransitionStyleChange = (style: "pan-zoom" | "dolly" | "crossfade" | "cinematic-arc") => {
    onChange({
      ...data,
      cameraTransitionStyle: style,
    });
  };

  const handleShowMetadataCardBelowWallChange = (show: boolean) => {
    onChange({
      ...data,
      showMetadataCardBelowWall: show,
    });
  };

  const enrichItemWithArtwork = React.useCallback(
    (input: Partial<MediaGalleryItem> & { url: string; title?: string; alt?: string; originalFileName?: string; artworkId?: string; slug?: string }): MediaGalleryItem => {
      // Find matching artwork in catalog
      const matchingArt = artworksList.find(
        (a) =>
          (input.artworkId && a.id === input.artworkId) ||
          (input.slug && a.slug === input.slug) ||
          (input.linkTarget && a.slug === input.linkTarget) ||
          (a.watermarkedWebpUrl && a.watermarkedWebpUrl === input.url) ||
          (a.primaryImageUrl && a.primaryImageUrl === input.url) ||
          (input.title && a.title.toLowerCase().trim() === input.title.toLowerCase().trim())
      );

      const rawAlt = input.alt?.trim();
      // Alt Text MUST strictly remain completely blank unless manually authored by the user (no filenames, no UUIDs)
      const resolvedAlt = !rawAlt || isRawFilenameOrUuid(rawAlt) ? "" : stripHtmlTags(rawAlt);

      const resolvedTitle = stripHtmlTags(
        input.title && input.title !== "Classical Masterwork Detail" && input.title !== "Exhibition Artwork"
          ? input.title
          : matchingArt?.title || input.title || "Exhibition Artwork"
      );
      const resolvedSchool = stripHtmlTags(input.traditionalSchool || matchingArt?.category?.name || "");
      const resolvedMedium = stripHtmlTags(input.medium || matchingArt?.medium || "");
      const resolvedDimensions = stripHtmlTags(input.dimensions || matchingArt?.dimensions || "");
      const resolvedYear = stripHtmlTags(input.year || (matchingArt?.yearCreated ? String(matchingArt.yearCreated) : ""));
      const resolvedDesc = stripHtmlTags(input.description || matchingArt?.description || "");
      const resolvedLinkType = input.linkType && input.linkType !== "none" ? input.linkType : matchingArt ? "artwork" : "none";
      const resolvedLinkTarget = input.linkTarget || matchingArt?.slug || "";

      const rawCaption = input.caption?.trim() || "";
      const isLegacyCaption =
        rawCaption.includes("Sacred gold relief") ||
        rawCaption.includes("Sacred iconographic") ||
        rawCaption.includes("rendered in authentic 22k gold foil");
      const resolvedCaption = isLegacyCaption ? (resolvedDesc || "") : rawCaption;

      return {
        id: input.id || `mg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        url: input.url,
        title: resolvedTitle,
        caption: resolvedCaption,
        alt: resolvedAlt,
        medium: resolvedMedium,
        dimensions: resolvedDimensions,
        traditionalSchool: resolvedSchool,
        year: resolvedYear,
        description: resolvedDesc,
        artworkId: matchingArt?.id || input.artworkId,
        linkType: resolvedLinkType,
        linkTarget: resolvedLinkTarget,
      };
    },
    [artworksList]
  );

  const handleAddItem = (newUrl = "", newTitle = "", newAlt = "", extra?: Partial<MediaGalleryItem>) => {
    const url = newUrl || "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=1200";
    const enriched = enrichItemWithArtwork({
      url,
      title: newTitle || "Exhibition Artwork",
      alt: isRawFilenameOrUuid(newAlt) ? "" : newAlt,
      ...extra,
    });
    const updated = [...items, enriched].slice(0, 12);
    onChange({
      ...data,
      items: updated,
    });
    setActiveItemIndex(updated.length - 1);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onChange({
      ...data,
      items: updated,
    });
    if (activeItemIndex >= updated.length) {
      setActiveItemIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const copy = [...items];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    onChange({
      ...data,
      items: copy,
    });
    setActiveItemIndex(targetIndex);
  };

  const handleUpdateItem = (index: number, updates: Partial<MediaGalleryItem>) => {
    const copy = [...items];
    copy[index] = { ...copy[index], ...updates };
    onChange({
      ...data,
      items: copy,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    const file = await optimizeImageForWebpUpload(rawFile);
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    body.append("mediaType", "general");
    body.append("isArtwork", "false");

    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body,
      });
      if (res.ok) {
        const json = await res.json();
        const uploadedUrl = json.publicUrl || json.watermarkedUrl || json.primaryImageUrl;
        if (uploadedUrl) {
          handleAddItem(uploadedUrl);
          toast.success("Image uploaded to gallery!");
        } else {
          toast.error("Upload succeeded but URL was missing.");
        }
      } else {
        toast.error("Upload failed.");
      }
    } catch {
      toast.error("Network error during image upload.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const activeItem = items[activeItemIndex];

  return (
    <div className="space-y-6">
      {/* 1. Gallery Presentation Mode Switcher */}
      <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
        <Label className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Gallery Presentation Engine
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => handleModeChange("carousel")}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              displayMode === "carousel"
                ? "border-amber-600 dark:border-amber-400 bg-amber-500/10 text-amber-950 dark:text-amber-200 shadow-xs ring-1 ring-amber-500/40"
                : "border-border bg-card/60 hover:bg-card text-foreground"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-semibold text-xs">Carousel</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Auto-playing slide reel with pause-on-hover & chevrons.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("scroll")}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              displayMode === "scroll"
                ? "border-amber-600 dark:border-amber-400 bg-amber-500/10 text-amber-950 dark:text-amber-200 shadow-xs ring-1 ring-amber-500/40"
                : "border-border bg-card/60 hover:bg-card text-foreground"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-semibold text-xs">Snap Scroll</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Swipeable horizontal snap-point reel for series.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("collage")}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              displayMode === "collage"
                ? "border-amber-600 dark:border-amber-400 bg-amber-500/10 text-amber-950 dark:text-amber-200 shadow-xs ring-1 ring-amber-500/40"
                : "border-border bg-card/60 hover:bg-card text-foreground"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Square className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-semibold text-xs">Curated Bento</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Asymmetric fine-art masonry masonry collage.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("ken-burns")}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              displayMode === "ken-burns"
                ? "border-amber-600 dark:border-amber-400 bg-amber-500/10 text-amber-950 dark:text-amber-200 shadow-xs ring-1 ring-amber-500/40"
                : "border-border bg-card/60 hover:bg-card text-foreground"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Film className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-semibold text-xs">Ken Burns</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Cinematic slow drift with ethereal gold particles.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("soft-crossfade")}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              displayMode === "soft-crossfade"
                ? "border-amber-600 dark:border-amber-400 bg-amber-500/10 text-amber-950 dark:text-amber-200 shadow-xs ring-1 ring-amber-500/40"
                : "border-border bg-card/60 hover:bg-card text-foreground"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-semibold text-xs">Soft Crossfade</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              1.2s fine-art dissolve with gentle zoom &amp; placard.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("filmstrip")}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              displayMode === "filmstrip"
                ? "border-amber-600 dark:border-amber-400 bg-amber-500/10 text-amber-950 dark:text-amber-200 shadow-xs ring-1 ring-amber-500/40"
                : "border-border bg-card/60 hover:bg-card text-foreground"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-semibold text-xs">Filmstrip Reel</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Continuous panoramic filmstrip with vintage mounts.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("exhibition-wall")}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
              displayMode === "exhibition-wall"
                ? "border-amber-600 dark:border-amber-400 bg-amber-500/10 text-amber-950 dark:text-amber-200 shadow-xs ring-1 ring-amber-500/40"
                : "border-border bg-card/60 hover:bg-card text-foreground"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Landmark className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-semibold text-xs">Exhibition Wall</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              London School salon wall with 3D camera directed tour.
            </p>
          </button>
        </div>
      </div>

      {/* 2. Exhibition Salon Wall Architecture Studio */}
      {displayMode === "exhibition-wall" && (
        <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/5 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Landmark className="w-3.5 h-3.5 text-amber-600" /> Exhibition Salon Wall Architecture Studio
            </Label>
            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-800 dark:text-amber-300">
              3D WebGL Multi-Artwork Salon
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Cultural Environment Preset */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Cultural Environment</Label>
              <Select value={environmentId} onValueChange={(val) => handleEnvironmentChange(val)}>
                <SelectTrigger className="h-8 text-xs bg-card">
                  <SelectValue placeholder="Select Environment" />
                </SelectTrigger>
                <SelectContent>
                  {WALL_ENVIRONMENTS.slice(0, 7).map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Authentic lighting, moulding &amp; floor.
              </p>
            </div>

            {/* Camera Walkthrough Style */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Camera Directed Flow</Label>
              <Select
                value={cameraTourStyle}
                onValueChange={(val: "overview" | "drone" | "walkthrough" | "inspection") =>
                  handleCameraTourStyleChange(val)
                }
              >
                <SelectTrigger className="h-8 text-xs bg-card">
                  <SelectValue placeholder="Select Camera Tour" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drone">Smooth Drone Pan &amp; Zoom</SelectItem>
                  <SelectItem value="walkthrough">Curatorial Eye-Level Visitor</SelectItem>
                  <SelectItem value="inspection">Archival Macro (22k Gold Relief)</SelectItem>
                  <SelectItem value="overview">Salon Wall Wide Overview</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Cinematic perspective interpolation.
              </p>
            </div>

              {/* Camera Transition Style */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Camera Transition Style</Label>
                <Select
                  value={cameraTransitionStyle}
                  onValueChange={(val: "pan-zoom" | "dolly" | "crossfade" | "cinematic-arc") =>
                    handleCameraTransitionStyleChange(val)
                  }
                >
                  <SelectTrigger className="h-8 text-xs bg-card">
                    <SelectValue placeholder="Select Transition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cinematic-arc">Cinematic Arc (Hollywood Crane &amp; Pullback)</SelectItem>
                    <SelectItem value="pan-zoom">Cinematic Pan &amp; Gentle Zoom</SelectItem>
                    <SelectItem value="dolly">Smooth Dolly Track</SelectItem>
                    <SelectItem value="crossfade">Soft Crossfade / Dissolve</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Parabolic arc &amp; damped glide physics.
                </p>
              </div>

              {/* Default Max Artworks Per Wall (Upfront) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">Default Artworks Per Wall</Label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={maxArtworksPerWall <= 1}
                      onClick={() => handleMaxArtworksPerWallChange(Math.max(1, maxArtworksPerWall - 1))}
                      className="h-5 w-5 p-0 text-xs cursor-pointer"
                      title="Decrease artworks per wall"
                    >
                      -
                    </Button>
                    <span className="text-primary font-mono text-xs font-bold w-4 text-center">{maxArtworksPerWall}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={maxArtworksPerWall >= 8}
                      onClick={() => handleMaxArtworksPerWallChange(Math.min(8, maxArtworksPerWall + 1))}
                      className="h-5 w-5 p-0 text-xs cursor-pointer"
                      title="Increase artworks per wall"
                    >
                      +
                    </Button>
                  </div>
                </div>
                <Slider
                  min={1}
                  max={8}
                  step={1}
                  value={[maxArtworksPerWall]}
                  onValueChange={([val]) => handleMaxArtworksPerWallChange(val)}
                  className="py-1 cursor-pointer pointer-events-auto"
                />
                <span className="text-[10px] text-muted-foreground">Partitions corridor (1 to 8 pieces)</span>
              </div>
            </div>

          {/* Wall Background & Custom Atmosphere Studio */}
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-card/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-600" /> Wall Background &amp; Custom Backdrop
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Upload custom architectural backdrops for the exhibition walls or select from Media Vault.
                </p>
              </div>
              {numWalls > 1 && (
                <div className="flex items-center gap-1.5 shrink-0 bg-muted/60 p-1 rounded-lg border border-border">
                  <Button
                    type="button"
                    variant={wallBackgroundMode === "uniform" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleWallBackgroundModeChange("uniform")}
                    className="h-6 px-2 text-[10px] font-medium"
                  >
                    Uniform (All Walls)
                  </Button>
                  <Button
                    type="button"
                    variant={wallBackgroundMode === "per-wall" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleWallBackgroundModeChange("per-wall")}
                    className="h-6 px-2 text-[10px] font-medium"
                  >
                    Per-Wall ({numWalls} Walls)
                  </Button>
                </div>
              )}
            </div>

            {/* UNIFORM WALL BACKGROUND */}
            {(wallBackgroundMode === "uniform" || numWalls <= 1) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Upload custom wall background image or paste URL..."
                    value={customWallUrl}
                    onChange={(e) => handleCustomWallUrlChange(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                  <input
                    ref={wallFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadFile(f, "customWall");
                      if (wallFileInputRef.current) wallFileInputRef.current.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    disabled={uploading}
                    onClick={() => wallFileInputRef.current?.click()}
                    className="h-8 text-xs shrink-0 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <UploadCloud className="w-3.5 h-3.5 mr-1" /> Upload Image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMediaDialogMode("customWall");
                      setIsMediaDialogOpen(true);
                    }}
                    className="h-8 text-xs shrink-0 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 mr-1" /> Media Vault
                  </Button>
                  {customWallUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCustomWallUrlChange("")}
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                      title="Clear custom background"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                {customWallUrl && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <img
                      src={customWallUrl}
                      alt="Wall Background Preview"
                      className="w-14 h-9 object-cover rounded border border-amber-500/40 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        Active Custom Wall Background (Applied to all walls)
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground truncate">{customWallUrl}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PER-WALL BACKGROUND TABS */}
            {wallBackgroundMode === "per-wall" && numWalls > 1 && (
              <div className="space-y-3">
                {/* Wall Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {Array.from({ length: numWalls }, (_, w) => {
                    const wallBg = wallCustomBackgrounds[w] || "";
                    const isSelected = selectedWallTab === w;
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setSelectedWallTab(w)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-serif transition-all cursor-pointer border shrink-0",
                          isSelected
                            ? "bg-amber-500/20 border-amber-500 text-amber-950 dark:text-amber-200 font-bold shadow-xs ring-1 ring-amber-500/30"
                            : "bg-card hover:bg-muted text-muted-foreground border-border font-medium"
                        )}
                      >
                        {wallBg ? (
                          <img
                            src={wallBg}
                            alt={`Wall ${w + 1}`}
                            className="w-4 h-4 rounded-full object-cover border border-amber-500/60"
                          />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-stone-400" />
                        )}
                        Wall {w + 1}
                        {wallBg && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-amber-500/40 text-amber-700 dark:text-amber-300">
                            Custom
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Wall Configuration Card */}
                {(() => {
                  const currentWallBg = wallCustomBackgrounds[selectedWallTab] || "";
                  return (
                    <div className="p-3 rounded-lg border border-border/80 bg-background/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-foreground">
                          Wall #{selectedWallTab + 1} Custom Background
                        </Label>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Corridor Bay {selectedWallTab + 1} of {numWalls}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          placeholder={`Custom background URL for Wall #${selectedWallTab + 1}...`}
                          value={currentWallBg}
                          onChange={(e) => handlePerWallUrlChange(selectedWallTab, e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                        <input
                          ref={perWallFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadFile(f, "perWall", selectedWallTab);
                            if (perWallFileInputRef.current) perWallFileInputRef.current.value = "";
                          }}
                        />
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          disabled={uploading}
                          onClick={() => perWallFileInputRef.current?.click()}
                          className="h-8 text-xs shrink-0 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          <UploadCloud className="w-3.5 h-3.5 mr-1" /> Upload Image
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMediaDialogWallIndex(selectedWallTab);
                            setMediaDialogMode("perWall");
                            setIsMediaDialogOpen(true);
                          }}
                          className="h-8 text-xs shrink-0 cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5 mr-1" /> Media Vault
                        </Button>
                        {currentWallBg && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePerWallUrlChange(selectedWallTab, "")}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                            title="Clear background for this wall"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>

                      {currentWallBg && (
                        <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={currentWallBg}
                              alt={`Wall ${selectedWallTab + 1} Preview`}
                              className="w-12 h-8 object-cover rounded border border-amber-500/40 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold text-foreground truncate">
                                Custom Backdrop for Wall #{selectedWallTab + 1}
                              </p>
                              <p className="text-[10px] font-mono text-muted-foreground truncate">{currentWallBg}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyWallToAll(selectedWallTab)}
                            className="h-7 text-[11px] shrink-0 border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20"
                          >
                            Apply to All Walls
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* -------------------------------------------------------------
           * 2B. INTERACTIVE EXHIBITION WALL CURATION & LAYOUT STUDIO
           * ----------------------------------------------------------- */}
          <div className="p-4 rounded-xl border border-amber-500/40 bg-card/80 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/80">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-600" />
                  Wall Curation &amp; Layout Studio (Wall #{selectedWallTab + 1} of {numWalls})
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Pick artworks, select multi-artwork layouts, and adjust framing offsets for this wall.
                </p>
              </div>

              {/* Wall Selector Tabs + Add/Delete Wall Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
                  {effectiveWallConfigs.map((w, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedWallTab(idx)}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer",
                        selectedWallTab === idx
                          ? "bg-amber-600 text-white shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      Wall {idx + 1}
                      <span className="ml-1 text-[10px] opacity-80">({w.artworkIds?.length || 0})</span>
                    </button>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddWall}
                  className="h-7 text-xs px-2 cursor-pointer border-amber-500/40 text-amber-900 dark:text-amber-200"
                  title="Add another Exhibition Wall"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Wall
                </Button>

                {effectiveWallConfigs.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWall(selectedWallTab)}
                    className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10 cursor-pointer"
                    title="Delete this Wall"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                  </Button>
                )}
              </div>
            </div>

            {/* Selected Wall Scope */}
            {(() => {
              const currentWallConfig = effectiveWallConfigs[selectedWallTab] || effectiveWallConfigs[0];
              const wallArtworkIds = currentWallConfig?.artworkIds || [];
              const wallArtworks = wallArtworkIds
                .map((id) => items.find((it) => it.id === id || it.artworkId === id))
                .filter(Boolean) as MediaGalleryItem[];

              const count = wallArtworks.length;
              const currentLayout = currentWallConfig?.layoutType || "auto-balanced";
              const currentSpacing = currentWallConfig?.spacingMultiplier ?? 1.0;
              const currentOffX = currentWallConfig?.offsetX ?? 0;
              const currentOffY = currentWallConfig?.offsetY ?? 0;
              const availablePresets = getLayoutPresetsForCount(count);
              const currentWallBg = currentWallConfig?.customBackgroundUrl || (wallBackgroundMode === "uniform" ? customWallUrl : (wallCustomBackgrounds[selectedWallTab] || ""));

              // Calculate 2D schematic positions
              const schematicPositions = getSchematicArtworkPositions(
                count,
                currentLayout,
                currentSpacing,
                currentOffX,
                currentOffY
              );

              return (
                <div className="space-y-4">
                  {/* 1. Interactive 2D Wall Schematic Preview Box */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                        <Eye className="w-3 h-3 text-amber-600" />
                        Interactive 2D Wall Schematic
                      </Label>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {count} Artwork{count === 1 ? "" : "s"} &bull; Layout: {currentLayout} &bull; Offset: ({currentOffX > 0 ? "+" : ""}{currentOffX.toFixed(1)}m, {currentOffY > 0 ? "+" : ""}{currentOffY.toFixed(2)}m)
                      </span>
                    </div>

                    <div
                      className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-amber-500/30 shadow-inner bg-stone-900 flex items-center justify-center select-none"
                      style={{
                        backgroundImage: currentWallBg ? `url("${currentWallBg}")` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {/* Subtle darkening scrim if no custom image */}
                      {!currentWallBg && (
                        <div className="absolute inset-0 bg-gradient-to-b from-stone-800 to-stone-950" />
                      )}

                      {/* Floor line & Eye-level guideline */}
                      <div className="absolute bottom-4 inset-x-0 h-0.5 bg-amber-500/20" />
                      <div className="absolute top-1/2 inset-x-0 h-px border-b border-dashed border-white/15" />
                      <div className="absolute left-1/2 inset-y-0 w-px border-r border-dashed border-white/15" />

                      {/* Eye-level badge */}
                      <div className="absolute left-2 top-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-amber-300 border border-amber-500/30">
                        Wall #{selectedWallTab + 1} Centerline 1.55m
                      </div>

                      {count === 0 ? (
                        <div className="text-center p-4 bg-stone-950/70 backdrop-blur-md rounded-lg border border-amber-500/20 max-w-xs z-10">
                          <ImageIcon className="w-6 h-6 text-amber-400/60 mx-auto mb-1" />
                          <p className="text-xs font-semibold text-foreground">No Artworks On This Wall</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Click &quot;+ Add Artwork to Wall&quot; below to assign artworks to this wall corridor.
                          </p>
                        </div>
                      ) : (
                        schematicPositions.map((pos, idx) => {
                          const art = wallArtworks[idx];
                          return (
                            <div
                              key={art?.id || idx}
                              className="absolute transition-all duration-300 ease-out group/slot hover:scale-105 z-10"
                              style={{
                                left: `${pos.leftPct}%`,
                                bottom: `${pos.bottomPct}%`,
                                transform: "translate(-50%, 50%)",
                              }}
                            >
                              <div className="relative w-14 h-16 sm:w-16 sm:h-20 rounded bg-stone-950 border-2 border-amber-500/80 shadow-lg overflow-hidden flex flex-col justify-between">
                                {art?.url ? (
                                  <img
                                    src={art.url}
                                    alt={art.title || `Artwork ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-stone-800 text-[10px] text-stone-400">
                                    Slot {idx + 1}
                                  </div>
                                )}
                                <div className="absolute top-1 left-1 bg-black/80 px-1 py-0.2 rounded text-[8px] font-mono text-amber-300 font-bold border border-amber-500/40">
                                  #{idx + 1}
                                </div>
                                <div className="absolute inset-x-0 bottom-0 bg-stone-950/90 py-0.5 px-1 text-[8px] text-white truncate text-center">
                                  {art?.title || `Piece ${idx + 1}`}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* 1.5 Wall Frame Style Selector */}
                  <div className="space-y-1.5 p-3 rounded-lg border border-border/80 bg-background/50">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                        <Frame className="w-3.5 h-3.5 text-amber-600" />
                        Wall Frame Style (Applies to all artworks on this wall)
                      </Label>
                      <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-300">
                        {currentWallConfig?.frameStyle || "curated-mix"}
                      </Badge>
                    </div>
                    <Select
                      value={currentWallConfig?.frameStyle || "curated-mix"}
                      onValueChange={(val: WallFrameStyle) =>
                        handleUpdateWallConfig(selectedWallTab, { frameStyle: val })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-card">
                        <SelectValue placeholder="Select Frame Style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="curated-mix">Curated Mix (Original Dynamic Styling)</SelectItem>
                        <SelectItem value="gold-gilt">Museum 24k Gold Leaf (Gilded Wood Fillet)</SelectItem>
                        <SelectItem value="teak-wood">Burmese Teak Wood (Hand-Carved Heritage)</SelectItem>
                        <SelectItem value="gallery-black">Contemporary Gallery Black (Minimalist Shadowbox)</SelectItem>
                        <SelectItem value="museum-glass">Museum Glass &amp; Acrylic Float (Specular Glaze)</SelectItem>
                        <SelectItem value="rosewood">Antique Rosewood (Deep Burgundy Classical)</SelectItem>
                        <SelectItem value="light-oak">Scandinavian Light Oak (Modern Warm Matte)</SelectItem>
                        <SelectItem value="white-float">Minimalist White Float (Clean Architectural)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">
                      Guarantees unified curatorial framing material, bevel, and specular glass across all works on Wall #{selectedWallTab + 1}.
                    </p>
                  </div>

                  {/* 2. Layout Presets Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Columns className="w-3.5 h-3.5 text-amber-600" />
                        Wall Layout Preset ({availablePresets.length} Options for {count} Artworks)
                      </Label>
                      <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-300">
                        {currentLayout}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {availablePresets.map((preset) => {
                        const isSelected = currentLayout === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleUpdateWallConfig(selectedWallTab, { layoutType: preset.id })}
                            className={cn(
                              "p-2.5 rounded-lg border text-left transition-all cursor-pointer relative",
                              isSelected
                                ? "bg-amber-500/20 border-amber-500 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/50 shadow-sm font-semibold"
                                : "bg-card hover:bg-muted text-muted-foreground border-border hover:border-amber-500/30"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-foreground flex items-center gap-1">
                                {isSelected && <Check className="w-3 h-3 text-amber-600 shrink-0" />}
                                {preset.label}
                              </span>
                              <Badge variant={isSelected ? "default" : "secondary"} className="text-[9px] px-1 py-0">
                                {preset.badge}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-tight">
                              {preset.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Positioning & Alignment Controls (Horizontal Shift, Vertical Elevation, Spacing Multiplier, Vertical Clearance) */}
                  <div className="p-3 rounded-lg border border-border/80 bg-background/50 space-y-3">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                      <Sliders className="w-3.5 h-3.5 text-amber-600" />
                      Wall Alignment &amp; Fine Positioning Offsets
                    </Label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Horizontal Shift */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <MoveHorizontal className="w-3 h-3 text-muted-foreground" />
                            Horizontal Shift (X)
                          </Label>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateWallConfig(selectedWallTab, { offsetX: Math.max(-2.5, Number((currentOffX - 0.1).toFixed(2))) })}
                              className="h-5 w-5 p-0 text-xs cursor-pointer"
                              title="Shift Left"
                            >
                              -
                            </Button>
                            <span className="text-xs font-mono text-primary font-bold min-w-10 text-center">
                              {currentOffX > 0 ? "+" : ""}{currentOffX.toFixed(1)}m
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateWallConfig(selectedWallTab, { offsetX: Math.min(2.5, Number((currentOffX + 0.1).toFixed(2))) })}
                              className="h-5 w-5 p-0 text-xs cursor-pointer"
                              title="Shift Right"
                            >
                              +
                            </Button>
                            {currentOffX !== 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateWallConfig(selectedWallTab, { offsetX: 0 })}
                                className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground cursor-pointer ml-0.5"
                                title="Reset to Center"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <Slider
                          min={-2.5}
                          max={2.5}
                          step={0.1}
                          value={[currentOffX]}
                          onValueChange={([val]) => handleUpdateWallConfig(selectedWallTab, { offsetX: val })}
                          className="py-1 cursor-pointer pointer-events-auto"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                          <span>-2.5m (Left)</span>
                          <span>0.0m</span>
                          <span>+2.5m (Right)</span>
                        </div>
                      </div>

                      {/* Vertical Elevation */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <MoveVertical className="w-3 h-3 text-muted-foreground" />
                            Vertical Elevation (Y)
                          </Label>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateWallConfig(selectedWallTab, { offsetY: Math.max(-1.0, Number((currentOffY - 0.05).toFixed(2))) })}
                              className="h-5 w-5 p-0 text-xs cursor-pointer"
                              title="Lower Artworks"
                            >
                              -
                            </Button>
                            <span className="text-xs font-mono text-primary font-bold min-w-10 text-center">
                              {currentOffY > 0 ? "+" : ""}{currentOffY.toFixed(2)}m
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateWallConfig(selectedWallTab, { offsetY: Math.min(1.0, Number((currentOffY + 0.05).toFixed(2))) })}
                              className="h-5 w-5 p-0 text-xs cursor-pointer"
                              title="Raise Artworks"
                            >
                              +
                            </Button>
                            {currentOffY !== 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateWallConfig(selectedWallTab, { offsetY: 0 })}
                                className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground cursor-pointer ml-0.5"
                                title="Reset to 1.55m Centerline"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <Slider
                          min={-1.0}
                          max={1.0}
                          step={0.05}
                          value={[currentOffY]}
                          onValueChange={([val]) => handleUpdateWallConfig(selectedWallTab, { offsetY: val })}
                          className="py-1 cursor-pointer pointer-events-auto"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                          <span>-1.0m (Lower)</span>
                          <span>1.55m Eye-Level</span>
                          <span>+1.0m (Higher)</span>
                        </div>
                      </div>

                      {/* Spacing Spread Multiplier */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <Maximize2 className="w-3 h-3 text-muted-foreground" />
                            Horizontal Spacing Spread
                          </Label>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateWallConfig(selectedWallTab, { spacingMultiplier: Math.max(0.6, Number((currentSpacing - 0.05).toFixed(2))) })}
                              className="h-5 w-5 p-0 text-xs cursor-pointer"
                              title="Tighter Spacing"
                            >
                              -
                            </Button>
                            <span className="text-xs font-mono text-primary font-bold min-w-10 text-center">
                              {currentSpacing.toFixed(2)}x
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateWallConfig(selectedWallTab, { spacingMultiplier: Math.min(1.6, Number((currentSpacing + 0.05).toFixed(2))) })}
                              className="h-5 w-5 p-0 text-xs cursor-pointer"
                              title="Wider Spacing"
                            >
                              +
                            </Button>
                            {currentSpacing !== 1.0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateWallConfig(selectedWallTab, { spacingMultiplier: 1.0 })}
                                className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground cursor-pointer ml-0.5"
                                title="Reset to 1.0x"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <Slider
                          min={0.6}
                          max={1.6}
                          step={0.05}
                          value={[currentSpacing]}
                          onValueChange={([val]) => handleUpdateWallConfig(selectedWallTab, { spacingMultiplier: val })}
                          className="py-1 cursor-pointer pointer-events-auto"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                          <span>0.6x (Tight)</span>
                          <span>1.0x Standard</span>
                          <span>1.6x Expansive</span>
                        </div>
                      </div>

                      {/* Vertical Row Clearance Gap (Configurable for Pyramid, Stacked, Multi-row) */}
                      {(() => {
                        const currentVGap = currentWallConfig?.verticalGap ?? 0.48;
                        return (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                <MoveVertical className="w-3 h-3 text-muted-foreground" />
                                Vertical Row Gap
                              </Label>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateWallConfig(selectedWallTab, { verticalGap: Math.max(0.2, Number((currentVGap - 0.04).toFixed(2))) })}
                                  className="h-5 w-5 p-0 text-xs cursor-pointer"
                                  title="Reduce Row Clearance"
                                >
                                  -
                                </Button>
                                <span className="text-xs font-mono text-primary font-bold min-w-10 text-center">
                                  {currentVGap.toFixed(2)}m
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateWallConfig(selectedWallTab, { verticalGap: Math.min(0.9, Number((currentVGap + 0.04).toFixed(2))) })}
                                  className="h-5 w-5 p-0 text-xs cursor-pointer"
                                  title="Increase Row Clearance"
                                >
                                  +
                                </Button>
                                {currentVGap !== 0.48 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUpdateWallConfig(selectedWallTab, { verticalGap: 0.48 })}
                                    className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground cursor-pointer ml-0.5"
                                    title="Reset to 0.48m Default"
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <Slider
                              min={0.2}
                              max={0.9}
                              step={0.02}
                              value={[currentVGap]}
                              onValueChange={([val]) => handleUpdateWallConfig(selectedWallTab, { verticalGap: val })}
                              className="py-1 cursor-pointer pointer-events-auto"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                              <span>0.20m (Close)</span>
                              <span>0.48m (Standard)</span>
                              <span>0.90m (Airy)</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 4. Curated Artwork Slots on Wall */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                        Curated Artwork Slots ({count} Pieces on Wall #{selectedWallTab + 1})
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleOpenCatalogSearch}
                          className="h-7 text-xs px-2 cursor-pointer border-amber-500/40 text-amber-900 dark:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20"
                        >
                          <Search className="w-3.5 h-3.5 mr-1" />
                          <span>Search Artwork Catalog</span>
                        </Button>
                        {items.length > count && (
                          <Select
                            value=""
                            onValueChange={(val) => {
                              if (val) handleAddArtworkToWall(selectedWallTab, val);
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs w-40 bg-card border-amber-500/40 text-amber-900 dark:text-amber-200">
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              <span>Add From Gallery</span>
                            </SelectTrigger>
                            <SelectContent>
                              {items
                                .filter((it) => !wallArtworkIds.includes(it.id || it.artworkId || ""))
                                .map((it, idx) => (
                                  <SelectItem key={it.id || idx} value={it.id || it.artworkId || `art-${idx}`}>
                                    {it.title || `Gallery Item ${idx + 1}`}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {wallArtworks.map((art, slotIdx) => (
                        <div
                          key={art.id || slotIdx}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/70 bg-card/60 hover:bg-card transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-amber-500/40">
                              {slotIdx + 1}
                            </span>
                            {art.url && (
                              <img
                                src={art.url}
                                alt={art.title || `Artwork ${slotIdx + 1}`}
                                className="w-9 h-9 object-cover rounded border border-border shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">
                                {art.title || `Curated Artwork ${slotIdx + 1}`}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {art.medium || "Archival Medium"} &bull; {art.dimensions || "Dimensions"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Reorder buttons */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={slotIdx === 0}
                              onClick={() => handleReorderWallArtwork(selectedWallTab, slotIdx, "prev")}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
                              title="Move Previous Slot"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={slotIdx === wallArtworks.length - 1}
                              onClick={() => handleReorderWallArtwork(selectedWallTab, slotIdx, "next")}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
                              title="Move Next Slot"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>

                            {/* Swap selector */}
                            <Select
                              value={art.id || art.artworkId || ""}
                              onValueChange={(newId) => handleSwapWallArtwork(selectedWallTab, slotIdx, newId)}
                            >
                              <SelectTrigger className="h-6 text-[10px] w-28 bg-background">
                                <SelectValue placeholder="Swap..." />
                              </SelectTrigger>
                              <SelectContent>
                                {items.map((it, itIdx) => (
                                  <SelectItem key={it.id || itIdx} value={it.id || it.artworkId || `art-${itIdx}`}>
                                    {it.title || `Item ${itIdx + 1}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Remove from Wall */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveArtworkFromWall(selectedWallTab, slotIdx)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                              title="Remove Artwork from this Wall"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Autoplay Tour, Dwell Speeds, and Bottom Card Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-500/20">
            <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-1.5">
              <div>
                <Label className="text-xs font-semibold text-foreground">Autoplay Tour</Label>
                <p className="text-[10px] text-muted-foreground">
                  Cycles camera between walls and pieces.
                </p>
              </div>
              <Switch
                checked={autoplayTour}
                onCheckedChange={(checked) => handleAutoplayTourChange(checked)}
                className="cursor-pointer pointer-events-auto"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Overview Wall Dwell</span>
                <span className="text-primary font-mono text-xs">{overviewDwellSeconds}s</span>
              </Label>
              <Slider
                min={2}
                max={15}
                step={1}
                value={[overviewDwellSeconds]}
                onValueChange={([val]) => handleOverviewDwellSecondsChange(val)}
                className="py-1 cursor-pointer pointer-events-auto"
              />
              <span className="text-[10px] text-muted-foreground">Panoramic wall hold (2s - 15s)</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Artwork Focus Dwell</span>
                <span className="text-primary font-mono text-xs">{autoplayTimer}s</span>
              </Label>
              <Slider
                min={2}
                max={15}
                step={1}
                value={[autoplayTimer]}
                onValueChange={([val]) => handleTimerChange(val)}
                className="py-1 cursor-pointer pointer-events-auto"
              />
              <span className="text-[10px] text-muted-foreground">Focus dwell (2s - 15s)</span>
            </div>
          </div>

          {/* Toggle: Show Metadata Card Below Wall */}
          <div className="pt-2 flex items-center justify-between border-t border-amber-500/20">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold text-foreground">Display Metadata Card Below Wall</Label>
              <p className="text-[10px] text-muted-foreground">
                Renders curatorial title, medium, dimensions, and catalog link below the 3D gallery wall canvas.
              </p>
            </div>
            <Switch
              checked={showMetadataCardBelowWall}
              onCheckedChange={(checked) => handleShowMetadataCardBelowWallChange(checked)}
              className="cursor-pointer pointer-events-auto"
            />
          </div>
        </div>
      )}

      {/* 2B. Filmstrip Reel Styling Controls */}
      {displayMode === "filmstrip" && (
        <div className="p-4 rounded-xl border border-border/80 bg-card/50 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Film className="w-3.5 h-3.5 text-primary" /> Filmstrip Reel Styling
            </Label>
            <Badge variant="outline" className="text-[10px]">
              Full-Bleed Visual Frame
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold text-foreground">Show Top Frame Header Strip</Label>
              <p className="text-[10px] text-muted-foreground">
                When disabled (default), artwork expands to the top border with zero black masking bands.
              </p>
            </div>
            <Switch
              checked={showFrameHeader}
              onCheckedChange={(checked) => onChange({ ...data, showFrameHeader: checked })}
              className="cursor-pointer pointer-events-auto"
            />
          </div>

          {showFrameHeader && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Header Strip Background</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={frameHeaderBg || "#0F0E0D"}
                    onChange={(e) => onChange({ ...data, frameHeaderBg: e.target.value })}
                    className="w-7 h-7 rounded border border-border cursor-pointer p-0.5 bg-card shrink-0"
                  />
                  <Input
                    type="text"
                    value={frameHeaderBg}
                    onChange={(e) => onChange({ ...data, frameHeaderBg: e.target.value })}
                    placeholder="#0F0E0D"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Header Text Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={frameHeaderTextColor || "#F5EBE1"}
                    onChange={(e) => onChange({ ...data, frameHeaderTextColor: e.target.value })}
                    className="w-7 h-7 rounded border border-border cursor-pointer p-0.5 bg-card shrink-0"
                  />
                  <Input
                    type="text"
                    value={frameHeaderTextColor}
                    onChange={(e) => onChange({ ...data, frameHeaderTextColor: e.target.value })}
                    placeholder="#F5EBE1"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2C. Dedicated Canvas & Frame Styling Panel */}
      <div className="p-4 rounded-xl border border-border/80 bg-card/50 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
            <Palette className="w-3.5 h-3.5 text-primary" /> Canvas &amp; Frame Styling
          </Label>
          <Badge variant="outline" className="text-[10px]">
            Unobstructed Art Focus
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Background Color Picker & Swatches */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Canvas Background</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={canvasBgColor && canvasBgColor !== "transparent" ? canvasBgColor : "#0B0F17"}
                onChange={(e) => handleCanvasBgColorChange(e.target.value)}
                className="w-7 h-7 rounded border border-border cursor-pointer p-0.5 bg-card shrink-0"
              />
              <Input
                type="text"
                placeholder="#0B0F17 or transparent"
                value={canvasBgColor}
                onChange={(e) => handleCanvasBgColorChange(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
            {/* Cultural Swatches */}
            <div className="flex items-center gap-1.5 pt-1">
              {[
                { name: "Obsidian", color: "#0B0F17" },
                { name: "Teak", color: "#1C130D" },
                { name: "Parchment", color: "#FAF7F2" },
                { name: "Ivory", color: "#FFFFF8" },
                { name: "Clear", color: "transparent" },
              ].map((swatch) => (
                <button
                  key={swatch.name}
                  type="button"
                  onClick={() => handleCanvasBgColorChange(swatch.color)}
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono border border-border bg-muted/60 hover:bg-muted text-foreground cursor-pointer"
                  title={swatch.name}
                >
                  {swatch.name}
                </button>
              ))}
            </div>
          </div>

          {/* Border Fillet Color */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Border Fillet Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={borderFilletColor || "#D4AF37"}
                onChange={(e) => handleBorderFilletColorChange(e.target.value)}
                className="w-7 h-7 rounded border border-border cursor-pointer p-0.5 bg-card shrink-0"
              />
              <Input
                type="text"
                placeholder="#D4AF37"
                value={borderFilletColor}
                onChange={(e) => handleBorderFilletColorChange(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* Border Width */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Border Width</Label>
            <Select
              value={String(borderWidth)}
              onValueChange={(val) => handleBorderWidthChange(Number(val))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Border Width" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0px (No Fillet)</SelectItem>
                <SelectItem value="1">1px (Hairline Gold)</SelectItem>
                <SelectItem value="2">2px (Traditional Fillet)</SelectItem>
                <SelectItem value="4">4px (Ornate Beading)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Frame Padding / Matting */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Frame Padding / Matting</Label>
            <Select
              value={String(framePadding)}
              onValueChange={(val) => handleFramePaddingChange(Number(val))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Padding" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Compact (0px)</SelectItem>
                <SelectItem value="16">Standard Matting (16px)</SelectItem>
                <SelectItem value="32">Exhibition Matting (32px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Canvas Background Image */}
        <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <ImageIcon className="w-3.5 h-3.5 text-primary" /> Custom Canvas Background Image
              </Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Renders a custom photographic, texture, or architectural backdrop behind all gallery slides/cards.
              </p>
            </div>
            {canvasBgImageUrl && (
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary font-semibold">
                Active Backdrop
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="https://... or /media/... for gallery backdrop"
              value={canvasBgImageUrl}
              onChange={(e) => handleCanvasBgImageUrlChange(e.target.value)}
              className="h-8 text-xs font-mono"
            />
            <input
              ref={canvasBgFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUploadFile(f, "canvasBg");
                if (canvasBgFileInputRef.current) canvasBgFileInputRef.current.value = "";
              }}
            />
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={uploading}
              onClick={() => canvasBgFileInputRef.current?.click()}
              className="h-8 text-xs shrink-0 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1" /> Upload Image
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setMediaDialogMode("canvasBg");
                setIsMediaDialogOpen(true);
              }}
              className="h-8 text-xs shrink-0 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 mr-1" /> Media Vault
            </Button>
            {canvasBgImageUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleCanvasBgImageUrlChange("")}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                title="Clear canvas background image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {canvasBgImageUrl && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Background Scaling Mode</Label>
                <Select
                  value={canvasBgMode}
                  onValueChange={(val: "cover" | "contain" | "tile" | "blur") => handleCanvasBgModeChange(val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-card">
                    <SelectValue placeholder="Scaling Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover (Fill &amp; Center)</SelectItem>
                    <SelectItem value="contain">Contain (Fit Aspect)</SelectItem>
                    <SelectItem value="tile">Pattern Tile (Repeat)</SelectItem>
                    <SelectItem value="blur">Ambient Frosted Blur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border">
                <img
                  src={canvasBgImageUrl}
                  alt="Canvas Background Preview"
                  className="w-12 h-9 object-cover rounded border border-border shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-foreground truncate">Backdrop Preview</p>
                  <p className="text-[9px] font-mono text-muted-foreground truncate">{canvasBgImageUrl}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toggle: Show Title & Caption Ribbon */}
        <div className="pt-2 flex items-center justify-between border-t border-border/50">
          <div className="space-y-0.5">
            <Label className="text-xs font-semibold text-foreground">Show Title &amp; Caption Ribbon</Label>
            <p className="text-[10px] text-muted-foreground">
              Renders an unobtrusive caption outside the image frame (Default: False for clean visual focus).
            </p>
          </div>
          <Switch
            checked={showCaptionRibbon}
            onCheckedChange={(checked) => handleShowCaptionRibbonChange(checked)}
            className="cursor-pointer pointer-events-auto"
          />
        </div>
      </div>

      {/* 2C. Legacy Mode Settings (Timer, Aspect Ratio, Frame) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-border/70 bg-card/40">
        {(displayMode === "carousel" || displayMode === "ken-burns" || displayMode === "soft-crossfade") && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Autoplay Duration</span>
              <span className="text-primary font-mono text-xs">{autoplayTimer}s</span>
            </Label>
            <Slider
              min={2}
              max={10}
              step={1}
              value={[autoplayTimer]}
              onValueChange={([val]) => handleTimerChange(val)}
              className="py-1 cursor-pointer pointer-events-auto"
            />
            <span className="text-[10px] text-muted-foreground">Slides advance automatically (2s - 10s)</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Aspect Ratio</Label>
          <Select value={aspectRatio} onValueChange={(val: "landscape" | "portrait" | "square" | "natural") => handleAspectChange(val)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select Ratio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="landscape">Landscape (16:10)</SelectItem>
              <SelectItem value="portrait">Portrait (3:4)</SelectItem>
              <SelectItem value="square">Square (1:1)</SelectItem>
              <SelectItem value="natural">Fixed Height (420px)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Frame & Border Style</Label>
          <Select value={frameStyle} onValueChange={(val: "heritage" | "minimal" | "floating" | "none") => handleFrameChange(val)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select Frame" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="heritage">Heritage 22k Gold Glow</SelectItem>
              <SelectItem value="minimal">Minimalist Border</SelectItem>
              <SelectItem value="floating">Floating Deep Shadow</SelectItem>
              <SelectItem value="none">No Border / Flush</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 2B. Placard Contrast & Typography Studio (Ken Burns & Soft Crossfade) */}
      {(displayMode === "ken-burns" || displayMode === "soft-crossfade") && (
        <div className="p-4 rounded-xl border border-amber-600/40 bg-amber-500/5 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Palette className="w-3.5 h-3.5 text-amber-600" /> Placard Contrast &amp; Typography Studio
            </Label>
            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-800 dark:text-amber-300">
              WCAG AAA Contrast
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Placard Theme Preset */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Placard Theme Preset</Label>
              <Select
                value={kenBurnsOverlayTheme}
                onValueChange={(val: "dark-velvet" | "parchment-gold" | "minimal-subtle") =>
                  handleOverlayThemeChange(val)
                }
              >
                <SelectTrigger className="h-8 text-xs bg-card">
                  <SelectValue placeholder="Select Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark-velvet">Dark Velvet (Obsidian &amp; Ivory)</SelectItem>
                  <SelectItem value="parchment-gold">Parchment Gold (Warm Ivory &amp; Deep Slate)</SelectItem>
                  <SelectItem value="minimal-subtle">Minimal Subtle (Translucent Glass)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title Color Override */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Title Color</span>
                <span className="font-mono text-[10px] text-muted-foreground">{overlayTitleColor || "Theme Default"}</span>
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={overlayTitleColor || (kenBurnsOverlayTheme === "parchment-gold" ? "#0F172A" : "#F8FAFC")}
                  onChange={(e) => handleTitleColorChange(e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer p-0.5 bg-card shrink-0"
                />
                <Input
                  type="text"
                  placeholder={kenBurnsOverlayTheme === "parchment-gold" ? "#0F172A" : "#F8FAFC"}
                  value={overlayTitleColor}
                  onChange={(e) => handleTitleColorChange(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* Caption / Text Color Override */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Caption Color</span>
                <span className="font-mono text-[10px] text-muted-foreground">{overlayTextColor || "Theme Default"}</span>
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={overlayTextColor || (kenBurnsOverlayTheme === "parchment-gold" ? "#334155" : "#E2E8F0")}
                  onChange={(e) => handleTextColorChange(e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer p-0.5 bg-card shrink-0"
                />
                <Input
                  type="text"
                  placeholder={kenBurnsOverlayTheme === "parchment-gold" ? "#334155" : "#E2E8F0"}
                  value={overlayTextColor}
                  onChange={(e) => handleTextColorChange(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-muted-foreground">Quick Palette:</span>
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...data,
                  kenBurnsOverlayTheme: "dark-velvet",
                  overlayTitleColor: "#F8FAFC",
                  overlayTextColor: "#E2E8F0",
                });
              }}
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-900 text-stone-100 border border-stone-700 hover:bg-black cursor-pointer"
            >
              🌙 Dark Velvet Standard
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...data,
                  kenBurnsOverlayTheme: "parchment-gold",
                  overlayTitleColor: "#0F172A",
                  overlayTextColor: "#334155",
                });
              }}
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200 cursor-pointer"
            >
              ☀️ Parchment Gold Standard
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...data,
                  kenBurnsOverlayTheme: "minimal-subtle",
                  overlayTitleColor: "#FFFFFF",
                  overlayTextColor: "#CBD5E1",
                });
              }}
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-800 text-stone-200 border border-stone-600 hover:bg-stone-700 cursor-pointer"
            >
              💎 Minimal Subtle
            </button>
          </div>
        </div>
      )}

      {/* 3. Media Items Manager */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <h4 className="font-serif font-bold text-sm text-foreground">
              Gallery Media Items ({items.length})
            </h4>
            {displayMode === "collage" && items.length > 12 && (
              <Badge variant="outline" className="text-[10px] border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                Notice: Bento mode displays up to 12 items
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,.heic,.heics"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setMediaDialogTargetIndex(null);
                setIsMediaDialogOpen(true);
              }}
              className="text-xs h-7 gap-1.5 border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer font-medium"
            >
              <ImagePlus className="w-3.5 h-3.5 text-amber-500" />
              <span>Add Media / Vault</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="text-xs h-7 gap-1 border-primary/50 text-primary hover:bg-primary/10 cursor-pointer"
            >
              <UploadCloud className="w-3 h-3" />
              {uploading ? "Uploading..." : "Upload Local"}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => handleAddItem()}
              className="text-xs h-7 gap-1 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-3 h-3" /> Add Item
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border/80 rounded-xl space-y-2">
            <ImageIcon className="w-7 h-7 text-muted-foreground/60 mx-auto" />
            <p className="text-xs font-semibold text-foreground">No photos added yet</p>
            <p className="text-[11px] text-muted-foreground">Click &quot;Upload Photo&quot; or &quot;Add Item&quot; to begin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left Item Selector List */}
            <div className="md:col-span-4 space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  onClick={() => setActiveItemIndex(idx)}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer text-left ${
                    activeItemIndex === idx
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border/70 bg-card hover:bg-muted/40"
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.title || "thumbnail"}
                    className="w-10 h-10 object-cover rounded shrink-0 border border-border/80"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-foreground">
                      {idx + 1}. {item.title || "Untitled Plate"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {item.linkType && item.linkType !== "none" ? `Linked: ${item.linkType}` : "No link"}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveItem(idx, "up")}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === items.length - 1}
                      onClick={() => handleMoveItem(idx, "down")}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Active Item Detail Editor */}
            {activeItem && (
              <div className="md:col-span-8 p-4 rounded-xl border border-border/80 bg-card space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-xs font-bold text-foreground">
                    Editing Photo #{activeItemIndex + 1}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    ID: {activeItem.id.slice(0, 10)}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      value={activeItem.url}
                      onChange={(e) => handleUpdateItem(activeItemIndex, { url: e.target.value })}
                      placeholder="https://... or /media/public/..."
                      className="h-8 text-xs font-mono flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setMediaDialogTargetIndex(activeItemIndex);
                        setIsMediaDialogOpen(true);
                      }}
                      className="text-xs h-8 px-3 shrink-0 cursor-pointer font-medium"
                    >
                      Browse Vault
                    </Button>
                  </div>
                </div>

                {/* 1-Click Catalog Ingestion Helper */}
                <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Auto-Fill from Catalog &amp; Asset Repository
                    </Label>
                    <Badge variant="outline" className="text-[9px] bg-background/80 border-amber-500/40 text-amber-900 dark:text-amber-300 font-semibold">
                      Instant Ingestion
                    </Badge>
                  </div>
                  <p className="text-[11px] text-amber-950/80 dark:text-amber-200/80 leading-tight">
                    Select a catalog artwork to automatically map title, medium, dimensions, school, year, and destination link:
                  </p>
                  <Select
                    value={activeItem.artworkId || (artworksList.find((a) => a.slug === activeItem.linkTarget)?.id ?? "")}
                    onValueChange={(artId) => {
                      const art = artworksList.find((a) => a.id === artId);
                      if (art) {
                        const materials = stripHtmlTags(art.medium) || "";
                        handleUpdateItem(activeItemIndex, {
                          artworkId: art.id,
                          title: stripHtmlTags(art.title),
                          medium: materials,
                          dimensions: stripHtmlTags(art.dimensions) || "",
                          traditionalSchool: stripHtmlTags(art.category?.name) || "",
                          year: art.yearCreated ? String(art.yearCreated) : "",
                          description: stripHtmlTags(art.description) || "",
                          linkType: "artwork",
                          linkTarget: art.slug,
                          alt: "", // Strictly blank unless manually authored
                          caption: stripHtmlTags(art.description) || "",
                          url: art.watermarkedWebpUrl || art.primaryImageUrl || activeItem.url,
                        });
                        toast.success(`Auto-mapped all curatorial metadata for "${stripHtmlTags(art.title)}"!`);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="-- Select catalog artwork to auto-fill --" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {artworksList.map((art) => (
                        <SelectItem key={art.id} value={art.id}>
                          {art.title} {art.dimensions ? `(${art.dimensions})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">Title / Heading</Label>
                    <Input
                      type="text"
                      value={activeItem.title || ""}
                      onChange={(e) => handleUpdateItem(activeItemIndex, { title: e.target.value })}
                      placeholder="e.g. Oil on Canvas Masterwork"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">Alt Text (Accessibility)</Label>
                    <Input
                      type="text"
                      value={activeItem.alt || ""}
                      onChange={(e) => handleUpdateItem(activeItemIndex, { alt: e.target.value })}
                      placeholder="Leave empty or author brief description (no filenames)"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Caption / Brief Commentary</Label>
                  <Textarea
                    rows={2}
                    value={activeItem.caption || ""}
                    onChange={(e) => handleUpdateItem(activeItemIndex, { caption: e.target.value })}
                    placeholder="Brief curatorial commentary or historical details shown on hover/overlay..."
                    className="text-xs"
                  />
                </div>

                {/* Rich Curatorial Metadata Inputs (Displayed on Museum Placards) */}
                <div className="p-3 rounded-lg border border-border/70 bg-card/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" /> Museum Placard Metadata
                    </Label>
                    <div className="flex items-center gap-1.5">
                      {artworksList.some(
                        (a) =>
                          (a.watermarkedWebpUrl && a.watermarkedWebpUrl === activeItem.url) ||
                          (a.primaryImageUrl && a.primaryImageUrl === activeItem.url) ||
                          (activeItem.title && a.title.toLowerCase().trim() === activeItem.title.toLowerCase().trim())
                      ) && (
                        <button
                          type="button"
                          onClick={() => {
                            const matched = artworksList.find(
                              (a) =>
                                (a.watermarkedWebpUrl && a.watermarkedWebpUrl === activeItem.url) ||
                                (a.primaryImageUrl && a.primaryImageUrl === activeItem.url) ||
                                (activeItem.title && a.title.toLowerCase().trim() === activeItem.title.toLowerCase().trim())
                            );
                            if (matched) {
                              handleUpdateItem(activeItemIndex, {
                                artworkId: matched.id,
                                title: stripHtmlTags(matched.title),
                                medium: stripHtmlTags(matched.medium) || activeItem.medium || "",
                                dimensions: stripHtmlTags(matched.dimensions) || activeItem.dimensions || "",
                                traditionalSchool: stripHtmlTags(matched.category?.name) || activeItem.traditionalSchool || "",
                                year: matched.yearCreated ? String(matched.yearCreated) : activeItem.year,
                                description: stripHtmlTags(matched.description) || activeItem.description || "",
                                linkType: "artwork",
                                linkTarget: matched.slug,
                                alt: isRawFilenameOrUuid(activeItem.alt) ? "" : (activeItem.alt || ""),
                                caption: stripHtmlTags(matched.description) || (activeItem.caption?.includes("Sacred") ? "" : activeItem.caption) || "",
                              });
                              toast.success(`Synchronized metadata from "${stripHtmlTags(matched.title)}"!`);
                            }
                          }}
                          className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                        >
                          ⚡ Auto-Fill Matching
                        </button>
                      )}
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Placard Lines 1-3
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-foreground">Materials &amp; Medium</Label>
                      <Input
                        type="text"
                        value={activeItem.medium || ""}
                        onChange={(e) => handleUpdateItem(activeItemIndex, { medium: e.target.value })}
                        placeholder="e.g. Oil on Belgian Linen, Bronze, Mixed Media"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-foreground">Dimensions</Label>
                      <Input
                        type="text"
                        value={activeItem.dimensions || ""}
                        onChange={(e) => handleUpdateItem(activeItemIndex, { dimensions: e.target.value })}
                        placeholder="e.g. 36 x 24 in (91.4 x 61 cm)"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-foreground">Traditional School / Style</Label>
                      <Input
                        type="text"
                        value={activeItem.traditionalSchool || ""}
                        onChange={(e) => handleUpdateItem(activeItemIndex, { traditionalSchool: e.target.value })}
                        placeholder="e.g. Contemporary Realism, Impressionism, Modern Fine Art"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-foreground">Creation Year / Era</Label>
                      <Input
                        type="text"
                        value={activeItem.year || ""}
                        onChange={(e) => handleUpdateItem(activeItemIndex, { year: e.target.value })}
                        placeholder="e.g. 2024"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">Placard Narrative / Provenance</Label>
                    <Textarea
                      rows={2}
                      value={activeItem.description || ""}
                      onChange={(e) => handleUpdateItem(activeItemIndex, { description: e.target.value })}
                      placeholder="Detailed curatorial narrative shown on the museum placard below the artwork..."
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Linking Configuration */}
                <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-2">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <LinkIcon className="w-3 h-3 text-primary" /> Destination Link on Click
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground">Link Type</span>
                      <Select
                        value={activeItem.linkType || "none"}
                        onValueChange={(val: "none" | "artwork" | "category" | "custom") => {
                          let defaultTarget = "";
                          if (val === "artwork" && artworksList.length > 0) defaultTarget = artworksList[0].slug;
                          if (val === "category" && categoriesList.length > 0) defaultTarget = categoriesList[0].slug;
                          handleUpdateItem(activeItemIndex, {
                            linkType: val,
                            linkTarget: defaultTarget,
                          });
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (View Only)</SelectItem>
                          <SelectItem value="artwork">Specific Artwork</SelectItem>
                          <SelectItem value="category">Art Category / School</SelectItem>
                          <SelectItem value="custom">Custom URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {activeItem.linkType === "artwork" && (
                      <div className="sm:col-span-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">Select Artwork</span>
                          {artworksList.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const target = activeItem.linkTarget || artworksList[0]?.slug;
                                const art = artworksList.find((a) => a.slug === target);
                                if (art) {
                                  handleUpdateItem(activeItemIndex, {
                                    artworkId: art.id,
                                    title: stripHtmlTags(art.title),
                                    medium: stripHtmlTags(art.medium) || activeItem.medium,
                                    dimensions: stripHtmlTags(art.dimensions) || activeItem.dimensions,
                                    year: art.yearCreated ? String(art.yearCreated) : activeItem.year,
                                    traditionalSchool: stripHtmlTags(art.category?.name) || activeItem.traditionalSchool,
                                    description: stripHtmlTags(art.description) || activeItem.description,
                                    url: art.watermarkedWebpUrl || art.primaryImageUrl || activeItem.url,
                                  });
                                  toast.success(`Ingested metadata from "${stripHtmlTags(art.title)}"`);
                                }
                              }}
                              className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                            >
                              ⚡ Re-Ingest Metadata
                            </button>
                          )}
                        </div>
                        <Select
                          value={activeItem.linkTarget || (artworksList[0]?.slug ?? "")}
                          onValueChange={(val) => {
                            const art = artworksList.find((a) => a.slug === val);
                            handleUpdateItem(activeItemIndex, {
                              linkTarget: val,
                              ...(art
                                ? {
                                    artworkId: art.id,
                                    title: stripHtmlTags(art.title),
                                    medium: stripHtmlTags(art.medium) || activeItem.medium,
                                    dimensions: stripHtmlTags(art.dimensions) || activeItem.dimensions,
                                    year: art.yearCreated ? String(art.yearCreated) : activeItem.year,
                                    traditionalSchool: stripHtmlTags(art.category?.name) || activeItem.traditionalSchool,
                                    description: stripHtmlTags(art.description) || activeItem.description,
                                    url: art.watermarkedWebpUrl || art.primaryImageUrl || activeItem.url,
                                  }
                                : {}),
                            });
                            if (art) {
                              toast.success(`Ingested curatorial metadata for "${stripHtmlTags(art.title)}"`);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Choose an artwork" />
                          </SelectTrigger>
                          <SelectContent className="max-h-56">
                            {artworksList.map((art) => (
                              <SelectItem key={art.id} value={art.slug}>
                                {art.title} (/artwork/{art.slug})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {activeItem.linkType === "category" && (
                      <div className="sm:col-span-2 space-y-1">
                        <span className="text-[10px] text-muted-foreground">Select Art Category</span>
                        <Select
                          value={activeItem.linkTarget || (categoriesList[0]?.slug ?? "")}
                          onValueChange={(val) => handleUpdateItem(activeItemIndex, { linkTarget: val })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Choose a category" />
                          </SelectTrigger>
                          <SelectContent className="max-h-56">
                            {categoriesList.map((cat) => (
                              <SelectItem key={cat.id} value={cat.slug}>
                                {cat.name} (/gallery/{cat.slug})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {activeItem.linkType === "custom" && (
                      <div className="sm:col-span-2 space-y-1">
                        <span className="text-[10px] text-muted-foreground">Target URL (Internal or External)</span>
                        <Input
                          type="text"
                          value={activeItem.linkTarget || ""}
                          onChange={(e) => handleUpdateItem(activeItemIndex, { linkTarget: e.target.value })}
                          placeholder="e.g. /concerts or https://..."
                          className="h-8 text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Universal Media Dialog for Batch Insertion or Single Item Swapping */}
      <UniversalMediaDialog
        open={isMediaDialogOpen}
        onOpenChange={(open) => {
          setIsMediaDialogOpen(open);
          if (!open) setMediaDialogMode("items");
        }}
        acceptedTypes="image"
        allowMultiple={mediaDialogMode === "items" && mediaDialogTargetIndex === null}
        title={
          mediaDialogMode === "customWall"
            ? "Select Custom Wall Backdrop Image"
            : mediaDialogMode === "perWall"
            ? `Select Image for Wall #${mediaDialogWallIndex + 1}`
            : mediaDialogMode === "canvasBg"
            ? "Select Custom Canvas Background Image"
            : mediaDialogTargetIndex !== null
            ? `Select Image for Photo #${mediaDialogTargetIndex + 1}`
            : "Select Media for Gallery"
        }
        onSelect={(media) => {
          if (mediaDialogMode === "customWall") {
            handleCustomWallUrlChange(media.url);
            toast.success("Custom wall backdrop updated!");
            return;
          }
          if (mediaDialogMode === "perWall") {
            handlePerWallUrlChange(mediaDialogWallIndex, media.url);
            toast.success(`Custom background updated for Wall #${mediaDialogWallIndex + 1}!`);
            return;
          }
          if (mediaDialogMode === "canvasBg") {
            handleCanvasBgImageUrlChange(media.url);
            toast.success("Custom canvas background updated!");
            return;
          }

          const enriched = enrichItemWithArtwork({
            url: media.url,
            title: media.title,
            alt: media.alt || "",
            artworkId: media.artworkId,
            slug: media.slug,
            medium: media.medium,
            dimensions: media.dimensions,
            year: media.year ? String(media.year) : undefined,
            traditionalSchool: media.traditionalSchool,
            description: media.description,
          });

          if (mediaDialogTargetIndex !== null) {
            handleUpdateItem(mediaDialogTargetIndex, enriched);
            toast.success(`Updated metadata for "${enriched.title}"!`);
          } else {
            const updated = [...items, enriched].slice(0, 12);
            onChange({
              ...data,
              items: updated,
            });
            setActiveItemIndex(updated.length - 1);
            toast.success(`Added "${enriched.title}" with curatorial metadata!`);
          }
        }}
        onSelectMultiple={(mediaList) => {
          const newItems: MediaGalleryItem[] = mediaList.map((m) =>
            enrichItemWithArtwork({
              url: m.url,
              title: m.title,
              alt: m.alt || "",
              artworkId: m.artworkId,
              slug: m.slug,
              medium: m.medium,
              dimensions: m.dimensions,
              year: m.year ? String(m.year) : undefined,
              traditionalSchool: m.traditionalSchool,
              description: m.description,
            })
          );
          const updated = [...items, ...newItems].slice(0, 12);
          onChange({
            ...data,
            items: updated,
          });
          setActiveItemIndex(updated.length - 1);
          toast.success(`Added ${newItems.length} photos with curatorial metadata!`);
        }}
      />

      {/* Artwork Catalog Search & Add Dialog */}
      <Dialog open={isCatalogSearchOpen} onOpenChange={setIsCatalogSearchOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
              <Search className="w-5 h-5 text-amber-600" />
              Add Artwork from Catalog to Wall #{selectedWallTab + 1}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Search the permanent atelier archive by title, medium, dimensions, or category and assign directly to Wall #{selectedWallTab + 1}.
            </DialogDescription>
          </DialogHeader>

          {/* Search Bar & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search artworks by title, medium, dimensions..."
                value={catalogSearchQuery}
                onChange={(e) => setCatalogSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            {catalogCategories.length > 0 && (
              <Select value={catalogCategoryFilter} onValueChange={setCatalogCategoryFilter}>
                <SelectTrigger className="h-9 text-xs w-44">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {catalogCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Results Grid */}
          <div className="flex-1 overflow-y-auto mt-4 pr-1 min-h-[300px]">
            {isLoadingCatalog ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-2 text-muted-foreground">
                <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Loading museum archive...</p>
              </div>
            ) : filteredCatalogArtworks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-2 text-center text-muted-foreground">
                <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm font-medium">No artworks found</p>
                <p className="text-xs">Try adjusting your search query or category filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredCatalogArtworks.map((art) => {
                  const artImg = art.primaryImageUrl || art.images?.[0] || "";
                  const isAlreadyOnWall = effectiveWallConfigs[selectedWallTab]?.artworkIds?.includes(art.id);
                  return (
                    <div
                      key={art.id}
                      className="group relative rounded-lg border border-border/70 bg-card overflow-hidden flex flex-col justify-between hover:border-amber-500/50 hover:shadow-md transition-all"
                    >
                      <div className="relative aspect-4/3 bg-stone-900 overflow-hidden">
                        {artImg ? (
                          <img
                            src={artImg}
                            alt={art.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            No Image
                          </div>
                        )}
                        {art.category?.name && (
                          <span className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-[9px] text-amber-300 px-1.5 py-0.5 rounded font-medium">
                            {art.category.name}
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-amber-600 transition-colors">
                            {art.title}
                          </h4>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                            {art.medium || "Archival Media"}
                          </p>
                          {art.dimensions && (
                            <p className="text-[9px] font-mono text-muted-foreground/80 line-clamp-1">
                              {art.dimensions}
                            </p>
                          )}
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          disabled={isAlreadyOnWall}
                          onClick={() => handleAddCatalogArtworkToWall(selectedWallTab, art)}
                          className={cn(
                            "w-full mt-2 h-7 text-xs cursor-pointer",
                            isAlreadyOnWall
                              ? "bg-muted text-muted-foreground cursor-not-allowed"
                              : "bg-amber-600 hover:bg-amber-700 text-white"
                          )}
                        >
                          {isAlreadyOnWall ? (
                            <span className="flex items-center gap-1">
                              <Check className="w-3 h-3" /> On Wall
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Plus className="w-3 h-3" /> Add to Wall
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
