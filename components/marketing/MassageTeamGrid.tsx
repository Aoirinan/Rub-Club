import type { MassageTeamCard } from "@/lib/massage-team";

type Variant = "home" | "service";

type Props = {
  members: MassageTeamCard[];
  title: string;
  subtitle?: string;
  titleAs?: "h1" | "h2";
  variant?: Variant;
};

export function MassageTeamGrid({
  members,
  title,
  subtitle,
  titleAs = "h2",
  variant = "home",
}: Props) {
  const TitleTag = titleAs;
  const isHome = variant === "home";

  return (
    <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
      <TitleTag
        className={
          isHome
            ? "text-center text-3xl font-black text-[#173f3b]"
            : "text-2xl font-black text-[#173f3b]"
        }
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
              <h3 className="text-lg font-black text-[#173f3b]">{member.name}</h3>
              {member.role ? <p className="text-sm font-bold text-stone-600">{member.role}</p> : null}
              <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-700">{member.bio}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
