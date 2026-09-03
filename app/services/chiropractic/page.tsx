import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getPageMeta } from "@/lib/page-meta";
import { getContentMany } from "@/lib/cms";
import { pageOgDescriptionId, pageOgTitleId, parisText } from "@/lib/paris-pages-cms";
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
  const [booking, meta, og] = await Promise.all([
    getPublicBookingConfig(),
    getPageMeta("chiropractic", {
      title: "Chiropractor in Paris, TX — Chiropractic Associates",
      description:
        "Chiropractic adjustments, spinal decompression, rehab, and acupuncture in Paris, TX. {schedule} — family-owned since 1998.",
    }),
    getContentMany([pageOgTitleId("chiropractic"), pageOgDescriptionId("chiropractic")]),
  ]);
  const phrase = scheduleMetaPhrase(isPublicBookingEnabled(booking));
  const fill = (s: string) => s.replace("{schedule}", phrase);
  return buildPageMetadata({
    title: meta.title,
    brandInTitle: true,
    description: fill(meta.description),
    path: "/services/chiropractic",
    keywords: pageKeywords(["Paris TX chiropractor", "chiropractic Paris Texas"]),
    ogTitle: parisText(og, pageOgTitleId("chiropractic")),
    ogDescription: fill(parisText(og, pageOgDescriptionId("chiropractic"))),
  });
}

const CHIRO_COPY_IDS = [
  "chiro_location_phone_label",
  "chiro_location_details_label",
  "chiro_second_location_title",
  "chiro_second_location_link_label",
] as const;

export const revalidate = 60;

export default async function ChiropracticServicePage() {
  const [page, parisHours, displayLocs, copy] = await Promise.all([
    getPracticePage("paris-chiro"),
    getParisChiroOfficeHours(),
    getDisplayLocations(),
    getContentMany([...CHIRO_COPY_IDS]),
  ]);
  const paris = displayLocs.paris;
  const ss = displayLocs.sulphur_springs;
  const t = (id: string) => parisText(copy, id);

  const secondaryLocations: PracticeSecondaryLocation[] = [
    {
      title: t("chiro_second_location_title"),
      lines: [...ss.addressLines],
      phone: ss.phonePrimary,
      href: "/sulphur-springs",
      hrefLabel: t("chiro_second_location_link_label"),
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          chiropractorJsonLd(paris, parisHours),
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
              phoneLabel: t("chiro_location_phone_label"),
              phone: paris.phonePrimary,
              addressLines: [...paris.addressLines],
              mapsUrl: paris.mapsUrl,
              detailsHref: `/locations/${paris.slug}`,
              detailsLabel: t("chiro_location_details_label"),
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
