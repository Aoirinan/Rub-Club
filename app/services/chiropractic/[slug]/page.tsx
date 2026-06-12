import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { LocationHoursSection } from "@/components/LocationHoursSection";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { SsMarkdownBody } from "@/components/SsMarkdownBody";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { getParisOfficeHours } from "@/lib/office-hours";
import { getContentMany } from "@/lib/cms";
import { allParisChiroServiceSlugs, getParisChiroService } from "@/lib/paris-chiro-services";
import { parisChiroPageBodyId, parisChiroPageMetaId } from "@/lib/paris-chiro-cms-registry";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

type ParisChiroPageContent = {
  slug: string;
  title: string;
  metaDescription: string;
  body: string;
};

/** Static page copy with manager edits from the CMS (Paris chiro pages scope) applied. */
async function getParisChiroPageContent(slug: string): Promise<ParisChiroPageContent | null> {
  const base = getParisChiroService(slug);
  if (!base) return null;
  const bodyId = parisChiroPageBodyId(slug);
  const metaId = parisChiroPageMetaId(slug);
  const cms = await getContentMany([bodyId, metaId]);
  return {
    slug,
    title: base.title,
    metaDescription: cms[metaId]?.trim() || base.metaDescription,
    body: cms[bodyId]?.trim() || base.body,
  };
}

export async function generateStaticParams() {
  return allParisChiroServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getParisChiroPageContent(slug);
  if (!page) return { title: "Chiropractic" };

  return buildPageMetadata({
    title: `${page.title} — Chiropractic Associates, Paris TX`,
    description: page.metaDescription,
    path: `/services/chiropractic/${page.slug}`,
    ogTitle: `${page.title} — Paris, TX`,
  });
}

export default async function ParisChiroServicePage({ params }: Props) {
  const { slug } = await params;
  const [page, parisHours, displayLocs] = await Promise.all([
    getParisChiroPageContent(slug),
    getParisOfficeHours(),
    getDisplayLocations(),
  ]);
  if (!page) notFound();

  const paris = displayLocs.paris;
  const phone = paris.phonePrimary;

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Chiropractic", url: "/services/chiropractic" },
          { name: page.title, url: `/services/chiropractic/${page.slug}` },
        ]}
      />
      <PageHero eyebrow="Chiropractic Associates · Paris, TX" title={page.title} />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
          <div className="prose prose-stone max-w-none">
            <SsMarkdownBody body={page.body} />
          </div>
        </section>
        <LocationHoursSection location={paris} hours={parisHours} />
        <ScheduleCtaCard
          title="Schedule an appointment"
          body="Contact our Paris office to discuss whether this treatment is right for you."
          secondary={{ label: `Call ${phone}`, href: telHref(phone) }}
        />
      </div>
    </>
  );
}
