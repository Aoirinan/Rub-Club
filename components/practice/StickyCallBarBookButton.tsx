"use client";

import Link from "next/link";
import { BookingCta } from "@/components/BookingCta";
import { isCallToBookUrl } from "@/lib/call-to-book";

const BTN_CLASS =
  "flex items-center justify-center gap-2 bg-black px-4 py-3 text-sm font-black uppercase tracking-wide text-white";

export function StickyCallBarBookButton({
  bookUrl,
  bookLabel,
}: {
  bookUrl: string;
  bookLabel: string;
}) {
  const label = bookLabel.trim() || "Book Now";
  if (isCallToBookUrl(bookUrl)) {
    return <BookingCta label={label} className={`focus-ring ${BTN_CLASS}`} />;
  }
  return (
    <Link href={bookUrl} className={BTN_CLASS}>
      {label}
    </Link>
  );
}
