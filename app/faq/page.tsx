import { buildPageMetadata } from "@/lib/page-metadata";
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

export const metadata = buildPageMetadata({
  title: "Frequently Asked Questions",
  description:
    "Answers about insurance, cancellation, what to bring, pricing, and what to expect at your first chiropractic or massage appointment in Paris, TX.",
  path: "/faq",
  ogTitle: "FAQ — Chiropractic Associates",
  ogDescription:
    "Insurance, scheduling, and first-visit answers for our Paris and Sulphur Springs offices.",
});

export default async function FaqPage() {
  const [c, faqs, displayLocs] = await Promise.all([
    getContentMany(["faq_heading", "faq_intro"]),
    getActiveFaqs(),
    getDisplayLocations(),
  ]);
  const paris = displayLocs.paris;

  return (
    <>
      <JsonLd data={faqPageJsonLd(faqs)} />
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "FAQ", url: "/faq" }]} />
      <PageHero
        eyebrow="Good to know"
        title={c.faq_heading}
        lede={c.faq_intro}
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 pb-16">
        <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
          <FaqList entries={faqs} />
        </section>
        <ScheduleCtaCard
          title="Still have a question?"
          body="The fastest way to reach us is by phone during office hours, or send a message and we'll respond as soon as we can."
          contactLabel="Contact us"
          secondary={{
            label: `Call Paris ${paris.phonePrimary}`,
            href: telHref(paris.phonePrimary),
          }}
        />
      </div>
    </>
  );
}
