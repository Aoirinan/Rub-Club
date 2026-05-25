import Image from "next/image";
import Link from "next/link";
import { SulphurSpringsLockup } from "@/components/SulphurSpringsLockup";
import { IMAGES } from "@/lib/home-images";
import { BRAND_LOGOS, type BrandLogoVariant } from "@/lib/brand-logos";
import { telHref, type LocationInfo } from "@/lib/constants";
import type { HeaderBrandingHeights } from "@/lib/header-branding-cms";

type BrandKey = "rub" | "chiro" | "ss";

type LogoEntry = {
  key: BrandKey;
  /** Omitted for Sulphur Springs — uses `SulphurSpringsLockup` instead. */
  src?: string;
  alt: string;
  phone: string;
  phoneLabel: string;
  href: string;
  width: number;
  height: number;
};

function buildBrandEntries(paris: LocationInfo, sulphur: LocationInfo): LogoEntry[] {
  const rubPhone = paris.phoneSecondary?.trim() || paris.phonePrimary;
  return [
    {
      key: "rub",
      src: IMAGES.rubClubLogo,
      alt: "The Rub Club",
      phone: rubPhone,
      phoneLabel: "Massage",
      href: "/services/massage",
      width: 320,
      height: 65,
    },
    {
      key: "chiro",
      src: BRAND_LOGOS.chiropractic,
      alt: "Chiropractic Associates",
      phone: paris.phonePrimary,
      phoneLabel: "Chiropractic — Paris",
      href: "/services/chiropractic",
      width: 280,
      height: 72,
    },
    {
      key: "ss",
      alt: "Chiropractic Associates of Sulphur Springs",
      phone: sulphur.phonePrimary,
      phoneLabel: "Sulphur Springs",
      href: "/sulphur-springs",
      width: 360,
      height: 80,
    },
  ];
}

function primaryKeyForVariant(variant: BrandLogoVariant): BrandKey {
  switch (variant) {
    case "massage":
      return "rub";
    case "chiropractic":
      return "chiro";
    case "sulphur-springs":
      return "ss";
    case "home":
    default:
      return "rub";
  }
}

/** Center = active page brand; sides = the other two (always three logos). */
function orderedForVariant(variant: BrandLogoVariant, entries: LogoEntry[]): LogoEntry[] {
  const primaryKey = primaryKeyForVariant(variant);
  const byKey = Object.fromEntries(entries.map((e) => [e.key, e])) as Record<BrandKey, LogoEntry>;
  const primary = byKey[primaryKey];
  const sides = (["rub", "chiro", "ss"] as const).filter((k) => k !== primaryKey).map((k) => byKey[k]);
  return [sides[0]!, primary, sides[1]!];
}

function logoHeightClass(primary: boolean): string {
  return primary
    ? "h-12 w-auto max-w-[min(100%,340px)] sm:h-14 md:h-16 lg:h-[4.5rem]"
    : "h-7 w-auto max-w-[min(100%,200px)] opacity-90 transition-opacity hover:opacity-100 sm:h-9 md:h-10";
}

function logoHeightPx(
  key: BrandKey,
  primary: boolean,
  heights?: HeaderBrandingHeights,
): number | undefined {
  if (!heights) return undefined;
  const brand = heights[key];
  return primary ? brand.center : brand.side;
}

export function BrandLogoStrip({
  variant = "home",
  paris,
  sulphur,
  headerHeights,
  className = "",
}: {
  variant?: BrandLogoVariant;
  paris: LocationInfo;
  sulphur: LocationInfo;
  headerHeights?: HeaderBrandingHeights;
  className?: string;
}) {
  const entries = orderedForVariant(variant, buildBrandEntries(paris, sulphur));
  const primaryKey = primaryKeyForVariant(variant);

  return (
    <div
      className={`grid w-full grid-cols-3 items-end gap-2 sm:gap-4 md:gap-6 ${className}`}
    >
      {entries.map((entry) => {
        const primary = entry.key === primaryKey;
        const heightPx = logoHeightPx(entry.key, primary, headerHeights);
        const sizeClass = heightPx ? "w-auto max-w-[min(100%,340px)]" : logoHeightClass(primary);
        const sizeStyle = heightPx ? { height: `${heightPx}px` } : undefined;
        const img =
          entry.key === "ss" ? (
            <SulphurSpringsLockup
              primary={primary}
              heightPx={heightPx}
              iconScalePercent={headerHeights?.ss.iconScalePercent}
              className={`mx-auto sm:mx-0 ${heightPx ? sizeClass : logoHeightClass(primary)}`}
            />
          ) : (
            <Image
              src={entry.src!}
              alt={entry.alt}
              width={entry.width}
              height={entry.height}
              style={sizeStyle}
              className={`mx-auto object-contain sm:mx-0 sm:object-left ${sizeClass} ${
                !primary ? "opacity-90 transition-opacity hover:opacity-100" : ""
              }`}
              priority={primary}
            />
          );
        return (
          <div
            key={entry.key}
            className={`flex min-w-0 flex-col items-center sm:items-start ${
              primary ? "md:px-2" : "md:px-1"
            }`}
          >
            <Link
              href={entry.href}
              className="block w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f5f5c]"
              aria-label={`${entry.alt} — go to ${entry.phoneLabel}`}
            >
              {img}
            </Link>
            <a
              href={telHref(entry.phone)}
              className={`mt-1.5 text-center font-black text-[#0f5f5c] hover:underline sm:text-left ${
                primary ? "text-sm sm:text-base" : "text-xs sm:text-sm"
              }`}
            >
              {entry.phone}
            </a>
            <span
              className={`text-center font-bold uppercase tracking-wide text-stone-500 sm:text-left ${
                primary ? "text-[10px] sm:text-xs" : "text-[9px] sm:text-[10px]"
              }`}
            >
              {entry.phoneLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
