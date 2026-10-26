import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * Robust image buffer resolver:
 * Works with both local files (/media/...) and remote HTTP/HTTPS URLs (R2/S3/CDN).
 * Resizes via sharp to a lightweight 120x120 thumbnail for smooth workbook loading.
 */
async function fetchThumbnailBuffer(imageUrl: string): Promise<Buffer | null> {
  if (!imageUrl || typeof imageUrl !== "string") return null;

  try {
    let rawBuffer: Buffer | null = null;

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      const res = await fetch(imageUrl, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const arrayBuf = await res.arrayBuffer();
      rawBuffer = Buffer.from(arrayBuf);
    } else {
      // Local file in public directory
      const cleanPath = imageUrl.replace(/^\/+/, "");
      const localFilePath = path.join(process.cwd(), "public", cleanPath);
      try {
        rawBuffer = await fs.readFile(localFilePath);
      } catch {
        return null;
      }
    }

    if (!rawBuffer) return null;

    // Scale and convert to standard JPEG thumbnail
    const thumbBuffer = await sharp(rawBuffer)
      .resize(120, 120, { fit: "cover", position: "centre" })
      .jpeg({ quality: 80 })
      .toBuffer();

    return thumbBuffer;
  } catch (err) {
    console.warn(`[Excel Export] Thumbnail generation skipped for ${imageUrl}:`, err);
    return null;
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

    // Fetch all non-deleted artworks with category & parent category hierarchy
    const artworks = await prisma.artwork.findMany({
      where: { isDeleted: false },
      include: {
        category: {
          include: {
            parent: true,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SavazAI WebApps Platform";
    workbook.lastModifiedBy = session.user.name || "Curatorial Admin";
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet("Archival Artworks Catalog", {
      views: [{ state: "frozen", xSplit: 4, ySplit: 1 }],
      properties: { defaultRowHeight: 65 },
    });

    // Configure 22 Archival Columns
    worksheet.columns = [
      { header: "Thumbnail", key: "thumbnail", width: 16 },
      { header: "ID", key: "id", width: 38 },
      { header: "Slug", key: "slug", width: 26 },
      { header: "Title", key: "title", width: 34 },
      { header: "Original File Name", key: "originalFileName", width: 30 },
      { header: "Category (Parent)", key: "parentCategory", width: 24 },
      { header: "Sub-Category", key: "subCategory", width: 24 },
      { header: "Traditional School", key: "traditionalSchool", width: 22 },
      { header: "Creation Year", key: "yearCreated", width: 14 },
      { header: "Materials Used", key: "materials", width: 32 },
      { header: "Surface / Support", key: "surface", width: 24 },
      { header: "Medium", key: "medium", width: 32 },
      { header: "Dimensions", key: "dimensions", width: 20 },
      { header: "Has Gold Foil", key: "hasGoldFoil", width: 16 },
      { header: "Gold Purity", key: "goldPurity", width: 18 },
      { header: "Custom Foil Earmark", key: "customFoilLabel", width: 24 },
      { header: "Price", key: "price", width: 16 },
      { header: "Currency", key: "currency", width: 12 },
      { header: "Available for Sale", key: "isAvailable", width: 18 },
      { header: "Feature on Home", key: "showOnHomepage", width: 18 },
      { header: "Publicly Visible", key: "isActive", width: 16 },
      { header: "Sort Order", key: "sortOrder", width: 12 },
      { header: "Image URL", key: "primaryImageUrl", width: 45 },
      { header: "Artistic Commentary & Provenance", key: "description", width: 60 },
    ];

    // Format Header Row (Luxury Obsidian & Antique Gold)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 34;

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1C1814" }, // Deep Obsidian
      };
      cell.font = {
        name: "Segoe UI",
        size: 11,
        bold: true,
        color: { argb: "FFD4AF37" }, // Antique Gold
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      cell.border = {
        bottom: { style: "medium", color: { argb: "FFD4AF37" } },
        right: { style: "thin", color: { argb: "FF3A342D" } },
      };
    });

    let imagesEmbeddedCount = 0;

    // Populate data rows
    for (let i = 0; i < artworks.length; i++) {
      const art = artworks[i];
      const rowIndex = i + 2; // Row 1 is header

      const parentCatName = art.category.parent ? art.category.parent.name : art.category.name;
      const subCatName = art.category.parent ? art.category.name : "";
      const traditionalSchool = art.category.parent?.name || art.category.name;
      const originalFileName =
        art.originalFileName ||
        (art.protectedS3Key ? art.protectedS3Key.split("/").pop() : "") ||
        (art.primaryImageUrl ? art.primaryImageUrl.split("/").pop()?.split("?")[0] : "") ||
        "";

      const row = worksheet.addRow({
        thumbnail: "", // Populated via image anchor
        id: art.id,
        slug: art.slug,
        title: art.title,
        originalFileName,
        parentCategory: parentCatName,
        subCategory: subCatName,
        traditionalSchool: traditionalSchool,
        yearCreated: art.yearCreated,
        materials: art.materials || art.medium || "",
        surface: art.surface || "",
        medium: art.medium,
        dimensions: art.dimensions,
        hasGoldFoil: art.hasGoldFoil ? "TRUE" : "FALSE",
        goldPurity: art.goldPurity || "22 Karat",
        customFoilLabel: (art as { customFoilLabel?: string }).customFoilLabel || (art.hasGoldFoil ? "22k Gold Foil Relief" : ""),
        price: art.price ? Number(art.price) : null,
        currency: art.currency || "INR",
        isAvailable: art.isAvailable ? "TRUE" : "FALSE",
        showOnHomepage: art.showOnHomepage ? "TRUE" : "FALSE",
        isActive: art.isActive ? "TRUE" : "FALSE",
        sortOrder: art.sortOrder,
        primaryImageUrl: art.primaryImageUrl,
        description: art.description || "",
      });

      row.height = 65;

      // Style data cells
      row.eachCell((cell, colNumber) => {
        cell.alignment = {
          vertical: "middle",
          horizontal:
            colNumber === 1 ||
            colNumber === 9 ||
            colNumber === 12 ||
            colNumber === 15 ||
            (colNumber >= 17 && colNumber <= 20)
              ? "center"
              : "left",
          wrapText: colNumber === 4 || colNumber === 5 || colNumber === 10 || colNumber === 22,
        };
        cell.font = {
          name: "Segoe UI",
          size: 10,
          color: { argb: "FF1F2937" },
        };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFF3F4F6" } },
        };
      });

      // Embed scaled thumbnail into Column A (col 0 in 0-indexed coords)
      const targetImage = art.watermarkedWebpUrl || art.primaryImageUrl;
      if (targetImage) {
        const thumbBuffer = await fetchThumbnailBuffer(targetImage);
        if (thumbBuffer) {
          const imageId = workbook.addImage({
            buffer: thumbBuffer as unknown as ExcelJS.Buffer,
            extension: "jpeg",
          });
          worksheet.addImage(imageId, {
            tl: { col: 0.15, row: rowIndex - 0.92 },
            ext: { width: 62, height: 62 },
            editAs: "oneCell",
          });
          imagesEmbeddedCount++;
        }
      }
    }

    const fileBuffer = await workbook.xlsx.writeBuffer();
    const nodeBuffer = Buffer.from(fileBuffer);

    const filename = `savazai-artworks-catalog-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(nodeBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Total-Count": String(artworks.length),
        "X-Export-Thumbnails-Count": String(imagesEmbeddedCount),
      },
    });
  } catch (error: unknown) {
    console.error("[Excel Export Error]:", error);
    const message = error instanceof Error ? error.message : "Error exporting artworks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
