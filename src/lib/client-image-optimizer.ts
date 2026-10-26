"use client";

import { toast } from "sonner";

/**
 * Client-Side WebP Image Optimization Pipeline
 * Intercepts large non-artwork image uploads (> 1 MB or > 2000px dimension),
 * generates a high-efficiency WebP derivative via HTML5 Canvas (0.85 quality),
 * and presents an interactive comparison modal ("Convert & Upload WebP" vs "Keep Original").
 *
 * Strictly excludes Artwork uploads (`isArtwork: true`) to preserve master archival fidelity.
 */

export interface WebpOptimizationOptions {
  isArtwork?: boolean;
  sizeThresholdBytes?: number; // Default: 1 MB (1,048,576 bytes)
  dimensionThresholdPx?: number; // Default: 2000px
  maxOutputDimensionPx?: number; // Default: 2560px
  quality?: number; // Default: 0.85
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function loadImageElement(file: File): Promise<{ img: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, objectUrl });
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
}

function canvasToWebpBlob(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(null);
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      "image/webp",
      quality
    );
  });
}

function promptWebpDecisionModal(params: {
  originalFile: File;
  webpFile: File;
  webpPreviewUrl: string;
  origWidth: number;
  origHeight: number;
  targetWidth: number;
  targetHeight: number;
}): Promise<File> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(params.webpFile);
      return;
    }

    const savingsBytes = Math.max(0, params.originalFile.size - params.webpFile.size);
    const savingsPct =
      params.originalFile.size > 0
        ? Math.round((savingsBytes / params.originalFile.size) * 100)
        : 0;

    const overlay = document.createElement("div");
    overlay.setAttribute("data-webp-optimizer-modal", "true");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483647 !important;pointer-events:auto !important;background:rgba(10,10,12,0.82);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,sans-serif;";

    const card = document.createElement("div");
    card.style.cssText =
      "width:100%;max-width:520px;pointer-events:auto !important;background:#141418;color:#f8fafc;border:1px solid rgba(212,175,55,0.35);border-radius:16px;box-shadow:0 25px 60px rgba(0,0,0,0.65);overflow:hidden;";

    const origExt = (params.originalFile.name.split(".").pop() || "IMG").toUpperCase();

    card.innerHTML = `
      <style>
        @keyframes savazai-webp-spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <div style="padding:18px 22px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;gap:12px;background:rgba(212,175,55,0.06);">
        <div>
          <span style="font-size:10px;font-family:monospace;text-transform:uppercase;letter-spacing:0.12em;color:#f59e0b;display:block;font-weight:700;">
            Client-Side Media Optimizer
          </span>
          <h3 style="margin:3px 0 0 0;font-size:16px;font-weight:700;color:#ffffff;font-family:Georgia,serif;">
            Large Image Detected: Convert to High-Efficiency WebP?
          </h3>
        </div>
        <span style="padding:4px 10px;border-radius:999px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.35);color:#34d399;font-size:11px;font-family:monospace;font-weight:700;white-space:nowrap;">
          -${savingsPct}% Size
        </span>
      </div>
      <div style="padding:20px 22px;">
        <p style="margin:0 0 14px 0;font-size:12px;line-height:1.5;color:#94a3b8;">
          This upload exceeds the 1 MB / 2000px threshold. Converting to WebP accelerates page load performance and saves storage bandwidth while preserving visual sharpness.
        </p>

        <div style="display:flex;gap:14px;align-items:center;padding:12px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);margin-bottom:16px;">
          <img src="${params.webpPreviewUrl}" alt="WebP Preview" style="width:76px;height:76px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,0.12);flex-shrink:0;background:#09090b;" />
          <div style="flex:1;min-width:0;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div style="padding:8px 10px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);">
              <span style="font-size:10px;font-family:monospace;color:#94a3b8;display:block;">ORIGINAL (${origExt})</span>
              <strong style="font-size:14px;color:#f1f5f9;display:block;margin-top:2px;">${formatBytes(params.originalFile.size)}</strong>
              <span style="font-size:10px;font-family:monospace;color:#64748b;">${params.origWidth} × ${params.origHeight}px</span>
            </div>
            <div style="padding:8px 10px;border-radius:8px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);">
              <span style="font-size:10px;font-family:monospace;color:#34d399;display:block;font-weight:700;">OPTIMIZED (WEBP)</span>
              <strong style="font-size:14px;color:#ecfdf5;display:block;margin-top:2px;">${formatBytes(params.webpFile.size)}</strong>
              <span style="font-size:10px;font-family:monospace;color:#6ee7b7;">${params.targetWidth} × ${params.targetHeight}px</span>
            </div>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;padding-top:6px;">
          <button type="button" data-action="keep-original" style="pointer-events:auto !important;padding:8px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.18);background:transparent;color:#cbd5e1;font-size:12px;font-weight:600;cursor:pointer;">
            Keep Original (${formatBytes(params.originalFile.size)})
          </button>
          <button type="button" data-action="convert-webp" style="pointer-events:auto !important;padding:8px 16px;border-radius:8px;border:1px solid #d97706;background:linear-gradient(135deg,#f59e0b,#d97706);color:#09090b;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(245,158,11,0.3);display:inline-flex;align-items:center;gap:6px;">
            Convert &amp; Upload WebP (${formatBytes(params.webpFile.size)})
          </button>
        </div>
      </div>
    `;

    // Prevent Radix UI Dialog DismissableLayer / FocusScope from intercepting events outside DialogContent
    const stopRadixCapture = (e: Event) => {
      e.stopPropagation();
    };
    ["pointerdown", "mousedown", "mouseup", "click", "touchstart", "touchend", "focusin"].forEach(
      (evtName) => {
        overlay.addEventListener(evtName, stopRadixCapture, false);
      }
    );

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    let resolved = false;
    const cleanup = (chosen: File) => {
      if (resolved) return;
      resolved = true;
      window.removeEventListener("keydown", handleEscKey, true);
      try {
        URL.revokeObjectURL(params.webpPreviewUrl);
      } catch {}
      try {
        overlay.remove();
      } catch {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }
      resolve(chosen);
    };

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cleanup(params.originalFile);
      }
    };
    window.addEventListener("keydown", handleEscKey, true);

    const keepBtn = card.querySelector('[data-action="keep-original"]') as HTMLButtonElement | null;
    const convertBtn = card.querySelector('[data-action="convert-webp"]') as HTMLButtonElement | null;

    if (keepBtn) {
      keepBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        cleanup(params.originalFile);
      };
    }

    if (convertBtn) {
      convertBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (keepBtn) keepBtn.disabled = true;
        convertBtn.disabled = true;
        convertBtn.style.opacity = "0.9";
        convertBtn.innerHTML = `
          <span style="display:inline-block;width:12px;height:12px;border:2px solid #09090b;border-top-color:transparent;border-radius:50%;animation:savazai-webp-spin 0.6s linear infinite;"></span>
          <span>Converting &amp; Uploading...</span>
        `;
        toast.success(
          `Image optimized to WebP (${formatBytes(params.webpFile.size)}, -${savingsPct}%) and uploading!`
        );
        window.setTimeout(() => {
          cleanup(params.webpFile);
        }, 120);
      };
    }
  });
}

export async function optimizeImageForWebpUpload(
  file: File,
  options: WebpOptimizationOptions = {}
): Promise<File> {
  // Strictly exclude Artwork master uploads
  if (options.isArtwork) {
    return file;
  }

  if (typeof window === "undefined") {
    return file;
  }

  const mime = (file.type || "").toLowerCase();
  const ext = (file.name.split(".").pop() || "").toLowerCase();

  // Only intercept raster formats (JPEG / PNG / BMP) that benefit from client WebP conversion
  const isConvertibleRaster =
    mime === "image/jpeg" ||
    mime === "image/jpg" ||
    mime === "image/png" ||
    mime === "image/bmp" ||
    ext === "jpg" ||
    ext === "jpeg" ||
    ext === "png" ||
    ext === "bmp";

  if (!isConvertibleRaster) {
    return file;
  }

  const sizeThreshold = options.sizeThresholdBytes ?? 1024 * 1024; // 1 MB
  const dimThreshold = options.dimensionThresholdPx ?? 2000;
  const maxOutputDim = options.maxOutputDimensionPx ?? 2560;
  const quality = options.quality ?? 0.85;

  try {
    const { img, objectUrl } = await loadImageElement(file);
    const origWidth = img.naturalWidth || img.width;
    const origHeight = img.naturalHeight || img.height;

    const isLargeFile = file.size > sizeThreshold;
    const isLargeDimension = origWidth > dimThreshold || origHeight > dimThreshold;

    if (!isLargeFile && !isLargeDimension) {
      URL.revokeObjectURL(objectUrl);
      return file;
    }

    let targetWidth = origWidth;
    let targetHeight = origHeight;
    if (origWidth > maxOutputDim || origHeight > maxOutputDim) {
      const scale = Math.min(maxOutputDim / origWidth, maxOutputDim / origHeight);
      targetWidth = Math.round(origWidth * scale);
      targetHeight = Math.round(origHeight * scale);
    }

    const webpBlob = await canvasToWebpBlob(img, targetWidth, targetHeight, quality);
    URL.revokeObjectURL(objectUrl);

    if (!webpBlob || webpBlob.size >= file.size) {
      return file;
    }

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const webpFile = new File([webpBlob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
    const webpPreviewUrl = URL.createObjectURL(webpBlob);

    return await promptWebpDecisionModal({
      originalFile: file,
      webpFile,
      webpPreviewUrl,
      origWidth,
      origHeight,
      targetWidth,
      targetHeight,
    });
  } catch {
    return file;
  }
}
