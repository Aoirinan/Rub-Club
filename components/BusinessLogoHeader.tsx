"use client";

import Image from "next/image";
import Link from "next/link";
import { ParisLockup } from "@/components/ParisLockup";
import { SulphurSpringsLockup } from "@/components/SulphurSpringsLockup";
import {
  type HeaderBrandContent,
} from "@/lib/brand-logos";
import {
  DEFAULT_HEADER_LOGO_HEIGHTS,
  headerLogoHeightPx,
  type HeaderLogoSlot,
} from "@/lib/header-logo-sizes";
import { telHref, type LocationInfo } from "@/lib/constants";
import type { SiteBusinessContext } from "@/lib/site-business-context";
import { useHeaderCompact } from "@/components/HeaderThemeProvider";

export function BusinessLogoHeader({
  context,
  paris,
  sulphur,
  branding,
  showContact = true,
  large = false,
}: {
  context: SiteBusinessContext;
  paris: LocationInfo;
  sulphur: LocationInfo;
  branding?: HeaderBrandContent;
  /** Hide the phone + label rows (logo-only, e.g. centered inside the nav bar). */
  showContact?: boolean;
  /** Bigger logo for the desktop nav center slot. */
  large?: boolean;
}) {
  const compact = useHeaderCompact();
  const isParis = context === "paris_chiro";
  const location = isParis ? paris : sulphur;
  const href = isParis ? "/services/chiropractic" : "/sulphur-springs";
  const cmsLabel = isParis ? branding?.labels.chiro : branding?.labels.ss;
  const phoneLabel =
    cmsLabel || (isParis ? "Chiropractic — Paris" : "Chiro / Massage — Sulphur Springs");
  // Managers can upload a Sulphur Springs logo image; empty means use the icon + text lockup.
  const ssLogoSrc = branding?.logos.ss || undefined;
  const parisHeights = branding?.logoHeights?.chiro ?? DEFAULT_HEADER_LOGO_HEIGHTS.chiro;
  const ssHeights = branding?.logoHeights?.ss ?? DEFAULT_HEADER_LOGO_HEIGHTS.ss;
  // Mobile (non-large) uses a big, centered, vertically-stacked logo.
  const stacked = !large;
  const parisHeightSlot: HeaderLogoSlot = large
    ? compact
      ? "navCompact"
      : "nav"
    : "mobile";
  const ssHeightSlot = parisHeightSlot;
  // Bump the mark size for the stacked mobile presentation.
  const parisMarkPx = stacked
    ? Math.round(headerLogoHeightPx(parisHeights, parisHeightSlot) * 1.25)
    : headerLogoHeightPx(parisHeights, parisHeightSlot);
  const ssMarkPx = stacked
    ? Math.round(headerLogoHeightPx(ssHeights, ssHeightSlot) * 1.35)
    : headerLogoHeightPx(ssHeights, ssHeightSlot);

  return (
    <div className="flex w-full flex-col items-center gap-1 text-center">
      <Link
        href={href}
        className="block w-fit max-w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c0392b]"
        aria-label={
          isParis
            ? "Chiropractic Associates — Paris, TX"
            : "Chiropractic Associates of Sulphur Springs"
        }
      >
        <div
          className={`origin-top transition-transform duration-300 ease-out motion-reduce:transition-none ${
            compact && !large ? "scale-[0.85]" : "scale-100"
          }`}
        >
          {isParis ? (
            <ParisLockup
              heightPx={parisMarkPx}
              className="max-w-full"
              markOnly={large}
              stacked={stacked}
              title={branding?.parisLockup.title}
              subtitle={branding?.parisLockup.subtitle}
            />
          ) : ssLogoSrc ? (
            <Image
              src={ssLogoSrc}
              alt="Chiropractic Associates of Sulphur Springs"
              width={360}
              height={120}
              sizes="(max-width: 640px) 80vw, 360px"
              className={`w-auto object-contain mix-blend-multiply transition-[height] duration-300 ease-out ${
                large ? "max-w-[10rem]" : "max-w-full"
              }`}
              style={{ height: `${ssMarkPx}px` }}
              priority
            />
          ) : (
            <SulphurSpringsLockup
              primary
              heightPx={ssMarkPx}
              stacked={stacked}
              markOnly={large}
              className="max-w-full"
            />
          )}
        </div>
      </Link>
      {showContact ? (
        <>
          <a
            href={telHref(location.phonePrimary)}
            className={`max-w-full truncate font-black text-[#c0392b] hover:underline transition-all duration-300 ease-out motion-reduce:transition-none ${
              compact ? "text-xs md:text-sm" : "text-sm md:text-base"
            }`}
          >
            {location.phonePrimary}
          </a>
          <span
            className={`max-w-full truncate text-[10px] font-bold uppercase tracking-wide text-stone-500 md:text-xs ${
              compact ? "hidden" : ""
            }`}
          >
            {phoneLabel}
          </span>
        </>
      ) : null}
    </div>
  );
}
