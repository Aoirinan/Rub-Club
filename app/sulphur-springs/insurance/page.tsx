import { buildPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { MarkdownBulletList } from "@/components/SsMarkdownBody";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { practiceThemeStyle } from "@/components/practice/theme";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { getInsurancePageContent } from "@/lib/static-pages-content";

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: "Insurance & Billing — Sulphur Springs",
  description:
    "What to expect with insurance for chiropractic visits, plus self-pay information for massage therapy at our Sulphur Springs office.",
  path: "/sulphur-springs/insurance",
  ogTitle: "Insurance & Billing — Sulphur Springs",
  ogDescription:
    "Insurance accepted for chiropractic care; massage therapy is self-pay. Call our Sulphur Springs office to verify benefits.",
});

export default async function SulphurSpringsInsurancePage() {
  const [c, displayLocs] = await Promise.all([
    getInsurancePageContent("ss_"),
    getDisplayLocations(),
  ]);
  const ss = displayLocs.sulphur_springs;

  return (
    <div style={practiceThemeStyle("sulphur-springs")}>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Sulphur Springs", url: "/sulphur-springs" },
          { name: "Insurance", url: "/sulphur-springs/insurance" },
        ]}
      />
      <PageHero
        eyebrow="Insurance & billing"
        title={c.heroTitle}
        lede={c.heroLede}
        variant="sulphur"
      />
      <div className="mx-auto max-w-4xl space-y-8 px-4 pb-16">
        <section className="space-y-4 border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-xl font-black text-[var(--pp-heading)]">{c.chiroHeading}</h2>
          {c.chiroBody.split("\n\n").map((block, i) =>
            block.trim().startsWith("- ") ? (
              <MarkdownBulletList key={i} text={block} />
            ) : (
              <p key={i} className="text-stone-700">
                {block}
              </p>
            ),
          )}
          <p className="text-sm text-stone-600">
            Auto-injury and personal-injury paperwork:{" "}
            <Link href="/sulphur-springs/staff" className="font-bold text-[var(--pp-accent)] underline">
              About us — Sulphur Springs office
            </Link>
            .
          </p>
        </section>

        <section className="space-y-4 border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-xl font-black text-[var(--pp-heading)]">{c.massageHeading}</h2>
          <p className="text-stone-700">{c.massageBody}</p>
        </section>

        <section className="space-y-4 border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-xl font-black text-[var(--pp-heading)]">{c.verifyHeading}</h2>
          <p className="text-stone-700">{c.verifyBody}</p>
          <p className="text-sm font-bold text-[var(--pp-accent)]">
            <a className="focus-ring underline" href={telHref(ss.phonePrimary)}>
              Call Sulphur Springs: {ss.phonePrimary}
            </a>
          </p>
        </section>

        <ScheduleCtaCard
          title="Have benefits to use before year-end?"
          body="Book a visit while you still have flexible-spending or out-of-pocket dollars to use."
          secondary={{ label: "Talk to billing", href: "/sulphur-springs/contact" }}
          variant="sulphur"
        />
      </div>
    </div>
  );
}
