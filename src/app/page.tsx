import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { DynamicPageSections } from "@/components/public/dynamic-page-sections";
import { Button } from "@/components/ui/button";
import { Sparkles, Palette, Music, BookOpen, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  let settings = null;
  try {
    settings = await prisma.systemSetting.findFirst();
    const page = await prisma.page.findFirst({
      where: {
        OR: [{ isHomepage: true }, { slug: "home" }, { slug: "index" }],
        isPublished: true,
        isActive: true,
        isDeleted: false,
      },
      orderBy: [{ isHomepage: "desc" }, { updatedAt: "desc" }],
    });

    const archiveTitle = settings?.siteName || "SavazAI WebApps";

    if (page) {
      return {
        title: page.title.includes(archiveTitle)
          ? page.title
          : `${page.title} — ${archiveTitle}`,
        description:
          page.metaDescription ||
          settings?.siteDescription ||
          "Fine art masterworks, high-fidelity cultural archives, and classical musical recitals.",
      };
    }
  } catch (error) {
    console.warn("Could not query metadata for home page:", error);
  }

  const defaultBrand = settings?.siteName || "SavazAI WebApps";
  return {
    title: `${defaultBrand} — Digital Atelier & Cultural Archive`,
    description:
      settings?.siteDescription ||
      "Living digital atelier and high-fidelity cultural archive platform engineered by Savazar.",
  };
}

export default async function HomePage() {
  let homePage = null;

  try {
    homePage = await prisma.page.findFirst({
      where: {
        OR: [{ isHomepage: true }, { slug: "home" }, { slug: "index" }],
        isPublished: true,
        isActive: true,
        isDeleted: false,
      },
      orderBy: [{ isHomepage: "desc" }, { updatedAt: "desc" }],
      include: {
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            subSections: {
              orderBy: { orderIndex: "asc" },
            },
          },
        },
      },
    });
  } catch (error) {
    console.warn("Database query for home page failed or tables initializing:", error);
  }

  // 1. If an admin-published dynamic page exists, render via visual builder engine
  if (homePage && homePage.sections.length > 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <Navbar />

        <main className="flex-1">
          <DynamicPageSections sections={homePage.sections} />
        </main>

        <Footer />
      </div>
    );
  }

  // 2. Curated Luxury Default Home Page Fallback
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-stone-950">
      <Navbar />

      <main className="flex-1">
        {/* Luxury Hero Banner */}
        <section className="relative overflow-hidden py-24 sm:py-32 border-b border-border/60 bg-gradient-to-b from-card/80 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-widest text-primary mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Living Digital Archive &amp; Cultural Atelier
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
              Preserving Cultural Heritage Through{" "}
              <span className="text-primary underline decoration-primary/40 underline-offset-8">
                Masterworks &amp; Digital Curation
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
              Explore high-fidelity archival collections, physical gallery publishing, 
              and immersive 3D spatial exhibition walkthroughs.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="font-serif">
                <Link href="/gallery" className="flex items-center gap-2">
                  Explore Catalog
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-serif border-border hover:border-primary">
                <Link href="/blogs">Curatorial Essays</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Feature Highlights Showcase */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-xl bg-card border border-border/80 shadow-sm hover:border-primary/50 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-5">
                  <Palette className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-serif font-semibold text-foreground">
                  Archival Collections &amp; Masterworks
                </h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  High-resolution digital cataloging, provenance records, and physical museum placard automation.
                </p>
              </div>
              <Link href="/gallery" className="mt-6 text-sm font-semibold text-primary flex items-center gap-1 hover:underline">
                View Gallery <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-8 rounded-xl bg-card border border-border/80 shadow-sm hover:border-primary/50 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-5">
                  <Music className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-serif font-semibold text-foreground">
                  Events &amp; Spatial Showcases
                </h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Interactive exhibitions, gallery walkthroughs, and digital e-catalog publication monographs.
                </p>
              </div>
              <Link href="/events" className="mt-6 text-sm font-semibold text-primary flex items-center gap-1 hover:underline">
                Upcoming Events <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-8 rounded-xl bg-card border border-border/80 shadow-sm hover:border-primary/50 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-5">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-serif font-semibold text-foreground">
                  Curatorial Essays &amp; Insights
                </h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Authoritative documentation exploring artistic traditions, techniques, and cultural lineages.
                </p>
              </div>
              <Link href="/blogs" className="mt-6 text-sm font-semibold text-primary flex items-center gap-1 hover:underline">
                Read Articles <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
