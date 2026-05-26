"use client";

import Image from "next/image";
import Link from "next/link";
import { SulphurSpringsLockup } from "@/components/SulphurSpringsLockup";
import { IMAGES } from "@/lib/home-images";
import { BRAND_LOGOS } from "@/lib/brand-logos";
import { telHref, type LocationInfo } from "@/lib/constants";
import type { HeaderBrandBox, HeaderBrandKey } from "@/lib/header-branding-cms";

export type HeaderBrandPhoneInfo = {
  phone: string;
  phoneLabel: string;
  href: string;
};

export function headerBrandPhones(
  key: HeaderBrandKey,
  paris: LocationInfo,
  sulphur: LocationInfo,
): HeaderBrandPhoneInfo {
  const rubPhone = paris.phoneSecondary?.trim() || paris.phonePrimary;
  if (key === "rub") {
    return { phone: rubPhone, phoneLabel: "Massage", href: "/services/massage" };
  }
  if (key === "chiro") {
    return {
      phone: paris.phonePrimary,
      phoneLabel: "Chiropractic — Paris",
      href: "/services/chiropractic",
    };
  }
  return {
    phone: sulphur.phonePrimary,
    phoneLabel: "Sulphur Springs",
    href: "/sulphur-springs",
  };
}

export function HeaderBrandLogoVisual({
  brandKey,
  iconScale,
  className = "",
}: {
  brandKey: HeaderBrandKey;
  iconScale?: number;
  className?: string;
}) {
  if (brandKey === "ss") {
    return (
      <SulphurSpringsLockup
        primary
        iconScalePercent={iconScale ?? 88}
        className={`h-full max-h-full w-full max-w-full ${className}`}
      />
    );
  }
  const src = brandKey === "rub" ? IMAGES.rubClubLogo : BRAND_LOGOS.chiropractic;
  const alt = brandKey === "rub" ? "The Rub Club" : "Chiropractic Associates";
  return (
    <Image
      src={src}
      alt={alt}
      width={320}
      height={72}
      className={`max-h-full w-auto max-w-full object-contain object-left ${className}`}
      priority
    />
  );
}

export function HeaderBrandBlock({
  brandKey,
  box,
  paris,
  sulphur,
  interactive = true,
  selected = false,
  onSelect,
  onPointerDownBox,
  onPointerDownResize,
  disableLinks = false,
}: {
  brandKey: HeaderBrandKey;
  box: HeaderBrandBox;
  paris: LocationInfo;
  sulphur: LocationInfo;
  interactive?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onPointerDownBox?: (e: React.PointerEvent) => void;
  onPointerDownResize?: (e: React.PointerEvent) => void;
  disableLinks?: boolean;
}) {
  const info = headerBrandPhones(brandKey, paris, sulphur);

  const logoArea = (
    <div className="flex min-h-0 flex-1 items-end justify-center sm:justify-start">
      <HeaderBrandLogoVisual brandKey={brandKey} iconScale={box.iconScale} />
    </div>
  );

  const phoneArea = (
    <div className="shrink-0 pt-1">
      {interactive ? (
        <>
          <p className="text-center text-xs font-black text-[#0f5f5c] sm:text-left sm:text-sm">
            {info.phone}
          </p>
          <p className="text-center text-[9px] font-bold uppercase tracking-wide text-stone-500 sm:text-left sm:text-[10px]">
            {info.phoneLabel}
          </p>
        </>
      ) : disableLinks ? (
        <>
          <p className="block text-center text-xs font-black text-[#0f5f5c] sm:text-left sm:text-sm">
            {info.phone}
          </p>
          <span className="block text-center text-[9px] font-bold uppercase tracking-wide text-stone-500 sm:text-left sm:text-[10px]">
            {info.phoneLabel}
          </span>
        </>
      ) : (
        <>
          <a
            href={telHref(info.phone)}
            className="block text-center text-xs font-black text-[#0f5f5c] hover:underline sm:text-left sm:text-sm"
          >
            {info.phone}
          </a>
          <Link
            href={info.href}
            className="block text-center text-[9px] font-bold uppercase tracking-wide text-stone-500 hover:underline sm:text-left sm:text-[10px]"
          >
            {info.phoneLabel}
          </Link>
        </>
      )}
    </div>
  );

  return (
    <div
      className={`relative flex h-full min-h-0 flex-col ${interactive ? "cursor-move select-none" : ""} ${
        selected ? "ring-2 ring-[#0f5f5c] ring-offset-1" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onPointerDown={onPointerDownBox}
    >
      {interactive || disableLinks ? logoArea : <Link href={info.href}>{logoArea}</Link>}
      {phoneArea}
      {interactive && selected ? (
        <span
          role="presentation"
          className="absolute bottom-0 right-0 z-10 h-4 w-4 cursor-se-resize rounded-sm border-2 border-[#0f5f5c] bg-white shadow"
          onPointerDown={onPointerDownResize}
        />
      ) : null}
    </div>
  );
}
