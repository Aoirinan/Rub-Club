import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getPageMeta } from "@/lib/page-meta";
import { pageOgDescriptionId, pageOgTitleId, parisText } from "@/lib/paris-pages-cms";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { FaqList } from "@/components/FaqList";
import { getContentMany } from "@/lib/cms";
import { getActiveFaqs } from "@/lib/site-faqs";
import { faqPageJsonLd } from "@/lib/structured-data";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [meta, og] = await Promise.all([
    getPageMeta("faq", {
      title: "Frequently Asked Questions",
      description:
        "Answers about insurance, cancellation, what to bring, pricing, and what to expect at your first chiropractic or massage appointment in Paris, TX.",
    }),
    getContentMany([pageOgTitleId("faq"), pageOgDescriptionId("faq")]),
  ]);
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: "/faq",
    ogTitle: parisText(og, pageOgTitleId("faq")),
    ogDescription: parisText(og, pageOgDescriptionId("faq")),
  });
}

const FAQ_COPY_IDS = [
  "faq_eyebrow",
  "faq_cta_title",
  "faq_cta_body",
  "faq_cta_contact_label",
  "faq_call_prefix",
] as const;

export default async function FaqPage() {
  const [c, faqs, displayLocs] = await Promise.all([
    getContentMany(["faq_heading", "faq_intro", ...FAQ_COPY_IDS]),
    getActiveFaqs(),
    getDisplayLocations(),
  ]);
  const paris = displayLocs.paris;
  const t = (id: string) => parisText(c, id);

  return (
    <>
      <JsonLd data={faqPageJsonLd(faqs)} />
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "FAQ", url: "/faq" }]} />
      <PageHero
        eyebrow={t("faq_eyebrow")}
        title={c.faq_heading}
        lede={c.faq_intro}
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 pb-16">
        <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
          <FaqList entries={faqs} />
        </section>
        <ScheduleCtaCard
          title={t("faq_cta_title")}
          body={t("faq_cta_body")}
          contactLabel={t("faq_cta_contact_label")}
          secondary={{
            label: `${t("faq_call_prefix")} ${paris.phonePrimary}`,
            href: telHref(paris.phonePrimary),
          }}
        />
      </div>
    </>
  );
}
