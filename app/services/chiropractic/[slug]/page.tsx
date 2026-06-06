import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { SsMarkdownBody } from "@/components/SsMarkdownBody";
import { LOCATIONS, telHref } from "@/lib/constants";
import { allParisChiroServiceSlugs, getParisChiroService } from "@/lib/paris-chiro-services";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return allParisChiroServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getParisChiroService(slug);
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
  const page = getParisChiroService(slug);
  if (!page) notFound();

  const phone = LOCATIONS.paris.phonePrimary;

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
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <div className="prose prose-stone max-w-none">
            <SsMarkdownBody body={page.body} />
          </div>
        </section>
        <ScheduleCtaCard
          title="Schedule an appointment"
          body="Contact our Paris office to discuss whether this treatment is right for you."
          secondary={{ label: `Call ${phone}`, href: telHref(phone) }}
        />
      </div>
    </>
  );
}
