"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  GiftCardStickyBanner,
  useGiftCardStickyVisible,
  type GiftCardStickyBannerProps,
} from "@/components/GiftCardStickyBanner";
import {
  MobileStickyCallBar,
  useMobileStickyCallBarActive,
  type MobileStickyCallBarProps,
} from "@/components/MobileStickyCallBar";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";
import { SiteSocialBar } from "@/components/SiteSocialBar";
import { MassageGiftCardNavProvider } from "@/lib/massage-gift-card-nav-context";

/** Hide public site header/footer on admin popup routes (second-monitor scheduler). */
export function ConditionalMarketingChrome({
  header,
  footer,
  children,
  giftCardSticky,
  stickyCallBar,
  accessibilityPanelEnabled = true,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  giftCardSticky?: GiftCardStickyBannerProps;
  stickyCallBar?: MobileStickyCallBarProps;
  accessibilityPanelEnabled?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const minimal = pathname.startsWith("/admin/chiro");
  const hideGiftBanner = pathname.startsWith("/admin");
  const hideSocialBar = pathname.startsWith("/admin");
  const giftProps = giftCardSticky ?? { enabled: false };
  const giftVisible = useGiftCardStickyVisible(giftProps) && !hideGiftBanner;
  const callBarProps: MobileStickyCallBarProps = stickyCallBar ?? {
    paris: { phonePrimary: "" } as MobileStickyCallBarProps["paris"],
    sulphur: { phonePrimary: "" } as MobileStickyCallBarProps["sulphur"],
    enabledParis: false,
    enabledSS: false,
  };
  const callBarActive = useMobileStickyCallBarActive(callBarProps) && !!stickyCallBar;

  if (minimal) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  const contentPad = giftVisible
    ? "pb-[4.25rem]"
    : callBarActive
      ? "pb-14 md:pb-0"
      : undefined;

  return (
    <MassageGiftCardNavProvider>
      {header}
      {hideSocialBar ? null : <SiteSocialBar />}
      <div className={contentPad}>{children}</div>
      {footer}
      {hideGiftBanner ? null : <GiftCardStickyBanner {...giftProps} />}
      {stickyCallBar ? <MobileStickyCallBar {...stickyCallBar} /> : null}
      {accessibilityPanelEnabled && !pathname.startsWith("/admin") ? <AccessibilityPanel /> : null}
    </MassageGiftCardNavProvider>
  );
}
