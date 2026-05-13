import Image from "next/image";
import { IMAGES } from "@/lib/home-images";
import { TEAM } from "@/lib/home-verbatim";

type Props = {
  titleAs?: "h1" | "h2";
};

export function TeamGridSection({ titleAs = "h2" }: Props) {
  const TitleTag = titleAs;

  return (
    <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
      <TitleTag className="text-center text-3xl font-black text-[#173f3b]">Meet the Team</TitleTag>
      <p className="mx-auto mt-4 max-w-3xl text-center text-sm font-semibold uppercase tracking-wide text-stone-600">
        Massage therapy — The Rub Club
      </p>
      <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {TEAM.map((member) => (
          <article
            key={member.name}
            className="flex flex-col overflow-hidden border border-stone-200 bg-stone-50 shadow-sm"
          >
            <div className="relative aspect-[3/4] w-full bg-stone-200">
              <Image
                src={IMAGES[member.imageKey]}
                alt={member.name}
                fill
                className="object-cover object-top"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-lg font-black text-[#173f3b]">{member.name}</h3>
              {"role" in member ? <p className="text-sm font-bold text-stone-600">{member.role}</p> : null}
              <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-700">{member.bio}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
