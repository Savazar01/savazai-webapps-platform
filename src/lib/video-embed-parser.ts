export type VideoProvider =
  | "youtube"
  | "vimeo"
  | "facebook"
  | "instagram"
  | "native"
  | "iframe";

export interface ParsedVideoEmbed {
  kind: "iframe" | "video";
  provider: VideoProvider;
  embedUrl: string;
  originalUrl: string;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "auto";
}

/**
 * Universal Video & Social Media Embed URL Transformer
 * Converts raw public watch/post URLs (YouTube, Vimeo, Facebook, Instagram)
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
        const params = new URLSearchParams();
        params.set("rel", "0");
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
      // Find numeric video ID segment
      const numericId = [...segments].reverse().find((seg) => /^\d+$/.test(seg));
      if (numericId) {
        // Check for unlisted hash (e.g. vimeo.com/123456789/abcdef123)
        const idIdx = segments.indexOf(numericId);
        const hashSegment =
          idIdx >= 0 && segments[idIdx + 1] && /^[a-zA-Z0-9]+$/.test(segments[idIdx + 1])
            ? segments[idIdx + 1]
            : parsed.searchParams.get("h");
        const hashQuery = hashSegment ? `?h=${encodeURIComponent(hashSegment)}` : "";
        return {
          kind: "iframe",
          provider: "vimeo",
          embedUrl: `https://player.vimeo.com/video/${numericId}${hashQuery}`,
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
