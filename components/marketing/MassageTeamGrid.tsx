import type { ReactNode } from "react";
import type { MassageTeamCard } from "@/lib/massage-team";

type Variant = "home" | "service";
/** Paris (Rub Club red) or Sulphur Springs (blue), matching the host page. */
type Accent = "paris" | "sulphur";

type Props = {
  members: MassageTeamCard[];
  title: string;
  subtitle?: string;
  /** Shown below the grid (e.g. link to Paris office staff roles). */
  footnote?: ReactNode;
  titleAs?: "h1" | "h2";
  variant?: Variant;
  accent?: Accent;
};

const ACCENTS: Record<Accent, { border: string; heading: string }> = {
  paris: { border: "border-[#c0392b]", heading: "text-[#4a1515]" },
  sulphur: { border: "border-[#2980b9]", heading: "text-[#0c2d3a]" },
};

export function MassageTeamGrid({
  members,
  title,
  subtitle,
  footnote,
  titleAs = "h2",
  variant = "home",
  accent = "paris",
}: Props) {
  const TitleTag = titleAs;
  const isHome = variant === "home";
  const theme = ACCENTS[accent];

  return (
    <section className={`border-t-4 ${theme.border} bg-white p-6 shadow-md sm:p-10`}>
      <TitleTag
        className={`${theme.heading} ${
          isHome ? "text-center text-3xl font-black" : "text-2xl font-black"
        }`}
      >
        {title}
      </TitleTag>
      {subtitle ? (
        <p
          className={
            isHome
              ? "mx-auto mt-4 max-w-3xl text-center text-sm font-semibold uppercase tracking-wide text-stone-600"
              : "mt-2 text-sm font-semibold uppercase tracking-wide text-stone-600"
          }
        >
          {subtitle}
        </p>
      ) : null}
      <div
        className={
          isHome ? "mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3" : "mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {members.map((member) => (
          <article
            key={member.id}
            className="flex flex-col overflow-hidden border border-stone-200 bg-stone-50 shadow-sm"
          >
            <div className="relative aspect-[3/4] w-full bg-stone-200">
              {/* eslint-disable-next-line @next/next/no-img-element -- portraits may be Firebase Storage URLs */}
              <img
                src={member.imageSrc}
                alt={`Portrait of ${member.name}, massage therapist`}
                className="absolute inset-0 h-full w-full object-cover object-top"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className={`text-lg font-black ${theme.heading}`}>{member.name}</h3>
              {member.role ? <p className="text-sm font-bold text-stone-600">{member.role}</p> : null}
              <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-700">{member.bio}</p>
            </div>
          </article>
        ))}
      </div>
      {footnote ? (
        <p
          className={
            isHome
              ? "mx-auto mt-8 max-w-3xl text-center text-sm text-stone-600"
              : "mt-6 text-sm text-stone-600"
          }
        >
          {footnote}
        </p>
      ) : null}
    </section>
  );
}
