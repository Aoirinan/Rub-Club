import type { Metadata } from "next";
import Image from "next/image";
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
import { getContent, getContentMany } from "@/lib/cms";
import { allSSPageSlugs, getSSPageContent } from "@/lib/ss-cms-content";
import { ssPageCardImageId } from "@/lib/ss-cms-registry";
import { SS_PAGES_CMS_DEFAULTS, ssPageFieldIds } from "@/lib/ss-pages-cms";
import { getUiText } from "@/lib/ui-text";
import { getPublishedLegacyPage, listPublishedLegacyPagesForSite } from "@/lib/legacy-pages";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

const SHARED_IDS = ssPageFieldIds("ss_subpage_");

async function getSharedCopy(): Promise<Record<string, string>> {
  const cms = await getContentMany(SHARED_IDS);
  return Object.fromEntries(
    SHARED_IDS.map((id) => [id, cms[id]?.trim() || SS_PAGES_CMS_DEFAULTS[id] || ""]),
  );
}

export async function generateStaticParams() {
  const slugs = new Set(allSSPageSlugs());
  try {
    const legacy = await listPublishedLegacyPagesForSite("chiro-sulphur");
    for (const p of legacy) slugs.add(p.slug);
  } catch {
    // Firestore unavailable at build — static slugs still ship; legacy pages render on demand.
  }
  return [...slugs].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [page, shared] = await Promise.all([getSSPageContent(slug), getSharedCopy()]);
  const titleSuffix = shared.ss_subpage_meta_title_suffix;
  const ogSuffix = shared.ss_subpage_og_title_suffix;
  if (page) {
    return buildPageMetadata({
      title: `${page.title} ${titleSuffix}`,
      description: page.metaDescription,
      path: `/sulphur-springs/${page.slug}`,
      ogTitle: `${page.title} ${ogSuffix}`,
    });
  }
  const legacy = await getPublishedLegacyPage("chiro-sulphur", slug);
  if (legacy) {
    return buildPageMetadata({
      title: `${legacy.title} ${titleSuffix}`,
      description: legacy.metaDescription,
      path: legacy.route,
      ogTitle: `${legacy.title} ${ogSuffix}`,
    });
  }
  return { title: "Sulphur Springs" };
}

export default async function SulphurSpringsSubpage({ params }: Props) {
  const { slug } = await params;
  const [page, ssHours, displayLocs, cardImage, shared, ui] = await Promise.all([
    getSSPageContent(slug),
    getSulphurOfficeHours(),
    getDisplayLocations(),
    getContent(ssPageCardImageId(slug)),
    getSharedCopy(),
    getUiText(),
  ]);
  const ss = displayLocs.sulphur_springs;
  const photo = cardImage.trim();
  const callLabel = `${ui.ui_call_prefix} ${ss.phonePrimary}`;

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
        <PageHero variant="sulphur" eyebrow={shared.ss_subpage_eyebrow} title={legacy.title} />
        <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
          <section className="border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10">
            <LegacyPageBody blocks={legacy.blocks} heroImage={legacy.heroImage} images={legacy.images} accent="#2980b9" />
          </section>
          <LocationHoursSection location={ss} hours={ssHours} accent="#2980b9" />
          <ScheduleCtaCard
            variant="sulphur"
            title={ui.ui_schedule_appointment_cta}
            body={shared.ss_subpage_cta_service_body}
            secondary={{ label: callLabel, href: telHref(ss.phonePrimary) }}
          />
        </div>
      </>
    );
  }

  const ctaTitle =
    page.kind === "injury"
      ? shared.ss_subpage_cta_injury_heading
      : page.kind === "resource"
        ? shared.ss_subpage_cta_resource_heading
        : ui.ui_schedule_appointment_cta;
  const ctaBody =
    page.kind === "injury"
      ? shared.ss_subpage_cta_injury_body
      : page.kind === "resource"
        ? shared.ss_subpage_cta_resource_body
        : shared.ss_subpage_cta_service_body;

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Sulphur Springs", url: "/sulphur-springs" },
          { name: page.title, url: `/sulphur-springs/${page.slug}` },
        ]}
      />
      <PageHero variant="sulphur" eyebrow={shared.ss_subpage_eyebrow} title={page.title} />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10">
          {photo ? (
            <div className="relative mb-8 aspect-[3/2] w-full overflow-hidden rounded-lg bg-stone-100">
              <Image
                src={photo}
                alt={page.title}
                fill
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
                unoptimized={/^https?:\/\//i.test(photo)}
              />
            </div>
          ) : null}
          <div className="prose prose-stone max-w-none">
            <SsMarkdownBody body={page.body} />
          </div>
        </section>
        <LocationHoursSection location={ss} hours={ssHours} accent="#2980b9" />
        <ScheduleCtaCard
          variant="sulphur"
          title={ctaTitle}
          body={ctaBody}
          secondary={{ label: callLabel, href: telHref(ss.phonePrimary) }}
        />
      </div>
    </>
  );
}
