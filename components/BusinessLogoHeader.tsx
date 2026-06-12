"use client";

import Image from "next/image";
import Link from "next/link";
import { ParisLockup } from "@/components/ParisLockup";
import { SulphurSpringsLockup } from "@/components/SulphurSpringsLockup";
import {
  isDefaultChiroLogo,
  resolveChiroHeaderLogo,
  type HeaderBrandContent,
} from "@/lib/brand-logos";
import { telHref, type LocationInfo } from "@/lib/constants";
import type { SiteBusinessContext } from "@/lib/site-business-context";
import { useHeaderCompact } from "@/components/HeaderThemeProvider";

export function BusinessLogoHeader({
  context,
  paris,
  sulphur,
  branding,
  showContact = true,
}: {
  context: SiteBusinessContext;
  paris: LocationInfo;
  sulphur: LocationInfo;
  branding?: HeaderBrandContent;
  /** Hide the phone + label rows (logo-only, e.g. centered inside the nav bar). */
  showContact?: boolean;
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
            compact ? "scale-[0.78]" : "scale-100"
          }`}
        >
          {isParis ? (
            isDefaultChiroLogo(branding?.logos.chiro) ? (
              <ParisLockup
                heightPx={60}
                className="max-w-full"
                title={branding?.parisLockup.title}
                subtitle={branding?.parisLockup.subtitle}
              />
            ) : (
              <Image
                src={resolveChiroHeaderLogo(branding?.logos.chiro)}
                alt="Chiropractic Associates — Paris, TX"
                width={600}
                height={200}
                sizes="(max-width: 640px) 90vw, 600px"
                className="h-10 w-auto max-w-full object-contain mix-blend-multiply sm:h-12 md:h-14 lg:h-[3.75rem]"
                priority
              />
            )
          ) : ssLogoSrc ? (
            <Image
              src={ssLogoSrc}
              alt="Chiropractic Associates of Sulphur Springs"
              width={360}
              height={120}
              sizes="(max-width: 640px) 80vw, 360px"
              className="h-10 w-auto max-w-full object-contain mix-blend-multiply sm:h-12 md:h-14"
              priority
            />
          ) : (
            <SulphurSpringsLockup
              primary
              heightPx={56}
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
