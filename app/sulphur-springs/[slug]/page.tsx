import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { notFound } from "next/navigation";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { LocationHoursSection } from "@/components/LocationHoursSection";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { SsMarkdownBody } from "@/components/SsMarkdownBody";
import { LegacyPageBody } from "@/components/LegacyPageBody";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { getSulphurOfficeHours } from "@/lib/office-hours";
import { allSSPageSlugs, getSSPageContent } from "@/lib/ss-cms-content";
import { getPublishedLegacyPage, listPublishedLegacyPagesForSite } from "@/lib/legacy-pages";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const legacy = await listPublishedLegacyPagesForSite("chiro-sulphur");
  const slugs = new Set([...allSSPageSlugs(), ...legacy.map((p) => p.slug)]);
  return [...slugs].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getSSPageContent(slug);
  if (page) {
    return buildPageMetadata({
      title: `${page.title} — Sulphur Springs Chiropractic`,
      description: page.metaDescription,
      path: `/sulphur-springs/${page.slug}`,
      ogTitle: `${page.title} — Sulphur Springs, TX`,
    });
  }
  const legacy = await getPublishedLegacyPage("chiro-sulphur", slug);
  if (legacy) {
    return buildPageMetadata({
      title: `${legacy.title} — Sulphur Springs Chiropractic`,
      description: legacy.metaDescription,
      path: legacy.route,
      ogTitle: `${legacy.title} — Sulphur Springs, TX`,
    });
  }
  return { title: "Sulphur Springs" };
}

export default async function SulphurSpringsSubpage({ params }: Props) {
  const { slug } = await params;
  const [page, ssHours, displayLocs] = await Promise.all([
    getSSPageContent(slug),
    getSulphurOfficeHours(),
    getDisplayLocations(),
  ]);
  const ss = displayLocs.sulphur_springs;

  // Curated SS page missing -> fall back to a verbatim legacy page (CURSOR_PROMPT §5).
  if (!page) {
    const legacy = await getPublishedLegacyPage("chiro-sulphur", slug);
    if (!legacy) notFound();
    return (
      <>
        <Breadcrumbs
          items={[
            { name: "Home", url: "/" },
            { name: "Sulphur Springs", url: "/sulphur-springs" },
            { name: legacy.title, url: legacy.route },
          ]}
        />
        <PageHero variant="sulphur" eyebrow="Chiropractic Associates · Sulphur Springs" title={legacy.title} />
        <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
          <section className="border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10">
            <LegacyPageBody blocks={legacy.blocks} heroImage={legacy.heroImage} images={legacy.images} accent="#2980b9" />
          </section>
          <LocationHoursSection location={ss} hours={ssHours} accent="#2980b9" />
          <ScheduleCtaCard
            variant="sulphur"
            title="Schedule an appointment"
            body="Contact our Sulphur Springs office to discuss whether this treatment is right for you."
            secondary={{ label: `Call ${ss.phonePrimary}`, href: telHref(ss.phonePrimary) }}
          />
        </div>
      </>
    );
  }

  const ctaTitle =
    page.kind === "injury"
      ? "Need treatment?"
      : page.kind === "resource"
        ? "Have questions?"
        : "Schedule an appointment";
  const ctaBody =
    page.kind === "injury"
      ? "Contact our Sulphur Springs office for a thorough examination."
      : page.kind === "resource"
        ? "Contact our Sulphur Springs office and our team will be happy to help."
        : "Contact our Sulphur Springs office to discuss whether this treatment is right for you.";

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Sulphur Springs", url: "/sulphur-springs" },
          { name: page.title, url: `/sulphur-springs/${page.slug}` },
        ]}
      />
      <PageHero variant="sulphur" eyebrow="Chiropractic Associates · Sulphur Springs" title={page.title} />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10">
          <div className="prose prose-stone max-w-none">
            <SsMarkdownBody body={page.body} />
          </div>
        </section>
        <LocationHoursSection location={ss} hours={ssHours} accent="#2980b9" />
        <ScheduleCtaCard
          variant="sulphur"
          title={ctaTitle}
          body={ctaBody}
          secondary={{ label: `Call ${ss.phonePrimary}`, href: telHref(ss.phonePrimary) }}
        />
      </div>
    </>
  );
}
