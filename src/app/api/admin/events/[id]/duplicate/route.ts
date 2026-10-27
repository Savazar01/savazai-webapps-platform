import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

async function checkAdminAuth(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers().catch(() => request.headers),
  });
  if (!session || !session.user) {
    return null;
  }
  return session;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAdminAuth(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const sourceEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        artworks: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!sourceEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Generate unique slug
    const baseSlug = `${sourceEvent.slug}-copy`;
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    // Determine sortOrder (source + 1)
    const nextSortOrder = (sourceEvent.sortOrder || 0) + 1;

    // Deep duplicate event with artworks, resetting RSVPs to 0 and setting status to draft/unlisted
    const newEvent = await prisma.event.create({
      data: {
        title: `${sourceEvent.title} (Copy)`,
        slug: uniqueSlug,
        earmarkText: sourceEvent.earmarkText,
        eventType: sourceEvent.eventType,
        description: sourceEvent.description,
        venue: sourceEvent.venue,
        venueName: sourceEvent.venueName,
        streetAddress: sourceEvent.streetAddress,
        city: sourceEvent.city,
        stateProvince: sourceEvent.stateProvince,
        postalCode: sourceEvent.postalCode,
        country: sourceEvent.country,
        countryCode: sourceEvent.countryCode,
        timezone: sourceEvent.timezone,
        startDate: sourceEvent.startDate,
        endDate: sourceEvent.endDate,
        posterUrl: sourceEvent.posterUrl,
        bannerImage: sourceEvent.bannerImage,
        galleryImages: sourceEvent.galleryImages ? (sourceEvent.galleryImages as Prisma.InputJsonValue) : Prisma.DbNull,
        brochurePdfUrl: sourceEvent.brochurePdfUrl,
        brochureTitle: sourceEvent.brochureTitle,
        brochureDownloadable: sourceEvent.brochureDownloadable,
        galleryDisplayMode: sourceEvent.galleryDisplayMode,
        galleryAutoplayTimer: sourceEvent.galleryAutoplayTimer,
        maxCapacity: sourceEvent.maxCapacity,
        registrationFee: sourceEvent.registrationFee,
        currency: sourceEvent.currency,
        isRegistrationOpen: sourceEvent.isRegistrationOpen,
        isPublished: false, // DRAFT / Unlisted so curators can modify before publishing
        contactName: sourceEvent.contactName,
        contactEmail: sourceEvent.contactEmail,
        contactPhone: sourceEvent.contactPhone,
        statusOverride: sourceEvent.statusOverride,
        isArchived: false,
        isActive: true,
        isDeleted: false,
        showOnHomepage: false,
        sortOrder: nextSortOrder,
        rsvpConfig: sourceEvent.rsvpConfig ? (sourceEvent.rsvpConfig as Prisma.InputJsonValue) : Prisma.DbNull,
        dailySchedules: sourceEvent.dailySchedules ? (sourceEvent.dailySchedules as Prisma.InputJsonValue) : Prisma.DbNull,
        artworks: {
          create: sourceEvent.artworks.map((item) => ({
            artworkId: item.artworkId,
            displayOrder: item.displayOrder,
          })),
        },
      },
      include: {
        artworks: {
          include: {
            artwork: {
              include: { category: true },
            },
          },
        },
        _count: {
          select: {
            registrations: true,
            artworks: true,
          },
        },
      },
    });

    revalidatePath("/admin/events");
    revalidatePath("/events");

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error: unknown) {
    console.error("[API_ADMIN_EVENT_DUPLICATE_ERROR]:", error);
    const message = error instanceof Error ? error.message : "Error duplicating event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
