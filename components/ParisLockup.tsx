import Image from "next/image";
import { BRAND_LOGOS } from "@/lib/brand-logos";

/**
 * Paris header lockup: circular brand mark + type, mirroring SulphurSpringsLockup.
 * Replaces the padded wide PNG whose curved text was unreadable at header sizes.
 */
export function ParisLockup({
  heightPx = 60,
  className = "",
  title = "Chiropractic Associates",
  subtitle = "& The Rub Club · Paris, TX",
  /** Nav center: show only the circular mark (image already includes curved type). */
  markOnly = false,
  /** Mobile/header hero: mark centered on top, type centered below. */
  stacked = false,
}: {
  heightPx?: number;
  className?: string;
  /** CMS-editable lockup text (Footer → Header in site content). */
  title?: string;
  subtitle?: string;
  markOnly?: boolean;
  stacked?: boolean;
}) {
  const mark = (
    <span
      className="inline-flex shrink-0"
      style={{ height: `${heightPx}px` }}
    >
      <Image
        src={BRAND_LOGOS.chiropracticMark}
        alt=""
        width={160}
        height={120}
        aria-hidden
        unoptimized
        className="h-full w-auto object-contain"
        priority
      />
    </span>
  );

  if (stacked) {
    return (
      <span className={`inline-flex max-w-full flex-col items-center gap-1.5 ${className}`}>
        {mark}
        {markOnly ? null : (
          <span className="flex min-w-0 flex-col items-center text-center leading-tight">
            <span className="text-lg font-black tracking-tight text-[#4a1515] sm:text-xl">
              {title}
            </span>
            {subtitle ? (
              <span className="text-xs font-bold text-[#b03a2e] sm:text-sm">{subtitle}</span>
            ) : null}
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex max-w-full items-center gap-2 sm:gap-2.5 ${className}`}
      style={{ height: `${heightPx}px` }}
    >
      <span className="inline-flex shrink-0" style={{ height: "100%" }}>
        <Image
          src={BRAND_LOGOS.chiropracticMark}
          alt=""
          width={160}
          height={120}
          aria-hidden
          unoptimized
          className="h-full w-auto object-contain"
          priority
        />
      </span>
      {markOnly ? null : (
        <span className="flex min-w-0 flex-col justify-center text-left leading-tight">
          <span className="whitespace-nowrap text-base font-black tracking-tight text-[#4a1515] sm:text-lg md:text-xl lg:text-2xl">
            {title}
          </span>
          {subtitle ? (
            <span className="whitespace-nowrap text-[0.7rem] font-bold text-[#b03a2e] sm:text-xs md:text-sm">
              {subtitle}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );
}
