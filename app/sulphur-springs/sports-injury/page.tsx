import type { Metadata } from "next";
import { Breadcrumbs, CtaCard, PageHero } from "@/components/PageChrome";
import { SS_INJURIES } from "@/lib/sulphur-springs-content";
import { telHref } from "@/lib/constants";
import { publicBookingHref } from "@/lib/public-booking";

const INJURY = SS_INJURIES.find((i) => i.slug === "sports-injury")!;

export const metadata: Metadata = {
  title: `${INJURY.title} — Sulphur Springs Chiropractic`,
  description: INJURY.metaDescription,
  alternates: { canonical: `/sulphur-springs/${INJURY.slug}` },
  openGraph: {
    title: `${INJURY.title} — Sulphur Springs, TX`,
    description: INJURY.metaDescription,
    url: `/sulphur-springs/${INJURY.slug}`,
  },
};

export default function SportsInjuryPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Sulphur Springs", url: "/sulphur-springs" },
          { name: INJURY.title, url: `/sulphur-springs/${INJURY.slug}` },
        ]}
      />
      <PageHero
        eyebrow="Chiropractic Associates · Sulphur Springs"
        title={INJURY.title}
      />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <div className="prose prose-stone max-w-none">
            {INJURY.body.split("\n\n").map((block, i) => {
              if (block.startsWith("## ")) {
                return <h2 key={i} className="mt-8 text-xl font-black text-[#173f3b] first:mt-0">{block.replace("## ", "")}</h2>;
              }
              if (block.startsWith("- ")) {
                const items = block.split("\n").filter((l) => l.startsWith("- "));
                return (
                  <ul key={i} className="list-disc space-y-1 pl-6 text-stone-700">
                    {items.map((item) => (
                      <li key={item}>{item.replace("- ", "")}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={i} className="leading-relaxed text-stone-700">{block}</p>;
            })}
          </div>
        </section>
        <CtaCard
          title="Need treatment?"
          body="Contact our Sulphur Springs office for a thorough examination."
          primary={{ label: "Book online", href: publicBookingHref() }}
          secondary={{ label: "Call 903-919-5020", href: telHref("903-919-5020") }}
        />
      </div>
    </>
  );
}
