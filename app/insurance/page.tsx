import type { Metadata } from "next";
import { Breadcrumbs, CtaCard, PageHero } from "@/components/PageChrome";
import { telHref } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Insurance & Billing",
  description:
    "What to expect with insurance for chiropractic visits, plus self-pay information for massage therapy at The Rub Club. Call our Paris office to verify benefits.",
  alternates: { canonical: "/insurance" },
  openGraph: {
    title: "Insurance & Billing — Chiropractic Associates",
    description:
      "Insurance accepted for chiropractic care; massage therapy is self-pay. Call to verify benefits before your visit.",
    url: "/insurance",
  },
};

export default function InsurancePage() {
  return (
    <>
      <Breadcrumbs
        items={[{ name: "Home", url: "/" }, { name: "Insurance", url: "/insurance" }]}
      />
      <PageHero
        eyebrow="Insurance & billing"
        title="Plain-language insurance answers"
        lede="We work with most major medical plans for chiropractic care and file claims on your behalf. Massage therapy is generally self-pay."
      />
      <div className="mx-auto max-w-4xl space-y-8 px-4 pb-16">
        <section className="space-y-4 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-xl font-black text-[#173f3b]">Chiropractic coverage</h2>
          <p className="text-stone-700">
            Most commercial insurance, Medicare, and many auto-injury and worker&rsquo;s comp plans
            cover chiropractic visits. We will verify your benefits and explain copays, deductibles,
            and visit limits up front. If your plan does not cover chiropractic, we offer a
            transparent self-pay rate.
          </p>
          <ul className="list-disc space-y-2 pl-6 text-stone-700">
            <li>Bring your insurance card and photo ID to your first visit.</li>
            <li>We bill your plan directly so you don&rsquo;t pay the full amount up front.</li>
            <li>
              Auto injuries: ask us about med-pay and personal injury protection — we frequently
              coordinate with attorneys and adjusters.
            </li>
          </ul>
        </section>

        <section className="space-y-4 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-xl font-black text-[#173f3b]">Massage therapy</h2>
          <p className="text-stone-700">
            Massage therapy is generally a self-pay service. Some HSA/FSA cards may apply with a
            doctor&rsquo;s note. The massage desk can walk you through pricing for 30- and 60-minute
            visits.
          </p>
        </section>

        <section className="space-y-4 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-xl font-black text-[#173f3b]">Verify before your visit</h2>
          <p className="text-stone-700">
            The fastest way to confirm coverage is to call us with your plan details handy. Have your
            insurance card, group number, and date of birth available.
          </p>
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

        <CtaCard
          title="Have benefits to use before year-end?"
          body="Book a visit while you still have flexible-spending or out-of-pocket dollars to use."
          primary={{ label: "Book online", href: "/book" }}
          secondary={{ label: "Talk to billing", href: "/contact" }}
        />
      </div>
    </>
  );
}
