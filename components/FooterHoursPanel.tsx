"use client";

import { usePathname } from "next/navigation";
import { BookingCta } from "@/components/BookingCta";
import { LOCATIONS } from "@/lib/constants";
import type { DomainContextValue } from "@/lib/domain-context";
import { useSiteBusinessContext } from "@/lib/use-site-business-context";
import type { SiteBusinessContext } from "@/lib/site-business-context";
import { footerHoursFocus, type FooterHoursFocus } from "@/lib/footer-hours-context";
import type { OfficeHoursRow } from "@/lib/office-hours";

function HoursTable({ rows }: { rows: readonly OfficeHoursRow[] }) {
  return (
    <dl className="space-y-1">
      {rows.map((row) => (
        <div key={row.day} className="flex justify-between gap-3 border-b border-white/10 py-1">
          <dt className="font-bold text-white">{row.day}</dt>
          <dd className="text-white/80">{row.hours}</dd>
        </div>
      ))}
    </dl>
  );
}

function locationLabel(focus: FooterHoursFocus): string | null {
  if (focus === "paris") return LOCATIONS.paris.shortName;
  if (focus === "sulphur_springs") return LOCATIONS.sulphur_springs.shortName;
  return null;
}

export function FooterHoursPanel({
  parisHours,
  sulphurHours,
  initialDomainCtx,
  initialBusinessContext = "default",
}: {
  parisHours: readonly OfficeHoursRow[];
  sulphurHours: readonly OfficeHoursRow[];
  initialDomainCtx: DomainContextValue;
  initialBusinessContext?: SiteBusinessContext;
}) {
  const pathname = usePathname() ?? "/";
  const businessContext = useSiteBusinessContext(initialBusinessContext);
  const focus = footerHoursFocus(pathname, initialDomainCtx, businessContext);
  const subtitle = locationLabel(focus);

  return (
    <div className="text-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2d25d]">Hours</p>
      {subtitle ? (
        <p className="mt-1 text-xs font-bold text-white/70">{subtitle}</p>
      ) : null}
      <div className="mt-3 space-y-4">
        {focus === "paris" || focus === "both" ? (
          <div>
            {focus === "both" ? (
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-[#f2d25d]">
                {LOCATIONS.paris.shortName}
              </p>
            ) : null}
            <HoursTable rows={parisHours} />
          </div>
        ) : null}
        {focus === "sulphur_springs" || focus === "both" ? (
          <div>
            {focus === "both" ? (
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-[#f2d25d]">
                {LOCATIONS.sulphur_springs.shortName}
              </p>
            ) : null}
            <HoursTable rows={sulphurHours} />
          </div>
        ) : null}
      </div>
      <BookingCta
        label="Book online"
        variant="compact"
        className="focus-ring mt-4 inline-flex bg-[#f2d25d] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#173f3b] hover:bg-[#e6c13d]"
      />
    </div>
  );
}
