import Image from "next/image";
import { BRAND_LOGOS } from "@/lib/brand-logos";

/** Icon + type lockup — avoids the old screenshot PNG (off-center, muddy background). */
export function SulphurSpringsLockup({
  primary = false,
  compact = false,
  heightPx,
  iconScalePercent = 88,
  className = "",
  /** Mobile/header hero: icon centered on top, type centered below. */
  stacked = false,
  /** Nav center: icon only — saves horizontal space beside split nav links. */
  markOnly = false,
}: {
  primary?: boolean;
  /** Icon only — for side columns on narrow screens. */
  compact?: boolean;
  heightPx?: number;
  iconScalePercent?: number;
  className?: string;
  stacked?: boolean;
  markOnly?: boolean;
}) {
  const iconPct = Math.min(100, Math.max(60, iconScalePercent));

  const icon = (
    <Image
      src={BRAND_LOGOS.sulphurSpringsIcon}
      alt=""
      width={120}
      height={120}
      aria-hidden
      className="aspect-square w-auto shrink-0 object-contain"
      style={heightPx ? { height: `${heightPx}px` } : undefined}
    />
  );

  if (markOnly) {
    return <span className={`inline-flex shrink-0 ${className}`}>{icon}</span>;
  }

  if (stacked) {
    return (
      <span className={`inline-flex max-w-full flex-col items-center gap-1.5 ${className}`}>
        {icon}
        <span className="flex flex-col items-center text-center leading-tight text-[#243447]">
          <span className="text-lg font-semibold tracking-tight sm:text-xl">
            Chiropractic Associates
          </span>
          <span className="text-xs font-medium text-[#243447]/90 sm:text-sm">
            Of Sulphur Springs
          </span>
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 sm:gap-2 ${className}`}
      style={heightPx ? { height: `${heightPx}px` } : undefined}
    >
      <Image
        src={BRAND_LOGOS.sulphurSpringsIcon}
        alt=""
        width={120}
        height={120}
        aria-hidden
        className="aspect-square w-auto shrink-0 object-contain"
        style={{ height: `${iconPct}%`, maxHeight: "100%" }}
      />
      {compact ? (
        <span className="sr-only sm:hidden">Chiropractic Associates of Sulphur Springs</span>
      ) : null}
      <span
        className={`min-w-0 flex-col justify-center text-left leading-tight text-[#243447] ${
          compact ? "hidden sm:flex" : "flex"
        }`}
      >
        <span
          className={`whitespace-nowrap font-semibold tracking-tight ${
            primary
              ? "text-[0.8rem] sm:text-sm md:text-base lg:text-lg"
              : "text-[0.5rem] sm:text-[0.62rem] md:text-[0.7rem]"
          }`}
        >
          Chiropractic Associates
        </span>
        <span
          className={`whitespace-nowrap font-medium text-[#243447]/90 ${
            primary
              ? "text-[0.62rem] sm:text-[0.7rem] md:text-xs lg:text-sm"
              : "text-[0.45rem] sm:text-[0.55rem] md:text-[0.62rem]"
          }`}
        >
          Of Sulphur Springs
        </span>
      </span>
    </span>
  );
}
