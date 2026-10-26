import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

export const dynamic = "force-dynamic";

export interface AssetUsageRef {
  entityType: "Artwork" | "Catalog" | "Category" | "Page" | "Event" | "Blog" | "System";
  title: string;
  route?: string;
}

export interface MediaVaultAsset {
  id: string;
  url: string;
  fileName: string;
  folder: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
  dimensions: { width: number; height: number } | null;
  usages: AssetUsageRef[];
  usageCounts: Record<string, number>;
  isOrphan: boolean;
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".avif":
      return "image/avif";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".ogg":
      return "audio/ogg";
    case ".pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/") && mime !== "image/svg+xml";
}

interface DiskFileEntry {
  url: string;
  absPath: string;
  fileName: string;
  folder: string;
  size: number;
  mtime: Date;
  mimeType: string;
}

async function walkPublicDir(
  dirAbs: string,
  urlPrefix: string,
  folderLabel: string,
  results: DiskFileEntry[]
) {
  try {
    const entries = await fs.readdir(dirAbs, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(dirAbs, entry.name);
      const itemUrl = `${urlPrefix}/${entry.name}`;
      if (entry.isDirectory()) {
        await walkPublicDir(fullPath, itemUrl, `${folderLabel}/${entry.name}`, results);
      } else if (entry.isFile()) {
        try {
          const st = await fs.stat(fullPath);
          results.push({
            url: itemUrl,
            absPath: fullPath,
            fileName: entry.name,
            folder: folderLabel,
            size: st.size,
            mtime: st.mtime,
            mimeType: getMimeType(entry.name),
          });
        } catch {
          // Ignore unreadable file
        }
      }
    }
  } catch {
    // Directory may not exist yet
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const publicRoot = path.join(process.cwd(), "public");
    const diskFiles: DiskFileEntry[] = [];

    await walkPublicDir(path.join(publicRoot, "media"), "/media", "media", diskFiles);
    await walkPublicDir(path.join(publicRoot, "documents"), "/documents", "documents", diskFiles);

    // Fetch all entities that can reference media assets
    const [artworks, catalogs, categories, pages, events, blogs, settings] = await Promise.all([
      prisma.artwork.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          title: true,
          slug: true,
          primaryImageUrl: true,
          watermarkedWebpUrl: true,
          protectedS3Key: true,
          qrCodeUrl: true,
        },
      }),
      prisma.eCatalog.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          coverImageUrl: true,
          pdfUrl: true,
          downloadablePdfUrl: true,
          themeConfig: true,
          coverConfig: true,
          essayConfig: true,
          endPageConfig: true,
          customPages: true,
        },
      }),
      prisma.artCategory.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          name: true,
          slug: true,
          coverImage: true,
        },
      }),
      prisma.page.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          title: true,
          slug: true,
          config: true,
          sections: {
            select: {
              title: true,
              backgroundImage: true,
              matrixConfig: true,
              subSections: {
                select: {
                  title: true,
                  content: true,
                },
              },
            },
          },
        },
      }),
      prisma.event.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          title: true,
          slug: true,
          posterUrl: true,
          bannerImage: true,
          brochurePdfUrl: true,
          galleryImages: true,
        },
      }),
      prisma.blogPost.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          featuredImageUrl: true,
          content: true,
        },
      }),
      prisma.systemSetting.findFirst({
        select: {
          siteName: true,
          logoUrl: true,
          faviconUrl: true,
          adminConfig: true,
          emailConfig: true,
          footerConfig: true,
        },
      }),
    ]);

    // Build URL -> Usages map
    const usageMap = new Map<string, AssetUsageRef[]>();

    const addUsage = (rawUrl: string | null | undefined, ref: AssetUsageRef) => {
      if (!rawUrl || typeof rawUrl !== "string") return;
      const clean = rawUrl.split("?")[0].trim();
      if (!clean) return;
      const list = usageMap.get(clean) || [];
      if (!list.some((r) => r.entityType === ref.entityType && r.title === ref.title)) {
        list.push(ref);
        usageMap.set(clean, list);
      }
    };

    const scanJsonForMediaUrls = (obj: unknown, ref: AssetUsageRef) => {
      if (!obj) return;
      const serialized = typeof obj === "string" ? obj : JSON.stringify(obj);
      const matches = serialized.match(/\/(?:media|documents)\/[a-zA-Z0-9_\-./]+/g);
      if (matches) {
        for (const m of matches) {
          addUsage(m, ref);
        }
      }
    };

    // 1. Artworks
    for (const art of artworks) {
      const ref: AssetUsageRef = {
        entityType: "Artwork",
        title: art.title,
        route: `/artwork/${art.slug}`,
      };
      addUsage(art.primaryImageUrl, ref);
      addUsage(art.watermarkedWebpUrl, ref);
      addUsage(art.qrCodeUrl, ref);
      if (art.protectedS3Key) {
        addUsage(`/${art.protectedS3Key.replace(/^\/+/, "")}`, ref);
        addUsage(`/media/${art.protectedS3Key.replace(/^\/+/, "")}`, ref);
      }
    }

    // 2. E-Catalogs
    for (const cat of catalogs) {
      const ref: AssetUsageRef = {
        entityType: "Catalog",
        title: cat.title,
        route: `/catalogs/${cat.slug}`,
      };
      addUsage(cat.coverImage, ref);
      addUsage(cat.coverImageUrl, ref);
      addUsage(cat.pdfUrl, ref);
      addUsage(cat.downloadablePdfUrl, ref);
      scanJsonForMediaUrls(cat.themeConfig, ref);
      scanJsonForMediaUrls(cat.coverConfig, ref);
      scanJsonForMediaUrls(cat.essayConfig, ref);
      scanJsonForMediaUrls(cat.endPageConfig, ref);
      scanJsonForMediaUrls(cat.customPages, ref);
    }

    // 3. Art Categories
    for (const category of categories) {
      const ref: AssetUsageRef = {
        entityType: "Category",
        title: category.name,
        route: `/gallery?category=${category.slug}`,
      };
      addUsage(category.coverImage, ref);
    }

    // 4. Pages & Page Builder Sections
    for (const pg of pages) {
      const ref: AssetUsageRef = {
        entityType: "Page",
        title: pg.title,
        route: pg.slug === "home" ? "/" : `/${pg.slug}`,
      };
      scanJsonForMediaUrls(pg.config, ref);
      for (const sec of pg.sections) {
        addUsage(sec.backgroundImage, ref);
        scanJsonForMediaUrls(sec.matrixConfig, ref);
        for (const sub of sec.subSections) {
          scanJsonForMediaUrls(sub.content, ref);
        }
      }
    }

    // 5. Events
    for (const ev of events) {
      const ref: AssetUsageRef = {
        entityType: "Event",
        title: ev.title,
        route: `/events/${ev.slug}`,
      };
      addUsage(ev.posterUrl, ref);
      addUsage(ev.bannerImage, ref);
      addUsage(ev.brochurePdfUrl, ref);
      scanJsonForMediaUrls(ev.galleryImages, ref);
    }

    // 6. Blog Posts
    for (const post of blogs) {
      const ref: AssetUsageRef = {
        entityType: "Blog",
        title: post.title,
        route: `/blog/${post.slug}`,
      };
      addUsage(post.featuredImageUrl, ref);
      scanJsonForMediaUrls(post.content, ref);
    }

    // 7. System Settings
    if (settings) {
      const ref: AssetUsageRef = {
        entityType: "System",
        title: "System Branding & Settings",
        route: "/admin/settings",
      };
      addUsage(settings.logoUrl, ref);
      addUsage(settings.faviconUrl, ref);
      scanJsonForMediaUrls(settings.adminConfig, ref);
      scanJsonForMediaUrls(settings.emailConfig, ref);
      scanJsonForMediaUrls(settings.footerConfig, ref);
    }

    // Enrich disk files with dimensions and usage references
    const assets: MediaVaultAsset[] = await Promise.all(
      diskFiles.map(async (f) => {
        let dimensions: { width: number; height: number } | null = null;
        if (isImageMime(f.mimeType)) {
          try {
            const meta = await sharp(f.absPath).metadata();
            if (meta.width && meta.height) {
              dimensions = { width: meta.width, height: meta.height };
            }
          } catch {
            // Non-standard or corrupted image header
          }
        }

        const usages = usageMap.get(f.url) || [];
        const usageCounts: Record<string, number> = {};
        for (const u of usages) {
          usageCounts[u.entityType] = (usageCounts[u.entityType] || 0) + 1;
        }

        return {
          id: f.url,
          url: f.url,
          fileName: f.fileName,
          folder: f.folder,
          mimeType: f.mimeType,
          fileSize: f.size,
          uploadedAt: f.mtime.toISOString(),
          dimensions,
          usages,
          usageCounts,
          isOrphan: usages.length === 0,
        };
      })
    );

    // Sort newest first
    assets.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    const totalSize = assets.reduce((acc, a) => acc + a.fileSize, 0);
    const orphanCount = assets.filter((a) => a.isOrphan).length;
    const orphanSize = assets.filter((a) => a.isOrphan).reduce((acc, a) => acc + a.fileSize, 0);

    return NextResponse.json({
      assets,
      summary: {
        totalAssets: assets.length,
        totalSize,
        linkedAssets: assets.length - orphanCount,
        orphanAssets: orphanCount,
        orphanSize,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to inspect media vault";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const urls: string[] = Array.isArray(body.urls)
      ? body.urls
      : typeof body.url === "string"
      ? [body.url]
      : [];

    if (urls.length === 0) {
      return NextResponse.json({ error: "No asset URLs provided for deletion" }, { status: 400 });
    }

    const publicRoot = path.resolve(process.cwd(), "public");
    let deletedCount = 0;
    let freedBytes = 0;
    const deletedUrls: string[] = [];
    const errors: Array<{ url: string; error: string }> = [];

    for (const rawUrl of urls) {
      try {
        const cleanRel = rawUrl.split("?")[0].replace(/^\/+/, "");
        if (!cleanRel.startsWith("media/") && !cleanRel.startsWith("documents/")) {
          errors.push({ url: rawUrl, error: "Only /media and /documents assets can be deleted" });
          continue;
        }
        const resolvedAbs = path.resolve(publicRoot, cleanRel);
        if (!resolvedAbs.startsWith(publicRoot)) {
          errors.push({ url: rawUrl, error: "Invalid path traversal blocked" });
          continue;
        }

        const st = await fs.stat(resolvedAbs);
        await fs.unlink(resolvedAbs);
        deletedCount++;
        freedBytes += st.size;
        deletedUrls.push(rawUrl);
      } catch (err: unknown) {
        errors.push({
          url: rawUrl,
          error: err instanceof Error ? err.message : "File could not be deleted",
        });
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      freedBytes,
      deletedUrls,
      errors,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete media vault assets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
