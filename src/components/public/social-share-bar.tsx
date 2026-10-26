"use client";

import * as React from "react";
import {
  Share2,
  Copy,
  Check,
  Mail,
  ExternalLink,
  X as CloseIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SocialPlatformIcon } from "@/components/public/social-icon";

export interface SocialShareBarProps {
  title: string;
  description?: string;
  url?: string;
  mediaUrl?: string;
  entityLabel?: string;
  variant?: "bar" | "compact" | "minimal";
  enabled?: boolean;
  className?: string;
}

// Module-level cache for public share setting so multiple share buttons on a page don't re-fetch
let cachedGlobalShareEnabled: boolean | null = null;
let pendingSettingsPromise: Promise<boolean> | null = null;

async function fetchGlobalShareEnabled(): Promise<boolean> {
  if (cachedGlobalShareEnabled !== null) return cachedGlobalShareEnabled;
  if (pendingSettingsPromise) return pendingSettingsPromise;

  pendingSettingsPromise = fetch("/api/settings/public")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      const resolved = data?.enableSocialShare !== false;
      cachedGlobalShareEnabled = resolved;
      return resolved;
    })
    .catch(() => true);

  return pendingSettingsPromise;
}

export function SocialShareBar({
  title,
  description = "",
  url,
  mediaUrl,
  entityLabel = "Page",
  variant = "bar",
  enabled,
  className = "",
}: SocialShareBarProps) {
  const [globalEnabled, setGlobalEnabled] = React.useState<boolean>(
    enabled !== undefined ? enabled : cachedGlobalShareEnabled ?? true
  );
  const [copied, setCopied] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const resolvedUrl = React.useMemo(() => {
    if (typeof window === "undefined") return url || "";
    if (!url) return window.location.href;
    if (url.startsWith("/")) return `${window.location.origin}${url}`;
    if (url.startsWith("#")) return `${window.location.origin}${window.location.pathname}${url}`;
    return url;
  }, [url]);

  const resolvedMediaUrl = React.useMemo(() => {
    if (!mediaUrl) return "";
    if (typeof window !== "undefined" && mediaUrl.startsWith("/")) {
      return `${window.location.origin}${mediaUrl}`;
    }
    return mediaUrl;
  }, [mediaUrl]);

  React.useEffect(() => {
    if (enabled !== undefined) return;
    let mounted = true;
    fetchGlobalShareEnabled().then((val) => {
      if (mounted) setGlobalEnabled(val);
    });
    return () => {
      mounted = false;
    };
  }, [enabled]);

  React.useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [dropdownOpen]);

  const isShareEnabled = enabled !== undefined ? enabled : globalEnabled;
  if (!isShareEnabled) return null;

  const shareTargetUrl =
    resolvedUrl || (typeof window !== "undefined" ? window.location.href : "");
  const cleanSummary = description
    ? description.replace(/<[^>]+>/g, "").trim().slice(0, 180)
    : "";
  const shareText = cleanSummary ? `${title} — ${cleanSummary}` : title;

  const handleCopyLink = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareTargetUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Unable to copy link");
    }
  };

  const handleNativeOrToggleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const isMobileViewport =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;

    if (canNativeShare && isMobileViewport) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareTargetUrl,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    setDropdownOpen((prev) => !prev);
  };

  const handleExplicitNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title,
        text: shareText,
        url: shareTargetUrl,
      });
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setDropdownOpen(true);
      }
    }
  };

  const encodedUrl = encodeURIComponent(shareTargetUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedFullText = encodeURIComponent(`${title}\n${shareTargetUrl}`);
  const encodedMedia = resolvedMediaUrl ? encodeURIComponent(resolvedMediaUrl) : "";

  const platforms = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: "whatsapp",
      href: `https://api.whatsapp.com/send?text=${encodedFullText}`,
      hoverClass: "hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400",
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: "facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      hoverClass: "hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400",
    },
    {
      id: "x",
      label: "X / Twitter",
      icon: "x",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      hoverClass: "hover:border-foreground/50 hover:bg-foreground/10 hover:text-foreground",
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      icon: "linkedin",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      hoverClass: "hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400",
    },
    {
      id: "pinterest",
      label: "Pinterest",
      icon: "pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}${
        encodedMedia ? `&media=${encodedMedia}` : ""
      }`,
      hoverClass: "hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400",
    },
    {
      id: "email",
      label: "Email",
      icon: "email",
      href: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(
        `${cleanSummary ? cleanSummary + "\n\n" : ""}Explore on the archive: ${shareTargetUrl}`
      )}`,
      hoverClass: "hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400",
    },
  ];

  if (variant === "compact" || variant === "minimal") {
    return (
      <div ref={containerRef} className={cn("relative inline-block print:hidden", className)}>
        <button
          type="button"
          onClick={handleNativeOrToggleShare}
          title={`Share ${title}`}
          aria-label={`Share ${title}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/85 backdrop-blur-md text-xs font-medium text-foreground hover:border-primary/60 hover:text-primary transition-all cursor-pointer shadow-2xs",
            variant === "minimal" ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5"
          )}
        >
          <Share2 className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>Share</span>
        </button>

        {dropdownOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 mt-2 w-72 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-3.5 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary block">
                  Share {entityLabel}
                </span>
                <p className="text-xs font-serif font-semibold text-foreground truncate">
                  {title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDropdownOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {platforms.map((p) => (
                <a
                  key={p.id}
                  href={p.href}
                  target={p.id === "email" ? undefined : "_blank"}
                  rel={p.id === "email" ? undefined : "noopener noreferrer"}
                  onClick={() => setDropdownOpen(false)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-border/60 bg-background/60 text-muted-foreground transition-all text-[10px] font-medium",
                    p.hoverClass
                  )}
                >
                  {p.id === "email" ? (
                    <Mail className="w-4 h-4" />
                  ) : (
                    <SocialPlatformIcon icon={p.icon} className="w-4 h-4" />
                  )}
                  <span className="truncate max-w-full">{p.label}</span>
                </a>
              ))}
            </div>

            <div className="pt-1 border-t border-border/60 flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={shareTargetUrl}
                className="flex-1 min-w-0 text-[10px] font-mono px-2 py-1.5 rounded-lg border border-border bg-muted/40 text-muted-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-90 transition-opacity cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {canNativeShare && (
              <button
                type="button"
                onClick={handleExplicitNativeShare}
                className="w-full py-1.5 rounded-lg border border-primary/30 bg-primary/5 text-primary text-[11px] font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                Open Device Share Sheet
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full horizontal museum share bar
  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md px-4 py-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs print:hidden",
        className
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0">
          <Share2 className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-widest text-primary block font-semibold">
            Share {entityLabel}
          </span>
          <p className="text-xs sm:text-sm font-serif font-semibold text-foreground truncate">
            {title}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {canNativeShare && (
          <button
            type="button"
            onClick={handleExplicitNativeShare}
            className="inline-flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-2xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        )}

        {platforms.map((p) => (
          <a
            key={p.id}
            href={p.href}
            target={p.id === "email" ? undefined : "_blank"}
            rel={p.id === "email" ? undefined : "noopener noreferrer"}
            title={`Share on ${p.label}`}
            aria-label={`Share on ${p.label}`}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border/70 bg-background/70 text-xs font-medium text-muted-foreground transition-all",
              p.hoverClass
            )}
          >
            {p.id === "email" ? (
              <Mail className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <SocialPlatformIcon icon={p.icon} className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="hidden md:inline text-[11px]">{p.label}</span>
          </a>
        ))}

        <button
          type="button"
          onClick={handleCopyLink}
          title="Copy direct link"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-all cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="text-[11px]">{copied ? "Copied!" : "Copy Link"}</span>
        </button>
      </div>
    </div>
  );
}
