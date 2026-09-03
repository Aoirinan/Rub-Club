import Image from "next/image";
import Link from "next/link";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { MassageTeamGrid } from "@/components/marketing/MassageTeamGrid";
import { ServicesGrid } from "@/components/practice/ServicesGrid";
import { BookingCta } from "@/components/BookingCta";
import { renderRichText } from "@/lib/cms";
import { massageServicePagesWithCms } from "@/lib/massage-services";
import type { MassagePageText } from "@/lib/massage-page-cms";
import type { MassageTeamCard } from "@/lib/massage-team-data";
import type { SitePhotos } from "@/lib/site-photos";
import type { UiText } from "@/lib/ui-text-cms";
import { telHref, type LocationInfo } from "@/lib/constants";

export type MassagePageData = {
  introParagraphs: string[];
  massageTeam: MassageTeamCard[];
  paris: LocationInfo;
  photos: SitePhotos;
  /** Raw CMS values (card names/blurbs live here). */
  cms: Partial<Record<string, string>>;
  /** Page-level copy with defaults applied. */
  text: MassagePageText;
  /** Site-wide labels ("Meet the team", "Massage desk:", "Call"). */
  ui: UiText;
};

export function MassagePageBlock({ id, data }: { id: string; data: MassagePageData }) {
  const { text, ui } = data;
  const massagePhone = data.paris.phoneSecondary ?? data.paris.phonePrimary;
  switch (id) {
    case "intro":
      return (
        <section className="grid gap-10 border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <h2 className="text-3xl font-black text-[#4a1515]">{text.massage_intro_title}</h2>
            {data.introParagraphs.map((p) => (
              <p
                key={p.slice(0, 40)}
                className="leading-relaxed text-stone-700"
                dangerouslySetInnerHTML={{ __html: renderRichText(p) }}
              />
            ))}
          </div>
          <div className="relative aspect-[4/3] overflow-hidden shadow-md lg:min-h-[360px]">
            <Image
              src={data.photos.massagePatient}
              alt={text.massage_intro_photo_alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </section>
      );
    case "services":
      // CURSOR_PROMPT §6a: clickable cards, one per massage service, each linking
      // to its verbatim /services/massage/<slug> page. Same card component as §4.
      return (
        <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
          <ServicesGrid
            data={{
              published: true,
              heading: text.massage_services_heading,
              intro: "",
              mode: "custom",
              cards: massageServicePagesWithCms(data.cms, data.photos).map((s) => ({
                name: s.name,
                blurb: s.blurb,
                imageUrl: s.imageUrl,
                href: `/services/massage/${s.slug}`,
              })),
            }}
          />
          <p className="mt-6 text-sm leading-relaxed text-stone-700">
            {text.massage_services_crosslink_before}{" "}
            <Link href="/services/chiropractic" className="font-bold text-[#c0392b] underline">
              {text.massage_services_crosslink_label}
            </Link>{" "}
            {text.massage_services_crosslink_after}
          </p>
        </section>
      );
    case "when_to":
      return (
        <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#4a1515]">{text.massage_when_heading}</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-stone-700">{text.massage_when_body}</p>
        </section>
      );
    case "team":
      return (
        <MassageTeamGrid
          members={data.massageTeam}
          title={ui.ui_meet_the_team}
          subtitle={text.massage_team_subtitle}
          variant="service"
          footnote={
            <>
              {text.massage_team_footnote_before}{" "}
              <Link href="/locations/paris/staff" className="font-bold text-[#c0392b] underline">
                {text.massage_team_footnote_link}
              </Link>
              .
            </>
          }
        />
      );
    case "visit":
      return (
        <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#4a1515]">{text.massage_visit_heading}</h2>
          <p className="mt-3 leading-relaxed text-stone-700">
            {data.paris.streetAddress} {text.massage_visit_city_suffix}
          </p>
          <p className="mt-2 text-stone-700">
            {ui.ui_massage_desk_label}{" "}
            <a className="font-bold text-[#c0392b] underline" href={telHref(massagePhone)}>
              {massagePhone}
            </a>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <BookingCta
              label={text.massage_visit_book_label}
              query="service=massage&location=paris"
              variant="teal"
            />
            <Link
              href="/services/massage/prices"
              className="focus-ring border-2 border-[#c0392b] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#c0392b] hover:bg-[#4a1515]/5"
            >
              {text.massage_visit_prices_label}
            </Link>
            <Link
              href="/patient-forms"
              className="focus-ring border-2 border-[#c0392b] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#c0392b] hover:bg-[#4a1515]/5"
            >
              {text.massage_visit_form_label}
            </Link>
          </div>
        </section>
      );
    case "schedule_cta":
      return (
        <ScheduleCtaCard
          title={text.massage_cta_title}
          body={text.massage_cta_body}
          query="service=massage"
          secondary={{
            label: `${ui.ui_call_prefix} ${massagePhone}`,
            href: telHref(massagePhone),
          }}
        />
      );
    default:
      return null;
  }
}
