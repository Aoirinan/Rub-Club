"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { GiftCardStickyBanner } from "@/components/GiftCardStickyBanner";

/** Hide public site header/footer on admin popup routes (second-monitor scheduler). */
export function ConditionalMarketingChrome({
  header,
  footer,
  children,
  giftCardHref,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  giftCardHref?: string;
}) {
  const pathname = usePathname() ?? "";
  const minimal = pathname.startsWith("/admin/chiro");
  const hideGiftBanner = pathname.startsWith("/admin");
  if (minimal) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }
  return (
    <>
      {header}
      <div className={hideGiftBanner ? undefined : "pb-[4.25rem]"}>{children}</div>
      {footer}
      {hideGiftBanner ? null : <GiftCardStickyBanner href={giftCardHref} />}
    </>
  );
}
