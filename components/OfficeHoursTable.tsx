import type { OfficeHoursRow } from "@/lib/office-hours";

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
  return (
    <dl className="space-y-1">
      {rows.map((row) => (
        <div key={`${row.day}-${row.hours}`} className={rowClassName}>
          <dt className={dayClassName}>{row.day}</dt>
          <dd className={hoursClassName}>{row.hours || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
