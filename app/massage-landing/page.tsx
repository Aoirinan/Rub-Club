import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageChrome";

export const metadata: Metadata = {
  title: "Massage Therapy — Paris, TX",
  description:
    "Therapeutic massage in Paris, Texas at The Rub Club — same trusted team, online booking, and convenient Northeast Texas location.",
  alternates: { canonical: "/massage-landing" },
};

export default function MassageLandingPage() {
  return (
    <>
      <PageHero
        eyebrow="The Rub Club"
        title="Massage therapy in Paris, TX"
        lede="You found us from Massage Paris Texas — welcome. Book online, call the massage desk, or explore our massage services and team."
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 pb-16">
        <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-md">
          <h2 className="text-xl font-black text-[#173f3b]">Book your next session</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-700">
            Stretch sessions are by appointment only. Walk-ins are welcome for massage when we have
            availability — call ahead if you are unsure.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/book"
              className="focus-ring inline-flex bg-[#0f5f5c] px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[#0f817b]"
            >
              Book online
            </Link>
            <Link
              href="/services/massage"
              className="focus-ring inline-flex border-2 border-[#0f5f5c] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#0f5f5c] hover:bg-[#0f5f5c]/5"
            >
              Massage services
            </Link>
            <Link href="/" className="focus-ring inline-flex text-sm font-bold text-[#0f5f5c] underline">
              Main site home
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
