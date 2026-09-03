import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { LocationDetail } from "@/components/LocationDetail";
import { getContentMany } from "@/lib/cms";
import { getDisplayLocations, getReviewUrlForLocation } from "@/lib/cms-display";
import { getSulphurOfficeHours } from "@/lib/office-hours";
import { getPageMeta } from "@/lib/page-meta";
import { SS_PAGES_CMS_DEFAULTS, ssPageFieldIds } from "@/lib/ss-pages-cms";
import { chiropractorJsonLd } from "@/lib/structured-data";

const IDS = [
  ...ssPageFieldIds("locations_ss_"),
  "page_locations_ss_og_title",
  "page_locations_ss_og_description",
];

async function copy(): Promise<Record<string, string>> {
  const cms = await getContentMany(IDS);
  return Object.fromEntries(IDS.map((id) => [id, cms[id]?.trim() || SS_PAGES_CMS_DEFAULTS[id] || ""]));
}

export async function generateMetadata(): Promise<Metadata> {
  const [meta, x] = await Promise.all([
    getPageMeta("locations_ss", {
      title: "Sulphur Springs, TX chiropractor — Chiropractic Associates",
      description:
        "Visit our Sulphur Springs chiropractic office at 207 Jefferson St. E. Adjustments, decompression, and rehab care from Dr. Conner Collins and the Chiropractic Associates team.",
    }),
    copy(),
  ]);
  return buildPageMetadata({
    title: meta.title,
    brandInTitle: true,
    description: meta.description,
    path: "/locations/sulphur-springs",
    ogTitle: x.page_locations_ss_og_title,
    ogDescription: x.page_locations_ss_og_description,
  });
}

export default async function SulphurSpringsLocationPage() {
  const [reviewUrl, officeHours, displayLocs, x] = await Promise.all([
    getReviewUrlForLocation("sulphur_springs"),
    getSulphurOfficeHours(),
    getDisplayLocations(),
    copy(),
  ]);
  const ss = displayLocs.sulphur_springs;

  return (
    <>
      <JsonLd data={chiropractorJsonLd(ss, officeHours)} />
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Locations", url: "/locations/sulphur-springs" },
          { name: "Sulphur Springs, TX", url: "/locations/sulphur-springs" },
        ]}
      />
      <PageHero
        variant="sulphur"
        eyebrow={x.locations_ss_eyebrow}
        title={`${x.locations_ss_title_prefix} ${ss.streetAddress}`}
        lede={x.locations_ss_lede}
      />
      <LocationDetail location={ss} reviewUrl={reviewUrl} officeHours={officeHours} />
    </>
  );
}
