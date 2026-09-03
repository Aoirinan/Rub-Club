import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { BookingCta } from "@/components/BookingCta";
import { LocationHoursSection } from "@/components/LocationHoursSection";
import { MassageTeamGrid } from "@/components/marketing/MassageTeamGrid";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { ServicesGrid } from "@/components/practice/ServicesGrid";
import { practiceThemeStyle } from "@/components/practice/theme";
import { getSulphurOfficeHours } from "@/lib/office-hours";
import { getContentMany, renderRichText } from "@/lib/cms";
import { parseChiroTreatments } from "@/lib/chiro-treatments";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { getPageMeta } from "@/lib/page-meta";
import { pageKeywords } from "@/lib/seo-keywords";
import { listActiveSiteStaffForBrand } from "@/lib/site-staff";
import { getSitePhotos } from "@/lib/site-photos-server";
import { ssMassagePhotoFor } from "@/lib/ss-massage-services";
import { SS_PAGES_CMS_DEFAULTS, ssPageFieldIds } from "@/lib/ss-pages-cms";
import { serviceJsonLd } from "@/lib/structured-data";
import { siteUrl } from "@/lib/site-content";
import { getUiText } from "@/lib/ui-text";

export const revalidate = 60;

const IDS = [...ssPageFieldIds("ss_massage_"), "page_ss_massage_og_description"];

async function copy(): Promise<Record<string, string>> {
  const cms = await getContentMany(IDS);
  return Object.fromEntries(IDS.map((id) => [id, cms[id]?.trim() || SS_PAGES_CMS_DEFAULTS[id] || ""]));
}

export async function generateMetadata(): Promise<Metadata> {
  const [meta, x] = await Promise.all([
    getPageMeta("ss_massage", {
      title: "Massage Therapy in Sulphur Springs, TX — Chiropractic Associates",
      description:
        "Therapeutic massage to complement chiropractic care in Sulphur Springs, TX. Call 903-919-5020 to ask about availability.",
    }),
    copy(),
  ]);
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: "/sulphur-springs/massage",
    keywords: pageKeywords(["Sulphur Springs massage", "massage Sulphur Springs TX"]),
    ogDescription: x.page_ss_massage_og_description,
  });
}

/** Sulphur Springs therapists live in the shared staff roster, tagged by job title. */
function isMassageRole(role: string): boolean {
  return /massage/i.test(role);
}

export default async function SulphurSpringsMassagePage() {
  const [c, x, ssHours, displayLocs, photos, ssStaff, ui] = await Promise.all([
    getContentMany([
      "ss_massage_hero_heading",
      "ss_massage_hero_subheading",
      "ss_massage_intro_body",
      "ss_massage_services_list",
    ]),
    copy(),
    getSulphurOfficeHours(),
    getDisplayLocations(),
    getSitePhotos(),
    listActiveSiteStaffForBrand("sulphur"),
    getUiText(),
  ]);
  const ss = displayLocs.sulphur_springs;
  const introParagraphs = (c.ss_massage_intro_body ?? "").split(/\n\n+/).filter(Boolean);
  const services = parseChiroTreatments(c.ss_massage_services_list ?? "");
  const therapists = ssStaff
    .filter((m) => isMassageRole(m.role))
    .map((m) => ({
      id: m.id,
      name: m.name,
      bio: m.bio,
      ...(m.role ? { role: m.role } : {}),
      imageSrc: m.image ?? "",
    }))
    .filter((m) => m.imageSrc);

  return (
    <div className="bg-[#f4f2ea]" style={practiceThemeStyle("sulphur-springs")}>
      <JsonLd
        data={serviceJsonLd({
          name: "Massage Therapy",
          description:
            "Therapeutic massage coordinated with chiropractic care in Sulphur Springs, TX.",
          url: siteUrl("/sulphur-springs/massage"),
          serviceType: "Massage Therapy",
          location: ss,
        })}
      />
      <Breadcrumbs
        items={[
          { name: "Sulphur Springs", url: "/sulphur-springs" },
          { name: "Massage", url: "/sulphur-springs/massage" },
        ]}
      />
      <PageHero
        variant="sulphur"
        eyebrow={x.ss_massage_eyebrow}
        title={c.ss_massage_hero_heading}
        lede={c.ss_massage_hero_subheading}
      />

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16">
        {introParagraphs.length > 0 ? (
          <section className="grid gap-10 border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4 leading-relaxed text-stone-700">
              {introParagraphs.map((p, idx) => (
                <p
                  key={`ss-massage-intro-${idx}`}
                  dangerouslySetInnerHTML={{ __html: renderRichText(p) }}
                />
              ))}
            </div>
            <div className="relative aspect-[4/3] overflow-hidden shadow-md lg:min-h-[360px]">
              <Image
                src={photos.ssMassagePatient}
                alt={x.ss_massage_intro_photo_alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </section>
        ) : null}

        {services.length > 0 ? (
          <section className="border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10">
            <ServicesGrid
              data={{
                published: true,
                heading: x.ss_massage_services_heading,
                intro: "",
                mode: "custom",
                cards: services.map((s) => ({
                  name: s.name,
                  blurb: s.desc,
                  imageUrl: ssMassagePhotoFor(s.name, photos),
                  href: "",
                })),
              }}
            />
            <p className="mt-6 text-sm leading-relaxed text-stone-700">
              {x.ss_massage_chiro_link_prefix}{" "}
              <Link href="/sulphur-springs" className="font-bold text-[#2980b9] underline">
                {x.ss_massage_chiro_link_label}
              </Link>{" "}
              {x.ss_massage_chiro_link_suffix}
            </p>
          </section>
        ) : null}

        <section className="border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#0c2d3a]">{x.ss_massage_when_heading}</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-stone-700">{x.ss_massage_when_body}</p>
        </section>

        {therapists.length > 0 ? (
          <MassageTeamGrid
            members={therapists}
            title={x.ss_massage_team_heading}
            subtitle={x.ss_massage_team_subtitle}
            variant="service"
            accent="sulphur"
            footnote={
              <>
                {x.ss_massage_team_footnote_prefix}{" "}
                <Link
                  href="/sulphur-springs/staff"
                  className="font-bold text-[#2980b9] underline"
                >
                  {x.ss_massage_team_footnote_link_label}
                </Link>
                .
              </>
            }
          />
        ) : null}

        <section className="border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#0c2d3a]">{x.ss_massage_visit_heading}</h2>
          <p className="mt-3 leading-relaxed text-stone-700">
            {ss.streetAddress} · {ss.addressLocality}, {ss.addressRegion}
          </p>
          <p className="mt-2 text-stone-700">
            {x.ss_massage_office_label}{" "}
            <a className="font-bold text-[#2980b9] underline" href={telHref(ss.phonePrimary)}>
              {ss.phonePrimary}
            </a>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <BookingCta
              label={x.ss_massage_request_button}
              query="service=massage&location=sulphur_springs"
              variant="teal"
            />
            <Link
              href="/sulphur-springs/massage/prices"
              className="focus-ring border-2 border-[#2980b9] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#2980b9] hover:bg-[#0c2d3a]/5"
            >
              {x.ss_massage_prices_button}
            </Link>
            <Link
              href="/sulphur-springs"
              className="focus-ring border-2 border-[#2980b9] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#2980b9] hover:bg-[#0c2d3a]/5"
            >
              {x.ss_massage_chiro_button}
            </Link>
          </div>
        </section>

        <LocationHoursSection location={ss} hours={ssHours} accent="#2980b9" />

        <ScheduleCtaCard
          title={x.ss_massage_cta_heading}
          body={x.ss_massage_cta_body}
          variant="sulphur"
          secondary={{
            label: `${ui.ui_call_prefix} ${ss.phonePrimary}`,
            href: telHref(ss.phonePrimary),
          }}
        />
      </div>
    </div>
  );
}
