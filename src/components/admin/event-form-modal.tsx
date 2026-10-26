"use client";

import * as React from "react";
import Image from "next/image";
import {
  Calendar,
  Clock,
  Palette,
  Upload,
  Trash2,
  Info,
  Phone,
  Mail,
  User,
  Image as ImageIcon,
  Check,
  Globe,
  FileText,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Sliders,
  ExternalLink,
  Search,
  Filter,
  FolderOpen,
} from "lucide-react";
import { UniversalMediaDialog } from "@/components/admin/universal-media-dialog";
import { optimizeImageForWebpUpload } from "@/lib/client-image-optimizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AiAssistantModal } from "@/components/admin/ai-assistant-modal";
import { ModernDateTimePicker } from "@/components/admin/modern-datetime-picker";
import { TiptapEditor } from "@/components/builder/tiptap-editor";
import {
  getAllCountries,
  findCountry,
  getTimezonesForCountry,
  formatEventSchedule,
} from "@/lib/geo-timezone";
import { SUPPORTED_CURRENCIES } from "@/lib/formatters";

export interface GalleryImageItem {
  id?: string;
  url: string;
  caption?: string;
  title?: string;
  alt?: string;
  linkType?: "none" | "artwork" | "category" | "custom";
  linkTarget?: string;
}

export interface EventRsvpCustomField {
  id: string;
  label: string;
  type: "text" | "select" | "checkbox";
  options?: string[]; // for select
  required: boolean;
}

export interface EventRsvpConfig {
  enabled: boolean;
  title?: string;
  subtitle?: string;
  requirePhone?: boolean;
  allowGuestCount?: boolean;
  maxGuestsPerRsvp?: number;
  submitButtonLabel?: string;
  successMessage?: string;
  requireDateSelection?: boolean; // Default true
  allowMultipleDates?: boolean; // Default false (allow multi-date selection)
  timeSlotRequirement?: "MANDATORY" | "OPTIONAL" | "DISABLED"; // Default "MANDATORY"
  slotIntervalMinutes?: number; // 15, 30, 45, 60, 120, or custom
  slotCapacity?: number | null; // Max attendees per slot
  enableCaptcha?: boolean; // In-house Bot Protection CAPTCHA
  enableEmailOtp?: boolean; // In-house Email OTP Verification
  customFields?: EventRsvpCustomField[];
}

export interface EventDailySchedule {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  label?: string; // e.g. "Day 1 - Vernissage & Monograph Presentation"
}

export interface EventFormData {
  id?: string;
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
  country: string;
  countryCode?: string | null;
  timezone: string;
  startDate: string; // ISO string
  endDate?: string | null; // ISO string
  posterUrl?: string | null;
  bannerImage?: string | null;
  galleryImages?: GalleryImageItem[] | null;
  galleryDisplayMode?: string | null;
  galleryAutoplayTimer?: number | null;
  brochurePdfUrl?: string | null;
  brochureTitle?: string | null;
  brochureDownloadable?: boolean | null;
  maxCapacity?: number | null;
  registrationFee?: number | null;
  currency: string;
  isRegistrationOpen: boolean;
  isPublished: boolean;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  statusOverride?: "AUTO" | "FORCE_UPCOMING" | "FORCE_PAST" | string;
  isArchived?: boolean;
  isActive?: boolean;
  showOnHomepage?: boolean;
  sortOrder?: number;
  artworkIds?: string[];
  rsvpConfig?: EventRsvpConfig | null;
  dailySchedules?: EventDailySchedule[] | null;
}

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

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialEvent?: EventFormData | null;
  artworksCatalog: ArtworkSummary[];
}

export function EventFormModal({
  isOpen,
  onClose,
  onSaved,
  initialEvent,
  artworksCatalog,
}: EventFormModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <EventFormContent
        key={initialEvent?.id || "create-event-dialog"}
        onClose={onClose}
        onSaved={onSaved}
        initialEvent={initialEvent}
        artworksCatalog={artworksCatalog}
      />
    </Dialog>
  );
}

function EventFormContent({
  onClose,
  onSaved,
  initialEvent,
  artworksCatalog,
}: {
  onClose: () => void;
  onSaved: () => void;
  initialEvent?: EventFormData | null;
  artworksCatalog: ArtworkSummary[];
}) {
  const isEditing = !!initialEvent?.id;

  // Active Tab State
  const [activeTab, setActiveTab] = React.useState("general");

  // Form Fields Initial State
  const [title, setTitle] = React.useState(initialEvent?.title || "");
  const [slug, setSlug] = React.useState(initialEvent?.slug || "");
  const [earmarkText, setEarmarkText] = React.useState(
    initialEvent?.earmarkText || "Curated Showcase & Event"
  );
  const [eventType, setEventType] = React.useState<EventFormData["eventType"]>(
    initialEvent?.eventType || "EXHIBITION"
  );
  const [description, setDescription] = React.useState(initialEvent?.description || "");
  const [country, setCountry] = React.useState(initialEvent?.country || "India");
  const [countryCode, setCountryCode] = React.useState(initialEvent?.countryCode || "IN");
  const [timezone, setTimezone] = React.useState(initialEvent?.timezone || "Asia/Kolkata");
  const [startDate, setStartDate] = React.useState(initialEvent?.startDate || "");
  const [endDate, setEndDate] = React.useState(initialEvent?.endDate || "");
  const [dailySchedules, setDailySchedules] = React.useState<EventDailySchedule[]>(
    Array.isArray(initialEvent?.dailySchedules) ? (initialEvent.dailySchedules as EventDailySchedule[]) : []
  );
  const [venue, setVenue] = React.useState(
    initialEvent?.venue || initialEvent?.venueName || "SavazAI Heritage Studio"
  );
  const [venueName, setVenueName] = React.useState(
    initialEvent?.venueName || initialEvent?.venue || "SavazAI Heritage Studio"
  );
  const [streetAddress, setStreetAddress] = React.useState(initialEvent?.streetAddress || "");
  const [city, setCity] = React.useState(initialEvent?.city || "Bengaluru");
  const [stateProvince, setStateProvince] = React.useState(initialEvent?.stateProvince || "Karnataka");
  const [postalCode, setPostalCode] = React.useState(initialEvent?.postalCode || "560038");
  const [maxCapacity, setMaxCapacity] = React.useState(
    initialEvent?.maxCapacity ? initialEvent.maxCapacity.toString() : "100"
  );
  const [registrationFee, setRegistrationFee] = React.useState(
    initialEvent?.registrationFee ? initialEvent.registrationFee.toString() : "0"
  );
  const [currency, setCurrency] = React.useState(initialEvent?.currency || "INR");
  const [isRegistrationOpen, setIsRegistrationOpen] = React.useState(
    initialEvent?.isRegistrationOpen !== false
  );
  const [statusOverride, setStatusOverride] = React.useState<string>(
    initialEvent?.statusOverride || "AUTO"
  );
  const [isArchived, setIsArchived] = React.useState<boolean>(
    initialEvent?.isArchived === true
  );
  const [isPublished, setIsPublished] = React.useState(initialEvent?.isPublished !== false);
  const [isActive, setIsActive] = React.useState(initialEvent?.isActive !== false);
  const [showOnHomepage, setShowOnHomepage] = React.useState(initialEvent?.showOnHomepage === true);
  const [sortOrder, setSortOrder] = React.useState<number>(initialEvent?.sortOrder || 0);
  const [contactName, setContactName] = React.useState(
    initialEvent?.contactName || "Curatorial Director"
  );
  const [contactEmail, setContactEmail] = React.useState(
    initialEvent?.contactEmail || "events@savazar.com"
  );
  const [contactPhone, setContactPhone] = React.useState(
    initialEvent?.contactPhone || "+91 98450 00000"
  );
  const [bannerImage, setBannerImage] = React.useState<string>(
    initialEvent?.bannerImage || initialEvent?.posterUrl || ""
  );
  const [galleryImages, setGalleryImages] = React.useState<GalleryImageItem[]>(
    Array.isArray(initialEvent?.galleryImages) ? initialEvent.galleryImages : []
  );
  const [galleryDisplayMode, setGalleryDisplayMode] = React.useState<string>(
    initialEvent?.galleryDisplayMode || "CAROUSEL"
  );
  const [galleryAutoplayTimer, setGalleryAutoplayTimer] = React.useState<number>(
    initialEvent?.galleryAutoplayTimer ?? 4
  );
  const [brochurePdfUrl, setBrochurePdfUrl] = React.useState<string>(
    initialEvent?.brochurePdfUrl || ""
  );
  const [brochureTitle, setBrochureTitle] = React.useState<string>(
    initialEvent?.brochureTitle || "Event Program & Publication Brochure"
  );
  const [brochureDownloadable, setBrochureDownloadable] = React.useState<boolean>(
    initialEvent?.brochureDownloadable !== false
  );
  const [selectedArtworkIds, setSelectedArtworkIds] = React.useState<string[]>(
    initialEvent?.artworkIds || []
  );

  // RSVP Form Builder Settings
  const initialRsvpConfig = initialEvent?.rsvpConfig || ({} as EventRsvpConfig);
  const [rsvpEnabled, setRsvpEnabled] = React.useState<boolean>(
    initialRsvpConfig.enabled !== false
  );
  const [rsvpTitle, setRsvpTitle] = React.useState<string>(
    initialRsvpConfig.title || "Reserve Your Attendance"
  );
  const [rsvpSubtitle, setRsvpSubtitle] = React.useState<string>(
    initialRsvpConfig.subtitle || "Strictly limited seating for patrons and invited connoisseurs."
  );
  const [rsvpRequirePhone, setRsvpRequirePhone] = React.useState<boolean>(
    initialRsvpConfig.requirePhone === true
  );
  const [rsvpAllowGuestCount, setRsvpAllowGuestCount] = React.useState<boolean>(
    initialRsvpConfig.allowGuestCount !== false
  );
  const [rsvpMaxGuests, setRsvpMaxGuests] = React.useState<number>(
    initialRsvpConfig.maxGuestsPerRsvp || 4
  );
  const [rsvpButtonLabel, setRsvpButtonLabel] = React.useState<string>(
    initialRsvpConfig.submitButtonLabel || "Confirm Attendance"
  );
  const [rsvpSuccessMessage, setRsvpSuccessMessage] = React.useState<string>(
    initialRsvpConfig.successMessage || "We look forward to welcoming you. A confirmation has been registered with our desk."
  );
  const [rsvpRequireDateSelection, setRsvpRequireDateSelection] = React.useState<boolean>(
    initialRsvpConfig.requireDateSelection !== false
  );
  const [rsvpAllowMultipleDates, setRsvpAllowMultipleDates] = React.useState<boolean>(
    initialRsvpConfig.allowMultipleDates === true
  );
  const [rsvpTimeSlotRequirement, setRsvpTimeSlotRequirement] = React.useState<"MANDATORY" | "OPTIONAL" | "DISABLED">(
    initialRsvpConfig.timeSlotRequirement || "MANDATORY"
  );
  const [rsvpSlotIntervalMinutes, setRsvpSlotIntervalMinutes] = React.useState<number>(
    initialRsvpConfig.slotIntervalMinutes ?? 30
  );
  const [rsvpCustomSlotInterval, setRsvpCustomSlotInterval] = React.useState<string>(
    initialRsvpConfig.slotIntervalMinutes && ![15, 30, 45, 60, 120].includes(initialRsvpConfig.slotIntervalMinutes)
      ? String(initialRsvpConfig.slotIntervalMinutes)
      : ""
  );
  const [rsvpSlotCapacity, setRsvpSlotCapacity] = React.useState<string>(
    initialRsvpConfig.slotCapacity ? String(initialRsvpConfig.slotCapacity) : ""
  );
  const [rsvpEnableCaptcha, setRsvpEnableCaptcha] = React.useState<boolean>(
    initialRsvpConfig.enableCaptcha === true
  );
  const [rsvpEnableEmailOtp, setRsvpEnableEmailOtp] = React.useState<boolean>(
    initialRsvpConfig.enableEmailOtp === true
  );
  const [rsvpCustomFields, setRsvpCustomFields] = React.useState<EventRsvpCustomField[]>(
    initialRsvpConfig.customFields || []
  );

  // Helpers
  const [saving, setSaving] = React.useState(false);
  const [uploadingBanner, setUploadingBanner] = React.useState(false);
  const [uploadingGallery, setUploadingGallery] = React.useState(false);
  const [uploadingBrochure, setUploadingBrochure] = React.useState(false);

  // Universal Media Dialog states
  const [bannerPickerOpen, setBannerPickerOpen] = React.useState(false);
  const [galleryPickerOpen, setGalleryPickerOpen] = React.useState(false);
  const [brochurePickerOpen, setBrochurePickerOpen] = React.useState(false);

  // Tab 8: Artworks Search & Filter States
  const [artworkSearchQuery, setArtworkSearchQuery] = React.useState("");
  const [selectedSchoolFilter, setSelectedSchoolFilter] = React.useState<string>("ALL");
  const [showOnlySelected, setShowOnlySelected] = React.useState(false);

  // Countries and Timezones Data
  const countries = React.useMemo(() => getAllCountries(), []);
  const availableTimezones = React.useMemo(() => {
    return getTimezonesForCountry(countryCode);
  }, [countryCode]);

  const selectedCountryInfo = React.useMemo(() => {
    return findCountry(countryCode) || findCountry(country) || countries[0];
  }, [countryCode, country, countries]);

  // Country Selection Change Handler
  const handleCountryChange = (cCode: string) => {
    const found = countries.find((c) => c.code === cCode);
    if (!found) return;

    setCountryCode(found.code);
    setCountry(found.name);
    setCurrency(found.defaultCurrency);

    // Auto-populate country's default timezone
    if (found.defaultTimezone) {
      setTimezone(found.defaultTimezone);
    }

    // Auto-fill dialing code on contact phone if blank or generic
    if (!contactPhone || contactPhone.trim() === "" || contactPhone.startsWith("+")) {
      setContactPhone(`${found.dialCode} `);
    }
  };

  // Generate URL slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing || !slug) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  };

  // Upload Hero Banner
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    const file = await optimizeImageForWebpUpload(rawFile);
    setUploadingBanner(true);
    const body = new FormData();
    body.append("file", file);
    body.append("watermark", "false");

    try {
      const res = await fetch("/api/admin/media/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload banner");

      const imgUrl = data.publicUrl || data.watermarkedUrl || data.primaryImageUrl || data.rawUrl;
      setBannerImage(imgUrl);
      toast.success("Hero banner uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Banner upload failed");
    } finally {
      setUploadingBanner(false);
    }
  };

  // Upload Gallery Images
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    const newItems: GalleryImageItem[] = [];

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = await optimizeImageForWebpUpload(fileArray[i]);
        setUploadingGallery(true);
        const body = new FormData();
        body.append("file", file);
        body.append("watermark", "false");

        const res = await fetch("/api/admin/media/upload", { method: "POST", body });
        const data = await res.json();
        if (res.ok) {
          const imgUrl = data.publicUrl || data.watermarkedUrl || data.primaryImageUrl || data.rawUrl;
          const cleanName = file.name.replace(/\.[^/.]+$/, "");
          newItems.push({
            id: `gal-${Date.now()}-${i}`,
            url: imgUrl,
            title: cleanName,
            caption: "",
            alt: "",
            linkType: "none",
            linkTarget: "",
          });
        }
      }

      setGalleryImages((prev) => [...prev, ...newItems]);
      toast.success(`Uploaded ${newItems.length} gallery image(s)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gallery upload failed");
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveGalleryImage = (index: number, direction: "up" | "down") => {
    setGalleryImages((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const updateGalleryItemField = (index: number, field: keyof GalleryImageItem, val: string) => {
    setGalleryImages((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  // Upload Brochure PDF
  const handleBrochureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a valid PDF file");
      return;
    }

    setUploadingBrochure(true);
    const body = new FormData();
    body.append("file", file);
    body.append("watermark", "false");

    try {
      const res = await fetch("/api/admin/media/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload brochure");

      const pdfUrl = data.publicUrl || data.rawUrl;
      setBrochurePdfUrl(pdfUrl);
      if (!brochureTitle || brochureTitle === "Event Program & Publication Brochure" || brochureTitle === "Exhibition Monograph & Program Brochure") {
        setBrochureTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
      toast.success("PDF Brochure uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Brochure upload failed");
    } finally {
      setUploadingBrochure(false);
    }
  };

  // Toggle artwork selection
  const toggleArtworkSelection = (artId: string) => {
    setSelectedArtworkIds((prev) =>
      prev.includes(artId) ? prev.filter((id) => id !== artId) : [...prev, artId]
    );
  };

  // Distinct Traditional Schools / Categories from artworks catalog
  const artworkSchools = React.useMemo(() => {
    const set = new Set<string>();
    artworksCatalog.forEach((art) => {
      if (art.category?.name) {
        set.add(art.category.name);
      }
    });
    return Array.from(set).sort();
  }, [artworksCatalog]);

  // Filtered artworks for Tab 8
  const filteredArtworks = React.useMemo(() => {
    return artworksCatalog.filter((art) => {
      // 1. "Selected Only" filter
      if (showOnlySelected && !selectedArtworkIds.includes(art.id)) {
        return false;
      }
      // 2. School/Category filter
      if (selectedSchoolFilter !== "ALL") {
        if (art.category?.name !== selectedSchoolFilter) {
          return false;
        }
      }
      // 3. Search query filter (title, medium, slug, school)
      if (artworkSearchQuery.trim()) {
        const query = artworkSearchQuery.toLowerCase().trim();
        const matchesTitle = art.title.toLowerCase().includes(query);
        const matchesMedium = art.medium?.toLowerCase().includes(query);
        const matchesSlug = art.slug?.toLowerCase().includes(query);
        const matchesSchool = art.category?.name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesMedium && !matchesSlug && !matchesSchool) {
          return false;
        }
      }
      return true;
    });
  }, [artworksCatalog, selectedArtworkIds, showOnlySelected, selectedSchoolFilter, artworkSearchQuery]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !slug.trim() || !startDate) {
      toast.error("Please fill in Title, Slug, and Start Date & Time");
      return;
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      earmarkText: earmarkText.trim() || "Curated Showcase & Event",
      eventType,
      description,
      venue: venueName || venue || "SavazAI Heritage Studio",
      venueName: venueName || venue || "SavazAI Heritage Studio",
      streetAddress: streetAddress || null,
      city: city.trim() || "Bengaluru",
      stateProvince: stateProvince || null,
      postalCode: postalCode || null,
      country: country || "India",
      countryCode: countryCode || "IN",
      timezone: timezone || "Asia/Kolkata",
      startDate,
      endDate: endDate || null,
      posterUrl: bannerImage || null,
      bannerImage: bannerImage || null,
      galleryImages: galleryImages.length > 0 ? galleryImages : null,
      galleryDisplayMode,
      galleryAutoplayTimer,
      brochurePdfUrl: brochurePdfUrl.trim() || null,
      brochureTitle: brochureTitle.trim() || "Event Program & Publication Brochure",
      brochureDownloadable,
      maxCapacity: maxCapacity ? parseInt(maxCapacity, 10) : null,
      registrationFee: registrationFee ? parseFloat(registrationFee) : 0,
      currency: currency || "INR",
      isRegistrationOpen,
      isPublished,
      isActive,
      showOnHomepage,
      sortOrder: parseInt(String(sortOrder), 10) || 0,
      statusOverride,
      isArchived,
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      artworkIds: selectedArtworkIds,
      rsvpConfig: {
        enabled: rsvpEnabled,
        title: rsvpTitle,
        subtitle: rsvpSubtitle,
        requirePhone: rsvpRequirePhone,
        allowGuestCount: rsvpAllowGuestCount,
        maxGuestsPerRsvp: rsvpMaxGuests,
        submitButtonLabel: rsvpButtonLabel,
        successMessage: rsvpSuccessMessage,
        requireDateSelection: rsvpRequireDateSelection,
        allowMultipleDates: rsvpAllowMultipleDates,
        timeSlotRequirement: rsvpTimeSlotRequirement,
        slotIntervalMinutes:
          rsvpSlotIntervalMinutes === 0
            ? parseInt(rsvpCustomSlotInterval, 10) || 30
            : rsvpSlotIntervalMinutes,
        slotCapacity: rsvpSlotCapacity ? parseInt(rsvpSlotCapacity, 10) : null,
        enableCaptcha: rsvpEnableCaptcha,
        enableEmailOtp: rsvpEnableEmailOtp,
        customFields: rsvpCustomFields,
      },
      dailySchedules: dailySchedules.length > 0 ? dailySchedules : null,
    };

    try {
      const url = isEditing ? `/api/admin/events/${initialEvent.id}` : "/api/admin/events";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save event");

      toast.success(isEditing ? "Event updated successfully!" : "Event scheduled successfully!");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving event");
    } finally {
      setSaving(false);
    }
  };

  // Live formatted schedule string
  const liveSchedulePreview = React.useMemo(() => {
    if (!startDate) return null;
    return formatEventSchedule(startDate, endDate, timezone);
  }, [startDate, endDate, timezone]);

  return (
    <DialogContent className="max-w-4xl sm:max-w-4xl lg:max-w-5xl w-full max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card border-border shadow-2xl">
      <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60 bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {isEditing ? "Curate Event & Exhibition" : "Schedule New Event / Exhibition"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Configure international timezone, multi-day schedule, venue logistics, gallery media, and curatorial contacts.
            </DialogDescription>
          </div>

          <Badge variant="gold" className="text-xs uppercase font-mono">
            {eventType}
          </Badge>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-border/60 bg-card">
            <TabsList className="flex flex-wrap h-auto w-full items-center justify-start gap-1 bg-transparent p-0">
              <TabsTrigger value="general" className="text-xs shrink-0 whitespace-nowrap px-3 py-1.5 border border-transparent data-[state=active]:border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs rounded-md">General</TabsTrigger>
              <TabsTrigger value="dates" className="text-xs shrink-0 whitespace-nowrap px-3 py-1.5 border border-transparent data-[state=active]:border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs rounded-md">Dates &amp; Timezone</TabsTrigger>
              <TabsTrigger value="venue" className="text-xs shrink-0 whitespace-nowrap px-3 py-1.5 border border-transparent data-[state=active]:border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs rounded-md">Venue &amp; Address</TabsTrigger>
              <TabsTrigger value="contacts" className="text-xs shrink-0 whitespace-nowrap px-3 py-1.5 border border-transparent data-[state=active]:border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs rounded-md">Curator Contact</TabsTrigger>
              <TabsTrigger value="rsvp" className="text-xs shrink-0 whitespace-nowrap px-3 py-1.5 border border-transparent data-[state=active]:border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs rounded-md">RSVP Builder</TabsTrigger>
              <TabsTrigger value="media" className="text-xs shrink-0 whitespace-nowrap px-3 py-1.5 border border-transparent data-[state=active]:border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs rounded-md">Banner &amp; Gallery</TabsTrigger>
              <TabsTrigger value="brochure" className="text-xs shrink-0 whitespace-nowrap px-3 py-1.5 border border-transparent data-[state=active]:border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs rounded-md">Brochure (PDF)</TabsTrigger>
              <TabsTrigger value="artworks" className="text-xs shrink-0 whitespace-nowrap px-3 py-1.5 border border-transparent data-[state=active]:border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-xs rounded-md">Artworks ({selectedArtworkIds.length})</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TAB 1: GENERAL DETAILS */}
            <TabsContent value="general" className="m-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Event Title *</label>
                  <Input
                    required
                    placeholder="e.g. Annual Symposium & Showcase 2026"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">URL Slug *</label>
                  <Input
                    required
                    placeholder="e.g. annual-symposium-showcase-2026"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="earmarkText">
                  Hero Earmark / Subtitle Badge
                </label>
                <Input
                  id="earmarkText"
                  placeholder="e.g. Curated Showcase, Keynote Presentation, or Public Exhibition"
                  value={earmarkText}
                  onChange={(e) => setEarmarkText(e.target.value)}
                  className="h-9 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Displayed as the uppercase badge above the event title on the hero banner.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Event Type *</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventFormData["eventType"])}
                    className="w-full bg-card border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="EXHIBITION">EXHIBITION (Gallery Floor)</option>
                    <option value="CONCERT">CONCERT (Keynote / Performance)</option>
                    <option value="RECITAL">RECITAL (Chamber / Session)</option>
                    <option value="WORKSHOP">WORKSHOP (Hands-on Masterclass)</option>
                    <option value="PRIVATE_VIEWING">PRIVATE VIEWING (Collector Salon)</option>
                    <option value="ONLINE_CLASSROOM">ONLINE CLASSROOM (Virtual Archive)</option>
                    <option value="OTHER">OTHER (Special Cultural Gathering)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Capacity &amp; Commercials</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Max Capacity"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Fee (0 for Free)"
                      value={registrationFee}
                      onChange={(e) => setRegistrationFee(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Lifecycle & Manual Archive Override */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-lg border border-primary/25 bg-primary/5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Event Lifecycle Status
                  </label>
                  <select
                    value={statusOverride}
                    onChange={(e) => setStatusOverride(e.target.value)}
                    className="w-full bg-card border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="AUTO">Automatic (Calculated from End/Start Date)</option>
                    <option value="FORCE_UPCOMING">Force as Upcoming Event</option>
                    <option value="FORCE_PAST">Designate as Past Event / Retrospective</option>
                  </select>
                  <p className="text-[10px] text-muted-foreground">
                    Overrides auto-date calculation to force placement in Upcoming or Past sections.
                  </p>
                </div>

                <div className="space-y-1.5 flex flex-col justify-center">
                  <label className="text-xs font-semibold text-foreground mb-1">
                    Catalog Archival Flag
                  </label>
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isArchived}
                      onChange={(e) => setIsArchived(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>Archive from public event listings</span>
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    Hide from public calendars while preserving historical data.
                  </p>
                </div>
              </div>

              {/* Rich Description with WYSIWYG Tiptap Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Description &amp; Program Notes (WYSIWYG)
                  </label>
                  <AiAssistantModal
                    initialContext={`${title ? `Event: ${title}\n` : ""}${venueName || venue ? `Venue: ${venueName || venue}\n` : ""}${description || ""}`}
                    onApply={(generated: string) => {
                      setDescription((prev) => (prev ? `${prev}<br/><br/>${generated}` : generated));
                    }}
                    triggerLabel="✨ AI Assist"
                    triggerClassName="h-6 text-[11px] px-2 text-primary border-primary/40 hover:bg-primary/10"
                  />
                </div>
                <div className="rounded-md border border-border bg-card/60 p-1 shadow-xs">
                  <TiptapEditor
                    content={description}
                    onChange={(_, html) => setDescription(html)}
                    placeholder="Provide curatorial background, program agenda, presentation techniques, or attendee notes..."
                    className="min-h-[160px]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2 flex-wrap border-t border-border/50">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  Active (Publicly Visible)
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnHomepage}
                    onChange={(e) => setShowOnHomepage(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  Feature on Homepage
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRegistrationOpen}
                    onChange={(e) => setIsRegistrationOpen(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  RSVP Registration Open
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  Published
                </label>

                <div className="flex items-center gap-2 ml-auto">
                  <label htmlFor="eventSortOrder" className="text-xs font-medium text-foreground whitespace-nowrap">
                    Sort Order:
                  </label>
                  <Input
                    id="eventSortOrder"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                    className="h-7 text-xs font-mono w-20"
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: DATES & TIMEZONE */}
            <TabsContent value="dates" className="m-0 space-y-5">
              <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 text-xs flex items-start gap-3">
                <Globe className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-foreground block">
                    Timezone-Protected Scheduling Engine
                  </span>
                  <p className="text-muted-foreground leading-relaxed text-[11px]">
                    Selecting the host Country and Timezone guarantees that entered dates and times reflect the local venue wall-clock schedule with zero offset corruption across international time zones.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Global Country Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Host Country (Global 240+) *</span>
                    <span className="text-[10px] text-muted-foreground">Auto-configures currency &amp; timezones</span>
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full bg-card border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.defaultCurrency})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Country-Filtered Timezone Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Venue Timezone (IANA) *</span>
                    <span className="font-mono text-[10px] text-primary">{timezone}</span>
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-card border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    {availableTimezones.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DateTime Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <ModernDateTimePicker
                  value={startDate}
                  onChange={setStartDate}
                  timeZone={timezone}
                  label="Start Date &amp; Time *"
                  placeholder="Select start date &amp; time"
                />

                <ModernDateTimePicker
                  value={endDate}
                  onChange={setEndDate}
                  timeZone={timezone}
                  label="End Date &amp; Time (Multi-Day or Concluding Time)"
                  placeholder="Select end date &amp; time"
                />
              </div>

              {/* Live Formatted Schedule Preview */}
              {liveSchedulePreview && (
                <div className="p-3.5 rounded-xl border border-border bg-card/60 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-mono text-muted-foreground block font-semibold">
                        Live Public Schedule Display
                      </span>
                      <span className="font-semibold text-foreground text-sm">
                        {liveSchedulePreview}
                      </span>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                    {timezone}
                  </Badge>
                </div>
              )}

              {/* Multi-Day Daily Schedule Builder */}
              <div className="pt-4 border-t border-border/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      Multi-Day Daily Schedules (RSVP Slot Allocation)
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Define distinct daily time windows (e.g. Day 1, Day 2) for dynamic 30-minute RSVP booking slots.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const nextDayIdx = dailySchedules.length + 1;
                      let defaultDate = new Date().toISOString().slice(0, 10);
                      if (dailySchedules.length > 0) {
                        const lastDate = new Date(dailySchedules[dailySchedules.length - 1].date);
                        lastDate.setDate(lastDate.getDate() + 1);
                        defaultDate = lastDate.toISOString().slice(0, 10);
                      } else if (startDate) {
                        try {
                          defaultDate = new Date(startDate).toISOString().slice(0, 10);
                        } catch {}
                      }
                      setDailySchedules([
                        ...dailySchedules,
                        {
                          date: defaultDate,
                          startTime: "10:00",
                          endTime: "18:00",
                          label: `Day ${nextDayIdx} - Exhibition & Walkthrough`,
                        },
                      ]);
                    }}
                    className="h-7 text-xs px-2.5 cursor-pointer shrink-0"
                  >
                    + Add Schedule Day
                  </Button>
                </div>

                {dailySchedules.length === 0 ? (
                  <div className="p-3.5 rounded-xl border border-dashed border-border/80 bg-muted/10 text-center text-xs text-muted-foreground">
                    No individual daily schedules defined. The master start date &amp; time will be used for single-day RSVP slot generation.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dailySchedules.map((day, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-border bg-card/60 space-y-2.5 relative"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono font-semibold text-primary">
                            Day {idx + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDailySchedules(dailySchedules.filter((_, i) => i !== idx));
                            }}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Remove Day"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-semibold text-muted-foreground">
                              Date *
                            </label>
                            <Input
                              type="date"
                              value={day.date}
                              onChange={(e) => {
                                const updated = [...dailySchedules];
                                updated[idx].date = e.target.value;
                                setDailySchedules(updated);
                              }}
                              className="h-8 text-xs font-mono"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-semibold text-muted-foreground">
                              Start Time *
                            </label>
                            <Input
                              type="time"
                              value={day.startTime}
                              onChange={(e) => {
                                const updated = [...dailySchedules];
                                updated[idx].startTime = e.target.value;
                                setDailySchedules(updated);
                              }}
                              className="h-8 text-xs font-mono"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-semibold text-muted-foreground">
                              End Time *
                            </label>
                            <Input
                              type="time"
                              value={day.endTime}
                              onChange={(e) => {
                                const updated = [...dailySchedules];
                                updated[idx].endTime = e.target.value;
                                setDailySchedules(updated);
                              }}
                              className="h-8 text-xs font-mono"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-semibold text-muted-foreground">
                              Day Label / Focus
                            </label>
                            <Input
                              value={day.label || ""}
                              onChange={(e) => {
                                const updated = [...dailySchedules];
                                updated[idx].label = e.target.value;
                                setDailySchedules(updated);
                              }}
                              placeholder="e.g. Masterclass & Recital"
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Scheduling Controls */}
                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-primary" />
                      RSVP Scheduling Rules for Defined Dates
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                      Configurable Slots
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rsvpRequireDateSelection}
                        onChange={(e) => setRsvpRequireDateSelection(e.target.checked)}
                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                      />
                      <span>Require Date Selection</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rsvpAllowMultipleDates}
                        onChange={(e) => setRsvpAllowMultipleDates(e.target.checked)}
                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                      />
                      <span>Allow Selecting Multiple Attendance Dates</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-primary/10">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground block">Time Slot Requirement</label>
                      <select
                        value={rsvpTimeSlotRequirement}
                        onChange={(e) => setRsvpTimeSlotRequirement(e.target.value as "MANDATORY" | "OPTIONAL" | "DISABLED")}
                        className="w-full bg-card border border-border text-foreground text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option value="MANDATORY">Mandatory (Guest must pick a time slot)</option>
                        <option value="OPTIONAL">Optional (Guest may pick slot or flexible pass)</option>
                        <option value="DISABLED">Disabled (No time slots, open attendance)</option>
                      </select>
                    </div>

                    {rsvpTimeSlotRequirement !== "DISABLED" && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-foreground block">Slot Interval Duration</label>
                        <select
                          value={rsvpSlotIntervalMinutes}
                          onChange={(e) => setRsvpSlotIntervalMinutes(parseInt(e.target.value, 10))}
                          className="w-full bg-card border border-border text-foreground text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={45}>45 minutes</option>
                          <option value={60}>60 minutes (1 hour)</option>
                          <option value={120}>2 hours (120 minutes)</option>
                          <option value={0}>Custom Interval...</option>
                        </select>
                        {rsvpSlotIntervalMinutes === 0 && (
                          <Input
                            type="number"
                            min="5"
                            max="360"
                            placeholder="Minutes (e.g. 90)"
                            value={rsvpCustomSlotInterval}
                            onChange={(e) => setRsvpCustomSlotInterval(e.target.value)}
                            className="h-7 text-xs mt-1 font-mono"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: VENUE & ADDRESS */}
            <TabsContent value="venue" className="m-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Venue / Gallery Hall *</label>
                  <Input
                    required
                    placeholder="e.g. Main Auditorium, Pavilion Hall, or Virtual Stream"
                    value={venueName}
                    onChange={(e) => {
                      setVenueName(e.target.value);
                      setVenue(e.target.value);
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Street Address / Landmark</label>
                  <Input
                    placeholder="e.g. 1 Madison Avenue, Flatiron District"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">City *</label>
                  <Input
                    required
                    placeholder="e.g. New York or Bengaluru"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {selectedCountryInfo.stateLabel}
                  </label>
                  <Input
                    placeholder={`e.g. ${selectedCountryInfo.stateLabel}`}
                    value={stateProvince}
                    onChange={(e) => setStateProvince(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {selectedCountryInfo.postalLabel}
                  </label>
                  <Input
                    placeholder={`e.g. ${selectedCountryInfo.postalLabel}`}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-card border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    {SUPPORTED_CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: CURATOR & ORGANIZER CONTACT */}
            <TabsContent value="contacts" className="m-0 space-y-4">
              <div className="p-3.5 rounded-xl border border-border bg-card/40 text-xs flex items-start gap-3">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-foreground block">
                    Dedicated Event Desk
                  </span>
                  <p className="text-muted-foreground leading-relaxed text-[11px]">
                    These contact details are displayed on the public event page under &quot;Inquiries &amp; Curatorial Desk&quot; so attendees and patrons can contact the exhibition organizer directly.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    Contact Person / Curator
                  </label>
                  <Input
                    placeholder="e.g. Curatorial Director"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    Dedicated Email
                  </label>
                  <Input
                    type="email"
                    placeholder="e.g. events@savazar.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    WhatsApp / Phone
                  </label>
                  <Input
                    placeholder="e.g. +1 212-555-0199"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB: RSVP FORM BUILDER */}
            <TabsContent value="rsvp" className="m-0 space-y-6">
              <div className="space-y-1">
                <h4 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  Custom RSVP Form Configuration
                </h4>
                <p className="text-xs text-muted-foreground">
                  Control registration availability, field requirements, attendee capacity, and bespoke guest intake questions.
                </p>
              </div>

              {/* Master RSVP Enablement */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Enable Public RSVP Registration
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    When active, visitors can reserve their attendance from the event details page.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rsvpEnabled}
                  onChange={(e) => setRsvpEnabled(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
              </div>

              {rsvpEnabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Form Header Title</label>
                      <Input
                        value={rsvpTitle}
                        onChange={(e) => setRsvpTitle(e.target.value)}
                        placeholder="Reserve Your Attendance"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Submit Button Label</label>
                      <Input
                        value={rsvpButtonLabel}
                        onChange={(e) => setRsvpButtonLabel(e.target.value)}
                        placeholder="Confirm Attendance"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Form Subtitle / Curatorial Notice</label>
                    <Input
                      value={rsvpSubtitle}
                      onChange={(e) => setRsvpSubtitle(e.target.value)}
                      placeholder="Strictly limited seating for patrons and invited connoisseurs."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Post-Submission Success Message</label>
                    <Input
                      value={rsvpSuccessMessage}
                      onChange={(e) => setRsvpSuccessMessage(e.target.value)}
                      placeholder="We look forward to welcoming you..."
                    />
                  </div>

                  {/* Attendance Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border/80 bg-card/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-foreground block">Require Phone Number</span>
                        <span className="text-[10px] text-muted-foreground">Mandatory WhatsApp/phone verification</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={rsvpRequirePhone}
                        onChange={(e) => setRsvpRequirePhone(e.target.checked)}
                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-foreground block">Allow Guest / Party Count</span>
                        <span className="text-[10px] text-muted-foreground">Enable +1s or family party size</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={rsvpAllowGuestCount}
                        onChange={(e) => setRsvpAllowGuestCount(e.target.checked)}
                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                      />
                    </div>

                    {/* Date Requirement Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-foreground block">Require Date Selection</span>
                        <span className="text-[10px] text-muted-foreground">Guest must pick an attendance day</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={rsvpRequireDateSelection}
                        onChange={(e) => setRsvpRequireDateSelection(e.target.checked)}
                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                      />
                    </div>

                    {/* Multi-Date Selection Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-foreground block">Allow Selecting Multiple Attendance Dates</span>
                        <span className="text-[10px] text-muted-foreground">Allow guests to check multiple exhibition days</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={rsvpAllowMultipleDates}
                        onChange={(e) => setRsvpAllowMultipleDates(e.target.checked)}
                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                      />
                    </div>

                    {/* Time Slot Requirement */}
                    <div className="space-y-1 sm:col-span-2 pt-2 border-t border-border/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground block">Time Slot Requirement</span>
                        <span className="text-[10px] text-muted-foreground">Arrival window enforcement</span>
                      </div>
                      <select
                        value={rsvpTimeSlotRequirement}
                        onChange={(e) => setRsvpTimeSlotRequirement(e.target.value as "MANDATORY" | "OPTIONAL" | "DISABLED")}
                        className="w-full bg-card border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option value="MANDATORY">Mandatory (Guest must pick a time slot)</option>
                        <option value="OPTIONAL">Optional (Guest may pick an arrival slot or full-day pass)</option>
                        <option value="DISABLED">Disabled (No time slots, open attendance)</option>
                      </select>
                    </div>

                    {/* Time Slot Interval & Capacity when not disabled */}
                    {rsvpTimeSlotRequirement !== "DISABLED" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:col-span-2 pt-1">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-foreground block">Slot Interval Duration</label>
                          <select
                            value={rsvpSlotIntervalMinutes}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              setRsvpSlotIntervalMinutes(v);
                            }}
                            className="w-full bg-card border border-border text-foreground text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none"
                          >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={45}>45 minutes</option>
                            <option value={60}>60 minutes (1 hour)</option>
                            <option value={120}>2 hours (120 minutes)</option>
                            <option value={0}>Custom Interval...</option>
                          </select>
                          {rsvpSlotIntervalMinutes === 0 && (
                            <Input
                              type="number"
                              min="5"
                              max="360"
                              placeholder="Minutes (e.g. 90)"
                              value={rsvpCustomSlotInterval}
                              onChange={(e) => setRsvpCustomSlotInterval(e.target.value)}
                              className="h-7 text-xs mt-1 font-mono"
                            />
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-foreground block">Slot Capacity / Limit per Slot</label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g. 25 (optional)"
                            value={rsvpSlotCapacity}
                            onChange={(e) => setRsvpSlotCapacity(e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                          <span className="text-[10px] text-muted-foreground block">Leave blank for unlimited slot capacity</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Security & Anti-Spam Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-foreground block">Bot Protection (CAPTCHA)</span>
                        <span className="text-[10px] text-muted-foreground">In-house stateless math challenge before RSVP</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={rsvpEnableCaptcha}
                        onChange={(e) => setRsvpEnableCaptcha(e.target.checked)}
                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-foreground block">Require Email OTP Verification</span>
                        <span className="text-[10px] text-muted-foreground">6-digit email OTP (returning users bypass automatically)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={rsvpEnableEmailOtp}
                        onChange={(e) => setRsvpEnableEmailOtp(e.target.checked)}
                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Custom Questions / Form Fields Builder */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-foreground block">Bespoke Ingestion Fields</span>
                        <span className="text-[10px] text-muted-foreground">Ask attendees about dietary needs, art interests, or seating preferences</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newField: EventRsvpCustomField = {
                            id: `field-${Date.now()}`,
                            label: "Special Seating / Dietary Preference",
                            type: "text",
                            required: false,
                          };
                          setRsvpCustomFields([...rsvpCustomFields, newField]);
                        }}
                        className="h-7 text-xs px-2.5 cursor-pointer"
                      >
                        + Add Field
                      </Button>
                    </div>

                    {rsvpCustomFields.length === 0 ? (
                      <div className="p-4 rounded-lg border border-dashed border-border/70 text-center text-xs text-muted-foreground">
                        Standard attendee name and email are always captured. Click &quot;+ Add Field&quot; to add custom questions.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {rsvpCustomFields.map((field, fIdx) => (
                          <div
                            key={field.id}
                            className="p-3 rounded-lg border border-border bg-background/80 flex flex-col sm:flex-row items-start sm:items-center gap-2"
                          >
                            <Input
                              value={field.label}
                              onChange={(e) => {
                                const updated = [...rsvpCustomFields];
                                updated[fIdx].label = e.target.value;
                                setRsvpCustomFields(updated);
                              }}
                              placeholder="Field Question / Label"
                              className="flex-1 h-8 text-xs"
                            />
                            <select
                              value={field.type}
                              onChange={(e) => {
                                const updated = [...rsvpCustomFields];
                                updated[fIdx].type = e.target.value as "text" | "select" | "checkbox";
                                setRsvpCustomFields(updated);
                              }}
                              className="h-8 text-xs border border-border rounded px-2 bg-background"
                            >
                              <option value="text">Text Answer</option>
                              <option value="checkbox">Yes/No Checkbox</option>
                            </select>
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => {
                                  const updated = [...rsvpCustomFields];
                                  updated[fIdx].required = e.target.checked;
                                  setRsvpCustomFields(updated);
                                }}
                                className="w-3.5 h-3.5 accent-primary rounded"
                              />
                              Required
                            </label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRsvpCustomFields(rsvpCustomFields.filter((_, idx) => idx !== fIdx));
                              }}
                              className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700"
                              title="Delete Field"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 5: HERO BANNER & EVENT GALLERY */}
            <TabsContent value="media" className="m-0 space-y-6">
              {/* Hero Banner Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">
                      Exhibition Hero Banner
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Wide banner rendered prominently at the top of the event page.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBannerPickerOpen(true)}
                      className="text-xs h-8 gap-1.5"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-primary" />
                      Media Vault / Upload
                    </Button>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-input/50 hover:bg-input text-xs font-medium cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-primary" />
                      {uploadingBanner ? "Uploading..." : "Direct Upload"}
                      <input
                        type="file"
                        accept="image/*,.heic,.heics"
                        disabled={uploadingBanner}
                        onChange={handleBannerUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {bannerImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-border h-48 sm:h-64 w-full group bg-card">
                    <Image
                      src={bannerImage}
                      alt="Hero Banner Preview"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setBannerPickerOpen(true)}
                      >
                        <FolderOpen className="w-3.5 h-3.5 mr-1" />
                        Change Banner
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setBannerImage("")}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove Banner
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground bg-muted/10">
                    <ImageIcon className="w-8 h-8 text-primary mx-auto mb-2 opacity-50" />
                    No hero banner uploaded. Recommended size: 1920x800px. Supports JPG, PNG, WebP, HEIC/HEICS.
                  </div>
                )}
              </div>

              {/* Multi-Image Event Gallery Studio */}
              <div className="space-y-4 pt-4 border-t border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">
                      Event Photo Gallery Studio ({galleryImages.length})
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Multi-mode media showcase supporting auto-carousels, smooth scroll tracks, and heritage collages (JPG, PNG, WebP, HEIC/HEICS).
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setGalleryPickerOpen(true)}
                      className="text-xs h-8 gap-1.5"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-primary" />
                      Add from Vault / Local
                    </Button>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-input/50 hover:bg-input text-xs font-medium cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-primary" />
                      {uploadingGallery ? "Uploading..." : "Direct Files"}
                      <input
                        type="file"
                        multiple
                        accept="image/*,.heic,.heics"
                        disabled={uploadingGallery}
                        onChange={handleGalleryUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Display Mode & Settings Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl border border-border bg-muted/20">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                      Gallery Display Engine
                    </label>
                    <select
                      value={galleryDisplayMode}
                      onChange={(e) => setGalleryDisplayMode(e.target.value)}
                      className="w-full bg-card border border-border text-foreground text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="CAROUSEL">Auto-playing Carousel (High-Fidelity Slides)</option>
                      <option value="SCROLL">Smooth Horizontal Scroll Track (Swipeable)</option>
                      <option value="COLLAGE">5-Photo Heritage Collage (Bento Grid)</option>
                    </select>
                  </div>

                  {galleryDisplayMode === "CAROUSEL" ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-primary" />
                          Autoplay Transition Interval
                        </label>
                        <span className="font-mono text-xs text-primary font-semibold">
                          {galleryAutoplayTimer}s
                        </span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={10}
                        step={1}
                        value={galleryAutoplayTimer}
                        onChange={(e) => setGalleryAutoplayTimer(parseInt(e.target.value, 10))}
                        className="w-full accent-primary cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                        <span>2s (Fast)</span>
                        <span>4s (Default)</span>
                        <span>10s (Slow)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-xs text-muted-foreground flex flex-col justify-center">
                      <span className="font-medium text-foreground">Presentation Mode</span>
                      <p className="text-[11px] leading-relaxed">
                        {galleryDisplayMode === "SCROLL"
                          ? "Displays full-height responsive cards along an overflow-x scroll container."
                          : "Curates the first 5 images in a golden ratio masonry collage; extras open in lightbox."}
                      </p>
                    </div>
                  )}
                </div>

                {galleryImages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground bg-muted/10">
                    No gallery photos attached. Click &quot;Add Photos&quot; to upload multiple images.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {galleryImages.map((img, idx) => (
                      <div
                        key={img.id || idx}
                        className="rounded-lg border border-border bg-card overflow-hidden flex flex-col space-y-2 p-2.5 shadow-xs"
                      >
                        <div className="relative h-36 w-full rounded-md overflow-hidden bg-muted/30">
                          <Image
                            src={img.url}
                            alt={img.title || img.caption || `Gallery ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-white px-1.5 py-0.5 rounded text-[10px] font-mono">
                            #{idx + 1}
                          </div>

                          <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveGalleryImage(idx, "up")}
                              className="bg-black/70 hover:bg-primary disabled:opacity-30 text-white p-1 rounded transition-colors"
                              title="Move Left / Earlier"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === galleryImages.length - 1}
                              onClick={() => moveGalleryImage(idx, "down")}
                              className="bg-black/70 hover:bg-primary disabled:opacity-30 text-white p-1 rounded transition-colors"
                              title="Move Right / Later"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(idx)}
                              className="bg-black/70 hover:bg-destructive text-white p-1 rounded transition-colors"
                              title="Delete Photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Input
                            placeholder="Photo Title / Heading..."
                            value={img.title || ""}
                            onChange={(e) => updateGalleryItemField(idx, "title", e.target.value)}
                            className="text-xs h-7"
                          />
                          <Input
                            placeholder="Photo Caption / Commentary..."
                            value={img.caption || ""}
                            onChange={(e) => updateGalleryItemField(idx, "caption", e.target.value)}
                            className="text-xs h-7"
                          />

                          {/* Optional Link Configuration */}
                          <div className="pt-1 flex items-center gap-1.5">
                            <select
                              value={img.linkType || "none"}
                              onChange={(e) => updateGalleryItemField(idx, "linkType", e.target.value)}
                              className="bg-muted/40 border border-border text-foreground text-[10px] rounded px-1.5 py-1 focus:outline-none"
                            >
                              <option value="none">No Link</option>
                              <option value="artwork">Link to Artwork</option>
                              <option value="custom">Custom URL</option>
                            </select>

                            {img.linkType === "artwork" ? (
                              <select
                                value={img.linkTarget || ""}
                                onChange={(e) => updateGalleryItemField(idx, "linkTarget", e.target.value)}
                                className="flex-1 bg-card border border-border text-foreground text-[10px] rounded px-1.5 py-1 focus:outline-none truncate"
                              >
                                <option value="">Select Artwork...</option>
                                {artworksCatalog.map((art) => (
                                  <option key={art.id} value={art.slug}>
                                    {art.title}
                                  </option>
                                ))}
                              </select>
                            ) : img.linkType === "custom" ? (
                              <Input
                                placeholder="https://... or /page"
                                value={img.linkTarget || ""}
                                onChange={(e) => updateGalleryItemField(idx, "linkTarget", e.target.value)}
                                className="text-[10px] h-6 flex-1 py-0"
                              />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 6: EVENT PDF BROCHURE / MONOGRAPH */}
            <TabsContent value="brochure" className="m-0 space-y-6">
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 text-xs flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-foreground block text-sm">
                    Event Brochure &amp; Publication Engine
                  </span>
                  <p className="text-muted-foreground leading-relaxed text-xs">
                    Upload a high-fidelity archival PDF catalog, event program, or publication brochure. An interactive document viewer with download capabilities will be embedded directly into the public event page.
                  </p>
                </div>
              </div>

              {/* Upload Controls */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block">
                      Program Brochure File (PDF)
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Upload archival document in PDF format (up to 50MB).
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBrochurePickerOpen(true)}
                      className="text-xs h-8 gap-1.5"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-primary" />
                      Select / Upload PDF
                    </Button>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-input/50 hover:bg-input text-xs font-medium cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-primary" />
                      {uploadingBrochure ? "Uploading..." : "Direct PDF"}
                      <input
                        type="file"
                        accept="application/pdf"
                        disabled={uploadingBrochure}
                        onChange={handleBrochureUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Document Title
                    </label>
                    <Input
                      placeholder="e.g. Event Program & Publication Brochure"
                      value={brochureTitle}
                      onChange={(e) => setBrochureTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Direct PDF URL (Manual / CDN)
                    </label>
                    <Input
                      placeholder="https://... or /uploads/brochure.pdf"
                      value={brochurePdfUrl}
                      onChange={(e) => setBrochurePdfUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={brochureDownloadable}
                      onChange={(e) => setBrochureDownloadable(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    Enable Attendee PDF Download Button on Public Page
                  </label>
                </div>
              </div>

              {/* PDF Preview Card */}
              {brochurePdfUrl ? (
                <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-foreground">
                          {brochureTitle || "Event Brochure"}
                        </h4>
                        <span className="text-[11px] text-muted-foreground font-mono truncate max-w-md block">
                          {brochurePdfUrl}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={brochurePdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-border hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Preview
                      </a>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setBrochurePdfUrl("")}
                        className="h-7 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>

                  {/* Embedded PDF iframe preview */}
                  <div className="rounded-lg overflow-hidden border border-border h-64 bg-muted/20">
                    <iframe
                      src={`${brochurePdfUrl}#toolbar=0`}
                      className="w-full h-full border-0"
                      title={brochureTitle}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground bg-muted/10">
                  <FileText className="w-8 h-8 text-primary mx-auto mb-2 opacity-40" />
                  No brochure attached. Click &quot;Upload Brochure (PDF)&quot; above to attach a monograph.
                </div>
              )}
            </TabsContent>

            {/* TAB 8: EXHIBITION ARTWORKS CATALOG */}
            <TabsContent value="artworks" className="m-0 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border/60">
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Attach Masterworks to Exhibition Floor
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Filter by traditional school, search titles/mediums, or audit selected works ({selectedArtworkIds.length} chosen).
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={showOnlySelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowOnlySelected(!showOnlySelected)}
                    className="text-xs h-8 gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Selected Only ({selectedArtworkIds.length})
                  </Button>
                  {selectedArtworkIds.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedArtworkIds([])}
                      className="text-xs h-8 text-destructive hover:text-destructive"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              {/* Instant Search & School Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-muted/20 p-2.5 rounded-lg border border-border/70">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by catalog title, medium, category, or slug..."
                    value={artworkSearchQuery}
                    onChange={(e) => setArtworkSearchQuery(e.target.value)}
                    className="pl-9 text-xs h-8 bg-card"
                  />
                  {artworkSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setArtworkSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {artworkSchools.length > 0 && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0 hidden sm:inline" />
                    <select
                      value={selectedSchoolFilter}
                      onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                      className="bg-card border border-border text-foreground text-xs rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none h-8 min-w-[140px]"
                    >
                      <option value="ALL">All Schools ({artworksCatalog.length})</option>
                      {artworkSchools.map((school) => {
                        const count = artworksCatalog.filter((a) => a.category?.name === school).length;
                        return (
                          <option key={school} value={school}>
                            {school} ({count})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>

              {/* Artwork Cards Grid */}
              {filteredArtworks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground bg-muted/10">
                  <Palette className="w-8 h-8 text-primary mx-auto mb-2 opacity-40" />
                  <p className="font-medium text-foreground">No artworks match the current filters.</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Try clearing the search query or switching schools.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {filteredArtworks.map((art) => {
                    const isSelected = selectedArtworkIds.includes(art.id);
                    return (
                      <div
                        key={art.id}
                        onClick={() => toggleArtworkSelection(art.id)}
                        className={`cursor-pointer rounded-lg border p-2.5 flex items-center gap-3 transition-all select-none ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                            : "border-border bg-card/70 hover:border-primary/40 hover:bg-card"
                        }`}
                      >
                        <div className="relative w-12 h-12 rounded overflow-hidden bg-muted/40 shrink-0 border border-border/60">
                          {art.primaryImageUrl ? (
                            <Image
                              src={art.primaryImageUrl}
                              alt={art.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Palette className="w-5 h-5 m-auto text-muted-foreground" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold text-foreground block truncate" title={art.title}>
                            {art.title}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {art.category?.name && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-900 dark:text-amber-300 font-medium truncate max-w-[90px]">
                                {art.category.name}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground truncate max-w-[110px]" title={art.medium}>
                              {art.medium}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </div>

          <DialogFooter className="px-6 py-3 border-t border-border/60 bg-muted/20 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {liveSchedulePreview ? (
                <span className="truncate max-w-sm block">
                  <span className="font-semibold text-foreground">Schedule:</span> {liveSchedulePreview}
                </span>
              ) : (
                "All times strictly preserved in the event's selected IANA timezone."
              )}
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="min-w-[100px]"
              >
                {saving ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </DialogFooter>
        </Tabs>
      </form>

      {/* Universal Media Dialogs */}
      <UniversalMediaDialog
        open={bannerPickerOpen}
        onOpenChange={setBannerPickerOpen}
        title="Select Event Hero Banner"
        acceptedTypes="image"
        allowMultiple={false}
        onSelect={(item) => {
          setBannerImage(item.url);
          toast.success("Hero banner updated");
        }}
      />

      <UniversalMediaDialog
        open={galleryPickerOpen}
        onOpenChange={setGalleryPickerOpen}
        title="Add Event Gallery Photos"
        acceptedTypes="image"
        allowMultiple={true}
        onSelectMultiple={(items) => {
          const newGalleryItems: GalleryImageItem[] = items.map((item, idx) => {
            const cleanName = (item.originalFileName || item.title || "Photo")
              .replace(/\.[^/.]+$/, "")
              .replace(/[-_]/g, " ");
            return {
              id: `gal-${Date.now()}-${idx}`,
              url: item.url,
              title: cleanName,
              caption: "",
              alt: "",
              linkType: "none",
              linkTarget: "",
            };
          });
          setGalleryImages((prev) => [...prev, ...newGalleryItems]);
          toast.success(`Added ${newGalleryItems.length} photos to gallery`);
        }}
      />

      <UniversalMediaDialog
        open={brochurePickerOpen}
        onOpenChange={setBrochurePickerOpen}
        title="Select Program Brochure (PDF)"
        acceptedTypes="pdf"
        allowMultiple={false}
        onSelect={(item) => {
          setBrochurePdfUrl(item.url);
          if (!brochureTitle || brochureTitle === "Event Program & Publication Brochure" || brochureTitle === "Exhibition Monograph & Program Brochure") {
            const docName = (item.originalFileName || item.title || "Event Brochure")
              .replace(/\.[^/.]+$/, "")
              .replace(/[-_]/g, " ");
            setBrochureTitle(docName);
          }
          toast.success("PDF Brochure selected");
        }}
      />
    </DialogContent>
  );
}
