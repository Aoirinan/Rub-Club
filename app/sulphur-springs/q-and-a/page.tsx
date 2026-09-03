import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { LocationHoursSection } from "@/components/LocationHoursSection";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { FaqList } from "@/components/FaqList";
import { telHref } from "@/lib/constants";
import { getContentMany } from "@/lib/cms";
import { getDisplayLocations } from "@/lib/cms-display";
import { getSulphurOfficeHours } from "@/lib/office-hours";
import { getPageMeta } from "@/lib/page-meta";
import { getSulphurSpringsFaqs } from "@/lib/site-faqs";
import { SS_PAGES_CMS_DEFAULTS, ssPageFieldIds } from "@/lib/ss-pages-cms";
import { getUiText } from "@/lib/ui-text";

export const revalidate = 60;

const IDS = [...ssPageFieldIds("ss_q_and_a_"), "page_ss_q_and_a_og_title"];

async function copy(): Promise<Record<string, string>> {
  const cms = await getContentMany(IDS);
  return Object.fromEntries(IDS.map((id) => [id, cms[id]?.trim() || SS_PAGES_CMS_DEFAULTS[id] || ""]));
}

export async function generateMetadata(): Promise<Metadata> {
  const [meta, x] = await Promise.all([
    getPageMeta("ss_q_and_a", {
      title: "Q & A — Sulphur Springs Chiropractic",
      description:
        "Frequently asked questions about chiropractic care at Chiropractic Associates of Sulphur Springs.",
    }),
    copy(),
  ]);
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: "/sulphur-springs/q-and-a",
    ogTitle: x.page_ss_q_and_a_og_title,
  });
}

export default async function QAndAPage() {
  const [faqs, x, ssHours, displayLocs, ui] = await Promise.all([
    getSulphurSpringsFaqs(),
    copy(),
    getSulphurOfficeHours(),
    getDisplayLocations(),
    getUiText(),
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
        variant="sulphur"
        eyebrow={x.ss_q_and_a_eyebrow}
        title={x.ss_q_and_a_title}
      />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10">
          <FaqList entries={faqs} />
        </section>
        <LocationHoursSection location={ss} hours={ssHours} accent="#2980b9" />
        <ScheduleCtaCard
          variant="sulphur"
          title={x.ss_q_and_a_cta_heading}
          body={x.ss_q_and_a_cta_body}
          secondary={{ label: `${ui.ui_call_prefix} ${ss.phonePrimary}`, href: telHref(ss.phonePrimary) }}
        />
      </div>
    </>
  );
}
