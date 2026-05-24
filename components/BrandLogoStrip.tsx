import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/home-images";
import { BRAND_LOGOS, type BrandLogoVariant } from "@/lib/brand-logos";
import { telHref, type LocationInfo } from "@/lib/constants";

type LogoEntry = {
  src: string;
  alt: string;
  phone: string;
  phoneLabel: string;
  href?: string;
  primary: boolean;
  width: number;
  height: number;
};

function entriesForVariant(
  variant: BrandLogoVariant,
  paris: LocationInfo,
  sulphur: LocationInfo,
): LogoEntry[] {
  const rubPhone = paris.phoneSecondary?.trim() || paris.phonePrimary;
  const rub: LogoEntry = {
    src: IMAGES.rubClubLogo,
    alt: "The Rub Club",
    phone: rubPhone,
    phoneLabel: "Massage",
    href: "/services/massage",
    primary: variant === "home" || variant === "massage",
    width: 320,
    height: 65,
  };
  const chiro: LogoEntry = {
    src: BRAND_LOGOS.chiropractic,
    alt: "Chiropractic Associates",
    phone: paris.phonePrimary,
    phoneLabel: "Chiropractic — Paris",
    href: "/services/chiropractic",
    primary: variant === "chiropractic",
    width: 280,
    height: 72,
  };
  const ss: LogoEntry = {
    src: BRAND_LOGOS.sulphurSprings,
    alt: "Chiropractic Associates of Sulphur Springs",
    phone: sulphur.phonePrimary,
    phoneLabel: "Sulphur Springs",
    href: "/sulphur-springs",
    primary: variant === "sulphur-springs",
    width: 300,
    height: 40,
  };

  if (variant === "sulphur-springs") {
    return [
      { ...ss, primary: true },
      { ...rub, primary: false },
      { ...chiro, primary: false },
    ];
  }
  if (variant === "chiropractic") {
    return [
      { ...chiro, primary: true },
      { ...rub, primary: false },
    ];
  }
  if (variant === "massage") {
    return [
      { ...rub, primary: true },
      { ...chiro, primary: false },
    ];
  }
  return [
    { ...rub, primary: true, href: "/" },
    { ...chiro, primary: false, href: "/" },
  ];
}

function logoHeightClass(primary: boolean, variant: BrandLogoVariant) {
  if (variant === "home") {
    return primary
      ? "h-11 w-auto max-w-[min(100%,320px)] sm:h-14 lg:h-16"
      : "h-7 w-auto max-w-[min(100%,200px)] sm:h-9 lg:h-10";
  }
  return primary
    ? "h-10 w-auto max-w-[min(100%,300px)] sm:h-12 lg:h-14"
    : "h-6 w-auto max-w-[min(100%,160px)] sm:h-8";
}

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
  const entries = entriesForVariant(variant, paris, sulphur);

  return (
    <div
      className={`flex w-full flex-wrap items-end justify-center gap-6 sm:justify-start sm:gap-8 lg:gap-10 ${className}`}
    >
      {entries.map((entry) => {
        const img = (
          <Image
            src={entry.src}
            alt={entry.alt}
            width={entry.width}
            height={entry.height}
            className={`object-contain object-left ${logoHeightClass(entry.primary, variant)}`}
            priority={variant === "home" && entry.primary}
          />
        );
        return (
          <div
            key={entry.alt}
            className={`flex min-w-[140px] flex-1 flex-col items-center sm:items-start ${
              entry.primary ? "sm:flex-[1.4]" : "sm:flex-[0.85]"
            }`}
          >
            {entry.href ? (
              <Link href={entry.href} className="block w-full">
                {img}
              </Link>
            ) : (
              img
            )}
            <a
              href={telHref(entry.phone)}
              className="mt-1.5 text-center text-sm font-black text-[#0f5f5c] hover:underline sm:text-left sm:text-base"
            >
              {entry.phone}
            </a>
            <span className="text-center text-[10px] font-bold uppercase tracking-wide text-stone-500 sm:text-left">
              {entry.phoneLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
