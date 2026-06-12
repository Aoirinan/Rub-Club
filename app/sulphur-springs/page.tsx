import { buildPageMetadata } from "@/lib/page-metadata";
import { JsonLd } from "@/components/JsonLd";
import { chiropractorJsonLd } from "@/lib/structured-data";
import { pageKeywords } from "@/lib/seo-keywords";
import { getDisplayLocations } from "@/lib/cms-display";
import { getSulphurOfficeHours } from "@/lib/office-hours";
import { resolveSiteStaffForBrand } from "@/lib/site-staff";
import { SS_STAFF_SEED } from "@/lib/site-staff-seed-rosters";
import {
  getPracticePage,
  getSSServiceCards,
  listPracticeTestimonials,
} from "@/lib/practice-pages";
import { practiceThemeStyle } from "@/components/practice/theme";
import { UtilityBar } from "@/components/practice/UtilityBar";
import { PracticeHero } from "@/components/practice/PracticeHero";
import { QuickActionsRow } from "@/components/practice/QuickActionsRow";
import { ServicesGrid } from "@/components/practice/ServicesGrid";
import { AboutWelcome } from "@/components/practice/AboutWelcome";
import { PatientReviews } from "@/components/practice/PatientReviews";
import { TeamStrip, type PracticeTeamMember } from "@/components/practice/TeamStrip";
import { LocationContactBlock } from "@/components/practice/LocationContactBlock";
import { ExtrasSection } from "@/components/practice/ExtrasSection";
import { StickyCallBar } from "@/components/practice/StickyCallBar";

const SS_DOCTOR_FALLBACK: PracticeTeamMember = {
  name: "Dr. Conner Collins",
  credential: "Chiropractor",
  imageUrl:
    SS_STAFF_SEED.find((m) => m.id === "dr_conner_collins")?.image ||
    "/images/staff-ss/conner-collins.webp",
  bio: SS_STAFF_SEED.find((m) => m.id === "dr_conner_collins")?.bio ?? "",
};

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: "Sulphur Springs, TX Chiropractor — Chiropractic Associates",
  brandInTitle: true,
  description:
    "Chiropractic Associates of Sulphur Springs offers chiropractic adjustments, spinal decompression, massage therapy, and rehabilitation at 207 Jefferson St. E. Call 903-919-5020.",
  path: "/sulphur-springs",
  keywords: pageKeywords(["Sulphur Springs chiropractor", "Sulphur Springs massage"]),
  ogDescription:
    "Chiropractic care, spinal decompression, and massage therapy in Sulphur Springs, TX. Call 903-919-5020.",
});

export default async function SulphurSpringsPage() {
  const [page, testimonials, ssServiceCards, ssHours, staff, displayLocs] = await Promise.all([
    getPracticePage("sulphur-springs"),
    listPracticeTestimonials("sulphur-springs", { publishedOnly: true }),
    getSSServiceCards(),
    getSulphurOfficeHours(),
    resolveSiteStaffForBrand("sulphur"),
    getDisplayLocations(),
  ]);
  const ss = displayLocs.sulphur_springs;

  const membersBySource: Partial<Record<string, PracticeTeamMember[]>> = {
    "ss-staff":
      staff.length > 0
        ? staff.map((m) => ({
            name: m.name,
            credential: m.role,
            imageUrl: m.image ?? "",
            bio: m.bio,
            featured: m.featured,
            videos: m.videoUrl ? [{ src: m.videoUrl, label: `Meet ${m.name}` }] : [],
          }))
        : [SS_DOCTOR_FALLBACK],
  };

  return (
    <div className="bg-[#f4f2ea]" style={practiceThemeStyle("sulphur-springs", page.theme)}>
      <JsonLd data={chiropractorJsonLd(ss)} />
      <UtilityBar data={page.utilityBar} />
      <PracticeHero data={page.hero} utility={page.utilityBar} />
      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-12">
        <QuickActionsRow data={page.quickActions} />
        <ServicesGrid data={page.servicesGrid} derivedCards={ssServiceCards} />
        {page.aboutBlocks.map((block) => (
          <AboutWelcome key={block.id} data={block} phone={ss.phonePrimary} />
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
            name: ss.name,
            phoneLabel: "",
            phone: ss.phonePrimary,
            addressLines: [...ss.addressLines],
            mapsUrl: ss.mapsUrl,
            detailsHref: "",
            detailsLabel: "",
          }}
          hours={ssHours}
        />
        <ExtrasSection extras={page.extras} />
      </div>
      <StickyCallBar data={page.stickyCallBar} />
    </div>
  );
}
