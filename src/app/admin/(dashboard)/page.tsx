import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { DashboardLayoutManager, DashboardWidgetData } from "@/components/admin/dashboard-layout-manager";
import { EditablePageHeader } from "@/components/admin/editable-page-header";
import { VisitorAnalyticsPanel } from "@/components/admin/visitor-analytics-panel";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    artworkCount,
    categoryCount,
    eventCount,
    leadCount,
    rsvpCount,
    catalogCount,
    pageCount,
    postCount,
    activeEvents,
    rawWidgets,
  ] = await Promise.all([
    prisma.artwork.count({ where: { isDeleted: false } }).catch(() => 0),
    prisma.artCategory.count({ where: { isDeleted: false } }).catch(() => 0),
    prisma.event.count({ where: { isDeleted: false } }).catch(() => 0),
    prisma.lead.count().catch(() => 0),
    prisma.eventRegistration.count().catch(() => 0),
    prisma.eCatalog.count({ where: { isDeleted: false } }).catch(() => 0),
    prisma.page.count({ where: { isDeleted: false } }).catch(() => 0),
    prisma.blogPost.count().catch(() => 0),
    prisma.event
      .findMany({
        where: { isDeleted: false },
        select: { id: true, _count: { select: { registrations: true } } },
      })
      .catch(() => []),
    prisma.dashboardWidget?.findMany
      ? prisma.dashboardWidget
          .findMany({
            where: { isArchived: false },
            orderBy: { order: "asc" },
          })
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  const eventRegistrationMap = new Map<string, number>();
  for (const e of activeEvents) {
    eventRegistrationMap.set(e.id, e._count?.registrations ?? 0);
  }

  const metricMap: Record<string, number> = {
    "count:artworks": artworkCount,
    "count:categories": categoryCount,
    "count:events": eventCount,
    "count:leads": leadCount,
    "count:event_rsvps": rsvpCount,
    "count:catalogs": catalogCount,
    "count:pages": pageCount,
    "count:posts": postCount,
  };

  const targetUrlMetricFallback: Record<string, number> = {
    "/admin/artworks": artworkCount,
    "/admin/categories": categoryCount,
    "/admin/events": eventCount,
    "/admin/leads": leadCount,
    "/admin/catalogs": catalogCount,
    "/admin/pages": pageCount,
    "/admin/posts": postCount,
  };

  let initialWidgets: DashboardWidgetData[] = [];

  if (rawWidgets && rawWidgets.length > 0) {
    initialWidgets = rawWidgets.map((w) => {
      let resolvedCount: string | number | null = null;

      if (w.metricSource && w.metricSource !== "static:manual") {
        if (w.metricSource === "count:event_specific_rsvp" && w.metricFilterId) {
          resolvedCount = eventRegistrationMap.get(w.metricFilterId) ?? 0;
        } else if (w.metricSource.startsWith("count:event_rsvps:") && w.metricFilterId) {
          resolvedCount = eventRegistrationMap.get(w.metricFilterId) ?? 0;
        } else if (metricMap[w.metricSource] !== undefined) {
          resolvedCount = metricMap[w.metricSource];
        }
      }

      if (resolvedCount === null && w.targetUrl && targetUrlMetricFallback[w.targetUrl] !== undefined) {
        resolvedCount = targetUrlMetricFallback[w.targetUrl];
      }

      const displayMetric =
        resolvedCount !== null
          ? String(resolvedCount)
          : w.metricValue || "-";

      return {
        id: w.id,
        title: w.title,
        description: w.description,
        widgetType: w.widgetType,
        metricValue: w.metricValue,
        metricSub: w.metricSub,
        targetUrl: w.targetUrl,
        iconName: w.iconName,
        metricSource: w.metricSource,
        metricFilterId: w.metricFilterId,
        order: w.order,
        isArchived: w.isArchived,
        computedMetric: displayMetric,
        computedSub: w.metricSub || "",
      };
    });
  } else {
    // Default standardized enterprise widgets
    initialWidgets = [
      {
        id: "default-1",
        title: "Catalog & Assets",
        widgetType: "STAT_CARD",
        metricSource: "count:artworks",
        targetUrl: "/admin/artworks",
        iconName: "Palette",
        order: 1,
        isArchived: false,
        computedMetric: String(artworkCount),
        computedSub: "Active catalog items",
        description: "Total cataloged inventory items across all categories",
      },
      {
        id: "default-2",
        title: "Categories & Classifications",
        widgetType: "STAT_CARD",
        metricSource: "count:categories",
        targetUrl: "/admin/categories",
        iconName: "Layers",
        order: 2,
        isArchived: false,
        computedMetric: String(categoryCount),
        computedSub: "Active categories",
        description: "Taxonomy groups and departments",
      },
      {
        id: "default-3",
        title: "Events & Showcases",
        widgetType: "STAT_CARD",
        metricSource: "count:events",
        targetUrl: "/admin/events",
        iconName: "Calendar",
        order: 3,
        isArchived: false,
        computedMetric: String(eventCount),
        computedSub: "Scheduled events",
        description: "Active exhibitions, workshops, and programs",
      },
      {
        id: "default-4",
        title: "Inbound Inquiries & Leads",
        widgetType: "STAT_CARD",
        metricSource: "count:leads",
        targetUrl: "/admin/leads",
        iconName: "Users",
        order: 4,
        isArchived: false,
        computedMetric: String(leadCount),
        computedSub: "Contact & CRM submissions",
        description: "Visitor submissions and registration inquiries",
      },
      {
        id: "default-5",
        title: "Digital e-Catalogs",
        widgetType: "STAT_CARD",
        metricSource: "count:catalogs",
        targetUrl: "/admin/catalogs",
        iconName: "BookOpen",
        order: 5,
        isArchived: false,
        computedMetric: String(catalogCount),
        computedSub: "Published catalogs",
        description: "Interactive lookbooks and digital publications",
      },
      {
        id: "default-6",
        title: "Articles & Publications",
        widgetType: "STAT_CARD",
        metricSource: "count:posts",
        targetUrl: "/admin/posts",
        iconName: "BookOpen",
        order: 6,
        isArchived: false,
        computedMetric: String(postCount),
        computedSub: "Published posts",
        description: "Curated articles, announcements, and essays",
      },
      {
        id: "default-7",
        title: "System Health & Services",
        widgetType: "SYSTEM_STATUS",
        order: 7,
        isArchived: false,
        computedSub: "Operational",
        description: "Live configuration status of containerized services.",
      },
      {
        id: "default-8",
        title: "Quick Operations",
        widgetType: "QUICK_LINK",
        targetUrl: "/admin/artworks",
        metricSub: "Manage Core Archive Catalog",
        iconName: "Sparkles",
        order: 8,
        isArchived: false,
        description: "Direct administrative access to catalog management.",
      },
    ];
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <EditablePageHeader
          sectionKey="overview"
          defaultTitle="Welcome to SavazAI Platform Admin Panel"
          defaultSubtitle="Manage your Website and Application here to define your Web Pages, Menu, Blogs, Categories, Catalog, PDF e-Catalogs, Events, CRM Leads and tracking, System Settings and User Administration."
          badgeLabel="Administrative Overview"
          className="border-b-0 pb-0"
        >
          <Badge variant="outline" className="shrink-0 text-xs px-3 py-1 font-mono bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-semibold">
            PostgreSQL 17 :5633 • Web :3060
          </Badge>
        </EditablePageHeader>
      </div>

      {/* Dynamic Customizable Layout Manager */}
      <DashboardLayoutManager initialWidgets={initialWidgets} />

      {/* Visitor Telemetry, Analytics Dashboard & Excel Export */}
      <VisitorAnalyticsPanel />
    </div>
  );
}
