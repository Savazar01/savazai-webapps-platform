"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Clock,
  Eye,
  Users,
  Download,
  RefreshCw,
  Search,
  MapPin,
  ArrowUpRight,
  Compass,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AnalyticsData {
  summary: {
    totalSessions: number;
    totalPageViews: number;
    activeLast24h: number;
    avgDwellSeconds: number;
  };
  topPages: Array<{
    path: string;
    views: number;
    avgDwellSeconds: number;
  }>;
  devices: Array<{
    deviceType: string;
    count: number;
    percentage: number;
  }>;
  browsers: Array<{
    browser: string;
    count: number;
  }>;
  operatingSystems: Array<{
    os: string;
    count: number;
  }>;
  geography: Array<{
    country: string;
    city: string;
    sessions: number;
    pageViews: number;
  }>;
  sessions: Array<{
    id: string;
    sessionId: string;
    deviceType: string;
    browser: string;
    os: string;
    country: string;
    region: string;
    city: string;
    referrer: string;
    entryPath: string;
    lastPath: string;
    pageViews: number;
    totalDwellSeconds: number;
    startedAt: string;
    lastSeenAt: string;
  }>;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "< 1s";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

interface VisitorAnalyticsPanelProps {
  mode?: "full" | "summary";
}

export function VisitorAnalyticsPanel({ mode = "full" }: VisitorAnalyticsPanelProps) {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [days, setDays] = React.useState<number>(30);
  const [deviceFilter, setDeviceFilter] = React.useState<string>("ALL");
  const [search, setSearch] = React.useState<string>("");
  const [exporting, setExporting] = React.useState(false);

  const loadAnalytics = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        days: String(days),
        device: deviceFilter,
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load visitor analytics");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Analytics load error:", err);
    } finally {
      setLoading(false);
    }
  }, [days, deviceFilter, search]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      loadAnalytics();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadAnalytics]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/analytics/export?days=${days}`);
      if (!res.ok) throw new Error("Failed to generate Excel report");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `savazai-visitor-analytics-${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Visitor Analytics (.xlsx) downloaded!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to export Excel report"
      );
    } finally {
      setExporting(false);
    }
  };

  const summary = data?.summary || {
    totalSessions: 0,
    totalPageViews: 0,
    activeLast24h: 0,
    avgDwellSeconds: 0,
  };
  const topPages = data?.topPages || [];
  const devices = data?.devices || [];
  const browsers = data?.browsers || [];
  const geography = data?.geography || [];
  const sessions = data?.sessions || [];
  const maxPageViews = Math.max(1, ...topPages.map((p) => p.views));
  const maxGeoSessions = Math.max(1, ...geography.map((g) => g.sessions));

  const renderDeviceIcon = (deviceType: string) => {
    if (deviceType === "Mobile") return <Smartphone className="w-3.5 h-3.5" />;
    if (deviceType === "Tablet") return <Tablet className="w-3.5 h-3.5" />;
    return <Monitor className="w-3.5 h-3.5" />;
  };

  if (mode === "summary") {
    return (
      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                >
                  Visitor Telemetry Snapshot
                </Badge>
              </div>
              <CardTitle className="font-serif text-base flex items-center gap-2 mt-1">
                <Activity className="w-4 h-4 text-primary" />
                Visitor Traffic &amp; Engagement Summary
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Live 30-day visitor metrics. Open the dedicated Visitor Telemetry hub in System Settings for geographic heatmaps, route dwell, session logs, and Excel (.xlsx) exports.
              </CardDescription>
            </div>
            <Link href="/admin/settings?tab=telemetry">
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-8 text-xs gap-1.5 cursor-pointer shrink-0"
              >
                View Detailed Visitor Telemetry
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border/80 bg-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase text-muted-foreground">
                  Unique Visitors
                </p>
                <p className="text-2xl font-serif font-bold text-foreground mt-0.5">
                  {summary.totalSessions}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Last 30 days window
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase text-muted-foreground">
                  Total Page Views
                </p>
                <p className="text-2xl font-serif font-bold text-foreground mt-0.5">
                  {summary.totalPageViews}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Public routes &amp; exhibitions
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase text-muted-foreground">
                  Active Last 24 Hours
                </p>
                <p className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {summary.activeLast24h}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Recent active sessions
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase text-muted-foreground">
                  Avg. Session Dwell
                </p>
                <p className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {formatDuration(summary.avgDwellSeconds)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Engaged viewing duration
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-sm overflow-hidden">
      <CardHeader className="pb-4 border-b border-border/60 bg-muted/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
              >
                Privacy-First Telemetry Engine
              </Badge>
            </div>
            <CardTitle className="font-serif text-lg flex items-center gap-2 mt-1.5">
              <Activity className="w-5 h-5 text-primary" />
              Visitor Telemetry, Geographic Heatmap &amp; Session Analytics
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Real-time anonymous session tracking across Desktop, Mobile, and Tablet devices with route dwell telemetry and Excel (.xlsx) export.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Time Window Selector */}
            <div className="flex items-center bg-background border border-border rounded-lg p-0.5">
              {[
                { label: "7D", value: 7 },
                { label: "30D", value: 30 },
                { label: "90D", value: 90 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDays(opt.value)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer",
                    days === opt.value
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadAnalytics}
              disabled={loading}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              Refresh
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleExportExcel}
              disabled={exporting}
              className="h-8 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? "Generating .xlsx..." : "Download Analytics (.xlsx)"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border/80 bg-card flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase text-muted-foreground">
                Unique Visitor Sessions
              </p>
              <p className="text-2xl font-serif font-bold text-foreground mt-0.5">
                {summary.totalSessions}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Last {days} days window
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase text-muted-foreground">
                Total Page Views
              </p>
              <p className="text-2xl font-serif font-bold text-foreground mt-0.5">
                {summary.totalPageViews}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Public routes &amp; exhibitions
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase text-muted-foreground">
                Active Last 24 Hours
              </p>
              <p className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {summary.activeLast24h}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Recent active sessions
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase text-muted-foreground">
                Avg. Session Dwell
              </p>
              <p className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {formatDuration(summary.avgDwellSeconds)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Engaged viewing duration
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Analytics Breakdown Grid: Top Pages, Device Breakdown, Geographical Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 1. Top Visited Pages */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-primary" />
                Top Visited Routes
              </h4>
              <span className="text-[10px] font-mono text-muted-foreground">
                Views &amp; Avg Dwell
              </span>
            </div>

            {topPages.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No public route visits recorded yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {topPages.map((p) => {
                  const pct = Math.max(6, Math.round((p.views / maxPageViews) * 100));
                  return (
                    <div key={p.path} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono truncate max-w-[190px] text-foreground font-medium">
                          {p.path}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                          <strong className="text-foreground">{p.views}</strong> views •{" "}
                          {formatDuration(p.avgDwellSeconds)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Device & Browser Breakdown */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-primary" />
                Device &amp; Browser Matrix
              </h4>
              <span className="text-[10px] font-mono text-muted-foreground">
                Form Factor Share
              </span>
            </div>

            {devices.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No device telemetry available yet.
              </p>
            ) : (
              <div className="space-y-3">
                {devices.map((d) => (
                  <div key={d.deviceType} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        {renderDeviceIcon(d.deviceType)}
                        {d.deviceType}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {d.count} ({d.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 dark:bg-blue-400 transition-all"
                        style={{ width: `${Math.max(5, d.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}

                {browsers.length > 0 && (
                  <div className="pt-2 border-t border-border/60">
                    <p className="text-[10px] font-mono uppercase text-muted-foreground mb-2">
                      Browsers Detected
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {browsers.map((b) => (
                        <Badge
                          key={b.browser}
                          variant="secondary"
                          className="text-[10px] font-mono"
                        >
                          {b.browser}: {b.count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Geographical Heatmap */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" />
                Geographical Distribution
              </h4>
              <span className="text-[10px] font-mono text-muted-foreground">
                Country &amp; City
              </span>
            </div>

            {geography.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No geographical data captured yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {geography.slice(0, 7).map((g, idx) => {
                  const pct = Math.max(
                    6,
                    Math.round((g.sessions / maxGeoSessions) * 100)
                  );
                  return (
                    <div key={`${g.country}-${g.city}-${idx}`} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 truncate max-w-[190px] font-medium text-foreground">
                          <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          {g.country}
                          {g.city && g.city !== "—" ? ` • ${g.city}` : ""}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                          {g.sessions} sess • {g.pageViews} views
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Filterable Session Log Table */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Visitor Session History Log ({sessions.length})
            </h4>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by route, country, city, browser..."
                  className="pl-8 h-8 text-xs"
                />
              </div>

              <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border/60">
                {["ALL", "Desktop", "Mobile", "Tablet"].map((dev) => (
                  <button
                    key={dev}
                    type="button"
                    onClick={() => setDeviceFilter(dev)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer",
                      deviceFilter === dev
                        ? "bg-background text-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {dev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-[11px] font-mono uppercase">
                    Session &amp; Time
                  </TableHead>
                  <TableHead className="text-[11px] font-mono uppercase">
                    Device / OS / Browser
                  </TableHead>
                  <TableHead className="text-[11px] font-mono uppercase">
                    Location (Country / City)
                  </TableHead>
                  <TableHead className="text-[11px] font-mono uppercase">
                    Entry &rarr; Last Route
                  </TableHead>
                  <TableHead className="text-[11px] font-mono uppercase text-right">
                    Views &amp; Dwell
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-xs text-muted-foreground"
                    >
                      No visitor sessions match the current filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.slice(0, 25).map((s) => (
                    <TableRow key={s.id} className="text-xs">
                      <TableCell className="font-mono">
                        <div className="font-semibold text-foreground">
                          {s.sessionId.slice(0, 14)}…
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(s.lastSeenAt).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          {renderDeviceIcon(s.deviceType)}
                          <span>{s.deviceType}</span>
                          <span className="text-muted-foreground">•</span>
                          <span>{s.os}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {s.browser}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {s.country}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {s.city !== "—" ? s.city : s.region}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[11px]">
                        <div className="flex items-center gap-1 text-foreground">
                          <span className="truncate max-w-[140px]">
                            {s.entryPath}
                          </span>
                          {s.lastPath !== s.entryPath && (
                            <>
                              <ArrowUpRight className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[140px] text-primary">
                                {s.lastPath}
                              </span>
                            </>
                          )}
                        </div>
                        {s.referrer && s.referrer !== "Direct" && (
                          <div className="text-[10px] text-muted-foreground truncate max-w-[240px]">
                            Ref: {s.referrer}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <div className="font-semibold text-foreground">
                          {s.pageViews} {s.pageViews === 1 ? "view" : "views"}
                        </div>
                        <div className="text-[11px] text-amber-600 dark:text-amber-400">
                          {formatDuration(s.totalDwellSeconds)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
