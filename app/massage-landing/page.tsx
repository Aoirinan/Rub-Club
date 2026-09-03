import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { PageHero } from "@/components/PageChrome";
import { BookingCta } from "@/components/BookingCta";
import { getContentMany } from "@/lib/cms";
import { getPageMeta } from "@/lib/page-meta";
import { MASSAGE_PAGE_TEXT_IDS, resolveMassagePageText } from "@/lib/massage-page-cms";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getPageMeta("massage_landing", { title: "", description: "" });
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: "/massage-landing",
  });
}

export default async function MassageLandingPage() {
  const cms = await getContentMany([...MASSAGE_PAGE_TEXT_IDS]);
  const text = resolveMassagePageText(cms);
  return (
    <>
      <PageHero
        eyebrow={text.massage_landing_eyebrow}
        title={text.massage_landing_title}
        lede={text.massage_landing_lede}
      />
      <div className="mx-auto max-w-3xl space-y-8 px-4 pb-16">
        <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-md">
          <h2 className="text-xl font-black text-[#4a1515]">{text.massage_landing_section_heading}</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-700">{text.massage_landing_body}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <BookingCta label={text.massage_landing_book_label} variant="teal" />
            <Link
              href="/services/massage"
              className="focus-ring inline-flex border-2 border-[#c0392b] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#c0392b] hover:bg-[#4a1515]/5"
            >
              {text.massage_landing_services_label}
            </Link>
            <Link href="/" className="focus-ring inline-flex text-sm font-bold text-[#c0392b] underline">
              {text.massage_landing_home_label}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
