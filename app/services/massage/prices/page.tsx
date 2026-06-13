import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { SsMarkdownBody } from "@/components/SsMarkdownBody";
import { practiceThemeStyle } from "@/components/practice/theme";
import { getPageBrand } from "@/lib/page-business-theme";
import { getContentMany, DEFAULTS } from "@/lib/cms";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";

export const metadata = buildPageMetadata({
  title: "Massage Prices — The Rub Club, Paris TX",
  description:
    "Massage session rates, add-ons, gift certificate packages, memberships, and Chiro-Fitness pricing at The Rub Club in Paris, TX.",
  path: "/services/massage/prices",
  ogTitle: "Massage Prices — The Rub Club",
});

export const revalidate = 60;

export default async function MassagePricesPage() {
  const [c, displayLocs, brand] = await Promise.all([
    getContentMany(["massage_prices_body"]),
    getDisplayLocations(),
    getPageBrand(),
  ]);
  const body = c.massage_prices_body?.trim() || DEFAULTS.massage_prices_body || "";
  const massagePhone = displayLocs.paris.phoneSecondary ?? displayLocs.paris.phonePrimary;

  return (
    <div style={practiceThemeStyle(brand.loc)}>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Massage", url: "/services/massage" },
          { name: "Prices", url: "/services/massage/prices" },
        ]}
      />
      <PageHero eyebrow="The Rub Club · Paris, TX" title="Massage Prices" variant={brand.variant} />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-10">
          <div className="prose prose-stone max-w-none">
            <SsMarkdownBody body={body} />
          </div>
        </section>
        <ScheduleCtaCard
          title="Book your massage"
          body="Call the massage desk and we'll find a time that works for you."
          secondary={{ label: `Call ${massagePhone}`, href: telHref(massagePhone) }}
          variant={brand.variant}
        />
      </div>
    </div>
  );
}
