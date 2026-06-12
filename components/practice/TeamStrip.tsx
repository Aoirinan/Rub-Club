import Image from "next/image";
import Link from "next/link";
import { DoctorCardVideoAccordion } from "@/components/DoctorCardVideoAccordion";
import { SectionHeading } from "@/components/practice/SectionHeading";
import { renderRichText } from "@/lib/cms-registry";
import type { PracticeTeamSection } from "@/lib/practice-pages-shared";

export type PracticeTeamMember = {
  name: string;
  credential: string;
  imageUrl: string;
  /** Optional full bio (shown for the featured member in the "expanded" variant). */
  bio?: string;
  /** Marks the spotlight member for the "expanded" variant (defaults to first with a bio). */
  featured?: boolean;
  /** Optional videos (doctor intro / action clips) shown in an accordion on the card. */
  videos?: { src: string; label?: string }[];
};

function FeaturedMember({ member }: { member: PracticeTeamMember }) {
  const remote = /^https?:\/\//i.test(member.imageUrl);
  const paragraphs = (member.bio ?? "").split(/\n\n+/).filter((p) => p.trim().length > 0);
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[0.4fr_0.6fr] lg:items-start">
      {member.imageUrl.trim() ? (
        <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden bg-stone-200 shadow-md">
          <Image
            src={member.imageUrl}
            alt={`Portrait of ${member.name}`}
            fill
            className="object-cover object-top"
            sizes="(max-width: 1024px) 100vw, 400px"
            unoptimized={remote}
          />
        </div>
      ) : null}
      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-black text-[var(--pp-heading)]">{member.name}</h3>
          {member.credential.trim() ? (
            <p className="mt-1 text-sm font-bold uppercase tracking-wide text-stone-600">
              {member.credential}
            </p>
          ) : null}
        </div>
        {member.videos?.length ? (
          <div className="max-w-md">
            <DoctorCardVideoAccordion videos={member.videos} />
          </div>
        ) : null}
        {paragraphs.map((p, idx) => (
          <p key={`bio-${idx}`} className="leading-relaxed text-stone-700">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

/** Photo + name + credential cards for the location's providers. */
export function TeamStrip({
  data,
  members,
}: {
  data: PracticeTeamSection;
  /** Resolved by the page from the doctors CMS (Paris) or staff collection (SS). */
  members: PracticeTeamMember[];
}) {
  if (!data.published) return null;
  const all = members.filter((m) => m.name.trim().length > 0);
  if (all.length === 0) return null;

  // "expanded": the featured member (or first with a bio) gets a full-bio spotlight.
  const featured =
    data.variant === "expanded"
      ? (all.find((m) => m.featured && (m.bio ?? "").trim().length > 0) ??
        all.find((m) => (m.bio ?? "").trim().length > 0) ??
        null)
      : null;
  const rows = featured ? all.filter((m) => m !== featured) : all;

  return (
    <section className="border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-10">
      {data.heading.trim() ? <SectionHeading>{data.heading}</SectionHeading> : null}
      {data.intro.trim() ? (
        <p
          className="mt-2 max-w-2xl text-sm text-stone-600"
          dangerouslySetInnerHTML={{ __html: renderRichText(data.intro) }}
        />
      ) : null}
      {featured ? <FeaturedMember member={featured} /> : null}
      {rows.length > 0 ? (
      <div className="mt-8 grid grid-cols-2 gap-5 sm:gap-8 lg:grid-cols-3">
        {rows.map((m) => {
          const remote = /^https?:\/\//i.test(m.imageUrl);
          const card = (
            <>
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-200">
                {m.imageUrl.trim() ? (
                  <Image
                    src={m.imageUrl}
                    alt={`Portrait of ${m.name}`}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
                    unoptimized={remote}
                  />
                ) : null}
              </div>
              <div className="p-4 pb-0">
                <h3 className="text-base font-black text-[var(--pp-heading)] group-hover:text-[var(--pp-accent)]">
                  {m.name}
                </h3>
                {m.credential.trim() ? (
                  <p className="mt-1 text-sm font-bold text-stone-600">{m.credential}</p>
                ) : null}
              </div>
            </>
          );
          // Video accordion lives outside the link so play clicks don't navigate.
          const videoBlock = m.videos?.length ? (
            <div className="px-4 pb-4">
              <DoctorCardVideoAccordion videos={m.videos} />
            </div>
          ) : (
            <div className="pb-4" />
          );
          return (
            <div
              key={m.name}
              className="overflow-hidden border border-stone-200 bg-stone-50 shadow-sm transition hover:shadow-md"
            >
              {data.linkUrl.trim() ? (
                <Link key={m.name} href={data.linkUrl} className="group block">
                  {card}
                </Link>
              ) : (
                card
              )}
              {videoBlock}
            </div>
          );
        })}
      </div>
      ) : null}
      {data.linkUrl.trim() && data.linkLabel.trim() ? (
        <div className="mt-8">
          <Link
            href={data.linkUrl}
            className="focus-ring inline-flex bg-[var(--pp-accent)] px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[var(--pp-accent-hover)]"
          >
            {data.linkLabel}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
