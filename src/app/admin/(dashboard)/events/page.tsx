"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  Users,
  Palette,
  ExternalLink,
  Edit2,
  Trash2,
  Loader2,
  QrCode,
  Download,
  History,
  Eye,
  EyeOff,
  Home,
  Printer,
  Copy,
} from "lucide-react";
import { ArtworkPlacardSheet, type PlacardArtwork } from "@/components/admin/artwork-placard-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getClientBaseUrl } from "@/lib/get-base-url-client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EventFormModal, EventFormData, type EventDailySchedule, type EventRsvpConfig } from "@/components/admin/event-form-modal";
import { EditablePageHeader } from "@/components/admin/editable-page-header";
import { formatEventSchedule } from "@/lib/geo-timezone";
import { formatCurrency } from "@/lib/formatters";
import { adminFetch, unwrapRecords, AdminSessionExpiredError } from "@/lib/admin-fetch";

interface ArtworkSummary {
  id: string;
  title: string;
  slug: string;
  medium: string;
  primaryImageUrl: string;
  category?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
}

interface Registration {
  id: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string | null;
  ticketCount: number;
  registeredAt: string;
}

interface EventItem {
  id: string;
  title: string;
  slug: string;
  earmarkText?: string | null;
  eventType: "WORKSHOP" | "ONLINE_CLASSROOM" | "EXHIBITION" | "CONCERT" | "RECITAL" | "PRIVATE_VIEWING" | "OTHER";
  description: string;
  venue: string;
  venueName?: string | null;
  streetAddress?: string | null;
  city: string;
  stateProvince?: string | null;
  postalCode?: string | null;
  country?: string;
  countryCode?: string | null;
  timezone: string;
  startDate: string;
  endDate?: string | null;
  posterUrl?: string | null;
  bannerImage?: string | null;
  galleryImages?: { url: string; caption?: string; title?: string; id?: string; linkType?: string; linkTarget?: string }[] | null;
  galleryDisplayMode?: string | null;
  galleryAutoplayTimer?: number | null;
  brochurePdfUrl?: string | null;
  brochureTitle?: string | null;
  brochureDownloadable?: boolean | null;
  maxCapacity: number | null;
  registrationFee: number | null;
  currency?: string;
  isRegistrationOpen: boolean;
  isPublished?: boolean;
  statusOverride?: string | null;
  isArchived?: boolean;
  isActive?: boolean;
  showOnHomepage?: boolean;
  sortOrder?: number;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  dailySchedules?: EventDailySchedule[] | null;
  rsvpConfig?: EventRsvpConfig | null;
  _count?: { registrations: number; artworks: number };
}

export default function EventsAdminPage() {
  const [events, setEvents] = React.useState<EventItem[]>([]);
  const [artworksCatalog, setArtworksCatalog] = React.useState<ArtworkSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeSegment, setActiveSegment] = React.useState<"upcoming" | "past" | "all">("upcoming");

  // Form Modal State
  const [formModalOpen, setFormModalOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<EventFormData | null>(null);

  // Attendee Viewer Modal
  const [attendeeModalOpen, setAttendeeModalOpen] = React.useState(false);
  const [attendeeEventTitle, setAttendeeEventTitle] = React.useState("");
  const [attendees, setAttendees] = React.useState<Registration[]>([]);
  const [loadingAttendees, setLoadingAttendees] = React.useState(false);

  // Delete Confirm State
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [targetDeleteEvent, setTargetDeleteEvent] = React.useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Duplicate Event State
  const [duplicatingEventId, setDuplicatingEventId] = React.useState<string | null>(null);

  // Exhibition Floor QR Modal State
  const [exhibitionQrModalOpen, setExhibitionQrModalOpen] = React.useState(false);
  const [selectedExhibitionEvent, setSelectedExhibitionEvent] = React.useState<EventItem | null>(null);
  const [exhibitionQrDataUrl, setExhibitionQrDataUrl] = React.useState<string>("");
  const [exhibitionQrTargetUrl, setExhibitionQrTargetUrl] = React.useState<string>("");
  const [exhibitionQrLoading, setExhibitionQrLoading] = React.useState(false);
  const [selectedArtworkForExhibition, setSelectedArtworkForExhibition] = React.useState<string>("");

  // Printable Placards State
  const [placardSheetOpen, setPlacardSheetOpen] = React.useState(false);
  const [eventPlacardArtworks, setEventPlacardArtworks] = React.useState<PlacardArtwork[]>([]);
  const [loadingEventPlacards, setLoadingEventPlacards] = React.useState<string | null>(null);

  React.useEffect(() => {
    let ignore = false;
    Promise.all([
      adminFetch<EventItem[]>("/api/admin/events"),
      adminFetch<ArtworkSummary[]>("/api/admin/artworks"),
    ])
      .then(([eventsData, artworksData]) => {
        if (!ignore) {
          const records = unwrapRecords<EventItem>(eventsData, ["events", "items"]);
          const artworksRecords = unwrapRecords<ArtworkSummary>(artworksData, ["artworks", "items"]);
          setEvents(records);
          setArtworksCatalog(artworksRecords);
          setLoading(false);

          // Intelligent tab segmentation:
          // If there are no upcoming events but past events exist, default to "all"
          // so the curator immediately sees the scheduled/curated events instead of an empty state.
          const now = new Date();
          const hasUpcoming = records.some((ev) => {
            if (ev.statusOverride === "FORCE_UPCOMING") return true;
            if (ev.statusOverride === "FORCE_PAST") return false;
            const compareDate = ev.endDate ? new Date(ev.endDate) : new Date(ev.startDate);
            return compareDate >= now;
          });
          if (!hasUpcoming && records.length > 0) {
            setActiveSegment("all");
          }
        }
      })
      .catch((e) => {
        if (!ignore) {
          if (e instanceof AdminSessionExpiredError) return;
          console.error("Error loading events:", e);
          toast.error(e instanceof Error ? e.message : "Error loading events");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const reloadEvents = React.useCallback(async () => {
    try {
      const [eventsData, artworksData] = await Promise.all([
        adminFetch<EventItem[]>("/api/admin/events"),
        adminFetch<ArtworkSummary[]>("/api/admin/artworks"),
      ]);
      const records = unwrapRecords<EventItem>(eventsData, ["events", "items"]);
      const artworksRecords = unwrapRecords<ArtworkSummary>(artworksData, ["artworks", "items"]);
      setEvents(records);
      setArtworksCatalog(artworksRecords);
    } catch (e) {
      if (e instanceof AdminSessionExpiredError) return;
      console.error("Error reloading events:", e);
      toast.error(e instanceof Error ? e.message : "Error reloading events");
    }
  }, []);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormModalOpen(true);
  };

  // Open Edit Modal with full data
  const handleOpenEdit = async (ev: EventItem) => {
    try {
      const res = await fetch(`/api/admin/events/${ev.id}`);
      if (res.ok) {
        const fullEvent = await res.json();
        setEditingEvent({
          id: fullEvent.id,
          title: fullEvent.title,
          slug: fullEvent.slug,
          earmarkText: fullEvent.earmarkText || "Curated Showcase & Event",
          eventType: fullEvent.eventType,
          description: fullEvent.description || "",
          venue: fullEvent.venue || fullEvent.venueName || "SavazAI Heritage Studio",
          venueName: fullEvent.venueName || fullEvent.venue || "SavazAI Heritage Studio",
          streetAddress: fullEvent.streetAddress || "",
          city: fullEvent.city || "Bengaluru",
          stateProvince: fullEvent.stateProvince || "",
          postalCode: fullEvent.postalCode || "",
          country: fullEvent.country || "India",
          countryCode: fullEvent.countryCode || "IN",
          timezone: fullEvent.timezone || "Asia/Kolkata",
          startDate: fullEvent.startDate || "",
          endDate: fullEvent.endDate || "",
          posterUrl: fullEvent.posterUrl || "",
          bannerImage: fullEvent.bannerImage || fullEvent.posterUrl || "",
          galleryImages: fullEvent.galleryImages || [],
          galleryDisplayMode: fullEvent.galleryDisplayMode || "CAROUSEL",
          galleryAutoplayTimer: fullEvent.galleryAutoplayTimer !== undefined ? fullEvent.galleryAutoplayTimer : 4,
          brochurePdfUrl: fullEvent.brochurePdfUrl || "",
          brochureTitle: fullEvent.brochureTitle || "Event Program & Publication Brochure",
          brochureDownloadable: fullEvent.brochureDownloadable !== false,
          maxCapacity: fullEvent.maxCapacity,
          registrationFee: fullEvent.registrationFee ? Number(fullEvent.registrationFee) : 0,
          currency: fullEvent.currency || "INR",
          isRegistrationOpen: fullEvent.isRegistrationOpen,
          isPublished: fullEvent.isPublished !== false,
          statusOverride: fullEvent.statusOverride || "AUTO",
          isArchived: fullEvent.isArchived === true,
          contactName: fullEvent.contactName || "",
          contactEmail: fullEvent.contactEmail || "",
          contactPhone: fullEvent.contactPhone || "",
          artworkIds: fullEvent.artworks?.map((a: { artworkId: string }) => a.artworkId) || [],
          dailySchedules: Array.isArray(fullEvent.dailySchedules) ? fullEvent.dailySchedules : [],
          rsvpConfig: fullEvent.rsvpConfig || null,
        });
      } else {
        setEditingEvent(ev as unknown as EventFormData);
      }
    } catch {
      setEditingEvent(ev as unknown as EventFormData);
    }
    setFormModalOpen(true);
  };

  // Delete Handlers
  const handleDeleteClick = (id: string, evTitle: string) => {
    setTargetDeleteEvent({ id, title: evTitle });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetDeleteEvent) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/events/${targetDeleteEvent.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Deleted event "${targetDeleteEvent.title}" successfully`);
        setDeleteDialogOpen(false);
        setTargetDeleteEvent(null);
        reloadEvents();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to delete event");
      }
    } catch {
      toast.error("Error deleting event");
    } finally {
      setDeleting(false);
    }
  };

  // Duplicate Event Handler
  const handleDuplicateEvent = async (ev: EventItem) => {
    try {
      setDuplicatingEventId(ev.id);
      const res = await fetch(`/api/admin/events/${ev.id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to duplicate event");
        return;
      }
      toast.success(`Event duplicated: "${data.title}"`);
      await reloadEvents();
      if (data && data.id) {
        handleOpenEdit(data);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error duplicating event");
    } finally {
      setDuplicatingEventId(null);
    }
  };

  // View Attendees Handler
  const handleViewAttendees = async (ev: EventItem) => {
    setAttendeeEventTitle(ev.title);
    setLoadingAttendees(true);
    setAttendeeModalOpen(true);
    try {
      const res = await fetch(`/api/admin/events/${ev.id}`);
      if (res.ok) {
        const full = await res.json();
        setAttendees(full.registrations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleToggleActive = async (ev: EventItem) => {
    const updated = !ev.isActive;
    setEvents((prev) =>
      prev.map((item) => (item.id === ev.id ? { ...item, isActive: updated } : item))
    );
    try {
      const res = await fetch(`/api/admin/events/${ev.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: updated }),
      });
      if (!res.ok) {
        throw new Error("Failed to update active state");
      }
      toast.success(updated ? "Event activated" : "Event deactivated");
    } catch {
      setEvents((prev) =>
        prev.map((item) => (item.id === ev.id ? { ...item, isActive: ev.isActive } : item))
      );
      toast.error("Failed to update active status");
    }
  };

  const handleToggleHomepage = async (ev: EventItem) => {
    const updated = !ev.showOnHomepage;
    setEvents((prev) =>
      prev.map((item) => (item.id === ev.id ? { ...item, showOnHomepage: updated } : item))
    );
    try {
      const res = await fetch(`/api/admin/events/${ev.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnHomepage: updated }),
      });
      if (!res.ok) {
        throw new Error("Failed to update homepage state");
      }
      toast.success(updated ? "Featured on homepage" : "Removed from homepage");
    } catch {
      setEvents((prev) =>
        prev.map((item) => (item.id === ev.id ? { ...item, showOnHomepage: ev.showOnHomepage } : item))
      );
      toast.error("Failed to update homepage status");
    }
  };

  // Exhibition Floor QR Handler
  const handleOpenExhibitionQR = async (ev: EventItem) => {
    setSelectedExhibitionEvent(ev);
    setSelectedArtworkForExhibition("");
    setExhibitionQrLoading(true);
    setExhibitionQrModalOpen(true);

    try {
      const host = getClientBaseUrl();
      const target = `${host}/events/${ev.slug}`;
      const res = await fetch(`/api/admin/qr?url=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (data.dataUrl) {
        setExhibitionQrDataUrl(data.dataUrl);
        setExhibitionQrTargetUrl(target);
      }
    } catch {
      toast.error("Failed to generate exhibition QR code");
    } finally {
      setExhibitionQrLoading(false);
    }
  };

  const handleArtworkQrChange = async (artSlug: string) => {
    setSelectedArtworkForExhibition(artSlug);
    if (!selectedExhibitionEvent) return;
    setExhibitionQrLoading(true);

    try {
      let fetchUrl = `/api/admin/qr?`;
      const host = getClientBaseUrl();
      if (artSlug === "") {
        fetchUrl += `url=${encodeURIComponent(`${host}/events/${selectedExhibitionEvent.slug}`)}`;
      } else {
        fetchUrl += `slug=${encodeURIComponent(artSlug)}&eventId=${encodeURIComponent(selectedExhibitionEvent.slug)}&origin=${encodeURIComponent(host)}`;
      }
      const res = await fetch(fetchUrl);
      const data = await res.json();
      if (data.dataUrl) {
        setExhibitionQrDataUrl(data.dataUrl);
        setExhibitionQrTargetUrl(data.targetUrl || "");
      }
    } catch {
      toast.error("Failed to generate exhibition artwork QR");
    } finally {
      setExhibitionQrLoading(false);
    }
  };

  // Cross-Module Printable Placards Handler
  const handlePrintEventPlacards = async (ev: EventItem) => {
    try {
      setLoadingEventPlacards(ev.id);
      const res = await fetch(`/api/admin/events/${ev.id}`);
      if (!res.ok) throw new Error("Failed to load event artworks");
      const data = await res.json();
      
      const artworksList: PlacardArtwork[] = (data.artworks || [])
        .filter((item: { artwork?: { id: string } }) => Boolean(item && item.artwork))
        .map((item: { artwork: { id: string; title: string; slug: string; medium?: string; dimensions?: string; yearCreated?: number; primaryImageUrl?: string; category?: { name: string } | null; description?: string; price?: number | string | null; currency?: string } }) => ({
          id: item.artwork.id,
          title: item.artwork.title,
          slug: item.artwork.slug,
          medium: item.artwork.medium,
          dimensions: item.artwork.dimensions,
          yearCreated: item.artwork.yearCreated,
          price: item.artwork.price,
          currency: item.artwork.currency || "INR",
          category: item.artwork.category ? { name: item.artwork.category.name } : undefined,
          primaryImageUrl: item.artwork.primaryImageUrl,
          additionalNotes: undefined,
        }));

      if (artworksList.length === 0) {
        toast.info(`No linked artworks found for "${ev.title}". Link artworks using the QR/Artworks button first.`);
        return;
      }

      setEventPlacardArtworks(artworksList);
      setPlacardSheetOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load artworks for placards");
    } finally {
      setLoadingEventPlacards(null);
    }
  };

  // Date Segmentation Logic
  const isPast = React.useCallback((ev: EventItem) => {
    if (ev.statusOverride === "FORCE_PAST") return true;
    if (ev.statusOverride === "FORCE_UPCOMING") return false;
    const now = new Date();
    const compareDate = ev.endDate ? new Date(ev.endDate) : new Date(ev.startDate);
    return compareDate < now;
  }, []);

  const upcomingEvents = React.useMemo(
    () => events.filter((ev) => !isPast(ev)).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [events, isPast]
  );

  const pastEvents = React.useMemo(
    () => events.filter((ev) => isPast(ev)).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [events, isPast]
  );

  const displayedEvents = React.useMemo(() => {
    if (activeSegment === "upcoming") return upcomingEvents;
    if (activeSegment === "past") return pastEvents;
    return events;
  }, [activeSegment, upcomingEvents, pastEvents, events]);

  return (
    <div className="space-y-6">
      {/* Reusable In-Place Editable Header */}
      <EditablePageHeader
        sectionKey="events"
        defaultTitle="Events & Showcases"
        defaultSubtitle="Curate international schedules, venue coordinates, timezones, and showcase asset linkages."
        badgeLabel="Showcase Calendar"
      >
        <Button onClick={handleOpenCreate} variant="default" className="gap-2 text-xs">
          <Plus className="w-4 h-4" />
          Schedule Event
        </Button>
      </EditablePageHeader>

      {/* Segmented Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-200/80 dark:bg-slate-900 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveSegment("upcoming")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              activeSegment === "upcoming"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs"
                : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Upcoming Exhibitions ({upcomingEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSegment("past")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              activeSegment === "past"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs"
                : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Past Retrospectives ({pastEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSegment("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              activeSegment === "all"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs"
                : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            All Schedules ({events.length})
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground font-mono">
          Showing {displayedEvents.length} of {events.length} curated events
        </p>
      </div>

      {/* Events Grid / Listing */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : displayedEvents.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Calendar className="w-12 h-12 mx-auto text-primary mb-3 opacity-60" />
          <CardTitle className="text-base font-serif">
            {activeSegment === "upcoming"
              ? "No Upcoming Events Scheduled"
              : activeSegment === "past"
              ? "No Past Retrospectives Found"
              : "No Events Scheduled"}
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            {activeSegment === "upcoming"
              ? "All existing events have concluded or are set as past. Schedule a new exhibition."
              : "Create your first showcase event, exhibition, or masterclass."}
          </CardDescription>
          <Button onClick={handleOpenCreate} variant="default" size="sm" className="mt-4 gap-1">
            <Plus className="w-3.5 h-3.5" />
            Create Event
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedEvents.map((ev) => {
            const banner = ev.bannerImage || ev.posterUrl;
            const eventIsPast = isPast(ev);

            return (
              <Card
                key={ev.id}
                className={`hover:border-primary/50 transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-lg ${
                  eventIsPast ? "bg-card/70 border-border/70" : "bg-card border-border"
                }`}
              >
                {/* Optional Hero Banner Preview */}
                {banner && (
                  <div className="relative h-36 w-full bg-muted/30 overflow-hidden border-b border-border/60">
                    <Image
                      src={banner}
                      alt={ev.title}
                      fill
                      className={`object-cover transition-transform duration-500 hover:scale-105 ${
                        eventIsPast ? "grayscale hover:grayscale-0 opacity-85 hover:opacity-100" : ""
                      }`}
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      {ev.statusOverride === "FORCE_PAST" ? (
                        <Badge variant="outline" className="text-[10px] uppercase font-mono bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          Forced Past
                        </Badge>
                      ) : ev.statusOverride === "FORCE_UPCOMING" ? (
                        <Badge variant="outline" className="text-[10px] uppercase font-mono bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-600/40 font-semibold">
                          Forced Upcoming
                        </Badge>
                      ) : eventIsPast ? (
                        <Badge variant="outline" className="text-[10px] uppercase font-mono bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700">
                          Concluded
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] uppercase font-mono bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-600/40 font-semibold">
                          Upcoming
                        </Badge>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-xs">
                        {ev.eventType}
                      </Badge>
                    </div>
                  </div>
                )}

                <CardHeader className="pb-2">
                  {!banner && (
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-semibold">
                          {ev.eventType}
                        </Badge>
                        {eventIsPast && (
                          <Badge variant="outline" className="text-[10px] uppercase font-mono bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700">
                            Concluded
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant={ev.isRegistrationOpen ? "outline" : "secondary"}
                        className="text-[10px]"
                      >
                        {ev.isRegistrationOpen ? "RSVP Open" : "Closed"}
                      </Badge>
                    </div>
                  )}

                  <CardTitle className="text-base font-serif font-bold text-foreground line-clamp-1">
                    {ev.title}
                  </CardTitle>

                  <CardDescription className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                    /{ev.slug}
                  </CardDescription>

                  {/* Active and Homepage Toggles */}
                  <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(ev)}
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        ev.isActive
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-600/40 hover:bg-emerald-200"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-200"
                      }`}
                      title="Click to toggle Active status"
                    >
                      {ev.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {ev.isActive ? "Active" : "Inactive"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleHomepage(ev)}
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        ev.showOnHomepage
                          ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-600/40 hover:bg-blue-200"
                          : "bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-200 opacity-60 hover:opacity-100"
                      }`}
                      title="Click to toggle Feature on Homepage"
                    >
                      <Home className="w-3 h-3" />
                      {ev.showOnHomepage ? "On Home" : "Not on Home"}
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2.5 pb-4 text-xs text-muted-foreground flex-1">
                  {/* Schedule in Native Event Timezone */}
                  <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="font-medium text-foreground leading-snug">
                      {formatEventSchedule(ev.startDate, ev.endDate, ev.timezone)}
                    </span>
                  </div>

                  {/* Venue & Location */}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {ev.venueName || ev.venue}
                      {ev.city ? `, ${ev.city}` : ""}
                      {ev.country ? ` • ${ev.country}` : ""}
                    </span>
                  </div>

                  {/* Fee & Capacity */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/40">
                    <span>
                      Fee:{" "}
                      <strong className="text-foreground">
                        {ev.registrationFee
                          ? formatCurrency(ev.registrationFee, ev.currency || "INR")
                          : "Free Admission"}
                      </strong>
                    </span>
                    <span>
                      Cap:{" "}
                      <strong className="text-foreground">
                        {ev.maxCapacity ? `${ev.maxCapacity} seats` : "Unlimited"}
                      </strong>
                    </span>
                  </div>

                  {/* Artworks & Registrations Count */}
                  <div className="flex items-center gap-4 pt-1 text-[11px]">
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                      <Palette className="w-3 h-3 text-primary" />
                      {ev._count?.artworks || 0} Artworks
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                      <Users className="w-3 h-3 text-primary" />
                      {ev._count?.registrations || 0} RSVPs
                    </span>
                  </div>
                </CardContent>

                {/* Card Action Footer */}
                <div className="p-3 bg-secondary/30 border-t border-border/60 flex items-center justify-between gap-2">
                  <Link
                    href={`/events/${ev.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Public Page
                  </Link>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintEventPlacards(ev)}
                      disabled={loadingEventPlacards === ev.id}
                      className="h-7 text-xs px-2 gap-1"
                      title={
                        (ev._count?.artworks || 0) > 0
                          ? `Print Placards for ${ev._count?.artworks} Artworks`
                          : "Print Placards (Link artworks first)"
                      }
                    >
                      {loadingEventPlacards === ev.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      ) : (
                        <Printer className="w-3.5 h-3.5 text-primary" />
                      )}
                      Placards ({ev._count?.artworks || 0})
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenExhibitionQR(ev)}
                      className="h-7 text-xs px-2 gap-1"
                      title="Floor QR Codes"
                    >
                      <QrCode className="w-3.5 h-3.5 text-primary" />
                      QR
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAttendees(ev)}
                      className="h-7 text-xs px-2 gap-1"
                    >
                      <Users className="w-3.5 h-3.5" />
                      RSVPs ({ev._count?.registrations || 0})
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateEvent(ev)}
                      disabled={duplicatingEventId === ev.id}
                      className="h-7 w-7 p-0"
                      title="Duplicate Event"
                    >
                      {duplicatingEventId === ev.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(ev)}
                      className="h-7 w-7 p-0"
                      title="Edit Event"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(ev.id, ev.title)}
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Comprehensive Event Form Modal */}
      <EventFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSaved={reloadEvents}
        initialEvent={editingEvent}
        artworksCatalog={artworksCatalog}
      />

      {/* Exhibition Artwork Linker / Floor QR Modal */}
      <Dialog open={exhibitionQrModalOpen} onOpenChange={setExhibitionQrModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <QrCode className="w-5 h-5 text-primary" />
              Exhibition Floor QR Code
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generate scannable QR cards for the entrance desk or individual masterwork pedestals.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-center">
            {selectedExhibitionEvent && (
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-foreground">Target QR Destination</label>
                <select
                  value={selectedArtworkForExhibition}
                  onChange={(e) => handleArtworkQrChange(e.target.value)}
                  className="w-full bg-card border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="">Full Exhibition Guide ({selectedExhibitionEvent.title})</option>
                  {artworksCatalog.map((art) => (
                    <option key={art.slug} value={art.slug}>
                      Artwork Pedestal: {art.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card">
              {exhibitionQrLoading ? (
                <div className="py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                </div>
              ) : exhibitionQrDataUrl ? (
                <div className="space-y-3">
                  <div className="relative w-48 h-48 mx-auto bg-white p-2 rounded-lg shadow-sm">
                    <Image
                      src={exhibitionQrDataUrl}
                      alt="Exhibition QR Code"
                      width={192}
                      height={192}
                      className="mx-auto"
                      unoptimized
                    />
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground break-all max-w-xs mx-auto">
                    {exhibitionQrTargetUrl}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            {exhibitionQrDataUrl && (
              <a
                href={exhibitionQrDataUrl}
                download={`qr-${selectedExhibitionEvent?.slug || "event"}.png`}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Download className="w-3.5 h-3.5" />
                Download PNG
              </a>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExhibitionQrModalOpen(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendee Viewer Modal */}
      <Dialog open={attendeeModalOpen} onOpenChange={setAttendeeModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>RSVP Registrations</DialogTitle>
            <DialogDescription>
              Attendee list for &quot;{attendeeEventTitle}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-3 space-y-2">
            {loadingAttendees ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : attendees.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">
                No RSVPs recorded yet for this event.
              </p>
            ) : (
              attendees.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-lg border border-border bg-card/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-serif font-bold text-foreground block">
                      {a.attendeeName}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {a.attendeeEmail} {a.attendeePhone ? `• ${a.attendeePhone}` : ""}
                    </span>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-[10px]">
                      {a.ticketCount} {a.ticketCount === 1 ? "seat" : "seats"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {new Date(a.registeredAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAttendeeModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Event"
        description={`Are you sure you want to permanently delete event "${targetDeleteEvent?.title}"? All attendee registrations will also be removed.`}
        confirmText={deleting ? "Deleting..." : "Delete Event"}
        isDestructive={true}
        onConfirm={handleConfirmDelete}
      />

      {/* Cross-Module Printable Placards Sheet */}
      {eventPlacardArtworks.length > 0 && (
        <ArtworkPlacardSheet
          open={placardSheetOpen}
          onOpenChange={setPlacardSheetOpen}
          artworks={eventPlacardArtworks}
        />
      )}
    </div>
  );
}
