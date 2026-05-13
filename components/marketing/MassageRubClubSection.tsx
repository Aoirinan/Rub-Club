import Image from "next/image";
import { IMAGES } from "@/lib/home-images";
import { MASSAGE } from "@/lib/home-verbatim";

type Props = {
  stressTitleAs?: "h1" | "h2";
};

export function MassageRubClubSection({ stressTitleAs = "h2" }: Props) {
  const TitleTag = stressTitleAs;

  return (
    <section
      id="the-rub-club"
      className="scroll-mt-32 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10"
    >
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="space-y-5">
          <TitleTag className="text-3xl font-black text-[#173f3b]">{MASSAGE.stressTitle}</TitleTag>
          {MASSAGE.stressParas.map((p) => (
            <p key={p} className="leading-relaxed text-stone-700">
              {p}
            </p>
          ))}
        </div>
        <div className="relative aspect-[4/3] overflow-hidden shadow-md lg:aspect-auto lg:min-h-[360px]">
          <Image
            src={IMAGES.massagePatient}
            alt="Patient receiving therapeutic massage at The Rub Club in Paris, TX"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>

      <div className="mt-10 grid gap-10 border-t border-stone-200 pt-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-black text-[#173f3b]">{MASSAGE.whenTitle}</h2>
          <p className="mt-4 leading-relaxed text-stone-700">{MASSAGE.whenBody}</p>
        </div>
        <div>
          <h2 className="text-xl font-black text-[#173f3b]">{MASSAGE.treatmentsTitle}</h2>
          <p className="mt-4 leading-relaxed text-stone-700">{MASSAGE.treatmentsIntro}</p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-stone-700">
            {MASSAGE.treatmentsList.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 bg-[#f2efe3] p-6">
        <h2 className="text-2xl font-black text-[#173f3b]">{MASSAGE.closingTitle}</h2>
        {MASSAGE.closingParas.map((p) => (
          <p key={p} className="mt-4 leading-relaxed text-stone-700">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
