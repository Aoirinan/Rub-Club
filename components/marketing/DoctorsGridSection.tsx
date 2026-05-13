import Image from "next/image";
import { IMAGES } from "@/lib/home-images";
import { DOCTORS } from "@/lib/home-verbatim";

type Props = {
  titleAs?: "h1" | "h2";
  /** When false, omit the “Our Chiropractors” heading (use when the page already supplies an H1). */
  showSectionTitle?: boolean;
};

export function DoctorsGridSection({ titleAs = "h2", showSectionTitle = true }: Props) {
  const TitleTag = titleAs;

  return (
    <section
      id="our-chiropractors"
      className="scroll-mt-32 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10"
    >
      {showSectionTitle ? (
        <>
          <TitleTag className="text-center text-3xl font-black text-[#173f3b]">Our Chiropractors</TitleTag>
          <p className="mx-auto mt-4 max-w-3xl text-center leading-relaxed text-stone-700">
            Meet the doctors who lead care at Chiropractic Associates in Paris and Sulphur Springs.
          </p>
        </>
      ) : null}
      <div className={`grid gap-10 sm:grid-cols-2 lg:grid-cols-3 ${showSectionTitle ? "mt-10" : ""}`}>
        {DOCTORS.map((member) => (
          <article
            key={member.name}
            className="flex flex-col overflow-hidden border border-stone-200 bg-stone-50 shadow-sm"
          >
            <div className="relative aspect-[3/4] w-full bg-stone-200">
              <Image
                src={IMAGES[member.imageKey]}
                alt={`${member.name}, ${member.role} in Paris, TX`}
                fill
                className="object-cover object-top"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              {showSectionTitle ? (
                <h3 className="text-lg font-black text-[#173f3b]">{member.name}</h3>
              ) : (
                <h2 className="text-lg font-black text-[#173f3b]">{member.name}</h2>
              )}
              <p className="text-sm font-bold text-stone-600">{member.role}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-700">{member.bio}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
