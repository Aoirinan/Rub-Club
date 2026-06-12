import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/home-images";
import { CHIRO } from "@/lib/home-verbatim";
import { IntroVideoBlock } from "@/components/marketing/IntroVideoBlock";

type Props = {
  /** Use `h1` on the dedicated chiropractic landing page; `h2` when this block appears on the home page. */
  chooseTitleAs?: "h1" | "h2";
};

export function ChiropracticAssociatesSection({ chooseTitleAs = "h2" }: Props) {
  const TitleTag = chooseTitleAs;

  return (
    <section
      id="chiropractic-associates"
      className="scroll-mt-32 space-y-10 border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10"
    >
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-5">
          <TitleTag className="text-3xl font-black text-[#4a1515]">{CHIRO.chooseTitle}</TitleTag>
          <p className="leading-relaxed text-stone-700">{CHIRO.chooseLead}</p>
          <p className="leading-relaxed text-stone-700">{CHIRO.chooseP2}</p>
          <p className="leading-relaxed text-stone-700">{CHIRO.chooseP3}</p>
          <ul className="list-disc space-y-2 pl-6 text-stone-700">
            {CHIRO.conditions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="font-bold text-stone-700">{CHIRO.treatmentsIntro}</p>
          <ul className="list-disc space-y-2 pl-6 text-stone-700">
            {CHIRO.treatments.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="leading-relaxed text-stone-700">{CHIRO.awards}</p>
        </div>
        <div className="relative aspect-[3/2] overflow-hidden shadow-lg lg:min-h-[320px]">
          <Image
            src={IMAGES.chiroBg}
            alt="Chiropractic treatment setting at Chiropractic Associates in Paris, TX"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>

      <IntroVideoBlock />

      <div className="bg-[#4a1515] px-6 py-8 text-white shadow-inner sm:px-10">
        <h2 className="text-2xl font-black">{CHIRO.contactUsTitle}</h2>
        <p className="mt-4 leading-relaxed text-white/90">{CHIRO.mission}</p>
        <p className="mt-4 leading-relaxed text-white/90">{CHIRO.bookCta}</p>
      </div>

      <div className="border border-[#d8c061] bg-[#fff7d7] p-6 text-center shadow-sm">
        <p className="font-bold text-[#5a4a15]">{CHIRO.stretchP1}</p>
        <p className="mt-2 text-[#5a4a15]">{CHIRO.stretchP2}</p>
        <p className="mt-4 text-lg font-black uppercase tracking-wide text-[#c0392b]">
          <strong>{CHIRO.stretchCallPart1}</strong> <strong>{CHIRO.stretchCallPart2}</strong>
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {[{ title: "Chiropractic Care" }, { title: "Prenatal Care" }, { title: "Pediatric Care" }].map((card) => (
          <Link
            key={card.title}
            href="/chiropractic"
            className="flex flex-col items-center justify-center bg-[#c0392b] px-4 py-10 text-center text-lg font-black text-white shadow-md hover:bg-[#962d22]"
          >
            {card.title}
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-black text-[#4a1515]">{CHIRO.betterTitle}</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="bg-stone-50 p-6 ring-1 ring-stone-200">
            <h3 className="text-lg font-black text-[#4a1515]">{CHIRO.teamHelpTitle}</h3>
            <p className="mt-3 leading-relaxed text-stone-700">{CHIRO.teamHelpBody}</p>
          </div>
          <div className="bg-stone-50 p-6 ring-1 ring-stone-200">
            <h3 className="text-lg font-black text-[#4a1515]">{CHIRO.qualityTitle}</h3>
            <p className="mt-3 leading-relaxed text-stone-700">{CHIRO.qualityBody}</p>
          </div>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="bg-white p-6 shadow ring-1 ring-[#c0392b]/15">
            <h3 className="text-base font-black uppercase tracking-wide text-[#4a1515]">{CHIRO.mainOfficeTitle}</h3>
            <p className="mt-3 leading-relaxed text-stone-700">{CHIRO.mainOfficeBody}</p>
          </div>
          <div className="bg-white p-6 shadow ring-1 ring-[#c0392b]/15">
            <h3 className="text-base font-black uppercase tracking-wide text-[#4a1515]">{CHIRO.secondLocationTitle}</h3>
            <p className="mt-3 leading-relaxed text-stone-700">{CHIRO.secondLocationBody}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
