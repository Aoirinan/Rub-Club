import type { Metadata } from "next";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { LocationDetail } from "@/components/LocationDetail";
import { LOCATIONS } from "@/lib/constants";
import { chiropractorJsonLd, massageJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Paris, TX office — Chiropractic Associates & The Rub Club",
  description:
    "Visit our Paris main office at 3305 NE Loop 286, Suite A. Chiropractic Associates and The Rub Club massage share the same address. Free parking, weekday hours.",
  alternates: { canonical: "/locations/paris" },
  openGraph: {
    title: "Paris, TX — Chiropractic & Massage Therapy",
    description:
      "Main office at 3305 NE Loop 286, Suite A, Paris, TX 75460. Chiropractic Associates and The Rub Club.",
    url: "/locations/paris",
  },
};

export default function ParisLocationPage() {
  return (
    <>
      <JsonLd
        data={[chiropractorJsonLd(LOCATIONS.paris), massageJsonLd()]}
      />
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Locations", url: "/locations/paris" },
          { name: "Paris, TX", url: "/locations/paris" },
        ]}
      />
      <PageHero
        eyebrow="Main office · Paris, TX"
        title="Paris, TX — 3305 NE Loop 286, Suite A"
        lede="Both Chiropractic Associates and The Rub Club operate from this address. Easy parking, friendly front desk, weekday hours."
      />
      <LocationDetail location={LOCATIONS.paris} />
    </>
  );
}
