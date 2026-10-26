"use client";

import * as React from "react";
import Link from "next/link";
import {
  HardDrive,
  Search,
  Trash2,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  FileText,
  Film,
  Music,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Filter,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MediaVaultAsset } from "@/app/api/admin/media/vault/route";

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let val = bytes;
  let idx = 0;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx++;
  }
  return `${val.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function formatUsageSummary(usageCounts: Record<string, number>): string {
  const entries = Object.entries(usageCounts);
  if (entries.length === 0) return "Unlinked / Inactive";
  const parts = entries.map(([type, count]) => {
    const plural =
      count === 1
        ? type
        : type === "Category"
        ? "Categories"
        : `${type}s`;
    return `${count} ${plural}`;
  });
  return `Used in: ${parts.join(", ")}`;
}

export function MediaVaultManager() {
  const [assets, setAssets] = React.useState<MediaVaultAsset[]>([]);
  const [summary, setSummary] = React.useState({
    totalAssets: 0,
    totalSize: 0,
    linkedAssets: 0,
    orphanAssets: 0,
    orphanSize: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"ALL" | "IMAGE" | "VIDEO" | "AUDIO" | "DOC">("ALL");
  const [orphansOnly, setOrphansOnly] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"table" | "grid">("table");
  const [selectedUrls, setSelectedUrls] = React.useState<Set<string>>(new Set());
  const [copiedUrl, setCopiedUrl] = React.useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [targetDeleteUrls, setTargetDeleteUrls] = React.useState<string[]>([]);
  const [deleting, setDeleting] = React.useState(false);

  const loadVault = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media/vault");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load Media Vault");
      }
      const data = await res.json();
      setAssets(data.assets || []);
      if (data.summary) setSummary(data.summary);
      setSelectedUrls(new Set());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load Media Vault");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    fetch("/api/admin/media/vault")
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load Media Vault");
        }
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setAssets(data.assets || []);
        if (data.summary) setSummary(data.summary);
        setSelectedUrls(new Set());
      })
      .catch((err: unknown) => {
        if (!active) return;
        toast.error(err instanceof Error ? err.message : "Failed to load Media Vault");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredAssets = React.useMemo(() => {
    return assets.filter((asset) => {
      if (orphansOnly && !asset.isOrphan) return false;

      if (typeFilter === "IMAGE" && !asset.mimeType.startsWith("image/")) return false;
      if (typeFilter === "VIDEO" && !asset.mimeType.startsWith("video/")) return false;
      if (typeFilter === "AUDIO" && !asset.mimeType.startsWith("audio/")) return false;
      if (typeFilter === "DOC" && asset.mimeType !== "application/pdf") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = asset.fileName.toLowerCase().includes(q);
        const matchesFolder = asset.folder.toLowerCase().includes(q);
        const matchesMime = asset.mimeType.toLowerCase().includes(q);
        const matchesUsage = asset.usages.some(
          (u) =>
            u.title.toLowerCase().includes(q) ||
            u.entityType.toLowerCase().includes(q)
        );
        return matchesName || matchesFolder || matchesMime || matchesUsage;
      }

      return true;
    });
  }, [assets, orphansOnly, typeFilter, searchQuery]);

  const toggleSelectOne = (url: string) => {
    const next = new Set(selectedUrls);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    setSelectedUrls(next);
  };

  const toggleSelectAllVisible = () => {
    if (filteredAssets.length > 0 && filteredAssets.every((a) => selectedUrls.has(a.url))) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(filteredAssets.map((a) => a.url)));
    }
  };

  const selectAllOrphans = () => {
    const orphanUrls = assets.filter((a) => a.isOrphan).map((a) => a.url);
    setSelectedUrls(new Set(orphanUrls));
    setOrphansOnly(true);
    if (orphanUrls.length > 0) {
      toast.info(`Selected ${orphanUrls.length} unlinked asset(s).`);
    } else {
      toast.info("No unlinked orphan assets found in storage.");
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success("Asset path copied to clipboard");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const promptDelete = (urls: string[]) => {
    if (urls.length === 0) return;
    setTargetDeleteUrls(urls);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (targetDeleteUrls.length === 0) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/media/vault", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: targetDeleteUrls }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete selected assets");
      }
      toast.success(
        `Permanently deleted ${data.deletedCount} asset(s) (${formatBytes(data.freedBytes)} freed).`
      );
      setDeleteModalOpen(false);
      setTargetDeleteUrls([]);
      await loadVault();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete assets");
    } finally {
      setDeleting(false);
    }
  };

  const targetDeleteAssets = React.useMemo(
    () => assets.filter((a) => targetDeleteUrls.includes(a.url)),
    [assets, targetDeleteUrls]
  );
  const targetDeleteTotalBytes = React.useMemo(
    () => targetDeleteAssets.reduce((acc, a) => acc + a.fileSize, 0),
    [targetDeleteAssets]
  );
  const targetHasActiveLinks = React.useMemo(
    () => targetDeleteAssets.some((a) => !a.isOrphan),
    [targetDeleteAssets]
  );

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase text-muted-foreground">
                Total Vault Assets
              </p>
              <p className="text-2xl font-serif font-bold text-foreground mt-0.5">
                {summary.totalAssets}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Across /media &amp; /documents
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase text-muted-foreground">
                Storage Footprint
              </p>
              <p className="text-2xl font-serif font-bold text-foreground mt-0.5">
                {formatBytes(summary.totalSize)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                High-res masters &amp; WebP plates
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase text-muted-foreground">
                Active Linked Assets
              </p>
              <p className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {summary.linkedAssets}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Bound to Artworks, Catalogs &amp; Pages
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/40 bg-amber-500/[0.03]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase text-amber-800 dark:text-amber-300">
                Unlinked / Orphan Assets
              </p>
              <p className="text-2xl font-serif font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                {summary.orphanAssets}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {formatBytes(summary.orphanSize)} reclaimable disk space
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Asset Manager Card */}
      <Card>
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-primary" />
                Manage Media Vault &amp; Dependency Matrix
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Full-fidelity inspection of uploaded assets (dimensions, MIME type, file size, and live route references) with orphan detection and permanent cleanup.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant={orphansOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setOrphansOnly(!orphansOnly)}
                className={cn(
                  "h-8 text-xs gap-1.5 cursor-pointer",
                  orphansOnly && "bg-amber-600 hover:bg-amber-700 text-white"
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                Show Unlinked / Inactive Assets Only ({summary.orphanAssets})
              </Button>

              {summary.orphanAssets > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllOrphans}
                  className="h-8 text-xs gap-1.5 border-amber-500/40 text-amber-800 dark:text-amber-300 cursor-pointer"
                >
                  Select All Orphans
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadVault}
                disabled={loading}
                className="h-8 text-xs gap-1.5 cursor-pointer"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="pt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search filename, MIME type, or linked artwork/page..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border border-border/60">
                {(["ALL", "IMAGE", "VIDEO", "AUDIO", "DOC"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all cursor-pointer",
                      typeFilter === t
                        ? "bg-background text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              {selectedUrls.size > 0 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => promptDelete(Array.from(selectedUrls))}
                  className="h-8 text-xs gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Permanently from Storage ({selectedUrls.size})
                </Button>
              )}

              <div className="flex items-center border border-border rounded-md p-0.5 bg-background">
                <Button
                  type="button"
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-7 w-7 p-0 cursor-pointer"
                  title="Table View"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-7 w-7 p-0 cursor-pointer"
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-serif">
                Scanning media storage &amp; computing entity dependency matrix...
              </span>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <HardDrive className="w-8 h-8 text-muted-foreground/50 mx-auto" />
              <p className="text-sm font-serif font-semibold text-foreground">
                No Matching Media Assets Found
              </p>
              <p className="text-xs text-muted-foreground">
                {orphansOnly
                  ? "All media files are currently linked to active artworks, catalogs, or pages."
                  : "Try adjusting your search query or MIME type filter."}
              </p>
            </div>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredAssets.length > 0 &&
                          filteredAssets.every((a) => selectedUrls.has(a.url))
                        }
                        onChange={toggleSelectAllVisible}
                        className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="w-16">Preview</TableHead>
                    <TableHead>Asset Filename &amp; Path</TableHead>
                    <TableHead>Type &amp; Dimensions</TableHead>
                    <TableHead>Size &amp; Uploaded</TableHead>
                    <TableHead>Where Used (Dependency Matrix)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => {
                    const isImg = asset.mimeType.startsWith("image/");
                    const isVid = asset.mimeType.startsWith("video/");
                    const isAud = asset.mimeType.startsWith("audio/");
                    const isSelected = selectedUrls.has(asset.url);

                    return (
                      <TableRow
                        key={asset.id}
                        className={cn(
                          isSelected && "bg-primary/5",
                          asset.isOrphan && "bg-amber-500/[0.02]"
                        )}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(asset.url)}
                            className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="w-12 h-12 rounded-lg border border-border bg-muted/40 overflow-hidden flex items-center justify-center shrink-0">
                            {isImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={asset.url}
                                alt={asset.fileName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : isVid ? (
                              <Film className="w-5 h-5 text-blue-500" />
                            ) : isAud ? (
                              <Music className="w-5 h-5 text-amber-500" />
                            ) : (
                              <FileText className="w-5 h-5 text-primary" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5 max-w-[260px]">
                            <p
                              className="text-xs font-semibold text-foreground truncate"
                              title={asset.fileName}
                            >
                              {asset.fileName}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                              <span className="truncate" title={asset.url}>
                                {asset.url}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyUrl(asset.url)}
                                className="hover:text-primary shrink-0 cursor-pointer"
                                title="Copy asset URL"
                              >
                                {copiedUrl === asset.url ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5 text-xs">
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {asset.mimeType}
                            </Badge>
                            {asset.dimensions ? (
                              <p className="text-[11px] font-mono text-muted-foreground">
                                {asset.dimensions.width} × {asset.dimensions.height} px
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground">Non-raster / N/A</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5 text-xs">
                            <p className="font-mono font-semibold text-foreground">
                              {formatBytes(asset.fileSize)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(asset.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {asset.isOrphan ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                            >
                              Unlinked / Inactive
                            </Badge>
                          ) : (
                            <div className="space-y-1 max-w-xs">
                              <Badge
                                variant="outline"
                                className="text-[10px] border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                              >
                                {formatUsageSummary(asset.usageCounts)}
                              </Badge>
                              <div className="flex flex-wrap gap-1">
                                {asset.usages.slice(0, 3).map((u, idx) => (
                                  <Link
                                    key={`${u.entityType}-${idx}`}
                                    href={u.route || "#"}
                                    target="_blank"
                                    className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors truncate max-w-[180px]"
                                    title={`${u.entityType}: ${u.title}`}
                                  >
                                    <span className="font-mono font-semibold">{u.entityType}:</span>
                                    <span className="truncate">{u.title}</span>
                                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                  </Link>
                                ))}
                                {asset.usages.length > 3 && (
                                  <span className="text-[10px] text-muted-foreground font-mono px-1">
                                    +{asset.usages.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => promptDelete([asset.url])}
                            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 gap-1 cursor-pointer"
                            title="Delete Permanently from Storage"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Grid View */
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => {
                const isImg = asset.mimeType.startsWith("image/");
                const isVid = asset.mimeType.startsWith("video/");
                const isAud = asset.mimeType.startsWith("audio/");
                const isSelected = selectedUrls.has(asset.url);

                return (
                  <Card
                    key={asset.id}
                    className={cn(
                      "overflow-hidden flex flex-col justify-between transition-all",
                      isSelected && "ring-2 ring-primary border-primary",
                      asset.isOrphan && "border-amber-500/40"
                    )}
                  >
                    <div className="relative aspect-video bg-muted/40 flex items-center justify-center overflow-hidden">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(asset.url)}
                        className="absolute top-2.5 left-2.5 z-20 w-4 h-4 rounded border-border accent-primary cursor-pointer"
                      />
                      {isImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.url}
                          alt={asset.fileName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : isVid ? (
                        <Film className="w-8 h-8 text-blue-500" />
                      ) : isAud ? (
                        <Music className="w-8 h-8 text-amber-500" />
                      ) : (
                        <FileText className="w-8 h-8 text-primary" />
                      )}

                      <div className="absolute top-2 right-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] backdrop-blur-md",
                            asset.isOrphan
                              ? "bg-amber-500/90 text-white border-amber-600"
                              : "bg-emerald-600/90 text-white border-emerald-700"
                          )}
                        >
                          {asset.isOrphan ? "Unlinked" : formatUsageSummary(asset.usageCounts)}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-3 space-y-2">
                      <div>
                        <p
                          className="text-xs font-semibold text-foreground truncate"
                          title={asset.fileName}
                        >
                          {asset.fileName}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {formatBytes(asset.fileSize)}
                          {asset.dimensions
                            ? ` • ${asset.dimensions.width}×${asset.dimensions.height}px`
                            : ""}{" "}
                          • {asset.mimeType.split("/")[1]?.toUpperCase()}
                        </p>
                      </div>

                      {!asset.isOrphan && (
                        <div className="flex flex-wrap gap-1">
                          {asset.usages.slice(0, 2).map((u, idx) => (
                            <Link
                              key={idx}
                              href={u.route || "#"}
                              target="_blank"
                              className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:text-primary truncate max-w-full"
                            >
                              {u.entityType}: {u.title}
                            </Link>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-border/50">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyUrl(asset.url)}
                          className="h-7 px-2 text-[11px] gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> Copy Path
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => promptDelete([asset.url])}
                          className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10 gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permanent Storage Deletion Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-base flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              Delete Permanently from Storage
            </DialogTitle>
            <DialogDescription className="text-xs">
              You are about to permanently remove{" "}
              <strong>{targetDeleteUrls.length}</strong> asset(s) (
              <strong>{formatBytes(targetDeleteTotalBytes)}</strong>) from disk storage. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {targetHasActiveLinks && (
            <div className="p-3 rounded-lg border border-amber-500/50 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Active Dependency Warning:</strong> One or more selected files are currently referenced by an Artwork, Catalog, or Page. Deleting them may cause broken image links on public routes.
              </div>
            </div>
          )}

          <div className="max-h-40 overflow-y-auto border border-border rounded-md p-2 space-y-1 bg-muted/30">
            {targetDeleteAssets.map((a) => (
              <div key={a.url} className="flex items-center justify-between text-[11px] font-mono">
                <span className="truncate max-w-[260px]">{a.fileName}</span>
                <span className="text-muted-foreground shrink-0">{formatBytes(a.fileSize)}</span>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="gap-1.5"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              {deleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
