import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getPageMeta } from "@/lib/page-meta";
import { getContentMany } from "@/lib/cms";
import { pageOgDescriptionId, pageOgTitleId, parisText } from "@/lib/paris-pages-cms";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { MarkdownBulletList } from "@/components/SsMarkdownBody";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { getInsurancePageContent } from "@/lib/static-pages-content";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [meta, og] = await Promise.all([
    getPageMeta("insurance", {
      title: "Insurance & Billing",
      description:
        "What to expect with insurance for chiropractic visits, plus self-pay information for massage therapy at The Rub Club. Call our Paris office to verify benefits.",
    }),
    getContentMany([pageOgTitleId("insurance"), pageOgDescriptionId("insurance")]),
  ]);
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: "/insurance",
    ogTitle: parisText(og, pageOgTitleId("insurance")),
    ogDescription: parisText(og, pageOgDescriptionId("insurance")),
  });
}

const INSURANCE_COPY_IDS = [
  "insurance_eyebrow",
  "insurance_paperwork_prefix",
  "insurance_paperwork_link_label",
  "insurance_paperwork_suffix",
  "insurance_call_paris_label",
  "insurance_call_ss_label",
  "insurance_cta_title",
  "insurance_cta_body",
  "insurance_cta_secondary_label",
] as const;

export default async function InsurancePage() {
  const [c, displayLocs, copy] = await Promise.all([
    getInsurancePageContent(),
    getDisplayLocations(),
    getContentMany([...INSURANCE_COPY_IDS]),
  ]);
  const t = (id: string) => parisText(copy, id);

  return (
    <>
      <Breadcrumbs
        items={[{ name: "Home", url: "/" }, { name: "Insurance", url: "/insurance" }]}
      />
      <PageHero eyebrow={t("insurance_eyebrow")} title={c.heroTitle} lede={c.heroLede} />
      <div className="mx-auto max-w-4xl space-y-8 px-4 pb-16">
        <section className="space-y-4 border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-xl font-black text-[#4a1515]">{c.chiroHeading}</h2>
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
            {t("insurance_paperwork_prefix")}{" "}
            <Link href="/locations/paris/staff" className="font-bold text-[#c0392b] underline">
              {t("insurance_paperwork_link_label")}
            </Link>{" "}
            {t("insurance_paperwork_suffix")}
          </p>
        </section>

        <section className="space-y-4 border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-xl font-black text-[#4a1515]">{c.massageHeading}</h2>
          <p className="text-stone-700">{c.massageBody}</p>
        </section>

        <section className="space-y-4 border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-xl font-black text-[#4a1515]">{c.verifyHeading}</h2>
          <p className="text-stone-700">{c.verifyBody}</p>
          <p className="text-sm font-bold text-[#c0392b]">
            <a className="focus-ring underline" href={telHref(displayLocs.paris.phonePrimary)}>
              {t("insurance_call_paris_label")}{displayLocs.paris.phonePrimary}
            </a>{" "}
            ·{" "}
            <a
              className="focus-ring underline"
              href={telHref(displayLocs.sulphur_springs.phonePrimary)}
            >
              {t("insurance_call_ss_label")}{displayLocs.sulphur_springs.phonePrimary}
            </a>
          </p>
        </section>

        <ScheduleCtaCard
          title={t("insurance_cta_title")}
          body={t("insurance_cta_body")}
          secondary={{ label: t("insurance_cta_secondary_label"), href: "/contact" }}
        />
      </div>
    </>
  );
}
