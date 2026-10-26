import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const daysParam = parseInt(searchParams.get("days") || "30", 10);
    const days = Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 30;
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [sessions, visits] = await Promise.all([
      prisma.visitorSession.findMany({
        where: { lastSeenAt: { gte: sinceDate } },
        orderBy: { lastSeenAt: "desc" },
        take: 2000,
      }),
      prisma.pageVisit.findMany({
        where: { visitedAt: { gte: sinceDate } },
        orderBy: { visitedAt: "desc" },
        take: 5000,
        include: {
          session: {
            select: {
              deviceType: true,
              browser: true,
              os: true,
              country: true,
              city: true,
            },
          },
        },
      }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SavazAI WebApps Platform";
    workbook.created = new Date();

    // Sheet 1: Visitor Sessions
    const sessionSheet = workbook.addWorksheet("Visitor Sessions");
    sessionSheet.columns = [
      { header: "Last Active (UTC)", key: "lastSeenAt", width: 22 },
      { header: "First Seen (UTC)", key: "startedAt", width: 22 },
      { header: "Session ID", key: "sessionId", width: 26 },
      { header: "Country", key: "country", width: 20 },
      { header: "Region", key: "region", width: 14 },
      { header: "City", key: "city", width: 20 },
      { header: "Device Type", key: "deviceType", width: 14 },
      { header: "OS", key: "os", width: 14 },
      { header: "Browser", key: "browser", width: 14 },
      { header: "Entry Page", key: "entryPath", width: 28 },
      { header: "Last Visited Page", key: "lastPath", width: 28 },
      { header: "Total Page Views", key: "pageViews", width: 16 },
      { header: "Dwell Duration (s)", key: "dwellSeconds", width: 18 },
      { header: "Referrer", key: "referrer", width: 32 },
    ];

    const headerRow1 = sessionSheet.getRow(1);
    headerRow1.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow1.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E1B18" },
    };

    for (const s of sessions) {
      sessionSheet.addRow({
        lastSeenAt: s.lastSeenAt.toISOString().replace("T", " ").slice(0, 19),
        startedAt: s.firstSeenAt.toISOString().replace("T", " ").slice(0, 19),
        sessionId: s.visitorId,
        country: s.country || "Direct / Unresolved",
        region: s.region || "—",
        city: s.city || "—",
        deviceType: s.deviceType,
        os: s.os,
        browser: s.browser,
        entryPath: s.entryPath,
        lastPath: s.lastPath,
        pageViews: s.pageViews,
        dwellSeconds: Math.round((s.totalDwellMs || 0) / 1000),
        referrer: s.referrer || "Direct",
      });
    }

    // Sheet 2: Granular Page Visits
    const visitSheet = workbook.addWorksheet("Page Visit Log");
    visitSheet.columns = [
      { header: "Visited At (UTC)", key: "visitedAt", width: 22 },
      { header: "Session ID", key: "sessionId", width: 26 },
      { header: "Visited Path / Route", key: "path", width: 32 },
      { header: "Dwell Duration (s)", key: "dwellSeconds", width: 18 },
      { header: "Device", key: "deviceType", width: 14 },
      { header: "OS", key: "os", width: 14 },
      { header: "Browser", key: "browser", width: 14 },
      { header: "Country", key: "country", width: 20 },
      { header: "City", key: "city", width: 20 },
      { header: "Referrer", key: "referrer", width: 32 },
    ];

    const headerRow2 = visitSheet.getRow(1);
    headerRow2.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow2.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E1B18" },
    };

    for (const v of visits) {
      visitSheet.addRow({
        visitedAt: v.visitedAt.toISOString().replace("T", " ").slice(0, 19),
        sessionId: v.sessionId,
        path: v.path,
        dwellSeconds: Math.round((v.dwellMs || 0) / 1000),
        deviceType: v.session?.deviceType || "Desktop",
        os: v.session?.os || "Other",
        browser: v.session?.browser || "Other",
        country: v.session?.country || "Direct / Unresolved",
        city: v.session?.city || "—",
        referrer: v.referrer || "Direct",
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const dateStamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="savazai-visitor-analytics-${dateStamp}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Analytics Excel export error:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel analytics report" },
      { status: 500 }
    );
  }
}
