import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { MarkdownBulletList } from "@/components/SsMarkdownBody";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { practiceThemeStyle } from "@/components/practice/theme";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { getContentMany } from "@/lib/cms";
import { getPageMeta } from "@/lib/page-meta";
import { SS_PAGES_CMS_DEFAULTS, ssPageFieldIds } from "@/lib/ss-pages-cms";
import { getInsurancePageContent } from "@/lib/static-pages-content";

export const revalidate = 60;

const IDS = [...ssPageFieldIds("ss_insurance_"), "page_ss_insurance_og_description"];

async function copy(): Promise<Record<string, string>> {
  const cms = await getContentMany(IDS);
  return Object.fromEntries(IDS.map((id) => [id, cms[id]?.trim() || SS_PAGES_CMS_DEFAULTS[id] || ""]));
}

export async function generateMetadata(): Promise<Metadata> {
  const [meta, c] = await Promise.all([
    getPageMeta("ss_insurance", {
      title: "Insurance & Billing — Sulphur Springs",
      description:
        "What to expect with insurance for chiropractic visits, plus self-pay information for massage therapy at our Sulphur Springs office.",
    }),
    copy(),
  ]);
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: "/sulphur-springs/insurance",
    ogTitle: meta.title,
    ogDescription: c.page_ss_insurance_og_description,
  });
}

export default async function SulphurSpringsInsurancePage() {
  const [c, x, displayLocs] = await Promise.all([
    getInsurancePageContent("ss_"),
    copy(),
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
        eyebrow={x.ss_insurance_eyebrow}
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
            {x.ss_insurance_paperwork_prefix}{" "}
            <Link href="/sulphur-springs/staff" className="font-bold text-[var(--pp-accent)] underline">
              {x.ss_insurance_paperwork_link_label}
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
              {x.ss_insurance_call_prefix} {ss.phonePrimary}
            </a>
          </p>
        </section>

        <ScheduleCtaCard
          title={x.ss_insurance_cta_heading}
          body={x.ss_insurance_cta_body}
          secondary={{ label: x.ss_insurance_cta_button, href: "/sulphur-springs/contact" }}
          variant="sulphur"
        />
      </div>
    </div>
  );
}
