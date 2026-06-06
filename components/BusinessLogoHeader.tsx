"use client";

import Image from "next/image";
import Link from "next/link";
import { SulphurSpringsLockup } from "@/components/SulphurSpringsLockup";
import {
  CHIRO_LOGO_DIMENSIONS,
  resolveChiroHeaderLogo,
  type HeaderBrandContent,
} from "@/lib/brand-logos";
import { telHref, type LocationInfo } from "@/lib/constants";
import type { SiteBusinessContext } from "@/lib/site-business-context";

const CHIRO_LOGO_HEIGHT =
  "h-10 w-auto max-w-[min(100%,min(100vw-1.5rem,520px)] sm:h-12 md:h-14 lg:h-[3.75rem] xl:max-w-[600px]";

export function BusinessLogoHeader({
  context,
  paris,
  sulphur,
  branding,
}: {
  context: SiteBusinessContext;
  paris: LocationInfo;
  sulphur: LocationInfo;
  branding?: HeaderBrandContent;
}) {
  const isParis = context === "paris_chiro";
  const location = isParis ? paris : sulphur;
  const href = isParis ? "/services/chiropractic" : "/sulphur-springs";
  const phoneLabel = isParis ? "Chiropractic — Paris" : "Chiro / Massage — Sulphur Springs";

  return (
    <div className="flex w-full flex-col items-center gap-1 text-center">
      <Link
        href={href}
        className="block w-fit max-w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f5f5c]"
        aria-label={
          isParis
            ? "Chiropractic Associates — Paris, TX"
            : "Chiropractic Associates of Sulphur Springs"
        }
      >
        {isParis ? (
          <Image
            src={resolveChiroHeaderLogo(branding?.logos.chiro)}
            alt="Chiropractic Associates — Paris, TX"
            width={CHIRO_LOGO_DIMENSIONS.width}
            height={CHIRO_LOGO_DIMENSIONS.height}
            sizes="(max-width: 640px) 90vw, 600px"
            className={`${CHIRO_LOGO_HEIGHT} object-contain`}
            priority
          />
        ) : (
          <SulphurSpringsLockup
            primary
            heightPx={56}
            className="max-w-full"
          />
        )}
      </Link>
      <a
        href={telHref(location.phonePrimary)}
        className="max-w-full truncate font-black text-[#0f5f5c] hover:underline text-sm md:text-base"
      >
        {location.phonePrimary}
      </a>
      <span className="max-w-full truncate text-[10px] font-bold uppercase tracking-wide text-stone-500 md:text-xs">
        {phoneLabel}
      </span>
      <Link
        href="/"
        className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0f5f5c] hover:underline md:text-xs"
      >
        All practices →
      </Link>
    </div>
  );
}
