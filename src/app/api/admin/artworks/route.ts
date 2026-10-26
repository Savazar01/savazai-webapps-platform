import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateAndStoreArtworkQR } from "@/lib/qr";
import { getServerBaseUrl } from "@/lib/get-base-url";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const isAvailable = searchParams.get("isAvailable");
    const isFeatured = searchParams.get("isFeatured");
    const q = searchParams.get("q");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isDeleted: false };

    if (categoryId && categoryId !== "ALL") {
      where.categoryId = categoryId;
    }

    if (isAvailable !== null && isAvailable !== undefined && isAvailable !== "") {
      where.isAvailable = isAvailable === "true";
    }

    if (isFeatured !== null && isFeatured !== undefined && isFeatured !== "") {
      where.isFeatured = isFeatured === "true";
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { medium: { contains: q, mode: "insensitive" } },
        { materials: { contains: q, mode: "insensitive" } },
        { surface: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const artworks = await prisma.artwork.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        category: true,
        _count: {
          select: {
            events: true,
            leads: true,
          },
        },
      },
    });

    return NextResponse.json(artworks);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching artworks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (!title || !slug || !categoryId || !primaryImageUrl) {
      return NextResponse.json(
        { error: "Title, slug, category, and primary image are required" },
        { status: 400 }
      );
    }

    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-");

    const existing = await prisma.artwork.findFirst({
      where: { slug: cleanSlug, isDeleted: false },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An artwork with this URL slug already exists" },
        { status: 409 }
      );
    }

    // Auto-generate high-res Exhibition QR Code pointing to /artwork/[slug]?qr=true
    const baseUrl = await getServerBaseUrl(request);
    await generateAndStoreArtworkQR(cleanSlug, baseUrl).catch((err) => {
      console.warn("QR generation background notice:", err);
    });

    const resolvedMaterials = (materials ?? medium ?? "Natural pigments, shell gold, semi-precious stones").trim();
    const resolvedSurface = surface?.trim() || null;
    const resolvedLegacyMedium = resolvedMaterials
      ? resolvedSurface
        ? `${resolvedMaterials} on ${resolvedSurface}`
        : resolvedMaterials
      : medium || "Gold Foil, Teakwood, Semi-Precious Gemstones";

    const artwork = await prisma.artwork.create({
      data: {
        title,
        slug: cleanSlug,
        categoryId,
        description: description || "",
        dimensions: dimensions || "24 x 36 inches",
        medium: resolvedLegacyMedium,
        materials: resolvedMaterials || null,
        surface: resolvedSurface,
        yearCreated: parseInt(yearCreated, 10) || new Date().getFullYear(),
        hasGoldFoil: !!hasGoldFoil,
        goldPurity: hasGoldFoil && goldPurity?.trim() ? goldPurity.trim() : null,
        customFoilLabel: hasGoldFoil && customFoilLabel?.trim() ? customFoilLabel.trim() : null,
        price: price ? parseFloat(price) : null,
        currency: body.currency || "INR",
        isAvailable: isAvailable !== undefined ? !!isAvailable : true,
        isFeatured: !!isFeatured,
        isActive: isActive !== undefined ? !!isActive : true,
        showOnHomepage: showOnHomepage !== undefined ? !!showOnHomepage : false,
        sortOrder: sortOrder !== undefined ? parseInt(String(sortOrder), 10) : 0,
        primaryImageUrl,
        watermarkedWebpUrl: watermarkedWebpUrl || primaryImageUrl,
        protectedS3Key: protectedS3Key || null,
        originalFileName: originalFileName || null,
        watermarkOverride: !!watermarkOverride,
        customWatermark: customWatermark || null,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(artwork, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating artwork";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
