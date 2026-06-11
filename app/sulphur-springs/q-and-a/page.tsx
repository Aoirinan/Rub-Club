import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { LocationHoursSection } from "@/components/LocationHoursSection";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { FaqList } from "@/components/FaqList";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { getSulphurOfficeHours } from "@/lib/office-hours";
import { getSulphurSpringsFaqs } from "@/lib/site-faqs";

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: "Q & A â€” Sulphur Springs Chiropractic",
  description:
    "Frequently asked questions about chiropractic care at Chiropractic Associates of Sulphur Springs.",
  path: "/sulphur-springs/q-and-a",
  ogTitle: "Q & A â€” Sulphur Springs, TX",
});

export default async function QAndAPage() {
  const [faqs, ssHours, displayLocs] = await Promise.all([
    getSulphurSpringsFaqs(),
    getSulphurOfficeHours(),
    getDisplayLocations(),
  ]);
  const ss = displayLocs.sulphur_springs;

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
        eyebrow="Chiropractic Associates Â· Sulphur Springs"
        title="Questions & Answers"
      />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#015949] bg-white p-6 shadow-md sm:p-10">
          <FaqList entries={faqs} />
        </section>
        <LocationHoursSection location={ss} hours={ssHours} accent="#015949" />
        <ScheduleCtaCard
          title="Still have questions?"
          body="Contact our Sulphur Springs office â€” we're happy to help."
          secondary={{ label: `Call ${ss.phonePrimary}`, href: telHref(ss.phonePrimary) }}
        />
      </div>
    </>
  );
}
