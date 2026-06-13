import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { SsMarkdownBody } from "@/components/SsMarkdownBody";
import { practiceThemeStyle } from "@/components/practice/theme";
import { getContentMany } from "@/lib/cms";
import { MASSAGE_PRICES_DEFAULT } from "@/lib/massage-prices-content";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";

export const metadata = buildPageMetadata({
  title: "Massage Prices — Chiropractic Associates, Sulphur Springs, TX",
  description:
    "Massage session rates, add-ons, gift certificate packages, memberships, and Chiro-Fitness pricing in Sulphur Springs, TX.",
  path: "/sulphur-springs/massage/prices",
  ogTitle: "Massage Prices — Sulphur Springs, TX",
});

export const revalidate = 60;

export default async function SulphurSpringsMassagePricesPage() {
  const [c, displayLocs] = await Promise.all([
    getContentMany(["ss_massage_prices_body"]),
    getDisplayLocations(),
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
        eyebrow="Chiropractic Associates · Sulphur Springs, TX"
        title="Massage Prices"
        variant="sulphur"
      />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-10">
          <div className="prose prose-stone max-w-none">
            <SsMarkdownBody body={body} />
          </div>
        </section>
        <ScheduleCtaCard
          title="Book your massage"
          body="Call our Sulphur Springs office and we'll find a time that works for you."
          secondary={{ label: `Call ${ssPhone}`, href: telHref(ssPhone) }}
          variant="sulphur"
        />
      </div>
    </div>
  );
}
