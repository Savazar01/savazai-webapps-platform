import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";
import { generateAndStoreArtworkQR } from "@/lib/qr";
import { getServerBaseUrl } from "@/lib/get-base-url";
import { sanitizeAdaptiveThemeHtml } from "@/components/public/tiptap-renderer";

export const dynamic = "force-dynamic";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseBoolean(val: unknown, defaultValue = true): boolean {
  if (val === undefined || val === null || val === "") return defaultValue;
  if (typeof val === "boolean") return val;
  const str = String(val).trim().toLowerCase();
  if (["true", "1", "yes", "y", "t", "active"].includes(str)) return true;
  if (["false", "0", "no", "n", "f", "inactive"].includes(str)) return false;
  return defaultValue;
}

function parseNumber(val: unknown): number | null {
  if (val === undefined || val === null || val === "") return null;
  const cleaned = String(val).replace(/[^0-9.-]+/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function getCellValue(row: ExcelJS.Row, colIdx?: number): string {
  if (!colIdx || colIdx < 1) return "";
  const cell = row.getCell(colIdx);
  if (!cell || cell.value === null || cell.value === undefined) return "";
  if (typeof cell.value === "object") {
    // ExcelJS cell could be RichText or Hyperlink
    if ("text" in cell.value && cell.value.text) {
      return String(cell.value.text).trim();
    }
    if ("result" in cell.value && cell.value.result !== undefined) {
      return String(cell.value.result).trim();
    }
    if ("richText" in cell.value && Array.isArray(cell.value.richText)) {
      return (cell.value.richText as Array<{ text: string }>).map((rt) => rt.text).join("").trim();
    }
  }
  return String(cell.value).trim();
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No Excel file provided for import." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json(
        { error: "Workbook contains no readable worksheets." },
        { status: 400 }
      );
    }

    // Map column headers dynamically by inspecting Row 1
    const headerRow = worksheet.getRow(1);
    const colMap: Record<string, number> = {};

    headerRow.eachCell((cell, colNumber) => {
      const headerText = String(cell.value || "").trim().toLowerCase();
      if (headerText.includes("id")) colMap["id"] = colNumber;
      else if (headerText.includes("slug")) colMap["slug"] = colNumber;
      else if (headerText.includes("title")) colMap["title"] = colNumber;
      else if (headerText.includes("file name") || headerText.includes("filename")) colMap["originalFileName"] = colNumber;
      else if (headerText.includes("sub-category") || headerText.includes("subcategory")) colMap["subCategory"] = colNumber;
      else if (headerText.includes("parent") || headerText.includes("category")) colMap["parentCategory"] = colNumber;
      else if (headerText.includes("school")) colMap["traditionalSchool"] = colNumber;
      else if (headerText.includes("year")) colMap["yearCreated"] = colNumber;
      else if (headerText.includes("material")) colMap["materials"] = colNumber;
      else if (headerText.includes("surface") || headerText.includes("support")) colMap["surface"] = colNumber;
      else if (headerText.includes("medium")) colMap["medium"] = colNumber;
      else if (headerText.includes("dimension")) colMap["dimensions"] = colNumber;
      else if (headerText.includes("has gold") || headerText.includes("gold foil")) colMap["hasGoldFoil"] = colNumber;
      else if (headerText.includes("purity") || headerText.includes("gold leaf")) colMap["goldPurity"] = colNumber;
      else if (headerText.includes("earmark") || headerText.includes("foil label") || headerText.includes("custom foil")) colMap["customFoilLabel"] = colNumber;
      else if (headerText.includes("price")) colMap["price"] = colNumber;
      else if (headerText.includes("currency")) colMap["currency"] = colNumber;
      else if (headerText.includes("available") || headerText.includes("sale")) colMap["isAvailable"] = colNumber;
      else if (headerText.includes("home") || headerText.includes("featured")) colMap["showOnHomepage"] = colNumber;
      else if (headerText.includes("public") || headerText.includes("visible") || headerText.includes("active")) colMap["isActive"] = colNumber;
      else if (headerText.includes("sort") || headerText.includes("order")) colMap["sortOrder"] = colNumber;
      else if (headerText.includes("image") || headerText.includes("url")) colMap["primaryImageUrl"] = colNumber;
      else if (headerText.includes("commentary") || headerText.includes("provenance") || headerText.includes("description")) colMap["description"] = colNumber;
    });

    if (!colMap["title"]) {
      return NextResponse.json(
        { error: "Spreadsheet must contain a 'Title' column header." },
        { status: 400 }
      );
    }

    const baseUrl = await getServerBaseUrl(request);
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ row: number; title?: string; error: string }> = [];
    const items: Array<{
      row: number;
      title: string;
      slug: string;
      action: "created" | "updated" | "skipped" | "failed";
      details: string;
    }> = [];

    const totalRows = worksheet.rowCount;

    // Cache categories to prevent duplicate lookups
    const categoryCache = new Map<string, string>(); // Name -> ID

    for (let rowNumber = 2; rowNumber <= totalRows; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const title = getCellValue(row, colMap["title"]);

      // Skip empty spacer rows
      if (!title) {
        skippedCount++;
        continue;
      }

      try {
        const idVal = getCellValue(row, colMap["id"]);
        const slugVal = getCellValue(row, colMap["slug"]);
        const parentCategoryVal = getCellValue(row, colMap["parentCategory"]) || "Tanjore";
        const subCategoryVal = getCellValue(row, colMap["subCategory"]);
        const yearCreatedVal = parseNumber(getCellValue(row, colMap["yearCreated"])) || new Date().getFullYear();
        const materialsVal = getCellValue(row, colMap["materials"]);
        const surfaceVal = getCellValue(row, colMap["surface"]);
        const rawMediumVal = getCellValue(row, colMap["medium"]);
        const resolvedMaterials = materialsVal || rawMediumVal || "22k Gold Foil, Teakwood, Semi-Precious Gemstones";
        const resolvedSurface = surfaceVal || null;
        const mediumVal = resolvedMaterials
          ? resolvedSurface
            ? `${resolvedMaterials} on ${resolvedSurface}`
            : resolvedMaterials
          : rawMediumVal || "22k Gold Foil, Teakwood, Semi-Precious Gemstones";
        const dimensionsVal = getCellValue(row, colMap["dimensions"]) || "24 x 36 inches";
        const priceVal = parseNumber(getCellValue(row, colMap["price"]));
        const currencyVal = getCellValue(row, colMap["currency"]) || "INR";
        const isAvailableVal = parseBoolean(getCellValue(row, colMap["isAvailable"]), true);
        const showOnHomepageVal = parseBoolean(getCellValue(row, colMap["showOnHomepage"]), false);
        const isActiveVal = parseBoolean(getCellValue(row, colMap["isActive"]), true);
        const sortOrderVal = Math.round(parseNumber(getCellValue(row, colMap["sortOrder"])) || 0);
        const primaryImageUrlVal = getCellValue(row, colMap["primaryImageUrl"]) || "/media/placeholder-art.jpg";
        const descriptionVal = getCellValue(row, colMap["description"]) || "";

        // Resolve Category Hierarchy
        const targetCategoryName = subCategoryVal || parentCategoryVal;
        let categoryId = categoryCache.get(targetCategoryName.toLowerCase());

        if (!categoryId) {
          // Resolve Parent Category
          let parentCat = await prisma.artCategory.findFirst({
            where: {
              name: { equals: parentCategoryVal, mode: "insensitive" },
              isDeleted: false,
            },
          });

          if (!parentCat) {
            parentCat = await prisma.artCategory.create({
              data: {
                name: parentCategoryVal,
                slug: slugify(parentCategoryVal),
                heroTitle: parentCategoryVal,
                badgeLabel: "Traditional Fine Art School",
              },
            });
          }

          if (subCategoryVal) {
            // Resolve Sub-Category
            let subCat = await prisma.artCategory.findFirst({
              where: {
                name: { equals: subCategoryVal, mode: "insensitive" },
                parentId: parentCat.id,
                isDeleted: false,
              },
            });

            if (!subCat) {
              subCat = await prisma.artCategory.create({
                data: {
                  name: subCategoryVal,
                  slug: `${slugify(parentCategoryVal)}-${slugify(subCategoryVal)}`,
                  parentId: parentCat.id,
                  heroTitle: subCategoryVal,
                  badgeLabel: `${parentCat.name} Sub-Category`,
                },
              });
            }
            categoryId = subCat.id;
            categoryCache.set(subCategoryVal.toLowerCase(), subCat.id);
          } else {
            categoryId = parentCat.id;
            categoryCache.set(parentCategoryVal.toLowerCase(), parentCat.id);
          }
        }

        const originalFileNameVal = getCellValue(row, colMap["originalFileName"]);
        const hasGoldFoilVal = colMap["hasGoldFoil"] ? parseBoolean(getCellValue(row, colMap["hasGoldFoil"])) : (mediumVal.toLowerCase().includes("gold") || title.toLowerCase().includes("gold"));
        const goldPurityVal = getCellValue(row, colMap["goldPurity"]) || (hasGoldFoilVal ? "22 Karat" : null);
        const customFoilLabelVal = getCellValue(row, colMap["customFoilLabel"]) || (hasGoldFoilVal ? "22k Gold Foil Relief" : null);

        // Identify Existing Artwork by ID, Slug, or Original File Name
        let existing = null;

        // Check ID first if it looks like a valid UUID
        if (idVal && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idVal)) {
          existing = await prisma.artwork.findUnique({
            where: { id: idVal },
          });
        }

        // If not found by ID, match by Slug
        const cleanSlug = slugVal ? slugify(slugVal) : slugify(title);
        if (!existing && cleanSlug) {
          existing = await prisma.artwork.findFirst({
            where: { slug: cleanSlug, isDeleted: false },
          });
        }

        // If not found by slug, match by Original File Name if present
        if (!existing && originalFileNameVal) {
          existing = await prisma.artwork.findFirst({
            where: {
              OR: [
                { originalFileName: { equals: originalFileNameVal, mode: "insensitive" } },
                { protectedS3Key: { endsWith: originalFileNameVal } },
                { primaryImageUrl: { contains: originalFileNameVal } },
              ],
              isDeleted: false,
            },
          });
        }

        if (existing) {
          // Update Existing Record
          await prisma.artwork.update({
            where: { id: existing.id },
            data: {
              title,
              slug: cleanSlug,
              categoryId,
              dimensions: dimensionsVal,
              medium: mediumVal,
              materials: resolvedMaterials,
              surface: resolvedSurface,
              yearCreated: yearCreatedVal,
              hasGoldFoil: hasGoldFoilVal,
              goldPurity: goldPurityVal,
              customFoilLabel: customFoilLabelVal,
              price: priceVal !== null ? priceVal : undefined,
              currency: currencyVal,
              isAvailable: isAvailableVal,
              showOnHomepage: showOnHomepageVal,
              isActive: isActiveVal,
              sortOrder: sortOrderVal,
              primaryImageUrl: primaryImageUrlVal,
              watermarkedWebpUrl: existing.watermarkedWebpUrl || primaryImageUrlVal,
              originalFileName: originalFileNameVal || undefined,
              description: descriptionVal || existing.description,
            },
          });

          updatedCount++;
          items.push({
            row: rowNumber,
            title,
            slug: cleanSlug,
            action: "updated",
            details: `Updated catalog metadata (Price: ${priceVal || "Inquire"}, School: ${targetCategoryName})`,
          });
        } else {
          // Create New Record
          let uniqueSlug = cleanSlug;
          const duplicateCheck = await prisma.artwork.findUnique({
            where: { slug: uniqueSlug },
          });
          if (duplicateCheck) {
            uniqueSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
          }

          // Generate Exhibition Floor QR Code
          await generateAndStoreArtworkQR(uniqueSlug, baseUrl).catch(() => {});

          await prisma.artwork.create({
            data: {
              title,
              slug: uniqueSlug,
              categoryId,
              dimensions: dimensionsVal,
              medium: mediumVal,
              materials: resolvedMaterials,
              surface: resolvedSurface,
              yearCreated: yearCreatedVal,
              hasGoldFoil: hasGoldFoilVal,
              goldPurity: goldPurityVal,
              customFoilLabel: customFoilLabelVal,
              price: priceVal,
              currency: currencyVal,
              isAvailable: isAvailableVal,
              showOnHomepage: showOnHomepageVal,
              isActive: isActiveVal,
              sortOrder: sortOrderVal,
              primaryImageUrl: primaryImageUrlVal,
              watermarkedWebpUrl: primaryImageUrlVal,
              originalFileName: originalFileNameVal || null,
              description: descriptionVal,
            },
          });

          createdCount++;
          items.push({
            row: rowNumber,
            title,
            slug: uniqueSlug,
            action: "created",
            details: `Created new masterwork in category '${targetCategoryName}'`,
          });
        }
      } catch (rowErr) {
        const errorMsg = rowErr instanceof Error ? rowErr.message : "Unknown row parsing error";
        errors.push({ row: rowNumber, title, error: errorMsg });
        items.push({
          row: rowNumber,
          title,
          slug: "",
          action: "failed",
          details: errorMsg,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalProcessed: createdCount + updatedCount + errors.length,
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      errors,
      items,
    });
  } catch (error: unknown) {
    console.error("[Excel Import Error]:", error);
    const message = error instanceof Error ? error.message : "Error importing Excel catalog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
