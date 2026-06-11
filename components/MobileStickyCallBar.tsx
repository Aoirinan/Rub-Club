"use client";

import { usePathname } from "next/navigation";
import { BookingCta } from "@/components/BookingCta";
import { telHref, type LocationInfo } from "@/lib/constants";
import { track } from "@/lib/analytics";
import { useSiteBusinessContext } from "@/lib/use-site-business-context";
import type { SiteBusinessContext } from "@/lib/site-business-context";

export type MobileStickyCallBarProps = {
  paris: LocationInfo;
  sulphur: LocationInfo;
  /** CMS toggle: Paris & shared pages (sticky_call_bar_paris). */
  enabledParis: boolean;
  /** CMS toggle: Sulphur Springs pages (sticky_call_bar_ss). */
  enabledSS: boolean;
  initialBusinessContext?: SiteBusinessContext;
};

/**
 * Routes that mount their own practice-page StickyCallBar (driven by
 * practice_pages CMS) — the site-wide bar steps aside there.
 */
const PRACTICE_BAR_PATHS = new Set(["/", "/services/chiropractic", "/sulphur-springs"]);

function isSulphurPath(pathname: string): boolean {
  return (
    pathname.startsWith("/sulphur-springs") || pathname.startsWith("/locations/sulphur-springs")
  );
}

function isMassagePath(pathname: string): boolean {
  return pathname.startsWith("/services/massage");
}

type BarState = { active: boolean; phone: string; trackLocation: string };

function resolveBar(
  pathname: string,
  businessContext: SiteBusinessContext,
  props: Pick<MobileStickyCallBarProps, "paris" | "sulphur" | "enabledParis" | "enabledSS">,
): BarState {
  if (pathname.startsWith("/admin") || PRACTICE_BAR_PATHS.has(pathname)) {
    return { active: false, phone: "", trackLocation: "" };
  }
  if (isSulphurPath(pathname) || businessContext === "sulphur_springs") {
    return {
      active: props.enabledSS,
      phone: props.sulphur.phonePrimary,
      trackLocation: "sulphur_springs",
    };
  }
  if (isMassagePath(pathname)) {
    return {
      active: props.enabledParis,
      phone: props.paris.phoneSecondary?.trim() || props.paris.phonePrimary,
      trackLocation: "rub_club",
    };
  }
  return { active: props.enabledParis, phone: props.paris.phonePrimary, trackLocation: "paris" };
}

/** Whether the bar renders for the current route (for bottom-padding coordination). */
export function useMobileStickyCallBarActive(props: MobileStickyCallBarProps): boolean {
  const pathname = usePathname() ?? "/";
  const businessContext = useSiteBusinessContext(props.initialBusinessContext ?? "default");
  return resolveBar(pathname, businessContext, props).active;
}

/**
 * Site-wide mobile-only bottom bar: context-specific "Call Us" + "Book Now".
 * Backpro-style; per-location CMS toggles.
 */
export function MobileStickyCallBar(props: MobileStickyCallBarProps) {
  const pathname = usePathname() ?? "/";
  const businessContext = useSiteBusinessContext(props.initialBusinessContext ?? "default");
  const { active, phone, trackLocation } = resolveBar(pathname, businessContext, props);

  if (!active || !phone.trim()) return null;

  return (
    <div
      role="region"
      aria-label="Call or book"
      className="fixed bottom-0 left-0 right-0 z-[60] grid min-h-[56px] grid-cols-2 shadow-[0_-4px_20px_rgba(0,0,0,0.25)] md:hidden"
    >
      <a
        href={telHref(phone)}
        onClick={() => track("phone_click", { location: trackLocation })}
        className="flex items-center justify-center gap-2 bg-[#173f3b] px-4 py-3 text-sm font-black uppercase tracking-wide text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" />
        </svg>
        Call Us
      </a>
      <BookingCta
        label="Book Now"
        className="focus-ring flex items-center justify-center gap-2 bg-[#f2d25d] px-4 py-3 text-sm font-black uppercase tracking-wide text-[#173f3b]"
      />
    </div>
  );
}
