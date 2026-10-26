"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

const SESSION_COOKIE_NAME = "svz_vid";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getOrCreateSessionId(): string {
  if (typeof document === "undefined") return "";
  try {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${SESSION_COOKIE_NAME}=`));
    if (match) {
      const val = decodeURIComponent(match.split("=")[1] || "").trim();
      if (val.length >= 8) return val;
    }

    const generated =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? `svz_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`
        : `svz_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

    document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(
      generated
    )}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;
    return generated;
  } catch {
    return `svz_${Date.now().toString(36)}`;
  }
}

export function VisitorTelemetryTracker() {
  const pathname = usePathname();
  const activeVisitRef = React.useRef<{
    visitId: string | null;
    sessionId: string;
    path: string;
    startedAt: number;
  } | null>(null);

  React.useEffect(() => {
    if (!pathname) return;
    // Do not track admin dashboard or API endpoints
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    const sessionId = getOrCreateSessionId();
    if (!sessionId) return;

    const flushDwellDuration = (state: {
      visitId: string | null;
      sessionId: string;
      path: string;
      startedAt: number;
    }) => {
      const dwellMs = Math.max(0, Date.now() - state.startedAt);
      if (dwellMs < 500) return;

      const payload = JSON.stringify({
        action: "dwell",
        sessionId: state.sessionId,
        visitId: state.visitId,
        path: state.path,
        dwellMs: Math.min(dwellMs, 1000 * 60 * 60), // cap at 1h per single tab view
      });

      try {
        if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon("/api/telemetry/visit", blob);
        } else {
          fetch("/api/telemetry/visit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // non-blocking telemetry
      }
    };

    // Flush previous route dwell if navigating via client router
    if (activeVisitRef.current && activeVisitRef.current.path !== pathname) {
      flushDwellDuration(activeVisitRef.current);
    }

    const startedAt = Date.now();
    const visitState = {
      visitId: null as string | null,
      sessionId,
      path: pathname,
      startedAt,
    };
    activeVisitRef.current = visitState;

    const tz =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || ""
        : "";
    const referrer = typeof document !== "undefined" ? document.referrer || "" : "";
    const screenRes =
      typeof window !== "undefined"
        ? `${window.screen.width}x${window.screen.height}`
        : "";

    fetch("/api/telemetry/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "enter",
        sessionId,
        path: pathname,
        referrer,
        timezone: tz,
        screenRes,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.visitId && activeVisitRef.current === visitState) {
          activeVisitRef.current.visitId = data.visitId;
        }
      })
      .catch(() => {});

    const handleVisibilityOrUnload = () => {
      if (document.visibilityState === "hidden" && activeVisitRef.current) {
        flushDwellDuration(activeVisitRef.current);
        // Reset start time so we don't double-count if tab becomes visible again
        activeVisitRef.current.startedAt = Date.now();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityOrUnload);
    window.addEventListener("pagehide", handleVisibilityOrUnload);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityOrUnload);
      window.removeEventListener("pagehide", handleVisibilityOrUnload);
    };
  }, [pathname]);

  return null;
}
