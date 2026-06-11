import { buildPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { WELLNESS_CARE_PLANS_PATH, telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { chiropracticWellnessBreadcrumbs } from "@/lib/service-breadcrumbs";
import { getContentMany } from "@/lib/cms";
import {
  WELLNESS_PAGE_CMS_FIELD_IDS,
  buildWellnessCarePlansContent,
} from "@/lib/wellness-care-plans-content";

export const metadata = buildPageMetadata({
  title: "Wellness Care Plans — Chiropractic Associates, Paris, TX",
  brandInTitle: true,
  description:
    "Chiro-Fitness and Acu-Fit monthly wellness memberships: adjustments, massage combos, therapy, acupuncture, and rehab sessions at our Paris, TX office.",
  path: WELLNESS_CARE_PLANS_PATH,
  ogTitle: "Wellness care plans — Chiropractic Associates",
  ogDescription:
    "Monthly wellness membership options for chiropractic, massage, therapy, and acupuncture in Paris, TX.",
});

export const revalidate = 60;

export default async function WellnessCarePlansPage() {
  const [raw, displayLocs] = await Promise.all([
    getContentMany([...WELLNESS_PAGE_CMS_FIELD_IDS]),
    getDisplayLocations(),
  ]);
  const content = buildWellnessCarePlansContent(raw);
  const parisPhone = displayLocs.paris.phonePrimary;

  return (
    <>
      <Breadcrumbs items={chiropracticWellnessBreadcrumbs(WELLNESS_CARE_PLANS_PATH)} />

      <PageHero
        eyebrow={content.heroEyebrow}
        title="Wellness care plans"
        lede={content.pageLede}
      />

      <div className="mx-auto max-w-6xl space-y-8 px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          {content.sections.map((section) => (
            <section
              key={section.id}
              className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-8"
            >
              <h2 className="text-xl font-black text-[#173f3b]">{section.title}</h2>
              {section.subtitle ? (
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-stone-500">
                  {section.subtitle}
                </p>
              ) : null}
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-stone-700">
                {section.lines.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0f5f5c]" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-xl font-black text-[#173f3b]">{content.closingHeadline}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-stone-700">
            {content.closingLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-stone-600">
            Questions about which tier fits you?{" "}
            <Link
              href="/services/chiropractic"
              className="font-bold text-[#0f5f5c] underline hover:text-[#173f3b]"
            >
              Back to chiropractic services
            </Link>{" "}
            or call{" "}
            <a className="font-bold text-[#0f5f5c] underline" href={telHref(parisPhone)}>
              {parisPhone}
            </a>
            .
          </p>
        </section>

        <ScheduleCtaCard
          title={content.ctaTitle}
          body={content.ctaBody}
          bookLabel="Book chiropractic"
          query="service=chiropractic"
          secondary={{ label: `Call Paris ${parisPhone}`, href: telHref(parisPhone) }}
        />
      </div>
    </>
  );
}
