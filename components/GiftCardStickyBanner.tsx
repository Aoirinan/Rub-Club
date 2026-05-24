"use client";

import { GIFT_CARD_ORDER_URL } from "@/lib/constants";

const LABEL = "Give the Gift of Wellness — Buy a Gift Card";

export function GiftCardStickyBanner({ href = GIFT_CARD_ORDER_URL }: { href?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-0 left-0 right-0 z-50 flex min-h-[52px] items-center justify-center bg-[#0f5f5c] px-4 py-3 text-center text-sm font-black uppercase tracking-wide text-white shadow-[0_-4px_20px_rgba(0,0,0,0.2)] hover:bg-[#0c4a48] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-base"
    >
      {LABEL}
    </a>
  );
}
