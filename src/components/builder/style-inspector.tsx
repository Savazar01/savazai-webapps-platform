"use client";

import * as React from "react";
import {
  Paintbrush,
  Type,
  LayoutGrid,
  Maximize,
  Sliders,
  Image as ImageIcon,
  Video,
  Music,
  Sparkles,
  UploadCloud,
  Heart,
  Sun,
  Flame,
  Crown,
  BookOpen,
  Award,
  Compass,
  Shield,
  Volume2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { BACKGROUND_PATTERNS } from "@/lib/background-patterns";
import { optimizeImageForWebpUpload } from "@/lib/client-image-optimizer";

export interface SectionStyle {
  // Section Headings & Curatorial Meta
  title?: string;
  subtitle?: string;
  description?: string;
  titleAlignment?: "left" | "center" | "right";
  // Background Mode & Styling
  backgroundType?: "COLOR" | "PATTERN" | "IMAGE";
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundPattern?: string;
  backgroundImage?: string;
  backgroundImageUrl?: string;
  backgroundOverlayOpacity?: number;
  backgroundSize?: "cover" | "contain";
  backgroundPosition?: string;
  fontFamily?: string;
  fontSize?: string;
  textColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
  gridSpan?: number;
  // Rich Column Media Block
  mediaType?: "NONE" | "IMAGE" | "VIDEO" | "ICON" | "AUDIO_PLAYER";
  mediaUrl?: string;
  mediaAlt?: string;
  mediaAspectRatio?: string;
  mediaBorderRadius?: string;
  iconName?: string;
  iconSize?: number;
  iconColor?: string;
  audioTitle?: string;
  audioUrl?: string;
  videoUrl?: string;
  // Artistic Accents & Fine Art Framing
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: "solid" | "double" | "inset" | "dashed" | "none";
  borderRadius?: "none" | "rounded-md" | "rounded-2xl" | "rounded-t-full";
  boxShadow?: "none" | "soft" | "gold-glow";
  ornamentalFrame?: boolean;
}

export interface StyleInspectorProps {
  style: SectionStyle;
  onChange: (updated: SectionStyle) => void;
  isSubSection?: boolean;
}

const colorPresets = [
  { name: "Parchment", hex: "#FAF7F2" },
  { name: "Obsidian", hex: "#0D0E12" },
  { name: "Raw Silk", hex: "#F3EBDD" },
  { name: "Antique Gold", hex: "#D4AF37" },
  { name: "Madder Terracotta", hex: "#A3281E" },
  { name: "Deep Teak", hex: "#1E1B18" },
  { name: "Pure White", hex: "#FFFFFF" },
  { name: "Charcoal", hex: "#1A1A1A" },
];

const artisticBorderPresets = [
  { name: "None", hex: "transparent" },
  { name: "Antique Gold", hex: "#D4AF37" },
  { name: "Temple Terracotta", hex: "#A3281E" },
  { name: "Raw Silk Ivory", hex: "#E8DFD1" },
  { name: "Subtle Charcoal", hex: "#2A2622" },
];

const fontFamilies = [
  { label: "Playfair Display (Classical Serif)", value: "'Playfair Display', serif" },
  { label: "Cormorant Garamond (Fine Art Serif)", value: "'Cormorant Garamond', serif" },
  { label: "Cinzel (Royal Header)", value: "'Cinzel', serif" },
  { label: "Inter (Clean Modern)", value: "'Inter', sans-serif" },
  { label: "Outfit (Heritage Sans)", value: "'Outfit', sans-serif" },
];

const availableIcons = [
  { label: "Sparkles (Sacred Aura)", value: "Sparkles", Icon: Sparkles },
  { label: "Music (Carnatic Swaras)", value: "Music", Icon: Music },
  { label: "Palette (Traditional Arts)", value: "Palette", Icon: Paintbrush },
  { label: "Sun (Surya Bhagavan)", value: "Sun", Icon: Sun },
  { label: "Flame (Deepam)", value: "Flame", Icon: Flame },
  { label: "Crown (Divine Regalia)", value: "Crown", Icon: Crown },
  { label: "Book Open (Shastras & Vedas)", value: "BookOpen", Icon: BookOpen },
  { label: "Award (Masterwork Provenance)", value: "Award", Icon: Award },
  { label: "Shield (Watermarked Vault)", value: "Shield", Icon: Shield },
  { label: "Heart (Devotion & Bhakti)", value: "Heart", Icon: Heart },
  { label: "Compass (Orientation)", value: "Compass", Icon: Compass },
];

export function StyleInspector({
  style,
  onChange,
  isSubSection = false,
}: StyleInspectorProps) {
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [uploadingBgImage, setUploadingBgImage] = React.useState(false);

  const update = (key: keyof SectionStyle, value: unknown) => {
    onChange({
      ...style,
      [key]: value,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    const file = await optimizeImageForWebpUpload(rawFile);
    setUploadingImage(true);
    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const imgUrl =
        data.watermarkedUrl ||
        data.publicUrl ||
        data.primaryImageUrl ||
        data.rawUrl;
      update("mediaUrl", imgUrl);
      toast.success("Media uploaded successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Media upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    const file = await optimizeImageForWebpUpload(rawFile);
    setUploadingBgImage(true);
    const body = new FormData();
    body.append("file", file);
    body.append("mediaType", "general");
    body.append("isArtwork", "false");

    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const imgUrl =
        data.publicUrl ||
        data.watermarkedUrl ||
        data.primaryImageUrl ||
        data.rawUrl;
      onChange({
        ...style,
        backgroundType: "IMAGE",
        backgroundImage: imgUrl,
        backgroundImageUrl: imgUrl,
      });
      toast.success("Background image uploaded successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingBgImage(false);
    }
  };


  return (
    <aside className="w-80 border-l border-slate-300 dark:border-slate-800 bg-white dark:bg-[#151B26] p-4 overflow-y-auto max-h-screen text-xs space-y-5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-slate-100">
          <Sliders className="w-4 h-4 text-slate-800 dark:text-slate-200" />
          <span>{isSubSection ? "Column Inspector" : "Section Inspector"}</span>
        </div>
      </div>

      {/* Section Headings & Curatorial Meta (When at Section level) */}
      {!isSubSection && (
        <div className="space-y-3.5 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <label className="text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-primary" />
            Section Header & Narrative
          </label>

          {/* Section Eyebrow / Subtitle */}
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Eyebrow / Subtitle</label>
            <Input
              value={style.subtitle || ""}
              onChange={(e) => update("subtitle", e.target.value)}
              placeholder="e.g. CURATORIAL RETROSPECTIVE"
              className="text-xs font-mono uppercase"
            />
          </div>

          {/* Section Title */}
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Section Title</label>
            <Input
              value={style.title || ""}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Divine Iconography & Tanjore Plates"
              className="text-xs font-serif font-semibold"
            />
          </div>

          {/* Curatorial Description / Narrative */}
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Curatorial Description / Narrative</label>
            <textarea
              value={style.description || ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Contextual narrative or curatorial overview rendered above the section grid..."
              rows={3}
              className="w-full text-xs rounded-md border border-input bg-transparent px-3 py-2 text-foreground shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
            />
          </div>

          {/* Title Alignment */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] text-muted-foreground font-medium">Header Alignment</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md border border-border">
              <button
                type="button"
                onClick={() => update("titleAlignment", "left")}
                className={cn(
                  "flex items-center justify-center gap-1 py-1 rounded text-xs font-medium cursor-pointer transition-colors",
                  (style.titleAlignment || "center") === "left"
                    ? "bg-white dark:bg-slate-700 text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Left</span>
              </button>
              <button
                type="button"
                onClick={() => update("titleAlignment", "center")}
                className={cn(
                  "flex items-center justify-center gap-1 py-1 rounded text-xs font-medium cursor-pointer transition-colors",
                  (style.titleAlignment || "center") === "center"
                    ? "bg-white dark:bg-slate-700 text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <AlignCenter className="w-3.5 h-3.5" />
                <span>Center</span>
              </button>
              <button
                type="button"
                onClick={() => update("titleAlignment", "right")}
                className={cn(
                  "flex items-center justify-center gap-1 py-1 rounded text-xs font-medium cursor-pointer transition-colors",
                  style.titleAlignment === "right"
                    ? "bg-white dark:bg-slate-700 text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <AlignRight className="w-3.5 h-3.5" />
                <span>Right</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid Span (if Column/SubSection) */}
      {isSubSection && (
        <div className="space-y-2">
          <label className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5 text-primary" />
            Column Span (1 - 12)
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="range"
              min={1}
              max={12}
              value={style.gridSpan || 12}
              onChange={(e) => update("gridSpan", parseInt(e.target.value))}
              className="flex-1 cursor-pointer"
            />
            <span className="font-mono font-bold text-foreground text-sm w-8 text-center">
              {style.gridSpan || 12}/12
            </span>
          </div>
        </div>
      )}

      {/* Column Media Block (When in SubSection) */}
      {isSubSection && (
        <div className="space-y-3 p-3 rounded-lg bg-muted/40 border border-border">
          <label className="font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-primary" /> Rich Media Block
            </span>
            <span className="text-[10px] text-muted-foreground font-normal">Per Column</span>
          </label>

          {/* Media Type Selector */}
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Block Type</label>
            <Select
              value={style.mediaType || "NONE"}
              onValueChange={(val) => update("mediaType", val)}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None (Inline Text Only)</SelectItem>
                <SelectItem value="IMAGE">Image Showcase</SelectItem>
                <SelectItem value="VIDEO">Video Embed / Player</SelectItem>
                <SelectItem value="ICON">Devotional Icon</SelectItem>
                <SelectItem value="AUDIO_PLAYER">Classical Audio Snippet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* IMAGE Block Controls */}
          {style.mediaType === "IMAGE" && (
            <div className="space-y-2.5 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
                  <span>Image URL</span>
                  <label className="cursor-pointer text-[10px] text-primary hover:underline flex items-center gap-1">
                    <UploadCloud className="w-3 h-3" />
                    {uploadingImage ? "Uploading..." : "Upload File"}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/tiff,image/heic,image/heif,image/heic-sequence,.heic,.heics"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </label>
                <Input
                  value={style.mediaUrl || ""}
                  onChange={(e) => update("mediaUrl", e.target.value)}
                  placeholder="https://..."
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-medium">Aspect Ratio</label>
                <Select
                  value={style.mediaAspectRatio || "auto"}
                  onValueChange={(val) => update("mediaAspectRatio", val)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Original / Auto</SelectItem>
                    <SelectItem value="1:1">1:1 Square (Miniatures & Deities)</SelectItem>
                    <SelectItem value="16:9">16:9 Landscape (Gallery Murals)</SelectItem>
                    <SelectItem value="3:4">3:4 Portrait (Traditional Tanjore)</SelectItem>
                    <SelectItem value="4:3">4:3 Classic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-medium">Border Radius</label>
                <Select
                  value={style.mediaBorderRadius || "rounded-lg"}
                  onValueChange={(val) => update("mediaBorderRadius", val)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rounded-none">Sharp / Framed (0px)</SelectItem>
                    <SelectItem value="rounded-md">Subtle (6px)</SelectItem>
                    <SelectItem value="rounded-lg">Modern (8px)</SelectItem>
                    <SelectItem value="rounded-2xl">High Elegance (16px)</SelectItem>
                    <SelectItem value="rounded-full">Circular (Avatar/Medallion)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-medium">Alt Text / Accessibility</label>
                <Input
                  value={style.mediaAlt || ""}
                  onChange={(e) => update("mediaAlt", e.target.value)}
                  placeholder="Artwork description for screen readers..."
                  className="text-xs"
                />
              </div>
            </div>
          )}

          {/* VIDEO Block Controls */}
          {style.mediaType === "VIDEO" && (
            <div className="space-y-2 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <Video className="w-3 h-3 text-primary" /> Video URL (MP4, YouTube, Vimeo)
                </label>
                <Input
                  value={style.videoUrl || ""}
                  onChange={(e) => update("videoUrl", e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or .mp4"
                  className="text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* ICON Block Controls */}
          {style.mediaType === "ICON" && (
            <div className="space-y-2.5 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-medium">Select Icon</label>
                <Select
                  value={style.iconName || "Sparkles"}
                  onValueChange={(val) => update("iconName", val)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIcons.map((ic) => {
                      const CurrentIcon = ic.Icon;
                      return (
                        <SelectItem key={ic.value} value={ic.value}>
                          <span className="flex items-center gap-2">
                            <CurrentIcon className="w-3.5 h-3.5 text-primary" />
                            {ic.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Icon Size</span>
                  <span className="font-mono text-primary">{style.iconSize || 36}px</span>
                </div>
                <Input
                  type="range"
                  min={20}
                  max={72}
                  step={4}
                  value={style.iconSize || 36}
                  onChange={(e) => update("iconSize", parseInt(e.target.value))}
                  className="cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-medium">Icon Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.iconColor || "#D4AF37"}
                    onChange={(e) => update("iconColor", e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                  />
                  <Input
                    value={style.iconColor || "#D4AF37"}
                    onChange={(e) => update("iconColor", e.target.value)}
                    className="text-xs font-mono flex-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* AUDIO PLAYER Block Controls */}
          {style.mediaType === "AUDIO_PLAYER" && (
            <div className="space-y-2 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <Music className="w-3 h-3 text-primary" /> Recital / Audio Title
                </label>
                <Input
                  value={style.audioTitle || ""}
                  onChange={(e) => update("audioTitle", e.target.value)}
                  placeholder="e.g. Endaro Mahanubhavulu (Raga Sri)"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-primary" /> Audio Stream URL (.mp3 / .wav)
                </label>
                <Input
                  value={style.audioUrl || ""}
                  onChange={(e) => update("audioUrl", e.target.value)}
                  placeholder="https://media.savazar.com/audio/..."
                  className="text-xs font-mono"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Background Section with Three-Mode Switcher */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
            <Paintbrush className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
            Background Mode
          </label>
          <div className="flex rounded-md bg-slate-100 dark:bg-slate-800 p-0.5 border border-border">
            <button
              type="button"
              onClick={() => update("backgroundType", "COLOR")}
              className={cn(
                "px-2.5 py-1 text-xs rounded transition-all cursor-pointer font-semibold",
                (style.backgroundType || "COLOR") === "COLOR"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              Color
            </button>
            <button
              type="button"
              onClick={() => update("backgroundType", "PATTERN")}
              className={cn(
                "px-2.5 py-1 text-xs rounded transition-all cursor-pointer font-semibold",
                style.backgroundType === "PATTERN"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              Patterns
            </button>
            <button
              type="button"
              onClick={() => update("backgroundType", "IMAGE")}
              className={cn(
                "px-2.5 py-1 text-xs rounded transition-all cursor-pointer font-semibold",
                style.backgroundType === "IMAGE"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              Image
            </button>
          </div>
        </div>

        {/* Mode 1: Solid & Gradient Color */}
        {(style.backgroundType || "COLOR") === "COLOR" && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => update("backgroundColor", preset.hex)}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <div
                    className={cn(
                      "w-full h-7 rounded border transition-all",
                      style.backgroundColor === preset.hex
                        ? "ring-2 ring-primary ring-offset-1 border-transparent"
                        : "border-border/60 hover:scale-105"
                    )}
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center group-hover:text-foreground">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <label className="text-[11px] text-muted-foreground font-medium">Hex Color:</label>
              <div className="flex-1 flex items-center gap-1">
                <input
                  type="color"
                  value={style.backgroundColor || "#FAF7F2"}
                  onChange={(e) => update("backgroundColor", e.target.value)}
                  className="w-7 h-7 rounded border border-border cursor-pointer bg-transparent"
                />
                <Input
                  value={style.backgroundColor || ""}
                  onChange={(e) => update("backgroundColor", e.target.value)}
                  placeholder="#FFFFFF"
                  className="font-mono text-xs h-7 uppercase"
                />
              </div>
            </div>
          </div>
        )}

        {/* Mode 2: Sacred / Heritage Patterns */}
        {style.backgroundType === "PATTERN" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Curated Sacred Motifs:</span>
              <button
                type="button"
                onClick={() => update("backgroundPattern", "")}
                className="text-[10px] text-primary hover:underline cursor-pointer"
              >
                Clear Pattern
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {BACKGROUND_PATTERNS.map((pattern) => {
                const isSelected = style.backgroundPattern === pattern.id;
                return (
                  <div
                    key={pattern.id}
                    onClick={() => {
                      onChange({
                        ...style,
                        backgroundType: "PATTERN",
                        backgroundPattern: pattern.id,
                        backgroundOverlayOpacity: style.backgroundOverlayOpacity ?? 0.2,
                      });
                    }}
                    className={cn(
                      "p-2 rounded-lg border text-left flex flex-col gap-1.5 transition-all cursor-pointer relative overflow-hidden",
                      isSelected
                        ? "border-slate-900 bg-slate-100 ring-1 ring-slate-900 dark:border-slate-100 dark:bg-slate-800 dark:ring-slate-100 shadow-sm"
                        : "border-stone-800 bg-stone-900/60 hover:border-stone-700 hover:bg-muted/30"
                    )}
                  >
                    <div
                      className="w-full h-12 rounded border border-stone-800 relative overflow-hidden bg-[#FAF7F2] dark:bg-[#1E1B18]"
                      style={{
                        backgroundImage: `url("${pattern.svgDataUri}")`,
                        backgroundRepeat: "repeat",
                        backgroundSize: "60px 60px",
                      }}
                    />
                    <span className="font-serif font-bold text-[11px] text-stone-200 truncate">
                      {pattern.name}
                    </span>
                    <span className="text-[9px] text-stone-400 line-clamp-1">
                      {pattern.description}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-border/40">
              <label className="text-[11px] text-muted-foreground font-medium">Base Tint:</label>
              <div className="flex-1 flex items-center gap-1">
                <input
                  type="color"
                  value={style.backgroundColor || "#FAF7F2"}
                  onChange={(e) => update("backgroundColor", e.target.value)}
                  className="w-6 h-6 rounded border border-border cursor-pointer bg-transparent"
                />
                <Input
                  value={style.backgroundColor || ""}
                  onChange={(e) => update("backgroundColor", e.target.value)}
                  placeholder="#FAF7F2"
                  className="font-mono text-[11px] h-6 uppercase"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-stone-300">
                <span>Pattern Opacity</span>
                <span className="font-mono text-primary font-semibold">
                  {Math.round((style.backgroundOverlayOpacity ?? 0.2) * 100)}%
                </span>
              </div>
              <Input
                type="range"
                min={0.05}
                max={1.0}
                step={0.05}
                value={style.backgroundOverlayOpacity ?? 0.2}
                onChange={(e) => update("backgroundOverlayOpacity", parseFloat(e.target.value))}
                className="cursor-pointer h-5"
              />
            </div>
          </div>
        )}

        {/* Mode 3: Background Image Upload */}
        {style.backgroundType === "IMAGE" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
                <span>Image Source</span>
                <label className="cursor-pointer text-[10px] text-primary hover:underline flex items-center gap-1">
                  <UploadCloud className="w-3 h-3" />
                  {uploadingBgImage ? "Uploading..." : "Upload File"}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/tiff,image/heic,image/heif,image/heic-sequence,.heic,.heics"
                    onChange={handleBgImageUpload}
                    className="hidden"
                    disabled={uploadingBgImage}
                  />
                </label>
              </label>
              <Input
                value={style.backgroundImage || style.backgroundImageUrl || ""}
                onChange={(e) => {
                  onChange({
                    ...style,
                    backgroundType: "IMAGE",
                    backgroundImage: e.target.value,
                    backgroundImageUrl: e.target.value,
                  });
                }}
                placeholder="https://media.savazar.com/..."
                className="text-xs font-mono"
              />
            </div>

            {/* Background Size Cover / Contain Toggle */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-muted-foreground">Image Fit</span>
              <div className="flex rounded border border-border/80 p-0.5 bg-muted/30">
                <button
                  type="button"
                  onClick={() => update("backgroundSize", "cover")}
                  className={cn(
                    "px-2 py-0.5 text-[10px] rounded cursor-pointer transition-all",
                    (style.backgroundSize || "cover") === "cover"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Cover
                </button>
                <button
                  type="button"
                  onClick={() => update("backgroundSize", "contain")}
                  className={cn(
                    "px-2 py-0.5 text-[10px] rounded cursor-pointer transition-all",
                    style.backgroundSize === "contain"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Contain
                </button>
              </div>
            </div>

            {(style.backgroundImage || style.backgroundImageUrl) && (
              <div className="relative w-full h-24 rounded border border-stone-800 overflow-hidden shadow-inner group">
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url("${style.backgroundImage || style.backgroundImageUrl}")`,
                    backgroundSize: style.backgroundSize || "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                />
                <div
                  className="absolute inset-0 bg-black pointer-events-none transition-opacity"
                  style={{ opacity: style.backgroundOverlayOpacity ?? 0.5 }}
                />
                <div className="absolute top-1.5 right-1.5 z-10">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      onChange({
                        ...style,
                        backgroundImage: "",
                        backgroundImageUrl: "",
                      });
                    }}
                    className="h-6 text-[10px] px-1.5"
                  >
                    Remove
                  </Button>
                </div>
                <span className="absolute bottom-1.5 left-2 text-[9px] font-mono text-white/90 z-10 bg-black/70 px-1.5 py-0.5 rounded">
                  Overlay: {Math.round((style.backgroundOverlayOpacity ?? 0.5) * 100)}%
                </span>
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-stone-300">
                <span>Dark Scrim / Overlay Opacity</span>
                <span className="font-mono text-primary font-semibold">
                  {Math.round((style.backgroundOverlayOpacity ?? 0.5) * 100)}%
                </span>
              </div>
              <Input
                type="range"
                min={0}
                max={1.0}
                step={0.05}
                value={style.backgroundOverlayOpacity ?? 0.5}
                onChange={(e) => update("backgroundOverlayOpacity", parseFloat(e.target.value))}
                className="cursor-pointer h-5"
              />
              <span className="text-[10px] text-muted-foreground block">
                Controls dark scrim to ensure readability of foreground verses and gold accents.
              </span>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Typography Styling */}
      <div className="space-y-3">
        <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 text-xs">
          <Type className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
          Typography
        </label>

        <div className="space-y-1.5">
          <label className="text-[11px] text-muted-foreground font-medium">Font Family</label>
          <Select
            value={style.fontFamily || "font-serif"}
            onValueChange={(val) => update("fontFamily", val)}
          >
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Base Font Size */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-muted-foreground font-medium">Base Font Size</label>
          <Select
            value={style.fontSize || "default"}
            onValueChange={(val) => update("fontSize", val === "default" ? undefined : val)}
          >
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Proportional</SelectItem>
              <SelectItem value="14px">14px (Compact)</SelectItem>
              <SelectItem value="16px">16px (Standard Body)</SelectItem>
              <SelectItem value="18px">18px (Comfortable)</SelectItem>
              <SelectItem value="20px">20px (Lead Text)</SelectItem>
              <SelectItem value="24px">24px (Large)</SelectItem>
              <SelectItem value="32px">32px (Sub-Heading)</SelectItem>
              <SelectItem value="40px">40px (Display)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Text Color */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] text-muted-foreground font-medium">Text Color</label>
          <div className="flex items-center gap-1.5">
            {[
              { label: "Default", val: undefined },
              { label: "Temple Gold", val: "#D4AF37" },
              { label: "Madder Terracotta", val: "#A3281E" },
              { label: "Deep Charcoal", val: "#1C1814" },
              { label: "Parchment Ivory", val: "#FAF7F2" },
              { label: "Pure White", val: "#FFFFFF" },
            ].map((swatch) => (
              <button
                key={swatch.val || "default"}
                type="button"
                onClick={() => update("textColor", swatch.val)}
                className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                  style.textColor === swatch.val
                    ? "ring-2 ring-primary ring-offset-1"
                    : "hover:scale-110"
                } ${!swatch.val ? "border-dashed border-border bg-transparent" : ""}`}
                style={swatch.val ? { backgroundColor: swatch.val } : undefined}
                title={swatch.label}
              />
            ))}
            <input
              type="color"
              value={style.textColor || "#1C1814"}
              onChange={(e) => update("textColor", e.target.value)}
              className="w-5 h-5 rounded border border-border cursor-pointer bg-transparent"
              title="Custom Hex Color"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Traditional Indian Framing & Artistic Accents */}
      <div className="space-y-3">
        <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
          Fine Art Borders &amp; Accents
        </label>

        {/* Border Color Presets */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-muted-foreground">Border Tone</label>
          <div className="grid grid-cols-5 gap-1.5">
            {artisticBorderPresets.map((b) => (
              <button
                key={b.name}
                type="button"
                onClick={() => {
                  if (b.hex === "transparent" || b.name === "None") {
                    onChange({
                      ...style,
                      borderColor: "transparent",
                      borderWidth: 0,
                    });
                  } else {
                    onChange({
                      ...style,
                      borderColor: b.hex,
                      borderWidth: !style.borderWidth || style.borderWidth === 0 ? 1 : style.borderWidth,
                    });
                  }
                }}
                className={`h-7 rounded border text-[9px] font-semibold flex items-center justify-center transition-all ${
                  (b.hex === "transparent" && (style.borderWidth === 0 || style.borderColor === "transparent")) ||
                  style.borderColor === b.hex
                    ? "border-primary ring-1 ring-primary scale-105"
                    : "border-border/60 hover:border-primary/50"
                }`}
                style={{
                  backgroundColor: b.hex === "transparent" ? "transparent" : b.hex,
                  color: b.hex === "#FFFFFF" || b.hex === "#E8DFD1" || b.hex === "transparent" ? "#000" : "#FFF",
                }}
                title={b.name}
              >
                {b.name.slice(0, 4)}
              </button>
            ))}
          </div>
        </div>

        {/* Border Width & Style */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Border Width</label>
            <Select
              value={String(style.borderWidth ?? 0)}
              onValueChange={(val) => {
                const widthNum = parseInt(val, 10);
                if (widthNum === 0) {
                  onChange({
                    ...style,
                    borderWidth: 0,
                    borderColor: "transparent",
                  });
                } else {
                  onChange({
                    ...style,
                    borderWidth: widthNum,
                    borderColor:
                      style.borderColor && style.borderColor !== "transparent"
                        ? style.borderColor
                        : "#D4AF37",
                  });
                }
              }}
            >
              <SelectTrigger className="text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None (0px)</SelectItem>
                <SelectItem value="1">Thin (1px)</SelectItem>
                <SelectItem value="2">Medium (2px)</SelectItem>
                <SelectItem value="3">Bold (3px)</SelectItem>
                <SelectItem value="4">Heavy (4px)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Border Style</label>
            <Select
              value={style.borderStyle || "solid"}
              onValueChange={(val) => update("borderStyle", val as SectionStyle["borderStyle"])}
            >
              <SelectTrigger className="text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid Leaf</SelectItem>
                <SelectItem value="double">Double Border</SelectItem>
                <SelectItem value="inset">Inset Traditional</SelectItem>
                <SelectItem value="dashed">Dashed Fillet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Corner Radius & Glow */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Corner Radius</label>
            <Select
              value={style.borderRadius || "none"}
              onValueChange={(val) => update("borderRadius", val as SectionStyle["borderRadius"])}
            >
              <SelectTrigger className="text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Square (none)</SelectItem>
                <SelectItem value="rounded-md">Subtle (md)</SelectItem>
                <SelectItem value="rounded-2xl">Elegant (2xl)</SelectItem>
                <SelectItem value="rounded-t-full">Temple Arch (Top)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Glow / Elevation</label>
            <Select
              value={style.boxShadow || "none"}
              onValueChange={(val) => update("boxShadow", val as SectionStyle["boxShadow"])}
            >
              <SelectTrigger className="text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="soft">Soft Shadow</SelectItem>
                <SelectItem value="gold-glow">Temple Gold Glow</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ornamental Frame Fillet Toggle */}
        <div className="flex items-center justify-between pt-1 p-2 rounded bg-muted/30 border border-border/60">
          <div>
            <span className="text-xs font-semibold text-foreground block">Gold Corner Fillets</span>
            <span className="text-[10px] text-muted-foreground">Traditional Indian framing corner accent</span>
          </div>
          <input
            type="checkbox"
            checked={!!style.ornamentalFrame}
            onChange={(e) => update("ornamentalFrame", e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
          />
        </div>
      </div>

      <Separator />

      {/* Spacing & Padding */}
      <div className="space-y-3">
        <label className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Maximize className="w-3.5 h-3.5 text-primary" />
          Section Spacing (Padding)
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Top (px)</label>
            <Input
              type="number"
              min={0}
              max={240}
              step={8}
              value={style.paddingTop ?? 64}
              onChange={(e) => update("paddingTop", parseInt(e.target.value) || 0)}
              className="text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Bottom (px)</label>
            <Input
              type="number"
              min={0}
              max={240}
              step={8}
              value={style.paddingBottom ?? 64}
              onChange={(e) => update("paddingBottom", parseInt(e.target.value) || 0)}
              className="text-xs font-mono"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
