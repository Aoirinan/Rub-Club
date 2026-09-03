import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { LocationHoursSection } from "@/components/LocationHoursSection";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { getSSPatientResourcesIntro, getSSResourceArticleTitles } from "@/lib/ss-cms-content";
import { telHref } from "@/lib/constants";
import { getContentMany } from "@/lib/cms";
import { getDisplayLocations } from "@/lib/cms-display";
import { getSulphurOfficeHours } from "@/lib/office-hours";
import { getPageMeta } from "@/lib/page-meta";
import { SS_PAGES_CMS_DEFAULTS, parseLabelUrlLines, ssPageFieldIds } from "@/lib/ss-pages-cms";
import { getUiText } from "@/lib/ui-text";

export const revalidate = 60;

const IDS = [
  ...ssPageFieldIds("ss_patient_resources_").filter((id) => id !== "ss_patient_resources_intro"),
  "page_ss_patient_resources_og_title",
];

async function copy(): Promise<Record<string, string>> {
  const cms = await getContentMany(IDS);
  return Object.fromEntries(IDS.map((id) => [id, cms[id]?.trim() || SS_PAGES_CMS_DEFAULTS[id] || ""]));
}

export async function generateMetadata(): Promise<Metadata> {
  const [meta, x] = await Promise.all([
    getPageMeta("ss_patient_resources", {
      title: "Patient Resources — Sulphur Springs Chiropractic",
      description:
        "Chiropractic patient resources, helpful links, and educational topics from Chiropractic Associates of Sulphur Springs.",
    }),
    copy(),
  ]);
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: "/sulphur-springs/patient-resources",
    ogTitle: x.page_ss_patient_resources_og_title,
  });
}

export default async function PatientResourcesPage() {
  const [intro, articles, x, ssHours, displayLocs, ui] = await Promise.all([
    getSSPatientResourcesIntro(),
    getSSResourceArticleTitles(),
    copy(),
    getSulphurOfficeHours(),
    getDisplayLocations(),
    getUiText(),
  ]);
  const ss = displayLocs.sulphur_springs;
  const links = parseLabelUrlLines(x.ss_patient_resources_links);
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Sulphur Springs", url: "/sulphur-springs" },
          { name: "Patient Resources", url: "/sulphur-springs/patient-resources" },
        ]}
      />
      <PageHero
        variant="sulphur"
        eyebrow={x.ss_patient_resources_eyebrow}
        title={x.ss_patient_resources_title}
      />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10">
          <div className="prose prose-stone max-w-none">
            <p className="leading-relaxed text-stone-700">{intro}</p>

            <h2 className="mt-8 text-xl font-black text-[#0c2d3a]">
              {x.ss_patient_resources_about_heading}
            </h2>
            <p className="leading-relaxed text-stone-700">
              {x.ss_patient_resources_about_lede}
            </p>
            <ul className="list-disc space-y-2 pl-6">
              {articles.map((article) => (
                <li key={article.slug}>
                  <Link
                    href={`/sulphur-springs/${article.slug}`}
                    className="font-bold text-[#2980b9] underline hover:text-[#0c2d3a]"
                  >
                    {article.title}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="mt-8 text-xl font-black text-[#0c2d3a]">
              {x.ss_patient_resources_links_heading}
            </h2>
            <ul className="list-disc space-y-2 pl-6">
              {links.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#2980b9] underline hover:text-[#0c2d3a]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <LocationHoursSection location={ss} hours={ssHours} accent="#2980b9" />
        <ScheduleCtaCard
          variant="sulphur"
          title={x.ss_patient_resources_cta_heading}
          body={x.ss_patient_resources_cta_body}
          secondary={{ label: `${ui.ui_call_prefix} ${ss.phonePrimary}`, href: telHref(ss.phonePrimary) }}
        />
      </div>
    </>
  );
}
