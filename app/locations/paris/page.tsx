import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getPageMeta } from "@/lib/page-meta";
import { getContentMany } from "@/lib/cms";
import { pageOgDescriptionId, pageOgTitleId, parisText } from "@/lib/paris-pages-cms";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { LocationDetail } from "@/components/LocationDetail";
import { getDisplayLocations, getReviewUrlForLocation } from "@/lib/cms-display";
import { getParisChiroOfficeHours, getParisOfficeHours } from "@/lib/office-hours";
import { chiropractorJsonLd, massageJsonLd } from "@/lib/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  const [meta, og] = await Promise.all([
    getPageMeta("locations_paris", {
      title: "Paris, TX office — Chiropractic Associates & The Rub Club",
      description:
        "Visit our Paris main office at 3305 NE Loop 286, Suite A. Chiropractic Associates and The Rub Club massage share the same address. Free parking, weekday hours.",
    }),
    getContentMany([pageOgTitleId("locations_paris"), pageOgDescriptionId("locations_paris")]),
  ]);
  return buildPageMetadata({
    title: meta.title,
    brandInTitle: true,
    description: meta.description,
    path: "/locations/paris",
    ogTitle: parisText(og, pageOgTitleId("locations_paris")),
    ogDescription: parisText(og, pageOgDescriptionId("locations_paris")),
  });
}

const PARIS_LOCATION_COPY_IDS = [
  "paris_location_eyebrow",
  "paris_location_title_prefix",
  "paris_location_lede",
  "paris_location_hours_label",
  "paris_location_massage_hours_label",
  "paris_location_staff_link_label",
  "paris_location_massage_link_label",
] as const;

export default async function ParisLocationPage() {
  const [reviewUrl, chiroHours, massageHours, displayLocs, copy] = await Promise.all([
    getReviewUrlForLocation("paris"),
    getParisChiroOfficeHours(),
    getParisOfficeHours(),
    getDisplayLocations(),
    getContentMany([...PARIS_LOCATION_COPY_IDS]),
  ]);
  const paris = displayLocs.paris;
  const t = (id: string) => parisText(copy, id);

  return (
    <>
      <JsonLd
        data={[chiropractorJsonLd(paris, chiroHours), massageJsonLd(paris, massageHours)]}
      />
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Locations", url: "/locations/paris" },
          { name: "Paris, TX", url: "/locations/paris" },
        ]}
      />
      <PageHero
        eyebrow={t("paris_location_eyebrow")}
        title={`${t("paris_location_title_prefix")}${paris.streetAddress}`}
        lede={t("paris_location_lede")}
      />
      <LocationDetail
        location={paris}
        reviewUrl={reviewUrl}
        officeHours={chiroHours}
        officeHoursLabel={t("paris_location_hours_label")}
        additionalHours={[{ label: t("paris_location_massage_hours_label"), rows: massageHours }]}
      />
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <p className="text-center text-sm text-stone-600">
          <Link href="/locations/paris/staff" className="font-bold text-[#c0392b] underline">
            {t("paris_location_staff_link_label")}
          </Link>
          {" · "}
          <Link href="/services/massage" className="font-bold text-[#c0392b] underline">
            {t("paris_location_massage_link_label")}
          </Link>
        </p>
      </div>
    </>
  );
}
