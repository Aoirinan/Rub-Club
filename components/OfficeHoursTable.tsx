"use client";

import { hoursShifts } from "@/lib/office-hours-format";
import type { OfficeHoursRow } from "@/lib/office-hours";
import { useUiText } from "@/components/SiteChromeProvider";

type Props = {
  rows: readonly OfficeHoursRow[];
  dayClassName?: string;
  hoursClassName?: string;
  rowClassName?: string;
};

export function OfficeHoursTable({
  rows,
  dayClassName = "font-bold text-[#4a1515]",
  hoursClassName = "text-stone-700",
  rowClassName = "flex justify-between gap-4 border-b border-stone-200 py-2 text-sm",
}: Props) {
  const t = useUiText();
  return (
    <dl className="space-y-1">
      {rows.map((row) => {
        const shifts = hoursShifts(row.hours);
        return (
          <div key={`${row.day}-${row.hours}`} className={rowClassName}>
            <dt className={dayClassName}>{row.day}</dt>
            <dd className={`${hoursClassName} text-right`}>
              {shifts.length === 0 ? (
                t.ui_hours_empty
              ) : (
                shifts.map((shift) => (
                  <span key={shift} className="block whitespace-nowrap">
                    {shift}
                  </span>
                ))
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
