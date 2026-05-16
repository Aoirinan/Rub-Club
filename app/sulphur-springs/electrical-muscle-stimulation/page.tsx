import type { Metadata } from "next";
import { Breadcrumbs, CtaCard, PageHero } from "@/components/PageChrome";
import { SS_SERVICES } from "@/lib/sulphur-springs-content";
import { telHref } from "@/lib/constants";
import { publicBookingHref } from "@/lib/public-booking";

const SERVICE = SS_SERVICES.find((s) => s.slug === "electrical-muscle-stimulation")!;

export const metadata: Metadata = {
  title: `${SERVICE.title} — Sulphur Springs Chiropractic`,
  description: SERVICE.metaDescription,
  alternates: { canonical: `/sulphur-springs/${SERVICE.slug}` },
  openGraph: {
    title: `${SERVICE.title} — Sulphur Springs, TX`,
    description: SERVICE.metaDescription,
    url: `/sulphur-springs/${SERVICE.slug}`,
  },
};

export default function EMSPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Sulphur Springs", url: "/sulphur-springs" },
          { name: SERVICE.title, url: `/sulphur-springs/${SERVICE.slug}` },
        ]}
      />
      <PageHero
        eyebrow="Chiropractic Associates · Sulphur Springs"
        title={SERVICE.title}
      />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <div className="prose prose-stone max-w-none">
            {SERVICE.body.split("\n\n").map((block, i) => {
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
          title="Schedule an appointment"
          body="Contact our Sulphur Springs office to discuss whether this treatment is right for you."
          primary={{ label: "Book online", href: publicBookingHref() }}
          secondary={{ label: "Call 903-919-5020", href: telHref("903-919-5020") }}
        />
      </div>
    </>
  );
}
