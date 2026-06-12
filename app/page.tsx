import Link from "next/link";
import { Fragment } from "react";
import { buildPageMetadata } from "@/lib/page-metadata";
import { JsonLd } from "@/components/JsonLd";
import { HomeVideo } from "@/components/HomeVideo";
import { FaqList } from "@/components/FaqList";
import { MassageTeamGrid } from "@/components/marketing/MassageTeamGrid";
import { TestimonialVideosSection } from "@/components/TestimonialVideosSection";
import { AdjustmentsInActionSection } from "@/components/AdjustmentsInActionSection";
import { ChiropracticDoctorCard } from "@/components/ChiropracticDoctorCard";
import {
  chiropractorJsonLd,
  faqPageJsonLd,
  massageJsonLd,
} from "@/lib/structured-data";
import { getContentMany, renderRichText } from "@/lib/cms";
import { DOCTOR_CMS_KEYS, doctorVideoItems, getDoctorsForMarketing } from "@/lib/cms-doctors";
import { CHIRO, CHIRO_INTRO_VIDEO_SRC } from "@/lib/home-verbatim";
import { getMassageTeamForMarketing } from "@/lib/massage-team";
import { getLayoutCmsContent } from "@/lib/cms-display";
import { getParisOfficeHours } from "@/lib/office-hours";
import { getActiveFaqs } from "@/lib/site-faqs";
import { getSiteOwnerConfig } from "@/lib/site-owner-config";
import { mergedDisplayLocations } from "@/lib/site-display-overrides";
import { siteDescription, siteTitle } from "@/lib/site-content";
import { pageKeywords } from "@/lib/seo-keywords";
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

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: siteTitle,
  brandInTitle: true,
  description: siteDescription,
  path: "/",
  keywords: pageKeywords(),
});

export default async function Home() {
  const [page, testimonials, parisHours, cmsLayout, homeFaqs] = await Promise.all([
    getPracticePage("paris-home"),
    listPracticeTestimonials("paris-home", { publishedOnly: true }),
    getParisOfficeHours(),
    getLayoutCmsContent(),
    getActiveFaqs().then((faqs) => faqs.slice(0, 5)),
  ]);
  const c = await getContentMany(["home_awards_text", ...DOCTOR_CMS_KEYS]);

  let displayLocs = mergedDisplayLocations(undefined, cmsLayout);
  let awardsHtml: string | null = null;
  let doctorMedia: Awaited<ReturnType<typeof getSiteOwnerConfig>>["doctorMedia"] = [];
  try {
    const cfg = await getSiteOwnerConfig();
    displayLocs = mergedDisplayLocations(cfg.editableCopy, cmsLayout);
    const a = cfg.editableCopy.awardsStripHtml.trim();
    if (a) awardsHtml = a;
    doctorMedia = cfg.doctorMedia;
  } catch {
    /* keep defaults */
  }
  const paris = displayLocs.paris;
  const ss = displayLocs.sulphur_springs;

  const [massageTeam, doctors] = await Promise.all([
    getMassageTeamForMarketing(),
    getDoctorsForMarketing(c, doctorMedia),
  ]);

  const membersBySource: Partial<Record<string, PracticeTeamMember[]>> = {
    "paris-doctors": doctors.map((d) => ({
      name: d.name,
      credential: d.role,
      imageUrl: d.imageSrc,
      videos: doctorVideoItems(d),
    })),
    "rub-club-team": massageTeam.map((m) => ({
      name: m.name,
      credential: m.role ?? "",
      imageUrl: m.imageSrc,
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
    <div className="bg-[#f4f2ea]" style={practiceThemeStyle("paris-home", page.theme)}>
      <JsonLd
        data={[
          chiropractorJsonLd(paris),
          chiropractorJsonLd(ss),
          massageJsonLd(paris),
          faqPageJsonLd(homeFaqs),
        ]}
      />
      <UtilityBar data={page.utilityBar} />
      <PracticeHero data={page.hero} utility={page.utilityBar} headingTag="h1" />

      <div className="bg-[#fff7d7] py-3 text-center text-sm text-[#5a4a15]">
        {awardsHtml ? (
          <div
            className="mx-auto max-w-4xl px-2 [&_a]:font-bold [&_a]:text-[#5a4a15] [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: awardsHtml }}
          />
        ) : (
          <>{c.home_awards_text}</>
        )}
      </div>

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-12">
        <QuickActionsRow data={page.quickActions} />
        <ServicesGrid data={page.servicesGrid} />

        {page.aboutBlocks.map((block, i) => (
          <Fragment key={block.id || i}>
            <AboutWelcome data={block} phone={paris.phonePrimary} />
            {i === 0 && block.published ? (
              <section className="border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-10">
                <HomeVideo src={CHIRO_INTRO_VIDEO_SRC} heading={CHIRO.introVideoHeading} />
              </section>
            ) : null}
          </Fragment>
        ))}

        <TestimonialVideosSection />
        <PatientReviews data={page.reviews} testimonials={testimonials} />

        {page.teamSections.map((section) => {
          if (!section.published) return null;
          if (section.source === "paris-doctors" && section.variant === "expanded") {
            return (
              <Fragment key={section.id}>
                <section
                  id="our-chiropractors"
                  className="scroll-mt-32 border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-10"
                >
                  {section.heading.trim() ? (
                    <h2 className="text-center text-3xl font-black text-[var(--pp-heading)]">
                      {section.heading}
                    </h2>
                  ) : null}
                  {section.intro.trim() ? (
                    <p
                      className="mx-auto mt-4 max-w-3xl text-center leading-relaxed text-stone-700 [&_a]:font-bold [&_a]:text-[var(--pp-accent)] [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: renderRichText(section.intro) }}
                    />
                  ) : null}
                  <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                    {doctors.map((member) => (
                      <ChiropracticDoctorCard
                        key={member.name}
                        name={member.name}
                        role={member.role}
                        bio={member.bio}
                        imageSrc={member.imageSrc}
                        videoUrl={member.videoUrl}
                        videoFile={member.videoFile}
                        actionVideos={member.actionVideos}
                      />
                    ))}
                  </div>
                </section>
                <AdjustmentsInActionSection />
              </Fragment>
            );
          }
          if (section.source === "rub-club-team") {
            return (
              <MassageTeamGrid
                key={section.id}
                members={massageTeam}
                title={section.heading}
                subtitle={section.intro}
                variant="home"
                footnote={
                  section.linkUrl.trim() ? (
                    <>
                      Titles here reflect massage therapy roles. Insurance, personal injury,
                      front desk, and other Paris office roles are on{" "}
                      <Link
                        href={section.linkUrl}
                        className="font-bold text-[var(--pp-accent)] underline"
                      >
                        our Paris office team page
                      </Link>
                      .
                    </>
                  ) : undefined
                }
              />
            );
          }
          return (
            <TeamStrip
              key={section.id}
              data={section}
              members={membersBySource[section.source] ?? []}
            />
          );
        })}

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

        <section
          aria-labelledby="home-faq"
          className="border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="home-faq" className="text-2xl font-black text-[var(--pp-heading)]">
              Frequently asked questions
            </h2>
            <Link
              href="/faq"
              className="focus-ring text-sm font-bold text-[var(--pp-accent)] underline"
            >
              See all FAQs
            </Link>
          </div>
          <div className="mt-4">
            <FaqList entries={homeFaqs} />
          </div>
        </section>

        <ExtrasSection extras={page.extras} />
      </div>
      <StickyCallBar data={page.stickyCallBar} />
    </div>
  );
}
