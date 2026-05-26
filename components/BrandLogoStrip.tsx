import Image from "next/image";
import Link from "next/link";
import { SulphurSpringsLockup } from "@/components/SulphurSpringsLockup";
import { headerBrandPhones } from "@/components/HeaderBrandBlock";
import { IMAGES } from "@/lib/home-images";
import { BRAND_LOGOS, type BrandLogoVariant } from "@/lib/brand-logos";
import { telHref, type LocationInfo } from "@/lib/constants";

type BrandKey = "rub" | "chiro" | "ss";

type LogoEntry = {
  key: BrandKey;
  src?: string;
  alt: string;
  href: string;
  width: number;
  height: number;
};

/** Side logos — base height; primary is 30% taller (see `primaryLogoHeightClass`). */
const SIDE_LOGO_HEIGHT =
  "h-8 w-auto max-w-[min(100%,200px)] sm:h-9 md:h-10 lg:max-w-[220px]";

/** Primary (active page) logo — 30% larger than side logos at each breakpoint. */
const PRIMARY_LOGO_HEIGHT =
  "h-[2.6rem] w-auto max-w-[min(100%,320px)] sm:h-[2.925rem] md:h-[3.25rem] lg:h-[3.9rem] lg:max-w-[380px]";

function buildBrandEntries(): LogoEntry[] {
  return [
    {
      key: "rub",
      src: IMAGES.rubClubLogo,
      alt: "The Rub Club Massage",
      href: "/services/massage",
      width: 320,
      height: 65,
    },
    {
      key: "chiro",
      src: BRAND_LOGOS.chiropractic,
      alt: "Chiropractic Associates — Paris, TX",
      href: "/services/chiropractic",
      width: 320,
      height: 90,
    },
    {
      key: "ss",
      alt: "Chiropractic Associates of Sulphur Springs",
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

/** Center column = active brand; left and right are the other two. */
function orderedForVariant(variant: BrandLogoVariant, entries: LogoEntry[]): LogoEntry[] {
  const primaryKey = primaryKeyForVariant(variant);
  const byKey = Object.fromEntries(entries.map((e) => [e.key, e])) as Record<BrandKey, LogoEntry>;
  const primary = byKey[primaryKey];
  const sides = (["rub", "chiro", "ss"] as const)
    .filter((k) => k !== primaryKey)
    .map((k) => byKey[k]);
  return [sides[0]!, primary, sides[1]!];
}

function columnAlignClass(columnIndex: number): string {
  if (columnIndex === 0) return "items-center sm:items-end sm:text-right";
  if (columnIndex === 2) return "items-center sm:items-start sm:text-left";
  return "items-center text-center";
}

function logoAlignClass(columnIndex: number, primary: boolean): string {
  const base = primary ? PRIMARY_LOGO_HEIGHT : SIDE_LOGO_HEIGHT;
  const mx =
    columnIndex === 0
      ? "mx-auto sm:ml-auto sm:mr-0"
      : columnIndex === 2
        ? "mx-auto sm:ml-0 sm:mr-auto"
        : "mx-auto";
  const opacity = primary ? "" : "opacity-90 transition-opacity hover:opacity-100";
  return `${base} ${mx} object-contain ${opacity}`;
}

/**
 * Hard-coded three-brand header: active page’s logo is centered and 30% larger;
 * phone number and label sit under each logo.
 */
export function BrandLogoStrip({
  variant = "home",
  paris,
  sulphur,
  className = "",
}: {
  variant?: BrandLogoVariant;
  paris: LocationInfo;
  sulphur: LocationInfo;
  className?: string;
}) {
  const entries = orderedForVariant(variant, buildBrandEntries());
  const primaryKey = primaryKeyForVariant(variant);

  return (
    <div
      className={`grid w-full grid-cols-3 items-end gap-1.5 sm:gap-3 md:gap-4 ${className}`}
    >
      {entries.map((entry, columnIndex) => {
        const primary = entry.key === primaryKey;
        const info = headerBrandPhones(entry.key, paris, sulphur);

        const ssHeightPx = primary ? 52 : 40;

        const logo =
          entry.key === "ss" ? (
            <SulphurSpringsLockup
              primary={primary}
              heightPx={ssHeightPx}
              className={`max-w-full ${columnIndex === 1 ? "mx-auto" : columnIndex === 0 ? "mx-auto sm:ml-auto sm:mr-0" : "mx-auto sm:ml-0 sm:mr-auto"} ${
                !primary ? "opacity-90 transition-opacity hover:opacity-100" : ""
              }`}
            />
          ) : (
            <Image
              src={entry.src!}
              alt={entry.alt}
              width={entry.width}
              height={entry.height}
              className={logoAlignClass(columnIndex, primary)}
              priority={primary}
            />
          );

        return (
          <div
            key={entry.key}
            className={`flex min-w-0 flex-col gap-0.5 ${columnAlignClass(columnIndex)} ${
              primary ? "z-[1] md:px-0.5" : "md:px-0"
            }`}
          >
            <Link
              href={info.href}
              className="block w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f5f5c]"
              aria-label={`${entry.alt} — go to ${info.phoneLabel}`}
            >
              {logo}
            </Link>
            <a
              href={telHref(info.phone)}
              className={`whitespace-nowrap font-black text-[#0f5f5c] hover:underline ${
                primary ? "text-sm sm:text-base" : "text-xs sm:text-sm"
              }`}
            >
              {info.phone}
            </a>
            <span
              className={`max-w-full truncate font-bold uppercase tracking-wide text-stone-500 ${
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
