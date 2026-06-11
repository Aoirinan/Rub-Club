import { buildPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { PageHero } from "@/components/PageChrome";
import { BookingCta } from "@/components/BookingCta";

export const metadata = buildPageMetadata({
  title: "Massage Therapy â€” Paris, TX",
  description:
    "Therapeutic massage in Paris, Texas at The Rub Club â€” same trusted team and convenient Northeast Texas location.",
  path: "/massage-landing",
});

export default function MassageLandingPage() {
  return (
    <>
      <PageHero
        eyebrow="The Rub Club"
        title="Massage therapy in Paris, TX"
        lede="You found us from Massage Paris Texas â€” welcome. Call the massage desk, contact us online, or explore our massage services and team."
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 pb-16">
        <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-md">
          <h2 className="text-xl font-black text-[#013a30]">Book your next session</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-700">
            Stretch sessions are by appointment only. Walk-ins are welcome for massage when we have
            availability â€” call ahead if you are unsure.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <BookingCta label="Book Now" variant="teal" />
            <Link
              href="/services/massage"
              className="focus-ring inline-flex border-2 border-[#015949] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#015949] hover:bg-[#25455e]/5"
            >
              Massage services
            </Link>
            <Link href="/" className="focus-ring inline-flex text-sm font-bold text-[#015949] underline">
              Main site home
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
