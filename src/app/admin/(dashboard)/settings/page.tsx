"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import {
  Settings,
  Shield,
  ShieldCheck,
  Cloud,
  Share2,
  Save,
  Loader2,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Trash2,
  Mail,
  Send,
  Sparkles,
  FileText,
  Plus,
  Wand2,
  Sliders,
  Palette,
  RotateCcw,
  Type,
  Sun,
  Moon,
  Globe,
  HardDrive,
  ExternalLink,
  Eye,
  EyeOff,
  Server,
  QrCode,
} from "lucide-react";
import {
  DetailedThemeConfig,
  DEFAULT_DETAILED_THEME_CONFIG,
  HEADING_FONT_OPTIONS,
  BODY_FONT_OPTIONS,
  BORDER_WIDTH_OPTIONS,
  BORDER_RADIUS_OPTIONS,
  FONT_SIZE_OPTIONS,
  LINE_HEIGHT_OPTIONS,
  sanitizeDetailedThemeConfig,
  ThemeModeTokens,
  FormThemeTokens,
} from "@/lib/theme-config";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CURRENCIES } from "@/lib/formatters";
import { EditablePageHeader } from "@/components/admin/editable-page-header";
import { AdminPortalConfig, DEFAULT_ADMIN_CONFIG } from "@/lib/admin-config";
import { ADMIN_NAV_ITEMS } from "@/components/admin/sidebar";
import { MailConfigStudio } from "@/components/admin/mail-config-studio";
import { MediaVaultManager } from "@/components/admin/media-vault-manager";
import {
  SocialPlatformIcon,
  CUSTOM_SOCIAL_ICON_OPTIONS,
  type CustomSocialLink,
} from "@/components/public/social-icon";

interface LegalLinkItem {
  label: string;
  url: string;
  isVisible: boolean;
}

interface SocialLinkItem {
  platform: string;
  url: string;
  isVisible: boolean;
}

interface FooterConfig {
  aboutText: string;
  contactEmail: string;
  contactPhone: string;
  copyrightText: string;
  socialLinks: SocialLinkItem[];
  legalLinks: LegalLinkItem[];
}

interface EmailConfig {
  provider: "gmail" | "smtp";
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  isEnabled: boolean;
}

interface AiConfig {
  activeProvider: "gemini" | "openai" | "anthropic" | "openrouter" | "grok" | "groq" | "ollama";
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  temperature: number;
}

interface GoogleServicesConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  driveFolderId?: string;
  sheetId?: string;
  defaultServices?: string[];
}

interface NextcloudConfig {
  enabled: boolean;
  serverUrl: string;
  username: string;
  appPassword: string;
  baseFolder?: string;
}

interface FormSecurityConfig {
  contactForm: {
    enableCaptcha: boolean;
    enableEmailOtp: boolean;
  };
  qrScanGate: {
    enableCaptcha: boolean;
    enableEmailOtp: boolean;
  };
}

const DEFAULT_FORM_SECURITY_CONFIG: FormSecurityConfig = {
  contactForm: {
    enableCaptcha: false,
    enableEmailOtp: false,
  },
  qrScanGate: {
    enableCaptcha: false,
    enableEmailOtp: false,
  },
};

export default function AdminSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [logoUploading, setLogoUploading] = React.useState(false);
  const [faviconUploading, setFaviconUploading] = React.useState(false);
  const [adminLogoUploading, setAdminLogoUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Email & AI Test states
  const [testingEmail, setTestingEmail] = React.useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = React.useState("");
  const [showEmailPassword, setShowEmailPassword] = React.useState(false);
  const [showAiKey, setShowAiKey] = React.useState(false);
  const [testingAi, setTestingAi] = React.useState(false);
  const [aiTestPrompt, setAiTestPrompt] = React.useState("Describe the sacred use of 22k gold leaf in Thanjavur art.");
  const [aiTestResult, setAiTestResult] = React.useState<string | null>(null);

  // Admin Portal White-Labeling State
  const [adminConfig, setAdminConfig] = React.useState<AdminPortalConfig>(DEFAULT_ADMIN_CONFIG);
  const [savingBranding, setSavingBranding] = React.useState(false);

  // Theme & Design Studio State
  const [themeConfig, setThemeConfig] = React.useState<DetailedThemeConfig>(DEFAULT_DETAILED_THEME_CONFIG);
  const [activeThemeSubTab, setActiveThemeSubTab] = React.useState<"common" | "light" | "dark">("common");
  const [savingTheme, setSavingTheme] = React.useState(false);

  // Active Main Tab & Consolidated Hub Sub-Tab States
  const [activeTab, setActiveTab] = React.useState("general");
  const [activePersonalizationSubTab, setActivePersonalizationSubTab] = React.useState<
    "branding" | "theme" | "qr-scan" | "watermark"
  >("branding");
  const [activeStorageSubTab, setActiveStorageSubTab] = React.useState<
    "r2-s3" | "google-workspace" | "nextcloud" | "media-vault"
  >("r2-s3");
  const [activeEmailSubTab, setActiveEmailSubTab] = React.useState<"smtp" | "templates">("smtp");
  const [customSocialLinks, setCustomSocialLinks] = React.useState<CustomSocialLink[]>([]);

  // Google Workspace Config State
  const [googleServicesConfig, setGoogleServicesConfig] = React.useState<GoogleServicesConfig>({
    enabled: false,
    clientId: "",
    clientSecret: "",
    refreshToken: "",
    driveFolderId: "",
    sheetId: "",
    defaultServices: ["drive", "sheets"],
  });
  const [testingGoogle, setTestingGoogle] = React.useState(false);
  const [showGoogleSecret, setShowGoogleSecret] = React.useState(false);

  // Nextcloud Storage Config State
  const [nextcloudConfig, setNextcloudConfig] = React.useState<NextcloudConfig>({
    enabled: false,
    serverUrl: "",
    username: "",
    appPassword: "",
    baseFolder: "SavazAI-Media",
  });
  const [testingNextcloud, setTestingNextcloud] = React.useState(false);
  const [showNextcloudPassword, setShowNextcloudPassword] = React.useState(false);

  const PALETTE_TOKEN_DEFINITIONS: { key: keyof ThemeModeTokens; label: string; description: string }[] = [
    { key: "canvasBg", label: "Canvas Background", description: "Base page canvas color (--background)" },
    { key: "cardBg", label: "Card & Surface", description: "Elevated surfaces, panels & dialogs (--card)" },
    { key: "borderColor", label: "Border Color", description: "Structural container lines (--border)" },
    { key: "headingColor", label: "Headings Color", description: "Title & display typography (--headings)" },
    { key: "bodyColor", label: "Body Text Color", description: "Primary readable content (--foreground)" },
    { key: "mutedColor", label: "Secondary / Muted Text", description: "Subtitles, metadata & captions (--muted-foreground)" },
    { key: "btnPrimaryBg", label: "Primary Button Background", description: "Main call-to-action fill (--primary)" },
    { key: "btnPrimaryText", label: "Primary Button Text", description: "Contrast text on primary button (--primary-foreground)" },
    { key: "btnPrimaryHover", label: "Primary Button Hover", description: "Hover state background for primary buttons (--primary-hover)" },
    { key: "btnSecondaryBg", label: "Secondary Button Background", description: "Subtle secondary action fill (--secondary)" },
    { key: "btnSecondaryText", label: "Secondary Button Text", description: "Text on secondary button (--secondary-foreground)" },
    { key: "btnSecondaryHover", label: "Secondary Button Hover", description: "Hover state background for secondary buttons (--secondary-hover)" },
    { key: "activePillBg", label: "Active Pill / Badge Background", description: "Selected filter pills & active tabs (--active-pill-bg)" },
    { key: "activePillText", label: "Active Pill / Badge Text", description: "Text on selected filter pills & tabs (--active-pill-text)" },
    { key: "badgeBg", label: "Eyebrow Badge Background", description: "Earmark & section badge fill (--badge-bg)" },
    { key: "badgeText", label: "Eyebrow Badge Text", description: "Earmark & section badge typography (--badge-text)" },
    { key: "badgeBorder", label: "Eyebrow Badge Border", description: "Earmark & section badge outline (--badge-border)" },
  ];

  const FORM_TOKEN_DEFINITIONS: { key: keyof FormThemeTokens; label: string; description: string }[] = [
    { key: "formCardBg", label: "Form Card Background", description: "Container card surface for forms (--form-card-bg)" },
    { key: "formLabelColor", label: "Form Label Color", description: "Text color for input and field labels (--form-label-color)" },
    { key: "formInputBg", label: "Input / Textarea Background", description: "Background fill for input, textarea, and select (--form-input-bg)" },
    { key: "formInputText", label: "Input Value Text Color", description: "Typed text color inside inputs and dropdowns (--form-input-text)" },
    { key: "formPlaceholderColor", label: "Input Placeholder Color", description: "Placeholder text color in inputs and select triggers (--form-placeholder-color)" },
    { key: "formInputBorderColor", label: "Input Border Color", description: "Structural border color of inputs and select fields (--form-input-border)" },
    { key: "formFocusRingColor", label: "Input Focus Ring Color", description: "Glow/focus outline color on active inputs (--form-focus-ring-color)" },
    { key: "formSubmitBtnBg", label: "Submit Button Background", description: "Primary CTA button fill for inquiry submission (--form-btn-bg)" },
    { key: "formSubmitBtnText", label: "Submit Button Text", description: "Contrast text on submit button (--form-btn-text)" },
  ];

  // Core Settings Form
  const [form, setForm] = React.useState({
    siteName: "",
    archiveSubtitle: "",
    siteDescription: "",
    adminAlertEmail: "alerts@savazar.com",
    emailHeaderTitle: "",
    emailHeaderSubtitle: "",
    emailLogoUrl: "",
    emailFooterText: "",
    contactEmail: "",
    contactPhone: "",
    logoUrl: "",
    faviconUrl: "",
    adminLoginTitle: "SavazAI WebApps Platform Admin",
    adminLoginSubtitle: "Sign in with your authorized administrative credentials.",
    adminLoginLogoUrl: "",
    qrGateBadgeText: "EXHIBITION FLOOR GUIDE",
    qrGateHeaderTitle: "Welcome to the Exhibition",
    qrGatePromptText: 'Enter your details to explore details of the Artwork "{{artworkName}}".',
    qrGateButtonLabel: "Unlock Masterwork Details",
    qrGateAllowSkip: true,
    copyrightNoticeHeader: "Archival Provenance & Copyright Notice",
    copyrightNoticeContent: "",
    defaultCurrency: "INR",
    defaultTimezone: "Asia/Kolkata",
    watermarkText: "© SavazAI WebApps | All Rights Reserved",
    watermarkOpacity: 0.35,
    watermarkFontSize: 28,
    watermarkStyle: "REPEAT_DIAGONAL",
    defaultFoilEarmarkText: "Gold Foil",
    showFoilEarmark: true,
    storageProvider: "LOCAL",
    r2AccountId: "",
    r2BucketName: "",
    r2PublicUrl: "",
    s3Region: "ap-south-1",
    s3BucketName: "",
    s3Endpoint: "",
    s3AccessKey: "",
    s3SecretKey: "",
    s3PublicUrl: "",
    instagramUrl: "",
    youtubeUrl: "",
    facebookUrl: "",
    pinterestUrl: "",
    linkedinUrl: "",
    tiktokUrl: "",
  });

  // Dedicated Footer Config State
  const [footerConfig, setFooterConfig] = React.useState<FooterConfig>({
    aboutText:
      "Digital archive and publishing platform documenting high-fidelity cultural collections, masterworks, and multi-tenant exhibition portfolios.",
    contactEmail: "contact@savazar.com",
    contactPhone: "",
    copyrightText: "© 2026 SavazAI WebApps Platform. All rights reserved.",
    socialLinks: [
      { platform: "Instagram", url: "", isVisible: false },
      { platform: "YouTube", url: "", isVisible: false },
      { platform: "Facebook", url: "", isVisible: false },
      { platform: "Pinterest", url: "", isVisible: false },
    ],
    legalLinks: [
      { label: "Privacy Policy", url: "/privacy", isVisible: true },
      { label: "Terms & Conditions", url: "/terms", isVisible: true },
      { label: "Cookie Notice", url: "/cookies", isVisible: true },
      { label: "Art Licensing & Reproduction", url: "/licensing", isVisible: true },
      { label: "Deployment Diagnostics", url: "/deploy", isVisible: true },
    ],
  });

  // Dedicated Email & Gmail Config State
  const [emailConfig, setEmailConfig] = React.useState<EmailConfig>({
    provider: "gmail",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "contact@savazar.com",
    fromName: "SavazAI Atelier",
    isEnabled: false,
  });

  // Dedicated Universal AI Config State
  const [aiConfig, setAiConfig] = React.useState<AiConfig>({
    activeProvider: "gemini",
    apiKey: "",
    baseUrl: "",
    defaultModel: "gemini-1.5-pro",
    temperature: 0.7,
  });

  const [formSecurityConfig, setFormSecurityConfig] = React.useState<FormSecurityConfig>(DEFAULT_FORM_SECURITY_CONFIG);

  const [batchWatermarking, setBatchWatermarking] = React.useState(false);

  const handleBatchRewatermark = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to re-render watermarks for all artworks in the catalog? This will generate high-fidelity SVG watermark overlays according to your current settings."
    );
    if (!confirmed) return;

    setBatchWatermarking(true);
    toast.info("Re-applying watermarks across all artworks...");
    try {
      const res = await fetch("/api/admin/artworks/re-watermark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Successfully re-watermarked ${data.succeeded} of ${data.processed} artworks!`
        );
      } else {
        toast.error(data.error || "Failed to batch re-watermark artworks");
      }
    } catch {
      toast.error("Network error during batch watermarking");
    } finally {
      setBatchWatermarking(false);
    }
  };

  React.useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setForm({
            siteName: data.siteName || "",
            archiveSubtitle: data.archiveSubtitle || "",
            siteDescription: data.siteDescription || "",
            adminAlertEmail: data.adminAlertEmail || "alerts@savazar.com",
            emailHeaderTitle: data.emailHeaderTitle || "",
            emailHeaderSubtitle: data.emailHeaderSubtitle || "",
            emailLogoUrl: data.emailLogoUrl || "",
            emailFooterText: data.emailFooterText || "",
            contactEmail: data.contactEmail || "",
            contactPhone: data.contactPhone || "",
            copyrightNoticeHeader: data.copyrightNoticeHeader ?? "Archival Provenance & Copyright Notice",
            copyrightNoticeContent: data.copyrightNoticeContent ?? "",
            defaultCurrency: data.defaultCurrency || "INR",
            defaultTimezone: data.defaultTimezone || "Asia/Kolkata",
            watermarkText: data.watermarkText || "© SavazAI WebApps | All Rights Reserved",
            watermarkOpacity: data.watermarkOpacity ?? 0.35,
            watermarkFontSize: data.watermarkFontSize ?? 28,
            watermarkStyle: data.watermarkStyle || "REPEAT_DIAGONAL",
            defaultFoilEarmarkText: data.watermarkConfig?.defaultFoilEarmarkText || "Gold Foil",
            showFoilEarmark: data.watermarkConfig?.showFoilEarmark !== false,
            storageProvider: data.storageProvider || "LOCAL",
            r2AccountId: data.r2AccountId || "",
            r2BucketName: data.r2BucketName || "",
            r2PublicUrl: data.r2PublicUrl || "",
            s3Region: data.s3Region || "ap-south-1",
            s3BucketName: data.s3BucketName || "",
            s3Endpoint: data.s3Endpoint || "",
            s3AccessKey: data.s3AccessKey || "",
            s3SecretKey: data.s3SecretKey || "",
            s3PublicUrl: data.s3PublicUrl || "",
            instagramUrl: data.instagramUrl || "",
            youtubeUrl: data.youtubeUrl || "",
            facebookUrl: data.facebookUrl || "",
            pinterestUrl: data.pinterestUrl || "",
            linkedinUrl: data.linkedinUrl || "",
            tiktokUrl: data.tiktokUrl || "",
            logoUrl: data.logoUrl || "",
            faviconUrl: data.faviconUrl || "",
            adminLoginTitle: data.adminLoginTitle || "SavazAI WebApps Platform Admin",
            adminLoginSubtitle: data.adminLoginSubtitle || "Sign in with your authorized administrative credentials.",
            adminLoginLogoUrl: data.adminLoginLogoUrl || "",
            qrGateBadgeText: data.qrGateBadgeText || "EXHIBITION FLOOR GUIDE",
            qrGateHeaderTitle: data.qrGateHeaderTitle || "Welcome to the Exhibition",
            qrGatePromptText:
              data.qrGatePromptText ||
              'Enter your details to explore details of the Artwork "{{artworkName}}".',
            qrGateButtonLabel: data.qrGateButtonLabel || "Unlock Masterwork Details",
            qrGateAllowSkip: data.qrGateAllowSkip !== false,
          });

          if (Array.isArray(data.customSocialLinks)) {
            setCustomSocialLinks(data.customSocialLinks);
          }
          if (data.footerConfig) {
            setFooterConfig((prev) => ({ ...prev, ...data.footerConfig }));
          }
          if (data.emailConfig) {
            setEmailConfig((prev) => ({
              ...prev,
              ...data.emailConfig,
              isEnabled:
                data.emailConfig.isEnabled ??
                Boolean(data.emailConfig.smtpUser && data.emailConfig.smtpPassword),
            }));
          }
          if (data.aiConfig) {
            setAiConfig((prev) => ({ ...prev, ...data.aiConfig }));
          }
          if (data.adminConfig) {
            setAdminConfig((prev) => ({ ...prev, ...data.adminConfig }));
          }
          if (data.themeConfig) {
            setThemeConfig(sanitizeDetailedThemeConfig(data.themeConfig));
          }
          if (data.googleServicesConfig) {
            setGoogleServicesConfig((prev) => ({ ...prev, ...data.googleServicesConfig }));
          }
          if (data.nextcloudConfig) {
            setNextcloudConfig((prev) => ({ ...prev, ...data.nextcloudConfig }));
          }
          if (data.formSecurityConfig) {
            setFormSecurityConfig((prev) => ({
              contactForm: { ...prev.contactForm, ...data.formSecurityConfig.contactForm },
              qrScanGate: { ...prev.qrScanGate, ...data.formSecurityConfig.qrScanGate },
            }));
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
        setLoading(false);
      });

    fetch("/api/admin/settings/copy")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setAdminConfig(data);
      })
      .catch(() => {});
  }, []);

  const handleSaveBranding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingBranding(true);
    try {
      const res = await fetch("/api/admin/settings/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminConfig),
      });
      if (res.ok) {
        toast.success("Admin portal white-labeling saved successfully!");
        window.dispatchEvent(new Event("adminConfigUpdated"));
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to save portal configuration");
      }
    } catch {
      toast.error("Error saving portal configuration");
    } finally {
      setSavingBranding(false);
    }
  };

  const handleSaveTheme = async () => {
    setSavingTheme(true);
    try {
      const res = await fetch("/api/admin/settings/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeConfig }),
      });
      if (res.ok) {
        toast.success("Theme configuration saved globally across public app and admin portal!");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to save theme configuration");
      }
    } catch {
      toast.error("Error saving theme configuration");
    } finally {
      setSavingTheme(false);
    }
  };

  const handleResetTheme = async () => {
    setSavingTheme(true);
    try {
      const res = await fetch("/api/admin/settings/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeConfig: null }),
      });
      if (res.ok) {
        setThemeConfig({ ...DEFAULT_DETAILED_THEME_CONFIG });
        toast.success("Theme reset to system defaults.");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to reset theme");
      }
    } catch {
      toast.error("Error resetting theme");
    } finally {
      setSavingTheme(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    const body = new FormData();
    body.append("file", file);
    body.append("mediaType", "logo");
    body.append("isArtwork", "false");

    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const url = data.publicUrl || data.watermarkedUrl || data.primaryImageUrl;
      setForm((prev) => ({ ...prev, logoUrl: url }));
      toast.success("Logo uploaded successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFaviconUploading(true);
    const body = new FormData();
    body.append("file", file);
    body.append("mediaType", "favicon");
    body.append("isArtwork", "false");

    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const url = data.publicUrl || data.watermarkedUrl || data.primaryImageUrl;
      setForm((prev) => ({ ...prev, faviconUrl: url }));
      toast.success("Favicon uploaded successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload favicon");
    } finally {
      setFaviconUploading(false);
    }
  };

  const handleAdminLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAdminLogoUploading(true);
    const body = new FormData();
    body.append("file", file);
    body.append("mediaType", "logo");
    body.append("isArtwork", "false");

    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const url = data.publicUrl || data.watermarkedUrl || data.primaryImageUrl;
      setForm((prev) => ({ ...prev, adminLoginLogoUrl: url }));
      toast.success("Admin login logo uploaded successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload admin login logo");
    } finally {
      setAdminLogoUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Synchronize social URLs bi-directionally with footerConfig.socialLinks
      const updatedFooterSocials = [...(footerConfig.socialLinks || [])];
      const platformMap: Record<string, string> = {
        Instagram: form.instagramUrl?.trim() || "",
        YouTube: form.youtubeUrl?.trim() || "",
        Facebook: form.facebookUrl?.trim() || "",
        Pinterest: form.pinterestUrl?.trim() || "",
        LinkedIn: form.linkedinUrl?.trim() || "",
        TikTok: form.tiktokUrl?.trim() || "",
      };

      Object.entries(platformMap).forEach(([platform, url]) => {
        const existingIdx = updatedFooterSocials.findIndex(
          (s) => s.platform.toLowerCase() === platform.toLowerCase()
        );
        if (existingIdx >= 0) {
          updatedFooterSocials[existingIdx] = {
            ...updatedFooterSocials[existingIdx],
            url,
            isVisible: Boolean(url),
          };
        } else if (url) {
          updatedFooterSocials.push({
            platform,
            url,
            isVisible: true,
          });
        }
      });

      const updatedFooterConfig = {
        ...footerConfig,
        socialLinks: updatedFooterSocials,
      };

      const payload = {
        ...form,
        customSocialLinks: customSocialLinks.filter(
          (l) => l.label.trim() !== "" || l.url.trim() !== ""
        ),
        footerConfig: updatedFooterConfig,
        emailConfig,
        aiConfig,
        googleServicesConfig,
        nextcloudConfig,
        formSecurityConfig,
        watermarkConfig: {
          defaultFoilEarmarkText: form.defaultFoilEarmarkText?.trim() || "Gold Foil",
          showFoilEarmark: form.showFoilEarmark,
        },
      };

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      setSuccessMsg("System configuration updated successfully.");
      toast.success("All platform settings updated successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save settings";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleTestGoogle = async () => {
    setTestingGoogle(true);
    try {
      const res = await fetch("/api/admin/settings/test-storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", config: googleServicesConfig }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Google Workspace connected successfully!");
      } else {
        toast.error(data.message || "Failed to connect to Google Workspace");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error testing Google Workspace");
    } finally {
      setTestingGoogle(false);
    }
  };

  const handleTestNextcloud = async () => {
    setTestingNextcloud(true);
    try {
      const res = await fetch("/api/admin/settings/test-storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "nextcloud", config: nextcloudConfig }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Nextcloud WebDAV connected successfully!");
      } else {
        toast.error(data.message || "Failed to connect to Nextcloud WebDAV");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error testing Nextcloud");
    } finally {
      setTestingNextcloud(false);
    }
  };

  const handleTestEmail = async () => {
    if (!emailConfig.smtpUser || !emailConfig.smtpPassword) {
      toast.error("Please provide SMTP User and Password / App Password before testing.");
      return;
    }

    setTestingEmail(true);
    try {
      const res = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...emailConfig,
          testRecipient: testEmailRecipient || form.adminAlertEmail || emailConfig.smtpUser,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Test email delivery failed");

      toast.success(data.message || "Test email dispatched successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "SMTP test failed");
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestAi = async () => {
    if (!aiConfig.apiKey && aiConfig.activeProvider !== "ollama") {
      toast.error("Please input an API Key for your selected AI provider.");
      return;
    }

    setTestingAi(true);
    setAiTestResult(null);

    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiTestPrompt,
          action: "POLISH",
          tone: "SCHOLARLY",
          modelOverride: aiConfig.defaultModel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI connection test failed");

      setAiTestResult(data.text);
      toast.success(`Success! Connected to ${aiConfig.activeProvider.toUpperCase()}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "AI test failed");
    } finally {
      setTestingAi(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <EditablePageHeader
        sectionKey="settings"
        defaultTitle="Platform & Storage Settings"
        defaultSubtitle="Global system metadata, watermark vault, R2/S3 storage, dynamic footer, Gmail SMTP, and multi-provider AI engine."
        badgeLabel="Platform Infrastructure"
      >
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer text-xs"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5 mr-1.5" />
          )}
          Save All Settings
        </Button>
      </EditablePageHeader>

      {successMsg && (
        <div className="p-3 text-xs rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 text-xs rounded-md bg-destructive/10 border border-destructive/30 text-destructive font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading system settings...</span>
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            <TabsList className="flex flex-wrap gap-1.5 w-full h-auto p-1.5 bg-slate-200/70 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-xl">
              <TabsTrigger
                value="general"
                className="text-xs py-2 rounded-lg font-bold border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-300 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:border-slate-900 dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 dark:data-[state=active]:border-slate-100 shadow-2xs transition-all"
              >
                <Settings className="w-3.5 h-3.5 mr-1" /> General
              </TabsTrigger>
              <TabsTrigger
                value="personalization"
                className="text-xs py-2 rounded-lg font-bold border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-300 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:border-slate-900 dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 dark:data-[state=active]:border-slate-100 shadow-2xs transition-all"
              >
                <Palette className="w-3.5 h-3.5 mr-1" /> App Personalization
              </TabsTrigger>
              <TabsTrigger
                value="storage-vault"
                className="text-xs py-2 rounded-lg font-bold border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-300 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:border-slate-900 dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 dark:data-[state=active]:border-slate-100 shadow-2xs transition-all"
              >
                <HardDrive className="w-3.5 h-3.5 mr-1" /> Storage &amp; Media Vault
              </TabsTrigger>
              <TabsTrigger
                value="email-hub"
                className="text-xs py-2 rounded-lg font-bold border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-300 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:border-slate-900 dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 dark:data-[state=active]:border-slate-100 shadow-2xs transition-all"
              >
                <Mail className="w-3.5 h-3.5 mr-1" /> E-Mail Configuration
              </TabsTrigger>
              <TabsTrigger
                value="footer"
                className="text-xs py-2 rounded-lg font-bold border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-300 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:border-slate-900 dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 dark:data-[state=active]:border-slate-100 shadow-2xs transition-all"
              >
                <FileText className="w-3.5 h-3.5 mr-1" /> Footer
              </TabsTrigger>
              <TabsTrigger
                value="socials"
                className="text-xs py-2 rounded-lg font-bold border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-300 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:border-slate-900 dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 dark:data-[state=active]:border-slate-100 shadow-2xs transition-all"
              >
                <Share2 className="w-3.5 h-3.5 mr-1" /> Socials
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="text-xs py-2 rounded-lg font-bold border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-300 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:border-slate-900 dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 dark:data-[state=active]:border-slate-100 shadow-2xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Engine
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: General */}
            <TabsContent value="general">
              <Card className="border border-border/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">General Archive Configuration</CardTitle>
                  <CardDescription className="text-xs">
                    Configure public site identity, administration contact, and default currency.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-xs">
                  {/* Website Brand Logo & Favicon */}
                  <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                        <ImageIcon className="w-4 h-4 text-primary" />
                        Website Brand Logo & Favicon
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Upload your official brand logo to display across navigation, footer, and admin headers.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                      {form.logoUrl ? (
                        <div className="relative group w-32 h-18 rounded border border-border bg-card/80 flex items-center justify-center p-2 shrink-0">
                          <img
                            src={form.logoUrl}
                            alt="Logo"
                            className="max-w-full max-h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, logoUrl: "" }))}
                            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-18 rounded border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground bg-muted/20 shrink-0">
                          <ImageIcon className="w-5 h-5 opacity-40 mb-1" />
                          <span className="text-[10px]">No Logo</span>
                        </div>
                      )}

                      <div className="space-y-1.5 flex-1">
                        <Label className="text-xs font-medium">Official Brand Logo</Label>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/heic,image/heif,image/heic-sequence,.heic,.heics"
                              onChange={handleLogoUpload}
                              disabled={logoUploading}
                              className="hidden"
                            />
                            <div className="inline-flex items-center px-3 py-1.5 rounded-md border border-border bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
                              {logoUploading ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5 mr-1.5" />
                              )}
                              Upload Logo
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Favicon Controls */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 border-t border-border/40">
                      {form.faviconUrl ? (
                        <div className="relative group w-12 h-12 rounded border border-border bg-card/80 flex items-center justify-center p-1 shrink-0">
                          <img
                            src={form.faviconUrl}
                            alt="Favicon"
                            className="max-w-full max-h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, faviconUrl: "" }))}
                            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded border border-dashed border-border flex items-center justify-center text-muted-foreground bg-muted/20 shrink-0">
                          <span className="text-[9px]">Icon</span>
                        </div>
                      )}

                      <div className="space-y-1.5 flex-1">
                        <Label className="text-xs font-medium">Favicon</Label>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".ico,image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml"
                              onChange={handleFaviconUpload}
                              disabled={faviconUploading}
                              className="hidden"
                            />
                            <div className="inline-flex items-center px-3 py-1.5 rounded-md border border-border bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
                              {faviconUploading ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5 mr-1.5" />
                              )}
                              Upload Favicon
                            </div>
                          </label>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Upload official website favicon (.ico, .png, or .svg, recommended 32x32px or 64x64px).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Admin Login Portal Branding */}
                  <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                        <Shield className="w-4 h-4 text-primary" />
                        Admin Login Screen Branding (/admin/login)
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Configure the title, subtitle, and custom logo/emblem displayed on the administrative login portal.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                      {form.adminLoginLogoUrl ? (
                        <div className="relative group w-20 h-20 rounded-full border border-border bg-card/80 flex items-center justify-center p-2 shrink-0 overflow-hidden">
                          <img
                            src={form.adminLoginLogoUrl}
                            alt="Admin Login Logo"
                            className="max-w-full max-h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, adminLoginLogoUrl: "" }))}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground bg-muted/20 shrink-0">
                          <Shield className="w-6 h-6 opacity-40 mb-1" />
                          <span className="text-[9px]">Default Shield</span>
                        </div>
                      )}

                      <div className="space-y-2 flex-1 w-full">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Admin Login Logo / Emblem URL</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              value={form.adminLoginLogoUrl}
                              onChange={(e) => setForm({ ...form, adminLoginLogoUrl: e.target.value })}
                              placeholder="https://... or upload custom image"
                              className="text-xs"
                            />
                            <label className="cursor-pointer shrink-0">
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                onChange={handleAdminLogoUpload}
                                disabled={adminLogoUploading}
                                className="hidden"
                              />
                              <div className="inline-flex items-center px-3 py-1.5 rounded-md border border-border bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
                                {adminLogoUploading ? (
                                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                                )}
                                Upload
                              </div>
                            </label>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Optional custom logo or crest. If left blank, the standard platform shield emblem is displayed.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                      <div className="space-y-1.5">
                        <Label className="font-semibold text-foreground">Admin Login Title</Label>
                        <Input
                          value={form.adminLoginTitle}
                          onChange={(e) => setForm({ ...form, adminLoginTitle: e.target.value })}
                          placeholder="SavazAI WebApps Platform Admin"
                          className="text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Main title rendered prominently on the login card and browser tab title.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="font-semibold text-foreground">Admin Login Subtitle</Label>
                        <Input
                          value={form.adminLoginSubtitle}
                          onChange={(e) => setForm({ ...form, adminLoginSubtitle: e.target.value })}
                          placeholder="Sign in with your authorized administrative credentials."
                          className="text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Instructional subtitle rendered directly below the login title.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* General Site Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Archive Name</Label>
                      <Input
                        value={form.siteName}
                        onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                        placeholder="e.g. SavazAI Archive"
                        className="text-xs"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Primary brand title displayed in navigation headers and page titles.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Archive Subtitle / Brand Tagline</Label>
                      <Input
                        value={form.archiveSubtitle}
                        onChange={(e) => setForm({ ...form, archiveSubtitle: e.target.value })}
                        placeholder="e.g. Digital Archive & Exhibition Suite"
                        className="text-xs"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Displayed in the public website header directly below the primary brand title.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold text-foreground">Admin Alert Email</Label>
                    <Input
                      type="email"
                      value={form.adminAlertEmail}
                      onChange={(e) => setForm({ ...form, adminAlertEmail: e.target.value })}
                      className="text-xs font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Inbound notifications and system alerts destination address.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold text-foreground">Site Description</Label>
                    <Textarea
                      value={form.siteDescription}
                      onChange={(e) => setForm({ ...form, siteDescription: e.target.value })}
                      rows={2}
                      className="text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Default Currency</Label>
                      <Select
                        value={form.defaultCurrency}
                        onValueChange={(val) => setForm({ ...form, defaultCurrency: val })}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_CURRENCIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.code} — {c.label} ({c.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Timezone</Label>
                      <Input
                        value={form.defaultTimezone}
                        onChange={(e) => setForm({ ...form, defaultTimezone: e.target.value })}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Form Security & Anti-Spam Verification */}
                  <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                        <Shield className="w-4 h-4 text-primary" />
                        Form Security, Anti-Bot CAPTCHA &amp; Email OTP Verification
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Configure automated bot protection and visitor email authenticity verification with intelligent returning user bypass.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* Contact Form Security */}
                      <div className="p-3.5 rounded-lg border border-border bg-card/80 space-y-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                          <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-primary" />
                            Public Contact Form (/contact)
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <Label className="text-xs font-medium text-foreground">Require CAPTCHA Challenge</Label>
                            <p className="text-[10px] text-muted-foreground">Stateless arithmetic problem to prevent automated bot flood</p>
                          </div>
                          <Switch
                            checked={formSecurityConfig.contactForm.enableCaptcha}
                            onCheckedChange={(val) =>
                              setFormSecurityConfig((prev) => ({
                                ...prev,
                                contactForm: { ...prev.contactForm, enableCaptcha: val },
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/40">
                          <div className="space-y-0.5">
                            <Label className="text-xs font-medium text-foreground">Require Email OTP Verification</Label>
                            <p className="text-[10px] text-muted-foreground">Dispatches 6-digit code. Verified returning users bypass automatically.</p>
                          </div>
                          <Switch
                            checked={formSecurityConfig.contactForm.enableEmailOtp}
                            onCheckedChange={(val) =>
                              setFormSecurityConfig((prev) => ({
                                ...prev,
                                contactForm: { ...prev.contactForm, enableEmailOtp: val },
                              }))
                            }
                          />
                        </div>
                      </div>

                      {/* Physical Artwork QR Scan Gate */}
                      <div className="p-3.5 rounded-lg border border-border bg-card/80 space-y-3">
                        <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                          <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-primary" />
                            Physical Exhibition QR Scan Gate
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <Label className="text-xs font-medium text-foreground">Require CAPTCHA on QR Intake</Label>
                            <p className="text-[10px] text-muted-foreground">Prevents scripted fake QR scans from skewing exhibition telemetry</p>
                          </div>
                          <Switch
                            checked={formSecurityConfig.qrScanGate.enableCaptcha}
                            onCheckedChange={(val) =>
                              setFormSecurityConfig((prev) => ({
                                ...prev,
                                qrScanGate: { ...prev.qrScanGate, enableCaptcha: val },
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/40">
                          <div className="space-y-0.5">
                            <Label className="text-xs font-medium text-foreground">Require Email OTP on QR Intake</Label>
                            <p className="text-[10px] text-muted-foreground">Enforces authentic email on physical salon wall scans</p>
                          </div>
                          <Switch
                            checked={formSecurityConfig.qrScanGate.enableEmailOtp}
                            onCheckedChange={(val) =>
                              setFormSecurityConfig((prev) => ({
                                ...prev,
                                qrScanGate: { ...prev.qrScanGate, enableEmailOtp: val },
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Artwork Archival Provenance & Copyright Notice */}
                  <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        Artwork Archival Provenance &amp; Copyright Notice Box
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Configure the provenance and legal copyright notice displayed on public artwork detail pages. If left completely blank, the notice box will be hidden entirely.
                      </p>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="space-y-1.5">
                        <Label className="font-semibold text-foreground">Notice Box Header Title</Label>
                        <Input
                          value={form.copyrightNoticeHeader}
                          onChange={(e) => setForm({ ...form, copyrightNoticeHeader: e.target.value })}
                          placeholder="e.g. Archival Provenance & Copyright Notice"
                          className="text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="font-semibold text-foreground">Notice Box Content Text</Label>
                        <Textarea
                          value={form.copyrightNoticeContent}
                          onChange={(e) => setForm({ ...form, copyrightNoticeContent: e.target.value })}
                          rows={3}
                          placeholder="e.g. Original hand-crafted masterwork. All rights reserved. Leave completely blank to suppress this box on artwork pages."
                          className="text-xs"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Leaving this content field blank will suppress the entire copyright box across all public artwork pages.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: App Personalization Hub (White-Labeling, Theme Studio, QR Scan Gate, Watermark) */}
            <TabsContent value="personalization" className="space-y-5">
              {/* Sub-Navigation Bar */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-muted/60 border border-border/80">
                <button
                  type="button"
                  onClick={() => setActivePersonalizationSubTab("branding")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePersonalizationSubTab === "branding"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/70"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  1. White-Label Branding
                </button>
                <button
                  type="button"
                  onClick={() => setActivePersonalizationSubTab("theme")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePersonalizationSubTab === "theme"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/70"
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  2. Theme Studio
                </button>
                <button
                  type="button"
                  onClick={() => setActivePersonalizationSubTab("qr-scan")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePersonalizationSubTab === "qr-scan"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/70"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  3. QR Scan Gate
                </button>
                <button
                  type="button"
                  onClick={() => setActivePersonalizationSubTab("watermark")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePersonalizationSubTab === "watermark"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/70"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  4. Watermark &amp; Anti-Harvesting
                </button>
              </div>

              {activePersonalizationSubTab === "branding" && (
              <Card className="border border-border/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-primary" />
                    Admin Portal White-Labeling &amp; Navigation
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Customize the top dashboard brand titles and rename every sidebar navigation menu item to suit institutional or client requirements.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-xs">
                  {/* Top Bar and Brand Headers */}
                  <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-4">
                    <h4 className="font-semibold text-foreground text-sm">Dashboard &amp; Sidebar Branding</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="font-semibold text-foreground">Top Dashboard Title</Label>
                        <Input
                          value={adminConfig.dashboardTitle}
                          onChange={(e) =>
                            setAdminConfig({ ...adminConfig, dashboardTitle: e.target.value })
                          }
                          placeholder="Archive & Platform Dashboard"
                          className="text-xs font-serif"
                        />
                        <p className="text-[10px] text-muted-foreground">Appears on the top sticky navigation bar</p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="font-semibold text-foreground">Sidebar Brand Title</Label>
                        <Input
                          value={adminConfig.sidebarBrandTitle}
                          onChange={(e) =>
                            setAdminConfig({ ...adminConfig, sidebarBrandTitle: e.target.value })
                          }
                          placeholder="SavazAI Atelier"
                          className="text-xs font-serif"
                        />
                        <p className="text-[10px] text-muted-foreground">Primary artist/institution name</p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="font-semibold text-foreground">Sidebar Subtitle</Label>
                        <Input
                          value={adminConfig.sidebarBrandSubtitle}
                          onChange={(e) =>
                            setAdminConfig({ ...adminConfig, sidebarBrandSubtitle: e.target.value })
                          }
                          placeholder="Control Center"
                          className="text-xs font-mono"
                        />
                        <p className="text-[10px] text-muted-foreground">Appears under brand name in sidebar</p>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Navigation Items */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground text-sm">Sidebar Navigation Menu Labels</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAdminConfig({
                            ...adminConfig,
                            sidebarLabels: { ...DEFAULT_ADMIN_CONFIG.sidebarLabels },
                          })
                        }
                        className="text-[11px] h-7"
                      >
                        Reset Menu Defaults
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Rename sidebar menu items without altering internal route bindings.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                      {ADMIN_NAV_ITEMS.map((item) => (
                        <div key={item.id} className="p-3 rounded-lg border border-border bg-card/60 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-muted-foreground font-semibold">/{item.id}</span>
                            <span className="text-[10px] text-muted-foreground">Default: {item.defaultLabel}</span>
                          </div>
                          <Input
                            value={adminConfig.sidebarLabels?.[item.id] ?? item.defaultLabel}
                            onChange={(e) =>
                              setAdminConfig({
                                ...adminConfig,
                                sidebarLabels: {
                                  ...adminConfig.sidebarLabels,
                                  [item.id]: e.target.value,
                                },
                              })
                            }
                            className="text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section Headings, Eyebrows & Subtitles */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground text-sm">Admin View Headers, Eyebrow Badges &amp; Descriptions</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAdminConfig({
                            ...adminConfig,
                            pageHeadings: { ...DEFAULT_ADMIN_CONFIG.pageHeadings },
                          })
                        }
                        className="text-[11px] h-7"
                      >
                        Reset Headings Defaults
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Customize the eyebrow badges, main titles, and curatorial descriptions across all 11 administrative dashboard pages.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {ADMIN_NAV_ITEMS.map((item) => {
                        const heading = adminConfig.pageHeadings?.[item.id] || DEFAULT_ADMIN_CONFIG.pageHeadings[item.id] || {
                          badge: "",
                          title: item.defaultLabel,
                          subtitle: "",
                        };
                        return (
                          <div key={`heading-${item.id}`} className="p-3.5 rounded-lg border border-border bg-card/60 space-y-2.5">
                            <div className="flex items-center justify-between text-xs pb-1 border-b border-border/50">
                              <span className="font-semibold text-primary flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                {item.defaultLabel} Section
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">/{item.id}</span>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] font-mono uppercase text-muted-foreground">Eyebrow Badge / Tag</Label>
                              <Input
                                value={heading.badge || ""}
                                onChange={(e) =>
                                  setAdminConfig({
                                    ...adminConfig,
                                    pageHeadings: {
                                      ...adminConfig.pageHeadings,
                                      [item.id]: {
                                        ...heading,
                                        badge: e.target.value,
                                      },
                                    },
                                  })
                                }
                                placeholder="Eyebrow Tag..."
                                className="text-xs h-8"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] font-mono uppercase text-muted-foreground">Main Heading Title</Label>
                              <Input
                                value={heading.title || ""}
                                onChange={(e) =>
                                  setAdminConfig({
                                    ...adminConfig,
                                    pageHeadings: {
                                      ...adminConfig.pageHeadings,
                                      [item.id]: {
                                        ...heading,
                                        title: e.target.value,
                                      },
                                    },
                                  })
                                }
                                placeholder="Page Title..."
                                className="text-xs font-semibold h-8"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] font-mono uppercase text-muted-foreground">Subtitle / Curatorial Description</Label>
                              <Textarea
                                value={heading.subtitle || ""}
                                onChange={(e) =>
                                  setAdminConfig({
                                    ...adminConfig,
                                    pageHeadings: {
                                      ...adminConfig.pageHeadings,
                                      [item.id]: {
                                        ...heading,
                                        subtitle: e.target.value,
                                      },
                                    },
                                  })
                                }
                                placeholder="Subtitle or instructions..."
                                rows={2}
                                className="text-xs resize-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex justify-end">
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => handleSaveBranding()}
                      disabled={savingBranding}
                      className="gap-2 text-xs"
                    >
                      {savingBranding ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save White-Label Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Sub-Tab 3: QR Scan Lead Intake Gate */}
              {activePersonalizationSubTab === "qr-scan" && (
              <Card className="border border-border/80 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-serif text-lg flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-primary" />
                        Artwork QR Lead-Capture Gate Configuration
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Configure the interactive floor-guide modal displayed to mobile visitors scanning physical gallery & salon wall QR codes.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      size="sm"
                      className="text-xs gap-1.5"
                    >
                      {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Save QR Gate Settings
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Form Configuration Controls */}
                    <div className="lg:col-span-7 space-y-6">
                      {/* Modal Text & Dynamic Copy */}
                      <div className="p-4 rounded-lg border border-border/70 bg-card space-y-4">
                        <h4 className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                          <Sliders className="w-4 h-4 text-primary" />
                          Floor-Guide Modal Copy &amp; Dynamic Interpolation
                        </h4>

                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="font-semibold text-foreground">Eyebrow / Badge Text</Label>
                            <Input
                              value={form.qrGateBadgeText}
                              onChange={(e) => setForm({ ...form, qrGateBadgeText: e.target.value })}
                              placeholder="e.g. EXHIBITION FLOOR GUIDE"
                              className="text-xs"
                            />
                            <p className="text-[11px] text-muted-foreground">
                              Appears as the small uppercase badge with QR icon at the top of the modal dialog.
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="font-semibold text-foreground">Modal Header Title</Label>
                            <Input
                              value={form.qrGateHeaderTitle}
                              onChange={(e) => setForm({ ...form, qrGateHeaderTitle: e.target.value })}
                              placeholder="e.g. Welcome to the Exhibition"
                              className="text-xs"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <Label className="font-semibold text-foreground">Lead Capture Prompt Template</Label>
                              <button
                                type="button"
                                onClick={() => {
                                  const current = form.qrGatePromptText || "";
                                  if (!current.includes("{{artworkName}}")) {
                                    setForm({ ...form, qrGatePromptText: current ? `${current} {{artworkName}}` : 'Enter your details to explore details of the Artwork "{{artworkName}}".' });
                                  }
                                }}
                                className="text-[10px] text-primary hover:underline font-mono cursor-pointer"
                              >
                                + Insert {"{{artworkName}}"}
                              </button>
                            </div>
                            <Textarea
                              value={form.qrGatePromptText}
                              onChange={(e) => setForm({ ...form, qrGatePromptText: e.target.value })}
                              rows={3}
                              placeholder='e.g. Enter your details to explore details of the Artwork "{{artworkName}}".'
                              className="text-xs font-sans leading-relaxed"
                            />
                            <p className="text-[11px] text-muted-foreground">
                              Use <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">{"{{artworkName}}"}</code> or <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">{"{artwork}"}</code> as dynamic placeholders. When a visitor scans any physical QR placard, it automatically resolves to that specific artwork&apos;s title.
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="font-semibold text-foreground">Action Button Label</Label>
                            <Input
                              value={form.qrGateButtonLabel}
                              onChange={(e) => setForm({ ...form, qrGateButtonLabel: e.target.value })}
                              placeholder="e.g. Unlock Masterwork Details"
                              className="text-xs"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/50">
                            <div className="space-y-0.5">
                              <Label className="font-semibold text-foreground">Enable &apos;Skip &amp; View&apos; Option</Label>
                              <p className="text-[11px] text-muted-foreground">
                                When enabled, visitors can bypass lead intake and directly view the artwork. Disable to require lead capture before viewing.
                              </p>
                            </div>
                            <Switch
                              checked={form.qrGateAllowSkip}
                              onCheckedChange={(val) => setForm({ ...form, qrGateAllowSkip: val })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Security & Verification Settings */}
                      <div className="p-4 rounded-lg border border-border/70 bg-card space-y-4">
                        <h4 className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                          <ShieldCheck className="w-4 h-4 text-primary" />
                          Anti-Bot Challenge &amp; Email Verification
                        </h4>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <Label className="text-xs font-medium text-foreground">Require CAPTCHA on QR Intake</Label>
                              <p className="text-[11px] text-muted-foreground">
                                Stateless arithmetic challenge to prevent scripted fake QR scans from skewing exhibition telemetry
                              </p>
                            </div>
                            <Switch
                              checked={formSecurityConfig.qrScanGate.enableCaptcha}
                              onCheckedChange={(val) =>
                                setFormSecurityConfig((prev) => ({
                                  ...prev,
                                  qrScanGate: { ...prev.qrScanGate, enableCaptcha: val },
                                }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                            <div className="space-y-0.5">
                              <Label className="text-xs font-medium text-foreground">Require Email OTP on QR Intake</Label>
                              <p className="text-[11px] text-muted-foreground">
                                Dispatches 6-digit verification code. Verified returning users on recognized devices bypass automatically.
                              </p>
                            </div>
                            <Switch
                              checked={formSecurityConfig.qrScanGate.enableEmailOtp}
                              onCheckedChange={(val) =>
                                setFormSecurityConfig((prev) => ({
                                  ...prev,
                                  qrScanGate: { ...prev.qrScanGate, enableEmailOtp: val },
                                }))
                              }
                            />
                          </div>

                          <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 space-y-1">
                            <div className="font-semibold text-[11px] flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5" />
                              Strict CRM Lead Invariant
                            </div>
                            <p className="text-[10px] leading-relaxed">
                              A valid email address is strictly required on all QR lead submissions, regardless of whether CAPTCHA or Email OTP are enabled or disabled. This guarantees complete contact attribution for gallery CRM follow-ups.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Live Mobile Dialog Preview */}
                    <div className="lg:col-span-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold text-foreground flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-primary" />
                          Live Mobile Dialog Preview
                        </Label>
                        <span className="text-[10px] text-muted-foreground">Interactive Mock</span>
                      </div>

                      <div className="rounded-2xl border-2 border-primary/50 bg-card/95 backdrop-blur-xl p-5 shadow-xl space-y-4 max-w-sm mx-auto">
                        <div className="space-y-2">
                          <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-primary uppercase tracking-widest">
                            <QrCode className="w-3.5 h-3.5" />
                            {form.qrGateBadgeText || "EXHIBITION FLOOR GUIDE"}
                          </div>
                          <h3 className="text-base font-serif font-bold text-foreground">
                            {form.qrGateHeaderTitle || "Welcome to the Exhibition"}
                          </h3>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {(form.qrGatePromptText || 'Enter your details to explore details of the Artwork "{{artworkName}}".')
                              .replace(/\{\{artworkName\}\}/g, "Dhanvantari (2025)")
                              .replace(/\{artwork\}/g, "Dhanvantari (2025)")}
                          </p>
                        </div>

                        <div className="space-y-2.5 pt-1 text-left opacity-95">
                          <div className="space-y-1">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground">
                              Your Full Name *
                            </div>
                            <div className="h-8 rounded border border-border/70 bg-muted/30 px-2.5 flex items-center text-[11px] text-muted-foreground">
                              e.g. Smt. Radhika Sharma
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground">
                              WhatsApp / Phone Number *
                            </div>
                            <div className="h-8 rounded border border-border/70 bg-muted/30 px-2.5 flex items-center text-[11px] text-muted-foreground">
                              +91 98450 00000
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground flex items-center justify-between">
                              <span>Email Address *</span>
                              <span className="text-[9px] font-bold text-primary uppercase">Required</span>
                            </div>
                            <div className="h-8 rounded border border-primary/40 bg-muted/30 px-2.5 flex items-center text-[11px] text-muted-foreground">
                              radhika@example.com
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
                            <div className="w-3.5 h-3.5 rounded border border-primary bg-primary flex items-center justify-center text-primary-foreground text-[8px] font-bold">✓</div>
                            <span>I have read and agree to the Privacy Policy.</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
                          <div className="h-9 rounded-md bg-primary text-primary-foreground font-serif font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5" />
                            {form.qrGateButtonLabel || "Unlock Masterwork Details"}
                          </div>
                          {form.qrGateAllowSkip && (
                            <div className="text-center text-[11px] text-muted-foreground py-0.5">
                              Skip &amp; View
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex justify-end">
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="gap-2 text-xs"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save QR Gate Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Sub-Tab 4: Watermark & Anti-Harvesting */}
              {activePersonalizationSubTab === "watermark" && (
              <Card className="border border-border/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Selective Watermarking & Protection</CardTitle>
                  <CardDescription className="text-xs">
                    Protected original high-resolution masters are vaulted in S3/R2 storage, while public derivatives receive dynamic SVG watermark overlays.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Watermark Stamp Text</Label>
                      <Input
                        value={form.watermarkText}
                        onChange={(e) => setForm({ ...form, watermarkText: e.target.value })}
                        className="text-xs font-serif"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Watermark Style &amp; Placement</Label>
                      <Select
                        value={form.watermarkStyle}
                        onValueChange={(val) => setForm({ ...form, watermarkStyle: val })}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REPEAT_DIAGONAL">Full Diagonal Repeat (-25° subtle pattern)</SelectItem>
                          <SelectItem value="BANNER">Bottom Protection Banner (Obsidian + Gold Line)</SelectItem>
                          <SelectItem value="CORNER">Crisp Corner Stamp Badge (Bottom-Right)</SelectItem>
                          <SelectItem value="BOTH">Diagonal Repeat + Bottom Protection Banner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Opacity ({form.watermarkOpacity})</Label>
                      <Input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        value={form.watermarkOpacity}
                        onChange={(e) => setForm({ ...form, watermarkOpacity: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Font Size ({form.watermarkFontSize}px)</Label>
                      <Input
                        type="number"
                        value={form.watermarkFontSize}
                        onChange={(e) => setForm({ ...form, watermarkFontSize: parseInt(e.target.value) || 28 })}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Foil & Medium Earmarks */}
                  <div className="pt-4 border-t border-border/60">
                    <h4 className="font-serif font-bold text-sm text-foreground mb-1">
                      Foil &amp; Medium Earmarks (Gallery &amp; Detail Overlays)
                    </h4>
                    <p className="text-muted-foreground text-xs mb-3">
                      Configure the default label and global visibility of authentic foil work badges on artwork cards and master detail views.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="font-semibold text-foreground">Default Foil Earmark Text</Label>
                        <Input
                          value={form.defaultFoilEarmarkText}
                          onChange={(e) => setForm({ ...form, defaultFoilEarmarkText: e.target.value })}
                          placeholder="e.g. Gold Foil, 24K Gold Leaf"
                          className="text-xs"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Applied across gallery cards and detail views when an artwork has foil work enabled without an individual override.
                        </p>
                      </div>

                      <div className="space-y-1.5 flex flex-col justify-center">
                        <label className="flex items-center gap-2 cursor-pointer pt-2">
                          <input
                            type="checkbox"
                            checked={form.showFoilEarmark}
                            onChange={(e) => setForm({ ...form, showFoilEarmark: e.target.checked })}
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                          />
                          <span className="font-semibold text-foreground text-xs select-none">
                            Display Foil Work Earmarks / Badges across Galleries
                          </span>
                        </label>
                        <p className="text-[11px] text-muted-foreground pl-6">
                          When checked, artworks with gold or silver foil work display a gold badge in gallery grids and the detail canvas.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Re-apply Watermarks to All Artworks */}
                  <div className="pt-4 border-t border-border/60">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                      <div>
                        <h4 className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          Batch Synchronize Masterwork Watermarks
                        </h4>
                        <p className="text-muted-foreground text-xs">
                          Re-renders the SVG watermark overlay across all cataloged artworks using current global or custom settings.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleBatchRewatermark}
                        disabled={batchWatermarking}
                        className="text-xs font-semibold whitespace-nowrap gap-1.5 border border-amber-500/40 hover:bg-amber-500/10"
                      >
                        {batchWatermarking ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        Re-apply Watermarks to All Artworks
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}
            </TabsContent>

            {/* Tab: Storage & Media Vault Hub (R2/S3, Google Workspace, Nextcloud, Manage Media Vault) */}
            <TabsContent value="storage-vault" className="space-y-5">
              {/* Sub-Navigation Bar */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-muted/60 border border-border/80">
                <button
                  type="button"
                  onClick={() => setActiveStorageSubTab("r2-s3")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeStorageSubTab === "r2-s3"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/70"
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" />
                  1. Cloudflare R2 / S3 Storage
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStorageSubTab("google-workspace")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeStorageSubTab === "google-workspace"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/70"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  2. Google Workspace
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStorageSubTab("nextcloud")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeStorageSubTab === "nextcloud"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/70"
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  3. Nextcloud Hub
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStorageSubTab("media-vault")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeStorageSubTab === "media-vault"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/70"
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  4. Manage Media Vault
                </button>
              </div>

              {activeStorageSubTab === "r2-s3" && (
              <Card className="border border-border/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Cloudflare R2 & S3 Object Storage</CardTitle>
                  <CardDescription className="text-xs">
                    Configure endpoints for high-throughput image hosting and original master archives.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="space-y-1.5 max-w-md">
                    <Label className="font-semibold text-foreground">Storage Provider</Label>
                    <Select
                      value={form.storageProvider}
                      onValueChange={(val) => setForm({ ...form, storageProvider: val })}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select storage provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOCAL">Local Filesystem (/public/media)</SelectItem>
                        <SelectItem value="R2">Cloudflare R2 Object Storage</SelectItem>
                        <SelectItem value="S3">Amazon S3 Object Storage</SelectItem>
                        <SelectItem value="GOOGLE_DRIVE">Google Drive Object Vault</SelectItem>
                        <SelectItem value="NEXTCLOUD">Nextcloud WebDAV Storage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* When GOOGLE DRIVE: Show shortcut callout */}
                  {form.storageProvider === "GOOGLE_DRIVE" && (
                    <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 text-xs text-foreground space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-primary" />
                          Google Drive Vault Mode Active
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveStorageSubTab("google-workspace")}
                          className="text-xs font-semibold cursor-pointer"
                        >
                          Configure in Google Workspace Tab →
                        </Button>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        Media assets will be saved directly into your configured Google Drive folder. Ensure your Client ID, Secret, and Refresh Token are set in the Google Workspace tab.
                      </p>
                    </div>
                  )}

                  {/* When NEXTCLOUD: Show shortcut callout */}
                  {form.storageProvider === "NEXTCLOUD" && (
                    <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 text-xs text-foreground space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          <Server className="w-4 h-4 text-primary" />
                          Nextcloud WebDAV Storage Active
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveStorageSubTab("nextcloud")}
                          className="text-xs font-semibold cursor-pointer"
                        >
                          Configure in Nextcloud Storage Tab →
                        </Button>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        Media assets will be uploaded directly to your Nextcloud instance via WebDAV. Ensure your Server URL, Username, and App Password are set in the Nextcloud Storage tab.
                      </p>
                    </div>
                  )}

                  {/* When LOCAL: Show clear info callout and hide cloud inputs */}
                  {form.storageProvider === "LOCAL" && (
                    <div className="p-4 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground space-y-1.5">
                      <p className="font-semibold text-foreground text-sm">Local Storage Mode Active</p>
                      <p className="leading-relaxed">
                        Media assets will be stored directly inside the persistent container volume at{" "}
                        <code className="text-xs bg-background px-1.5 py-0.5 rounded border border-border font-mono text-foreground">
                          /app/public/media
                        </code>
                        . No external cloud credentials or bucket policies required.
                      </p>
                    </div>
                  )}

                  {/* When CLOUDFLARE R2: Show R2 specific inputs + help link */}
                  {form.storageProvider === "R2" && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/60">
                        <span>Configure your Cloudflare R2 bucket details and public access domain.</span>
                        <a
                          href="https://developers.cloudflare.com/r2/api/s3/tokens/"
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          Cloudflare R2 Documentation ↗
                        </a>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="font-semibold text-foreground">R2 Account ID</Label>
                          <Input
                            value={form.r2AccountId}
                            onChange={(e) => setForm({ ...form, r2AccountId: e.target.value })}
                            className="text-xs font-mono"
                            placeholder="e.g. 0123456789abcdef0123456789abcdef"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="font-semibold text-foreground">Bucket Name</Label>
                          <Input
                            value={form.r2BucketName}
                            onChange={(e) => setForm({ ...form, r2BucketName: e.target.value })}
                            className="text-xs font-mono"
                            placeholder="e.g. atelier-media-vault"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="font-semibold text-foreground">Public CDN URL</Label>
                        <Input
                          value={form.r2PublicUrl}
                          onChange={(e) => setForm({ ...form, r2PublicUrl: e.target.value })}
                          className="text-xs font-mono"
                          placeholder="e.g. https://media.yourdomain.com"
                        />
                      </div>
                    </div>
                  )}

                  {/* When AMAZON S3: Show S3 inputs + help link */}
                  {form.storageProvider === "S3" && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/60">
                        <span>Configure your Amazon Web Services S3 bucket details and access credentials.</span>
                        <a
                          href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html"
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          AWS S3 Documentation ↗
                        </a>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="font-semibold text-foreground">S3 Region</Label>
                          <Input
                            value={form.s3Region}
                            onChange={(e) => setForm({ ...form, s3Region: e.target.value })}
                            className="text-xs font-mono"
                            placeholder="e.g. ap-south-1, us-east-1"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="font-semibold text-foreground">Bucket Name</Label>
                          <Input
                            value={form.s3BucketName}
                            onChange={(e) => setForm({ ...form, s3BucketName: e.target.value })}
                            className="text-xs font-mono"
                            placeholder="e.g. archive-master-vault"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="font-semibold text-foreground">Custom Endpoint (Optional)</Label>
                        <Input
                          value={form.s3Endpoint}
                          onChange={(e) => setForm({ ...form, s3Endpoint: e.target.value })}
                          className="text-xs font-mono"
                          placeholder="e.g. https://s3.ap-south-1.amazonaws.com or MinIO endpoint"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="font-semibold text-foreground">Access Key ID</Label>
                          <Input
                            value={form.s3AccessKey}
                            onChange={(e) => setForm({ ...form, s3AccessKey: e.target.value })}
                            className="text-xs font-mono"
                            placeholder="e.g. AKIAIOSFODNN7EXAMPLE"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="font-semibold text-foreground">Secret Access Key</Label>
                          <Input
                            type="password"
                            value={form.s3SecretKey}
                            onChange={(e) => setForm({ ...form, s3SecretKey: e.target.value })}
                            className="text-xs font-mono"
                            placeholder="Enter secret access key"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="font-semibold text-foreground">Public CDN URL (Optional)</Label>
                        <Input
                          value={form.s3PublicUrl}
                          onChange={(e) => setForm({ ...form, s3PublicUrl: e.target.value })}
                          className="text-xs font-mono"
                          placeholder="e.g. https://cdn.yourdomain.com"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              )}

              {/* Sub-Tab 2: Google Workspace */}
              {activeStorageSubTab === "google-workspace" && (
              <Card className="border border-border/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      Google Workspace &amp; Cloud Services
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestGoogle}
                      disabled={testingGoogle}
                      className="text-xs font-semibold cursor-pointer"
                    >
                      {testingGoogle ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Globe className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Test Connection
                    </Button>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Connect Google Drive as an asset vault and Google Sheets to automatically sync CRM leads and visitor inquiries.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-xs">
                  {/* Enable Switch */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/60">
                    <div className="space-y-0.5">
                      <Label className="font-semibold text-sm text-foreground">Enable Google Workspace Integration</Label>
                      <p className="text-xs text-muted-foreground">
                        Activate Google Drive uploads and automated CRM lead syncing to Google Sheets.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={googleServicesConfig.enabled}
                        onChange={(e) =>
                          setGoogleServicesConfig({ ...googleServicesConfig, enabled: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/60">
                    <span>Configure your Google Cloud Project OAuth2 credentials (API Console).</span>
                    <a
                      href="https://developers.google.com/drive/api/guides/about-sdk"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      Google Drive SDK Setup Guide <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground" htmlFor="googleWorkspaceClientId">OAuth Client ID</Label>
                      <Input
                        id="googleWorkspaceClientId"
                        name="googleWorkspaceClientId"
                        autoComplete="off"
                        data-1p-ignore="true"
                        data-lpignore="true"
                        value={googleServicesConfig.clientId || ""}
                        onChange={(e) =>
                          setGoogleServicesConfig({ ...googleServicesConfig, clientId: e.target.value })
                        }
                        className="text-xs font-mono"
                        placeholder="e.g. 1234567890-abc.apps.googleusercontent.com"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground" htmlFor="googleWorkspaceClientSecret">OAuth Client Secret</Label>
                      <div className="relative">
                        <Input
                          id="googleWorkspaceClientSecret"
                          name="googleWorkspaceClientSecret"
                          autoComplete="new-password"
                          data-1p-ignore="true"
                          data-lpignore="true"
                          type={showGoogleSecret ? "text" : "password"}
                          value={googleServicesConfig.clientSecret || ""}
                          onChange={(e) =>
                            setGoogleServicesConfig({ ...googleServicesConfig, clientSecret: e.target.value })
                          }
                          className="text-xs font-mono pr-9"
                          placeholder="e.g. GOCSPX-xxxxxxxxxxxxxxxx"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showGoogleSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold text-foreground">OAuth2 Refresh Token</Label>
                    <Input
                      value={googleServicesConfig.refreshToken}
                      onChange={(e) =>
                        setGoogleServicesConfig({ ...googleServicesConfig, refreshToken: e.target.value })
                      }
                      className="text-xs font-mono"
                      placeholder="e.g. 1//04xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Obtained via Google OAuth Playground or CLI script with Drive &amp; Sheets scopes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/60">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Target Google Drive Folder ID</Label>
                      <Input
                        value={googleServicesConfig.driveFolderId || ""}
                        onChange={(e) =>
                          setGoogleServicesConfig({ ...googleServicesConfig, driveFolderId: e.target.value })
                        }
                        className="text-xs font-mono"
                        placeholder="e.g. 1a2b3c4d5e6f7g8h9_folder_id"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Extracted from your Google Drive folder URL (e.g. drive.google.com/drive/folders/&lt;ID&gt;).
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Lead Sync Google Sheet ID</Label>
                      <Input
                        value={googleServicesConfig.sheetId || ""}
                        onChange={(e) =>
                          setGoogleServicesConfig({ ...googleServicesConfig, sheetId: e.target.value })
                        }
                        className="text-xs font-mono"
                        placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Inbound inquiries and RSVP submissions will automatically append as new rows in this spreadsheet.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Sub-Tab 3: Nextcloud Storage */}
              {activeStorageSubTab === "nextcloud" && (
              <Card className="border border-border/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Server className="w-5 h-5 text-primary" />
                      Nextcloud WebDAV Sovereign Storage
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestNextcloud}
                      disabled={testingNextcloud}
                      className="text-xs font-semibold cursor-pointer"
                    >
                      {testingNextcloud ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Server className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Test Connection
                    </Button>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Store high-fidelity artwork assets and media vaults on your self-hosted or managed Nextcloud cloud infrastructure via WebDAV protocol.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-xs">
                  {/* Enable Switch */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/60">
                    <div className="space-y-0.5">
                      <Label className="font-semibold text-sm text-foreground">Enable Nextcloud WebDAV Storage</Label>
                      <p className="text-xs text-muted-foreground">
                        Route uploads and media vaults to your sovereign Nextcloud instance.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nextcloudConfig.enabled}
                        onChange={(e) =>
                          setNextcloudConfig({ ...nextcloudConfig, enabled: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Nextcloud Server URL</Label>
                      <Input
                        value={nextcloudConfig.serverUrl}
                        onChange={(e) =>
                          setNextcloudConfig({ ...nextcloudConfig, serverUrl: e.target.value })
                        }
                        className="text-xs font-mono"
                        placeholder="https://cloud.yourdomain.com"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground" htmlFor="nextcloudStorageUsername">Nextcloud Username</Label>
                      <Input
                        id="nextcloudStorageUsername"
                        name="nextcloudStorageUsername"
                        autoComplete="off"
                        data-1p-ignore="true"
                        data-lpignore="true"
                        value={nextcloudConfig.username}
                        onChange={(e) =>
                          setNextcloudConfig({ ...nextcloudConfig, username: e.target.value })
                        }
                        className="text-xs font-mono"
                        placeholder="e.g. admin@yourdomain.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground" htmlFor="nextcloudStoragePassword">App Password / Token</Label>
                      <div className="relative">
                        <Input
                          id="nextcloudStoragePassword"
                          name="nextcloudStoragePassword"
                          autoComplete="new-password"
                          data-1p-ignore="true"
                          data-lpignore="true"
                          type={showNextcloudPassword ? "text" : "password"}
                          value={nextcloudConfig.appPassword}
                          onChange={(e) =>
                            setNextcloudConfig({ ...nextcloudConfig, appPassword: e.target.value })
                          }
                          className="text-xs font-mono pr-9"
                          placeholder="e.g. xxxxx-xxxxx-xxxxx-xxxxx"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNextcloudPassword(!showNextcloudPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showNextcloudPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Generated in Nextcloud Settings &rarr; Security &rarr; Devices &amp; Client App Passwords.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Base Folder Path</Label>
                      <Input
                        value={nextcloudConfig.baseFolder || ""}
                        onChange={(e) =>
                          setNextcloudConfig({ ...nextcloudConfig, baseFolder: e.target.value })
                        }
                        className="text-xs font-mono"
                        placeholder="/Media-Vault"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Root folder in your Nextcloud account where assets will be organized (created automatically).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Sub-Tab 4: Manage Media Vault */}
              {activeStorageSubTab === "media-vault" && (
                <MediaVaultManager />
              )}
            </TabsContent>

            {/* Tab 4: Dynamic Footer Configuration */}
            <TabsContent value="footer">
              <Card className="border border-border/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Global Footer & Legal Notice Builder</CardTitle>
                  <CardDescription className="text-xs">
                    Customize website brand bio, studio contact channels, copyright notices, and legal links.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-xs">
                  {/* Brand Bio */}
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-foreground">Brand Statement / Bio</Label>
                    <Textarea
                      value={footerConfig.aboutText}
                      onChange={(e) => setFooterConfig({ ...footerConfig, aboutText: e.target.value })}
                      rows={3}
                      className="text-xs leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Studio Contact Email</Label>
                      <Input
                        value={footerConfig.contactEmail}
                        onChange={(e) => setFooterConfig({ ...footerConfig, contactEmail: e.target.value })}
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Studio Phone Number</Label>
                      <Input
                        value={footerConfig.contactPhone}
                        onChange={(e) => setFooterConfig({ ...footerConfig, contactPhone: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Copyright Notice</Label>
                      <Input
                        value={footerConfig.copyrightText}
                        onChange={(e) => setFooterConfig({ ...footerConfig, copyrightText: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Legal Links Manager */}
                  <div className="space-y-3 pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">Legal & Compliance Links</h4>
                        <p className="text-[11px] text-muted-foreground">
                          Manage links appearing in the bottom copyright strip across all public pages.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFooterConfig({
                            ...footerConfig,
                            legalLinks: [
                              ...footerConfig.legalLinks,
                              { label: "New Legal Notice", url: "/legal", isVisible: true },
                            ],
                          })
                        }
                        className="text-xs"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Link
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {footerConfig.legalLinks.map((link, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2.5 rounded-md border border-border/80 bg-card/60"
                        >
                          <Input
                            value={link.label}
                            onChange={(e) => {
                              const updated = [...footerConfig.legalLinks];
                              updated[idx].label = e.target.value;
                              setFooterConfig({ ...footerConfig, legalLinks: updated });
                            }}
                            placeholder="Link Label"
                            className="text-xs flex-1"
                          />
                          <Input
                            value={link.url}
                            onChange={(e) => {
                              const updated = [...footerConfig.legalLinks];
                              updated[idx].url = e.target.value;
                              setFooterConfig({ ...footerConfig, legalLinks: updated });
                            }}
                            placeholder="/privacy"
                            className="text-xs font-mono flex-1"
                          />
                          <label className="flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={link.isVisible}
                              onChange={(e) => {
                                const updated = [...footerConfig.legalLinks];
                                updated[idx].isVisible = e.target.checked;
                                setFooterConfig({ ...footerConfig, legalLinks: updated });
                              }}
                              className="rounded"
                            />
                            Visible
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              const updated = footerConfig.legalLinks.filter((_, i) => i !== idx);
                              setFooterConfig({ ...footerConfig, legalLinks: updated });
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live Footer Preview Box */}
                  <div className="p-4 rounded-lg border border-primary/30 bg-card space-y-2">
                    <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                      Live Preview
                    </span>
                    <div className="p-4 rounded bg-background border border-border/60 text-xs space-y-2">
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {footerConfig.aboutText}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                        <span>{footerConfig.copyrightText}</span>
                        <div className="flex gap-3">
                          {footerConfig.legalLinks
                            .filter((l) => l.isVisible)
                            .map((l) => (
                              <span key={l.label} className="text-primary hover:underline">
                                {l.label}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: E-Mail Configuration Hub (SMTP & Gmail Provider Settings + Mail Notification Templates) */}
            <TabsContent value="email-hub" className="space-y-5">
              {/* Sub-Navigation Bar */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-muted/60 border border-border/80">
                <button
                  type="button"
                  onClick={() => setActiveEmailSubTab("smtp")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeEmailSubTab === "smtp"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/70"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  1. SMTP &amp; Gmail Provider Settings
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEmailSubTab("templates")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeEmailSubTab === "templates"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/70"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  2. Mail Notification Templates
                </button>
              </div>

              {activeEmailSubTab === "smtp" && (
              <Card className="border border-border/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Gmail & Outbound SMTP Dispatcher</CardTitle>
                  <CardDescription className="text-xs">
                    Configure automated outbound email delivery for exhibition registrations, collector leads, and contact inquiries.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-xs">
                  {/* Google App Password Notice */}
                  <div className="p-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 space-y-1">
                    <p className="font-semibold text-xs flex items-center gap-1.5">
                      <Mail className="w-4 h-4" /> Gmail App Password Integration Guide
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      For Gmail accounts with 2-Step Verification enabled, generate a 16-character App Password at{" "}
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-mono"
                      >
                        myaccount.google.com/apppasswords
                      </a>{" "}
                      and paste it into the password field below.
                    </p>
                  </div>

                  {/* Enable Outbound Email Services Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border/70 bg-card/60">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-primary" /> Enable Outbound Email Delivery
                        </Label>
                        <Badge
                          variant={emailConfig.isEnabled ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {emailConfig.isEnabled ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        When enabled, all inbound inquiries, exhibition RSVPs, and 6-digit visitor verification OTP challenges will be dispatched via the configured SMTP server.
                      </p>
                    </div>
                    <Switch
                      checked={emailConfig.isEnabled}
                      onCheckedChange={(checked) => setEmailConfig({ ...emailConfig, isEnabled: checked })}
                    />
                  </div>

                  {/* Dedicated Admin Alert Recipient Email */}
                  <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-amber-600" /> Admin Alert Recipient Email
                      </Label>
                      <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-800 dark:text-amber-300">
                        Decoupled from Auth
                      </Badge>
                    </div>
                    <Input
                      value={form.adminAlertEmail}
                      onChange={(e) => setForm({ ...form, adminAlertEmail: e.target.value })}
                      placeholder="alerts@savazar.com"
                      className="text-xs font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      All inbound website form inquiries, exhibition RSVPs, and private commission requests are dispatched strictly to this verified inbox, never exposing or defaulting to console super-admin login emails.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Email Provider</Label>
                      <Select
                        value={emailConfig.provider}
                        onValueChange={(val: "gmail" | "smtp") =>
                          setEmailConfig({
                            ...emailConfig,
                            provider: val,
                            smtpHost: val === "gmail" ? "smtp.gmail.com" : emailConfig.smtpHost,
                            smtpPort: val === "gmail" ? 587 : emailConfig.smtpPort,
                          })
                        }
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gmail">Google Gmail (App Password)</SelectItem>
                          <SelectItem value="smtp">Custom SMTP Server</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">SMTP Host</Label>
                      <Input
                        value={emailConfig.smtpHost}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                        placeholder="smtp.gmail.com"
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Port</Label>
                      <Input
                        type="number"
                        value={emailConfig.smtpPort}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: parseInt(e.target.value) || 587 })}
                        placeholder="587"
                        className="text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Username / Email *</Label>
                      <Input
                        value={emailConfig.smtpUser}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
                        placeholder="artist@gmail.com"
                        className="text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold text-foreground">Password / App Password *</Label>
                        <button
                          type="button"
                          onClick={() => setShowEmailPassword(!showEmailPassword)}
                          className="text-[10px] text-primary hover:underline"
                        >
                          {showEmailPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      <Input
                        type={showEmailPassword ? "text" : "password"}
                        value={emailConfig.smtpPassword}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })}
                        placeholder="••••••••••••••••"
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">From Address</Label>
                      <Input
                        value={emailConfig.fromEmail}
                        onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                        placeholder="contact@savazar.com"
                        className="text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">From Display Name</Label>
                      <Input
                        value={emailConfig.fromName}
                        onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                        placeholder="SavazAI Atelier"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Dynamic Outbound Email Header & Footer Branding */}
                  <div className="p-4 rounded-lg border border-border/80 bg-card/60 space-y-4">
                    <h4 className="font-semibold text-foreground flex items-center gap-1.5 text-xs uppercase tracking-wider text-amber-900 dark:text-amber-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Dynamic Email Branding &amp; Design Tokens
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="font-semibold text-foreground">Email Header Title</Label>
                        <Input
                          value={form.emailHeaderTitle}
                          onChange={(e) => setForm({ ...form, emailHeaderTitle: e.target.value })}
                          placeholder={form.siteName || "SavazAI Platform"}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-semibold text-foreground">Email Header Subtitle</Label>
                        <Input
                          value={form.emailHeaderSubtitle}
                          onChange={(e) => setForm({ ...form, emailHeaderSubtitle: e.target.value })}
                          placeholder={form.archiveSubtitle || "Digital Atelier & Cultural Archive"}
                          className="text-xs"
                        />
                      </div>
                    </div>
                    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-muted-foreground leading-relaxed">
                        <strong className="text-foreground font-medium">Brand Logo Single Source of Truth:</strong> Outbound emails automatically resolve and embed the official brand logo uploaded under the <strong className="text-foreground font-medium">General</strong> tab with absolute HTTPS URL formatting, ensuring high-fidelity rendering across all desktop and mobile mail clients (Gmail, Apple Mail, Outlook).
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Email Footer Disclaimer / Notice</Label>
                      <Textarea
                        value={form.emailFooterText}
                        onChange={(e) => setForm({ ...form, emailFooterText: e.target.value })}
                        placeholder="Inbound atelier inquiry and archival correspondence."
                        rows={2}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Connectivity Testing Box */}
                  <div className="p-4 rounded-lg border border-border/80 bg-secondary/30 space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                      <Send className="w-4 h-4 text-primary" />
                      Test Outbound Connectivity
                    </h4>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <Input
                        value={testEmailRecipient}
                        onChange={(e) => setTestEmailRecipient(e.target.value)}
                        placeholder="Test recipient email (defaults to admin alert email)"
                        className="text-xs flex-1 font-mono"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={testingEmail}
                        onClick={handleTestEmail}
                        className="text-xs shrink-0 cursor-pointer"
                      >
                        {testingEmail ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5 mr-1.5 text-primary" />
                        )}
                        Send Test Email
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Sub-Tab 2: Mail Notification Templates */}
              {activeEmailSubTab === "templates" && (
                <MailConfigStudio />
              )}
            </TabsContent>

            {/* Tab 6: Universal Multi-Provider AI Assistant */}
            <TabsContent value="ai">
              <Card className="border border-border/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Universal Multi-Provider AI Assistant</CardTitle>
                  <CardDescription className="text-xs">
                    Choose from 7 state-of-the-art AI engines to generate, refine, and translate sacred art provenance, blog chronicles, and event narratives.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Active AI Provider</Label>
                      <Select
                        value={aiConfig.activeProvider}
                        onValueChange={(val: typeof aiConfig.activeProvider) => {
                          let defaultModel = "gemini-1.5-pro";
                          let baseUrl = "";
                          if (val === "openai") defaultModel = "gpt-4o";
                          if (val === "anthropic") defaultModel = "claude-3-5-sonnet-20241022";
                          if (val === "openrouter") {
                            defaultModel = "anthropic/claude-3.5-sonnet";
                            baseUrl = "https://openrouter.ai/api/v1";
                          }
                          if (val === "grok") {
                            defaultModel = "grok-2-latest";
                            baseUrl = "https://api.x.ai/v1";
                          }
                          if (val === "groq") {
                            defaultModel = "llama-3.3-70b-versatile";
                            baseUrl = "https://api.groq.com/openai/v1";
                          }
                          if (val === "ollama") {
                            defaultModel = "llama3";
                            baseUrl = "http://localhost:11434";
                          }

                          setAiConfig({
                            ...aiConfig,
                            activeProvider: val,
                            defaultModel,
                            baseUrl,
                          });
                        }}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini">Google Gemini (Recommended)</SelectItem>
                          <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                          <SelectItem value="anthropic">Anthropic Claude (3.5 Sonnet)</SelectItem>
                          <SelectItem value="groq">Groq (Ultra-fast Llama 3.3)</SelectItem>
                          <SelectItem value="openrouter">OpenRouter (Unified Multi-Model)</SelectItem>
                          <SelectItem value="grok">xAI Grok</SelectItem>
                          <SelectItem value="ollama">Ollama (Self-hosted / Local)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold text-foreground">API Key *</Label>
                        <button
                          type="button"
                          onClick={() => setShowAiKey(!showAiKey)}
                          className="text-[10px] text-primary hover:underline"
                        >
                          {showAiKey ? "Hide" : "Show"}
                        </button>
                      </div>
                      <Input
                        type={showAiKey ? "text" : "password"}
                        value={aiConfig.apiKey}
                        onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                        placeholder={aiConfig.activeProvider === "ollama" ? "Not required for Ollama" : "sk-..."}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Model Identifier</Label>
                      <Input
                        value={aiConfig.defaultModel}
                        onChange={(e) => setAiConfig({ ...aiConfig, defaultModel: e.target.value })}
                        placeholder="gemini-1.5-pro, gpt-4o, claude-3-5-sonnet"
                        className="text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">Base URL (For Ollama/OpenRouter)</Label>
                      <Input
                        value={aiConfig.baseUrl}
                        onChange={(e) => setAiConfig({ ...aiConfig, baseUrl: e.target.value })}
                        placeholder="http://localhost:11434"
                        className="text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground">
                        Temperature: {aiConfig.temperature ?? 0.7}
                      </Label>
                      <Input
                        type="range"
                        min="0.0"
                        max="1.0"
                        step="0.05"
                        value={aiConfig.temperature ?? 0.7}
                        onChange={(e) => setAiConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* AI Connection Test */}
                  <div className="p-4 rounded-lg border border-border/80 bg-secondary/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                        <Wand2 className="w-4 h-4 text-primary" />
                        Test AI Provider Connectivity
                      </h4>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={testingAi}
                        onClick={handleTestAi}
                        className="text-xs cursor-pointer"
                      >
                        {testingAi ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
                        )}
                        Run Connectivity Test
                      </Button>
                    </div>

                    <Input
                      value={aiTestPrompt}
                      onChange={(e) => setAiTestPrompt(e.target.value)}
                      placeholder="Prompt to test"
                      className="text-xs font-serif"
                    />

                    {aiTestResult && (
                      <div className="p-3 rounded bg-card border border-primary/20 text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                        {aiTestResult}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 7: Social Channels */}
            <TabsContent value="socials">
              <Card className="border border-border/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Social Media &amp; Public Channels</CardTitle>
                  <CardDescription className="text-xs">
                    Link external public channels (Instagram, YouTube, Facebook, Pinterest, LinkedIn, TikTok) and custom social/cultural platforms to display in headers, footers, contact cards, and search graph metadata.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground flex items-center gap-1.5">
                        <SocialPlatformIcon icon="instagram" className="w-3.5 h-3.5 text-primary" />
                        Instagram Handle / URL
                      </Label>
                      <Input
                        value={form.instagramUrl}
                        onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
                        placeholder="https://instagram.com/savazar"
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground flex items-center gap-1.5">
                        <SocialPlatformIcon icon="youtube" className="w-3.5 h-3.5 text-primary" />
                        YouTube Channel URL
                      </Label>
                      <Input
                        value={form.youtubeUrl}
                        onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                        placeholder="https://youtube.com/@savazar"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground flex items-center gap-1.5">
                        <SocialPlatformIcon icon="facebook" className="w-3.5 h-3.5 text-primary" />
                        Facebook Page URL
                      </Label>
                      <Input
                        value={form.facebookUrl}
                        onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
                        placeholder="https://facebook.com/savazar"
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground flex items-center gap-1.5">
                        <SocialPlatformIcon icon="pinterest" className="w-3.5 h-3.5 text-primary" />
                        Pinterest Portfolio URL
                      </Label>
                      <Input
                        value={form.pinterestUrl}
                        onChange={(e) => setForm({ ...form, pinterestUrl: e.target.value })}
                        placeholder="https://pinterest.com/savazar"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground flex items-center gap-1.5">
                        <SocialPlatformIcon icon="linkedin" className="w-3.5 h-3.5 text-primary" />
                        LinkedIn Profile / Company URL
                      </Label>
                      <Input
                        value={form.linkedinUrl}
                        onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                        placeholder="https://linkedin.com/in/savazar"
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-foreground flex items-center gap-1.5">
                        <SocialPlatformIcon icon="tiktok" className="w-3.5 h-3.5 text-primary" />
                        TikTok Profile URL
                      </Label>
                      <Input
                        value={form.tiktokUrl}
                        onChange={(e) => setForm({ ...form, tiktokUrl: e.target.value })}
                        placeholder="https://tiktok.com/@savazar"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Dynamic Custom Social Links */}
                  <div className="pt-5 border-t border-border/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-serif font-semibold text-sm text-foreground">
                          Custom Social &amp; Cultural Platform Links
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Add Threads, Bluesky, X/Twitter, Behance, ArtStation, WhatsApp, or custom cultural archives with selectable vector icons.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCustomSocialLinks([
                            ...customSocialLinks,
                            { label: "", url: "", icon: "globe" },
                          ])
                        }
                        className="text-xs gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Custom Link
                      </Button>
                    </div>

                    {customSocialLinks.length === 0 ? (
                      <div className="p-4 rounded-lg border border-dashed border-border bg-muted/20 text-center text-muted-foreground text-xs">
                        No custom social links configured yet. Click &ldquo;Add Custom Link&rdquo; to add additional platforms.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {customSocialLinks.map((item, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-lg border border-border bg-card/60"
                          >
                            <div className="sm:col-span-3">
                              <Label className="text-[10px] font-mono uppercase text-muted-foreground mb-1 block">
                                Icon
                              </Label>
                              <Select
                                value={item.icon || "globe"}
                                onValueChange={(val: CustomSocialLink["icon"]) => {
                                  const next = [...customSocialLinks];
                                  next[idx] = { ...next[idx], icon: val };
                                  setCustomSocialLinks(next);
                                }}
                              >
                                <SelectTrigger className="text-xs h-8">
                                  <div className="flex items-center gap-2">
                                    <SocialPlatformIcon icon={item.icon || "globe"} className="w-3.5 h-3.5 text-primary" />
                                    <SelectValue placeholder="Icon" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  {CUSTOM_SOCIAL_ICON_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                      <span className="inline-flex items-center gap-2">
                                        <SocialPlatformIcon icon={opt.value} className="w-3.5 h-3.5" />
                                        {opt.label}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="sm:col-span-3">
                              <Label className="text-[10px] font-mono uppercase text-muted-foreground mb-1 block">
                                Platform Label
                              </Label>
                              <Input
                                value={item.label}
                                onChange={(e) => {
                                  const next = [...customSocialLinks];
                                  next[idx] = { ...next[idx], label: e.target.value };
                                  setCustomSocialLinks(next);
                                }}
                                placeholder="e.g. Behance, Threads"
                                className="text-xs h-8"
                              />
                            </div>

                            <div className="sm:col-span-5">
                              <Label className="text-[10px] font-mono uppercase text-muted-foreground mb-1 block">
                                Destination URL
                              </Label>
                              <Input
                                value={item.url}
                                onChange={(e) => {
                                  const next = [...customSocialLinks];
                                  next[idx] = { ...next[idx], url: e.target.value };
                                  setCustomSocialLinks(next);
                                }}
                                placeholder="https://..."
                                className="text-xs font-mono h-8"
                              />
                            </div>

                            <div className="sm:col-span-1 flex justify-end pt-4 sm:pt-4">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setCustomSocialLinks(customSocialLinks.filter((_, i) => i !== idx))
                                }
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                                title="Remove custom link"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sub-Tab 2 of App Personalization: Theme & Design Studio */}
            {activeTab === "personalization" && activePersonalizationSubTab === "theme" && (
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="border-b border-border/50 pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Palette className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                        Unified Theme &amp; Design System Atelier
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        Configure global typography, structural border thickness, and color palettes applied universally across both the public visitor application and the Admin Portal.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetTheme}
                        disabled={savingTheme}
                        className="text-xs border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {savingTheme ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Reset to System Defaults
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSaveTheme}
                        disabled={savingTheme}
                        size="sm"
                        className="text-xs bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer"
                      >
                        {savingTheme ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Save Theme Configuration
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Sub-Tab Navigation */}
                  <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 rounded-xl w-fit mb-6">
                    <button
                      type="button"
                      onClick={() => setActiveThemeSubTab("common")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeThemeSubTab === "common"
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                          : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" /> Common &amp; Typography
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveThemeSubTab("light")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeThemeSubTab === "light"
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                          : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" /> Light Mode Palette
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveThemeSubTab("dark")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeThemeSubTab === "dark"
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                          : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" /> Dark Mode Palette
                    </button>
                  </div>

                  {/* Sub-Tab 1: Common & Typography */}
                  {activeThemeSubTab === "common" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Heading Font Family */}
                        <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Type className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                            Primary Headings Font Family
                          </Label>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Applies to h1-h6 display titles, hero banners, and catalog covers.
                          </p>
                          <select
                            value={themeConfig.common.fontHeading}
                            onChange={(e) =>
                              setThemeConfig((prev) => ({
                                ...prev,
                                common: { ...prev.common, fontHeading: e.target.value },
                              }))
                            }
                            className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 cursor-pointer outline-none"
                          >
                            {HEADING_FONT_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Body Font Family */}
                        <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Type className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                            Primary Body Font Family
                          </Label>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Applies to paragraphs, card descriptions, data tables, and forms.
                          </p>
                          <select
                            value={themeConfig.common.fontBody}
                            onChange={(e) =>
                              setThemeConfig((prev) => ({
                                ...prev,
                                common: { ...prev.common, fontBody: e.target.value },
                              }))
                            }
                            className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 cursor-pointer outline-none"
                          >
                            {BODY_FONT_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Global Border Thickness */}
                        <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Global Border Thickness
                          </Label>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Governs container lines, cards, inputs, dialogs, and table borders.
                          </p>
                          <select
                            value={themeConfig.common.borderWidth}
                            onChange={(e) =>
                              setThemeConfig((prev) => ({
                                ...prev,
                                common: { ...prev.common, borderWidth: e.target.value },
                              }))
                            }
                            className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 cursor-pointer outline-none"
                          >
                            {BORDER_WIDTH_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Global Border Radius */}
                        <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Global Corner Radius (--radius)
                          </Label>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Architectural curvature for cards, buttons, modals, and input fields.
                          </p>
                          <select
                            value={themeConfig.common.borderRadius}
                            onChange={(e) =>
                              setThemeConfig((prev) => ({
                                ...prev,
                                common: { ...prev.common, borderRadius: e.target.value },
                              }))
                            }
                            className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 cursor-pointer outline-none"
                          >
                            {BORDER_RADIUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Base Font Size */}
                        <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Base Font Size
                          </Label>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Universal body typography baseline scaling for readability.
                          </p>
                          <select
                            value={themeConfig.common.baseFontSize}
                            onChange={(e) =>
                              setThemeConfig((prev) => ({
                                ...prev,
                                common: { ...prev.common, baseFontSize: e.target.value },
                              }))
                            }
                            className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 cursor-pointer outline-none"
                          >
                            {FONT_SIZE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Line Height */}
                        <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                          <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Base Line Height
                          </Label>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Vertical line spacing ratio for curatorial essays and commentary.
                          </p>
                          <select
                            value={themeConfig.common.lineHeight}
                            onChange={(e) =>
                              setThemeConfig((prev) => ({
                                ...prev,
                                common: { ...prev.common, lineHeight: e.target.value },
                              }))
                            }
                            className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 cursor-pointer outline-none"
                          >
                            {LINE_HEIGHT_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub-Tab 2: Light Mode Palette */}
                  {activeThemeSubTab === "light" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {PALETTE_TOKEN_DEFINITIONS.map((def) => (
                          <div
                            key={`light-${def.key}`}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                          >
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={`light-${def.key}`}
                                className="text-xs font-bold text-slate-900 dark:text-slate-100 block"
                              >
                                {def.label}
                              </label>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                                {def.description}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                id={`light-${def.key}`}
                                type="color"
                                value={themeConfig.light[def.key]}
                                onChange={(e) =>
                                  setThemeConfig((prev) => ({
                                    ...prev,
                                    light: { ...prev.light, [def.key]: e.target.value },
                                  }))
                                }
                                className="h-8 w-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white"
                                title={`${def.label} picker`}
                              />
                              <input
                                type="text"
                                value={themeConfig.light[def.key]}
                                onChange={(e) =>
                                  setThemeConfig((prev) => ({
                                    ...prev,
                                    light: { ...prev.light, [def.key]: e.target.value },
                                  }))
                                }
                                className="w-24 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                placeholder="#FFFFFF"
                                maxLength={25}
                              />
                            </div>
                          </div>
                        ))}

                        {/* Dedicated Form Design Tokens */}
                        <div className="col-span-full pt-4 mt-2 border-t border-slate-200 dark:border-slate-800">
                          <div className="mb-3">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              Form & Input Design Tokens (Light Mode)
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Controls styling for curatorial inquiry forms, contact blocks, input boxes, and dropdown triggers.
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {FORM_TOKEN_DEFINITIONS.map((def) => (
                              <div
                                key={`light-${def.key}`}
                                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                              >
                                <div className="flex-1 min-w-0">
                                  <label
                                    htmlFor={`light-${def.key}`}
                                    className="text-xs font-bold text-slate-900 dark:text-slate-100 block"
                                  >
                                    {def.label}
                                  </label>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                                    {def.description}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <input
                                    id={`light-${def.key}`}
                                    type="color"
                                    value={themeConfig.light[def.key] || "#000000"}
                                    onChange={(e) =>
                                      setThemeConfig((prev) => ({
                                        ...prev,
                                        light: { ...prev.light, [def.key]: e.target.value },
                                      }))
                                    }
                                    className="h-8 w-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white"
                                    title={`${def.label} picker`}
                                  />
                                  <input
                                    type="text"
                                    value={themeConfig.light[def.key] || ""}
                                    onChange={(e) =>
                                      setThemeConfig((prev) => ({
                                        ...prev,
                                        light: { ...prev.light, [def.key]: e.target.value },
                                      }))
                                    }
                                    className="w-24 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                    placeholder="#FFFFFF"
                                    maxLength={25}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub-Tab 3: Dark Mode Palette */}
                  {activeThemeSubTab === "dark" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {PALETTE_TOKEN_DEFINITIONS.map((def) => (
                          <div
                            key={`dark-${def.key}`}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                          >
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={`dark-${def.key}`}
                                className="text-xs font-bold text-slate-900 dark:text-slate-100 block"
                              >
                                {def.label}
                              </label>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                                {def.description}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                id={`dark-${def.key}`}
                                type="color"
                                value={themeConfig.dark[def.key]}
                                onChange={(e) =>
                                  setThemeConfig((prev) => ({
                                    ...prev,
                                    dark: { ...prev.dark, [def.key]: e.target.value },
                                  }))
                                }
                                className="h-8 w-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white"
                                title={`${def.label} dark picker`}
                              />
                              <input
                                type="text"
                                value={themeConfig.dark[def.key]}
                                onChange={(e) =>
                                  setThemeConfig((prev) => ({
                                    ...prev,
                                    dark: { ...prev.dark, [def.key]: e.target.value },
                                  }))
                                }
                                className="w-24 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                placeholder="#0B0F17"
                                maxLength={25}
                              />
                            </div>
                          </div>
                        ))}

                        {/* Dedicated Form Design Tokens */}
                        <div className="col-span-full pt-4 mt-2 border-t border-slate-200 dark:border-slate-800">
                          <div className="mb-3">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              Form & Input Design Tokens (Dark Mode)
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Controls styling for curatorial inquiry forms, contact blocks, input boxes, and dropdown triggers.
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {FORM_TOKEN_DEFINITIONS.map((def) => (
                              <div
                                key={`dark-${def.key}`}
                                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                              >
                                <div className="flex-1 min-w-0">
                                  <label
                                    htmlFor={`dark-${def.key}`}
                                    className="text-xs font-bold text-slate-900 dark:text-slate-100 block"
                                  >
                                    {def.label}
                                  </label>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                                    {def.description}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <input
                                    id={`dark-${def.key}`}
                                    type="color"
                                    value={themeConfig.dark[def.key] || "#000000"}
                                    onChange={(e) =>
                                      setThemeConfig((prev) => ({
                                        ...prev,
                                        dark: { ...prev.dark, [def.key]: e.target.value },
                                      }))
                                    }
                                    className="h-8 w-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white"
                                    title={`${def.label} dark picker`}
                                  />
                                  <input
                                    type="text"
                                    value={themeConfig.dark[def.key] || ""}
                                    onChange={(e) =>
                                      setThemeConfig((prev) => ({
                                        ...prev,
                                        dark: { ...prev.dark, [def.key]: e.target.value },
                                      }))
                                    }
                                    className="w-24 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                    placeholder="#0B0F17"
                                    maxLength={25}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interactive Live Preview Sandbox */}
                  <div className="mt-8 space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        🔍 Interactive Live Preview Sandbox
                      </h3>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        Font: {themeConfig.common.fontHeading} / {themeConfig.common.fontBody} | Border: {themeConfig.common.borderWidth} | Radius: {themeConfig.common.borderRadius}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Light Mode Preview Card */}
                      <div
                        className="p-5 space-y-4 border transition-all"
                        style={{
                          backgroundColor: themeConfig.light.canvasBg,
                          borderColor: themeConfig.light.borderColor,
                          borderWidth: themeConfig.common.borderWidth,
                          borderRadius: themeConfig.common.borderRadius,
                        }}
                      >
                        <div
                          className="text-xs font-bold uppercase tracking-widest"
                          style={{
                            color: themeConfig.light.btnPrimaryBg,
                            fontFamily: `'${themeConfig.common.fontBody}', sans-serif`,
                          }}
                        >
                          ☀️ Light Mode Preview
                        </div>
                        <div
                          className="p-4 space-y-3 border transition-all"
                          style={{
                            backgroundColor: themeConfig.light.cardBg,
                            borderColor: themeConfig.light.borderColor,
                            borderWidth: themeConfig.common.borderWidth,
                            borderRadius: themeConfig.common.borderRadius,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border transition-all"
                              style={{
                                backgroundColor: themeConfig.light.badgeBg,
                                color: themeConfig.light.badgeText,
                                borderColor: themeConfig.light.badgeBorder,
                              }}
                            >
                              ✨ Archival Master Record
                            </span>
                          </div>
                          <h4
                            className="text-base font-bold"
                            style={{
                              color: themeConfig.light.headingColor,
                              fontFamily: `'${themeConfig.common.fontHeading}', Georgia, serif`,
                            }}
                          >
                            SavazAI WebApps — Digital Atelier
                          </h4>
                          <p
                            style={{
                              color: themeConfig.light.bodyColor,
                              fontFamily: `'${themeConfig.common.fontBody}', sans-serif`,
                              fontSize: themeConfig.common.baseFontSize,
                              lineHeight: themeConfig.common.lineHeight,
                            }}
                          >
                            High-fidelity cultural archive and museum-grade digital atelier, paired with spatial 3D exhibition corridors and physical placard automation.
                          </p>
                          <p
                            className="text-xs"
                            style={{
                              color: themeConfig.light.mutedColor,
                              fontFamily: `'${themeConfig.common.fontBody}', sans-serif`,
                            }}
                          >
                            Catalog ref: #SZ-2026-ARCHIVE • 48 Masterworks Curated
                          </p>

                          {/* Pills */}
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <span
                              className="text-xs px-2.5 py-1 font-bold shadow-xs border transition-all"
                              style={{
                                backgroundColor: themeConfig.light.activePillBg,
                                color: themeConfig.light.activePillText,
                                borderColor: themeConfig.light.activePillBg,
                                borderRadius: themeConfig.common.borderRadius,
                              }}
                            >
                              Selected Period
                            </span>
                            <span
                              className="text-xs px-2.5 py-1 font-medium border transition-all"
                              style={{
                                backgroundColor: themeConfig.light.cardBg,
                                color: themeConfig.light.bodyColor,
                                borderColor: themeConfig.light.borderColor,
                                borderWidth: themeConfig.common.borderWidth,
                                borderRadius: themeConfig.common.borderRadius,
                              }}
                            >
                              Classical Temple Murals
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              type="button"
                              className="text-xs font-semibold px-3 py-1.5 shadow-sm transition-all"
                              style={{
                                backgroundColor: themeConfig.light.btnPrimaryBg,
                                color: themeConfig.light.btnPrimaryText,
                                borderRadius: themeConfig.common.borderRadius,
                              }}
                            >
                              Commission Artwork →
                            </button>
                            <button
                              type="button"
                              className="text-xs font-semibold px-3 py-1.5 border transition-all"
                              style={{
                                backgroundColor: themeConfig.light.btnSecondaryBg,
                                color: themeConfig.light.btnSecondaryText,
                                borderColor: themeConfig.light.borderColor,
                                borderWidth: themeConfig.common.borderWidth,
                                borderRadius: themeConfig.common.borderRadius,
                              }}
                            >
                              View Catalog
                            </button>
                          </div>

                          {/* Live Form Simulation */}
                          <div
                            className="p-4 space-y-2.5 border transition-all mt-4"
                            style={{
                              backgroundColor: themeConfig.light.formCardBg,
                              borderColor: themeConfig.light.formInputBorderColor,
                              borderWidth: themeConfig.common.borderWidth,
                              borderRadius: themeConfig.common.borderRadius,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className="text-[10px] font-mono uppercase tracking-widest font-bold"
                                style={{ color: themeConfig.light.formSubmitBtnBg }}
                              >
                                Curatorial Inquiry Form
                              </span>
                            </div>
                            <div>
                              <label
                                className="text-[11px] font-semibold block mb-1"
                                style={{ color: themeConfig.light.formLabelColor }}
                              >
                                Full Name *
                              </label>
                              <div
                                className="px-2.5 py-1.5 text-xs rounded border flex items-center justify-between"
                                style={{
                                  backgroundColor: themeConfig.light.formInputBg,
                                  color: themeConfig.light.formInputText,
                                  borderColor: themeConfig.light.formInputBorderColor,
                                  borderWidth: themeConfig.common.borderWidth,
                                  borderRadius: themeConfig.common.borderRadius,
                                }}
                              >
                                <span>Smt. Gayatri Iyer</span>
                              </div>
                            </div>
                            <div>
                              <label
                                className="text-[11px] font-semibold block mb-1"
                                style={{ color: themeConfig.light.formLabelColor }}
                              >
                                Inquiry Type
                              </label>
                              <div
                                className="px-2.5 py-1.5 text-xs rounded border flex items-center justify-between"
                                style={{
                                  backgroundColor: themeConfig.light.formInputBg,
                                  color: themeConfig.light.formPlaceholderColor,
                                  borderColor: themeConfig.light.formInputBorderColor,
                                  borderWidth: themeConfig.common.borderWidth,
                                  borderRadius: themeConfig.common.borderRadius,
                                }}
                              >
                                <span>Select an option</span>
                                <span className="opacity-50 text-[10px]">▼</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="w-full py-2 text-xs font-bold shadow-sm transition-all"
                              style={{
                                backgroundColor: themeConfig.light.formSubmitBtnBg,
                                color: themeConfig.light.formSubmitBtnText,
                                borderRadius: themeConfig.common.borderRadius,
                              }}
                            >
                              Submit Inquiry
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Dark Mode Preview Card */}
                      <div
                        className="p-5 space-y-4 border transition-all"
                        style={{
                          backgroundColor: themeConfig.dark.canvasBg,
                          borderColor: themeConfig.dark.borderColor,
                          borderWidth: themeConfig.common.borderWidth,
                          borderRadius: themeConfig.common.borderRadius,
                        }}
                      >
                        <div
                          className="text-xs font-bold uppercase tracking-widest"
                          style={{
                            color: themeConfig.dark.btnPrimaryBg,
                            fontFamily: `'${themeConfig.common.fontBody}', sans-serif`,
                          }}
                        >
                          🌙 Dark Mode Preview
                        </div>
                        <div
                          className="p-4 space-y-3 border transition-all"
                          style={{
                            backgroundColor: themeConfig.dark.cardBg,
                            borderColor: themeConfig.dark.borderColor,
                            borderWidth: themeConfig.common.borderWidth,
                            borderRadius: themeConfig.common.borderRadius,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border transition-all"
                              style={{
                                backgroundColor: themeConfig.dark.badgeBg,
                                color: themeConfig.dark.badgeText,
                                borderColor: themeConfig.dark.badgeBorder,
                              }}
                            >
                              ✨ Archival Master Record
                            </span>
                          </div>
                          <h4
                            className="text-base font-bold"
                            style={{
                              color: themeConfig.dark.headingColor,
                              fontFamily: `'${themeConfig.common.fontHeading}', Georgia, serif`,
                            }}
                          >
                            SavazAI WebApps — Digital Atelier
                          </h4>
                          <p
                            style={{
                              color: themeConfig.dark.bodyColor,
                              fontFamily: `'${themeConfig.common.fontBody}', sans-serif`,
                              fontSize: themeConfig.common.baseFontSize,
                              lineHeight: themeConfig.common.lineHeight,
                            }}
                          >
                            High-fidelity cultural archive and museum-grade digital atelier, paired with spatial 3D exhibition corridors and physical placard automation.
                          </p>
                          <p
                            className="text-xs"
                            style={{
                              color: themeConfig.dark.mutedColor,
                              fontFamily: `'${themeConfig.common.fontBody}', sans-serif`,
                            }}
                          >
                            Catalog ref: #SZ-2026-ARCHIVE • 48 Masterworks Curated
                          </p>

                          {/* Pills */}
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <span
                              className="text-xs px-2.5 py-1 font-bold shadow-xs border transition-all"
                              style={{
                                backgroundColor: themeConfig.dark.activePillBg,
                                color: themeConfig.dark.activePillText,
                                borderColor: themeConfig.dark.activePillBg,
                                borderRadius: themeConfig.common.borderRadius,
                              }}
                            >
                              Selected Period
                            </span>
                            <span
                              className="text-xs px-2.5 py-1 font-medium border transition-all"
                              style={{
                                backgroundColor: themeConfig.dark.cardBg,
                                color: themeConfig.dark.bodyColor,
                                borderColor: themeConfig.dark.borderColor,
                                borderWidth: themeConfig.common.borderWidth,
                                borderRadius: themeConfig.common.borderRadius,
                              }}
                            >
                              Classical Temple Murals
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              type="button"
                              className="text-xs font-semibold px-3 py-1.5 shadow-sm transition-all"
                              style={{
                                backgroundColor: themeConfig.dark.btnPrimaryBg,
                                color: themeConfig.dark.btnPrimaryText,
                                borderRadius: themeConfig.common.borderRadius,
                              }}
                            >
                              Commission Artwork →
                            </button>
                            <button
                              type="button"
                              className="text-xs font-semibold px-3 py-1.5 border transition-all"
                              style={{
                                backgroundColor: themeConfig.dark.btnSecondaryBg,
                                color: themeConfig.dark.btnSecondaryText,
                                borderColor: themeConfig.dark.borderColor,
                                borderWidth: themeConfig.common.borderWidth,
                                borderRadius: themeConfig.common.borderRadius,
                              }}
                            >
                              View Catalog
                            </button>
                          </div>

                          {/* Live Form Simulation */}
                          <div
                            className="p-4 space-y-2.5 border transition-all mt-4"
                            style={{
                              backgroundColor: themeConfig.dark.formCardBg,
                              borderColor: themeConfig.dark.formInputBorderColor,
                              borderWidth: themeConfig.common.borderWidth,
                              borderRadius: themeConfig.common.borderRadius,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className="text-[10px] font-mono uppercase tracking-widest font-bold"
                                style={{ color: themeConfig.dark.formSubmitBtnBg }}
                              >
                                Curatorial Inquiry Form
                              </span>
                            </div>
                            <div>
                              <label
                                className="text-[11px] font-semibold block mb-1"
                                style={{ color: themeConfig.dark.formLabelColor }}
                              >
                                Full Name *
                              </label>
                              <div
                                className="px-2.5 py-1.5 text-xs rounded border flex items-center justify-between"
                                style={{
                                  backgroundColor: themeConfig.dark.formInputBg,
                                  color: themeConfig.dark.formInputText,
                                  borderColor: themeConfig.dark.formInputBorderColor,
                                  borderWidth: themeConfig.common.borderWidth,
                                  borderRadius: themeConfig.common.borderRadius,
                                }}
                              >
                                <span>Smt. Gayatri Iyer</span>
                              </div>
                            </div>
                            <div>
                              <label
                                className="text-[11px] font-semibold block mb-1"
                                style={{ color: themeConfig.dark.formLabelColor }}
                              >
                                Inquiry Type
                              </label>
                              <div
                                className="px-2.5 py-1.5 text-xs rounded border flex items-center justify-between"
                                style={{
                                  backgroundColor: themeConfig.dark.formInputBg,
                                  color: themeConfig.dark.formPlaceholderColor,
                                  borderColor: themeConfig.dark.formInputBorderColor,
                                  borderWidth: themeConfig.common.borderWidth,
                                  borderRadius: themeConfig.common.borderRadius,
                                }}
                              >
                                <span>Select an option</span>
                                <span className="opacity-50 text-[10px]">▼</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="w-full py-2 text-xs font-bold shadow-sm transition-all"
                              style={{
                                backgroundColor: themeConfig.dark.formSubmitBtnBg,
                                color: themeConfig.dark.formSubmitBtnText,
                                borderRadius: themeConfig.common.borderRadius,
                              }}
                            >
                              Submit Inquiry
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      All tokens saved here dynamically propagate to both public exhibition pages and all admin management screens.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </Tabs>
        </form>
      )}
    </div>
  );
}
