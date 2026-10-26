import * as React from "react";
import {
  Globe,
  Link as LinkIcon,
  MessageCircle,
  Music,
  Video,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  BookOpen,
  Sparkles,
  Share2,
  ExternalLink,
} from "lucide-react";

export interface CustomSocialLink {
  id?: string;
  label: string;
  url: string;
  icon: string;
}

export const CUSTOM_SOCIAL_ICON_OPTIONS = [
  { value: "globe", label: "Globe / Website" },
  { value: "link", label: "Chain Link" },
  { value: "threads", label: "Threads (@)" },
  { value: "bluesky", label: "Bluesky" },
  { value: "whatsapp", label: "WhatsApp / Chat" },
  { value: "twitter", label: "X / Twitter" },
  { value: "pinterest", label: "Pinterest" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "music", label: "Music / SoundCloud / Spotify" },
  { value: "video", label: "Video / Vimeo" },
  { value: "shopping-bag", label: "Collector Store / Artsy" },
  { value: "book-open", label: "Catalog / Publication" },
  { value: "map-pin", label: "Gallery Location / Map" },
  { value: "mail", label: "Email / Newsletter" },
  { value: "phone", label: "Direct Phone" },
  { value: "sparkles", label: "Atelier Highlight" },
] as const;

export function SocialPlatformIcon({
  icon,
  iconKey,
  className = "w-3.5 h-3.5",
}: {
  icon?: string;
  iconKey?: string;
  className?: string;
}) {
  const key = (icon || iconKey || "link").toLowerCase().trim();

  if (key.includes("instagram")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }

  if (key.includes("youtube")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <path d="m10 15 5-3-5-3z" />
      </svg>
    );
  }

  if (key.includes("facebook")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    );
  }

  if (key.includes("linkedin")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    );
  }

  if (key.includes("tiktok")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    );
  }

  if (key.includes("pinterest")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 20l4-9" />
        <path d="M10.7 14c.437 1.263 1.43 2 2.55 2c2.071 0 3.75-1.554 3.75-4a5 5 0 1 0-9.7 1.7" />
      </svg>
    );
  }

  if (key.includes("threads")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
      </svg>
    );
  }

  if (key.includes("bluesky")) {
    return <Share2 className={className} />;
  }

  if (key.includes("twitter") || key === "x") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
        <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
      </svg>
    );
  }

  if (key.includes("whatsapp") || key.includes("chat")) return <MessageCircle className={className} />;
  if (key.includes("globe") || key.includes("web")) return <Globe className={className} />;
  if (key.includes("music") || key.includes("soundcloud") || key.includes("spotify")) return <Music className={className} />;
  if (key.includes("video") || key.includes("vimeo")) return <Video className={className} />;
  if (key.includes("shop") || key.includes("store")) return <ShoppingBag className={className} />;
  if (key.includes("book") || key.includes("catalog")) return <BookOpen className={className} />;
  if (key.includes("map") || key.includes("pin")) return <MapPin className={className} />;
  if (key.includes("mail")) return <Mail className={className} />;
  if (key.includes("phone")) return <Phone className={className} />;
  if (key.includes("sparkle")) return <Sparkles className={className} />;
  if (key.includes("link")) return <LinkIcon className={className} />;

  return <ExternalLink className={className} />;
}
