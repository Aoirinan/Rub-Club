import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { SsMarkdownBody } from "@/components/SsMarkdownBody";
import { practiceThemeStyle } from "@/components/practice/theme";
import { getPageBrand } from "@/lib/page-business-theme";
import { getContentMany, DEFAULTS } from "@/lib/cms";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { getPageMeta } from "@/lib/page-meta";
import { getUiText } from "@/lib/ui-text";
import { MASSAGE_PAGE_TEXT_IDS, resolveMassagePageText } from "@/lib/massage-page-cms";

export async function generateMetadata(): Promise<Metadata> {
  const [meta, cms] = await Promise.all([
    getPageMeta("massage_prices", { title: "", description: "" }),
    getContentMany(["massage_prices_og_title"]),
  ]);
  const text = resolveMassagePageText(cms);
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: "/services/massage/prices",
    ogTitle: text.massage_prices_og_title,
  });
}

export const revalidate = 60;

export default async function MassagePricesPage() {
  const [c, displayLocs, brand, ui] = await Promise.all([
    getContentMany(["massage_prices_body", ...MASSAGE_PAGE_TEXT_IDS]),
    getDisplayLocations(),
    getPageBrand(),
    getUiText(),
  ]);
  const text = resolveMassagePageText(c);
  const body = c.massage_prices_body?.trim() || DEFAULTS.massage_prices_body || "";
  const massagePhone = displayLocs.paris.phoneSecondary ?? displayLocs.paris.phonePrimary;

  return (
    <div style={practiceThemeStyle(brand.loc)}>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: text.massage_subpage_breadcrumb, url: "/services/massage" },
          { name: "Prices", url: "/services/massage/prices" },
        ]}
      />
      <PageHero
        eyebrow={text.massage_prices_eyebrow}
        title={text.massage_prices_title}
        variant={brand.variant}
      />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-10">
          <div className="prose prose-stone max-w-none">
            <SsMarkdownBody body={body} />
          </div>
        </section>
        <ScheduleCtaCard
          title={text.massage_prices_cta_title}
          body={text.massage_prices_cta_body}
          secondary={{ label: `${ui.ui_call_prefix} ${massagePhone}`, href: telHref(massagePhone) }}
          variant={brand.variant}
        />
      </div>
    </div>
  );
}
