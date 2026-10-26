import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

    const page = await prisma.page.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id }] : []),
          { slug: id },
        ],
        isDeleted: false,
      },
      include: {
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            subSections: {
              orderBy: { orderIndex: "asc" },
            },
          },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching page";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    const existingPage = await prisma.page.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id }] : []),
          { slug: id },
        ],
      },
    });

    if (!existingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const resolvedId = existingPage.id;
    const body = await request.json();
    const {
      title,
      slug,
      metaDescription,
      isPublished,
      eyebrowTag,
      heroTitle,
      heroSubtitle,
      allowShare,
      config,
      isActive,
      showOnHomepage,
      sortOrder,
      sections,
    } = body;

    // Use Prisma transaction to update page and re-sync sections
    const updatedPage = await prisma.$transaction(async (tx) => {
      // 1. Update Page metadata
      const page = await tx.page.update({
        where: { id: resolvedId },
        data: {
          title,
          slug,
          metaDescription,
          isPublished,
          publishedAt: isPublished ? new Date() : null,
          eyebrowTag: eyebrowTag !== undefined ? eyebrowTag : undefined,
          heroTitle: heroTitle !== undefined ? heroTitle : undefined,
          heroSubtitle: heroSubtitle !== undefined ? heroSubtitle : undefined,
          allowShare: allowShare !== undefined ? allowShare : undefined,
          config: config !== undefined ? config : undefined,
          isActive: isActive !== undefined ? !!isActive : undefined,
          showOnHomepage: showOnHomepage !== undefined ? !!showOnHomepage : undefined,
          sortOrder: sortOrder !== undefined ? parseInt(String(sortOrder), 10) : undefined,
        },
      });

      // 2. If sections array provided, sync sections and subsections
      if (Array.isArray(sections)) {
        // Remove existing sections to ensure atomic replacement
        await tx.subSection.deleteMany({
          where: {
            section: { pageId: resolvedId },
          },
        });
        await tx.pageSection.deleteMany({
          where: { pageId: resolvedId },
        });

        // Insert incoming sections and subsections
        for (let sIdx = 0; sIdx < sections.length; sIdx++) {
          const sec = sections[sIdx];
          const newSection = await tx.pageSection.create({
            data: {
              pageId: resolvedId,
              title: sec.title !== undefined ? sec.title : `Section ${sIdx + 1}`,
              subtitle: sec.subtitle || null,
              description: sec.description || null,
              titleAlignment: sec.titleAlignment || "center",
              orderIndex: sIdx + 1,
              gridSpan: sec.gridSpan || 12,
              layoutType: sec.layoutType || "PRESET",
              matrixConfig: sec.matrixConfig ? sec.matrixConfig : undefined,
              backgroundColor: sec.backgroundColor || null,
              backgroundType: sec.backgroundType || "COLOR",
              backgroundPattern: sec.backgroundPattern || null,
              backgroundImage: sec.backgroundImage || null,
              backgroundOverlayOpacity:
                sec.backgroundOverlayOpacity !== undefined && sec.backgroundOverlayOpacity !== null
                  ? parseFloat(String(sec.backgroundOverlayOpacity))
                  : 0.5,
              customCssClass: sec.customCssClass || null,
            },
          });

          if (Array.isArray(sec.subSections)) {
            for (let subIdx = 0; subIdx < sec.subSections.length; subIdx++) {
              const sub = sec.subSections[subIdx];
              const subStyle =
                typeof sub.content === "object" && sub.content !== null
                  ? ((sub.content as Record<string, unknown>)._style as Record<string, unknown> | undefined)
                  : undefined;

              await tx.subSection.create({
                data: {
                  sectionId: newSection.id,
                  title: sub.title || `Column ${subIdx + 1}`,
                  orderIndex: subIdx + 1,
                  gridSpan: sub.gridSpan || 12,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  content: (sub.content || {}) as any,
                  backgroundType: sub.backgroundType || (subStyle?.backgroundType as string) || "COLOR",
                  backgroundPattern: sub.backgroundPattern || (subStyle?.backgroundPattern as string) || null,
                  backgroundImage: sub.backgroundImage || (subStyle?.backgroundImage as string) || null,
                  backgroundOverlayOpacity:
                    sub.backgroundOverlayOpacity !== undefined && sub.backgroundOverlayOpacity !== null
                      ? parseFloat(String(sub.backgroundOverlayOpacity))
                      : subStyle?.backgroundOverlayOpacity !== undefined && subStyle?.backgroundOverlayOpacity !== null
                      ? parseFloat(String(subStyle.backgroundOverlayOpacity))
                      : 0.5,
                },
              });
            }
          }
        }
      }

      return page;
    });

    // Revalidate public routes and admin page list so changes reflect instantly
    try {
      if (updatedPage.slug === "home" || updatedPage.slug === "index") {
        revalidatePath("/");
        revalidatePath("/(public)", "page");
      } else {
        revalidatePath(`/${updatedPage.slug}`);
        revalidatePath(`/(public)/${updatedPage.slug}`, "page");
      }
      revalidatePath("/admin/pages");
    } catch (revErr) {
      console.warn("Revalidation warning (non-fatal):", revErr);
    }

    return NextResponse.json(updatedPage);
  } catch (error: unknown) {
    console.error("Error saving page:", error);
    const message = error instanceof Error ? error.message : "Error saving page";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    const existing = await prisma.page.findFirst({
      where: {
        OR: [
          ...(isUuid ? [{ id }] : []),
          { slug: id },
        ],
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const deletedSlug = `${existing.slug}-deleted-${Date.now()}`;
    await prisma.page.update({
      where: { id: existing.id },
      data: {
        isDeleted: true,
        isActive: false,
        slug: deletedSlug,
      },
    });

    try {
      revalidatePath("/admin/pages");
      revalidatePath(`/${existing.slug}`);
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error deleting page";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
