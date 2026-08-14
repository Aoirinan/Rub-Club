import Image from "next/image";
import Link from "next/link";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { MassageTeamGrid } from "@/components/marketing/MassageTeamGrid";
import { ServicesGrid } from "@/components/practice/ServicesGrid";
import { BookingCta } from "@/components/BookingCta";
import { renderRichText } from "@/lib/cms";
import { MASSAGE } from "@/lib/home-verbatim";
import { massageServicePagesWithPhotos } from "@/lib/massage-services";
import type { MassageTeamCard } from "@/lib/massage-team-data";
import type { SitePhotos } from "@/lib/site-photos";
import { telHref, type LocationInfo } from "@/lib/constants";

export type MassagePageData = {
  introParagraphs: string[];
  serviceLines: string[];
  massageTeam: MassageTeamCard[];
  paris: LocationInfo;
  photos: SitePhotos;
};

export function MassagePageBlock({ id, data }: { id: string; data: MassagePageData }) {
  switch (id) {
    case "intro":
      return (
        <section className="grid gap-10 border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <h2 className="text-3xl font-black text-[#4a1515]">{MASSAGE.stressTitle}</h2>
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
              alt="A licensed massage therapist working on a client's shoulders at The Rub Club"
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
              heading: "Services we offer",
              intro: "",
              mode: "custom",
              cards: massageServicePagesWithPhotos(data.photos).map((s) => ({
                name: s.name,
                blurb: s.blurb,
                imageUrl: s.imageUrl,
                href: `/services/massage/${s.slug}`,
              })),
            }}
          />
          <p className="mt-6 text-sm leading-relaxed text-stone-700">
            Need more than soft-tissue work?{" "}
            <Link href="/services/chiropractic" className="font-bold text-[#c0392b] underline">
              Explore our chiropractic care
            </Link>{" "}
            — our massage and chiropractic teams coordinate care under one roof.
          </p>
        </section>
      );
    case "when_to":
      return (
        <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#4a1515]">When to get a massage</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-stone-700">{MASSAGE.whenBody}</p>
        </section>
      );
    case "team":
      return (
        <MassageTeamGrid
          members={data.massageTeam}
          title="Meet the team"
          subtitle="Licensed massage therapists at The Rub Club"
          variant="service"
          footnote={
            <>
              For insurance coordination, personal injury case management, and other Paris office
              roles, see{" "}
              <Link href="/locations/paris/staff" className="font-bold text-[#c0392b] underline">
                About us — Paris office
              </Link>
              .
            </>
          }
        />
      );
    case "visit":
      return (
        <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#4a1515]">Visit us in Paris</h2>
          <p className="mt-3 leading-relaxed text-stone-700">
            {data.paris.streetAddress} · Paris, TX
          </p>
          <p className="mt-2 text-stone-700">
            Massage desk:{" "}
            <a
              className="font-bold text-[#c0392b] underline"
              href={telHref(data.paris.phoneSecondary ?? data.paris.phonePrimary)}
            >
              {data.paris.phoneSecondary ?? data.paris.phonePrimary}
            </a>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <BookingCta label="Book massage" query="service=massage&location=paris" variant="teal" />
            <Link
              href="/services/massage/prices"
              className="focus-ring border-2 border-[#c0392b] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#c0392b] hover:bg-[#4a1515]/5"
            >
              View prices
            </Link>
            <Link
              href="/patient-forms"
              className="focus-ring border-2 border-[#c0392b] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#c0392b] hover:bg-[#4a1515]/5"
            >
              New-client form
            </Link>
          </div>
        </section>
      );
    case "schedule_cta":
      return (
        <ScheduleCtaCard
          title="Have a question first?"
          body="The massage desk can verify available times and answer questions about specific conditions."
          query="service=massage"
          secondary={{
            label: `Call ${data.paris.phoneSecondary ?? data.paris.phonePrimary}`,
            href: telHref(data.paris.phoneSecondary ?? data.paris.phonePrimary),
          }}
        />
      );
    default:
      return null;
  }
}
