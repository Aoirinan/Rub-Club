import Image from "next/image";
import Link from "next/link";
import { SulphurSpringsLockup } from "@/components/SulphurSpringsLockup";
import { headerBrandPhones } from "@/components/HeaderBrandBlock";
import {
  CHIRO_LOGO_DIMENSIONS,
  resolveChiroHeaderLogo,
  type BrandLogoVariant,
  type HeaderBrandContent,
} from "@/lib/brand-logos";
import { telHref, type LocationInfo } from "@/lib/constants";

type BrandKey = "chiro" | "ss";

type LogoEntry = {
  key: BrandKey;
  src?: string;
  alt: string;
  href: string;
  width: number;
  height: number;
};

/** Wide lockups — side height; primary is ~30% taller. */
const SIDE_LOGO_HEIGHT =
  "h-8 w-auto max-w-[min(100%,200px)] sm:h-9 md:h-10 lg:max-w-[220px]";

const PRIMARY_LOGO_HEIGHT =
  "h-[2.6rem] w-auto max-w-[min(100%,320px)] sm:h-[2.925rem] md:h-[3.25rem] lg:h-[3.9rem] lg:max-w-[380px]";

/**
 * Wide Paris lockup (~2.9:1) — height-led sizing (width follows aspect ratio).
 * Primary uses a taller cap so the lockup has similar visual weight.
 */
const CHIRO_SIDE_LOGO_HEIGHT =
  "h-8 w-auto max-w-[min(100%,280px)] sm:h-9 md:h-10 lg:max-w-[320px]";

const CHIRO_PRIMARY_LOGO_HEIGHT =
  "h-10 w-auto max-w-[min(100%,min(100vw-1.5rem,520px)] sm:h-12 md:h-14 lg:h-[3.75rem] xl:max-w-[600px]";

function buildBrandEntries(branding?: HeaderBrandContent): LogoEntry[] {
  return [
    {
      key: "chiro",
      src: resolveChiroHeaderLogo(branding?.logos.chiro),
      alt: "Chiropractic Associates — Paris, TX",
      href: "/services/chiropractic",
      width: CHIRO_LOGO_DIMENSIONS.width,
      height: CHIRO_LOGO_DIMENSIONS.height,
    },
    {
      key: "ss",
      // Empty string => render the icon + text lockup; a real URL replaces it.
      src: branding?.logos.ss || undefined,
      alt: "Chiropractic Associates of Sulphur Springs",
      href: "/sulphur-springs",
      width: 360,
      height: 120,
    },
  ];
}

/** Massage lives under the Paris site, so everything except Sulphur Springs emphasizes Paris. */
function primaryKeyForVariant(variant: BrandLogoVariant): BrandKey {
  return variant === "sulphur-springs" ? "ss" : "chiro";
}

function columnAlignClass(columnIndex: number): string {
  if (columnIndex === 0) return "items-end justify-self-end text-right";
  return "items-start justify-self-start text-left";
}

function logoHeightClass(brandKey: BrandKey, emphasize: boolean): string {
  if (brandKey === "chiro") {
    return emphasize ? CHIRO_PRIMARY_LOGO_HEIGHT : CHIRO_SIDE_LOGO_HEIGHT;
  }
  return emphasize ? PRIMARY_LOGO_HEIGHT : SIDE_LOGO_HEIGHT;
}

function logoAlignClass(brandKey: BrandKey, emphasize: boolean): string {
  const base = logoHeightClass(brandKey, emphasize);
  const opacity = emphasize ? "" : "opacity-90 transition-opacity hover:opacity-100";
  return `${base} object-contain transition-[height,max-width,opacity] duration-300 ease-out ${opacity}`;
}

/**
 * Two-site header: Paris (chiro + massage) on the left, Sulphur Springs on the
 * right; the active site’s logo is ~30% larger, with phone and label under each.
 */
export function BrandLogoStrip({
  variant = "home",
  paris,
  sulphur,
  branding,
  compact = false,
  className = "",
}: {
  variant?: BrandLogoVariant;
  paris: LocationInfo;
  sulphur: LocationInfo;
  branding?: HeaderBrandContent;
  /** When true (e.g. after scroll), the centered page logo uses side-column sizing. */
  compact?: boolean;
  className?: string;
}) {
  const entries = buildBrandEntries(branding);
  const primaryKey = primaryKeyForVariant(variant);

  return (
    <div
      className={`grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-end gap-3 sm:gap-[0.5in] lg:mx-auto ${className}`}
    >
      {entries.map((entry, columnIndex) => {
        const primary = entry.key === primaryKey;
        const emphasize = primary && !compact;
        const info = headerBrandPhones(entry.key, paris, sulphur);
        const labelText = branding?.labels[entry.key] ?? info.phoneLabel;

        const ssHeightPx = emphasize ? 48 : 36;
        const ssCompact = !emphasize;

        // Sulphur Springs uses the icon + text lockup unless a manager uploaded a logo image.
        const useSsLockup = entry.key === "ss" && !entry.src;

        const logo = useSsLockup ? (
          <SulphurSpringsLockup
            primary={emphasize}
            compact={ssCompact}
            heightPx={ssHeightPx}
            className={`max-w-full transition-[height] duration-300 ease-out ${!emphasize ? "opacity-90 transition-opacity hover:opacity-100" : ""}`}
          />
        ) : (
          <Image
            src={entry.src!}
            alt={entry.alt}
            width={entry.width}
            height={entry.height}
            sizes={
              entry.key === "chiro"
                ? emphasize
                  ? "(max-width: 640px) 90vw, 600px"
                  : "(max-width: 640px) 40vw, 320px"
                : undefined
            }
            className={logoAlignClass(entry.key, emphasize)}
            priority={primary}
          />
        );

        return (
          <div
            key={entry.key}
            className={`flex w-fit max-w-full min-w-0 flex-col gap-0.5 transition-[gap] duration-300 ease-out ${columnAlignClass(columnIndex)} ${
              primary ? "z-[1] md:px-0.5" : ""
            }`}
          >
            <Link
              href={info.href}
              className="block w-fit max-w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f5f5c]"
              aria-label={`${entry.alt} — go to ${labelText}`}
            >
              {logo}
            </Link>
            <a
              href={telHref(info.phone)}
              className={`max-w-full truncate font-black text-[#0f5f5c] transition-[font-size] duration-300 ease-out hover:underline ${
                emphasize ? "text-[11px] sm:text-sm md:text-base" : "text-[9px] sm:text-xs md:text-sm"
              }`}
            >
              {info.phone}
            </a>
            <span
              className={`max-w-full truncate font-bold uppercase tracking-wide text-stone-500 transition-[font-size] duration-300 ease-out ${
                emphasize ? "text-[9px] sm:text-[10px] md:text-xs" : "text-[8px] sm:text-[10px]"
              }`}
            >
              {labelText}
            </span>
          </div>
        );
      })}
    </div>
  );
}
