import { buildPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { MarkdownBulletList } from "@/components/SsMarkdownBody";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { telHref } from "@/lib/constants";
import { getInsurancePageContent } from "@/lib/static-pages-content";

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: "Insurance & Billing",
  description:
    "What to expect with insurance for chiropractic visits, plus self-pay information for massage therapy at The Rub Club. Call our Paris office to verify benefits.",
  path: "/insurance",
  ogTitle: "Insurance & Billing — Chiropractic Associates",
  ogDescription:
    "Insurance accepted for chiropractic care; massage therapy is self-pay. Call to verify benefits before your visit.",
});

export default async function InsurancePage() {
  const c = await getInsurancePageContent();

  return (
    <>
      <Breadcrumbs
        items={[{ name: "Home", url: "/" }, { name: "Insurance", url: "/insurance" }]}
      />
      <PageHero eyebrow="Insurance & billing" title={c.heroTitle} lede={c.heroLede} />
      <div className="mx-auto max-w-4xl space-y-8 px-4 pb-16">
        <section className="space-y-4 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-xl font-black text-[#173f3b]">{c.chiroHeading}</h2>
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
            <Link href="/locations/paris/staff" className="font-bold text-[#0f5f5c] underline">
              meet our Paris office team
            </Link>{" "}
            (including our personal injury case manager).
          </p>
        </section>

        <section className="space-y-4 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-xl font-black text-[#173f3b]">{c.massageHeading}</h2>
          <p className="text-stone-700">{c.massageBody}</p>
        </section>

        <section className="space-y-4 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-xl font-black text-[#173f3b]">{c.verifyHeading}</h2>
          <p className="text-stone-700">{c.verifyBody}</p>
          <p className="text-sm font-bold text-[#0f5f5c]">
            <a className="focus-ring underline" href={telHref("903-785-5551")}>
              Call Paris: 903-785-5551
            </a>{" "}
            ·{" "}
            <a className="focus-ring underline" href={telHref("903-919-5020")}>
              Call Sulphur Springs: 903-919-5020
            </a>
          </p>
        </section>

        <ScheduleCtaCard
          title="Have benefits to use before year-end?"
          body="Book a visit while you still have flexible-spending or out-of-pocket dollars to use."
          secondary={{ label: "Talk to billing", href: "/contact" }}
        />
      </div>
    </>
  );
}
