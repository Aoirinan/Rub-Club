import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getPageMeta } from "@/lib/page-meta";
import { getContentMany } from "@/lib/cms";
import { pageOgDescriptionId, parisText } from "@/lib/paris-pages-cms";
import Link from "next/link";
import { BookingWizard } from "@/components/BookingWizard";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { pageKeywords } from "@/lib/seo-keywords";
import { getDisplayLocations } from "@/lib/cms-display";
import {
  getPublicBookingConfig,
  isPublicBookingEnabled,
} from "@/lib/public-booking-settings";

export async function generateMetadata(): Promise<Metadata> {
  const [meta, og] = await Promise.all([
    getPageMeta("book", {
      title: "Book an Appointment",
      description:
        "Book massage therapy or chiropractic care online in Paris or Sulphur Springs, TX. See real-time openings and request a time in under a minute.",
    }),
    getContentMany([pageOgDescriptionId("book")]),
  ]);
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: "/book",
    keywords: pageKeywords(),
    ogDescription: parisText(og, pageOgDescriptionId("book")),
  });
}

const BOOK_COPY_IDS = [
  "book_breadcrumb_home",
  "book_breadcrumb_current",
  "book_title",
  "book_off_heading",
  "book_off_body",
  "book_call_paris_prefix",
  "book_call_ss_prefix",
] as const;

type SearchParams = {
  location?: string;
  service?: string;
  duration?: string;
  date?: string;
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [displayLocs, bookingConfig, copy] = await Promise.all([
    getDisplayLocations(),
    getPublicBookingConfig(),
    getContentMany([...BOOK_COPY_IDS]),
  ]);
  const bookingEnabled = isPublicBookingEnabled(bookingConfig);
  const t = (id: string) => parisText(copy, id);

  if (!bookingEnabled) {
    return (
      <div className="min-h-screen bg-[#f4f2ea] pb-20">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="text-xs text-stone-600">
            <Link href="/" className="hover:underline">
              {t("book_breadcrumb_home")}
            </Link>
            <span aria-hidden className="mx-1">
              ›
            </span>
            <span className="font-semibold text-stone-900">{t("book_breadcrumb_current")}</span>
          </nav>
          <h1 className="mt-8 text-2xl font-black text-[#4a1515] sm:text-3xl">{t("book_title")}</h1>
          {bookingConfig.disabledMessage ? (
            <p className="mt-3 text-sm text-stone-600">{bookingConfig.disabledMessage}</p>
          ) : null}
          <div className="mt-8 rounded-2xl border border-[#c0392b]/25 bg-[#f0faf8] p-5 sm:p-6">
            <p className="text-lg font-black text-[#4a1515]">{t("book_off_heading")}</p>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">
              {t("book_off_body")}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a
                href={`tel:${displayLocs.paris.phonePrimary.replace(/\D/g, "")}`}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#c0392b] px-5 py-3 text-sm font-black text-white hover:bg-[#0c4a48]"
              >
                {t("book_call_paris_prefix")} {displayLocs.paris.phonePrimary}
              </a>
              <a
                href={`tel:${displayLocs.sulphur_springs.phonePrimary.replace(/\D/g, "")}`}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#c0392b] px-5 py-3 text-sm font-black text-white hover:bg-[#0c4a48]"
              >
                {t("book_call_ss_prefix")} {displayLocs.sulphur_springs.phonePrimary}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Book", url: "/book" },
        ])}
      />
      <nav aria-label="Breadcrumb" className="mx-auto max-w-4xl px-4 pt-6 text-xs text-stone-600">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:underline">
              {t("book_breadcrumb_home")}
            </Link>
          </li>
          <li aria-hidden>›</li>
          <li className="font-semibold text-stone-900">{t("book_breadcrumb_current")}</li>
        </ol>
      </nav>
      <BookingWizard
        initial={{
          location: params.location ?? null,
          service: params.service ?? null,
          duration: params.duration ?? null,
          date: params.date ?? null,
          locations: displayLocs,
        }}
        onlinePaymentsEnabled={bookingConfig.onlinePaymentsEnabled}
      />
    </>
  );
}
