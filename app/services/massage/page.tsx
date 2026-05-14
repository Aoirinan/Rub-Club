import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, CtaCard, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { MassageTeamGrid } from "@/components/marketing/MassageTeamGrid";
import { IMAGES } from "@/lib/home-images";
import { MASSAGE } from "@/lib/home-verbatim";
import { getMassageTeamForMarketing } from "@/lib/massage-team";
import { LOCATIONS, telHref } from "@/lib/constants";
import { massageJsonLd, serviceJsonLd } from "@/lib/structured-data";
import { siteUrl } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Massage Therapy in Paris, TX — The Rub Club",
  description:
    "Licensed massage therapists offering deep tissue, prenatal, sports, and trigger-point therapy in Paris, TX. Same-week openings; call 903-739-9959 or book online.",
  alternates: { canonical: "/services/massage" },
  openGraph: {
    title: "Massage Therapy in Paris, TX — The Rub Club",
    description:
      "Deep tissue, prenatal, sports, and trigger-point massage at The Rub Club in Paris, TX.",
    url: "/services/massage",
  },
};

const SERVICES = [
  {
    name: "Deep Tissue Massage",
    body: "Slow, targeted pressure to release chronic tension in the neck, shoulders, lower back, and hips.",
  },
  {
    name: "Prenatal Massage",
    body: "Side-lying, pregnancy-safe positioning with techniques to ease swelling, hip pressure, and tension headaches.",
  },
  {
    name: "Sports Massage",
    body: "Pre- and post-event work focused on recovery, range of motion, and getting you back to training without rushing tissue.",
  },
  {
    name: "Trigger Point & Lymphatic",
    body: "Focused release of stubborn knots, plus gentle lymphatic drainage when appropriate for post-op or chronic swelling.",
  },
  {
    name: "Therapeutic Massage",
    body: "Coordinated with your chiropractic plan — designed to support recovery between adjustments.",
  },
];

export default async function MassageServicePage() {
  const massageTeam = await getMassageTeamForMarketing();
  const paris = LOCATIONS.paris;
  return (
    <>
      <JsonLd
        data={[
          massageJsonLd(),
          serviceJsonLd({
            name: "Massage Therapy",
            description:
              "Deep tissue, prenatal, sports, lymphatic, and trigger-point massage at The Rub Club in Paris, TX.",
            url: siteUrl("/services/massage"),
            serviceType: "Massage Therapy",
            location: paris,
          }),
        ]}
      />
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Services", url: "/services/massage" },
          { name: "Massage", url: "/services/massage" },
        ]}
      />

      <PageHero
        eyebrow="The Rub Club · Paris, TX"
        title="Therapeutic massage that meets you where you are"
        lede="Licensed therapists. Honest treatment plans. Coordinated with chiropractic care when it helps. Call 903-739-9959 or book online below."
      />

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16">
        <section className="grid gap-10 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <h2 className="text-3xl font-black text-[#173f3b]">{MASSAGE.stressTitle}</h2>
            {MASSAGE.stressParas.map((p) => (
              <p key={p} className="leading-relaxed text-stone-700">
                {p}
              </p>
            ))}
          </div>
          <div className="relative aspect-[4/3] overflow-hidden shadow-md lg:min-h-[360px]">
            <Image
              src={IMAGES.massagePatient}
              alt="A licensed massage therapist working on a client's shoulders at The Rub Club"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">Services we offer</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <article key={s.name} className="border border-stone-200 bg-stone-50 p-5 shadow-sm">
                <h3 className="text-lg font-black text-[#173f3b]">{s.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-700">{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">When to get a massage</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-stone-700">{MASSAGE.whenBody}</p>
        </section>

        <MassageTeamGrid
          members={massageTeam}
          title="Meet the team"
          subtitle="Licensed massage therapists at The Rub Club"
          variant="service"
        />

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">Visit us in Paris</h2>
          <p className="mt-3 leading-relaxed text-stone-700">
            {paris.streetAddress} · Paris, TX
          </p>
          <p className="mt-2 text-stone-700">
            Massage desk:{" "}
            <a className="font-bold text-[#0f5f5c] underline" href={telHref(paris.phoneSecondary ?? paris.phonePrimary)}>
              {paris.phoneSecondary ?? paris.phonePrimary}
            </a>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/book?service=massage&location=paris"
              className="focus-ring bg-[#0f5f5c] px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow hover:bg-[#0f817b]"
            >
              Book massage online
            </Link>
            <Link
              href="/patient-forms"
              className="focus-ring border-2 border-[#0f5f5c] px-5 py-3 text-sm font-black uppercase tracking-wide text-[#0f5f5c] hover:bg-[#0f5f5c]/5"
            >
              New-client form
            </Link>
          </div>
        </section>

        <CtaCard
          title="Have a question first?"
          body="The massage desk can verify available times and answer questions about specific conditions."
          primary={{ label: "Book online", href: "/book?service=massage" }}
          secondary={{ label: "Call 903-739-9959", href: telHref("903-739-9959") }}
        />
      </div>
    </>
  );
}
