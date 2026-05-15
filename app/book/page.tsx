import type { Metadata } from "next";
import Link from "next/link";
import { BookingWizard } from "@/components/BookingWizard";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { getSiteOwnerConfig } from "@/lib/site-owner-config";
import { mergedDisplayLocations } from "@/lib/site-display-overrides";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description:
    "Book massage therapy or chiropractic care online in Paris or Sulphur Springs, TX. See real-time openings and request a time in under a minute.",
  alternates: { canonical: "/book" },
  openGraph: {
    title: "Book an Appointment",
    description:
      "Online scheduling for The Rub Club Massage and Chiropractic Associates in Paris and Sulphur Springs, TX.",
    url: "/book",
  },
};

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
  let displayLocs = mergedDisplayLocations(undefined);
  try {
    const cfg = await getSiteOwnerConfig();
    displayLocs = mergedDisplayLocations(cfg.editableCopy);
  } catch {
    /* defaults */
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
      />
    </>
  );
}
