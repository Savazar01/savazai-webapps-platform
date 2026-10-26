"use client";

import React from "react";
import {
  parseVideoEmbedUrl,
  type MediaAspectRatio,
  type MediaAlign,
  type MediaBackdropMode,
} from "@/lib/video-embed-parser";

export interface VideoBlockProps {
  videoUrl?: string | null;
  caption?: string;
  aspectRatio?: MediaAspectRatio;
  align?: MediaAlign;
  backdropMode?: MediaBackdropMode;
  backdropColor?: string;
  width?: "25%" | "33%" | "50%" | "66%" | "75%" | "100%";
  borderClass?: string;
  className?: string;
}

export function VideoBlock({
  videoUrl,
  caption,
  aspectRatio,
  align = "center",
  backdropMode = "transparent",
  backdropColor = "#0D0E12",
  width = "100%",
  borderClass = "border border-border/60 shadow-md",
  className = "",
}: VideoBlockProps) {
  const parsed = parseVideoEmbedUrl(videoUrl);
  if (!parsed) return null;

  const effectiveRatio: MediaAspectRatio =
    aspectRatio || parsed.aspectRatio || "16:9";

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

  const getPlayerFrameClasses = (ratio: MediaAspectRatio): string => {
    switch (ratio) {
      case "9:16":
        return "aspect-[9/16] w-full max-w-[380px]";
      case "4:5":
        return "aspect-[4/5] w-full max-w-[440px]";
      case "1:1":
        return "aspect-square w-full max-w-[540px]";
      case "4:3":
        return "aspect-[4/3] w-full";
      case "auto":
        return "w-full min-h-[360px]";
      case "16:9":
      default:
        return "aspect-video w-full";
    }
  };

  // Extract YouTube thumbnail if blurred backdrop is requested on a YouTube video
  const ytMatch = parsed.embedUrl.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  const ytThumbUrl = ytMatch
    ? `https://i.ytimg.com/vi/${ytMatch[1]}/hqdefault.jpg`
    : null;

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
            style={
              ytThumbUrl
                ? {
                    backgroundImage: `url("${ytThumbUrl}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : {
                    background:
                      "radial-gradient(circle at 50% 50%, rgba(212,175,55,0.45), rgba(163,40,30,0.35), rgba(13,14,18,0.95))",
                  }
            }
          />
        )}

        {parsed.kind === "video" ? (
          <div
            className={`relative z-10 overflow-hidden rounded-lg bg-black/10 ${
              hasStageBackdrop ? "shadow-xl" : borderClass
            } ${getPlayerFrameClasses(effectiveRatio)}`}
          >
            <video
              src={parsed.embedUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full rounded-lg max-h-[680px] object-contain"
            />
          </div>
        ) : (
          <div
            className={`relative z-10 overflow-hidden rounded-lg bg-black/10 ${
              hasStageBackdrop ? "shadow-xl" : borderClass
            } ${getPlayerFrameClasses(effectiveRatio)}`}
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
