import Image from "next/image";
import Link from "next/link";
import { ParisLockup } from "@/components/ParisLockup";
import { SulphurSpringsLockup } from "@/components/SulphurSpringsLockup";
import {
  CHIRO_LOGO_DIMENSIONS,
  resolveChiroHeaderLogo,
  type BrandLogoVariant,
  type HeaderBrandContent,
} from "@/lib/brand-logos";
import { telHref, type LocationInfo } from "@/lib/constants";
import {
  DEFAULT_HEADER_LOGO_HEIGHTS,
  headerLogoHeightPx,
  type HeaderLogoSlot,
} from "@/lib/header-logo-sizes";

type BrandKey = "chiro" | "ss";

type HeaderBrandPhoneInfo = {
  phone: string;
  phoneLabel: string;
  href: string;
};

function headerBrandPhones(
  key: BrandKey,
  paris: LocationInfo,
  sulphur: LocationInfo,
): HeaderBrandPhoneInfo {
  if (key === "chiro") {
    return {
      phone: paris.phonePrimary,
      phoneLabel: "Chiropractic — Paris",
      href: "/services/chiropractic",
    };
  }
  return {
    phone: sulphur.phonePrimary,
    phoneLabel: "Chiro / Massage",
    href: "/sulphur-springs",
  };
}

type LogoEntry = {
  key: BrandKey;
  src?: string;
  alt: string;
  href: string;
  width: number;
  height: number;
};

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

/**
 * Two-site header: only the current site's logo shows — Paris (chiro + massage)
 * on Paris pages, the Sulphur Springs lockup on Sulphur Springs pages.
 */
export function BrandLogoStrip({
  variant = "home",
  paris,
  sulphur,
  branding,
  compact = false,
  showContact = true,
  large = false,
  className = "",
}: {
  variant?: BrandLogoVariant;
  paris: LocationInfo;
  sulphur: LocationInfo;
  branding?: HeaderBrandContent;
  /** When true (e.g. after scroll), the centered page logo uses side-column sizing. */
  compact?: boolean;
  /** Hide the phone + label rows (logo-only, e.g. centered inside the nav bar). */
  showContact?: boolean;
  /** Bigger logo for the desktop nav center slot. */
  large?: boolean;
  className?: string;
}) {
  const primaryKey = primaryKeyForVariant(variant);
  const entries = buildBrandEntries(branding).filter((e) => e.key === primaryKey);

  return (
    <div
      className={`flex w-full max-w-6xl items-end justify-center gap-3 sm:gap-[0.5in] lg:mx-auto ${className}`}
    >
      {entries.map((entry) => {
        const primary = entry.key === primaryKey;
        const isCenterNav = large && primary;
        const emphasize = primary && !compact;
        // Mobile (non-large) emphasized logo uses a big, centered, stacked layout.
        const stacked = !large && emphasize;
        const info = headerBrandPhones(entry.key, paris, sulphur);
        const labelText = branding?.labels[entry.key] ?? info.phoneLabel;

        const ssBaseHeightPx = emphasize
          ? headerLogoHeightPx(
              branding?.logoHeights?.ss ?? DEFAULT_HEADER_LOGO_HEIGHTS.ss,
              large ? "nav" : "mobile",
            )
          : headerLogoHeightPx(
              branding?.logoHeights?.ss ?? DEFAULT_HEADER_LOGO_HEIGHTS.ss,
              "side",
            );
        const ssHeightPx = stacked ? Math.round(ssBaseHeightPx * 1.35) : ssBaseHeightPx;
        const ssCompact = !emphasize;

        const parisHeights = branding?.logoHeights?.chiro ?? DEFAULT_HEADER_LOGO_HEIGHTS.chiro;
        let parisSlot: HeaderLogoSlot = "side";
        if (isCenterNav) {
          // Desktop nav center: keep the circular mark only (match BusinessLogoHeader).
          parisSlot = compact ? "navCompact" : "nav";
        } else if (emphasize) {
          parisSlot = large ? "nav" : "mobile";
        }
        const parisBaseHeightPx = headerLogoHeightPx(parisHeights, parisSlot);
        const parisHeightPx = stacked
          ? Math.round(parisBaseHeightPx * 1.25)
          : parisBaseHeightPx;

        // Sulphur Springs uses the icon + text lockup unless a manager uploaded a logo image.
        const useSsLockup = entry.key === "ss" && !entry.src;
        // Paris always uses the transparent circular mark + type lockup (CMS flat
        // logo uploads are white-backed JPGs and do not blend into the header band).
        const useParisLockup = entry.key === "chiro";

        const logo = useSsLockup ? (
          <SulphurSpringsLockup
            primary={emphasize}
            compact={ssCompact}
            stacked={stacked}
            heightPx={ssHeightPx}
            className={`max-w-full transition-[height] duration-300 ease-out ${!emphasize ? "opacity-90 transition-opacity hover:opacity-100" : ""}`}
          />
        ) : useParisLockup ? (
          <ParisLockup
            heightPx={parisHeightPx}
            className={`max-w-full transition-[height] duration-300 ease-out ${!emphasize ? "opacity-90 transition-opacity hover:opacity-100" : ""}`}
            markOnly={isCenterNav || (large && !showContact) || (large && emphasize)}
            stacked={stacked}
            title={branding?.parisLockup.title}
            subtitle={branding?.parisLockup.subtitle}
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
            className={`w-auto max-w-full object-contain mix-blend-multiply transition-[height,opacity] duration-300 ease-out ${
              !emphasize ? "opacity-90 transition-opacity hover:opacity-100" : ""
            }`}
            style={{ height: `${ssHeightPx}px` }}
            priority={primary}
          />
        );

        return (
          <div
            key={entry.key}
            className={`flex w-fit max-w-full min-w-0 flex-col items-center gap-0.5 text-center transition-[gap] duration-300 ease-out ${
              primary ? "z-[1] md:px-0.5" : ""
            }`}
          >
            <Link
              href={info.href}
              className="block w-fit max-w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c0392b]"
              aria-label={`${entry.alt} — go to ${labelText}`}
            >
              {logo}
            </Link>
            {showContact ? (
              <>
                <a
                  href={telHref(info.phone)}
                  className={`max-w-full truncate font-black text-[#c0392b] transition-[font-size] duration-300 ease-out hover:underline ${
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
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
