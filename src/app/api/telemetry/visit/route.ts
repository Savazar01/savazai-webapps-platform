import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

function parseUserAgent(ua: string): {
  deviceType: "Desktop" | "Mobile" | "Tablet";
  browser: string;
  os: string;
} {
  const s = ua || "";
  const lower = s.toLowerCase();

  let deviceType: "Desktop" | "Mobile" | "Tablet" = "Desktop";
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(s)) {
    deviceType = "Tablet";
  } else if (
    /mobile|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini|iemobile/i.test(
      s
    )
  ) {
    deviceType = "Mobile";
  }

  let browser = "Other";
  if (lower.includes("edg/")) browser = "Edge";
  else if (lower.includes("opr/") || lower.includes("opera")) browser = "Opera";
  else if (lower.includes("chrome/") && !lower.includes("edg/")) browser = "Chrome";
  else if (lower.includes("firefox/")) browser = "Firefox";
  else if (lower.includes("safari/") && !lower.includes("chrome/")) browser = "Safari";

  let os = "Other";
  if (lower.includes("windows nt")) os = "Windows";
  else if (lower.includes("iphone") || lower.includes("ipad") || lower.includes("ipod"))
    os = "iOS";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("mac os x") || lower.includes("macintosh")) os = "macOS";
  else if (lower.includes("linux")) os = "Linux";

  return { deviceType, browser, os };
}

const TIMEZONE_GEO_FALLBACK: Record<
  string,
  { country: string; region: string; city: string }
> = {
  "Asia/Kolkata": { country: "India", region: "IN", city: "Hyderabad / Mumbai" },
  "Asia/Calcutta": { country: "India", region: "IN", city: "Hyderabad / Mumbai" },
  "America/New_York": { country: "United States", region: "NY", city: "New York" },
  "America/Chicago": { country: "United States", region: "IL", city: "Chicago" },
  "America/Denver": { country: "United States", region: "CO", city: "Denver" },
  "America/Los_Angeles": { country: "United States", region: "CA", city: "Los Angeles" },
  "Europe/London": { country: "United Kingdom", region: "ENG", city: "London" },
  "Europe/Paris": { country: "France", region: "IDF", city: "Paris" },
  "Europe/Berlin": { country: "Germany", region: "BE", city: "Berlin" },
  "Asia/Dubai": { country: "United Arab Emirates", region: "DU", city: "Dubai" },
  "Asia/Singapore": { country: "Singapore", region: "SG", city: "Singapore" },
  "Asia/Tokyo": { country: "Japan", region: "13", city: "Tokyo" },
  "Australia/Sydney": { country: "Australia", region: "NSW", city: "Sydney" },
  "America/Toronto": { country: "Canada", region: "ON", city: "Toronto" },
};

function resolveGeoLocation(req: NextRequest, clientTimezone?: string): {
  country: string;
  region: string;
  city: string;
} {
  const cfCountry =
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("x-geo-country") ||
    "";
  const cfRegion =
    req.headers.get("cf-region") ||
    req.headers.get("x-vercel-ip-country-region") ||
    req.headers.get("x-geo-region") ||
    "";
  const cfCity =
    req.headers.get("cf-ipcity") ||
    req.headers.get("x-vercel-ip-city") ||
    req.headers.get("x-geo-city") ||
    "";

  if (cfCountry && cfCountry !== "XX" && cfCountry !== "T1") {
    return {
      country: decodeURIComponent(cfCountry),
      region: cfRegion ? decodeURIComponent(cfRegion) : "—",
      city: cfCity ? decodeURIComponent(cfCity) : "—",
    };
  }

  if (clientTimezone && TIMEZONE_GEO_FALLBACK[clientTimezone]) {
    return TIMEZONE_GEO_FALLBACK[clientTimezone];
  }

  if (clientTimezone && clientTimezone.includes("/")) {
    const [continent, rawCity] = clientTimezone.split("/");
    return {
      country: continent,
      region: "—",
      city: (rawCity || "").replace(/_/g, " "),
    };
  }

  return {
    country: "Direct / Unresolved",
    region: "—",
    city: "—",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const path = typeof body.path === "string" ? body.path.trim() : "/";
    const action = body.action === "dwell" ? "dwell" : "enter";

    if (!sessionId || sessionId.length < 6) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    if (action === "dwell") {
      const dwellMs =
        typeof body.dwellMs === "number" && Number.isFinite(body.dwellMs)
          ? Math.max(0, Math.min(Math.round(body.dwellMs), 3600000))
          : 0;
      const visitId = typeof body.visitId === "string" ? body.visitId : null;

      if (dwellMs > 0) {
        if (visitId) {
          await prisma.pageVisit
            .update({
              where: { id: visitId },
              data: { dwellMs: { increment: dwellMs } },
            })
            .catch(() => {});
        }
        await prisma.visitorSession
          .update({
            where: { visitorId: sessionId },
            data: {
              totalDwellMs: { increment: dwellMs },
              lastPath: path,
              lastSeenAt: new Date(),
            },
          })
          .catch(() => {});
      }

      return NextResponse.json({ ok: true });
    }

    // Action === "enter"
    const ua = req.headers.get("user-agent") || "";
    const { deviceType, browser, os } = parseUserAgent(ua);
    const forwardedFor =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const ipHash = crypto
      .createHash("sha256")
      .update(`${forwardedFor}:savaz_telemetry_salt`)
      .digest("hex")
      .slice(0, 16);

    const timezone = typeof body.timezone === "string" ? body.timezone.trim() : "";
    const referrer = typeof body.referrer === "string" ? body.referrer.trim() : "";
    const geo = resolveGeoLocation(req, timezone);

    const sessionRecord = await prisma.visitorSession.upsert({
      where: { visitorId: sessionId },
      create: {
        visitorId: sessionId,
        ipAddress: ipHash,
        deviceType,
        browser,
        os,
        userAgent: ua || null,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        referrer: referrer || null,
        entryPath: path,
        lastPath: path,
        pageViews: 1,
        totalDwellMs: 0,
      },
      update: {
        lastPath: path,
        lastSeenAt: new Date(),
        pageViews: { increment: 1 },
        country: geo.country !== "Direct / Unresolved" ? geo.country : undefined,
        city: geo.city !== "—" ? geo.city : undefined,
      },
    });

    const visitRecord = await prisma.pageVisit.create({
      data: {
        sessionId: sessionRecord.id,
        path,
        referrer: referrer || null,
        dwellMs: 0,
      },
    });

    return NextResponse.json({
      ok: true,
      visitId: visitRecord.id,
    });
  } catch (err) {
    console.error("Telemetry visit log error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
