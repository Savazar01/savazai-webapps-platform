import { NextRequest, NextResponse } from "next/server";
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

    const artwork = await prisma.artwork.findUnique({
      where: { id },
      include: {
        category: true,
        events: {
          include: {
            event: true,
          },
        },
        ragaLinks: {
          include: {
            raga: true,
          },
        },
        _count: {
          select: { leads: true },
        },
      },
    });

    if (!artwork) {
      return NextResponse.json({ error: "Artwork not found" }, { status: 404 });
    }

    return NextResponse.json(artwork);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching artwork";
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
    const body = await request.json();
    const {
      title,
      slug,
      categoryId,
      description,
      dimensions,
      medium,
      materials,
      surface,
      yearCreated,
      hasGoldFoil,
      goldPurity,
      customFoilLabel,
      price,
      isAvailable,
      isFeatured,
      isActive,
      showOnHomepage,
      sortOrder,
      primaryImageUrl,
      watermarkedWebpUrl,
      protectedS3Key,
      originalFileName,
      watermarkOverride,
      customWatermark,
    } = body;

    if (categoryId !== undefined && (!categoryId || typeof categoryId !== "string" || !categoryId.trim())) {
      return NextResponse.json(
        { error: "Category is mandatory for all artworks." },
        { status: 400 }
      );
    }

    const resolvedMaterials = materials !== undefined ? (materials?.trim() || null) : undefined;
    const resolvedSurface = surface !== undefined ? (surface?.trim() || null) : undefined;
    const resolvedMedium =
      materials !== undefined
        ? resolvedMaterials
          ? resolvedSurface
            ? `${resolvedMaterials} on ${resolvedSurface}`
            : resolvedMaterials
          : medium || ""
        : medium;

    const updated = await prisma.artwork.update({
      where: { id },
      data: {
        title,
        slug,
        categoryId,
        description,
        dimensions,
        medium: resolvedMedium,
        materials: resolvedMaterials,
        surface: resolvedSurface,
        yearCreated: yearCreated ? parseInt(yearCreated, 10) : undefined,
        hasGoldFoil: hasGoldFoil !== undefined ? !!hasGoldFoil : undefined,
        goldPurity,
        customFoilLabel: customFoilLabel !== undefined ? (customFoilLabel?.trim() ? customFoilLabel.trim() : null) : undefined,
        price: price !== undefined ? (price ? parseFloat(price) : null) : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        isAvailable: isAvailable !== undefined ? !!isAvailable : undefined,
        isFeatured: isFeatured !== undefined ? !!isFeatured : undefined,
        isActive: isActive !== undefined ? !!isActive : undefined,
        showOnHomepage: showOnHomepage !== undefined ? !!showOnHomepage : undefined,
        sortOrder: sortOrder !== undefined ? parseInt(String(sortOrder), 10) : undefined,
        primaryImageUrl,
        watermarkedWebpUrl,
        protectedS3Key,
        originalFileName: originalFileName !== undefined ? (originalFileName || null) : undefined,
        watermarkOverride: watermarkOverride !== undefined ? !!watermarkOverride : undefined,
        customWatermark: customWatermark !== undefined ? customWatermark : undefined,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating artwork";
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
    const existing = await prisma.artwork.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Artwork not found" }, { status: 404 });
    }

    const deletedSlug = `${existing.slug}-deleted-${Date.now()}`;
    await prisma.artwork.update({
      where: { id },
      data: {
        isDeleted: true,
        isActive: false,
        slug: deletedSlug,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error deleting artwork";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
