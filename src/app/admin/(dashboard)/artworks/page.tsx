"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Palette,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Sparkles,
  QrCode,
  ExternalLink,
  Edit2,
  Trash2,
  Upload,
  Loader2,
  Download,
  FolderTree,
  RefreshCw,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
  Home,
  UploadCloud,
  FolderOpen,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { UniversalMediaDialog } from "@/components/admin/universal-media-dialog";
import { ArtworkBulkImportModal } from "@/components/admin/artwork-bulk-import-modal";
import { ArtworkPlacardSheet } from "@/components/admin/artwork-placard-sheet";
import { getClientBaseUrl } from "@/lib/get-base-url-client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditablePageHeader } from "@/components/admin/editable-page-header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AiAssistantModal } from "@/components/admin/ai-assistant-modal";
import { TiptapEditor } from "@/components/builder/tiptap-editor";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, SUPPORTED_CURRENCIES } from "@/lib/formatters";
import { adminFetch, unwrapRecords, AdminSessionExpiredError } from "@/lib/admin-fetch";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { artworks: number };
}

interface Artwork {
  id: string;
  title: string;
  slug: string;
  description: string;
  dimensions: string;
  medium: string;
  materials?: string | null;
  surface?: string | null;
  yearCreated: number;
  hasGoldFoil: boolean;
  goldPurity: string | null;
  customFoilLabel?: string | null;
  price: string | number | null;
  currency?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isActive: boolean;
  showOnHomepage: boolean;
  sortOrder: number;
  primaryImageUrl: string;
  watermarkedWebpUrl: string;
  originalFileName?: string | null;
  watermarkOverride?: boolean;
  customWatermark?: { text?: string; opacity?: number; style?: string } | null;
  category: Category;
  categoryId: string;
  createdAt: string;
  _count?: { events: number; leads: number };
}

export default function ArtworksAdminPage() {
  const [artworks, setArtworks] = React.useState<Artwork[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid");

  // Selection & Batch Placard Printing State
  const [selectedArtworkIds, setSelectedArtworkIds] = React.useState<Set<string>>(new Set());
  const [placardModalOpen, setPlacardModalOpen] = React.useState(false);

  // Artwork Dialog (Create / Edit)
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingArtwork, setEditingArtwork] = React.useState<Artwork | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Form State
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dimensions, setDimensions] = React.useState("24 x 36 inches");
  const [medium, setMedium] = React.useState("Gold Foil, Teakwood, Semi-Precious Gemstones");
  const [materials, setMaterials] = React.useState("Natural pigments, shell gold, semi-precious stones");
  const [surface, setSurface] = React.useState("Teakwood plank");
  const [yearCreated, setYearCreated] = React.useState(new Date().getFullYear().toString());
  const [hasGoldFoil, setHasGoldFoil] = React.useState(false);
  const [goldPurity, setGoldPurity] = React.useState("");
  const [customFoilLabel, setCustomFoilLabel] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [currency, setCurrency] = React.useState("INR");
  const [isAvailable, setIsAvailable] = React.useState(true);
  const [isFeatured, setIsFeatured] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);
  const [showOnHomepage, setShowOnHomepage] = React.useState(false);
  const [sortOrder, setSortOrder] = React.useState(0);

  // Image Upload State
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [primaryImageUrl, setPrimaryImageUrl] = React.useState("");
  const [watermarkedWebpUrl, setWatermarkedWebpUrl] = React.useState("");
  const [originalFileName, setOriginalFileName] = React.useState("");
  const [protectedS3Key, setProtectedS3Key] = React.useState("");
  const [mediaVaultPickerOpen, setMediaVaultPickerOpen] = React.useState(false);

  // Watermark Customization State
  const [watermarkOverride, setWatermarkOverride] = React.useState(false);
  const [customWatermarkText, setCustomWatermarkText] = React.useState("");
  const [customWatermarkOpacity, setCustomWatermarkOpacity] = React.useState(85);
  const [customWatermarkStyle, setCustomWatermarkStyle] = React.useState<"REPEAT_DIAGONAL" | "BANNER" | "CORNER" | "BOTH">("REPEAT_DIAGONAL");
  const [regeneratingWatermark, setRegeneratingWatermark] = React.useState(false);

  const handleRegenerateSingleWatermark = async () => {
    if (!editingArtwork?.id) {
      toast.info("Please save the artwork before regenerating the watermark.");
      return;
    }
    setRegeneratingWatermark(true);
    try {
      const res = await fetch("/api/admin/artworks/re-watermark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkId: editingArtwork.id }),
      });
      const data = await res.json();
      if (res.ok && data.results?.[0]?.success) {
        setWatermarkedWebpUrl(data.results[0].url);
        toast.success("Artwork watermark regenerated successfully!");
        reloadData();
      } else {
        toast.error(data.results?.[0]?.error || data.error || "Failed to regenerate watermark");
      }
    } catch {
      toast.error("Network error regenerating watermark");
    } finally {
      setRegeneratingWatermark(false);
    }
  };

  // QR Preview Modal
  const [qrModalOpen, setQrModalOpen] = React.useState(false);
  const [qrLoading, setQrLoading] = React.useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = React.useState("");
  const [qrArtworkTitle, setQrArtworkTitle] = React.useState("");
  const [qrTargetSlug, setQrTargetSlug] = React.useState("");
  const [qrTargetUrl, setQrTargetUrl] = React.useState("");

  // Delete Confirmation Modal State
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [targetDeleteArtwork, setTargetDeleteArtwork] = React.useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // File Upload Ref & Drag State
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Category Manager Modal
  const [categoryModalOpen, setCategoryModalOpen] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState("");
  const [newCatSlug, setNewCatSlug] = React.useState("");
  const [creatingCat, setCreatingCat] = React.useState(false);

  // Excel Bulk Export & Import State
  const [exportingExcel, setExportingExcel] = React.useState(false);
  const [bulkImportOpen, setBulkImportOpen] = React.useState(false);

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      toast.info("Generating archival Excel catalog with embedded thumbnails...");
      const res = await fetch("/api/admin/artworks/export");
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate Excel catalog");
      }
      const count = res.headers.get("X-Export-Total-Count") || artworks.length;
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `savazai-artworks-catalog-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Successfully exported ${count} artworks with embedded thumbnails!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Export failed";
      toast.error(msg);
    } finally {
      setExportingExcel(false);
    }
  };

  const reloadData = React.useCallback(async () => {
    try {
      const [artworksData, categoriesData] = await Promise.all([
        adminFetch<Artwork[]>("/api/admin/artworks"),
        adminFetch<Category[]>("/api/admin/categories"),
      ]);
      setArtworks(unwrapRecords<Artwork>(artworksData, ["artworks", "items"]));
      setCategories(unwrapRecords<Category>(categoriesData, ["categories", "items"]));
    } catch (e) {
      if (e instanceof AdminSessionExpiredError) return;
      console.error("Error loading artworks data:", e);
      toast.error(e instanceof Error ? e.message : "Error loading artworks data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingArtwork(null);
    setTitle("");
    setSlug("");
    setCategoryId(categories[0]?.id || "");
    setDescription("");
    setDimensions("24 x 36 inches");
    setMedium("Gold Foil, Teakwood, Semi-Precious Gemstones");
    setMaterials("Natural pigments, shell gold, semi-precious stones");
    setSurface("Teakwood plank");
    setYearCreated(new Date().getFullYear().toString());
    setHasGoldFoil(false);
    setGoldPurity("");
    setCustomFoilLabel("");
    setPrice("");
    setCurrency("INR");
    setIsAvailable(true);
    setIsFeatured(false);
    setIsActive(true);
    setShowOnHomepage(false);
    setSortOrder(artworks.length + 1);
    setPrimaryImageUrl("");
    setWatermarkedWebpUrl("");
    setOriginalFileName("");
    setProtectedS3Key("");
    setWatermarkOverride(false);
    setCustomWatermarkText("");
    setCustomWatermarkOpacity(85);
    setCustomWatermarkStyle("REPEAT_DIAGONAL");
    setDialogOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (art: Artwork) => {
    setEditingArtwork(art);
    setTitle(art.title);
    setSlug(art.slug);
    setCategoryId(art.categoryId);
    setDescription(art.description);
    setDimensions(art.dimensions);
    setMedium(art.medium);
    setMaterials(art.materials || art.medium || "");
    setSurface(art.surface || "");
    setYearCreated(art.yearCreated.toString());
    setHasGoldFoil(art.hasGoldFoil);
    setGoldPurity(art.goldPurity || "");
    setCustomFoilLabel(art.customFoilLabel || "");
    setPrice(art.price ? art.price.toString() : "");
    setCurrency(art.currency || "INR");
    setIsAvailable(art.isAvailable);
    setIsFeatured(art.isFeatured);
    setIsActive(art.isActive !== undefined ? art.isActive : true);
    setShowOnHomepage(art.showOnHomepage !== undefined ? art.showOnHomepage : false);
    setSortOrder(art.sortOrder !== undefined ? art.sortOrder : 0);
    setPrimaryImageUrl(art.primaryImageUrl);
    setWatermarkedWebpUrl(art.watermarkedWebpUrl);
    setOriginalFileName(art.originalFileName || "");
    setWatermarkOverride(art.watermarkOverride || false);
    const cw = art.customWatermark as { text?: string; opacity?: number; style?: string } | undefined;
    setCustomWatermarkText(cw?.text || "");
    setCustomWatermarkOpacity(cw?.opacity !== undefined ? Math.round(cw.opacity * 100) : 85);
    setCustomWatermarkStyle(
      (cw?.style as "REPEAT_DIAGONAL" | "BANNER" | "CORNER" | "BOTH") || "REPEAT_DIAGONAL"
    );
    setDialogOpen(true);
  };

  // Process Upload with format validation and defensive key resolution
  const [isHeicUpload, setIsHeicUpload] = React.useState(false);
  const processUpload = async (file: File) => {
    const validMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/tiff",
      "image/heic",
      "image/heif",
      "image/heic-sequence",
    ];
    const hasValidExt = /\.(jpe?g|png|webp|gif|tiff?|heic|heics)$/i.test(file.name);
    if (!validMimes.includes(file.type.toLowerCase()) && !hasValidExt) {
      toast.error("Unsupported format. Please upload JPEG, PNG, WebP, GIF, TIFF, or Apple HEIC/HEICS.");
      return;
    }

    const isHeic = /\.(heic|heics)$/i.test(file.name) || file.type.includes("heic") || file.type.includes("heif");
    setIsHeicUpload(isHeic);
    setUploadingImage(true);
    setOriginalFileName(file.name);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mediaType", "artwork");
    formData.append("isArtwork", "true");
    if (watermarkOverride) {
      if (customWatermarkText.trim()) formData.append("watermarkText", customWatermarkText.trim());
      formData.append("watermarkOpacity", String(customWatermarkOpacity / 100));
      formData.append("watermarkStyle", customWatermarkStyle);
    }

    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedUrl =
          data.watermarkedUrl || data.publicUrl || data.primaryImageUrl;
        const s3Key =
          data.protectedS3Key || data.vaultKey || data.masterKey || "";

        if (!uploadedUrl) {
          toast.error("Upload succeeded but image URL was not returned.");
          return;
        }

        setPrimaryImageUrl(uploadedUrl);
        setWatermarkedWebpUrl(uploadedUrl);
        setOriginalFileName(data.originalFileName || file.name);
        setProtectedS3Key(s3Key);
        toast.success("Artwork image uploaded & watermarked successfully!");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Upload failed");
      }
    } catch (err) {
      console.error("Upload exception:", err);
      toast.error("Error uploading image to server");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUpload(file);
  };

  const handleRemoveImage = () => {
    setPrimaryImageUrl("");
    setWatermarkedWebpUrl("");
    setProtectedS3Key("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Image removed from draft");
  };

  // Auto-slug
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingArtwork) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  };

  // Submit Artwork
  const handleSaveArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || categoryId.trim() === "") {
      toast.error("Please select an Art Category. Category is mandatory for all artworks.");
      return;
    }
    if (!primaryImageUrl) {
      toast.error("Please upload a primary image for the artwork.");
      return;
    }

    setSaving(true);
    const resolvedMaterials = materials.trim() || medium.trim();
    const resolvedSurface = surface.trim();
    const resolvedMedium = resolvedMaterials
      ? resolvedSurface
        ? `${resolvedMaterials} on ${resolvedSurface}`
        : resolvedMaterials
      : medium;

    const payload = {
      title,
      slug,
      categoryId,
      description,
      dimensions,
      medium: resolvedMedium,
      materials: resolvedMaterials || null,
      surface: resolvedSurface || null,
      yearCreated: parseInt(yearCreated, 10),
      hasGoldFoil,
      goldPurity: hasGoldFoil && goldPurity?.trim() ? goldPurity.trim() : null,
      customFoilLabel: hasGoldFoil && customFoilLabel?.trim() ? customFoilLabel.trim() : null,
      price: price ? parseFloat(price) : null,
      currency,
      isAvailable,
      isFeatured,
      isActive,
      showOnHomepage,
      sortOrder: parseInt(String(sortOrder), 10) || 0,
      primaryImageUrl,
      watermarkedWebpUrl: watermarkedWebpUrl || primaryImageUrl,
      protectedS3Key,
      originalFileName: originalFileName || null,
      watermarkOverride,
      customWatermark: watermarkOverride
        ? {
            text: customWatermarkText.trim() || undefined,
            opacity: customWatermarkOpacity / 100,
            style: customWatermarkStyle,
          }
        : null,
    };

    try {
      if (editingArtwork) {
        const res = await fetch(`/api/admin/artworks/${editingArtwork.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success("Masterwork updated successfully!");
          setDialogOpen(false);
          reloadData();
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || "Failed to update artwork");
        }
      } else {
        const res = await fetch("/api/admin/artworks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success("Masterwork cataloged successfully!");
          setDialogOpen(false);
          reloadData();
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || "Failed to create artwork");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Error saving artwork");
    } finally {
      setSaving(false);
    }
  };

  // Delete Artwork Handlers (Confirm Dialog)
  const handleDeleteArtworkClick = (id: string, artTitle: string) => {
    setTargetDeleteArtwork({ id, title: artTitle });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetDeleteArtwork) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/artworks/${targetDeleteArtwork.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Deleted "${targetDeleteArtwork.title}" successfully`);
        setDeleteDialogOpen(false);
        setTargetDeleteArtwork(null);
        reloadData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to delete artwork");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error deleting artwork");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (artwork: Artwork) => {
    const nextVal = !artwork.isActive;
    setArtworks((prev) => prev.map((a) => (a.id === artwork.id ? { ...a, isActive: nextVal } : a)));
    try {
      const res = await fetch(`/api/admin/artworks/${artwork.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextVal }),
      });
      if (!res.ok) {
        setArtworks((prev) => prev.map((a) => (a.id === artwork.id ? { ...a, isActive: artwork.isActive } : a)));
        toast.error("Failed to toggle artwork visibility");
      } else {
        toast.success(`"${artwork.title}" is now ${nextVal ? "Active" : "Inactive"}`);
      }
    } catch {
      setArtworks((prev) => prev.map((a) => (a.id === artwork.id ? { ...a, isActive: artwork.isActive } : a)));
      toast.error("Error toggling artwork visibility");
    }
  };

  const handleToggleHomepage = async (artwork: Artwork) => {
    const nextVal = !artwork.showOnHomepage;
    setArtworks((prev) => prev.map((a) => (a.id === artwork.id ? { ...a, showOnHomepage: nextVal } : a)));
    try {
      const res = await fetch(`/api/admin/artworks/${artwork.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnHomepage: nextVal }),
      });
      if (!res.ok) {
        setArtworks((prev) => prev.map((a) => (a.id === artwork.id ? { ...a, showOnHomepage: artwork.showOnHomepage } : a)));
        toast.error("Failed to toggle homepage display");
      } else {
        toast.success(`"${artwork.title}" homepage display updated`);
      }
    } catch {
      setArtworks((prev) => prev.map((a) => (a.id === artwork.id ? { ...a, showOnHomepage: artwork.showOnHomepage } : a)));
      toast.error("Error toggling homepage display");
    }
  };

  // Open QR Preview
  const handleOpenQR = async (art: Artwork) => {
    setQrArtworkTitle(art.title);
    setQrTargetSlug(art.slug);
    setQrPreviewUrl("");
    setQrTargetUrl("");
    setQrModalOpen(true);
    setQrLoading(true);

    try {
      const origin = getClientBaseUrl();
      const res = await fetch(`/api/admin/qr?slug=${encodeURIComponent(art.slug)}&origin=${encodeURIComponent(origin)}`);
      const data = await res.json();
      if (data.dataUrl) {
        setQrPreviewUrl(data.dataUrl);
        setQrTargetUrl(data.targetUrl || `${origin}/artwork/${art.slug}?qr=true`);
      } else {
        toast.error("Failed to load QR code");
      }
    } catch {
      toast.error("Network error loading QR code");
    } finally {
      setQrLoading(false);
    }
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCat(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName, slug: newCatSlug }),
      });
      if (res.ok) {
        setNewCatName("");
        setNewCatSlug("");
        toast.success("Category created successfully!");
        reloadData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to create category");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error creating category");
    } finally {
      setCreatingCat(false);
    }
  };

  // Filter artworks
  const filteredArtworks = artworks.filter((art) => {
    const matchesCategory =
      selectedCategory === "ALL" || art.categoryId === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      art.title.toLowerCase().includes(q) ||
      (art.materials || art.medium || "").toLowerCase().includes(q) ||
      (art.surface || "").toLowerCase().includes(q) ||
      art.medium.toLowerCase().includes(q) ||
      art.category?.name.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const toggleSelectAll = () => {
    if (filteredArtworks.length > 0 && selectedArtworkIds.size === filteredArtworks.length) {
      setSelectedArtworkIds(new Set());
    } else {
      setSelectedArtworkIds(new Set(filteredArtworks.map((a) => a.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedArtworkIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedArtworkIds(next);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <EditablePageHeader
        sectionKey="artworks"
        defaultTitle="Catalog & Assets"
        defaultSubtitle="Curate collection assets, master records, dimensions, and exhibition QR scans."
        badgeLabel="Vault & Catalog Management"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCategoryModalOpen(true)}
          className="text-xs gap-1.5"
        >
          <FolderTree className="w-3.5 h-3.5" />
          Categories ({categories.length})
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setBulkImportOpen(true)}
          className="text-xs gap-1.5"
          title="Upload Excel spreadsheet to bulk create or update masterworks"
        >
          <UploadCloud className="w-3.5 h-3.5 text-primary" />
          Bulk Import Excel
        </Button>
      </EditablePageHeader>

      {/* TIER 1: Dedicated Art Category Navigation */}
      <div className="w-full border-b border-border/60 pb-3 mb-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          <Button
            key="all"
            size="sm"
            onClick={() => setSelectedCategory("ALL")}
            className={cn(
              "rounded-full px-4 text-xs font-serif shrink-0 cursor-pointer h-8 transition-all border",
              selectedCategory === "ALL"
                ? "bg-amber-700 text-white border-amber-800 shadow-sm hover:bg-amber-800 dark:bg-amber-600 dark:text-white"
                : "bg-background text-foreground border-border hover:bg-muted/80 hover:text-foreground"
            )}
          >
            All Works ({artworks.length})
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "rounded-full px-4 text-xs font-serif shrink-0 cursor-pointer h-8 transition-all border",
                selectedCategory === cat.id
                  ? "bg-amber-700 text-white border-amber-800 shadow-sm hover:bg-amber-800 dark:bg-amber-600 dark:text-white"
                  : "bg-background text-foreground border-border hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {cat.name} ({cat._count?.artworks ?? 0})
            </Button>
          ))}
        </div>
      </div>

      {/* TIER 2: Management & Action Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 bg-card rounded-xl border border-border/70 mb-6 shadow-xs">
        {/* Left: Search input */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search title, medium, provenance..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/50 h-9 text-xs"
          />
        </div>

        {/* Center: Batch Selection Status & Select All / Deselect All / Clear */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedArtworkIds.size > 0 && (
            <div className="flex items-center gap-2 mr-1">
              <span className="text-xs font-mono font-medium text-amber-800 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                {selectedArtworkIds.size} Selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedArtworkIds(new Set())}
                className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2"
              >
                Clear
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={toggleSelectAll}
            className="h-9 text-xs font-serif cursor-pointer text-foreground hover:text-foreground"
          >
            {filteredArtworks.length > 0 && selectedArtworkIds.size === filteredArtworks.length
              ? "Deselect All"
              : "Select All"}
          </Button>
        </div>

        {/* Right: Action Grouping & View Switcher */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap">
          <Button
            variant="outline"
            size="sm"
            disabled={selectedArtworkIds.size === 0}
            onClick={() => setPlacardModalOpen(true)}
            className={cn(
              "h-9 text-xs font-serif transition-colors gap-1.5 cursor-pointer",
              selectedArtworkIds.size > 0
                ? "text-amber-800 border-amber-300 bg-amber-50/60 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-700 dark:bg-amber-950/40"
                : "opacity-50 cursor-not-allowed text-muted-foreground"
            )}
            title={
              selectedArtworkIds.size === 0
                ? "Select one or more artworks using checkboxes to print placards"
                : `Print display placards for ${selectedArtworkIds.size} selected artwork(s)`
            }
          >
            <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Print Placards ({selectedArtworkIds.size})
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="h-9 text-xs font-serif gap-1.5 text-foreground hover:text-foreground border-border cursor-pointer"
            title="Export entire artwork collection as high-fidelity Excel workbook"
          >
            {exportingExcel ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-primary" />
            )}
            {exportingExcel ? "Exporting..." : "Export Excel"}
          </Button>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="h-9 px-4 text-xs font-serif bg-amber-600 hover:bg-amber-700 text-white border border-amber-700 shadow-sm shrink-0 gap-1.5 cursor-pointer font-medium"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            Add Artwork
          </Button>

          <div className="flex items-center border border-border rounded-md p-0.5 ml-1 bg-background">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn(
                "h-7 w-7 p-0 cursor-pointer",
                viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={cn(
                "h-7 w-7 p-0 cursor-pointer",
                viewMode === "table" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="Table View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs">Loading artwork vault...</span>
        </div>
      ) : filteredArtworks.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Palette className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-serif font-bold text-base text-foreground">
            No Catalog Items Found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? "No catalog items match your query."
              : "Begin cataloging collection items and archival master records."}
          </p>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 px-4 text-xs font-serif bg-amber-600 hover:bg-amber-700 text-white border border-amber-700 shadow-sm shrink-0 gap-1.5 cursor-pointer font-medium"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-white" />
            Catalog First Item
          </Button>
        </Card>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredArtworks.map((art) => (
            <Card
              key={art.id}
              className={cn(
                "overflow-hidden hover:border-primary/60 transition-all flex flex-col justify-between group relative",
                selectedArtworkIds.has(art.id) && "ring-2 ring-amber-500 border-amber-500 bg-amber-500/[0.03]"
              )}
            >
              <div className="relative aspect-[4/5] bg-muted/40 overflow-hidden">
                {/* Print Selection Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedArtworkIds.has(art.id)}
                  onChange={() => toggleSelectOne(art.id)}
                  className="absolute top-3 left-3 z-30 w-5 h-5 rounded border-amber-600 accent-amber-600 cursor-pointer shadow-md bg-background/90"
                  title="Select artwork for placard printing"
                />

                {art.watermarkedWebpUrl ? (
                  <Image
                    src={art.watermarkedWebpUrl}
                    alt={art.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Palette className="w-8 h-8 opacity-40" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-10 left-2 flex flex-col gap-1">
                  <Badge variant="outline" className="text-[10px] bg-background/80 backdrop-blur-md">
                    {art.category?.name}
                  </Badge>
                  {art.hasGoldFoil && (
                    <Badge variant="gold" className="text-[9px]">
                      {art.customFoilLabel || art.goldPurity || "Gold Foil"}
                    </Badge>
                  )}
                </div>

                <div className="absolute top-2 right-2">
                  <Badge
                    variant={art.isAvailable ? "gold" : "outline"}
                    className="text-[10px] uppercase bg-background/80 backdrop-blur-md"
                  >
                    {art.isAvailable ? "Available" : "Acquired"}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <h4 className="font-serif font-bold text-sm text-foreground line-clamp-1">
                    {art.title}
                  </h4>
                  {art.price && (
                    <span className="font-mono text-xs font-bold text-primary shrink-0">
                      {formatCurrency(art.price, art.currency || "INR")}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {art.materials || art.medium}
                  {art.surface ? ` • ${art.surface}` : ""} • {art.dimensions}
                </p>

                {/* Visibility & Homepage Toggles */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(art)}
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                      art.isActive
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                    title="Click to toggle Active status"
                  >
                    {art.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {art.isActive ? "Active" : "Inactive"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleHomepage(art)}
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                      art.showOnHomepage
                        ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-600/40 hover:bg-blue-200"
                        : "bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-200 opacity-60 hover:opacity-100"
                    }`}
                    title="Click to toggle Feature on Homepage"
                  >
                    <Home className="w-3 h-3" />
                    {art.showOnHomepage ? "On Home" : "Not on Home"}
                  </button>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                  <Link
                    href={`/artwork/${art.slug}`}
                    target="_blank"
                    className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Public View
                  </Link>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenQR(art)}
                      className="h-7 w-7 p-0 text-foreground hover:text-primary"
                      title="Exhibition Floor QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(art)}
                      className="h-7 w-7 p-0"
                      title="Edit Artwork"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteArtworkClick(art.id, art.title)}
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      title="Delete Artwork"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={filteredArtworks.length > 0 && filteredArtworks.every((a) => selectedArtworkIds.has(a.id))}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-border accent-amber-600 cursor-pointer"
                    title={filteredArtworks.length > 0 && filteredArtworks.every((a) => selectedArtworkIds.has(a.id)) ? "Deselect all visible artworks" : "Select all visible artworks"}
                  />
                </TableHead>
                <TableHead className="w-12">Preview</TableHead>
                <TableHead>Title &amp; Category</TableHead>
                <TableHead>Materials, Surface &amp; Dimensions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArtworks.map((art) => (
                <TableRow
                  key={art.id}
                  className={selectedArtworkIds.has(art.id) ? "bg-amber-500/5 dark:bg-amber-500/10" : ""}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedArtworkIds.has(art.id)}
                      onChange={() => toggleSelectOne(art.id)}
                      className="w-4 h-4 rounded border-border accent-amber-600 cursor-pointer"
                      title="Select for print display placards"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="w-10 h-12 rounded bg-muted/60 relative overflow-hidden">
                      {art.watermarkedWebpUrl && (
                        <Image
                          src={art.watermarkedWebpUrl}
                          alt={art.title}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-serif font-bold text-sm text-foreground">
                        {art.title}
                      </span>
                      <span className="text-[10px] text-primary font-mono">
                        {art.category?.name} • Year {art.yearCreated}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>{art.materials || art.medium}</div>
                    {art.surface && (
                      <div className="text-[11px] text-foreground/80">Surface: {art.surface}</div>
                    )}
                    <div className="font-mono text-[11px]">{art.dimensions}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant={art.isAvailable ? "gold" : "outline"} className="text-[10px]">
                        {art.isAvailable ? "Available" : "Acquired"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(art)}
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                            art.isActive
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                          title="Toggle Active"
                        >
                          {art.isActive ? "Active" : "Inactive"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleHomepage(art)}
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                            art.showOnHomepage
                              ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-600/40"
                              : "bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 opacity-60"
                          }`}
                          title="Toggle Feature on Home"
                        >
                          {art.showOnHomepage ? "Home" : "Off"}
                        </button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-foreground">
                    {art.price ? formatCurrency(art.price, art.currency || "INR") : "Inquire"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenQR(art)}
                        className="h-7 w-7 p-0"
                        title="QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(art)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteArtworkClick(art.id, art.title)}
                        className="h-7 w-7 p-0 text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Artwork Create / Edit Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveArtwork}>
            <DialogHeader>
              <DialogTitle>
                {editingArtwork ? "Edit Catalog Item" : "Catalog New Item / Asset"}
              </DialogTitle>
              <DialogDescription>
                Define provenance, materials, dimensions, and upload high-res imagery.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-left">
              {/* Image Upload Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Catalog Item Image (JPEG, PNG, WebP, GIF, TIFF)
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMediaVaultPickerOpen(true)}
                      className="text-xs h-7 gap-1.5"
                    >
                      <FolderOpen className="w-3 h-3 text-primary" />
                      Media Vault / Upload Suite
                    </Button>
                    {primaryImageUrl && (
                      <span className="text-[11px] font-mono text-primary flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#D4AF37]" />
                        Derivative Ready
                      </span>
                    )}
                  </div>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`rounded-lg border-2 border-dashed p-4 transition-all duration-200 ${
                    isDragOver
                      ? "border-primary bg-primary/10"
                      : primaryImageUrl
                      ? "border-border bg-card/60"
                      : "border-border/80 bg-muted/20 hover:border-primary/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="artworkImage"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/tiff,image/heic,image/heif,image/heic-sequence,.heic,.heics"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {uploadingImage ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-2 text-center">
                      <Loader2 className="w-7 h-7 animate-spin text-primary" />
                      <p className="text-xs font-medium text-foreground">
                        {isHeicUpload
                          ? "Converting Apple HEIC to Archival Format & applying watermark..."
                          : "Processing image via Sharp & applying watermark..."}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {isHeicUpload
                          ? "Transcoding uncompressed buffer (95% quality, 4:4:4 chroma subsampling) into master vault."
                          : "Generating public WebP derivative and securing master asset in vault."}
                      </p>
                    </div>
                  ) : primaryImageUrl ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-28 h-32 rounded-md border border-border overflow-hidden relative shrink-0 bg-black/40">
                        <Image
                          src={primaryImageUrl}
                          alt="Artwork Preview"
                          fill
                          className="object-contain"
                          sizes="112px"
                        />
                      </div>

                      <div className="flex-1 space-y-2 text-left">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground">
                            Artwork Asset Loaded
                          </p>
                          <p className="text-[11px] text-muted-foreground break-all line-clamp-2">
                            {watermarkedWebpUrl || primaryImageUrl}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setMediaVaultPickerOpen(true)}
                            className="text-xs h-7 gap-1"
                          >
                            <FolderOpen className="w-3 h-3 text-primary" />
                            Change via Vault
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs h-7 gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Direct File
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveImage}
                            className="text-xs h-7 gap-1 text-destructive hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setMediaVaultPickerOpen(true)}
                      className="cursor-pointer py-6 flex flex-col items-center justify-center gap-2 text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Click to select from Vault, upload local, or paste URL
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Supports high-resolution JPEG, PNG, WebP, TIFF, and Apple HEIC/HEICS
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>


              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Title</label>
                  <Input
                    placeholder="e.g. Archival Master Record No. 1"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">URL Slug</label>
                  <Input
                    placeholder="archival-master-record-1"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Category & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    Art Category <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select Classification / Department (Required) *</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Year Created</label>
                  <Input
                    type="number"
                    value={yearCreated}
                    onChange={(e) => setYearCreated(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Materials & Surface */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Materials</label>
                  <Input
                    placeholder="e.g. Natural pigments, shell gold, semi-precious stones"
                    value={materials}
                    onChange={(e) => {
                      setMaterials(e.target.value);
                      setMedium(
                        surface.trim()
                          ? `${e.target.value} on ${surface.trim()}`
                          : e.target.value
                      );
                    }}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Surface</label>
                  <Input
                    placeholder="e.g. Wasli paper, teakwood plank, silk, khadi cloth"
                    value={surface}
                    onChange={(e) => {
                      setSurface(e.target.value);
                      setMedium(
                        e.target.value.trim()
                          ? `${materials.trim()} on ${e.target.value.trim()}`
                          : materials.trim()
                      );
                    }}
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Dimensions</label>
                <Input
                  placeholder="e.g. 24 x 36 inches"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  required
                />
              </div>

              {/* Gold Foil Details */}
              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasGoldFoil"
                    checked={hasGoldFoil}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasGoldFoil(checked);
                      if (!checked) {
                        setGoldPurity("");
                        setCustomFoilLabel("");
                      }
                    }}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="hasGoldFoil" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                    Includes Authentic Embellishment / Foil Work
                  </label>
                </div>

                {hasGoldFoil && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">Custom Foil / Accent Badge (Optional)</label>
                      <Input
                        placeholder="e.g. Gold Foil, 24K Leaf, Archival Relief"
                        value={customFoilLabel}
                        onChange={(e) => setCustomFoilLabel(e.target.value)}
                        className="text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Overrides the global watermark setting badge on gallery cards.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground">Material Purity / Specification Spec</label>
                      <Input
                        placeholder="e.g. 22 Karat Leaf, Archival Titanium White, Certified Pigment"
                        value={goldPurity}
                        onChange={(e) => setGoldPurity(e.target.value)}
                        className="text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Technical specification shown in the artwork provenance specifications.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Price & Currency & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Price</label>
                  <Input
                    type="number"
                    placeholder="e.g. 150000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Currency</label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="isAvailable" className="text-xs font-medium text-foreground">
                    Available for Sale
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="isFeatured" className="text-xs font-medium text-foreground">
                    Feature on Home
                  </label>
                </div>
              </div>

              {/* Visibility & Curation Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActiveArtwork"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="isActiveArtwork" className="text-xs font-medium text-foreground">
                    Active (Publicly Visible)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showOnHomepageArtwork"
                    checked={showOnHomepage}
                    onChange={(e) => setShowOnHomepage(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="showOnHomepageArtwork" className="text-xs font-medium text-foreground">
                    Homepage Gallery
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="sortOrderArtwork" className="text-xs font-medium text-foreground whitespace-nowrap">
                    Sort Order:
                  </label>
                  <Input
                    id="sortOrderArtwork"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                    className="h-8 text-xs font-mono w-24"
                  />
                </div>
              </div>

              {/* Watermark & Anti-Theft Protection Overrides */}
              <div className="p-3 rounded-lg border border-border bg-card/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="watermarkOverrideCheckbox"
                      checked={watermarkOverride}
                      onChange={(e) => setWatermarkOverride(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <label htmlFor="watermarkOverrideCheckbox" className="text-xs font-semibold text-foreground cursor-pointer">
                      Override Global Watermark for this Artwork
                    </label>
                  </div>
                  {editingArtwork?.id && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateSingleWatermark}
                      disabled={regeneratingWatermark}
                      className="h-7 text-xs gap-1.5"
                    >
                      {regeneratingWatermark ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      Re-generate Watermark
                    </Button>
                  )}
                </div>

                {watermarkOverride && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/50">
                    <div className="sm:col-span-1 space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Watermark Text</label>
                      <Input
                        value={customWatermarkText}
                        onChange={(e) => setCustomWatermarkText(e.target.value)}
                        placeholder="© SavazAI WebApps"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Placement Style</label>
                      <Select
                        value={customWatermarkStyle}
                        onValueChange={(val: string) =>
                          setCustomWatermarkStyle(
                            val as "REPEAT_DIAGONAL" | "BANNER" | "CORNER" | "BOTH"
                          )
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REPEAT_DIAGONAL">Diagonal Repeat (Full Anti-Theft)</SelectItem>
                          <SelectItem value="BANNER">Bottom Banner</SelectItem>
                          <SelectItem value="CORNER">Bottom-Right Corner</SelectItem>
                          <SelectItem value="BOTH">Corner + Diagonal Repeat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-medium text-muted-foreground">
                        <span>Opacity</span>
                        <span className="font-mono">{customWatermarkOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={customWatermarkOpacity}
                        onChange={(e) => setCustomWatermarkOpacity(parseInt(e.target.value, 10))}
                        className="w-full accent-primary h-2 mt-1 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Description WYSIWYG */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Artistic Commentary &amp; Provenance</label>
                  <AiAssistantModal
                    initialContext={`${title ? `Artwork Title: ${title}\n` : ""}${medium ? `Medium: ${medium}\n` : ""}${description || ""}`}
                    onApply={(aiText) => {
                      setDescription((prev) => {
                        const newParagraph = `<p>${aiText.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`;
                        return prev ? `${prev}${newParagraph}` : newParagraph;
                      });
                    }}
                    triggerLabel="✨ AI Provenance"
                  />
                </div>
                <div className="rounded-md border border-input bg-card/60 p-1 shadow-sm">
                  <TiptapEditor
                    content={description}
                    onChange={(_, html) => setDescription(html)}
                    placeholder="Detailed curatorial description, historical context, and technical notes..."
                    className="min-h-[140px]"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={saving || uploadingImage}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : editingArtwork ? (
                  "Update Item"
                ) : (
                  "Save Record"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Code Preview Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Exhibition Floor QR Code</DialogTitle>
            <DialogDescription>
              Scan to view &quot;{qrArtworkTitle}&quot; with interactive lead capture and audio commentary.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-white rounded-xl shadow-lg border border-border flex items-center justify-center min-w-[200px] min-h-[200px]">
              {qrLoading ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground mt-2">Generating QR Code...</span>
                </div>
              ) : qrPreviewUrl ? (
                <Image
                  src={qrPreviewUrl}
                  alt="Exhibition QR Code"
                  width={200}
                  height={200}
                  className="w-48 h-48"
                  unoptimized
                />
              ) : (
                <div className="text-xs text-muted-foreground">Unable to generate QR code</div>
              )}
            </div>
            <span className="text-[11px] font-mono text-muted-foreground text-center break-all max-w-xs px-2">
              {qrTargetUrl || `/artwork/${qrTargetSlug}?qr=true`}
            </span>
          </div>

          <DialogFooter className="sm:justify-center">
            {qrPreviewUrl && (
              <a href={qrPreviewUrl} download={`qr-${qrTargetSlug}.png`}>
                <Button variant="default" size="sm" className="gap-1.5 cursor-pointer">
                  <Download className="w-3.5 h-3.5" />
                  Download Print High-Res QR
                </Button>
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Management Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Traditional Art Categories</DialogTitle>
            <DialogDescription>
              Manage distinct classical painting schools and gallery taxonomy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Create category input */}
            <form onSubmit={handleCreateCategory} className="flex items-center gap-2">
              <Input
                placeholder="New Category Name..."
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                  setNewCatSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "")
                  );
                }}
                className="h-8 text-xs"
                required
              />
              <Button
                type="submit"
                variant="default"
                size="sm"
                className="h-8 text-xs shrink-0"
                disabled={creatingCat}
              >
                Add
              </Button>
            </form>

            {/* Existing Categories List */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded border border-border bg-card/60 text-xs"
                >
                  <span className="font-serif font-bold text-foreground">
                    {c.name}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {c._count?.artworks ?? 0} artworks
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Bulk Excel Import & Mass Update Modal */}
      <ArtworkBulkImportModal
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        onSuccess={reloadData}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog

        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Masterwork Record"
        description={
          targetDeleteArtwork
            ? `Are you sure you want to delete "${targetDeleteArtwork.title}"? This will permanently remove the artwork, its provenance records, and exhibition QR codes. This action cannot be undone.`
            : "Are you sure you want to delete this artwork?"
        }
        confirmText="Delete Masterwork"
        isDestructive={true}
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
      />

      {/* Universal Media Suite Modal */}
      <UniversalMediaDialog
        open={mediaVaultPickerOpen}
        onOpenChange={setMediaVaultPickerOpen}
        title="Select Masterwork Image Asset"
        acceptedTypes="image"
        allowMultiple={false}
        isArtwork={true}
        mediaType="artwork"
        onSelect={(item) => {
          setPrimaryImageUrl(item.url);
          setWatermarkedWebpUrl(item.url);
          if (item.originalFileName) {
            setOriginalFileName(item.originalFileName);
          }
          toast.success("Artwork image selected successfully");
        }}
      />

      {/* Printable Placards Sheet Modal */}
      <ArtworkPlacardSheet
        open={placardModalOpen}
        onOpenChange={setPlacardModalOpen}
        artworks={
          selectedArtworkIds.size > 0
            ? artworks.filter((a) => selectedArtworkIds.has(a.id))
            : filteredArtworks
        }
      />
    </div>
  );
}

