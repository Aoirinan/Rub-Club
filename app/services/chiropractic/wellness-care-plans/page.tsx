import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getPageMeta } from "@/lib/page-meta";
import { pageOgDescriptionId, pageOgTitleId, parisText } from "@/lib/paris-pages-cms";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { practiceThemeStyle } from "@/components/practice/theme";
import { getPageBrand } from "@/lib/page-business-theme";
import { WELLNESS_CARE_PLANS_PATH, telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { chiropracticWellnessBreadcrumbs } from "@/lib/service-breadcrumbs";
import { getContentMany } from "@/lib/cms";
import {
  WELLNESS_PAGE_CMS_FIELD_IDS,
  buildWellnessCarePlansContent,
} from "@/lib/wellness-care-plans-content";

export async function generateMetadata(): Promise<Metadata> {
  const [meta, og] = await Promise.all([
    getPageMeta("wellness_care_plans", {
      title: "Wellness Care Plans — Chiropractic Associates, Paris, TX",
      description:
        "Chiro-Fitness and Acu-Fit monthly wellness memberships: adjustments, massage combos, therapy, acupuncture, and rehab sessions at our Paris, TX office.",
    }),
    getContentMany([pageOgTitleId("wellness_care_plans"), pageOgDescriptionId("wellness_care_plans")]),
  ]);
  return buildPageMetadata({
    title: meta.title,
    brandInTitle: true,
    description: meta.description,
    path: WELLNESS_CARE_PLANS_PATH,
    ogTitle: parisText(og, pageOgTitleId("wellness_care_plans")),
    ogDescription: parisText(og, pageOgDescriptionId("wellness_care_plans")),
  });
}

const WELLNESS_COPY_IDS = [
  "wellness_page_title",
  "wellness_questions_prefix",
  "wellness_back_link_label",
  "wellness_or_call",
  "wellness_book_label",
  "wellness_call_prefix",
] as const;

export const revalidate = 60;

export default async function WellnessCarePlansPage() {
  const [raw, displayLocs, brand, copy] = await Promise.all([
    getContentMany([...WELLNESS_PAGE_CMS_FIELD_IDS]),
    getDisplayLocations(),
    getPageBrand(),
    getContentMany([...WELLNESS_COPY_IDS]),
  ]);
  const content = buildWellnessCarePlansContent(raw);
  const parisPhone = displayLocs.paris.phonePrimary;
  const t = (id: string) => parisText(copy, id);

  return (
    <div style={practiceThemeStyle(brand.loc)}>
      <Breadcrumbs items={chiropracticWellnessBreadcrumbs(WELLNESS_CARE_PLANS_PATH)} />

      <PageHero
        eyebrow={content.heroEyebrow}
        title={t("wellness_page_title")}
        lede={content.pageLede}
        variant={brand.variant}
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
            {t("wellness_questions_prefix")}{" "}
            <Link
              href="/services/chiropractic"
              className="font-bold text-[var(--pp-accent)] underline hover:text-[var(--pp-heading)]"
            >
              {t("wellness_back_link_label")}
            </Link>{" "}
            {t("wellness_or_call")}{" "}
            <a className="font-bold text-[var(--pp-accent)] underline" href={telHref(parisPhone)}>
              {parisPhone}
            </a>
            .
          </p>
        </section>

        <ScheduleCtaCard
          title={content.ctaTitle}
          body={content.ctaBody}
          bookLabel={t("wellness_book_label")}
          query="service=chiropractic"
          secondary={{ label: `${t("wellness_call_prefix")} ${parisPhone}`, href: telHref(parisPhone) }}
          variant={brand.variant}
        />
      </div>
    </div>
  );
}
