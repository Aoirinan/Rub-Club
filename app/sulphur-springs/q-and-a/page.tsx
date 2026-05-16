import type { Metadata } from "next";
import { Breadcrumbs, CtaCard, PageHero } from "@/components/PageChrome";
import { FaqList } from "@/components/FaqList";
import { SS_QA } from "@/lib/sulphur-springs-content";
import { telHref } from "@/lib/constants";
import { publicBookingHref } from "@/lib/public-booking";

export const metadata: Metadata = {
  title: "Q & A — Sulphur Springs Chiropractic",
  description:
    "Frequently asked questions about chiropractic care at Chiropractic Associates of Sulphur Springs.",
  alternates: { canonical: "/sulphur-springs/q-and-a" },
  openGraph: {
    title: "Q & A — Sulphur Springs, TX",
    description:
      "Frequently asked questions about chiropractic care at Chiropractic Associates of Sulphur Springs.",
    url: "/sulphur-springs/q-and-a",
  },
};

export default function QAndAPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Sulphur Springs", url: "/sulphur-springs" },
          { name: "Q & A", url: "/sulphur-springs/q-and-a" },
        ]}
      />
      <PageHero
        eyebrow="Chiropractic Associates · Sulphur Springs"
        title="Questions & Answers"
      />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <FaqList entries={SS_QA} />
        </section>
        <CtaCard
          title="Still have questions?"
          body="Contact our Sulphur Springs office — we're happy to help."
          primary={{ label: "Book online", href: publicBookingHref() }}
          secondary={{ label: "Call 903-919-5020", href: telHref("903-919-5020") }}
        />
      </div>
    </>
  );
}
