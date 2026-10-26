import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Music,
  Paintbrush,
  Sun,
  Flame,
  Crown,
  BookOpen,
  Award,
  Shield,
  Heart,
  Compass,
  Volume2,
} from "lucide-react";
import { BlogGridEmbed } from "@/components/public/blog-grid-embed";
import { PdfViewerBlock } from "@/components/public/blocks/pdf-viewer-block";
import { TimelineBlock, TimelineMilestone } from "@/components/public/blocks/timeline-block";
import { DynamicFormBlock, FormFieldConfig, DynamicFormConfig } from "@/components/public/blocks/dynamic-form-block";
import { MediaGalleryBlock, MediaGalleryItem, MediaGalleryDisplayMode } from "@/components/public/blocks/media-gallery-block";
import { VideoBlock } from "@/components/public/builder/video-block";
import { EmbedBlock, type EmbedAspectRatio, type EmbedSandboxMode } from "@/components/public/builder/embed-block";
import type { MediaAspectRatio, MediaAlign, MediaBackdropMode } from "@/lib/video-embed-parser";
import type { ExhibitionWallConfig } from "@/components/public/blocks/gallery-exhibition-wall/exhibition-wall-block";
import { HeroShowcaseBlock, type HeroArchetype, type HotspotPin } from "@/components/public/blocks/hero-showcase-block";
import { ArchetypeShowcaseBlock } from "@/components/public/blocks/landing/archetype-showcase-blocks";
import {
  HeroBlock,
  MetricGridBlock,
  TabbedFeatureBlock,
  FeatureGridBlock,
  AccordionBlock,
} from "@/components/public/blocks/product-showcase-blocks";
import { cn } from "@/lib/utils";
import { getShapeDefinition } from "@/components/builder/shapes/shape-definitions";
import {
  type ContrastMode,
  type DynamicContrastScope,
  getContrastTypographyClasses,
  parseColorToRgb,
  computeRelativeLuminance,
  getColorSaturation,
} from "@/lib/theme-contrast";
import {
  getCatalogDimensions,
  type CatalogPageSize,
  type CatalogOrientation,
  type CatalogGeometry,
} from "@/lib/catalog-geometry";

interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

interface MediaBlockConfig {
  mediaType?: "NONE" | "IMAGE" | "VIDEO" | "ICON" | "AUDIO_PLAYER";
  mediaUrl?: string;
  mediaAlt?: string;
  mediaAspectRatio?: string;
  mediaBorderRadius?: string;
  iconName?: string;
  iconSize?: number;
  iconColor?: string;
  audioTitle?: string;
  audioUrl?: string;
  videoUrl?: string;
  hasBorder?: boolean;
  borderWidth?: number;
}

export interface TiptapRendererProps {
  content: Record<string, unknown> | string | null | undefined;
  className?: string;
  contrast?: ContrastMode | DynamicContrastScope;
  catalogPageSize?: CatalogPageSize;
  catalogOrientation?: CatalogOrientation;
  enableCaptcha?: boolean;
  enableEmailOtp?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Sparkles,
  Music,
  Palette: Paintbrush,
  Sun,
  Flame,
  Crown,
  BookOpen,
  Award,
  Shield,
  Heart,
  Compass,
};

/**
 * Strips conflicting hardcoded monochrome inline styles based on container contrast
 * so typography dynamically inherits container or theme foreground.
 */
export function sanitizeAdaptiveThemeHtml(
  html: string,
  contrast: ContrastMode | DynamicContrastScope = "auto"
): string {
  if (!html) return "";

  const isLight = contrast === "light-surface" || contrast === "light-bg";
  const isDark = contrast === "dark-surface" || contrast === "dark-bg";

  return html.replace(
    /style="([^"]*?)color:\s*([^;"]+);?([^"]*?)"/gi,
    (match, p1, rawColor, p2) => {
      const rgb = parseColorToRgb(rawColor);
      if (!rgb) return match;

      const lum = computeRelativeLuminance(rgb);
      const sat = getColorSaturation(rgb);
      const isMonochrome = sat < 0.25;

      let strip = false;
      if (isLight && lum > 0.45 && isMonochrome) {
        strip = true;
      } else if (isDark && lum <= 0.45 && isMonochrome) {
        strip = true;
      } else if (!isLight && !isDark && isMonochrome && (lum > 0.85 || lum < 0.15)) {
        strip = true;
      }

      if (strip) {
        const remaining = `${p1} ${p2}`.trim().replace(/;\s*;/g, ";");
        return remaining && remaining !== ";" ? `style="${remaining}"` : "";
      }
      return match;
    }
  ).replace(/\sstyle=""/gi, "");
}

function renderMarks(
  text: string,
  marks?: TiptapMark[],
  contrast: ContrastMode | DynamicContrastScope = "auto"
): React.ReactNode {
  if (!marks || marks.length === 0) return text;

  const isLight = contrast === "light-surface" || contrast === "light-bg";
  const isDark = contrast === "dark-surface" || contrast === "dark-bg";

  return marks.reduce<React.ReactNode>((acc, mark, idx) => {
    switch (mark.type) {
      case "bold":
        return <strong key={`b-${idx}`}>{acc}</strong>;
      case "italic":
        return <em key={`i-${idx}`}>{acc}</em>;
      case "underline":
        return <u key={`u-${idx}`}>{acc}</u>;
      case "textStyle": {
        const styleObj: React.CSSProperties = {};
        if (mark.attrs?.color) {
          const colorStr = String(mark.attrs.color).trim();
          const rgb = parseColorToRgb(colorStr);
          if (rgb) {
            const lum = computeRelativeLuminance(rgb);
            const sat = getColorSaturation(rgb);
            const isMonochrome = sat < 0.25;

            let strip = false;
            if (isLight && lum > 0.45 && isMonochrome) {
              strip = true;
            } else if (isDark && lum <= 0.45 && isMonochrome) {
              strip = true;
            } else if (!isLight && !isDark && isMonochrome && (lum > 0.85 || lum < 0.15)) {
              strip = true;
            }

            if (!strip) {
              styleObj.color = colorStr;
            }
          } else {
            styleObj.color = colorStr;
          }
        }
        if (mark.attrs?.fontSize) styleObj.fontSize = mark.attrs.fontSize as string;
        if (mark.attrs?.fontFamily) styleObj.fontFamily = mark.attrs.fontFamily as string;
        if (Object.keys(styleObj).length === 0) {
          return acc;
        }
        return (
          <span key={`ts-${idx}`} style={styleObj}>
            {acc}
          </span>
        );
      }
      case "link": {
        const href = (mark.attrs?.href as string) || "#";
        const isExternal = href.startsWith("http");
        return (
          <Link
            key={`l-${idx}`}
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="text-primary underline hover:opacity-80 transition-opacity"
          >
            {acc}
          </Link>
        );
      }
      default:
        return acc;
    }
  }, text);
}

function getTextOrientationStyle(orientation?: string): React.CSSProperties {
  if (!orientation || orientation === "horizontal") return {};
  if (orientation === "vertical-rl") {
    return {
      writingMode: "vertical-rl",
      textOrientation: "upright",
      display: "inline-block",
      letterSpacing: "0.1em",
    };
  }
  if (orientation === "vertical-lr") {
    return {
      writingMode: "vertical-lr",
      textOrientation: "upright",
      display: "inline-block",
      letterSpacing: "0.1em",
    };
  }
  if (orientation === "rotate-90") {
    return {
      transform: "rotate(90deg)",
      transformOrigin: "center",
      display: "inline-block",
    };
  }
  if (orientation === "rotate-270") {
    return {
      transform: "rotate(270deg)",
      transformOrigin: "center",
      display: "inline-block",
    };
  }
  if (orientation === "diagonal-neg45") {
    return {
      transform: "rotate(-45deg)",
      transformOrigin: "center",
      display: "inline-block",
    };
  }
  return {};
}

function renderNode(
  node: TiptapNode,
  key: React.Key,
  contrast: ContrastMode | DynamicContrastScope = "auto",
  geometry?: CatalogGeometry
): React.ReactNode {
  const children = node.content?.map((child, i) => renderNode(child, `${String(key)}-c${i}`, contrast, geometry));

  const textAlign = node.attrs?.textAlign as string | undefined;
  const alignClass =
    textAlign === "center"
      ? "text-center"
      : textAlign === "right"
      ? "text-right"
      : textAlign === "justify"
      ? "text-justify"
      : "";

  const textOrientation = node.attrs?.textOrientation as string | undefined;
  const orientationStyle = getTextOrientationStyle(textOrientation);

  switch (node.type) {
    case "doc":
      return <div key={key}>{children}</div>;

    case "heading": {
      const level = (node.attrs?.level as number) || 2;
      const sizeClasses =
        level === 1
          ? "text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-4"
          : level === 2
          ? "text-2xl sm:text-3xl font-serif font-bold mb-3"
          : level === 3
          ? "text-xl sm:text-2xl font-serif font-semibold mb-2"
          : "text-lg sm:text-xl font-serif font-semibold mb-2";

      if (level === 1) {
        return <h1 key={key} style={orientationStyle} className={`${sizeClasses} ${alignClass} text-inherit`}>{children}</h1>;
      }
      if (level === 2) {
        return <h2 key={key} style={orientationStyle} className={`${sizeClasses} ${alignClass} text-inherit`}>{children}</h2>;
      }
      if (level === 3) {
        return <h3 key={key} style={orientationStyle} className={`${sizeClasses} ${alignClass} text-inherit`}>{children}</h3>;
      }
      return <h4 key={key} style={orientationStyle} className={`${sizeClasses} ${alignClass} text-inherit`}>{children}</h4>;
    }

    case "paragraph":
      return (
        <p key={key} style={orientationStyle} className={`text-base leading-relaxed mb-4 text-inherit ${alignClass}`}>
          {children && children.length > 0 ? children : "\u00A0"}
        </p>
      );

    case "bulletList":
      return (
        <ul key={key} className="list-disc list-inside mb-4 space-y-1 opacity-90">
          {children}
        </ul>
      );

    case "orderedList":
      return (
        <ol key={key} className="list-decimal list-inside mb-4 space-y-1 opacity-90">
          {children}
        </ol>
      );

    case "listItem":
      return <li key={key}>{children}</li>;

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-l-4 border-primary pl-4 italic opacity-85 my-4 font-serif"
        >
          {children}
        </blockquote>
      );

    case "text":
      return (
        <React.Fragment key={key}>
          {renderMarks(node.text || "", node.marks, contrast)}
        </React.Fragment>
      );

    case "image": {
      const src = (node.attrs?.src as string) || "";
      const alt = (node.attrs?.alt as string) || "Heritage artwork illustration";
      const title = (node.attrs?.title as string) || "";
      const layoutMode = (node.attrs?.layoutMode as string) || "centered";
      const aspectRatio = (node.attrs?.aspectRatio as string) || "auto";
      const maxHeight = (node.attrs?.maxHeight as string) || "550px";
      const focalPosition = (node.attrs?.focalPosition as string) || "center center";
      if (!src) return null;

      let containerClass = "my-6 relative transition-all clear-both";
      let imgClass = "rounded-xl border border-border/80 shadow-md transition-all";

      if (layoutMode === "float-left") {
        containerClass = "float-left mr-6 mb-4 max-w-[50%] relative clear-left";
      } else if (layoutMode === "float-right") {
        containerClass = "float-right ml-6 mb-4 max-w-[50%] relative clear-right";
      } else if (layoutMode === "full-width") {
        containerClass = "w-full my-6 text-center clear-both";
        imgClass += " w-full";
      } else if (layoutMode === "cover-column") {
        containerClass = "w-full h-full min-h-[280px] my-4 clear-both";
        imgClass += " w-full h-full object-cover";
      } else {
        containerClass = "my-6 text-center clear-both";
        imgClass += " mx-auto";
      }

      let ratioClass = "";
      const imgStyle: React.CSSProperties = {
        maxHeight: layoutMode === "cover-column" ? undefined : maxHeight,
        objectPosition: focalPosition,
      };

      if (aspectRatio === "1/1") ratioClass = "aspect-square object-cover";
      else if (aspectRatio === "4/3") ratioClass = "aspect-[4/3] object-cover";
      else if (aspectRatio === "16/9") ratioClass = "aspect-video object-cover";
      else if (aspectRatio === "21/9") ratioClass = "aspect-[21/9] object-cover";
      else if (aspectRatio === "catalog" || layoutMode === "cover-column") {
        ratioClass = "object-cover w-full h-full";
        if (geometry?.ratio) {
          imgStyle.aspectRatio = `${geometry.ratio}`;
        }
      } else if (layoutMode !== "cover-column") {
        ratioClass = "object-contain";
      }

      return (
        <figure key={key} className={containerClass}>
          <img
            src={src}
            alt={alt}
            className={cn(imgClass, ratioClass)}
            style={imgStyle}
            loading="lazy"
          />
          {title && (
            <figcaption className="mt-2 text-xs font-serif italic text-muted-foreground text-center">
              {title}
            </figcaption>
          )}
        </figure>
      );
    }

    case "horizontalRule":
      return (
        <hr
          key={key}
          className="my-8 border-t-2 border-primary/40 max-w-xs mx-auto"
        />
      );

    case "customShape": {
      const attrs = node.attrs || {};
      const shapeType = (attrs.shapeType as string) || "cartouche";
      const fillType = (attrs.fillType as string) || "solid";
      const fillColor = (attrs.fillColor as string) || "rgba(251, 248, 241, 0.7)";
      const gradient = (attrs.gradient as string) || "";
      const borderColor = (attrs.borderColor as string) || "#D4AF37";
      const borderWidth = Number(attrs.borderWidth) || 2;
      const borderStyle = (attrs.borderStyle as string) || "solid";
      const shadow = (attrs.shadow as string) || "sm";
      const alignment = (attrs.alignment as string) || "center";
      const imageUrl = (attrs.imageUrl as string) || "";
      const imageFit = (attrs.imageFit as string) || "cover";
      const imageOpacity = typeof attrs.imageOpacity === "number" ? attrs.imageOpacity : 1;
      const scrimOpacity = typeof attrs.scrimOpacity === "number" ? attrs.scrimOpacity : 0.35;
      const scrimColor = (attrs.scrimColor as string) || "#000000";
      const focalPosition = (attrs.focalPosition as string) || "center center";

      const def = getShapeDefinition(shapeType);

      // Width calculation: custom px/% or legacy size
      let widthStyle = attrs.width as string | undefined;
      if (!widthStyle) {
        const size = attrs.size as string | undefined;
        widthStyle = size === "sm" ? "280px" : size === "lg" ? "680px" : size === "full" ? "100%" : "440px";
      }

      const minHeightStyle = (attrs.minHeight as string) || "120px";
      const paddingStyle = (attrs.padding as string) || "24px";

      const alignClass =
        alignment === "left"
          ? "mr-auto ml-0"
          : alignment === "right"
          ? "ml-auto mr-0"
          : "mx-auto";

      const shadowClass =
        shadow === "none"
          ? ""
          : shadow === "sm"
          ? "shadow-sm"
          : shadow === "md"
          ? "shadow-md"
          : "shadow-xl";

      const containerStyle: React.CSSProperties = {
        width: widthStyle,
        minHeight: minHeightStyle,
        padding: paddingStyle,
      };

      if (def.clipPath) {
        containerStyle.clipPath = def.clipPath;
      } else {
        containerStyle.borderRadius = def.borderRadius || "0px";
        if (borderWidth > 0) {
          containerStyle.border = `${borderWidth}px ${borderStyle} ${borderColor}`;
        }
      }

      if (fillType === "gradient" && gradient) {
        containerStyle.background = gradient;
      } else if (fillType === "image") {
        containerStyle.backgroundColor = fillColor || "transparent";
      } else {
        containerStyle.backgroundColor = fillColor;
      }

      return (
        <div
          key={key}
          className={cn("my-6 relative transition-all overflow-hidden flex flex-col justify-center", alignClass, shadowClass)}
          style={containerStyle}
          data-tiptap-shape="true"
        >
          {/* SVG Non-scaling Border Stroke for clipped shapes */}
          {def.clipPath && def.polygonPoints && borderWidth > 0 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon
                points={def.polygonPoints}
                fill="none"
                stroke={borderColor}
                strokeWidth={borderWidth}
                strokeDasharray={
                  borderStyle === "dashed" ? "6,4" : borderStyle === "dotted" ? "3,3" : undefined
                }
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}

          {/* Background Image & Scrim (Media Vault Fill) */}
          {fillType === "image" && imageUrl && (
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
              <img
                src={imageUrl}
                alt=""
                className={`w-full h-full ${
                  imageFit === "contain"
                    ? "object-contain"
                    : imageFit === "fill"
                    ? "object-fill"
                    : "object-cover"
                }`}
                style={{
                  opacity: imageOpacity,
                  objectPosition: focalPosition,
                }}
              />
              {scrimOpacity > 0 && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: scrimColor,
                    opacity: scrimOpacity,
                  }}
                />
              )}
            </div>
          )}

          {/* Render embedded typography / children */}
          <div className="relative z-10 w-full h-full flex flex-col justify-center">
            {children}
          </div>
        </div>
      );
    }

    case "floatingLayer": {
      const attrs = node.attrs || {};
      const x = typeof attrs.x === "number" ? attrs.x : 24;
      const y = typeof attrs.y === "number" ? attrs.y : 24;
      const width = (attrs.width as string) || "340px";
      const height = (attrs.height as string) || "auto";
      const zIndex = typeof attrs.zIndex === "number" ? attrs.zIndex : 10;
      const opacity = typeof attrs.opacity === "number" ? attrs.opacity : 1;
      const blendMode = (attrs.blendMode as string) || "normal";
      const backgroundColor = (attrs.backgroundColor as string) || "rgba(255, 255, 255, 0.9)";
      const borderColor = (attrs.borderColor as string) || "#D4AF37";
      const borderWidth = typeof attrs.borderWidth === "number" ? attrs.borderWidth : 1;
      const borderRadius = (attrs.borderRadius as string) || "12px";
      const padding = (attrs.padding as string) || "16px";

      return (
        <div
          key={key}
          data-floating-layer="true"
          className="floating-layer-container my-3 relative shadow-md pointer-events-auto"
          style={{
            position: "relative",
            transform: `translate3d(${x}px, ${y}px, 0)`,
            width,
            height: height === "auto" ? undefined : height,
            zIndex,
            opacity,
            mixBlendMode: (blendMode as React.CSSProperties["mixBlendMode"]) || "normal",
            backgroundColor,
            border: `${borderWidth}px solid ${borderColor}`,
            borderRadius,
            padding,
          }}
        >
          <div className="relative z-10 w-full h-full flex flex-col justify-center">
            {children}
          </div>
        </div>
      );
    }

    default:
      if (children) {
        return <div key={key}>{children}</div>;
      }
      return null;
  }
}

function renderMediaBlock(media: MediaBlockConfig): React.ReactNode {
  if (!media.mediaType || media.mediaType === "NONE") return null;

  if (media.mediaType === "IMAGE" && media.mediaUrl) {
    const aspectClass =
      media.mediaAspectRatio === "1:1"
        ? "aspect-square"
        : media.mediaAspectRatio === "16:9"
        ? "aspect-video"
        : media.mediaAspectRatio === "3:4"
        ? "aspect-[3/4]"
        : media.mediaAspectRatio === "4:3"
        ? "aspect-[4/3]"
        : "aspect-auto max-h-[500px]";

    const radiusClass =
      media.mediaBorderRadius === "rounded-none"
        ? "rounded-none"
        : media.mediaBorderRadius === "rounded-md"
        ? "rounded-md"
        : media.mediaBorderRadius === "rounded-2xl"
        ? "rounded-2xl"
        : media.mediaBorderRadius === "rounded-full"
        ? "rounded-full aspect-square max-w-[240px] mx-auto"
        : "rounded-lg";

    const showBorder = media.hasBorder !== false && media.borderWidth !== 0;

    return (
      <div className="mb-6 overflow-hidden flex justify-center">
        <img
          src={media.mediaUrl}
          alt={media.mediaAlt || "Cultural archive imagery"}
          className={`w-full object-cover shadow-lg ${
            showBorder ? "border border-border/80" : "border-0"
          } ${aspectClass} ${radiusClass}`}
          loading="lazy"
        />
      </div>
    );
  }

  if (media.mediaType === "VIDEO" && media.videoUrl) {
    return (
      <div className="mb-6 w-full">
        <VideoBlock videoUrl={media.videoUrl} caption={media.mediaAlt} />
      </div>
    );
  }

  if (media.mediaType === "ICON") {
    const SelectedIcon = iconMap[media.iconName || "Sparkles"] || Sparkles;
    return (
      <div className="mb-4 flex items-center justify-center p-4 rounded-xl bg-primary/5 border border-primary/20 w-fit mx-auto shadow-sm">
        <SelectedIcon
          style={{
            width: `${media.iconSize || 40}px`,
            height: `${media.iconSize || 40}px`,
            color: media.iconColor || "#D4AF37",
          }}
        />
      </div>
    );
  }

  if (media.mediaType === "AUDIO_PLAYER" && media.audioUrl) {
    return (
      <div className="mb-6 p-4 rounded-xl border border-primary/40 bg-card/90 shadow-md backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-bold block">
              Carnatic Classical Recital
            </span>
            <span className="font-serif font-bold text-sm text-foreground">
              {media.audioTitle || "Classical Vocal Performance"}
            </span>
          </div>
        </div>
        <audio controls src={media.audioUrl} className="w-full h-8 mt-2" />
      </div>
    );
  }

  return null;
}

export interface ColumnBlock {
  id: string;
  type:
    | "TEXT"
    | "IMAGE"
    | "VIDEO"
    | "AUDIO"
    | "DIVIDER"
    | "BUTTON"
    | "BLOG_GRID"
    | "PDF_VIEWER"
    | "ARTIST_TIMELINE"
    | "FORM_BLOCK"
    | "MEDIA_GALLERY"
    | "HERO_SHOWCASE"
    | "HERO_BLOCK"
    | "METRIC_GRID"
    | "TABBED_FEATURE_BLOCK"
    | "FEATURE_GRID"
    | "ACCORDION_BLOCK"
    | "EMBED_HTML";
  data?: Record<string, unknown>;
  content?: Record<string, unknown>;
  mediaUrl?: string;
  mediaAlt?: string;
  mediaAspectRatio?: string;
  mediaBorderRadius?: string;
  hasBorder?: boolean;
  borderWidth?: number;
  videoUrl?: string;
  videoAspectRatio?: MediaAspectRatio;
  videoAlign?: MediaAlign;
  videoBackdropMode?: MediaBackdropMode;
  videoBackdropColor?: string;
  audioUrl?: string;
  audioTitle?: string;
  dividerStyle?: "gold-leaf" | "lotus" | "line" | "temple";
  buttonText?: string;
  buttonUrl?: string;
  buttonVariant?: "gold" | "outline" | "temple";
  blogLimit?: number;
  // Embed / HTML Block Properties
  embedHtml?: string;
  embedCaption?: string;
  embedAspectRatio?: EmbedAspectRatio;
  embedSandboxMode?: EmbedSandboxMode;
  embedAlign?: MediaAlign;
  embedBackdropMode?: MediaBackdropMode;
  embedBackdropColor?: string;
  // PDF Viewer Properties
  pdfUrl?: string;
  fileUrl?: string;
  pdfFileName?: string;
  fileName?: string;
  pdfTitle?: string;
  title?: string;
  pdfHeight?: number;
  height?: number;
  pdfAllowDownload?: boolean;
  allowDownload?: boolean;
  // Timeline Properties
  timelineItems?: TimelineMilestone[];
  timelineLayout?: "alternating" | "compact" | "horizontal-serpentine" | "horizontal";
  timelineGranularity?: "YEAR" | "YEAR_MONTH" | "DATE" | "DATE_TIME";
  timelineSortDirection?: "asc" | "desc";
  timelineTitle?: string;
  timelineSubtitle?: string;
  subtitle?: string;
  showFilters?: boolean;
  // Form Block Properties
  formTitle?: string;
  formSubtitle?: string;
  submitButtonText?: string;
  successMessage?: string;
  notifyEmail?: boolean;
  recipientEmails?: string;
  emailSubjectTemplate?: string;
  fields?: FormFieldConfig[];
  formConfig?: DynamicFormConfig;
  pageSlug?: string;
  enableCaptcha?: boolean;
  enableEmailOtp?: boolean;
  // Media Gallery Block Properties
  galleryDisplayMode?: MediaGalleryDisplayMode;
  galleryAutoplayTimer?: number;
  galleryAspectRatio?: "landscape" | "portrait" | "square" | "natural";
  galleryFrameStyle?: "heritage" | "minimal" | "floating" | "none";
  galleryKenBurnsOverlayTheme?: "dark-velvet" | "parchment-gold" | "minimal-subtle";
  galleryOverlayTitleColor?: string;
  galleryOverlayTextColor?: string;
  galleryCanvasBgColor?: string;
  galleryBorderFilletColor?: string;
  galleryBorderWidth?: number;
  galleryFramePadding?: number;
  galleryShowCaptionRibbon?: boolean;
  galleryEnvironmentId?: string;
  galleryCustomWallUrl?: string;
  galleryWallBackgroundMode?: "uniform" | "per-wall";
  galleryWallCustomBackgrounds?: string[];
  galleryCanvasBgImageUrl?: string;
  galleryCanvasBgMode?: "cover" | "contain" | "tile" | "blur";
  galleryCanvasBgOpacity?: number;
  galleryCameraTourStyle?: "overview" | "drone" | "walkthrough" | "inspection";
  galleryWallLayout?: "salon" | "linear" | "grid";
  galleryAutoplayTour?: boolean;
  galleryShowFrameHeader?: boolean;
  frameHeaderBg?: string;
  galleryFrameHeaderBg?: string;
  galleryFrameHeaderTextColor?: string;
  galleryItems?: MediaGalleryItem[];
  galleryMaxArtworksPerWall?: number;
  galleryOverviewWallDwell?: number;
  galleryShowMetadataCardBelowWall?: boolean;
  galleryWallConfigs?: ExhibitionWallConfig[];
  galleryCameraTransitionStyle?: "pan-zoom" | "dolly" | "crossfade" | "cinematic-arc";
  // Hero Showcase Properties
  heroArchetype?: HeroArchetype;
  heroTitle?: string;
  heroSubtitle?: string;
  heroEyebrow?: string;
  heroCuratorialQuote?: string;
  heroImageUrl?: string;
  heroPrimaryCtaText?: string;
  heroPrimaryCtaUrl?: string;
  heroSecondaryCtaText?: string;
  heroSecondaryCtaUrl?: string;
  heroBadges?: string[];
  heroHotspots?: HotspotPin[];
}

export function renderColumnBlock(
  block: ColumnBlock,
  contrast: ContrastMode = "auto",
  geometry?: CatalogGeometry,
  securityOverrides?: { enableCaptcha?: boolean; enableEmailOtp?: boolean }
): React.ReactNode {
  if (block.type === "IMAGE") {
    return (
      <div key={block.id}>
        {renderMediaBlock({
          mediaType: "IMAGE",
          mediaUrl: block.mediaUrl,
          mediaAlt: block.mediaAlt,
          mediaAspectRatio: block.mediaAspectRatio,
          mediaBorderRadius: block.mediaBorderRadius,
          hasBorder: block.hasBorder,
          borderWidth: block.borderWidth,
        })}
      </div>
    );
  }

  if (block.type === "VIDEO") {
    return (
      <div key={block.id} className="my-2 w-full">
        <VideoBlock
          videoUrl={block.videoUrl}
          caption={block.mediaAlt || block.title}
          aspectRatio={block.videoAspectRatio}
          align={block.videoAlign}
          backdropMode={block.videoBackdropMode}
          backdropColor={block.videoBackdropColor}
        />
      </div>
    );
  }

  if (block.type === "EMBED_HTML") {
    return (
      <div key={block.id} className="my-2 w-full">
        <EmbedBlock
          embedHtml={block.embedHtml}
          caption={block.embedCaption || block.title}
          aspectRatio={block.embedAspectRatio}
          sandboxMode={block.embedSandboxMode}
          align={block.embedAlign}
          backdropMode={block.embedBackdropMode}
          backdropColor={block.embedBackdropColor}
        />
      </div>
    );
  }

  if (block.type === "AUDIO") {
    return (
      <div key={block.id}>
        {renderMediaBlock({
          mediaType: "AUDIO_PLAYER",
          audioUrl: block.audioUrl,
          audioTitle: block.audioTitle,
        })}
      </div>
    );
  }

  if (block.type === "DIVIDER") {
    return (
      <div key={block.id} className="py-4 flex items-center justify-center gap-3">
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent flex-1" />
        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent flex-1" />
      </div>
    );
  }

  if (block.type === "BUTTON") {
    return (
      <div key={block.id} className="py-2 flex">
        <Link
          href={block.buttonUrl || "#"}
          className={`inline-flex items-center justify-center px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-semibold transition-all ${
            block.buttonVariant === "outline"
              ? "border border-primary text-primary hover:bg-primary/10"
              : block.buttonVariant === "temple"
              ? "bg-[#A3281E] text-white hover:bg-[#8A2219] shadow-md"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
          }`}
        >
          {block.buttonText || "Explore Masterwork"}
        </Link>
      </div>
    );
  }

  if (block.type === "BLOG_GRID") {
    return (
      <div key={block.id} className="py-6 w-full">
        <BlogGridEmbed limit={block.blogLimit || 4} />
      </div>
    );
  }

  if (block.type === "PDF_VIEWER") {
    return (
      <div key={block.id} className="py-4 w-full">
        <PdfViewerBlock
          fileUrl={block.fileUrl || block.pdfUrl}
          fileName={block.fileName || block.pdfFileName}
          title={block.title || block.pdfTitle}
          height={block.height || block.pdfHeight}
          allowDownload={block.allowDownload ?? block.pdfAllowDownload ?? true}
        />
      </div>
    );
  }

  if (block.type === "ARTIST_TIMELINE") {
    return (
      <div key={block.id} className="py-4 w-full">
        <TimelineBlock
          items={block.timelineItems}
          layout={block.timelineLayout}
          granularity={block.timelineGranularity}
          sortDirection={block.timelineSortDirection}
          title={block.title || block.timelineTitle}
          subtitle={block.subtitle || block.timelineSubtitle}
          showFilters={block.showFilters !== false}
          contrast={contrast}
        />
      </div>
    );
  }

  if (block.type === "FORM_BLOCK") {
    return (
      <div key={block.id} className="py-4 w-full">
        <DynamicFormBlock
          formConfig={block.formConfig}
          formTitle={block.formTitle}
          formSubtitle={block.formSubtitle}
          submitButtonText={block.submitButtonText}
          successMessage={block.successMessage}
          notifyEmail={block.notifyEmail}
          recipientEmails={block.recipientEmails}
          emailSubjectTemplate={block.emailSubjectTemplate}
          fields={block.fields}
          pageSlug={block.pageSlug}
          enableCaptcha={block.enableCaptcha ?? securityOverrides?.enableCaptcha}
          enableEmailOtp={block.enableEmailOtp ?? securityOverrides?.enableEmailOtp}
        />
      </div>
    );
  }

  if (block.type === "MEDIA_GALLERY") {
    return (
      <div key={block.id} className="py-4 w-full">
        <MediaGalleryBlock
          items={block.galleryItems}
          displayMode={block.galleryDisplayMode}
          autoplayTimer={block.galleryAutoplayTimer}
          aspectRatio={block.galleryAspectRatio}
          frameStyle={block.galleryFrameStyle}
          kenBurnsOverlayTheme={block.galleryKenBurnsOverlayTheme}
          overlayTitleColor={block.galleryOverlayTitleColor}
          overlayTextColor={block.galleryOverlayTextColor}
          canvasBgColor={block.galleryCanvasBgColor}
          borderFilletColor={block.galleryBorderFilletColor}
          borderWidth={block.galleryBorderWidth}
          framePadding={block.galleryFramePadding}
          showCaptionRibbon={block.galleryShowCaptionRibbon}
          environmentId={block.galleryEnvironmentId}
          customWallUrl={block.galleryCustomWallUrl}
          wallBackgroundMode={block.galleryWallBackgroundMode}
          wallCustomBackgrounds={block.galleryWallCustomBackgrounds}
          canvasBgImageUrl={block.galleryCanvasBgImageUrl}
          canvasBgMode={block.galleryCanvasBgMode}
          canvasBgOpacity={block.galleryCanvasBgOpacity}
          cameraTourStyle={block.galleryCameraTourStyle}
          wallLayout={block.galleryWallLayout}
          autoplayTour={block.galleryAutoplayTour}
          showFrameHeader={block.galleryShowFrameHeader}
          frameHeaderBg={block.galleryFrameHeaderBg}
          frameHeaderTextColor={block.galleryFrameHeaderTextColor}
          maxArtworksPerWall={block.galleryMaxArtworksPerWall}
          overviewDwellSeconds={block.galleryOverviewWallDwell}
          showMetadataCardBelowWall={block.galleryShowMetadataCardBelowWall}
          wallConfigs={block.galleryWallConfigs}
          cameraTransitionStyle={block.galleryCameraTransitionStyle}
        />
      </div>
    );
  }

  if (block.type === "HERO_SHOWCASE") {
    return (
      <div key={block.id} className="py-4 w-full">
        <HeroShowcaseBlock
          archetype={block.heroArchetype}
          title={block.heroTitle || block.title}
          subtitle={block.heroSubtitle || block.subtitle}
          eyebrow={block.heroEyebrow}
          curatorialQuote={block.heroCuratorialQuote}
          imageUrl={block.heroImageUrl || block.mediaUrl}
          primaryCtaText={block.heroPrimaryCtaText || block.buttonText}
          primaryCtaUrl={block.heroPrimaryCtaUrl || block.buttonUrl}
          secondaryCtaText={block.heroSecondaryCtaText}
          secondaryCtaUrl={block.heroSecondaryCtaUrl}
          badges={block.heroBadges}
          hotspots={block.heroHotspots}
          contrast={contrast}
        />
      </div>
    );
  }

  if (block.type === "HERO_BLOCK") {
    return (
      <div key={block.id} className="w-full">
        <HeroBlock block={block as unknown as Record<string, unknown>} />
      </div>
    );
  }

  if (block.type === "METRIC_GRID") {
    return (
      <div key={block.id} className="w-full">
        <MetricGridBlock block={block as unknown as Record<string, unknown>} />
      </div>
    );
  }

  if (block.type === "TABBED_FEATURE_BLOCK") {
    return (
      <div key={block.id} className="w-full">
        <TabbedFeatureBlock block={block as unknown as Record<string, unknown>} />
      </div>
    );
  }

  if (block.type === "FEATURE_GRID") {
    return (
      <div key={block.id} className="w-full">
        <FeatureGridBlock block={block as unknown as Record<string, unknown>} />
      </div>
    );
  }

  if (block.type === "ACCORDION_BLOCK") {
    return (
      <div key={block.id} className="w-full">
        <AccordionBlock block={block as unknown as Record<string, unknown>} />
      </div>
    );
  }

  if (block.type === "TEXT" && block.content) {
    const doc = block.content as unknown as TiptapNode;
    const typographyClasses = getContrastTypographyClasses(contrast);
    return (
      <div key={block.id} className={cn(typographyClasses, "max-w-none")}>
        {doc.type === "doc" ? renderNode(doc, block.id, contrast, geometry) : null}
      </div>
    );
  }

  return null;
}

export function TiptapRenderer({
  content,
  className = "",
  contrast = "auto",
  catalogPageSize,
  catalogOrientation,
  enableCaptcha,
  enableEmailOtp,
}: TiptapRendererProps) {
  if (!content) return null;
  const legacyContrast: ContrastMode =
    contrast === "light-surface" || contrast === "light-bg"
      ? "light-bg"
      : contrast === "dark-surface" || contrast === "dark-bg"
      ? "dark-bg"
      : "auto";
  const contrastClasses = getContrastTypographyClasses(contrast);

  const effectivePageSize = catalogPageSize || "A4";
  const effectiveOrientation = catalogOrientation || "portrait";
  const geometry = getCatalogDimensions(effectivePageSize, effectiveOrientation);

  if (typeof content === "string") {
    let parsedObj: Record<string, unknown> | null = null;
    const trimmed = content.trim();

    if (trimmed.startsWith("{") && trimmed.includes('"type":"doc"')) {
      try {
        let jsonStr = trimmed;
        const lastBraceIdx = trimmed.lastIndexOf("}");
        if (lastBraceIdx > 0) {
          jsonStr = trimmed.slice(0, lastBraceIdx + 1);
        }
        const result = JSON.parse(jsonStr);
        if (result && typeof result === "object" && result.type === "doc") {
          parsedObj = result as Record<string, unknown>;
        }
      } catch {
        // Not valid JSON
      }
    } else {
      try {
        const result = JSON.parse(trimmed);
        if (result && typeof result === "object") {
          parsedObj = result as Record<string, unknown>;
        }
      } catch {
        // Fallback for raw markdown or plain text
      }
    }

    if (parsedObj) {
      return (
        <TiptapRenderer
          content={parsedObj}
          className={className}
          contrast={contrast}
          catalogPageSize={effectivePageSize}
          catalogOrientation={effectiveOrientation}
        />
      );
    }

    // If string contains HTML tags, render safely as HTML so tags like <p> do not appear literally
    if (/<[a-z][\s\S]*>/i.test(trimmed)) {
      const sanitized = sanitizeAdaptiveThemeHtml(trimmed, legacyContrast);
      return (
        <div
          className={cn(contrastClasses, "max-w-none leading-relaxed", className)}
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      );
    }

    return (
      <div className={cn(contrastClasses, "max-w-none leading-relaxed", className)}>
        <p className="whitespace-pre-line leading-relaxed">{content}</p>
      </div>
    );
  }

  const rawObj = content as Record<string, unknown>;

  // Check if content is a landing page showcase block
  if (typeof rawObj?.type === "string") {
    if (rawObj.type.startsWith("landing_")) {
      return <ArchetypeShowcaseBlock content={rawObj} contrast={legacyContrast} className={className} />;
    }
    const upperType = rawObj.type.toUpperCase();
    if (upperType === "HERO_BLOCK") return <HeroBlock block={rawObj} className={className} />;
    if (upperType === "METRIC_GRID") return <MetricGridBlock block={rawObj} className={className} />;
    if (upperType === "TABBED_FEATURE_BLOCK") return <TabbedFeatureBlock block={rawObj} className={className} />;
    if (upperType === "FEATURE_GRID") return <FeatureGridBlock block={rawObj} className={className} />;
    if (upperType === "ACCORDION_BLOCK") return <AccordionBlock block={rawObj} className={className} />;
  }

  // Check if content has nested multi-row blocks
  if (Array.isArray(rawObj.blocks) && rawObj.blocks.length > 0) {
    const renderedNodes: React.ReactNode[] = [];
    let buttonGroup: ColumnBlock[] = [];

    const flushButtons = (key: string) => {
      if (buttonGroup.length === 0) return;
      renderedNodes.push(
        <div key={`btn-group-${key}`} className="pt-2 flex flex-wrap items-center gap-3">
          {buttonGroup.map((btn) => (
            <Link
              key={btn.id}
              href={btn.buttonUrl || "#"}
              className={cn(
                "inline-flex items-center justify-center px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-semibold transition-all cursor-pointer shadow-xs",
                btn.buttonVariant === "outline"
                  ? "border border-primary text-primary hover:bg-primary/10"
                  : btn.buttonVariant === "temple"
                  ? "bg-[#A3281E] text-white hover:bg-[#8A2219] shadow-md"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
              )}
            >
              {btn.buttonText || "Explore Masterwork"}
            </Link>
          ))}
        </div>
      );
      buttonGroup = [];
    };

    rawObj.blocks.forEach((block: ColumnBlock, idx: number) => {
      if (block.type === "BUTTON") {
        buttonGroup.push(block);
      } else {
        flushButtons(`flush-${idx}`);
        renderedNodes.push(
          <div key={block.id || `blk-${idx}`}>
            {renderColumnBlock(block, legacyContrast, geometry, { enableCaptcha, enableEmailOtp })}
          </div>
        );
      }
    });
    flushButtons("final");

    return (
      <div className={cn(contrastClasses, "space-y-4", className)}>
        {renderedNodes}
      </div>
    );
  }

  // Fallback to single doc + legacy _media
  const mediaConfig = rawObj._media as MediaBlockConfig | undefined;
  const doc = content as unknown as TiptapNode;

  return (
    <div className={cn(contrastClasses, "max-w-none leading-relaxed", className)}>
      {mediaConfig && renderMediaBlock(mediaConfig)}
      {doc.type === "doc" && renderNode(doc, "root", legacyContrast, geometry)}
    </div>
  );
}
