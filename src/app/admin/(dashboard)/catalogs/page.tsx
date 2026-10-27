"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Library,
  Plus,
  Search,
  BookOpen,
  Edit,
  Trash2,
  Calendar,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Home,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MediaUploader } from "@/components/admin/media-uploader";
import { EditablePageHeader } from "@/components/admin/editable-page-header";
import { adminFetch, unwrapRecords, AdminSessionExpiredError } from "@/lib/admin-fetch";

interface ECatalogListItem {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  coverImageUrl: string | null;
  themeColor: string;
  isPublished: boolean;
  isActive: boolean;
  showOnHomepage: boolean;
  sortOrder: number;
  downloadablePdfUrl: string | null;
  createdAt: string;
  event?: {
    id: string;
    title: string;
    venue: string;
    city: string;
    startDate: string;
  } | null;
  _count: {
    items: number;
  };
}

export default function AdminCatalogsPage() {
  const router = useRouter();
  const [catalogs, setCatalogs] = React.useState<ECatalogListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [targetCatalog, setTargetCatalog] = React.useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Duplicate State
  const [duplicatingCatalogId, setDuplicatingCatalogId] = React.useState<string | null>(null);

  // New Catalog Form State
  const [newTitle, setNewTitle] = React.useState("");
  const [newSlug, setNewSlug] = React.useState("");
  const [newSubtitle, setNewSubtitle] = React.useState("");
  const [newCoverImage, setNewCoverImage] = React.useState("");
  const [newIsActive, setNewIsActive] = React.useState(true);
  const [newShowOnHomepage, setNewShowOnHomepage] = React.useState(false);

  React.useEffect(() => {
    let ignore = false;
    adminFetch<ECatalogListItem[]>("/api/admin/catalogs")
      .then((data) => {
        if (!ignore) {
          setCatalogs(unwrapRecords<ECatalogListItem>(data, ["catalogs", "items"]));
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          if (err instanceof AdminSessionExpiredError) return;
          console.error("Failed to load catalogs:", err);
          toast.error(err instanceof Error ? err.message : "Failed to load catalogs");
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const fetchCatalogs = React.useCallback(async () => {
    try {
      const data = await adminFetch<ECatalogListItem[]>("/api/admin/catalogs");
      setCatalogs(unwrapRecords<ECatalogListItem>(data, ["catalogs", "items"]));
    } catch (err) {
      if (err instanceof AdminSessionExpiredError) return;
      console.error("Failed to refresh catalogs:", err);
      toast.error(err instanceof Error ? err.message : "Failed to refresh catalogs");
    }
  }, []);

  const handleAutoSlug = (val: string) => {
    setNewTitle(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setNewSlug(generated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSlug.trim()) {
      setError("Title and slug are required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/catalogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          slug: newSlug.trim(),
          subtitle: newSubtitle.trim() || null,
          coverImageUrl: newCoverImage || null,
          isPublished: false,
          isActive: newIsActive,
          showOnHomepage: newShowOnHomepage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create catalog");
      }

      toast.success("e-Catalog created! Opening curation studio...");
      setCreateModalOpen(false);
      router.push(`/admin/catalogs/${data.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating catalog";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (cat: ECatalogListItem) => {
    setTargetCatalog({ id: cat.id, title: cat.title });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetCatalog) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/catalogs/${targetCatalog.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete catalog");
        return;
      }
      toast.success(`Deleted catalog "${targetCatalog.title}" successfully`);
      setDeleteDialogOpen(false);
      setTargetCatalog(null);
      fetchCatalogs();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error deleting catalog");
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicateCatalog = async (cat: ECatalogListItem) => {
    try {
      setDuplicatingCatalogId(cat.id);
      const res = await fetch(`/api/admin/catalogs/${cat.id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to duplicate catalog");
        return;
      }
      toast.success(`Catalog duplicated: "${data.title}"`);
      await fetchCatalogs();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error duplicating catalog");
    } finally {
      setDuplicatingCatalogId(null);
    }
  };

  const handleToggleActive = async (cat: ECatalogListItem) => {
    const nextVal = !cat.isActive;
    setCatalogs((prev) => prev.map((c) => (c.id === cat.id ? { ...c, isActive: nextVal } : c)));
    try {
      const res = await fetch(`/api/admin/catalogs/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextVal }),
      });
      if (!res.ok) {
        setCatalogs((prev) => prev.map((c) => (c.id === cat.id ? { ...c, isActive: cat.isActive } : c)));
        toast.error("Failed to toggle catalog visibility");
      } else {
        toast.success(`"${cat.title}" is now ${nextVal ? "Active" : "Inactive"}`);
      }
    } catch {
      setCatalogs((prev) => prev.map((c) => (c.id === cat.id ? { ...c, isActive: cat.isActive } : c)));
      toast.error("Error toggling catalog visibility");
    }
  };

  const handleToggleHomepage = async (cat: ECatalogListItem) => {
    const nextVal = !cat.showOnHomepage;
    setCatalogs((prev) => prev.map((c) => (c.id === cat.id ? { ...c, showOnHomepage: nextVal } : c)));
    try {
      const res = await fetch(`/api/admin/catalogs/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnHomepage: nextVal }),
      });
      if (!res.ok) {
        setCatalogs((prev) => prev.map((c) => (c.id === cat.id ? { ...c, showOnHomepage: cat.showOnHomepage } : c)));
        toast.error("Failed to toggle catalog homepage status");
      } else {
        toast.success(`"${cat.title}" homepage status updated`);
      }
    } catch {
      setCatalogs((prev) => prev.map((c) => (c.id === cat.id ? { ...c, showOnHomepage: cat.showOnHomepage } : c)));
      toast.error("Error toggling catalog homepage status");
    }
  };

  const filtered = catalogs.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <EditablePageHeader
        sectionKey="catalogs"
        defaultTitle="Digital e-Catalogs & Booklets"
        defaultSubtitle="Curate publication-grade exhibition booklets, curatorial forewords, and fine art plates with printable PDFs."
        badgeLabel="Digital Publications"
      >
        <Button
          onClick={() => {
            setNewTitle("");
            setNewSlug("");
            setNewSubtitle("");
            setNewCoverImage("");
            setError(null);
            setCreateModalOpen(true);
          }}
          variant="default"
          className="shadow-sm cursor-pointer gap-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          Create e-Catalog
        </Button>
      </EditablePageHeader>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search catalogs by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading e-catalog editions...</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <Library className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">No Digital Catalogs Found</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Curate your first digital art exhibition catalog for prestigious showcases and collectors.
          </p>
          <Button
            onClick={() => setCreateModalOpen(true)}
            size="sm"
            variant="outline"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Create First Catalog
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((cat) => (
            <Card
              key={cat.id}
              className="border border-border/80 bg-card hover:border-primary/40 transition-all hover:shadow-md flex flex-col justify-between overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {cat.coverImageUrl ? (
                      <div className="w-14 h-18 rounded-md overflow-hidden border border-border/80 bg-background shrink-0 shadow-sm relative">
                        <img
                          src={cat.coverImageUrl}
                          alt={cat.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-18 rounded-md border border-dashed border-border bg-muted/30 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant={cat.isPublished ? "default" : "secondary"}
                          className={`text-[10px] px-1.5 py-0 h-4 font-normal ${
                            cat.isPublished ? "bg-primary/20 text-primary border-primary/30" : ""
                          }`}
                        >
                          {cat.isPublished ? "Published" : "Draft"}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {cat._count.items} Plates
                        </span>
                      </div>
                      <CardTitle className="text-sm font-serif font-bold text-foreground truncate">
                        {cat.title}
                      </CardTitle>
                      {cat.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {cat.subtitle}
                        </p>
                      )}
                      <p className="text-[10px] font-mono text-muted-foreground/80 truncate">
                        /{cat.slug}
                      </p>

                      {/* Visibility & Homepage Toggles */}
                      <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(cat)}
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                            cat.isActive
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                          }`}
                          title="Click to toggle Active status"
                        >
                          {cat.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {cat.isActive ? "Active" : "Inactive"}
                        </button>

                          <button
                            type="button"
                            onClick={() => handleToggleHomepage(cat)}
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                              cat.showOnHomepage
                                ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-600/40 hover:bg-blue-200"
                                : "bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-200 opacity-60 hover:opacity-100"
                            }`}
                            title="Click to toggle Feature on Homepage"
                          >
                            <Home className="w-3 h-3" />
                            {cat.showOnHomepage ? "On Home" : "Not on Home"}
                          </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {cat.event && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-md mb-3 border border-border/60">
                    <Calendar className="w-3 h-3 text-primary shrink-0" />
                    <span className="truncate">{cat.event.title} ({cat.event.venue}, {cat.event.city})</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/catalogs/${cat.slug}`}
                      target="_blank"
                      className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> View Reader
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateCatalog(cat)}
                      disabled={duplicatingCatalogId === cat.id}
                      className="h-7 px-2 text-xs text-foreground hover:text-primary cursor-pointer"
                      title="Duplicate Catalog"
                    >
                      {duplicatingCatalogId === cat.id ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-primary" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                      )}
                      Duplicate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/admin/catalogs/${cat.id}`)}
                      className="h-7 px-2 text-xs text-foreground hover:text-primary cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" /> Curate
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(cat)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Catalog Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-xl w-full">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Create Digital e-Catalog</DialogTitle>
            <DialogDescription className="text-xs">
              Initialize a publication volume. Curate editorial forewords, sequence plates and asset records, and export digital lookbooks.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 text-xs rounded-md bg-destructive/10 border border-destructive/30 text-destructive font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Catalog Title *</label>
              <Input
                required
                value={newTitle}
                onChange={(e) => handleAutoSlug(e.target.value)}
                placeholder="e.g. Annual Collection Volume I"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Slug (URL identifier) *</label>
              <Input
                required
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="e.g. annual-collection-volume-1"
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Subtitle / Publication Theme</label>
              <Input
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                placeholder="e.g. Curated Showcase & Comprehensive Documentation"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Publication Cover Image</label>
              <MediaUploader
                value={newCoverImage}
                onUploadComplete={(url) => setNewCoverImage(url)}
                onRemove={() => setNewCoverImage("")}
                mediaType="general"
                description="High-resolution cover image for the digital publication and downloadable PDF."
              />
            </div>

            <div className="flex items-center gap-6 pt-3 border-t border-border/50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsActive}
                  onChange={(e) => setNewIsActive(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-xs font-medium text-foreground">Active (Visible to public)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newShowOnHomepage}
                  onChange={(e) => setNewShowOnHomepage(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-xs font-medium text-foreground">Feature on Homepage</span>
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={submitting}
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                Create &amp; Open Studio
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete e-Catalog"
        description={
          targetCatalog
            ? `Are you sure you want to delete "${targetCatalog.title}"? All plate ordering and curatorial notes for this catalog will be permanently removed.`
            : "Are you sure you want to delete this catalog?"
        }
        confirmText="Delete Catalog"
        isDestructive={true}
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
