import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { practiceThemeStyle } from "@/components/practice/theme";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { getContentMany } from "@/lib/cms";
import { getPageMeta } from "@/lib/page-meta";
import { SS_PAGES_CMS_DEFAULTS, ssPageFieldIds } from "@/lib/ss-pages-cms";
import {
  SS_WELLNESS_PAGE_CMS_FIELD_IDS,
  SS_WELLNESS_PUBLIC_PATH,
  buildSSWellnessCarePlansContent,
} from "@/lib/ss-wellness-care-plans-content";

export const revalidate = 60;

const IDS = [
  ...ssPageFieldIds("ss_wellness_").filter((id) => !SS_WELLNESS_PAGE_CMS_FIELD_IDS.includes(id)),
  "page_ss_wellness_og_title",
  "page_ss_wellness_og_description",
];

async function copy(): Promise<Record<string, string>> {
  const cms = await getContentMany(IDS);
  return Object.fromEntries(IDS.map((id) => [id, cms[id]?.trim() || SS_PAGES_CMS_DEFAULTS[id] || ""]));
}

export async function generateMetadata(): Promise<Metadata> {
  const [meta, x] = await Promise.all([
    getPageMeta("ss_wellness", {
      title: "Wellness Care Plans — Chiropractic Associates, Sulphur Springs, TX",
      description:
        "Chiro-Fitness monthly wellness memberships: adjustments, massage combos, therapy, and rehab sessions at our Sulphur Springs, TX office.",
    }),
    copy(),
  ]);
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: SS_WELLNESS_PUBLIC_PATH,
    ogTitle: x.page_ss_wellness_og_title,
    ogDescription: x.page_ss_wellness_og_description,
  });
}

export default async function SulphurSpringsWellnessCarePlansPage() {
  const [raw, x, displayLocs] = await Promise.all([
    getContentMany([...SS_WELLNESS_PAGE_CMS_FIELD_IDS]),
    copy(),
    getDisplayLocations(),
  ]);
  const content = buildSSWellnessCarePlansContent(raw);
  const ssPhone = displayLocs.sulphur_springs.phonePrimary;

  return (
    <div style={practiceThemeStyle("sulphur-springs")}>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Sulphur Springs", url: "/sulphur-springs" },
          { name: "Wellness care plans", url: SS_WELLNESS_PUBLIC_PATH },
        ]}
      />

      <PageHero
        eyebrow={content.heroEyebrow}
        title={x.ss_wellness_title}
        lede={content.pageLede}
        variant="sulphur"
      />

      <div className="mx-auto max-w-6xl space-y-8 px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          {content.sections.map((section) => (
            <section
              key={section.id}
              className="border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-8"
            >
              <h2 className="text-xl font-black text-[var(--pp-heading)]">{section.title}</h2>
              {section.subtitle ? (
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-stone-500">
                  {section.subtitle}
                </p>
              ) : null}
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-stone-700">
                {section.lines.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pp-accent)]" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-xl font-black text-[var(--pp-heading)]">{content.closingHeadline}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-stone-700">
            {content.closingLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-stone-600">
            {x.ss_wellness_questions_prefix}{" "}
            <Link
              href="/sulphur-springs"
              className="font-bold text-[var(--pp-accent)] underline hover:text-[var(--pp-heading)]"
            >
              {x.ss_wellness_back_link_label}
            </Link>{" "}
            {x.ss_wellness_questions_or_call}{" "}
            <a className="font-bold text-[var(--pp-accent)] underline" href={telHref(ssPhone)}>
              {ssPhone}
            </a>
            .
          </p>
        </section>

        <ScheduleCtaCard
          title={content.ctaTitle}
          body={content.ctaBody}
          bookLabel={x.ss_wellness_book_button}
          query="service=chiropractic&location=sulphur_springs"
          secondary={{ label: `${x.ss_wellness_call_prefix} ${ssPhone}`, href: telHref(ssPhone) }}
          variant="sulphur"
        />
      </div>
    </div>
  );
}
