"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  GiftCardStickyBanner,
  useGiftCardStickyVisible,
  type GiftCardStickyBannerProps,
} from "@/components/GiftCardStickyBanner";
import { MassageGiftCardNavProvider } from "@/lib/massage-gift-card-nav-context";

/** Hide public site header/footer on admin popup routes (second-monitor scheduler). */
export function ConditionalMarketingChrome({
  header,
  footer,
  children,
  giftCardSticky,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  giftCardSticky?: GiftCardStickyBannerProps;
}) {
  const pathname = usePathname() ?? "";
  const minimal = pathname.startsWith("/admin/chiro");
  const hideGiftBanner = pathname.startsWith("/admin");
  const giftProps = giftCardSticky ?? { enabled: false };
  const giftVisible = useGiftCardStickyVisible(giftProps) && !hideGiftBanner;

  if (minimal) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }
  return (
    <MassageGiftCardNavProvider>
      {header}
      <div className={giftVisible ? "pb-[4.25rem]" : undefined}>{children}</div>
      {footer}
      {hideGiftBanner ? null : <GiftCardStickyBanner {...giftProps} />}
    </MassageGiftCardNavProvider>
  );
}
