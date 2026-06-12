import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { getContentMany } from "@/lib/cms";
import { DOCTOR_CMS_KEYS, doctorVideoItems, getDoctorsForMarketing } from "@/lib/cms-doctors";
import { getSiteOwnerConfig } from "@/lib/site-owner-config";
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
import { getParisOfficeHours } from "@/lib/office-hours";
import { CHIRO } from "@/lib/home-verbatim";
import { getPracticePage, listPracticeTestimonials } from "@/lib/practice-pages";
import { practiceThemeStyle } from "@/components/practice/theme";
import { UtilityBar } from "@/components/practice/UtilityBar";
import { PracticeHero } from "@/components/practice/PracticeHero";
import { QuickActionsRow } from "@/components/practice/QuickActionsRow";
import { ServicesGrid } from "@/components/practice/ServicesGrid";
import { AboutWelcome } from "@/components/practice/AboutWelcome";
import { PatientReviews } from "@/components/practice/PatientReviews";
import { TeamStrip, type PracticeTeamMember } from "@/components/practice/TeamStrip";
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
  const [page, testimonials, parisHours, displayLocs] = await Promise.all([
    getPracticePage("paris-chiro"),
    listPracticeTestimonials("paris-chiro", { publishedOnly: true }),
    getParisOfficeHours(),
    getDisplayLocations(),
  ]);
  const paris = displayLocs.paris;
  const ss = displayLocs.sulphur_springs;

  const doctorCms = await getContentMany([...DOCTOR_CMS_KEYS]);
  let doctorMedia: Awaited<ReturnType<typeof getSiteOwnerConfig>>["doctorMedia"] = [];
  try {
    doctorMedia = (await getSiteOwnerConfig()).doctorMedia;
  } catch {
    doctorMedia = [];
  }
  const doctors = await getDoctorsForMarketing(doctorCms, doctorMedia);
  const membersBySource: Partial<Record<string, PracticeTeamMember[]>> = {
    "paris-doctors": doctors.map((d) => ({
      name: d.name,
      credential: d.role,
      imageUrl: d.imageSrc,
      videos: doctorVideoItems(d),
    })),
  };

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
        <UtilityBar data={page.utilityBar} />
        <Breadcrumbs
          items={serviceBreadcrumbs({ name: "Chiropractic", url: "/services/chiropractic" })}
        />
        <PracticeHero data={page.hero} utility={page.utilityBar} />
        <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-12">
          <QuickActionsRow data={page.quickActions} />
          <ServicesGrid data={page.servicesGrid} />
          {page.aboutBlocks.map((block) => (
            <AboutWelcome key={block.id} data={block} phone={paris.phonePrimary} />
          ))}
          <PatientReviews data={page.reviews} testimonials={testimonials} />
          {page.teamSections.map((section) => (
            <TeamStrip
              key={section.id}
              data={section}
              members={membersBySource[section.source] ?? []}
            />
          ))}
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
          <ExtrasSection extras={page.extras} />
        </div>
        <StickyCallBar data={page.stickyCallBar} />
      </div>
    </>
  );
}
