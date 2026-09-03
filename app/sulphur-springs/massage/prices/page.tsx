import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { SsMarkdownBody } from "@/components/SsMarkdownBody";
import { practiceThemeStyle } from "@/components/practice/theme";
import { getContentMany } from "@/lib/cms";
import { MASSAGE_PRICES_DEFAULT } from "@/lib/massage-prices-content";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { getPageMeta } from "@/lib/page-meta";
import { SS_PAGES_CMS_DEFAULTS, ssPageFieldIds } from "@/lib/ss-pages-cms";
import { getUiText } from "@/lib/ui-text";

export const revalidate = 60;

const IDS = [...ssPageFieldIds("ss_prices_"), "page_ss_massage_prices_og_title"];

async function copy(): Promise<Record<string, string>> {
  const cms = await getContentMany(IDS);
  return Object.fromEntries(IDS.map((id) => [id, cms[id]?.trim() || SS_PAGES_CMS_DEFAULTS[id] || ""]));
}

export async function generateMetadata(): Promise<Metadata> {
  const [meta, x] = await Promise.all([
    getPageMeta("ss_massage_prices", {
      title: "Massage Prices — Chiropractic Associates, Sulphur Springs, TX",
      description:
        "Massage session rates, add-ons, gift certificate packages, memberships, and Chiro-Fitness pricing in Sulphur Springs, TX.",
    }),
    copy(),
  ]);
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: "/sulphur-springs/massage/prices",
    ogTitle: x.page_ss_massage_prices_og_title,
  });
}

export default async function SulphurSpringsMassagePricesPage() {
  const [c, x, displayLocs, ui] = await Promise.all([
    getContentMany(["ss_massage_prices_body"]),
    copy(),
    getDisplayLocations(),
    getUiText(),
  ]);
  const body = c.ss_massage_prices_body?.trim() || MASSAGE_PRICES_DEFAULT;
  const ssPhone = displayLocs.sulphur_springs.phonePrimary;

  return (
    <div style={practiceThemeStyle("sulphur-springs")}>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Sulphur Springs", url: "/sulphur-springs" },
          { name: "Massage", url: "/sulphur-springs/massage" },
          { name: "Prices", url: "/sulphur-springs/massage/prices" },
        ]}
      />
      <PageHero
        eyebrow={x.ss_prices_eyebrow}
        title={x.ss_prices_title}
        variant="sulphur"
      />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-10">
          <div className="prose prose-stone max-w-none">
            <SsMarkdownBody body={body} />
          </div>
        </section>
        <ScheduleCtaCard
          title={x.ss_prices_cta_heading}
          body={x.ss_prices_cta_body}
          secondary={{ label: `${ui.ui_call_prefix} ${ssPhone}`, href: telHref(ssPhone) }}
          variant="sulphur"
        />
      </div>
    </div>
  );
}
