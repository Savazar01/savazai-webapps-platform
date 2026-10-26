import { NextRequest, NextResponse } from "next/server";
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
    const deviceFilter = (searchParams.get("device") || "ALL").trim();
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const last24hDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [allSessions, recentVisits, active24hCount] = await Promise.all([
      prisma.visitorSession.findMany({
        where: {
          lastSeenAt: { gte: sinceDate },
          ...(deviceFilter !== "ALL" ? { deviceType: deviceFilter } : {}),
        },
        orderBy: { lastSeenAt: "desc" },
        take: 300,
        include: {
          visits: {
            orderBy: { visitedAt: "desc" },
            take: 15,
          },
        },
      }),
      prisma.pageVisit.findMany({
        where: {
          visitedAt: { gte: sinceDate },
        },
        orderBy: { visitedAt: "desc" },
        take: 1500,
      }),
      prisma.visitorSession.count({
        where: {
          lastSeenAt: { gte: last24hDate },
        },
      }),
    ]);

    const filteredSessions = search
      ? allSessions.filter((s) => {
          const hay = [
            s.visitorId,
            s.country || "",
            s.region || "",
            s.city || "",
            s.deviceType,
            s.browser,
            s.os,
            s.entryPath,
            s.lastPath,
            s.referrer || "",
          ]
            .join(" ")
            .toLowerCase();
          return hay.includes(search);
        })
      : allSessions;

    const totalSessions = filteredSessions.length;
    const totalPageViews = filteredSessions.reduce((acc, s) => acc + (s.pageViews || 1), 0);
    const totalDwellMs = filteredSessions.reduce((acc, s) => acc + (s.totalDwellMs || 0), 0);
    const avgDwellSeconds =
      totalSessions > 0 ? Math.round(totalDwellMs / totalSessions / 1000) : 0;

    // Top visited pages breakdown
    const pageMap = new Map<string, { views: number; totalDwellMs: number }>();
    for (const v of recentVisits) {
      const p = v.path || "/";
      const existing = pageMap.get(p) || { views: 0, totalDwellMs: 0 };
      existing.views += 1;
      existing.totalDwellMs += v.dwellMs || 0;
      pageMap.set(p, existing);
    }
    const topPages = Array.from(pageMap.entries())
      .map(([path, stats]) => ({
        path,
        views: stats.views,
        avgDwellSeconds: stats.views > 0 ? Math.round(stats.totalDwellMs / stats.views / 1000) : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Device breakdown
    const deviceMap = new Map<string, number>();
    const browserMap = new Map<string, number>();
    const osMap = new Map<string, number>();
    const geoMap = new Map<
      string,
      { country: string; city: string; sessions: number; pageViews: number }
    >();

    for (const s of filteredSessions) {
      const dev = s.deviceType || "Desktop";
      deviceMap.set(dev, (deviceMap.get(dev) || 0) + 1);

      const br = s.browser || "Other";
      browserMap.set(br, (browserMap.get(br) || 0) + 1);

      const os = s.os || "Other";
      osMap.set(os, (osMap.get(os) || 0) + 1);

      const country = s.country || "Direct / Unresolved";
      const city = s.city || "—";
      const geoKey = `${country}::${city}`;
      const geoEntry = geoMap.get(geoKey) || {
        country,
        city,
        sessions: 0,
        pageViews: 0,
      };
      geoEntry.sessions += 1;
      geoEntry.pageViews += s.pageViews || 1;
      geoMap.set(geoKey, geoEntry);
    }

    const devices = Array.from(deviceMap.entries())
      .map(([deviceType, count]) => ({
        deviceType,
        count,
        percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const browsers = Array.from(browserMap.entries())
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count);

    const operatingSystems = Array.from(osMap.entries())
      .map(([os, count]) => ({ os, count }))
      .sort((a, b) => b.count - a.count);

    const geography = Array.from(geoMap.values())
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 12);

    return NextResponse.json({
      summary: {
        totalSessions,
        totalPageViews,
        activeLast24h: active24hCount,
        avgDwellSeconds,
      },
      topPages,
      devices,
      browsers,
      operatingSystems,
      geography,
      sessions: filteredSessions.slice(0, 120).map((s) => ({
        id: s.id,
        sessionId: s.visitorId,
        deviceType: s.deviceType,
        browser: s.browser,
        os: s.os,
        country: s.country || "Direct / Unresolved",
        region: s.region || "—",
        city: s.city || "—",
        referrer: s.referrer || "Direct",
        entryPath: s.entryPath,
        lastPath: s.lastPath,
        pageViews: s.pageViews,
        totalDwellSeconds: Math.round((s.totalDwellMs || 0) / 1000),
        startedAt: s.firstSeenAt,
        lastSeenAt: s.lastSeenAt,
        visits: s.visits.map((v) => ({
          id: v.id,
          path: v.path,
          dwellSeconds: Math.round((v.dwellMs || 0) / 1000),
          visitedAt: v.visitedAt,
        })),
      })),
    });
  } catch (error) {
    console.error("Admin analytics GET error:", error);
    return NextResponse.json(
      { error: "Failed to load visitor telemetry analytics" },
      { status: 500 }
    );
  }
}
