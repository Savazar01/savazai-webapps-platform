export type VideoProvider =
  | "youtube"
  | "vimeo"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "native"
  | "iframe";

export type MediaAspectRatio = "16:9" | "9:16" | "1:1" | "4:5" | "4:3" | "auto";
export type MediaAlign = "left" | "center" | "right";
export type MediaBackdropMode = "transparent" | "solid" | "blurred";

export interface ParsedVideoEmbed {
  kind: "iframe" | "video";
  provider: VideoProvider;
  embedUrl: string;
  originalUrl: string;
  aspectRatio?: MediaAspectRatio;
}

export interface EmbedMediaParams {
  autoplay: boolean;
  loop: boolean;
  mute: boolean;
  controls: boolean;
  modestBranding: boolean;
  captions: boolean;
}

/**
 * Universal Video & Social Media Embed URL Transformer
 * Converts raw public watch/post URLs (YouTube, Vimeo, Facebook, Instagram, TikTok)
 * into legitimate embeddable URLs to prevent CSP / X-Frame-Options blocking errors.
 */
export function parseVideoEmbedUrl(rawInput: string | undefined | null): ParsedVideoEmbed | null {
  if (!rawInput || typeof rawInput !== "string") return null;
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // If the user pasted a full <iframe ... src="..." ...> tag into the video URL input, extract the src
  const iframeSrcMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  const candidateUrl = iframeSrcMatch ? iframeSrcMatch[1].trim() : trimmed;

  // 1. Direct HTML5 video files or local /media/ uploads
  const cleanPath = candidateUrl.split("?")[0].split("#")[0].toLowerCase();
  if (
    cleanPath.endsWith(".mp4") ||
    cleanPath.endsWith(".webm") ||
    cleanPath.endsWith(".ogg") ||
    cleanPath.endsWith(".mov") ||
    cleanPath.endsWith(".m4v") ||
    candidateUrl.startsWith("/media/") ||
    candidateUrl.startsWith("/api/media/")
  ) {
    return {
      kind: "video",
      provider: "native",
      embedUrl: candidateUrl,
      originalUrl: trimmed,
      aspectRatio: "auto",
    };
  }

  // 2. YouTube (watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, youtube.com/live/ID, youtube.com/embed/ID)
  try {
    const parsed = new URL(candidateUrl);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com" ||
      host === "youtu.be"
    ) {
      let videoId: string | null = null;
      let isShorts = false;

      if (host === "youtu.be") {
        videoId = parsed.pathname.split("/").filter(Boolean)[0] || null;
      } else if (parsed.pathname.startsWith("/watch")) {
        videoId = parsed.searchParams.get("v");
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/shorts/")[1]?.split("/")[0] || null;
        isShorts = true;
      } else if (parsed.pathname.startsWith("/live/")) {
        videoId = parsed.pathname.split("/live/")[1]?.split("/")[0] || null;
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/embed/")[1]?.split("/")[0] || null;
      } else if (parsed.pathname.startsWith("/v/")) {
        videoId = parsed.pathname.split("/v/")[1]?.split("/")[0] || null;
      }

      if (videoId) {
        const sanitizedId = videoId.replace(/[^a-zA-Z0-9_-]/g, "");
        const params = new URLSearchParams(parsed.search);
        params.delete("v");
        params.delete("t");
        if (!params.has("rel")) params.set("rel", "0");
        const startParam = parsed.searchParams.get("t") || parsed.searchParams.get("start");
        if (startParam) {
          const seconds = parseInt(startParam.replace(/s$/i, ""), 10);
          if (!Number.isNaN(seconds) && seconds > 0) {
            params.set("start", String(seconds));
          }
        }
        return {
          kind: "iframe",
          provider: "youtube",
          embedUrl: `https://www.youtube-nocookie.com/embed/${sanitizedId}?${params.toString()}`,
          originalUrl: trimmed,
          aspectRatio: isShorts ? "9:16" : "16:9",
        };
      }
    }

    // 3. Vimeo (vimeo.com/ID, vimeo.com/channels/.../ID, player.vimeo.com/video/ID)
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const segments = parsed.pathname.split("/").filter(Boolean);
      const numericId = [...segments].reverse().find((seg) => /^\d+$/.test(seg));
      if (numericId) {
        const idIdx = segments.indexOf(numericId);
        const hashSegment =
          idIdx >= 0 && segments[idIdx + 1] && /^[a-zA-Z0-9]+$/.test(segments[idIdx + 1])
            ? segments[idIdx + 1]
            : parsed.searchParams.get("h");
        const params = new URLSearchParams(parsed.search);
        if (hashSegment) params.set("h", hashSegment);
        const qs = params.toString();
        return {
          kind: "iframe",
          provider: "vimeo",
          embedUrl: `https://player.vimeo.com/video/${numericId}${qs ? `?${qs}` : ""}`,
          originalUrl: trimmed,
          aspectRatio: "16:9",
        };
      }
    }

    // 4. Facebook Video (facebook.com/.../videos/..., fb.watch/..., facebook.com/reel/...)
    if (
      host === "facebook.com" ||
      host === "m.facebook.com" ||
      host === "web.facebook.com" ||
      host === "fb.watch"
    ) {
      if (parsed.pathname.includes("/plugins/video.php")) {
        return {
          kind: "iframe",
          provider: "facebook",
          embedUrl: candidateUrl,
          originalUrl: trimmed,
          aspectRatio: "16:9",
        };
      }
      return {
        kind: "iframe",
        provider: "facebook",
        embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
          candidateUrl
        )}&show_text=false`,
        originalUrl: trimmed,
        aspectRatio: parsed.pathname.includes("/reel/") ? "9:16" : "16:9",
      };
    }

    // 5. Instagram Post / Reel / IGTV (instagram.com/p/ID, instagram.com/reel/ID, instagram.com/tv/ID)
    if (host === "instagram.com" || host === "instagr.am") {
      const igMatch = parsed.pathname.match(/^\/(p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/i);
      if (igMatch) {
        const postType = igMatch[1].toLowerCase() === "reels" ? "reel" : igMatch[1].toLowerCase();
        const shortcode = igMatch[2];
        return {
          kind: "iframe",
          provider: "instagram",
          embedUrl: `https://www.instagram.com/${postType}/${shortcode}/embed`,
          originalUrl: trimmed,
          aspectRatio: postType === "reel" ? "9:16" : "1:1",
        };
      }
    }

    // 6. TikTok Video (tiktok.com/@user/video/ID or tiktok.com/embed/v2/ID)
    if (host === "tiktok.com" || host === "vm.tiktok.com" || host === "vt.tiktok.com") {
      const ttMatch = parsed.pathname.match(/\/(?:video|v2)\/(\d+)/i);
      if (ttMatch) {
        return {
          kind: "iframe",
          provider: "tiktok",
          embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}`,
          originalUrl: trimmed,
          aspectRatio: "9:16",
        };
      }
    }
  } catch {
    // Not a full URL with protocol — fall through to regex fallbacks
  }

  // Regex fallback for bare youtube/vimeo links without protocol
  const ytFallback = candidateUrl.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (ytFallback) {
    return {
      kind: "iframe",
      provider: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytFallback[1]}?rel=0`,
      originalUrl: trimmed,
      aspectRatio: "16:9",
    };
  }

  const vimeoFallback = candidateUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoFallback) {
    return {
      kind: "iframe",
      provider: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoFallback[1]}`,
      originalUrl: trimmed,
      aspectRatio: "16:9",
    };
  }

  return {
    kind: "iframe",
    provider: "iframe",
    embedUrl: candidateUrl,
    originalUrl: trimmed,
    aspectRatio: "16:9",
  };
}

/**
 * Parses URL query parameters or HTML embed attributes into a structured EmbedMediaParams object
 * for the Visual Parameter Inspector.
 */
export function extractEmbedParameters(urlOrHtml: string | undefined | null): EmbedMediaParams {
  const defaults: EmbedMediaParams = {
    autoplay: false,
    loop: false,
    mute: false,
    controls: true,
    modestBranding: true,
    captions: false,
  };

  if (!urlOrHtml || typeof urlOrHtml !== "string") return defaults;
  const trimmed = urlOrHtml.trim();
  if (!trimmed) return defaults;

  const iframeSrcMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  const targetUrlStr = iframeSrcMatch ? iframeSrcMatch[1] : trimmed;

  try {
    const parsed = parseVideoEmbedUrl(targetUrlStr);
    const urlObj = new URL(parsed?.embedUrl || targetUrlStr, "https://savazar.com");
    const sp = urlObj.searchParams;

    const isTruthy = (val: string | null) => val === "1" || val === "true";
    const isFalsy = (val: string | null) => val === "0" || val === "false";

    return {
      autoplay: isTruthy(sp.get("autoplay")) || /\bautoplay\b/i.test(trimmed),
      loop: isTruthy(sp.get("loop")) || /\bloop\b/i.test(trimmed),
      mute:
        isTruthy(sp.get("mute")) ||
        isTruthy(sp.get("muted")) ||
        /\bmuted\b/i.test(trimmed),
      controls: isFalsy(sp.get("controls")) ? false : true,
      modestBranding: isFalsy(sp.get("modestbranding")) ? false : true,
      captions:
        isTruthy(sp.get("cc_load_policy")) ||
        isTruthy(sp.get("texttrack")) ||
        isTruthy(sp.get("show_captions")),
    };
  } catch {
    return defaults;
  }
}

/**
 * Applies updated EmbedMediaParams to a raw video URL or HTML <iframe ...> snippet.
 */
export function applyEmbedParameters(
  urlOrHtml: string | undefined | null,
  updates: Partial<EmbedMediaParams>
): string {
  const raw = (urlOrHtml || "").trim();
  if (!raw) return "";

  const current = {
    ...extractEmbedParameters(raw),
    ...updates,
  };

  const updateSingleUrl = (inputUrl: string): string => {
    const parsed = parseVideoEmbedUrl(inputUrl);
    const baseStr = parsed?.embedUrl || inputUrl;
    try {
      const urlObj = new URL(baseStr);
      const sp = urlObj.searchParams;

      if (current.autoplay) sp.set("autoplay", "1");
      else sp.delete("autoplay");

      if (current.loop) {
        sp.set("loop", "1");
        // YouTube requires playlist=VIDEO_ID for single video loop
        const ytIdMatch = urlObj.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
        if (ytIdMatch && ytIdMatch[1]) {
          sp.set("playlist", ytIdMatch[1]);
        }
      } else {
        sp.delete("loop");
        sp.delete("playlist");
      }

      if (current.mute) {
        sp.set("mute", "1");
        sp.set("muted", "1");
      } else {
        sp.delete("mute");
        sp.delete("muted");
      }

      if (!current.controls) sp.set("controls", "0");
      else sp.delete("controls");

      if (current.modestBranding) sp.set("modestbranding", "1");
      else sp.set("modestbranding", "0");

      if (current.captions) sp.set("cc_load_policy", "1");
      else sp.delete("cc_load_policy");

      return urlObj.toString();
    } catch {
      return inputUrl;
    }
  };

  if (/<iframe\b/i.test(raw)) {
    return raw.replace(
      /(<iframe\b[^>]*?\bsrc=["'])([^"']+)(["'][^>]*>)/gi,
      (_full, prefix: string, srcUrl: string, suffix: string) => {
        return `${prefix}${updateSingleUrl(srcUrl)}${suffix}`;
      }
    );
  }

  return updateSingleUrl(raw);
}
