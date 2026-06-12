import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { LocationDetail } from "@/components/LocationDetail";
import { getDisplayLocations, getReviewUrlForLocation } from "@/lib/cms-display";
import { getSulphurOfficeHours } from "@/lib/office-hours";
import { chiropractorJsonLd } from "@/lib/structured-data";

export const metadata = buildPageMetadata({
  title: "Sulphur Springs, TX chiropractor — Chiropractic Associates",
  brandInTitle: true,
  description:
    "Visit our Sulphur Springs chiropractic office at 207 Jefferson St. E. Adjustments, decompression, and rehab care from Dr. Conner Collins and the Chiropractic Associates team.",
  path: "/locations/sulphur-springs",
  ogTitle: "Sulphur Springs, TX — Chiropractic Associates",
  ogDescription:
    "207 Jefferson St. E, Sulphur Springs, TX. Chiropractic adjustments, decompression, and rehab.",
});

export default async function SulphurSpringsLocationPage() {
  const [reviewUrl, officeHours, displayLocs] = await Promise.all([
    getReviewUrlForLocation("sulphur_springs"),
    getSulphurOfficeHours(),
    getDisplayLocations(),
  ]);
  const ss = displayLocs.sulphur_springs;

  return (
    <>
      <JsonLd data={chiropractorJsonLd(ss)} />
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Locations", url: "/locations/sulphur-springs" },
          { name: "Sulphur Springs, TX", url: "/locations/sulphur-springs" },
        ]}
      />
      <PageHero
        variant="sulphur"
        eyebrow="Second office · Sulphur Springs, TX"
        title={`Sulphur Springs, TX — ${ss.streetAddress}`}
        lede="Chiropractic Associates' second location, conveniently located on Jefferson St. E with weekday hours."
      />
      <LocationDetail location={ss} reviewUrl={reviewUrl} officeHours={officeHours} />
    </>
  );
}
