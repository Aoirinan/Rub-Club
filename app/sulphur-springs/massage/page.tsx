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
import { MASSAGE } from "@/lib/home-verbatim";
import { pageKeywords } from "@/lib/seo-keywords";
import { listActiveSiteStaffForBrand } from "@/lib/site-staff";
import { getSitePhotos } from "@/lib/site-photos-server";
import { ssMassagePhotoFor } from "@/lib/ss-massage-services";
import { serviceJsonLd } from "@/lib/structured-data";
import { siteUrl } from "@/lib/site-content";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Massage Therapy in Sulphur Springs, TX — Chiropractic Associates",
  description:
    "Therapeutic massage to complement chiropractic care in Sulphur Springs, TX. Call 903-919-5020 to ask about availability.",
  path: "/sulphur-springs/massage",
  keywords: pageKeywords(["Sulphur Springs massage", "massage Sulphur Springs TX"]),
  ogDescription:
    "Therapeutic massage in Sulphur Springs, TX — coordinated with your chiropractic care.",
});

/** Sulphur Springs therapists live in the shared staff roster, tagged by job title. */
function isMassageRole(role: string): boolean {
  return /massage/i.test(role);
}

export default async function SulphurSpringsMassagePage() {
  const [c, ssHours, displayLocs, photos, ssStaff] = await Promise.all([
    getContentMany([
      "ss_massage_hero_heading",
      "ss_massage_hero_subheading",
      "ss_massage_intro_body",
      "ss_massage_services_list",
    ]),
    getSulphurOfficeHours(),
    getDisplayLocations(),
    getSitePhotos(),
    listActiveSiteStaffForBrand("sulphur"),
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
        eyebrow="Chiropractic Associates · Sulphur Springs, TX"
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
                alt="A licensed massage therapist working on a client's shoulders"
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
                heading: "Massage services",
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
              Need more than soft-tissue work?{" "}
              <Link href="/sulphur-springs" className="font-bold text-[#2980b9] underline">
                Explore our chiropractic care
              </Link>{" "}
              — our massage and chiropractic teams coordinate care under one roof.
            </p>
          </section>
        ) : null}

        <section className="border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#0c2d3a]">When to get a massage</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-stone-700">{MASSAGE.whenBody}</p>
        </section>

        {therapists.length > 0 ? (
          <MassageTeamGrid
            members={therapists}
            title="Meet the team"
            subtitle="Licensed massage therapists in Sulphur Springs"
            variant="service"
            accent="sulphur"
            footnote={
              <>
                For our chiropractor, front desk, and rehab team, see{" "}
                <Link
                  href="/sulphur-springs/staff"
                  className="font-bold text-[#2980b9] underline"
                >
                  About us — Sulphur Springs
                </Link>
                .
              </>
            }
          />
        ) : null}

        <section className="border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#0c2d3a]">Visit us in Sulphur Springs</h2>
          <p className="mt-3 leading-relaxed text-stone-700">
            {ss.streetAddress} · {ss.addressLocality}, {ss.addressRegion}
          </p>
          <p className="mt-2 text-stone-700">
            Sulphur Springs office:{" "}
            <a className="font-bold text-[#2980b9] underline" href={telHref(ss.phonePrimary)}>
              {ss.phonePrimary}
            </a>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <BookingCta
              label="Request appointment"
              query="service=massage&location=sulphur_springs"
              variant="teal"
            />
            <Link
              href="/sulphur-springs/massage/prices"
              className="focus-ring border-2 border-[#2980b9] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#2980b9] hover:bg-[#0c2d3a]/5"
            >
              View prices
            </Link>
            <Link
              href="/sulphur-springs"
              className="focus-ring border-2 border-[#2980b9] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#2980b9] hover:bg-[#0c2d3a]/5"
            >
              Sulphur Springs chiropractic
            </Link>
          </div>
        </section>

        <LocationHoursSection location={ss} hours={ssHours} accent="#2980b9" />

        <ScheduleCtaCard
          title="Have a question first?"
          body="Our front desk can verify available times and answer questions about specific conditions."
          variant="sulphur"
          secondary={{
            label: `Call ${ss.phonePrimary}`,
            href: telHref(ss.phonePrimary),
          }}
        />
      </div>
    </div>
  );
}
