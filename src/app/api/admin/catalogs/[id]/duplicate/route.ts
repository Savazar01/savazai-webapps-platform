import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function checkAdminAuth(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers().catch(() => req.headers),
  });
  if (!session || !session.user) {
    return null;
  }
  return session;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAdminAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const sourceCatalog = await prisma.eCatalog.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { orderIndex: "asc" },
        },
        customPages: {
          orderBy: { pageNumber: "asc" },
        },
      },
    });

    if (!sourceCatalog) {
      return NextResponse.json({ error: "Catalog not found" }, { status: 404 });
    }

    // Generate unique slug
    const baseSlug = `${sourceCatalog.slug}-copy`;
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.eCatalog.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    const nextSortOrder = (sourceCatalog.sortOrder || 0) + 1;

    // Deep duplicate catalog, plates, and custom pages inside an atomic operation
    const newCatalog = await prisma.eCatalog.create({
      data: {
        title: `${sourceCatalog.title} (Copy)`,
        slug: uniqueSlug,
        subtitle: sourceCatalog.subtitle,
        curatorNote: sourceCatalog.curatorNote,
        curatorialEssay: sourceCatalog.curatorialEssay,
        forewordBy: sourceCatalog.forewordBy,
        coverImage: sourceCatalog.coverImage,
        coverImageUrl: sourceCatalog.coverImageUrl,
        pdfUrl: sourceCatalog.pdfUrl,
        downloadablePdfUrl: sourceCatalog.downloadablePdfUrl,
        themeColor: sourceCatalog.themeColor,
        orientation: sourceCatalog.orientation,
        pageSize: sourceCatalog.pageSize,
        plateLayout: sourceCatalog.plateLayout,
        plateRatio: sourceCatalog.plateRatio,
        themeConfig: sourceCatalog.themeConfig ? (sourceCatalog.themeConfig as Prisma.InputJsonValue) : Prisma.DbNull,
        coverConfig: sourceCatalog.coverConfig ? (sourceCatalog.coverConfig as Prisma.InputJsonValue) : Prisma.DbNull,
        essayConfig: sourceCatalog.essayConfig ? (sourceCatalog.essayConfig as Prisma.InputJsonValue) : Prisma.DbNull,
        curatorialConfig: sourceCatalog.curatorialConfig ? (sourceCatalog.curatorialConfig as Prisma.InputJsonValue) : Prisma.DbNull,
        magazineConfig: sourceCatalog.magazineConfig ? (sourceCatalog.magazineConfig as Prisma.InputJsonValue) : Prisma.DbNull,
        endPageConfig: sourceCatalog.endPageConfig ? (sourceCatalog.endPageConfig as Prisma.InputJsonValue) : Prisma.DbNull,
        eventId: sourceCatalog.eventId,
        introSections: sourceCatalog.introSections ? (sourceCatalog.introSections as Prisma.InputJsonValue) : Prisma.DbNull,
        isPublished: false, // Draft until explicitly published
        isActive: true,
        isDeleted: false,
        showOnHomepage: false,
        sortOrder: nextSortOrder,
        downloadEnabled: sourceCatalog.downloadEnabled,
        items: {
          create: sourceCatalog.items.map((item) => ({
            artworkId: item.artworkId,
            orderIndex: item.orderIndex,
            pageNumber: item.pageNumber,
            customNote: item.customNote,
            curatorialNote: item.curatorialNote,
            highlightPlate: item.highlightPlate,
            plateLayout: item.plateLayout,
            plateRatio: item.plateRatio,
            customTitle: item.customTitle,
            customSubtitle: item.customSubtitle,
            showPlateNumber: item.showPlateNumber,
          })),
        },
        customPages: {
          create: sourceCatalog.customPages.map((page) => ({
            pageNumber: page.pageNumber,
            title: page.title,
            subtitle: page.subtitle,
            layoutType: page.layoutType,
            pageLayout: page.pageLayout,
            contentHtml: page.contentHtml,
            sections: page.sections ? (page.sections as Prisma.InputJsonValue) : Prisma.DbNull,
            segments: page.segments ? (page.segments as Prisma.InputJsonValue) : Prisma.DbNull,
            matrixRows: page.matrixRows,
            matrixCols: page.matrixCols,
            rowHeights: page.rowHeights,
            colWidths: page.colWidths,
            hasHeader: page.hasHeader,
            headerHtml: page.headerHtml,
            hasFooter: page.hasFooter,
            footerHtml: page.footerHtml,
            verticalSpineMode: page.verticalSpineMode,
            verticalSpineHtml: page.verticalSpineHtml,
            verticalSpineWidth: page.verticalSpineWidth,
            backgroundType: page.backgroundType,
            backgroundColor: page.backgroundColor,
            backgroundPattern: page.backgroundPattern,
            patternOpacity: page.patternOpacity,
            backgroundImage: page.backgroundImage,
            overlayOpacity: page.overlayOpacity,
            frameStyle: page.frameStyle,
            pageConfig: page.pageConfig ? (page.pageConfig as Prisma.InputJsonValue) : Prisma.DbNull,
          })),
        },
      },
      include: {
        event: true,
        _count: {
          select: {
            items: true,
            customPages: true,
          },
        },
      },
    });

    revalidatePath("/admin/catalogs");
    revalidatePath("/catalogs");

    return NextResponse.json(newCatalog, { status: 201 });
  } catch (error: unknown) {
    console.error("[API_ADMIN_CATALOG_DUPLICATE_ERROR]:", error);
    const message = error instanceof Error ? error.message : "Error duplicating catalog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
