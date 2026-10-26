import Link from "next/link";
import prisma from "@/lib/prisma";
import { Sparkles, Mail, Phone } from "lucide-react";
import { PrivacyModalTrigger } from "./privacy-request-modal";
import { SocialPlatformIcon, type CustomSocialLink } from "./social-icon";
import { SocialShareBar } from "./social-share-bar";

interface SocialLinkItem {
  platform: string;
  url: string;
  isVisible: boolean;
}

interface LegalLinkItem {
  label: string;
  url: string;
  isVisible: boolean;
}

interface FooterConfig {
  aboutText?: string;
  contactEmail?: string;
  contactPhone?: string;
  copyrightText?: string;
  copyrightNotice?: string;
  socialLinks?: SocialLinkItem[];
  legalLinks?: LegalLinkItem[];
}

export const dynamic = "force-dynamic";

export async function Footer() {
  const [settings, menuItems] = await Promise.all([
    prisma.systemSetting.findFirst().catch(() => null),
    prisma.menuItem
      .findMany({
        where: { isActive: true, parentId: null },
        orderBy: { orderIndex: "asc" },
        take: 8,
      })
      .catch(() => []),
  ]);

  const footerConfig = (settings?.footerConfig as FooterConfig | null) || null;

  const siteName =
    settings?.siteName ||
    "SavazAI WebApps — Digital Atelier & Cultural Archive";

  const contactEmail = (footerConfig?.contactEmail ?? settings?.contactEmail ?? "").trim();
  const contactPhone = (footerConfig?.contactPhone ?? settings?.contactPhone ?? "").trim();
  const aboutText = (footerConfig?.aboutText ?? settings?.siteDescription ?? "").trim();
  const brandNotice = (footerConfig?.copyrightNotice ?? "").trim();
  const copyrightText =
    footerConfig?.copyrightText?.trim() ||
    brandNotice ||
    `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;

  // Strict Zero-Fallback Social Channels Extraction:
  // Direct setting values strictly govern the standard channels. If empty/blank, they MUST NOT render.
  const activeSocials: { platform: string; url: string; icon: string }[] = [];

  const directInstagram = settings?.instagramUrl?.trim();
  const directFacebook = settings?.facebookUrl?.trim();
  const directYouTube = settings?.youtubeUrl?.trim();
  const directPinterest = settings?.pinterestUrl?.trim();
  const directLinkedin = (settings as { linkedinUrl?: string | null } | null)?.linkedinUrl?.trim();
  const directTiktok = (settings as { tiktokUrl?: string | null } | null)?.tiktokUrl?.trim();

  if (directInstagram) {
    activeSocials.push({ platform: "Instagram", url: directInstagram, icon: "instagram" });
  }
  if (directFacebook) {
    activeSocials.push({ platform: "Facebook", url: directFacebook, icon: "facebook" });
  }
  if (directYouTube) {
    activeSocials.push({ platform: "YouTube", url: directYouTube, icon: "youtube" });
  }
  if (directPinterest) {
    activeSocials.push({ platform: "Pinterest", url: directPinterest, icon: "pinterest" });
  }
  if (directLinkedin) {
    activeSocials.push({ platform: "LinkedIn", url: directLinkedin, icon: "linkedin" });
  }
  if (directTiktok) {
    activeSocials.push({ platform: "TikTok", url: directTiktok, icon: "tiktok" });
  }

  // Dynamic Custom Social Links from SystemSetting.customSocialLinks
  const customSocials = (settings as { customSocialLinks?: CustomSocialLink[] | null } | null)?.customSocialLinks;
  if (Array.isArray(customSocials)) {
    customSocials.forEach((item) => {
      const label = (item?.label || "").trim();
      const url = (item?.url || "").trim();
      const icon = (item?.icon || "globe").trim();
      if (label && url) {
        activeSocials.push({ platform: label, url, icon });
      }
    });
  }

  // Standard platforms are strictly governed by their direct columns above.
  // Auxiliary platforms (e.g. SoundCloud, X / Twitter) in footerConfig.socialLinks are included only if non-empty and visible.
  const standardPlatforms = new Set(["instagram", "facebook", "youtube", "pinterest", "linkedin", "tiktok"]);

  if (Array.isArray(footerConfig?.socialLinks)) {
    footerConfig.socialLinks.forEach((link) => {
      const pName = (link.platform || "").trim();
      const pKey = pName.toLowerCase();
      const trimmedUrl = (link.url || "").trim();

      // Only allow auxiliary platforms from footerConfig (never resurrect empty standard channels)
      if (!standardPlatforms.has(pKey) && link.isVisible !== false && trimmedUrl.length > 0) {
        const alreadyExists = activeSocials.some((s) => s.platform.toLowerCase() === pKey);
        if (!alreadyExists) {
          activeSocials.push({ platform: pName, url: trimmedUrl, icon: pKey });
        }
      }
    });
  }

  // Default fallback legal links if not customized
  const defaultLegal: LegalLinkItem[] = [
    { label: "Privacy Policy", url: "/privacy", isVisible: true },
    { label: "Terms & Conditions", url: "/terms", isVisible: true },
    { label: "Art Licensing & Reproduction", url: "/licensing", isVisible: true },
    { label: "Admin Portal", url: "/admin", isVisible: true },
  ];

  const legalLinks: LegalLinkItem[] =
    footerConfig?.legalLinks && footerConfig.legalLinks.length > 0
      ? footerConfig.legalLinks.filter((l) => l.isVisible && l.url)
      : defaultLegal;

  return (
    <footer className="w-full border-t border-border/80 bg-card/60 transition-colors duration-300">
      {/* Top Gold Border */}
      <div className="h-0.5 w-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={siteName}
                  className="h-9 w-auto max-w-[140px] object-contain"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-serif font-bold text-lg text-foreground">
                  {settings?.siteName
                    ? settings.siteName.includes("—")
                      ? settings.siteName.split("—")[0].trim()
                      : settings.siteName
                    : "SavazAI WebApps"}
                </span>
                {settings?.siteName?.includes("—") && (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {settings.siteName.split("—").slice(1).join("—").trim()}
                  </span>
                )}
              </div>
            </div>
            {aboutText.length > 0 && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md">
                {aboutText}
              </p>
            )}
            {brandNotice.length > 0 && (
              <p className="text-xs font-mono text-primary font-semibold">
                {brandNotice}
              </p>
            )}
          </div>

          {/* Dynamic Navigation Links (Synchronized with Header & Navigation Manager) */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm text-foreground uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {menuItems.length > 0 ? (
                menuItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.path}
                      target={item.openInNewTab ? "_blank" : undefined}
                      rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                      className="hover:text-primary transition-colors inline-block"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link href="/gallery" className="hover:text-primary transition-colors">
                      Art Gallery
                    </Link>
                  </li>
                  <li>
                    <Link href="/music" className="hover:text-primary transition-colors">
                      Carnatic Music
                    </Link>
                  </li>
                  <li>
                    <Link href="/events" className="hover:text-primary transition-colors">
                      Exhibitions &amp; Events
                    </Link>
                  </li>
                  <li>
                    <Link href="/blogs" className="hover:text-primary transition-colors">
                      Sacred Art Chronicles
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Contact & Socials */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm text-foreground uppercase tracking-wider">
              Studio &amp; Inquiries
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {contactEmail.length > 0 && (
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                  <a href={`mailto:${contactEmail}`} className="hover:text-primary transition-colors truncate">
                    {contactEmail}
                  </a>
                </li>
              )}
              {contactPhone.length > 0 && (
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                  <a href={`tel:${contactPhone}`} className="hover:text-primary transition-colors">
                    {contactPhone}
                  </a>
                </li>
              )}
              {activeSocials.map((s, idx) => (
                <li key={`${s.platform}-${idx}`}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <SocialPlatformIcon iconKey={s.icon || s.platform} className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{s.platform}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Universal Footer Social Share Bar (Controlled exclusively by Footer Settings) */}
        {settings?.showFooterShare !== false && (
          <div className="mb-8">
            <SocialShareBar
              title={siteName}
              description={aboutText}
              entityLabel="Archive"
              enabled={true}
            />
          </div>
        )}

        {/* Bottom Copyright Strip */}
        <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>{copyrightText}</p>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            {legalLinks.map((l) => (
              <Link key={l.label} href={l.url} className="hover:text-primary transition-colors">
                {l.label}
              </Link>
            ))}
            <PrivacyModalTrigger />
          </div>
        </div>
      </div>
    </footer>
  );
}
