import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { JsonLd } from "@/components/JsonLd";
import { chiropractorJsonLd } from "@/lib/structured-data";
import { pageKeywords } from "@/lib/seo-keywords";
import { getContentMany } from "@/lib/cms";
import { getDisplayLocations } from "@/lib/cms-display";
import { getSulphurOfficeHours } from "@/lib/office-hours";
import { getPageMeta } from "@/lib/page-meta";
import { SS_PAGES_CMS_DEFAULTS } from "@/lib/ss-pages-cms";
import { getUiText } from "@/lib/ui-text";
import { resolveSiteStaffForBrand, siteStaffExistsForBrand } from "@/lib/site-staff";
import { SS_STAFF_SEED } from "@/lib/site-staff-seed-rosters";
import {
  getPracticePage,
  getSSServiceCards,
  listPracticeTestimonials,
} from "@/lib/practice-pages";
import { PatientReviews } from "@/components/practice/PatientReviews";
import { practiceThemeStyle } from "@/components/practice/theme";
import { PracticeHero } from "@/components/practice/PracticeHero";
import { QuickActionsRow } from "@/components/practice/QuickActionsRow";
import { ServicesGrid } from "@/components/practice/ServicesGrid";
import { AboutWelcome } from "@/components/practice/AboutWelcome";
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

export async function generateMetadata(): Promise<Metadata> {
  const [meta, cms] = await Promise.all([
    getPageMeta("ss_home", {
      title: "Sulphur Springs, TX Chiropractor — Chiropractic Associates",
      description:
        "Chiropractic Associates of Sulphur Springs offers chiropractic adjustments, spinal decompression, massage therapy, and rehabilitation at 207 Jefferson St. E. Call 903-919-5020.",
    }),
    getContentMany(["page_ss_home_og_description"]),
  ]);
  return buildPageMetadata({
    title: meta.title,
    brandInTitle: true,
    description: meta.description,
    path: "/sulphur-springs",
    keywords: pageKeywords(["Sulphur Springs chiropractor", "Sulphur Springs massage"]),
    ogDescription:
      cms.page_ss_home_og_description?.trim() || SS_PAGES_CMS_DEFAULTS.page_ss_home_og_description,
  });
}

export default async function SulphurSpringsPage() {
  const [page, ssServiceCards, ssHours, staff, hasAnySsStaff, displayLocs, testimonials, ui] =
    await Promise.all([
      getPracticePage("sulphur-springs"),
      getSSServiceCards(),
      getSulphurOfficeHours(),
      resolveSiteStaffForBrand("sulphur"),
      siteStaffExistsForBrand("sulphur"),
      getDisplayLocations(),
      listPracticeTestimonials("sulphur-springs", { publishedOnly: true }),
      getUiText(),
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
            videos: m.videoUrl ? [{ src: m.videoUrl, label: `${ui.ui_meet_prefix} ${m.name}` }] : [],
          }))
        : hasAnySsStaff
          ? [] // every member hidden on purpose: don't resurrect the built-in doctor
          : [SS_DOCTOR_FALLBACK],
  };

  return (
    <div className="bg-[#f4f2ea]" style={practiceThemeStyle("sulphur-springs", page.theme)}>
      <JsonLd data={chiropractorJsonLd(ss, ssHours)} />
      <PracticeHero data={page.hero} utility={page.utilityBar} />
      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-12">
        <QuickActionsRow data={page.quickActions} />
        {/* Welcome copy sits directly under the hero, as it did on the legacy site. */}
        {page.aboutBlocks.map((block) => (
          <AboutWelcome key={block.id} data={block} phone={ss.phonePrimary} />
        ))}
        <ServicesGrid data={page.servicesGrid} derivedCards={ssServiceCards} />
        {page.teamSections.map((section) => (
          <TeamStrip
            key={section.id}
            data={section}
            members={membersBySource[section.source] ?? []}
          />
        ))}
        <PatientReviews data={page.reviews} testimonials={testimonials} />
        <ExtrasSection extras={page.extras} />
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
      </div>
      <StickyCallBar data={page.stickyCallBar} />
    </div>
  );
}
