import type { Metadata } from "next";
import { Breadcrumbs, CtaCard, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { FaqList } from "@/components/FaqList";
import { getContentMany } from "@/lib/cms";
import { getActiveFaqs } from "@/lib/site-faqs";
import { faqPageJsonLd } from "@/lib/structured-data";
import { publicBookingHref } from "@/lib/public-booking";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers about insurance, cancellation, what to bring, pricing, and what to expect at your first chiropractic or massage appointment in Paris, TX.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ — The Rub Club & Chiropractic Associates",
    description:
      "Insurance, scheduling, and first-visit answers for our Paris and Sulphur Springs offices.",
    url: "/faq",
  },
};

export default async function FaqPage() {
  const c = await getContentMany(["faq_heading", "faq_intro"]);
  const faqs = await getActiveFaqs();

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
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <FaqList entries={faqs} />
        </section>
        <CtaCard
          title="Still have a question?"
          body="The fastest way to reach us is by phone during office hours, or send a message and we'll respond as soon as we can."
          primary={{ label: "Contact us", href: "/contact" }}
          secondary={{ label: "Book online", href: publicBookingHref() }}
        />
      </div>
    </>
  );
}
