import type { Metadata } from "next";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { LocationDetail } from "@/components/LocationDetail";
import { LOCATIONS } from "@/lib/constants";
import { chiropractorJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Sulphur Springs, TX chiropractor — Chiropractic Associates",
  description:
    "Visit our Sulphur Springs chiropractic office at 207 Jefferson St. E. Adjustments, decompression, and rehab care from Dr. Welborn and the Chiropractic Associates team.",
  alternates: { canonical: "/locations/sulphur-springs" },
  openGraph: {
    title: "Sulphur Springs, TX — Chiropractic Associates",
    description:
      "207 Jefferson St. E, Sulphur Springs, TX. Chiropractic adjustments, decompression, and rehab.",
    url: "/locations/sulphur-springs",
  },
};

export default function SulphurSpringsLocationPage() {
  return (
    <>
      <JsonLd data={chiropractorJsonLd(LOCATIONS.sulphur_springs)} />
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Locations", url: "/locations/sulphur-springs" },
          { name: "Sulphur Springs, TX", url: "/locations/sulphur-springs" },
        ]}
      />
      <PageHero
        eyebrow="Second office · Sulphur Springs, TX"
        title="Sulphur Springs, TX — 207 Jefferson St. E"
        lede="Chiropractic Associates' second location, conveniently located on Jefferson St. E with weekday hours."
      />
      <LocationDetail location={LOCATIONS.sulphur_springs} />
    </>
  );
}
