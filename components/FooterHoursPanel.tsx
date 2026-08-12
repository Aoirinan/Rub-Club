"use client";

import { usePathname } from "next/navigation";
import { BookingCta } from "@/components/BookingCta";
import { LOCATIONS } from "@/lib/constants";
import type { DomainContextValue } from "@/lib/domain-context";
import { useSiteBusinessContext } from "@/lib/use-site-business-context";
import type { SiteBusinessContext } from "@/lib/site-business-context";
import { footerHoursFocus, type FooterHoursFocus } from "@/lib/footer-hours-context";
import { hoursShifts } from "@/lib/office-hours-format";
import type { OfficeHoursRow } from "@/lib/office-hours";

function HoursTable({ rows }: { rows: readonly OfficeHoursRow[] }) {
  return (
    <dl className="space-y-1">
      {rows.map((row) => (
        <div key={row.day} className="flex justify-between gap-3 border-b border-white/10 py-1">
          <dt className="font-bold text-white">{row.day}</dt>
          <dd className="text-right text-white/80">
            {hoursShifts(row.hours).map((shift) => (
              <span key={shift} className="block whitespace-nowrap">
                {shift}
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** "Monday" -> "Mon", so two hours columns can sit side by side in the footer. */
function shortDay(day: string): string {
  return day.trim().slice(0, 3);
}

/** "9:00 AM – 6:00 PM" -> "9am–6pm", "Closed" -> "Closed" — compact enough for a narrow column. */
function shortShift(shift: string): string {
  const times = shift.split(/[–-]/).map((t) => t.trim());
  if (times.length !== 2) return shift;
  const compact = (t: string) => {
    const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!m) return t;
    const [, h, min, ampm] = m;
    return `${h}${min && min !== "00" ? `:${min}` : ""}${ampm ? ampm.toLowerCase() : ""}`;
  };
  return `${compact(times[0]!)}–${compact(times[1]!)}`;
}

/** One entry per shift so a split schedule stacks instead of wrapping mid-range. */
function shortHoursLines(hours: string): string[] {
  const trimmed = hours.trim();
  if (!trimmed || /closed/i.test(trimmed)) return [trimmed || "—"];
  return hoursShifts(trimmed).map(shortShift);
}

/** Two hours sets shown side by side, one row per day, to keep the footer column short. */
function TwoBusinessHoursTable({
  leftLabel,
  leftRows,
  rightLabel,
  rightRows,
}: {
  leftLabel: string;
  leftRows: readonly OfficeHoursRow[];
  rightLabel: string;
  rightRows: readonly OfficeHoursRow[];
}) {
  const findHours = (rows: readonly OfficeHoursRow[], day: string) =>
    rows.find((r) => r.day.trim().toLowerCase() === day.trim().toLowerCase())?.hours;

  return (
    <div>
      <div className="mb-1 flex justify-between gap-2 text-[11px] font-bold text-white/70">
        <span className="w-8" />
        <span className="flex-1 text-right">{leftLabel}</span>
        <span className="flex-1 text-right">{rightLabel}</span>
      </div>
      <dl className="space-y-1">
        {leftRows.map((row, i) => {
          const rightHours = findHours(rightRows, row.day) ?? rightRows[i]?.hours ?? "—";
          return (
            <div
              key={row.day}
              className="flex justify-between gap-2 border-b border-white/10 py-1 text-xs"
            >
              <dt className="w-8 font-bold text-white">{shortDay(row.day)}</dt>
              {[row.hours, rightHours].map((value, col) => (
                <dd key={col} className="flex-1 text-right text-white/80">
                  {shortHoursLines(value).map((line) => (
                    <span key={line} className="block whitespace-nowrap">
                      {line}
                    </span>
                  ))}
                </dd>
              ))}
            </div>
          );
        })}
      </dl>
    </div>
  );
}

function locationLabel(focus: FooterHoursFocus): string | null {
  if (focus === "paris") return LOCATIONS.paris.shortName;
  if (focus === "sulphur_springs") return LOCATIONS.sulphur_springs.shortName;
  return null;
}

export function FooterHoursPanel({
  parisChiroHours,
  parisMassageHours,
  sulphurHours,
  initialDomainCtx,
  initialBusinessContext = "default",
}: {
  parisChiroHours: readonly OfficeHoursRow[];
  parisMassageHours: readonly OfficeHoursRow[];
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
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f19f1f]">Hours</p>
      {subtitle ? (
        <p className="mt-1 text-xs font-bold text-white/70">{subtitle}</p>
      ) : null}
      <div className="mt-3 space-y-4">
        {focus === "paris" || focus === "both" ? (
          <div>
            {focus === "both" ? (
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-[#f19f1f]">
                {LOCATIONS.paris.shortName}
              </p>
            ) : null}
            <TwoBusinessHoursTable
              leftLabel="Chiro"
              leftRows={parisChiroHours}
              rightLabel="Massage"
              rightRows={parisMassageHours}
            />
          </div>
        ) : null}
        {focus === "sulphur_springs" || focus === "both" ? (
          <div>
            {focus === "both" ? (
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-[#f19f1f]">
                {LOCATIONS.sulphur_springs.shortName}
              </p>
            ) : null}
            <HoursTable rows={sulphurHours} />
          </div>
        ) : null}
      </div>
      <BookingCta
        label="Book Now"
        variant="compact"
        className="focus-ring mt-4 inline-flex bg-[#4a1515] px-4 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-[#341010]"
      />
    </div>
  );
}
