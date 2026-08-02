import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import {
  getPublicBookingConfig,
  isPublicBookingEnabled,
  scheduleMetaPhrase,
} from "@/lib/public-booking-settings";
import { serviceBreadcrumbs } from "@/lib/service-breadcrumbs";
import { chiropractorJsonLd, serviceJsonLd } from "@/lib/structured-data";
import { siteUrl } from "@/lib/site-content";
import { pageKeywords } from "@/lib/seo-keywords";
import { getDisplayLocations } from "@/lib/cms-display";
import { getParisChiroOfficeHours } from "@/lib/office-hours";
import { CHIRO } from "@/lib/home-verbatim";
import { getPracticePage } from "@/lib/practice-pages";
import { practiceThemeStyle } from "@/components/practice/theme";
import { PracticeHero } from "@/components/practice/PracticeHero";
import { QuickActionsRow } from "@/components/practice/QuickActionsRow";
import { ServicesGrid } from "@/components/practice/ServicesGrid";
import { AboutWelcome } from "@/components/practice/AboutWelcome";
// CURSOR_PROMPT §8a: PatientReviews intentionally not rendered on the
// chiropractic page (component retained in the repo for other pages).
import {
  LocationContactBlock,
  type PracticeSecondaryLocation,
} from "@/components/practice/LocationContactBlock";
import { ExtrasSection } from "@/components/practice/ExtrasSection";
import { StickyCallBar } from "@/components/practice/StickyCallBar";

export async function generateMetadata(): Promise<Metadata> {
  const booking = await getPublicBookingConfig();
  const phrase = scheduleMetaPhrase(isPublicBookingEnabled(booking));
  return buildPageMetadata({
    title: "Chiropractor in Paris, TX — Chiropractic Associates",
    brandInTitle: true,
    description: `Chiropractic adjustments, spinal decompression, rehab, and acupuncture in Paris, TX. ${phrase} — family-owned since 1998.`,
    path: "/services/chiropractic",
    keywords: pageKeywords(["Paris TX chiropractor", "chiropractic Paris Texas"]),
    ogTitle: "Chiropractor in Paris, TX",
    ogDescription: `Adjustments, decompression, rehab, and acupuncture at Chiropractic Associates in Paris. ${phrase}.`,
  });
}

export const revalidate = 60;

export default async function ChiropracticServicePage() {
  const [page, parisHours, displayLocs] = await Promise.all([
    getPracticePage("paris-chiro"),
    getParisChiroOfficeHours(),
    getDisplayLocations(),
  ]);
  const paris = displayLocs.paris;
  const ss = displayLocs.sulphur_springs;

  const secondaryLocations: PracticeSecondaryLocation[] = [
    {
      title: CHIRO.secondLocationTitle,
      lines: [...ss.addressLines],
      phone: ss.phonePrimary,
      href: "/sulphur-springs",
      hrefLabel: "Sulphur Springs details & hours",
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          chiropractorJsonLd(paris),
          serviceJsonLd({
            name: "Chiropractic Care",
            description:
              "Adjustments, spinal decompression, rehab exercises, electric stim, and acupuncture for back, neck, sciatica, and auto injuries.",
            url: siteUrl("/services/chiropractic"),
            serviceType: "Chiropractic",
            location: paris,
          }),
        ]}
      />
      <div style={practiceThemeStyle("paris-chiro", page.theme)}>
        <Breadcrumbs
          items={serviceBreadcrumbs({ name: "Chiropractic", url: "/services/chiropractic" })}
        />
        <PracticeHero data={page.hero} utility={page.utilityBar} />
        <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-12">
          <QuickActionsRow data={page.quickActions} />
          {/* "Our Paris chiropractors" section intentionally omitted — the
              doctors already appear on /about (and /locations/paris/staff). */}
          <ServicesGrid data={page.servicesGrid} />
          {page.aboutBlocks.map((block) => (
            <AboutWelcome key={block.id} data={block} phone={paris.phonePrimary} />
          ))}
          {/* CURSOR_PROMPT §8a: reviews section removed from the chiropractic page. */}
          <ExtrasSection extras={page.extras} />
          <LocationContactBlock
            data={page.locationBlock}
            location={{
              name: paris.name,
              phoneLabel: "Chiropractic",
              phone: paris.phonePrimary,
              addressLines: [...paris.addressLines],
              mapsUrl: paris.mapsUrl,
              detailsHref: `/locations/${paris.slug}`,
              detailsLabel: "Paris details & hours",
            }}
            hours={parisHours}
            secondaryLocations={secondaryLocations}
          />
        </div>
        <StickyCallBar data={page.stickyCallBar} />
      </div>
    </>
  );
}
