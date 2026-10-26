"use client";

import React from "react";
import { parseVideoEmbedUrl } from "@/lib/video-embed-parser";

export interface VideoBlockProps {
  videoUrl?: string | null;
  caption?: string;
  align?: "left" | "center" | "right";
  width?: "25%" | "33%" | "50%" | "66%" | "75%" | "100%";
  borderClass?: string;
  className?: string;
}

export function VideoBlock({
  videoUrl,
  caption,
  align = "center",
  width = "100%",
  borderClass = "border border-border/60 shadow-md",
  className = "",
}: VideoBlockProps) {
  const parsed = parseVideoEmbedUrl(videoUrl);
  if (!parsed) return null;

  const alignClass =
    align === "left"
      ? "mr-auto"
      : align === "right"
      ? "ml-auto"
      : "mx-auto";

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

  const isVerticalReel = parsed.aspectRatio === "9:16";
  const isInstagramSquare = parsed.provider === "instagram" && parsed.aspectRatio === "1:1";

  return (
    <figure className={`${widthClass} ${alignClass} ${className}`}>
      {parsed.kind === "video" ? (
        <div className={`overflow-hidden rounded-lg bg-black/5 ${borderClass}`}>
          <video
            src={parsed.embedUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full h-auto rounded-lg max-h-[680px] object-contain"
          />
        </div>
      ) : (
        <div
          className={`relative overflow-hidden rounded-lg bg-black/5 ${borderClass} ${
            isVerticalReel
              ? "aspect-[9/16] max-w-[380px] mx-auto"
              : isInstagramSquare
              ? "aspect-square max-w-[540px] mx-auto min-h-[480px]"
              : "aspect-video w-full"
          }`}
        >
          <iframe
            src={parsed.embedUrl}
            title={caption || `${parsed.provider} video player`}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
          />
        </div>
      )}
      {caption && (
        <figcaption className="mt-2.5 text-center font-serif italic text-xs text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
