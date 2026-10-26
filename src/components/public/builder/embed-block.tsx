"use client";

import React, { useEffect, useMemo, useRef } from "react";
import {
  parseVideoEmbedUrl,
  type MediaAspectRatio,
  type MediaAlign,
  type MediaBackdropMode,
} from "@/lib/video-embed-parser";

export type EmbedAspectRatio = MediaAspectRatio;
export type EmbedSandboxMode = "sandboxed" | "unconstrained";

export interface EmbedBlockProps {
  embedHtml?: string | null;
  caption?: string;
  aspectRatio?: EmbedAspectRatio;
  sandboxMode?: EmbedSandboxMode;
  align?: MediaAlign;
  backdropMode?: MediaBackdropMode;
  backdropColor?: string;
  width?: "25%" | "33%" | "50%" | "66%" | "75%" | "100%";
  borderClass?: string;
  className?: string;
}

/**
 * Normalizes any raw watch/post URLs accidentally placed inside an <iframe src="...">
 * (e.g., <iframe src="https://www.youtube.com/watch?v=...">) into valid embed URLs.
 */
function normalizeEmbeddedIframes(rawHtml: string): string {
  const trimmed = rawHtml.trim();
  // If user pasted a bare URL instead of HTML, wrap it in an iframe or video tag
  if (/^https?:\/\/\S+$/i.test(trimmed)) {
    const parsed = parseVideoEmbedUrl(trimmed);
    if (parsed?.kind === "video") {
      return `<video src="${parsed.embedUrl}" controls playsinline style="width:100%;height:auto;border-radius:8px;"></video>`;
    }
    const embedSrc = parsed?.embedUrl || trimmed;
    return `<iframe src="${embedSrc}" style="width:100%;height:100%;min-height:360px;border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen loading="lazy"></iframe>`;
  }

  return trimmed.replace(
    /(<iframe\b[^>]*?\bsrc=["'])([^"']+)(["'][^>]*>)/gi,
    (_full, prefix: string, srcUrl: string, suffix: string) => {
      const parsed = parseVideoEmbedUrl(srcUrl);
      if (parsed && parsed.kind === "iframe" && parsed.embedUrl !== srcUrl) {
        return `${prefix}${parsed.embedUrl}${suffix}`;
      }
      return `${prefix}${srcUrl}${suffix}`;
    }
  );
}

export function EmbedBlock({
  embedHtml,
  caption,
  aspectRatio = "auto",
  sandboxMode = "sandboxed",
  align = "center",
  backdropMode = "transparent",
  backdropColor = "#0D0E12",
  width = "100%",
  borderClass = "border border-border/60 shadow-sm",
  className = "",
}: EmbedBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedHtml = useMemo(() => {
    if (!embedHtml || typeof embedHtml !== "string") return "";
    return normalizeEmbeddedIframes(embedHtml);
  }, [embedHtml]);

  // For unconstrained mode: mount HTML and execute embedded <script> tags for widgets (Stripe, Razorpay, Calendly, Instagram, Twitter/X, TikTok)
  useEffect(() => {
    if (sandboxMode !== "unconstrained" || !containerRef.current || !normalizedHtml) return;
    const root = containerRef.current;
    root.innerHTML = normalizedHtml;

    const scripts = Array.from(root.querySelectorAll("script"));
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [normalizedHtml, sandboxMode]);

  if (!normalizedHtml) return null;

  const alignClass =
    align === "left"
      ? "mr-auto"
      : align === "right"
      ? "ml-auto"
      : "mx-auto";

  const flexJustifyClass =
    align === "left"
      ? "justify-start"
      : align === "right"
      ? "justify-end"
      : "justify-center";

  const widthClass =
    width === "25%"
      ? "w-full md:w-1/4"
      : width === "33%"
      ? "w-full md:w-1/3"
      : width === "50%"
      ? "w-full md:w-1/2"
      : width === "66%"
      ? "w-full md:w-2/3"
      : width === "75%"
      ? "w-full md:w-3/4"
      : "w-full";

  const aspectClass =
    aspectRatio === "16:9"
      ? "aspect-video w-full"
      : aspectRatio === "9:16"
      ? "aspect-[9/16] w-full max-w-[380px]"
      : aspectRatio === "4:5"
      ? "aspect-[4/5] w-full max-w-[440px]"
      : aspectRatio === "4:3"
      ? "aspect-[4/3] w-full"
      : aspectRatio === "1:1"
      ? "aspect-square w-full max-w-[540px]"
      : "w-full min-h-[120px]";

  const srcDocHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: transparent; font-family: system-ui, -apple-system, sans-serif; overflow-x: hidden; }
  .embed-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: stretch; justify-content: center; }
  iframe, video { max-width: 100% !important; width: 100%; ${aspectRatio === "auto" ? "min-height: 360px;" : "height: 100% !important;"} border: 0; }
</style>
</head>
<body>
  <div class="embed-wrapper">${normalizedHtml}</div>
</body>
</html>`;

  const hasStageBackdrop =
    backdropMode === "solid" || backdropMode === "blurred";

  return (
    <figure className={`${widthClass} ${alignClass} ${className}`}>
      <div
        className={`relative w-full overflow-hidden rounded-xl flex items-center ${flexJustifyClass} ${
          hasStageBackdrop ? `p-3 sm:p-5 ${borderClass}` : ""
        }`}
        style={
          backdropMode === "solid"
            ? { backgroundColor: backdropColor || "#0D0E12" }
            : backdropMode === "blurred"
            ? { backgroundColor: "#0D0E12" }
            : undefined
        }
      >
        {backdropMode === "blurred" && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden opacity-45 blur-2xl scale-110"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(212,175,55,0.45), rgba(163,40,30,0.35), rgba(13,14,18,0.95))",
            }}
          />
        )}

        <div
          className={`relative z-10 overflow-hidden rounded-lg bg-card/40 ${
            hasStageBackdrop ? "shadow-xl" : borderClass
          } ${aspectClass}`}
        >
          {sandboxMode === "sandboxed" ? (
            <iframe
              srcDoc={srcDocHtml}
              title={caption || "Embedded third-party widget"}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen; payment"
              allowFullScreen
              className={`w-full border-0 ${
                aspectRatio === "auto" ? "min-h-[380px] h-full" : "h-full"
              }`}
            />
          ) : (
            <div
              ref={containerRef}
              className={`w-full ${
                aspectRatio === "auto"
                  ? "[&_iframe]:w-full [&_iframe]:min-h-[360px] [&_iframe]:border-0"
                  : "h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
              }`}
            />
          )}
        </div>
      </div>

      {caption && (
        <figcaption
          className={`mt-2.5 font-serif italic text-xs text-muted-foreground ${
            align === "left"
              ? "text-left"
              : align === "right"
              ? "text-right"
              : "text-center"
          }`}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
