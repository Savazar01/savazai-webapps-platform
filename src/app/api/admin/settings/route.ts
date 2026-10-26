import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      res.cookies.delete("better-auth.session_token");
      res.cookies.delete("__Secure-better-auth.session_token");
      res.cookies.delete("better-auth.session_data");
      res.cookies.delete("__Secure-better-auth.session_data");
      return res;
    }

    let settings = await prisma.systemSetting.findFirst();

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {
          siteName: "SavazAI WebApps — Digital Atelier & Cultural Archive",
          archiveSubtitle: "Digital Exhibition & Cultural Suite",
          siteDescription:
            "Living digital atelier and high-fidelity cultural archive platform engineered by Savazar.",
          adminAlertEmail: "alerts@savazar.com",
          contactEmail: "contact@savazar.com",
          contactPhone: null,
          watermarkText: "© SavazAI WebApps | All Rights Reserved",
          watermarkOpacity: 0.35,
          watermarkFontSize: 28,
          defaultCurrency: "INR",
          defaultTimezone: "Asia/Kolkata",
          storageProvider: "LOCAL",
          r2BucketName: null,
          r2PublicUrl: null,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const existing = await prisma.systemSetting.findFirst();

    const data = {
      siteName: body.siteName,
      archiveSubtitle: body.archiveSubtitle !== undefined ? (body.archiveSubtitle ? String(body.archiveSubtitle).trim() : null) : undefined,
      siteDescription: body.siteDescription,
      adminAlertEmail: body.adminAlertEmail,
      emailHeaderTitle:
        body.emailHeaderTitle !== undefined
          ? (body.emailHeaderTitle && String(body.emailHeaderTitle).trim() !== ""
              ? String(body.emailHeaderTitle).trim()
              : (body.siteName ? String(body.siteName).trim() : null))
          : undefined,
      emailHeaderSubtitle:
        body.emailHeaderSubtitle !== undefined
          ? (body.emailHeaderSubtitle && String(body.emailHeaderSubtitle).trim() !== ""
              ? String(body.emailHeaderSubtitle).trim()
              : (body.archiveSubtitle ? String(body.archiveSubtitle).trim() : null))
          : undefined,
      emailLogoUrl: body.emailLogoUrl !== undefined ? (body.emailLogoUrl ? String(body.emailLogoUrl).trim() : null) : undefined,
      emailFooterText: body.emailFooterText !== undefined ? (body.emailFooterText ? String(body.emailFooterText).trim() : null) : undefined,
      adminLoginTitle:
        body.adminLoginTitle !== undefined
          ? (body.adminLoginTitle && String(body.adminLoginTitle).trim() !== ""
              ? String(body.adminLoginTitle).trim()
              : "SavazAI WebApps Platform Admin")
          : undefined,
      adminLoginSubtitle:
        body.adminLoginSubtitle !== undefined
          ? (body.adminLoginSubtitle && String(body.adminLoginSubtitle).trim() !== ""
              ? String(body.adminLoginSubtitle).trim()
              : "Sign in with your authorized administrative credentials.")
          : undefined,
      adminLoginLogoUrl:
        body.adminLoginLogoUrl !== undefined
          ? (body.adminLoginLogoUrl ? String(body.adminLoginLogoUrl).trim() : null)
          : undefined,
      qrGateBadgeText:
        body.qrGateBadgeText !== undefined
          ? (body.qrGateBadgeText ? String(body.qrGateBadgeText).trim() : "EXHIBITION FLOOR GUIDE")
          : undefined,
      qrGateHeaderTitle:
        body.qrGateHeaderTitle !== undefined
          ? (body.qrGateHeaderTitle ? String(body.qrGateHeaderTitle).trim() : "Welcome to the Exhibition")
          : undefined,
      qrGatePromptText:
        body.qrGatePromptText !== undefined
          ? (body.qrGatePromptText
              ? String(body.qrGatePromptText).trim()
              : 'Enter your details to explore details of the Artwork "{{artworkName}}".')
          : undefined,
      qrGateButtonLabel:
        body.qrGateButtonLabel !== undefined
          ? (body.qrGateButtonLabel ? String(body.qrGateButtonLabel).trim() : "Unlock Masterwork Details")
          : undefined,
      qrGateAllowSkip:
        body.qrGateAllowSkip !== undefined
          ? Boolean(body.qrGateAllowSkip)
          : undefined,
      contactEmail: body.contactEmail !== undefined ? (body.contactEmail ? String(body.contactEmail).trim() : null) : undefined,
      contactPhone: body.contactPhone !== undefined ? (body.contactPhone ? String(body.contactPhone).trim() : null) : undefined,
      watermarkText: body.watermarkText,
      watermarkOpacity:
        body.watermarkOpacity !== undefined
          ? parseFloat(body.watermarkOpacity)
          : undefined,
      watermarkFontSize:
        body.watermarkFontSize !== undefined
          ? parseInt(body.watermarkFontSize)
          : undefined,
      watermarkStyle: body.watermarkStyle !== undefined ? body.watermarkStyle : undefined,
      defaultCurrency: body.defaultCurrency,
      defaultTimezone: body.defaultTimezone,
      storageProvider: body.storageProvider,
      r2AccountId: body.r2AccountId,
      r2BucketName: body.r2BucketName,
      r2PublicUrl: body.r2PublicUrl,
      s3Region: body.s3Region,
      s3BucketName: body.s3BucketName,
      s3Endpoint: body.s3Endpoint,
      s3AccessKey: body.s3AccessKey,
      s3SecretKey: body.s3SecretKey,
      s3PublicUrl: body.s3PublicUrl,
      instagramUrl: body.instagramUrl,
      youtubeUrl: body.youtubeUrl,
      facebookUrl: body.facebookUrl,
      pinterestUrl: body.pinterestUrl,
      linkedinUrl: body.linkedinUrl !== undefined ? (body.linkedinUrl ? String(body.linkedinUrl).trim() : null) : undefined,
      tiktokUrl: body.tiktokUrl !== undefined ? (body.tiktokUrl ? String(body.tiktokUrl).trim() : null) : undefined,
      customSocialLinks: body.customSocialLinks !== undefined ? body.customSocialLinks : undefined,
      enableSocialShare:
        body.enableSocialShare !== undefined ? Boolean(body.enableSocialShare) : undefined,
      showFooterShare:
        body.showFooterShare !== undefined ? Boolean(body.showFooterShare) : undefined,
      logoUrl: body.logoUrl,
      faviconUrl: body.faviconUrl,
      copyrightNoticeHeader:
        body.copyrightNoticeHeader !== undefined
          ? (body.copyrightNoticeHeader ? String(body.copyrightNoticeHeader).trim() : null)
          : undefined,
      copyrightNoticeContent:
        body.copyrightNoticeContent !== undefined
          ? (body.copyrightNoticeContent ? String(body.copyrightNoticeContent).trim() : null)
          : undefined,
      footerConfig: body.footerConfig !== undefined ? {
        ...body.footerConfig,
        contactEmail: body.footerConfig?.contactEmail !== undefined ? String(body.footerConfig.contactEmail).trim() : undefined,
        contactPhone: body.footerConfig?.contactPhone !== undefined ? String(body.footerConfig.contactPhone).trim() : undefined,
      } : undefined,
      emailConfig: body.emailConfig !== undefined ? {
        ...body.emailConfig,
        fromName: body.emailConfig?.fromName ? String(body.emailConfig.fromName).trim() : (body.siteName?.trim() || existing?.siteName?.trim() || "SavazAI Platform"),
        fromEmail: body.emailConfig?.fromEmail ? String(body.emailConfig.fromEmail).trim() : (body.adminAlertEmail?.trim() || existing?.adminAlertEmail?.trim() || "info@savazar.com"),
      } : undefined,
      aiConfig: body.aiConfig !== undefined ? body.aiConfig : undefined,
      adminConfig: body.adminConfig !== undefined ? body.adminConfig : undefined,
      themeConfig: body.themeConfig !== undefined ? body.themeConfig : undefined,
      watermarkConfig: body.watermarkConfig !== undefined ? body.watermarkConfig : undefined,
      googleServicesConfig: body.googleServicesConfig !== undefined ? body.googleServicesConfig : undefined,
      nextcloudConfig: body.nextcloudConfig !== undefined ? body.nextcloudConfig : undefined,
      formSecurityConfig: body.formSecurityConfig !== undefined ? body.formSecurityConfig : undefined,
    };

    let updated;
    if (existing) {
      updated = await prisma.systemSetting.update({
        where: { id: existing.id },
        data,
      });
    } else {
      updated = await prisma.systemSetting.create({
        data,
      });
    }

    try {
      const { clearStorageCache } = await import("@/lib/storage");
      clearStorageCache();
    } catch {
      // Ignore if cache clearing fails
    }

    // Purge full site cache hierarchy so Navbar, Footer, and Public layouts reflect immediately
    try {
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/(public)", "layout");
      revalidatePath("/gallery", "layout");
      revalidatePath("/catalogs", "layout");
      revalidatePath("/contact");
      revalidatePath("/(public)/contact");
      revalidatePath("/api/settings/public");
      revalidatePath("/artwork/[slug]", "page");
      revalidatePath("/events/[slug]", "page");
      revalidatePath("/admin/settings");
      revalidatePath("/admin/login");
      revalidatePath("/api/settings/public");
    } catch (revErr) {
      console.warn("Settings cache revalidation notice:", revErr);
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error saving settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
