"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  UploadCloud,
  Code2,
  Image as ImageIcon,
  Quote,
  Eye,
  FileText,
  Minus,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TiptapEditor } from "@/components/builder/tiptap-editor";
import { TiptapRenderer } from "@/components/public/tiptap-renderer";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AiAssistantModal } from "@/components/admin/ai-assistant-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditablePageHeader } from "@/components/admin/editable-page-header";
import { optimizeImageForWebpUpload } from "@/lib/client-image-optimizer";


interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageUrl: string | null;
  author: string;
  tags: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  structuredJsonLd: Record<string, unknown> | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = React.useState<BlogPostItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingPost, setEditingPost] = React.useState<BlogPostItem | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editorMode, setEditorMode] = React.useState<"VISUAL" | "RAW">("VISUAL");
  const [activeTab, setActiveTab] = React.useState<string>("content");

  // Delete Confirmation State
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [targetDeletePost, setTargetDeletePost] = React.useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = React.useState(false);


  // Form State
  const [editorInstance, setEditorInstance] = React.useState<import("@tiptap/react").Editor | null>(null);
  const [formData, setFormData] = React.useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featuredImageUrl: "",
    author: "Atelier Author",
    tags: "Archival Preservation, Curatorial Research, Fine Art",
    metaTitle: "",
    metaDescription: "",
    isPublished: false,
  });

  const fetchPosts = React.useCallback(() => {
    const url = new URL("/api/admin/posts", window.location.origin);
    if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
    if (search.trim()) url.searchParams.set("search", search.trim());

    fetch(url.toString())
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPosts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load posts:", err);
        setLoading(false);
      });
  }, [statusFilter, search]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleOpenCreate = () => {
    setEditingPost(null);
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      featuredImageUrl: "",
      author: "Atelier Author",
      tags: "Archival Preservation, Curatorial Research, Fine Art",
      metaTitle: "",
      metaDescription: "",
      isPublished: false,
    });
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (post: BlogPostItem) => {
    setEditingPost(post);
    let cleanContent = post.content || "";
    const trimmed = cleanContent.trim();
    if (trimmed.startsWith("{") && trimmed.includes('"type":"doc"')) {
      try {
        let jsonStr = trimmed;
        const lastBrace = trimmed.lastIndexOf("}");
        if (lastBrace > 0) jsonStr = trimmed.slice(0, lastBrace + 1);
        const parsed = JSON.parse(jsonStr);
        if (parsed && typeof parsed === "object") {
          cleanContent = JSON.stringify(parsed);
        }
      } catch {
        // keep fallback
      }
    }

    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: cleanContent,
      featuredImageUrl: post.featuredImageUrl || "",
      author: post.author,
      tags: post.tags.join(", "),
      metaTitle: post.metaTitle || "",
      metaDescription: post.metaDescription || "",
      isPublished: post.isPublished,
    });
    setError(null);
    setModalOpen(true);
  };

  const handleAutoSlug = (titleVal: string) => {
    const slugVal = titleVal
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData((prev) => ({
      ...prev,
      title: titleVal,
      slug: editingPost ? prev.slug : slugVal,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    const file = await optimizeImageForWebpUpload(rawFile);
    setUploadingImage(true);
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
      setFormData((prev) => ({
        ...prev,
        featuredImageUrl: imgUrl,
      }));
      toast.success("Cover image uploaded without watermark!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    const file = await optimizeImageForWebpUpload(rawFile);
    setUploadingImage(true);
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

      const imgUrl = data.publicUrl || data.watermarkedUrl || data.primaryImageUrl;
      if (editorMode === "VISUAL" && editorInstance) {
        editorInstance.chain().focus().insertContent({
          type: "image",
          attrs: { src: imgUrl, alt: "Curatorial Illustration" },
        }).run();
      } else {
        const snippet = `\n\n![Curatorial Illustration](${imgUrl})\n\n`;
        setFormData((prev) => ({
          ...prev,
          content: prev.content ? `${prev.content}${snippet}` : snippet,
        }));
      }
      toast.success("Image uploaded & added to article!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Inline image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const insertQuote = () => {
    if (editorMode === "VISUAL" && editorInstance) {
      editorInstance
        .chain()
        .focus()
        .setBlockquote()
        .insertContent("Archival curation is the enduring manifestation of cultural heritage and master craftsmanship.")
        .run();
      toast.info("Callout quote block inserted");
    } else {
      const quote = `\n\n> "Archival curation is the enduring manifestation of cultural heritage and master craftsmanship."\n\n`;
      setFormData((prev) => ({ ...prev, content: `${prev.content || ""}${quote}` }));
      toast.info("Callout quote block inserted");
    }
  };

  const insertDivider = () => {
    if (editorMode === "VISUAL" && editorInstance) {
      editorInstance.chain().focus().setHorizontalRule().run();
      toast.info("Ornamental divider inserted");
    } else {
      const divider = `\n\n---\n\n`;
      setFormData((prev) => ({ ...prev, content: `${prev.content || ""}${divider}` }));
      toast.info("Ornamental divider inserted");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const isEdit = !!editingPost;
      const url = isEdit
        ? `/api/admin/posts/${editingPost.id}`
        : "/api/admin/posts";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save post");

      toast.success(isEdit ? "Article updated successfully" : "Article created successfully");
      setModalOpen(false);
      fetchPosts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving post";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string, title: string) => {
    setTargetDeletePost({ id, title });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetDeletePost) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/posts/${targetDeletePost.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Deleted article "${targetDeletePost.title}"`);
        setDeleteDialogOpen(false);
        setTargetDeletePost(null);
        fetchPosts();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to delete article");
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
      toast.error("Error deleting post");
    } finally {
      setDeleting(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <EditablePageHeader
        sectionKey="posts"
        defaultTitle="Blog & AEO Editorial Desk"
        defaultSubtitle="Publish heritage essays, technique guides, and AEO structured data optimized for Perplexity, ChatGPT & Google."
        badgeLabel="Content Engine"
      >
        <Button
          onClick={handleOpenCreate}
          variant="default"
          className="shadow-sm cursor-pointer gap-2 text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          Write Article
        </Button>
      </EditablePageHeader>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {(["ALL", "PUBLISHED", "DRAFT"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                statusFilter === tab
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs"
                  : "bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700 font-semibold"
              }`}
            >
              {tab === "ALL" ? "All Articles" : tab === "PUBLISHED" ? "Published" : "Drafts"}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search articles & tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading editorial articles...</span>
        </div>
      ) : posts.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">No Articles Published</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Publish cultural essays to boost organic discoverability and AI search engine visibility.
          </p>
          <Button onClick={handleOpenCreate} size="sm" variant="outline">
            <Plus className="w-3.5 h-3.5 mr-1" /> Write First Article
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="border border-border/80 bg-card hover:border-primary/40 transition-all hover:shadow-md flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase tracking-wider flex items-center gap-1 font-semibold ${
                      post.isPublished
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-600/40"
                        : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                    }`}
                  >
                    {post.isPublished ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5" /> Published
                      </>
                    ) : (
                      <>
                        <Clock className="w-2.5 h-2.5" /> Draft
                      </>
                    )}
                  </Badge>

                  <Badge variant="outline" className="text-[10px] flex items-center gap-1 font-semibold bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700/40">
                    <Sparkles className="w-2.5 h-2.5" /> Schema.org AEO
                  </Badge>
                </div>

                <CardTitle className="font-serif text-base font-bold text-foreground line-clamp-2">
                  {post.title}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {post.excerpt || "No excerpt provided."}
                </CardDescription>

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between pt-3 border-t border-border/60 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-primary" />
                    <span>
                      {new Date(post.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(post)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Edit Article"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(post.id, post.title)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      title="Delete Article"
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

      {/* Editor Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editingPost ? "Edit Article" : "Compose Heritage Essay"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Craft long-form cultural essays, attach high-res media, and configure generative search (AEO) metadata.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 text-xs rounded-md bg-destructive/10 border border-destructive/30 text-destructive font-medium">
                {error}
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="content" className="text-xs">
                  Article Body
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs">
                  <Eye className="w-3 h-3 mr-1" /> Live Preview
                </TabsTrigger>
                <TabsTrigger value="seo" className="text-xs">
                  SEO &amp; AEO
                </TabsTrigger>
                <TabsTrigger value="jsonld" className="text-xs">
                  <Code2 className="w-3 h-3 mr-1" /> JSON-LD
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Content */}
              <TabsContent value="content" className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Article Title *</label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => handleAutoSlug(e.target.value)}
                    placeholder="e.g. Perspectives on Modern Archival Preservation and Curatorial Documentation"
                    className="text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Slug (URL) *</label>
                    <Input
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="e.g. perspectives-on-modern-archival-preservation"
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Author</label>
                    <Input
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Cover Image */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Cover Image URL</span>
                    <label className="cursor-pointer text-[11px] text-primary hover:underline flex items-center gap-1">
                      <UploadCloud className="w-3 h-3" />
                      {uploadingImage ? "Uploading..." : "Upload via Media Vault"}
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/tiff,image/heic,image/heif,image/heic-sequence,.heic,.heics"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  </label>
                  <Input
                    value={formData.featuredImageUrl}
                    onChange={(e) => setFormData({ ...formData, featuredImageUrl: e.target.value })}
                    placeholder="https://..."
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Article Summary / Excerpt</label>
                    <AiAssistantModal
                      initialContext={formData.title}
                      onApply={(txt) => setFormData((prev) => ({ ...prev, excerpt: txt }))}
                      triggerLabel="✨ AI Excerpt"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="A brief 1-2 sentence preview for cards and search snippets..."
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                {/* Rich Visual Editor / Raw Mode with Block Inserters */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Article Body &amp; Visual Layout
                    </label>
                    <div className="flex items-center gap-1.5">
                      <AiAssistantModal
                        initialContext={formData.content}
                        onApply={(aiText) => {
                          if (editorInstance) {
                            editorInstance.chain().focus().insertContent(aiText).run();
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              content: prev.content ? `${prev.content}\n\n${aiText}` : aiText,
                            }));
                          }
                        }}
                        triggerLabel="✨ AI Assist"
                      />
                      <Button
                        type="button"
                        variant={editorMode === "VISUAL" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-[11px] gap-1 px-2 cursor-pointer font-semibold"
                        onClick={() => setEditorMode("VISUAL")}
                      >
                        <Layout className="w-3 h-3" />
                        Visual WYSIWYG
                      </Button>
                      <Button
                        type="button"
                        variant={editorMode === "RAW" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-[11px] gap-1 px-2 cursor-pointer font-semibold"
                        onClick={() => setEditorMode("RAW")}
                      >
                        <FileText className="w-3 h-3" />
                        Raw Markdown / HTML
                      </Button>
                    </div>
                  </div>

                  {/* Multi-Block Quick Inserters */}
                  <div className="p-2.5 rounded-lg border border-border/80 bg-muted/20 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Quick Block Inserters:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <label className="cursor-pointer">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border border-border bg-card hover:bg-accent hover:text-primary transition-colors cursor-pointer">
                          <ImageIcon className="w-3 h-3 text-primary" />
                          Insert Image Block
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/tiff,image/heic,image/heif,image/heic-sequence,.heic,.heics"
                          onChange={handleInlineImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={insertQuote}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border border-border bg-card hover:bg-accent hover:text-primary transition-colors cursor-pointer"
                      >
                        <Quote className="w-3 h-3 text-primary" />
                        Callout Quote
                      </button>
                      <button
                        type="button"
                        onClick={insertDivider}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border border-border bg-card hover:bg-accent hover:text-primary transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3 text-primary" />
                        Gold Divider
                      </button>
                    </div>
                  </div>

                  {/* Editor View */}
                  {editorMode === "VISUAL" ? (
                    <div className="rounded-md border border-border/80 bg-background/50 p-2 min-h-[300px]">
                      <TiptapEditor
                        content={formData.content}
                        onEditorReady={setEditorInstance}
                        onChange={(json) => {
                          setFormData((prev) => ({
                            ...prev,
                            content: JSON.stringify(json),
                          }));
                        }}
                        placeholder="Compose your article, curatorial reflection, historical analysis, or exhibition commentary..."
                      />
                    </div>
                  ) : (
                    <textarea
                      rows={12}
                      required
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Write your article body..."
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Tags (Comma-separated)</label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Fine Art, Archival, Curation, Cultural Heritage"
                    className="text-xs"
                  />
                </div>
              </TabsContent>

              {/* Tab 2: Live Preview */}
              <TabsContent value="preview" className="space-y-4">
                <div className="p-6 rounded-xl border border-border bg-card/60 space-y-6 max-h-[60vh] overflow-y-auto">
                  {formData.featuredImageUrl && (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border">
                      <img
                        src={formData.featuredImageUrl}
                        alt={formData.title || "Featured Image"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-2 border-b border-border/60 pb-4">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
                      Article Live Preview
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                      {formData.title || "Untitled Heritage Article"}
                    </h1>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                      <span>By {formData.author || "Atelier Author"}</span>
                      <span>•</span>
                      <span>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>

                  {formData.excerpt && (
                    <p className="font-serif italic text-sm text-foreground/80 border-l-2 border-primary pl-3 py-1">
                      {formData.excerpt}
                    </p>
                  )}

                  <div className="prose prose-stone dark:prose-invert max-w-none text-xs sm:text-sm">
                    <TiptapRenderer content={formData.content} />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: SEO & AEO */}
              <TabsContent value="seo" className="space-y-4">
                <div className="p-3 rounded-md bg-primary/10 border border-primary/20 text-xs text-foreground/80 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-primary">
                    <Sparkles className="w-3.5 h-3.5" /> Generative Engine Optimization (AEO)
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Structuring article headlines and descriptions with exact schema entities ensures that conversational AI engines (ChatGPT, Perplexity, Claude) accurately cite the atelier as the primary authority on fine art and cultural heritage.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Meta Title (SEO)</label>
                  <Input
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    placeholder={formData.title || "Custom search title..."}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Meta Description (SEO)</label>
                  <textarea
                    rows={3}
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    placeholder="Search engine snippet description (150-160 characters recommended)..."
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </TabsContent>

              {/* Tab 3: JSON-LD Preview */}
              <TabsContent value="jsonld" className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Live preview of the Schema.org Article payload injected into document head:
                </p>
                <pre className="p-4 rounded-md bg-muted/60 border border-border text-[11px] font-mono overflow-x-auto max-h-60 text-foreground/90">
                  {JSON.stringify(
                    {
                      "@context": "https://schema.org",
                      "@type": "Article",
                      headline: formData.metaTitle || formData.title || "Untitled Article",
                      description: formData.metaDescription || formData.excerpt || "",
                      image: formData.featuredImageUrl || undefined,
                      author: {
                        "@type": "Person",
                        name: formData.author,
                        jobTitle: "Cultural Heritage Specialist & Master Archivist",
                      },
                      keywords: formData.tags,
                      datePublished: formData.isPublished ? new Date().toISOString() : "On Publish",
                    },
                    null,
                    2
                  )}
                </pre>
              </TabsContent>
            </Tabs>

            {/* Publishing Control */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <input
                type="checkbox"
                id="isPublishedCheck"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <label htmlFor="isPublishedCheck" className="text-xs font-semibold text-foreground cursor-pointer">
                Publish this article immediately (Publicly visible on archive)
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
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
                {editingPost ? "Update Article" : "Save Article"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Article"
        description={
          targetDeletePost
            ? `Are you sure you want to delete the article "${targetDeletePost.title}"? This will permanently delete the post and its AEO schema. This action cannot be undone.`
            : "Are you sure you want to delete this article?"
        }
        confirmText="Delete Article"
        isDestructive={true}
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
