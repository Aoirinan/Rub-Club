import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { BookingCta } from "@/components/BookingCta";
import { LocationHoursSection } from "@/components/LocationHoursSection";
import { getSulphurOfficeHours } from "@/lib/office-hours";
import { getContentMany, renderRichText } from "@/lib/cms";
import { parseChiroTreatments } from "@/lib/chiro-treatments";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { pageKeywords } from "@/lib/seo-keywords";
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

export default async function SulphurSpringsMassagePage() {
  const [c, ssHours, displayLocs] = await Promise.all([
    getContentMany([
      "ss_massage_hero_heading",
      "ss_massage_hero_subheading",
      "ss_massage_intro_body",
      "ss_massage_services_list",
    ]),
    getSulphurOfficeHours(),
    getDisplayLocations(),
  ]);
  const ss = displayLocs.sulphur_springs;
  const introParagraphs = (c.ss_massage_intro_body ?? "").split(/\n\n+/).filter(Boolean);
  const services = parseChiroTreatments(c.ss_massage_services_list ?? "");

  return (
    <div className="bg-[#f4f2ea]">
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
          <section className="border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10">
            <div className="max-w-3xl space-y-4 leading-relaxed text-stone-700">
              {introParagraphs.map((p, idx) => (
                <p
                  key={`ss-massage-intro-${idx}`}
                  dangerouslySetInnerHTML={{ __html: renderRichText(p) }}
                />
              ))}
            </div>
          </section>
        ) : null}

        {services.length > 0 ? (
          <section className="border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10">
            <h2 className="text-2xl font-black text-[#0c2d3a]">Massage services</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s, idx) => (
                <article
                  key={`${idx}-${s.name}`}
                  className="border border-stone-200 bg-stone-50 p-5 shadow-sm"
                >
                  <h3 className="text-lg font-black text-[#0c2d3a]">{s.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-stone-700">{s.desc}</p>
                </article>
              ))}
            </div>
          </section>
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
              href="/sulphur-springs"
              className="focus-ring border-2 border-[#2980b9] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#2980b9] hover:bg-[#0c2d3a]/5"
            >
              Sulphur Springs chiropractic
            </Link>
          </div>
        </section>

        <LocationHoursSection location={ss} hours={ssHours} accent="#2980b9" />
      </div>
    </div>
  );
}
