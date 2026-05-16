import Link from "next/link";
import { publicBookingHref } from "@/lib/public-booking";

const PRIMARY =
  "focus-ring bg-[#f2d25d] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#173f3b] shadow hover:bg-[#e6c13d]";
const PRIMARY_COMPACT =
  "focus-ring bg-[#f2d25d] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#173f3b] hover:bg-[#e6c13d]";
const PRIMARY_NAV =
  "focus-ring ml-2 bg-[#f2d25d] px-5 py-2 text-xs font-black uppercase tracking-wide text-[#0c2d3a] shadow-sm hover:bg-[#e6c13d] xl:text-sm";
const PRIMARY_TEAL =
  "focus-ring bg-[#0f5f5c] px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow hover:bg-[#0f817b]";
const PRIMARY_SS =
  "focus-ring bg-[#2980b9] px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow hover:bg-[#1a6da3]";

const VARIANT_CLASS = {
  default: PRIMARY,
  compact: PRIMARY_COMPACT,
  nav: PRIMARY_NAV,
  teal: PRIMARY_TEAL,
  ss: PRIMARY_SS,
} as const;

type Props = {
  label: string;
  query?: string;
  className?: string;
  variant?: keyof typeof VARIANT_CLASS;
};

export function BookingCta({ label, query = "", className, variant = "default" }: Props) {
  const href = publicBookingHref(query);
  const classes = className ?? VARIANT_CLASS[variant];
  return (
    <Link href={href} className={classes}>
      {label}
    </Link>
  );
}
