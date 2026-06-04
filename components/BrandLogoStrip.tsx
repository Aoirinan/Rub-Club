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

/** Wide lockups (Rub Club) — side height; primary is ~30% taller. */
const SIDE_LOGO_HEIGHT =
  "h-8 w-auto max-w-[min(100%,200px)] sm:h-9 md:h-10 lg:max-w-[220px]";

const PRIMARY_LOGO_HEIGHT =
  "h-[2.6rem] w-auto max-w-[min(100%,320px)] sm:h-[2.925rem] md:h-[3.25rem] lg:h-[3.9rem] lg:max-w-[380px]";

/**
 * Paris chiro lockup is nearly square — needs taller bounds than wide Rub/SS marks
 * so primary vs side sizing matches the old wide logo’s visual weight.
 */
const CHIRO_SIDE_LOGO_HEIGHT =
  "h-12 w-auto max-w-[min(100%,92px)] sm:h-[4.5rem] sm:max-w-[min(100%,200px)] md:h-20 lg:max-w-[240px]";

const CHIRO_PRIMARY_LOGO_HEIGHT =
  "h-[4.25rem] w-auto max-w-[min(100%,118px)] sm:h-28 sm:max-w-[280px] md:h-32 md:max-w-[320px] lg:h-40 lg:max-w-[420px] xl:h-44 xl:max-w-[460px]";

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
      width: 851,
      height: 618,
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
  if (columnIndex === 0) return "items-center justify-self-end sm:text-right";
  if (columnIndex === 2) return "items-center justify-self-start sm:text-left";
  return "items-center justify-self-center text-center";
}

function logoHeightClass(brandKey: BrandKey, primary: boolean): string {
  if (brandKey === "chiro") {
    return primary ? CHIRO_PRIMARY_LOGO_HEIGHT : CHIRO_SIDE_LOGO_HEIGHT;
  }
  return primary ? PRIMARY_LOGO_HEIGHT : SIDE_LOGO_HEIGHT;
}

function logoAlignClass(brandKey: BrandKey, primary: boolean): string {
  const base = logoHeightClass(brandKey, primary);
  const opacity = primary ? "" : "opacity-90 transition-opacity hover:opacity-100";
  return `${base} object-contain transition-[height,max-width,opacity] duration-200 ${opacity}`;
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
      className={`grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-1 max-[380px]:gap-0.5 sm:gap-2 md:gap-3 lg:mx-auto lg:gap-4 ${className}`}
    >
      {entries.map((entry, columnIndex) => {
        const primary = entry.key === primaryKey;
        const info = headerBrandPhones(entry.key, paris, sulphur);

        const ssHeightPx = primary ? 48 : 36;
        const ssCompact = !primary;

        const logo =
          entry.key === "ss" ? (
            <SulphurSpringsLockup
              primary={primary}
              compact={ssCompact}
              heightPx={ssHeightPx}
              className={`max-w-full ${!primary ? "opacity-90 transition-opacity hover:opacity-100" : ""}`}
            />
          ) : (
            <Image
              src={entry.src!}
              alt={entry.alt}
              width={entry.width}
              height={entry.height}
              className={logoAlignClass(entry.key, primary)}
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
              className={`max-w-full truncate font-black text-[#0f5f5c] hover:underline ${
                primary ? "text-[11px] sm:text-sm md:text-base" : "text-[9px] sm:text-xs md:text-sm"
              }`}
            >
              {info.phone}
            </a>
            <span
              className={`max-w-full truncate font-bold uppercase tracking-wide text-stone-500 ${
                primary ? "text-[9px] sm:text-[10px] md:text-xs" : "text-[8px] sm:text-[10px]"
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
