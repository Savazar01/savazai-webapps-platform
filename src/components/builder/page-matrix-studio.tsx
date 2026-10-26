"use client";

import * as React from "react";
import {
  Grid,
  Columns,
  Rows,
  Sliders,
  FolderOpen,
  Save,
  PanelLeft,
  Heading,
  Footprints,
  LayoutTemplate,
  Layers,
  Check,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  History,
  Images,
  Send,
  Loader2,
  Maximize2,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TiptapEditor } from "@/components/builder/tiptap-editor";
import { AiAssistantModal } from "@/components/admin/ai-assistant-modal";
import { ColumnBlock } from "@/components/public/tiptap-renderer";
import { VideoBlock } from "@/components/public/builder/video-block";
import { EmbedBlock, type EmbedAspectRatio, type EmbedSandboxMode } from "@/components/public/builder/embed-block";
import { TimelineInspector } from "@/components/builder/timeline-inspector";
import type { TimelineMilestone } from "@/components/public/blocks/timeline-block";
import type { TimelineGranularity, TimelineLayout, TimelineItem } from "@/types/timeline";
import { FormBlockInspector, type FormFieldConfig } from "@/components/builder/form-block-inspector";
import { MediaGalleryInspector } from "@/components/builder/media-gallery-inspector";
import { MediaGalleryBlock, type MediaGalleryItem } from "@/components/public/blocks/media-gallery-block";
import { toast } from "sonner";
import { type ContrastMode, resolveContainerContrast } from "@/lib/theme-contrast";

export interface PageMatrixCellSegment {
  id: string;
  row: number; // 1-indexed
  col: number; // 1-indexed
  rowSpan: number; // >= 1
  colSpan: number; // >= 1
  title?: string;
  contentHtml?: string;
  blocks?: ColumnBlock[];
  bgConfig?: {
    backgroundColor?: string;
    frameStyle?: string;
  };
}

export interface PageMatrixConfig {
  matrixRows: number;
  matrixCols: number;
  rowHeights?: string;
  colWidths?: string;
  hasHeader: boolean;
  headerHtml?: string | null;
  hasFooter: boolean;
  footerHtml?: string | null;
  verticalSpineMode: "NONE" | "LEFT" | "RIGHT";
  verticalSpineHtml?: string | null;
  verticalSpineWidth?: string;
  segments: PageMatrixCellSegment[];
}

export interface PageTemplateItem {
  id: string;
  title: string;
  description?: string | null;
  targetPageType: string;
  matrixRows: number;
  matrixCols: number;
  rowHeights?: string | null;
  colWidths?: string | null;
  hasHeader: boolean;
  headerHtml?: string | null;
  hasFooter: boolean;
  footerHtml?: string | null;
  verticalSpineMode: string;
  verticalSpineHtml?: string | null;
  verticalSpineWidth?: string | null;
  segments?: PageMatrixCellSegment[] | null;
}

interface PageMatrixStudioProps {
  config: PageMatrixConfig;
  onChange: (updated: Partial<PageMatrixConfig>) => void;
  sectionTitle?: string;
  contrast?: ContrastMode;
  backgroundColor?: string | null;
}

export function reconcilePageMatrixCells(
  rows: number,
  cols: number,
  existingSegments: PageMatrixCellSegment[] = []
): PageMatrixCellSegment[] {
  const result: PageMatrixCellSegment[] = [];
  const existingMap = new Map<string, PageMatrixCellSegment>();

  for (const seg of existingSegments) {
    existingMap.set(`${seg.row}-${seg.col}`, seg);
  }

  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const key = `${r}-${c}`;
      const existing = existingMap.get(key);
      const maxColSpan = cols - c + 1;
      const maxRowSpan = rows - r + 1;

      if (existing) {
        result.push({
          ...existing,
          row: r,
          col: c,
          colSpan: Math.min(existing.colSpan || 1, maxColSpan),
          rowSpan: Math.min(existing.rowSpan || 1, maxRowSpan),
          blocks:
            existing.blocks && existing.blocks.length > 0
              ? existing.blocks
              : existing.contentHtml
              ? [
                  {
                    id: `blk-${Date.now()}-${r}-${c}`,
                    type: "TEXT",
                    content: {
                      type: "doc",
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            {
                              type: "text",
                              text:
                                existing.contentHtml.replace(/<[^>]+>/g, "").trim() ||
                                "Editorial verse...",
                            },
                          ],
                        },
                      ],
                    },
                  },
                ]
              : [
                  {
                    id: `blk-${Date.now()}-${r}-${c}`,
                    type: "TEXT",
                    content: {
                      type: "doc",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: `Cell (${r}, ${c}) narrative copy...` }],
                        },
                      ],
                    },
                  },
                ],
        });
      } else {
        result.push({
          id: `cell-${r}-${c}-${Date.now() + Math.random()}`,
          row: r,
          col: c,
          rowSpan: 1,
          colSpan: 1,
          title: `Cell (${r}, ${c})`,
          blocks: [
            {
              id: `blk-${Date.now()}-${r}-${c}`,
              type: "TEXT",
              content: {
                type: "doc",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: `Cell (${r}, ${c}) narrative copy...` }],
                  },
                ],
              },
            },
          ],
        });
      }
    }
  }

  return result;
}

export function PageMatrixStudio({
  config,
  onChange,
  sectionTitle: _sectionTitle = "Matrix Grid Section",
  contrast,
  backgroundColor,
}: PageMatrixStudioProps) {
  const baseContrast: ContrastMode = contrast || resolveContainerContrast({ backgroundColor });
  const {
    matrixRows = 2,
    matrixCols = 2,
    rowHeights = "1fr 1fr",
    colWidths = "1fr 1fr",
    hasHeader = false,
    headerHtml = "",
    hasFooter = false,
    footerHtml = "",
    verticalSpineMode = "NONE",
    verticalSpineHtml = "",
    verticalSpineWidth = "25%",
    segments = [],
  } = config;

  // Selected cell key for Inspector
  const [selectedCellKey, setSelectedCellKey] = React.useState<string>("1-1");

  // Template Modal States
  const [saveModalOpen, setSaveModalOpen] = React.useState(false);
  const [templateTitle, setTemplateTitle] = React.useState("");
  const [templateDesc, setTemplateDesc] = React.useState("");
  const [isSavingTemplate, setIsSavingTemplate] = React.useState(false);

  const [loadModalOpen, setLoadModalOpen] = React.useState(false);
  const [templates, setTemplates] = React.useState<PageTemplateItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = React.useState(false);

  // Inspector modal states for specialized blocks
  const [timelineModalOpen, setTimelineModalOpen] = React.useState(false);
  const [timelineEditingCell, setTimelineEditingCell] = React.useState<{
    row: number;
    col: number;
    blockId: string;
  } | null>(null);

  const [formModalOpen, setFormModalOpen] = React.useState(false);
  const [formEditingCell, setFormEditingCell] = React.useState<{
    row: number;
    col: number;
    blockId: string;
  } | null>(null);

  const [galleryModalOpen, setGalleryModalOpen] = React.useState(false);
  const [galleryEditingCell, setGalleryEditingCell] = React.useState<{
    row: number;
    col: number;
    blockId: string;
  } | null>(null);

  const [uploadingBlockId, setUploadingBlockId] = React.useState<string | null>(null);

  // Active view tab
  const [activeViewTab, setActiveViewTab] = React.useState<"canvas" | "cells" | "zones">("canvas");

  // Reconcile on mount if empty
  React.useEffect(() => {
    if (!segments || segments.length === 0) {
      const initial = reconcilePageMatrixCells(matrixRows, matrixCols, []);
      onChange({ segments: initial });
    }
  }, [matrixRows, matrixCols, segments, onChange]);

  // Dimension Handlers
  const handleRowsChange = (newRows: number) => {
    const clamped = Math.min(6, Math.max(1, newRows));
    const newRowHeights = Array(clamped).fill("1fr").join(" ");
    const reconciled = reconcilePageMatrixCells(clamped, matrixCols, segments);
    onChange({
      matrixRows: clamped,
      rowHeights: newRowHeights,
      segments: reconciled,
    });
  };

  const handleColsChange = (newCols: number) => {
    const clamped = Math.min(6, Math.max(1, newCols));
    const newColWidths = Array(clamped).fill("1fr").join(" ");
    const reconciled = reconcilePageMatrixCells(matrixRows, clamped, segments);
    onChange({
      matrixCols: clamped,
      colWidths: newColWidths,
      segments: reconciled,
    });
  };

  // Cell updates
  const updateCell = (row: number, col: number, updates: Partial<PageMatrixCellSegment>) => {
    const updated = segments.map((cell) => {
      if (cell.row === row && cell.col === col) {
        return { ...cell, ...updates };
      }
      return cell;
    });
    onChange({ segments: updated });
  };

  // Block management inside a cell
  const addBlockToCell = (row: number, col: number, type: ColumnBlock["type"]) => {
    const cell = segments.find((c) => c.row === row && c.col === col);
    if (!cell) return;
    const currentBlocks: ColumnBlock[] = Array.isArray(cell.blocks) ? [...cell.blocks] : [];

    const newBlock: ColumnBlock = {
      id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      ...(type === "TEXT"
        ? {
            content: {
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "New verse or commentary block..." }],
                },
              ],
            },
          }
        : {}),
      ...(type === "IMAGE"
        ? {
            mediaUrl:
              "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=800",
            mediaAlt: "Classical Masterwork",
            mediaAspectRatio: "auto",
          }
        : {}),
      ...(type === "VIDEO" ? { videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } : {}),
      ...(type === "AUDIO"
        ? {
            audioTitle: "Carnatic Recital in Kalyani Raga",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          }
        : {}),
      ...(type === "DIVIDER" ? { dividerStyle: "gold-leaf" } : {}),
      ...(type === "BUTTON"
        ? {
            buttonText: "Explore Masterwork",
            buttonUrl: "/gallery",
            buttonVariant: "gold",
          }
        : {}),
      ...(type === "BLOG_GRID" ? { blogLimit: 4 } : {}),
      ...(type === "PDF_VIEWER"
        ? {
            fileUrl: "",
            fileName: "Catalog.pdf",
            title: "Archival Monograph & Curatorial Catalog",
            height: 650,
            allowDownload: true,
          }
        : {}),
      ...(type === "ARTIST_TIMELINE"
        ? {
            title: "Artistic Journey & Honors",
            subtitle:
              "A chronological trajectory of Thanjavur mastery, solo recitals, and prestigious recognitions.",
            timelineLayout: "alternating",
            showFilters: true,
            timelineItems: [
              {
                id: "m-1",
                period: "1985 - 1992",
                category: "Education",
                title: "Traditional Gurukula Training",
                subtitle: "Rigorous Tanjore Iconography Apprenticeship",
                location: "Thanjavur, Tamil Nadu",
                description:
                  "Mastered 22-karat gold foil embossing, natural mineral pigments, and Mukha-varnam facial iconography under senior traditional acharyas.",
              },
              {
                id: "m-2",
                period: "2004",
                category: "Solo Exhibition",
                title: "Swarna Devatha: Golden Pantheon",
                subtitle: "Retrospective Exhibition",
                location: "National Gallery of Modern Art, New Delhi",
                description:
                  "Curated exhibition of 28 classical Thanjavur devotional panels depicting Navagrahas and Ashta Lakshmis.",
              },
            ],
          }
        : {}),
      ...(type === "FORM_BLOCK"
        ? {
            formTitle: "Get in Touch",
            formSubtitle: "We would love to hear from you. Please fill out the form below and our team will get back to you shortly.",
            submitButtonText: "Send Message",
            successMessage: "Thank you for your message. Our team will get back to you shortly.",
            fields: [
              {
                id: "name",
                label: "Full Name",
                type: "text" as const,
                required: true,
                placeholder: "e.g. Alex Morgan",
              },
              {
                id: "email",
                label: "Email Address",
                type: "email" as const,
                required: true,
                placeholder: "name@example.com",
              },
              {
                id: "phone",
                label: "Phone / Mobile",
                type: "tel" as const,
                required: false,
                placeholder: "e.g. +1 (555) 019-2834",
              },
              {
                id: "subject",
                label: "Subject",
                type: "text" as const,
                required: true,
                placeholder: "How can we help you?",
              },
              {
                id: "message",
                label: "Message",
                type: "textarea" as const,
                required: true,
                placeholder: "Enter your message or inquiry...",
              },
            ],
          }
        : {}),
      ...(type === "MEDIA_GALLERY"
        ? {
            galleryDisplayMode: "carousel" as const,
            galleryAutoplayTimer: 5,
            galleryAspectRatio: "landscape" as const,
            galleryFrameStyle: "heritage" as const,
            galleryItems: [
              {
                id: "mg-1",
                url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=1200",
                title: "Exhibition Gallery Piece 1",
                caption: "Curated fine art piece on architectural display.",
                alt: "",
                linkType: "none" as const,
              },
              {
                id: "mg-2",
                url: "https://images.unsplash.com/photo-1582561121160-b610c3b8794c?auto=format&fit=crop&q=80&w=1200",
                title: "Exhibition Gallery Piece 2",
                caption: "Curated fine art piece on architectural display.",
                alt: "",
                linkType: "none" as const,
              },
            ],
          }
        : {}),
      ...(type === "EMBED_HTML"
        ? {
            embedHtml: "",
            embedCaption: "",
            embedAspectRatio: "16:9" as const,
            embedSandboxMode: "sandboxed" as const,
          }
        : {}),
    };

    currentBlocks.push(newBlock);
    updateCell(row, col, { blocks: currentBlocks });
  };

  const removeBlockFromCell = (row: number, col: number, blockId: string) => {
    const cell = segments.find((c) => c.row === row && c.col === col);
    if (!cell) return;
    const currentBlocks = Array.isArray(cell.blocks) ? cell.blocks.filter((b) => b.id !== blockId) : [];
    updateCell(row, col, { blocks: currentBlocks });
  };

  const moveBlockInCell = (row: number, col: number, blockIdx: number, direction: "up" | "down") => {
    const cell = segments.find((c) => c.row === row && c.col === col);
    if (!cell || !Array.isArray(cell.blocks)) return;
    const targetIdx = direction === "up" ? blockIdx - 1 : blockIdx + 1;
    if (targetIdx < 0 || targetIdx >= cell.blocks.length) return;
    const newBlocks = [...cell.blocks];
    const [moved] = newBlocks.splice(blockIdx, 1);
    newBlocks.splice(targetIdx, 0, moved);
    updateCell(row, col, { blocks: newBlocks });
  };

  const updateBlockInCell = (row: number, col: number, blockId: string, updates: Partial<ColumnBlock>) => {
    const cell = segments.find((c) => c.row === row && c.col === col);
    if (!cell || !Array.isArray(cell.blocks)) return;
    const newBlocks = cell.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b));
    updateCell(row, col, { blocks: newBlocks });
  };

  const handleBlockImageUpload = async (
    row: number,
    col: number,
    blockId: string,
    file: File
  ) => {
    setUploadingBlockId(blockId);
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      updateBlockInCell(row, col, blockId, { mediaUrl: data.url });
      toast.success("Image uploaded successfully");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploadingBlockId(null);
    }
  };

  // Determine covered cells
  const coveredCells = React.useMemo(() => {
    const covered = new Set<string>();
    for (const cell of segments) {
      const rSpan = cell.rowSpan || 1;
      const cSpan = cell.colSpan || 1;
      if (rSpan > 1 || cSpan > 1) {
        for (let r = cell.row; r < cell.row + rSpan; r++) {
          for (let c = cell.col; c < cell.col + cSpan; c++) {
            if (r !== cell.row || c !== cell.col) {
              covered.add(`${r}-${c}`);
            }
          }
        }
      }
    }
    return covered;
  }, [segments]);

  // Template Fetch & Save
  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch("/api/admin/catalogs/templates?targetPageType=PAGE_SECTION");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
      toast.error("Failed to load templates");
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateTitle.trim()) return;
    setIsSavingTemplate(true);
    try {
      const payload = {
        title: templateTitle.trim(),
        description: templateDesc.trim() || null,
        targetPageType: "PAGE_SECTION",
        matrixRows,
        matrixCols,
        rowHeights,
        colWidths,
        hasHeader,
        headerHtml: headerHtml || null,
        hasFooter,
        footerHtml: footerHtml || null,
        verticalSpineMode,
        verticalSpineHtml: verticalSpineHtml || null,
        verticalSpineWidth,
        segments,
      };

      const res = await fetch("/api/admin/catalogs/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Page Section Template saved successfully");
        setSaveModalOpen(false);
        setTemplateTitle("");
        setTemplateDesc("");
      } else {
        toast.error("Failed to save template");
      }
    } catch {
      toast.error("Failed to save template");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const applyTemplate = (tpl: PageTemplateItem) => {
    const rows = tpl.matrixRows || 2;
    const cols = tpl.matrixCols || 2;
    const tplSegments = (tpl.segments as PageMatrixCellSegment[]) || [];
    const reconciled = reconcilePageMatrixCells(rows, cols, tplSegments);

    onChange({
      matrixRows: rows,
      matrixCols: cols,
      rowHeights: tpl.rowHeights || Array(rows).fill("1fr").join(" "),
      colWidths: tpl.colWidths || Array(cols).fill("1fr").join(" "),
      hasHeader: Boolean(tpl.hasHeader),
      headerHtml: tpl.headerHtml || "",
      hasFooter: Boolean(tpl.hasFooter),
      footerHtml: tpl.footerHtml || "",
      verticalSpineMode: (tpl.verticalSpineMode as "NONE" | "LEFT" | "RIGHT") || "NONE",
      verticalSpineHtml: tpl.verticalSpineHtml || "",
      verticalSpineWidth: tpl.verticalSpineWidth || "25%",
      segments: reconciled,
    });
    setLoadModalOpen(false);
    toast.success(`Applied template: ${tpl.title}`);
  };

  const selectedCell = segments.find(
    (c) => `${c.row}-${c.col}` === selectedCellKey
  ) || segments[0];

  return (
    <div className="page-matrix-studio space-y-4 border border-border/80 rounded-2xl p-4 sm:p-5 bg-card/70 backdrop-blur-xs">
      {/* Studio Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-serif font-bold text-foreground">
                InDesign Matrix Engine • {matrixRows} Rows × {matrixCols} Cols
              </h4>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                {segments.length} Cells
              </Badge>
              <Badge variant="secondary" className="text-[9px] font-sans font-semibold">
                Responsive Grid
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Define multi-track web rows and columns, spanned featured zones, vertical sidebar spines, and running headers.
            </p>
          </div>
        </div>

        {/* Action Buttons: Save/Load Template */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              fetchTemplates();
              setLoadModalOpen(true);
            }}
            className="text-xs h-8 gap-1.5 border-primary/30 hover:bg-primary/5 cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-primary" />
            <span>Load Page Template</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSaveModalOpen(true)}
            className="text-xs h-8 gap-1.5 border-primary/30 hover:bg-primary/5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-primary" />
            <span>Save Section Template</span>
          </Button>
        </div>
      </div>

      {/* Matrix Controls & Dimensions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 bg-muted/20 p-3.5 rounded-xl border border-border/60">
        {/* Rows Stepper */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Rows className="w-3.5 h-3.5 text-primary" /> Matrix Rows
            </span>
            <span className="text-[11px] font-mono text-primary font-bold">{matrixRows}</span>
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6].map((r) => (
              <button
                key={`r-${r}`}
                type="button"
                onClick={() => handleRowsChange(r)}
                className={`flex-1 py-1 text-xs font-mono font-semibold rounded border transition-all cursor-pointer ${
                  matrixRows === r
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card hover:bg-muted/50 border-border text-muted-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Columns Stepper */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Columns className="w-3.5 h-3.5 text-primary" /> Matrix Columns
            </span>
            <span className="text-[11px] font-mono text-primary font-bold">{matrixCols}</span>
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6].map((c) => (
              <button
                key={`c-${c}`}
                type="button"
                onClick={() => handleColsChange(c)}
                className={`flex-1 py-1 text-xs font-mono font-semibold rounded border transition-all cursor-pointer ${
                  matrixCols === c
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card hover:bg-muted/50 border-border text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Column Track Width Presets */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-primary" /> Col Proportions
          </label>
          <Select
            value={colWidths || "1fr 1fr"}
            onValueChange={(val) => onChange({ colWidths: val })}
          >
            <SelectTrigger className="text-xs h-8">
              <SelectValue placeholder="Proportions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Array(matrixCols).fill("1fr").join(" ")}>
                Balanced Equal ({Array(matrixCols).fill("1fr").join(":")})
              </SelectItem>
              {matrixCols === 2 && (
                <>
                  <SelectItem value="7fr 3fr">Asymmetric Hero-Left (70:30)</SelectItem>
                  <SelectItem value="3fr 7fr">Asymmetric Hero-Right (30:70)</SelectItem>
                  <SelectItem value="2fr 1fr">Editorial Contrast (2:1)</SelectItem>
                  <SelectItem value="1fr 2fr">Editorial Contrast (1:2)</SelectItem>
                  <SelectItem value="1.618fr 1fr">Golden Ratio (1.618:1)</SelectItem>
                </>
              )}
              {matrixCols === 3 && (
                <>
                  <SelectItem value="1fr 2fr 1fr">Feature Center (1:2:1)</SelectItem>
                  <SelectItem value="2fr 1fr 1fr">Feature Left (2:1:1)</SelectItem>
                  <SelectItem value="1fr 1fr 2fr">Feature Right (1:1:2)</SelectItem>
                </>
              )}
              {matrixCols === 4 && (
                <>
                  <SelectItem value="2fr 1fr 1fr 1fr">Lead Hero (2:1:1:1)</SelectItem>
                  <SelectItem value="1fr 2fr 1fr 1fr">Internal Spread</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Vertical Sidebar Spine */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <PanelLeft className="w-3.5 h-3.5 text-primary" /> Vertical Sidebar Spine
            </span>
          </label>
          <Select
            value={verticalSpineMode}
            onValueChange={(val: "NONE" | "LEFT" | "RIGHT") =>
              onChange({ verticalSpineMode: val })
            }
          >
            <SelectTrigger className="text-xs h-8">
              <SelectValue placeholder="Spine Placement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">No Spine (Full Canvas)</SelectItem>
              <SelectItem value="LEFT">Left Spine (Full-Height)</SelectItem>
              <SelectItem value="RIGHT">Right Spine (Full-Height)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Structural Zone Toggles: Running Header & Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-muted/10 text-xs">
        <div className="flex items-center gap-5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => onChange({ hasHeader: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <span className="font-semibold flex items-center gap-1.5">
              <Heading className="w-3.5 h-3.5 text-primary" /> Full-Width Running Header
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasFooter}
              onChange={(e) => onChange({ hasFooter: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <span className="font-semibold flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 text-primary" /> Full-Width Running Footer
            </span>
          </label>
        </div>

        {verticalSpineMode !== "NONE" && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-[11px]">Spine Width:</span>
            {["18%", "22%", "25%", "30%"].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onChange({ verticalSpineWidth: w })}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer transition-all ${
                  verticalSpineWidth === w
                    ? "bg-primary text-primary-foreground border-primary font-bold"
                    : "bg-card border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Workspace Tabs: Interactive Visual Canvas vs Cell Editors vs Structural Zones */}
      <Tabs
        value={activeViewTab}
        onValueChange={(v) => setActiveViewTab(v as "canvas" | "cells" | "zones")}
        className="w-full"
      >
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <TabsList className="h-8 p-0.5 bg-muted/40">
            <TabsTrigger value="canvas" className="text-xs h-7 px-3 gap-1.5">
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>Visual Matrix Canvas</span>
            </TabsTrigger>
            <TabsTrigger value="cells" className="text-xs h-7 px-3 gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Cell Content Editors ({segments.length})</span>
            </TabsTrigger>
            <TabsTrigger value="zones" className="text-xs h-7 px-3 gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Header, Footer &amp; Spine</span>
            </TabsTrigger>
          </TabsList>

          <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
            Click any cell in the canvas to configure span &amp; blocks
          </span>
        </div>

        {/* TAB 1: VISUAL MATRIX CANVAS */}
        <TabsContent value="canvas" className="space-y-4 pt-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Interactive Section Wireframe */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-2">
              <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Interactive Section Wireframe</span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {verticalSpineMode !== "NONE" ? `Includes ${verticalSpineMode} Spine` : "Full-Width Matrix"}
                </span>
              </div>

              {/* Complete Section Simulation */}
              <div className="matrix-sheet-preview rounded-2xl border-2 border-primary/40 p-4 bg-card/80 shadow-md min-h-[420px] flex flex-col justify-between gap-3 relative overflow-hidden">
                {/* Simulated Running Header */}
                {hasHeader && (
                  <div className="running-header-box p-2.5 rounded-lg border border-dashed border-primary/50 bg-primary/5 text-center text-xs font-mono">
                    <span className="text-primary font-semibold uppercase tracking-wider text-[10px]">
                      [Top Running Header Zone]
                    </span>
                    {headerHtml ? (
                      <div
                        className="text-xs text-foreground/80 line-clamp-1 mt-0.5"
                        dangerouslySetInnerHTML={{ __html: headerHtml }}
                      />
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">Header copy unassigned</p>
                    )}
                  </div>
                )}

                {/* Central Body (Spine + Matrix) */}
                <div
                  className="flex-1 flex gap-3 w-full"
                  style={{
                    flexDirection: verticalSpineMode === "RIGHT" ? "row-reverse" : "row",
                  }}
                >
                  {/* Vertical Spine Bar */}
                  {verticalSpineMode !== "NONE" && (
                    <div
                      style={{ width: verticalSpineWidth || "25%" }}
                      className="vertical-spine-box rounded-xl border border-dashed border-slate-400/60 dark:border-slate-600/60 bg-slate-100/50 dark:bg-slate-800/50 p-2.5 flex flex-col justify-between text-center shrink-0"
                    >
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {verticalSpineMode} Spine ({verticalSpineWidth})
                      </span>
                      <div className="text-[11px] text-foreground/80 font-serif my-auto line-clamp-4 overflow-hidden">
                        {verticalSpineHtml ? (
                          <div dangerouslySetInnerHTML={{ __html: verticalSpineHtml }} />
                        ) : (
                          <span className="italic text-muted-foreground">Vertical spine text</span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground">Spine Band</span>
                    </div>
                  )}

                  {/* Central Matrix Grid */}
                  <div
                    className="flex-1 grid gap-2.5 w-full"
                    style={{
                      gridTemplateRows: rowHeights || `repeat(${matrixRows}, 1fr)`,
                      gridTemplateColumns: colWidths || `repeat(${matrixCols}, 1fr)`,
                    }}
                  >
                    {segments.map((cell) => {
                      const cellKey = `${cell.row}-${cell.col}`;
                      const isCovered = coveredCells.has(cellKey);
                      if (isCovered) return null;

                      const isSelected = selectedCellKey === cellKey;
                      const rSpan = cell.rowSpan || 1;
                      const cSpan = cell.colSpan || 1;
                      const blocksCount = Array.isArray(cell.blocks) ? cell.blocks.length : 0;

                      return (
                        <div
                          key={cell.id || cellKey}
                          onClick={() => setSelectedCellKey(cellKey)}
                          style={{
                            gridRow: `span ${rSpan}`,
                            gridColumn: `span ${cSpan}`,
                          }}
                          className={`matrix-wireframe-cell rounded-xl p-3 border-2 transition-all cursor-pointer flex flex-col justify-between relative group ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/30"
                              : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30"
                          }`}
                        >
                          {/* Cell Header */}
                          <div className="flex items-center justify-between gap-1 pb-1">
                            <span className="w-5 h-5 rounded-md bg-primary/20 text-primary font-mono font-bold text-[10px] flex items-center justify-center">
                              {cell.row},{cell.col}
                            </span>
                            <div className="flex items-center gap-1">
                              {(rSpan > 1 || cSpan > 1) && (
                                <Badge variant="secondary" className="text-[9px] font-mono px-1 py-0">
                                  {cSpan}W × {rSpan}H
                                </Badge>
                              )}
                              {blocksCount > 0 && (
                                <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 border-primary/30 text-primary">
                                  {blocksCount} {blocksCount === 1 ? "Block" : "Blocks"}
                                </Badge>
                              )}
                              {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                            </div>
                          </div>

                          {/* Cell Title & Content Preview */}
                          <div className="my-auto py-1">
                            <h5 className="text-xs font-serif font-bold text-foreground line-clamp-1">
                              {cell.title || `Cell (${cell.row}, ${cell.col})`}
                            </h5>
                            <div className="text-[10px] text-muted-foreground font-serif line-clamp-2 mt-0.5">
                              {cell.blocks && cell.blocks.length > 0 ? (
                                <span>{cell.blocks.map((b) => b.type).join(" • ")}</span>
                              ) : cell.contentHtml ? (
                                <div dangerouslySetInnerHTML={{ __html: cell.contentHtml.replace(/<[^>]+>/g, " ") }} />
                              ) : (
                                <span className="italic text-muted-foreground/60">Empty segment</span>
                              )}
                            </div>
                          </div>

                          {/* Footer Indicator */}
                          <div className="text-[9px] font-mono text-muted-foreground/60 text-right pt-1 border-t border-border/40">
                            Click to configure
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Simulated Running Footer */}
                {hasFooter && (
                  <div className="running-footer-box p-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 text-center text-xs font-mono">
                    <span className="text-primary font-semibold uppercase tracking-wider text-[10px]">
                      [Bottom Running Footer Zone]
                    </span>
                    {footerHtml ? (
                      <div
                        className="text-xs text-foreground/80 line-clamp-1 mt-0.5"
                        dangerouslySetInnerHTML={{ __html: footerHtml }}
                      />
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">Footer copy unassigned</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Selected Cell Quick Inspector */}
            {selectedCell && (
              <div className="lg:col-span-5 xl:col-span-4 space-y-3.5 border-l border-border/60 pl-0 lg:pl-5">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground font-mono font-bold text-xs flex items-center justify-center">
                      {selectedCell.row},{selectedCell.col}
                    </div>
                    <div>
                      <h5 className="text-xs font-serif font-bold text-foreground">
                        Cell Inspector
                      </h5>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Row {selectedCell.row}, Col {selectedCell.col}
                      </span>
                    </div>
                  </div>

                  <AiAssistantModal
                    initialContext={`Cell (${selectedCell.row}, ${selectedCell.col}) Title: ${selectedCell.title || "Editorial Segment"}\nBlocks: ${JSON.stringify(selectedCell.blocks || [])}`}
                    onApply={(aiText) => {
                      const currentBlocks = selectedCell.blocks || [];
                      const textBlock: ColumnBlock = {
                        id: `blk-${Date.now()}-ai`,
                        type: "TEXT",
                        content: {
                          type: "doc",
                          content: [
                            {
                              type: "paragraph",
                              content: [{ type: "text", text: aiText }],
                            },
                          ],
                        },
                      };
                      updateCell(selectedCell.row, selectedCell.col, {
                        blocks: [...currentBlocks, textBlock],
                      });
                    }}
                    triggerLabel="✨ AI Polish"
                  />
                </div>

                {/* Cell Title */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground">Cell Segment Heading</label>
                  <Input
                    value={selectedCell.title || ""}
                    onChange={(e) =>
                      updateCell(selectedCell.row, selectedCell.col, { title: e.target.value })
                    }
                    placeholder={`e.g. Masterpiece Showcase (${selectedCell.row}, ${selectedCell.col})`}
                    className="h-8 text-xs font-serif"
                  />
                </div>

                {/* Spanning Controls */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg border border-border/60 bg-muted/20">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                      Col Span (Width)
                    </label>
                    <Select
                      value={String(selectedCell.colSpan || 1)}
                      onValueChange={(val) =>
                        updateCell(selectedCell.row, selectedCell.col, { colSpan: parseInt(val, 10) })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: matrixCols - selectedCell.col + 1 }, (_, i) => i + 1).map((s) => (
                          <SelectItem key={`cs-${s}`} value={String(s)}>
                            Span {s} {s === 1 ? "Col" : "Cols"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                      Row Span (Height)
                    </label>
                    <Select
                      value={String(selectedCell.rowSpan || 1)}
                      onValueChange={(val) =>
                        updateCell(selectedCell.row, selectedCell.col, { rowSpan: parseInt(val, 10) })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: matrixRows - selectedCell.row + 1 }, (_, i) => i + 1).map((s) => (
                          <SelectItem key={`rs-${s}`} value={String(s)}>
                            Span {s} {s === 1 ? "Row" : "Rows"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Block Toolkit Action Tray */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                    <span>Cell Blocks ({(selectedCell.blocks || []).length})</span>
                    <span className="text-[10px] font-mono text-muted-foreground">Add Content Block</span>
                  </label>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlockToCell(selectedCell.row, selectedCell.col, "TEXT")}
                      className="h-6 text-[10px] px-2 gap-1 border-primary/30"
                    >
                      <Plus className="w-2.5 h-2.5 text-primary" /> Text
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlockToCell(selectedCell.row, selectedCell.col, "IMAGE")}
                      className="h-6 text-[10px] px-2 gap-1 border-primary/30"
                    >
                      <ImageIcon className="w-2.5 h-2.5 text-primary" /> Image
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlockToCell(selectedCell.row, selectedCell.col, "MEDIA_GALLERY")}
                      className="h-6 text-[10px] px-2 gap-1 border-primary/30"
                    >
                      <Images className="w-2.5 h-2.5 text-primary" /> Gallery
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlockToCell(selectedCell.row, selectedCell.col, "VIDEO")}
                      className="h-6 text-[10px] px-2 gap-1 border-primary/30"
                    >
                      <Video className="w-2.5 h-2.5 text-primary" /> Video
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlockToCell(selectedCell.row, selectedCell.col, "AUDIO")}
                      className="h-6 text-[10px] px-2 gap-1 border-primary/30"
                    >
                      <Music className="w-2.5 h-2.5 text-primary" /> Audio
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlockToCell(selectedCell.row, selectedCell.col, "DIVIDER")}
                      className="h-6 text-[10px] px-2 gap-1 border-primary/30"
                    >
                      Divider
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlockToCell(selectedCell.row, selectedCell.col, "BUTTON")}
                      className="h-6 text-[10px] px-2 gap-1 border-primary/30"
                    >
                      Button
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlockToCell(selectedCell.row, selectedCell.col, "EMBED_HTML")}
                      className="h-6 text-[10px] px-2 gap-1 border-primary/30"
                    >
                      <Code className="w-2.5 h-2.5 text-primary" /> Embed / HTML
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlockToCell(selectedCell.row, selectedCell.col, "PDF_VIEWER")}
                      className="h-6 text-[10px] px-2 gap-1 border-primary/30"
                    >
                      <FileText className="w-2.5 h-2.5 text-primary" /> PDF
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlockToCell(selectedCell.row, selectedCell.col, "ARTIST_TIMELINE")}
                      className="h-6 text-[10px] px-2 gap-1 border-primary/30"
                    >
                      <History className="w-2.5 h-2.5 text-primary" /> Timeline
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlockToCell(selectedCell.row, selectedCell.col, "FORM_BLOCK")}
                      className="h-6 text-[10px] px-2 gap-1 border-primary/30"
                    >
                      <Send className="w-2.5 h-2.5 text-primary" /> Form
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlockToCell(selectedCell.row, selectedCell.col, "BLOG_GRID")}
                      className="h-6 text-[10px] px-2 gap-1 border-primary/30"
                    >
                      Blog Grid
                    </Button>
                  </div>
                </div>

                {/* Render Selected Cell Blocks */}
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {(selectedCell.blocks || []).map((block, bIdx) => (
                    <div
                      key={block.id}
                      className="p-2.5 rounded-lg border border-border/60 bg-card/60 text-xs space-y-2"
                    >
                      {/* Block Bar */}
                      <div className="flex items-center justify-between pb-1 border-b border-border/40 text-[10px] font-mono">
                        <span className="font-semibold text-primary">
                          #{bIdx + 1} {block.type}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveBlockInCell(selectedCell.row, selectedCell.col, bIdx, "up")}
                            disabled={bIdx === 0}
                            className="p-0.5 hover:text-foreground disabled:opacity-30"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlockInCell(selectedCell.row, selectedCell.col, bIdx, "down")}
                            disabled={bIdx === (selectedCell.blocks || []).length - 1}
                            className="p-0.5 hover:text-foreground disabled:opacity-30"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlockFromCell(selectedCell.row, selectedCell.col, block.id)}
                            className="p-0.5 text-destructive hover:bg-destructive/10 rounded"
                            title="Remove Block"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* TEXT Block */}
                      {block.type === "TEXT" && (
                        <TiptapEditor
                          contrast={
                            selectedCell.bgConfig?.backgroundColor
                              ? resolveContainerContrast({ backgroundColor: selectedCell.bgConfig.backgroundColor })
                              : baseContrast
                          }
                          content={block.content}
                          onChange={(json) =>
                            updateBlockInCell(selectedCell.row, selectedCell.col, block.id, { content: json })
                          }
                        />
                      )}

                      {/* IMAGE Block */}
                      {block.type === "IMAGE" && (
                        <div className="space-y-2">
                          {block.mediaUrl && (
                            <div className="relative rounded overflow-hidden max-h-36 bg-black/5 flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={block.mediaUrl}
                                alt={block.mediaAlt || "Cell artwork"}
                                className="max-h-36 object-contain"
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Input
                              value={block.mediaUrl || ""}
                              onChange={(e) =>
                                updateBlockInCell(selectedCell.row, selectedCell.col, block.id, {
                                  mediaUrl: e.target.value,
                                })
                              }
                              placeholder="Image URL"
                              className="h-7 text-xs flex-1"
                            />
                            <Label
                              htmlFor={`matrix-upload-${block.id}`}
                              className="h-7 px-2 border rounded flex items-center gap-1 cursor-pointer hover:bg-muted text-[10px] font-mono"
                            >
                              {uploadingBlockId === block.id ? (
                                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                              ) : (
                                <Upload className="w-3 h-3 text-primary" />
                              )}
                              Upload
                            </Label>
                            <input
                              id={`matrix-upload-${block.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleBlockImageUpload(selectedCell.row, selectedCell.col, block.id, f);
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* MEDIA GALLERY Block */}
                      {block.type === "MEDIA_GALLERY" && (
                        <div className="space-y-2">
                          <div className="p-2 rounded bg-muted/30 flex items-center justify-between">
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {(block.galleryItems || []).length} Slides • {block.galleryDisplayMode || "carousel"}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setGalleryEditingCell({
                                  row: selectedCell.row,
                                  col: selectedCell.col,
                                  blockId: block.id,
                                });
                                setGalleryModalOpen(true);
                              }}
                              className="h-6 text-[10px] gap-1 text-primary border-primary/30"
                            >
                              <Sliders className="w-3 h-3" /> Edit Gallery
                            </Button>
                          </div>
                          <MediaGalleryBlock
                            items={block.galleryItems}
                            displayMode={block.galleryDisplayMode}
                            aspectRatio={block.galleryAspectRatio}
                            frameStyle={block.galleryFrameStyle}
                            kenBurnsOverlayTheme={block.galleryKenBurnsOverlayTheme}
                            overlayTitleColor={block.galleryOverlayTitleColor}
                            overlayTextColor={block.galleryOverlayTextColor}
                            canvasBgColor={block.galleryCanvasBgColor}
                            borderFilletColor={block.galleryBorderFilletColor}
                            borderWidth={block.galleryBorderWidth}
                            framePadding={block.galleryFramePadding}
                            showCaptionRibbon={block.galleryShowCaptionRibbon}
                            environmentId={block.galleryEnvironmentId}
                            customWallUrl={block.galleryCustomWallUrl}
                            wallBackgroundMode={block.galleryWallBackgroundMode}
                            wallCustomBackgrounds={block.galleryWallCustomBackgrounds}
                            canvasBgImageUrl={block.galleryCanvasBgImageUrl}
                            canvasBgMode={block.galleryCanvasBgMode}
                            canvasBgOpacity={block.galleryCanvasBgOpacity}
                            cameraTourStyle={block.galleryCameraTourStyle}
                            wallLayout={block.galleryWallLayout}
                            autoplayTour={block.galleryAutoplayTour}
                            showFrameHeader={block.galleryShowFrameHeader}
                            frameHeaderBg={block.galleryFrameHeaderBg}
                            frameHeaderTextColor={block.galleryFrameHeaderTextColor}
                            maxArtworksPerWall={block.galleryMaxArtworksPerWall}
                            overviewDwellSeconds={block.galleryOverviewWallDwell}
                            showMetadataCardBelowWall={block.galleryShowMetadataCardBelowWall}
                            wallConfigs={block.galleryWallConfigs}
                            cameraTransitionStyle={block.galleryCameraTransitionStyle}
                          />
                        </div>
                      )}

                      {/* VIDEO Block */}
                      {block.type === "VIDEO" && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-muted-foreground">
                            Video URL (YouTube, Vimeo, Facebook, Instagram, MP4)
                          </label>
                          <Input
                            value={block.videoUrl || ""}
                            onChange={(e) =>
                              updateBlockInCell(selectedCell.row, selectedCell.col, block.id, {
                                videoUrl: e.target.value,
                              })
                            }
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="h-7 text-xs font-mono"
                          />
                          {block.videoUrl && (
                            <VideoBlock videoUrl={block.videoUrl} caption={block.mediaAlt} />
                          )}
                        </div>
                      )}

                      {/* EMBED_HTML Block */}
                      {block.type === "EMBED_HTML" && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-[10px] font-mono text-muted-foreground">
                              Embed / HTML Code
                            </label>
                            <div className="flex items-center gap-1.5">
                              <select
                                value={block.embedAspectRatio || "16:9"}
                                onChange={(e) =>
                                  updateBlockInCell(selectedCell.row, selectedCell.col, block.id, {
                                    embedAspectRatio: e.target.value as EmbedAspectRatio,
                                  })
                                }
                                className="text-[10px] py-0.5 px-1 rounded border border-border bg-background text-foreground"
                              >
                                <option value="16:9">16:9</option>
                                <option value="4:3">4:3</option>
                                <option value="1:1">1:1</option>
                                <option value="auto">Natural</option>
                              </select>
                              <select
                                value={block.embedSandboxMode || "sandboxed"}
                                onChange={(e) =>
                                  updateBlockInCell(selectedCell.row, selectedCell.col, block.id, {
                                    embedSandboxMode: e.target.value as EmbedSandboxMode,
                                  })
                                }
                                className="text-[10px] py-0.5 px-1 rounded border border-border bg-background text-foreground"
                              >
                                <option value="sandboxed">Sandboxed</option>
                                <option value="unconstrained">Unconstrained</option>
                              </select>
                            </div>
                          </div>
                          <textarea
                            rows={3}
                            value={block.embedHtml || ""}
                            onChange={(e) =>
                              updateBlockInCell(selectedCell.row, selectedCell.col, block.id, {
                                embedHtml: e.target.value,
                              })
                            }
                            placeholder='Paste <iframe src="..."> or widget snippet...'
                            className="w-full text-xs p-2 rounded border border-border bg-slate-950 text-emerald-300 font-mono"
                          />
                          {block.embedHtml && (
                            <EmbedBlock
                              embedHtml={block.embedHtml}
                              caption={block.embedCaption}
                              aspectRatio={block.embedAspectRatio || "16:9"}
                              sandboxMode={block.embedSandboxMode || "sandboxed"}
                            />
                          )}
                        </div>
                      )}

                      {/* AUDIO Block */}
                      {block.type === "AUDIO" && (
                        <div className="space-y-1.5">
                          <Input
                            value={block.audioTitle || ""}
                            onChange={(e) =>
                              updateBlockInCell(selectedCell.row, selectedCell.col, block.id, {
                                audioTitle: e.target.value,
                              })
                            }
                            placeholder="Carnatic Recital / Composition Title"
                            className="h-7 text-xs font-serif"
                          />
                          <Input
                            value={block.audioUrl || ""}
                            onChange={(e) =>
                              updateBlockInCell(selectedCell.row, selectedCell.col, block.id, {
                                audioUrl: e.target.value,
                              })
                            }
                            placeholder="Audio URL (.mp3, .wav)"
                            className="h-7 text-xs"
                          />
                        </div>
                      )}

                      {/* DIVIDER Block */}
                      {block.type === "DIVIDER" && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground">Style:</span>
                          <Select
                            value={block.dividerStyle || "gold-leaf"}
                            onValueChange={(val: "gold-leaf" | "lotus" | "line" | "temple") =>
                              updateBlockInCell(selectedCell.row, selectedCell.col, block.id, {
                                dividerStyle: val,
                              })
                            }
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gold-leaf">22k Gold Leaf Filigree</SelectItem>
                              <SelectItem value="lotus">Sacred Lotus Emblem</SelectItem>
                              <SelectItem value="temple">Temple Gopuram Motif</SelectItem>
                              <SelectItem value="line">Minimal Gold Rule</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* BUTTON Block */}
                      {block.type === "BUTTON" && (
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={block.buttonText || ""}
                            onChange={(e) =>
                              updateBlockInCell(selectedCell.row, selectedCell.col, block.id, {
                                buttonText: e.target.value,
                              })
                            }
                            placeholder="Button Text"
                            className="h-7 text-xs"
                          />
                          <Input
                            value={block.buttonUrl || ""}
                            onChange={(e) =>
                              updateBlockInCell(selectedCell.row, selectedCell.col, block.id, {
                                buttonUrl: e.target.value,
                              })
                            }
                            placeholder="URL (/gallery)"
                            className="h-7 text-xs"
                          />
                        </div>
                      )}

                      {/* PDF VIEWER Block */}
                      {block.type === "PDF_VIEWER" && (
                        <div className="space-y-1.5">
                          <Input
                            value={block.fileUrl || block.pdfUrl || ""}
                            onChange={(e) =>
                              updateBlockInCell(selectedCell.row, selectedCell.col, block.id, {
                                fileUrl: e.target.value,
                                pdfUrl: e.target.value,
                              })
                            }
                            placeholder="PDF URL (/catalogs/tanjore.pdf)"
                            className="h-7 text-xs"
                          />
                          <Input
                            value={block.title || block.pdfTitle || ""}
                            onChange={(e) =>
                              updateBlockInCell(selectedCell.row, selectedCell.col, block.id, {
                                title: e.target.value,
                                pdfTitle: e.target.value,
                              })
                            }
                            placeholder="Catalog Monograph Title"
                            className="h-7 text-xs font-serif"
                          />
                        </div>
                      )}

                      {/* ARTIST TIMELINE Block */}
                      {block.type === "ARTIST_TIMELINE" && (
                        <div className="space-y-2">
                          <div className="p-2 rounded bg-muted/30 flex items-center justify-between">
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {(block.timelineItems || []).length} Milestones • {block.timelineLayout || "alternating"}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTimelineEditingCell({
                                  row: selectedCell.row,
                                  col: selectedCell.col,
                                  blockId: block.id,
                                });
                                setTimelineModalOpen(true);
                              }}
                              className="h-6 text-[10px] gap-1 text-primary border-primary/30"
                            >
                              <Sliders className="w-3 h-3" /> Edit Timeline
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* FORM BLOCK */}
                      {block.type === "FORM_BLOCK" && (
                        <div className="space-y-2">
                          <div className="p-2 rounded bg-muted/30 flex items-center justify-between">
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {(block.fields || []).length} Form Fields • {block.formTitle || "Inquiry Form"}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFormEditingCell({
                                  row: selectedCell.row,
                                  col: selectedCell.col,
                                  blockId: block.id,
                                });
                                setFormModalOpen(true);
                              }}
                              className="h-6 text-[10px] gap-1 text-primary border-primary/30"
                            >
                              <Sliders className="w-3 h-3" /> Edit Form
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* BLOG GRID */}
                      {block.type === "BLOG_GRID" && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground">Max Articles:</span>
                          <Input
                            type="number"
                            min={1}
                            max={12}
                            value={block.blogLimit || 4}
                            onChange={(e) =>
                              updateBlockInCell(selectedCell.row, selectedCell.col, block.id, {
                                blogLimit: parseInt(e.target.value, 10) || 4,
                              })
                            }
                            className="h-7 w-20 text-xs font-mono"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 2: CELL CONTENT EDITORS LIST */}
        <TabsContent value="cells" className="space-y-4 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {segments.map((cell) => {
              const cellKey = `${cell.row}-${cell.col}`;
              return (
                <div
                  key={cell.id || cellKey}
                  className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-primary/20 text-primary font-mono font-bold text-xs flex items-center justify-center">
                        {cell.row},{cell.col}
                      </span>
                      <Input
                        value={cell.title || ""}
                        onChange={(e) => updateCell(cell.row, cell.col, { title: e.target.value })}
                        placeholder={`Cell (${cell.row}, ${cell.col}) Title`}
                        className="h-7 text-xs font-serif font-bold w-48"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCellKey(cellKey);
                        setActiveViewTab("canvas");
                      }}
                      className="text-xs h-7 gap-1 text-primary"
                    >
                      <Maximize2 className="w-3 h-3" /> Focus in Canvas
                    </Button>
                  </div>

                  {/* Cell Blocks */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {(cell.blocks || []).map((block, bIdx) => (
                      <div key={block.id} className="p-2 rounded border border-border/50 bg-muted/20 text-xs">
                        <div className="flex items-center justify-between pb-1 font-mono text-[10px] text-primary font-semibold">
                          <span>#{bIdx + 1} {block.type}</span>
                          <button
                            type="button"
                            onClick={() => removeBlockFromCell(cell.row, cell.col, block.id)}
                            className="text-destructive hover:opacity-80"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {block.type === "TEXT" && (
                          <TiptapEditor
                            contrast={
                              cell.bgConfig?.backgroundColor
                                ? resolveContainerContrast({ backgroundColor: cell.bgConfig.backgroundColor })
                                : baseContrast
                            }
                            content={block.content}
                            onChange={(json) => updateBlockInCell(cell.row, cell.col, block.id, { content: json })}
                          />
                        )}
                        {block.type === "IMAGE" && (
                          <Input
                            value={block.mediaUrl || ""}
                            onChange={(e) =>
                              updateBlockInCell(cell.row, cell.col, block.id, { mediaUrl: e.target.value })
                            }
                            placeholder="Image URL"
                            className="h-7 text-xs"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlockToCell(cell.row, cell.col, "TEXT")}
                      className="h-6 text-[10px] px-2"
                    >
                      + Text
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlockToCell(cell.row, cell.col, "IMAGE")}
                      className="h-6 text-[10px] px-2"
                    >
                      + Image
                    </Button>
                    <Button
                      type="button"
                      className="h-6 text-[10px] px-2 gap-1"
                    >
                      <ImageIcon className="w-2.5 h-2.5" /> Image
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBlockToCell(cell.row, cell.col, "VIDEO")}
                      className="h-6 text-[10px] px-2 gap-1"
                    >
                      <Video className="w-2.5 h-2.5" /> Video
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 3: Header & Footers Inspector */}
        <TabsContent value="headers-footers" className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Running Header */}
            <div className="p-4 rounded-xl border border-border/70 bg-card/50 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-border/50">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                  <Heading className="w-3.5 h-3.5" /> Section Running Header
                </span>
                <input
                  type="checkbox"
                  checked={hasHeader}
                  onChange={(e) => onChange({ hasHeader: e.target.checked })}
                  className="rounded border-border text-primary h-4 w-4"
                />
              </div>
              <TiptapEditor
                contrast={baseContrast}
                content={headerHtml ? { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: headerHtml.replace(/<[^>]+>/g, "") }] }] } : undefined}
                onChange={(json) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const text = (json?.content as any)?.[0]?.content?.[0]?.text || "";
                  onChange({ headerHtml: `<p>${text}</p>` });
                }}
              />
            </div>

            {/* Vertical Spine */}
            <div className="p-4 rounded-xl border border-border/70 bg-card/50 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-border/50">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <PanelLeft className="w-3.5 h-3.5" /> Vertical Sidebar Spine
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">{verticalSpineMode}</span>
              </div>
              <TiptapEditor
                contrast={baseContrast}
                content={verticalSpineHtml ? { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: verticalSpineHtml.replace(/<[^>]+>/g, "") }] }] } : undefined}
                onChange={(json) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const text = (json?.content as any)?.[0]?.content?.[0]?.text || "";
                  onChange({ verticalSpineHtml: `<p>${text}</p>` });
                }}
              />
            </div>

            {/* Running Footer */}
            <div className="p-4 rounded-xl border border-border/70 bg-card/50 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-border/50">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                  <Footprints className="w-3.5 h-3.5" /> Section Running Footer
                </span>
                <input
                  type="checkbox"
                  checked={hasFooter}
                  onChange={(e) => onChange({ hasFooter: e.target.checked })}
                  className="rounded border-border text-primary h-4 w-4"
                />
              </div>
              <TiptapEditor
                contrast={baseContrast}
                content={footerHtml ? { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: footerHtml.replace(/<[^>]+>/g, "") }] }] } : undefined}
                onChange={(json) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const text = (json?.content as any)?.[0]?.content?.[0]?.text || "";
                  onChange({ footerHtml: `<p>${text}</p>` });
                }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Template Modal */}
      <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Page Section Template</DialogTitle>
            <DialogDescription>
              Save this {matrixRows}×{matrixCols} layout as a reusable Web Page Section template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Template Title</Label>
              <Input
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                placeholder="e.g. Masterwork Hero with Left Spine"
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description (Optional)</Label>
              <Input
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                placeholder="e.g. Asymmetric 70:30 split with devotional audio & catalog download"
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSaveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveTemplate}
              disabled={isSavingTemplate || !templateTitle.trim()}
              className="gap-1.5"
            >
              {isSavingTemplate && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Template Modal */}
      <Dialog open={loadModalOpen} onOpenChange={setLoadModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Web Page Section Template</DialogTitle>
            <DialogDescription>
              Choose from pre-configured InDesign-grade section grids or previously saved templates.
            </DialogDescription>
          </DialogHeader>

          {loadingTemplates ? (
            <div className="py-12 flex items-center justify-center text-muted-foreground text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading section templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No saved section templates found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 max-h-[60vh] overflow-y-auto pr-1">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className="p-3.5 rounded-xl border border-border hover:border-primary/70 bg-card hover:bg-accent/40 cursor-pointer transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-xs text-foreground line-clamp-1">
                      {tpl.title}
                    </h4>
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                      {tpl.matrixRows}×{tpl.matrixCols}
                    </Badge>
                  </div>
                  {tpl.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {tpl.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                    <span>{tpl.verticalSpineMode !== "NONE" ? `Spine: ${tpl.verticalSpineMode}` : "No Spine"}</span>
                    {tpl.hasHeader && <span>• Header</span>}
                    {tpl.hasFooter && <span>• Footer</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Media Gallery Inspector Modal */}
      {galleryEditingCell && (
        <Dialog
          open={galleryModalOpen}
          onOpenChange={(open: boolean) => {
            setGalleryModalOpen(open);
            if (!open) setGalleryEditingCell(null);
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-primary flex items-center gap-2">
                <Images className="w-5 h-5" /> Configure Media Gallery (Carousel, Scroll, Collage)
              </DialogTitle>
              <DialogDescription>
                Select presentation mode, autoplay timing, aspect ratio, frame styling, and media items with links.
              </DialogDescription>
            </DialogHeader>

            <MediaGalleryInspector
              data={{
                displayMode: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryDisplayMode,
                autoplayTimer: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryAutoplayTimer,
                aspectRatio: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryAspectRatio,
                frameStyle: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryFrameStyle,
                kenBurnsOverlayTheme: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryKenBurnsOverlayTheme,
                overlayTitleColor: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryOverlayTitleColor,
                overlayTextColor: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryOverlayTextColor,
                canvasBgColor: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryCanvasBgColor,
                borderFilletColor: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryBorderFilletColor,
                borderWidth: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryBorderWidth,
                framePadding: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryFramePadding,
                showCaptionRibbon: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryShowCaptionRibbon,
                environmentId: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryEnvironmentId,
                customWallUrl: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryCustomWallUrl,
                wallBackgroundMode: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryWallBackgroundMode,
                wallCustomBackgrounds: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryWallCustomBackgrounds,
                canvasBgImageUrl: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryCanvasBgImageUrl,
                canvasBgMode: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryCanvasBgMode,
                canvasBgOpacity: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryCanvasBgOpacity,
                cameraTourStyle: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryCameraTourStyle,
                wallLayout: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryWallLayout,
                autoplayTour: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryAutoplayTour,
                showFrameHeader: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryShowFrameHeader,
                frameHeaderBg: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryFrameHeaderBg,
                frameHeaderTextColor: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryFrameHeaderTextColor,
                items: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryItems,
                maxArtworksPerWall: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryMaxArtworksPerWall,
                overviewWallDwell: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryOverviewWallDwell,
                overviewDwellSeconds: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryOverviewWallDwell,
                showMetadataCardBelowWall: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryShowMetadataCardBelowWall,
                wallConfigs: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryWallConfigs,
                cameraTransitionStyle: selectedCell?.blocks?.find((b) => b.id === galleryEditingCell.blockId)?.galleryCameraTransitionStyle,
              }}
              onChange={(updated) => {
                updateBlockInCell(
                  galleryEditingCell.row,
                  galleryEditingCell.col,
                  galleryEditingCell.blockId,
                  {
                    galleryItems: updated.items,
                    galleryDisplayMode: updated.displayMode,
                    galleryAutoplayTimer: updated.autoplayTimer,
                    galleryAspectRatio: updated.aspectRatio,
                    galleryFrameStyle: updated.frameStyle,
                    galleryKenBurnsOverlayTheme: updated.kenBurnsOverlayTheme,
                    galleryOverlayTitleColor: updated.overlayTitleColor,
                    galleryOverlayTextColor: updated.overlayTextColor,
                    galleryCanvasBgColor: updated.canvasBgColor,
                    galleryCanvasBgImageUrl: updated.canvasBgImageUrl,
                    galleryCanvasBgMode: updated.canvasBgMode,
                    galleryCanvasBgOpacity: updated.canvasBgOpacity,
                    galleryBorderFilletColor: updated.borderFilletColor,
                    galleryBorderWidth: updated.borderWidth,
                    galleryFramePadding: updated.framePadding,
                    galleryShowCaptionRibbon: updated.showCaptionRibbon,
                    galleryEnvironmentId: updated.environmentId,
                    galleryCustomWallUrl: updated.customWallUrl,
                    galleryWallBackgroundMode: updated.wallBackgroundMode,
                    galleryWallCustomBackgrounds: updated.wallCustomBackgrounds,
                    galleryCameraTourStyle: updated.cameraTourStyle,
                    galleryCameraTransitionStyle: updated.cameraTransitionStyle,
                    galleryWallLayout: updated.wallLayout,
                    galleryAutoplayTour: updated.autoplayTour,
                    galleryShowFrameHeader: updated.showFrameHeader,
                    galleryFrameHeaderBg: updated.frameHeaderBg,
                    galleryFrameHeaderTextColor: updated.frameHeaderTextColor,
                    galleryMaxArtworksPerWall: updated.maxArtworksPerWall,
                    galleryOverviewWallDwell: updated.overviewWallDwell ?? updated.overviewDwellSeconds,
                    galleryShowMetadataCardBelowWall: updated.showMetadataCardBelowWall,
                    galleryWallConfigs: updated.wallConfigs,
                  }
                );
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Timeline Inspector Modal */}
      {timelineEditingCell && (
        <Dialog
          open={timelineModalOpen}
          onOpenChange={(open: boolean) => {
            setTimelineModalOpen(open);
            if (!open) setTimelineEditingCell(null);
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-primary flex items-center gap-2">
                <History className="w-5 h-5" /> Configure Artist Heritage Milestones
              </DialogTitle>
              <DialogDescription>
                Add, reorder, or edit milestone achievements, exhibitions, and recognitions for this timeline block.
              </DialogDescription>
            </DialogHeader>

            <TimelineInspector
              items={
                selectedCell?.blocks?.find((b) => b.id === timelineEditingCell.blockId)
                  ?.timelineItems || []
              }
              layout={
                selectedCell?.blocks?.find((b) => b.id === timelineEditingCell.blockId)
                  ?.timelineLayout || "alternating"
              }
              granularity={
                selectedCell?.blocks?.find((b) => b.id === timelineEditingCell.blockId)
                  ?.timelineGranularity || "YEAR"
              }
              sortDirection={
                selectedCell?.blocks?.find((b) => b.id === timelineEditingCell.blockId)
                  ?.timelineSortDirection || "desc"
              }
              title={
                selectedCell?.blocks?.find((b) => b.id === timelineEditingCell.blockId)?.title ||
                "Artistic Journey & Honors"
              }
              subtitle={
                selectedCell?.blocks?.find((b) => b.id === timelineEditingCell.blockId)?.subtitle || ""
              }
              onChange={(data) => {
                updateBlockInCell(
                  timelineEditingCell.row,
                  timelineEditingCell.col,
                  timelineEditingCell.blockId,
                  {
                    timelineItems: data.items,
                    timelineLayout: data.layout,
                    timelineGranularity: data.granularity,
                    timelineSortDirection: data.sortDirection,
                    title: data.title,
                    subtitle: data.subtitle,
                  }
                );
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Form Block Inspector Modal */}
      {formEditingCell && (
        <Dialog
          open={formModalOpen}
          onOpenChange={(open: boolean) => {
            setFormModalOpen(open);
            if (!open) setFormEditingCell(null);
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-primary flex items-center gap-2">
                <Send className="w-5 h-5" /> Configure Interactive Dynamic Form Block
              </DialogTitle>
              <DialogDescription>
                Customize form fields, input types, notification recipients, and confirmation response.
              </DialogDescription>
            </DialogHeader>

            <FormBlockInspector
              data={{
                formTitle: selectedCell?.blocks?.find((b) => b.id === formEditingCell.blockId)?.formTitle,
                formSubtitle: selectedCell?.blocks?.find((b) => b.id === formEditingCell.blockId)?.formSubtitle,
                submitButtonText: selectedCell?.blocks?.find((b) => b.id === formEditingCell.blockId)?.submitButtonText,
                successMessage: selectedCell?.blocks?.find((b) => b.id === formEditingCell.blockId)?.successMessage,
                notifyEmail: selectedCell?.blocks?.find((b) => b.id === formEditingCell.blockId)?.notifyEmail,
                recipientEmails: selectedCell?.blocks?.find((b) => b.id === formEditingCell.blockId)?.recipientEmails,
                emailSubjectTemplate: selectedCell?.blocks?.find((b) => b.id === formEditingCell.blockId)?.emailSubjectTemplate,
                fields: selectedCell?.blocks?.find((b) => b.id === formEditingCell.blockId)?.fields,
                formConfig: selectedCell?.blocks?.find((b) => b.id === formEditingCell.blockId)?.formConfig,
              }}
              onChange={(data) => {
                updateBlockInCell(
                  formEditingCell.row,
                  formEditingCell.col,
                  formEditingCell.blockId,
                  data
                );
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
