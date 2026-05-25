import Image from "next/image";
import { BRAND_LOGOS } from "@/lib/brand-logos";

/** Icon + type lockup — avoids the old screenshot PNG (off-center, muddy background). */
export function SulphurSpringsLockup({
  primary = false,
  heightPx,
  iconScalePercent = 88,
  className = "",
}: {
  primary?: boolean;
  heightPx?: number;
  iconScalePercent?: number;
  className?: string;
}) {
  const iconPct = Math.min(100, Math.max(60, iconScalePercent));
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
      <span className="flex min-w-0 flex-col justify-center text-left leading-tight text-[#243447]">
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
