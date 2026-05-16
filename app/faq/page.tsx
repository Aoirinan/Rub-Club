import type { Metadata } from "next";
import { Breadcrumbs, CtaCard, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { FaqList } from "@/components/FaqList";
import { FAQS } from "@/lib/faqs";
import { faqPageJsonLd } from "@/lib/structured-data";
import { publicBookingHref } from "@/lib/public-booking";

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

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqPageJsonLd(FAQS)} />
      <Breadcrumbs items={[{ name: "Home", url: "/" }, { name: "FAQ", url: "/faq" }]} />
      <PageHero
        eyebrow="Good to know"
        title="Frequently asked questions"
        lede="Insurance, scheduling, pricing, and first-visit answers. Can't find your question? Send us a message and we'll help."
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 pb-16">
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <FaqList entries={FAQS} />
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
