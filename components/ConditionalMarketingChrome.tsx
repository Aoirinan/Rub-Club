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
  socialBarLabel,
  socialFacebookUrl,
  socialInstagramUrl,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  giftCardSticky?: GiftCardStickyBannerProps;
  stickyCallBar?: MobileStickyCallBarProps;
  accessibilityPanelEnabled?: boolean;
  socialBarLabel?: string;
  socialFacebookUrl?: string;
  socialInstagramUrl?: string;
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

  // Both bars on a phone: the gift banner sits above the call bar, so reserve
  // room for the stack (52px + 56px) on mobile and just the banner on desktop.
  const contentPad =
    giftVisible && callBarActive
      ? "pb-[7.75rem] md:pb-[4.25rem]"
      : giftVisible
        ? "pb-[4.25rem]"
        : callBarActive
          ? "pb-14 md:pb-0"
          : undefined;

  return (
    <MassageGiftCardNavProvider>
      {header}
      {hideSocialBar ? null : <SiteSocialBar
          label={socialBarLabel}
          facebookUrl={socialFacebookUrl?.trim() || undefined}
          instagramUrl={socialInstagramUrl?.trim() || undefined}
        />}
      <div className={contentPad}>{children}</div>
      {footer}
      {hideGiftBanner ? null : (
        <GiftCardStickyBanner {...giftProps} aboveMobileCallBar={callBarActive} />
      )}
      {stickyCallBar ? <MobileStickyCallBar {...stickyCallBar} /> : null}
      {accessibilityPanelEnabled && !pathname.startsWith("/admin") ? <AccessibilityPanel /> : null}
    </MassageGiftCardNavProvider>
  );
}
