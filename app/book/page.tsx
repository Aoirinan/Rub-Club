import { buildPageMetadata } from "@/lib/page-metadata";
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

export const metadata = buildPageMetadata({
  title: "Book an Appointment",
  description:
    "Book massage therapy or chiropractic care online in Paris or Sulphur Springs, TX. See real-time openings and request a time in under a minute.",
  path: "/book",
  keywords: pageKeywords(),
  ogDescription:
    "Online scheduling for Chiropractic Associates and The Rub Club in Paris and Sulphur Springs, TX.",
});

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
  const displayLocs = await getDisplayLocations();
  const bookingConfig = await getPublicBookingConfig();
  const bookingEnabled = isPublicBookingEnabled(bookingConfig);

  if (!bookingEnabled) {
    return (
      <div className="min-h-screen bg-[#f4f2ea] pb-20">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="text-xs text-stone-600">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span aria-hidden className="mx-1">
              ›
            </span>
            <span className="font-semibold text-stone-900">Book</span>
          </nav>
          <h1 className="mt-8 text-2xl font-black text-[#4a1515] sm:text-3xl">Book an appointment</h1>
          {bookingConfig.disabledMessage ? (
            <p className="mt-3 text-sm text-stone-600">{bookingConfig.disabledMessage}</p>
          ) : null}
          <div className="mt-8 rounded-2xl border border-[#c0392b]/25 bg-[#f0faf8] p-5 sm:p-6">
            <p className="text-lg font-black text-[#4a1515]">Online booking is currently off</p>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">
              Please call and we will schedule your visit directly.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a
                href={`tel:${displayLocs.paris.phonePrimary.replace(/\D/g, "")}`}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#c0392b] px-5 py-3 text-sm font-black text-white hover:bg-[#0c4a48]"
              >
                Call Paris {displayLocs.paris.phonePrimary}
              </a>
              <a
                href={`tel:${displayLocs.sulphur_springs.phonePrimary.replace(/\D/g, "")}`}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#c0392b] px-5 py-3 text-sm font-black text-white hover:bg-[#0c4a48]"
              >
                Call Sulphur Springs {displayLocs.sulphur_springs.phonePrimary}
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
              Home
            </Link>
          </li>
          <li aria-hidden>›</li>
          <li className="font-semibold text-stone-900">Book</li>
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
