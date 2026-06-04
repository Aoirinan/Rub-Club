import { buildPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { LocationDetail } from "@/components/LocationDetail";
import { LOCATIONS } from "@/lib/constants";
import { getReviewUrlForLocation } from "@/lib/cms-display";
import { getParisOfficeHours } from "@/lib/office-hours";
import { chiropractorJsonLd, massageJsonLd } from "@/lib/structured-data";

export const metadata = buildPageMetadata({
  title: "Paris, TX office — Chiropractic Associates & The Rub Club",
  brandInTitle: true,
  description:
    "Visit our Paris main office at 3305 NE Loop 286, Suite A. Chiropractic Associates and The Rub Club massage share the same address. Free parking, weekday hours.",
  path: "/locations/paris",
  ogTitle: "Paris, TX — Chiropractic & Massage Therapy",
  ogDescription:
    "Main office at 3305 NE Loop 286, Suite A, Paris, TX 75460. Chiropractic Associates and The Rub Club.",
});

export default async function ParisLocationPage() {
  const [reviewUrl, officeHours] = await Promise.all([
    getReviewUrlForLocation("paris"),
    getParisOfficeHours(),
  ]);

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
      <LocationDetail location={LOCATIONS.paris} reviewUrl={reviewUrl} officeHours={officeHours} />
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <p className="text-center text-sm text-stone-600">
          <Link href="/locations/paris/staff" className="font-bold text-[#0f5f5c] underline">
            Meet our Paris office team
          </Link>
          {" · "}
          <Link href="/services/massage" className="font-bold text-[#0f5f5c] underline">
            Meet The Rub Club massage therapists
          </Link>
        </p>
      </div>
    </>
  );
}
