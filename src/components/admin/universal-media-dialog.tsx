"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Loader2,
  Image as ImageIcon,
  Check,
  FolderOpen,
  UploadCloud,
  Link as LinkIcon,
  FileText,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";
import { optimizeImageForWebpUpload } from "@/lib/client-image-optimizer";

export interface UniversalMediaItem {
  url: string;
  originalFileName?: string;
  title?: string;
  alt?: string;
  artworkId?: string;
  slug?: string;
  medium?: string;
  dimensions?: string;
  year?: string | number;
  traditionalSchool?: string;
  description?: string;
}

export interface UniversalMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (media: UniversalMediaItem) => void;
  onSelectMultiple?: (media: UniversalMediaItem[]) => void;
  title?: string;
  acceptedTypes?: "image" | "pdf" | "all";
  allowMultiple?: boolean;
  isArtwork?: boolean;
  mediaType?: "artwork" | "general" | "document";
}

interface VaultItem {
  id: string;
  url: string;
  fileName: string;
  title?: string;
  source: "artwork" | "event" | "catalog" | "storage" | "document";
  category?: string;
  createdAt?: string;
  mediaType?: "image" | "pdf";
  slug?: string;
  medium?: string;
  dimensions?: string;
  year?: string | number;
  traditionalSchool?: string;
  description?: string;
}

export function UniversalMediaDialog({
  open,
  onOpenChange,
  onSelect,
  onSelectMultiple,
  title = "Universal Media Ingestion Suite",
  acceptedTypes = "all",
  allowMultiple = false,
  isArtwork = false,
  mediaType,
}: UniversalMediaDialogProps) {
  const [activeTab, setActiveTab] = React.useState<"vault" | "upload" | "url">("vault");

  // Vault State
  const [vaultItems, setVaultItems] = React.useState<VaultItem[]>([]);
  const [vaultLoading, setVaultLoading] = React.useState(false);
  const [vaultSearch, setVaultSearch] = React.useState("");
  const [vaultSource, setVaultSource] = React.useState("all");

  // Selection State
  const [selectedItems, setSelectedItems] = React.useState<UniversalMediaItem[]>([]);

  // Local Upload State
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState("");

  // Remote URL State
  const [remoteUrl, setRemoteUrl] = React.useState("");
  const [remoteTitle, setRemoteTitle] = React.useState("");

  // Track previous open state to reset cleanly without effect setState warning
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSelectedItems([]);
      setRemoteUrl("");
      setRemoteTitle("");
    }
  }

  // Load Media Vault assets
  React.useEffect(() => {
    if (open && activeTab === "vault") {
      let active = true;
      const loadVault = async () => {
        setVaultLoading(true);
        try {
          const params = new URLSearchParams({
            search: vaultSearch,
            source: vaultSource,
            type: acceptedTypes,
            limit: "60",
          });
          const res = await fetch("/api/admin/media?" + params.toString());
          if (res.ok) {
            const data = await res.json();
            if (active) {
              setVaultItems(Array.isArray(data) ? data : data.items || []);
            }
          }
        } catch (err) {
          console.error("Failed to load vault items:", err);
        } finally {
          if (active) setVaultLoading(false);
        }
      };

      const debounce = setTimeout(loadVault, 200);
      return () => {
        active = false;
        clearTimeout(debounce);
      };
    }
  }, [open, activeTab, vaultSearch, vaultSource, acceptedTypes]);

  // Toggle selection
  const handleItemClick = (item: VaultItem) => {
    const mediaItem: UniversalMediaItem = {
      url: item.url,
      originalFileName: item.fileName,
      title: item.title,
      alt: "",
      artworkId: item.source === "artwork" ? item.id : undefined,
      slug: item.slug,
      medium: item.medium,
      dimensions: item.dimensions,
      year: item.year,
      traditionalSchool: item.traditionalSchool || item.category,
      description: item.description,
    };

    if (allowMultiple) {
      const exists = selectedItems.some((s) => s.url === item.url);
      if (exists) {
        setSelectedItems(selectedItems.filter((s) => s.url !== item.url));
      } else {
        setSelectedItems([...selectedItems, mediaItem]);
      }
    } else {
      // Single selection immediate confirm
      if (onSelect) {
        onSelect(mediaItem);
      }
      onOpenChange(false);
      toast.success("Asset selected from Media Vault");
    }
  };

  // Confirm multiple selection
  const handleConfirmMultiple = () => {
    if (selectedItems.length === 0) return;
    if (onSelectMultiple) {
      onSelectMultiple(selectedItems);
      toast.success(`Inserted ${selectedItems.length} assets from Media Vault`);
    } else if (onSelect && selectedItems[0]) {
      onSelect(selectedItems[0]);
      toast.success("Asset selected from Media Vault");
    }
    onOpenChange(false);
  };

  // Handle local file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploadedMedia: UniversalMediaItem[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const rawFile = files[i];
        const effectiveMediaType = mediaType ?? (rawFile.type.includes("pdf") ? "document" : isArtwork ? "artwork" : "general");
        const effectiveIsArtwork = isArtwork || effectiveMediaType === "artwork";
        const file = effectiveIsArtwork ? rawFile : await optimizeImageForWebpUpload(rawFile);
        setUploadProgress(`Uploading ${i + 1} of ${files.length}: ${file.name}`);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("mediaType", effectiveMediaType);
        formData.append("isArtwork", String(effectiveIsArtwork));

        const res = await fetch("/api/admin/media/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to upload ${file.name}`);
        }

        const data = await res.json();
        const finalUrl = data.publicUrl || data.fileUrl || data.watermarkedUrl || data.primaryImageUrl;

        uploadedMedia.push({
          url: finalUrl,
          originalFileName: file.name,
          title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          alt: "",
        });
      }

      toast.success(`Successfully uploaded ${uploadedMedia.length} asset(s)!`);

      if (allowMultiple && onSelectMultiple) {
        onSelectMultiple(uploadedMedia);
      } else if (onSelect && uploadedMedia[0]) {
        onSelect(uploadedMedia[0]);
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "File upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  // Handle Remote URL submission
  const handleConfirmRemoteUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!remoteUrl.trim()) return;

    const mediaItem: UniversalMediaItem = {
      url: remoteUrl.trim(),
      originalFileName: remoteUrl.trim().split("/").pop()?.split("?")[0],
      title: remoteTitle.trim() || undefined,
      alt: "",
    };

    if (allowMultiple && onSelectMultiple) {
      onSelectMultiple([mediaItem]);
    } else if (onSelect) {
      onSelect(mediaItem);
    }
    toast.success("Remote asset linked successfully");
    onOpenChange(false);
  };

  const isPdfFile = (url: string, fileName?: string) => {
    return (
      url.toLowerCase().endsWith(".pdf") ||
      url.includes("/documents/") ||
      (fileName && fileName.toLowerCase().endsWith(".pdf"))
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-4xl max-h-[88vh] flex flex-col p-0 overflow-hidden bg-card border-border shadow-2xl">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" />
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Browse existing server archive, upload fresh local files with authentic metadata, or link external media.
              </DialogDescription>
            </div>

            {allowMultiple && selectedItems.length > 0 && (
              <Badge variant="gold" className="text-xs font-mono">
                {selectedItems.length} Selected
              </Badge>
            )}
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "vault" | "upload" | "url")}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          {/* Tabs Bar */}
          <div className="px-6 pt-3 pb-2 border-b border-border/60 bg-card">
            <TabsList className="grid grid-cols-3 bg-muted/50 p-1">
              <TabsTrigger value="vault" className="text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer">
                <FolderOpen className="w-3.5 h-3.5 text-primary" /> Media Vault
              </TabsTrigger>
              <TabsTrigger value="upload" className="text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer">
                <UploadCloud className="w-3.5 h-3.5 text-primary" /> Upload Local
              </TabsTrigger>
              <TabsTrigger value="url" className="text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer">
                <LinkIcon className="w-3.5 h-3.5 text-primary" /> Remote URL
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: MEDIA VAULT */}
          <TabsContent value="vault" className="m-0 p-6 space-y-3 flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Search & Source Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title, filename, or category..."
                  value={vaultSearch}
                  onChange={(e) => setVaultSearch(e.target.value)}
                  className="pl-9 text-xs h-9"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {["all", "artwork", "event", "catalog", "document", "storage"].map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setVaultSource(src)}
                    className={`px-2.5 py-1 text-xs rounded-md capitalize transition-all cursor-pointer whitespace-nowrap ${
                      vaultSource === src
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground border border-border/50"
                    }`}
                  >
                    {src === "all" ? "All Media" : src}
                  </button>
                ))}
              </div>
            </div>

            {/* Assets Grid */}
            <div className="flex-1 min-h-[260px] overflow-y-auto rounded-xl border border-border/80 p-3 bg-muted/10">
              {vaultLoading ? (
                <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span>Loading archival assets...</span>
                </div>
              ) : vaultItems.length === 0 ? (
                <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-xs text-muted-foreground gap-2 text-center p-6">
                  <ImageIcon className="w-8 h-8 opacity-40 text-primary" />
                  <p className="font-semibold text-foreground">No media assets found</p>
                  <p className="text-[11px] max-w-xs">
                    Try refining your search query or switch to the &quot;Upload Local&quot; tab to ingest new files.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                  {vaultItems.map((item) => {
                    const isSelected = selectedItems.some((s) => s.url === item.url);
                    const isPdf = isPdfFile(item.url, item.fileName);

                    return (
                      <div
                        key={item.id + item.url}
                        onClick={() => handleItemClick(item)}
                        className={`group relative rounded-lg border overflow-hidden cursor-pointer transition-all flex flex-col bg-card ${
                          isSelected
                            ? "ring-2 ring-primary border-primary shadow-md"
                            : "border-border hover:border-primary/50 hover:shadow-xs"
                        }`}
                      >
                        {/* Asset Thumbnail or PDF Badge */}
                        <div className="aspect-square relative w-full overflow-hidden bg-black/40 flex items-center justify-center">
                          {isPdf ? (
                            <div className="flex flex-col items-center justify-center p-3 text-center gap-1.5 w-full h-full bg-rose-950/20 text-rose-500">
                              <FileText className="w-8 h-8" />
                              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                                PDF Document
                              </span>
                            </div>
                          ) : (
                            <img
                              src={item.url}
                              alt={item.title || item.fileName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}

                          {/* Selected Checkmark Overlay */}
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full p-1 shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}

                          {/* Source Badge */}
                          <div className="absolute top-1.5 left-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[9px] font-mono text-white capitalize">
                              {item.source}
                            </span>
                          </div>
                        </div>

                        {/* Title & Info Bar */}
                        <div className="p-2 space-y-0.5">
                          <p className="text-[11px] font-semibold text-foreground truncate" title={item.title || item.fileName}>
                            {item.title || item.fileName}
                          </p>
                          <p className="text-[9px] text-muted-foreground truncate font-mono">
                            {item.fileName}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: UPLOAD LOCAL */}
          <TabsContent value="upload" className="m-0 p-6 space-y-4 flex-1 flex flex-col justify-center">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileUpload(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-border hover:border-primary/60 rounded-2xl p-10 text-center transition-all bg-muted/10 flex flex-col items-center justify-center gap-3 cursor-pointer"
            >
              <input
                type="file"
                id="universal-local-upload-input"
                multiple={allowMultiple}
                accept={
                  acceptedTypes === "pdf"
                    ? "application/pdf,.pdf"
                    : acceptedTypes === "image"
                    ? "image/jpeg,image/jpg,image/png,image/webp,image/tiff,image/heic,image/heif,image/heic-sequence,.heic,.heics"
                    : "*/*"
                }
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={uploading}
                className="hidden"
              />
              <label
                htmlFor="universal-local-upload-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-3 w-full"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  {uploading ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <UploadCloud className="w-7 h-7" />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {uploading ? uploadProgress : "Click to select or drag & drop files here"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {acceptedTypes === "pdf"
                      ? "Supports PDF Exhibition Monographs & Curatorial Brochures."
                      : acceptedTypes === "image"
                      ? "Supports High-Res JPG, PNG, WebP, and Apple HEIC/HEICS."
                      : "Supports Archival Images (JPG, PNG, WebP) and PDF Documents."}
                  </p>
                  <p className="text-[11px] font-mono text-primary pt-1">
                    Authentic client filename will be preserved across Excel catalogs &amp; metadata.
                  </p>
                </div>
              </label>
            </div>
          </TabsContent>

          {/* TAB 3: REMOTE URL */}
          <TabsContent value="url" className="m-0 p-6 space-y-4 flex-1 flex flex-col justify-center">
            <form onSubmit={handleConfirmRemoteUrl} className="space-y-4 max-w-lg mx-auto w-full">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Direct Asset URL *
                </label>
                <Input
                  required
                  placeholder="https://images.unsplash.com/... or /media/..."
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Asset Title / Label (Optional)
                </label>
                <Input
                  placeholder="e.g. High-Resolution Archival Detail"
                  value={remoteTitle}
                  onChange={(e) => setRemoteTitle(e.target.value)}
                  className="text-xs"
                />
              </div>

              {remoteUrl && (
                <div className="rounded-xl border border-border p-3 bg-muted/20 flex items-center gap-3">
                  {isPdfFile(remoteUrl) ? (
                    <div className="w-12 h-12 rounded bg-rose-950/20 text-rose-500 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  ) : (
                    <img
                      src={remoteUrl}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded border border-border/80 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {remoteTitle || remoteUrl.split("/").pop()}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate font-mono">
                      {remoteUrl}
                    </p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={!remoteUrl.trim()}
                className="w-full text-xs font-semibold"
              >
                <FileCheck2 className="w-4 h-4 mr-1.5" />
                Attach Remote URL
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Footer with Multi-Select Action or Cancel */}
        <DialogFooter className="px-6 py-3 border-t border-border/60 bg-muted/20 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {allowMultiple && selectedItems.length > 0
              ? `${selectedItems.length} asset(s) ready to insert`
              : "Click any asset to immediately select and attach"}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>

            {allowMultiple && (
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={selectedItems.length === 0}
                onClick={handleConfirmMultiple}
                className="text-xs font-semibold"
              >
                Insert {selectedItems.length} Assets
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
