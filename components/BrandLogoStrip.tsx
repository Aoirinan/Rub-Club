import Image from "next/image";
import Link from "next/link";
import { HeaderBrandBlock, headerBrandPhones } from "@/components/HeaderBrandBlock";
import { SulphurSpringsLockup } from "@/components/SulphurSpringsLockup";
import { IMAGES } from "@/lib/home-images";
import { BRAND_LOGOS, type BrandLogoVariant } from "@/lib/brand-logos";
import { telHref, type LocationInfo } from "@/lib/constants";
import type { HeaderBrandingLayout } from "@/lib/header-branding-cms";
import { HEADER_BRAND_KEYS, type HeaderBrandKey } from "@/lib/header-branding-cms";

type BrandKey = HeaderBrandKey;

type LogoEntry = {
  key: BrandKey;
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

function FreeLayoutStrip({
  layout,
  paris,
  sulphur,
  className,
}: {
  layout: HeaderBrandingLayout;
  paris: LocationInfo;
  sulphur: LocationInfo;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full ${className ?? ""}`}
      style={{ height: layout.frameHeight, minHeight: layout.frameHeight }}
    >
      {HEADER_BRAND_KEYS.map((key) => {
        const box = layout.brands[key];
        return (
          <div
            key={key}
            className="absolute"
            style={{
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.w}%`,
              height: `${box.h}%`,
            }}
          >
            <HeaderBrandBlock
              brandKey={key}
              box={box}
              paris={paris}
              sulphur={sulphur}
              interactive={false}
            />
          </div>
        );
      })}
    </div>
  );
}

function GridLayoutStrip({
  variant,
  paris,
  sulphur,
  className,
}: {
  variant: BrandLogoVariant;
  paris: LocationInfo;
  sulphur: LocationInfo;
  className?: string;
}) {
  const entries = orderedForVariant(variant, buildBrandEntries(paris, sulphur));
  const primaryKey = primaryKeyForVariant(variant);

  return (
    <div className={`grid w-full grid-cols-3 items-end gap-2 sm:gap-4 md:gap-6 ${className ?? ""}`}>
      {entries.map((entry) => {
        const primary = entry.key === primaryKey;
        const img =
          entry.key === "ss" ? (
            <SulphurSpringsLockup
              primary={primary}
              className={`mx-auto sm:mx-0 ${logoHeightClass(primary)}`}
            />
          ) : (
            <Image
              src={entry.src!}
              alt={entry.alt}
              width={entry.width}
              height={entry.height}
              className={`mx-auto object-contain sm:mx-0 sm:object-left ${logoHeightClass(primary)} ${
                !primary ? "opacity-90 transition-opacity hover:opacity-100" : ""
              }`}
              priority={primary}
            />
          );
        const info = headerBrandPhones(entry.key, paris, sulphur);
        return (
          <div
            key={entry.key}
            className={`flex min-w-0 flex-col items-center sm:items-start ${
              primary ? "md:px-2" : "md:px-1"
            }`}
          >
            <Link
              href={info.href}
              className="block w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f5f5c]"
              aria-label={`${entry.alt} — go to ${info.phoneLabel}`}
            >
              {img}
            </Link>
            <a
              href={telHref(info.phone)}
              className={`mt-1.5 text-center font-black text-[#0f5f5c] hover:underline sm:text-left ${
                primary ? "text-sm sm:text-base" : "text-xs sm:text-sm"
              }`}
            >
              {info.phone}
            </a>
            <span
              className={`text-center font-bold uppercase tracking-wide text-stone-500 sm:text-left ${
                primary ? "text-[10px] sm:text-xs" : "text-[9px] sm:text-[10px]"
              }`}
            >
              {info.phoneLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function BrandLogoStrip({
  variant = "home",
  paris,
  sulphur,
  headerLayout,
  className = "",
}: {
  variant?: BrandLogoVariant;
  paris: LocationInfo;
  sulphur: LocationInfo;
  headerLayout?: HeaderBrandingLayout;
  /** @deprecated ignored when headerLayout is set */
  headerHeights?: unknown;
  className?: string;
}) {
  if (headerLayout) {
    return (
      <FreeLayoutStrip layout={headerLayout} paris={paris} sulphur={sulphur} className={className} />
    );
  }
  return (
    <GridLayoutStrip variant={variant} paris={paris} sulphur={sulphur} className={className} />
  );
}
