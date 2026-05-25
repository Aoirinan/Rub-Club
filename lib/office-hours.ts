import { getContentMany } from "@/lib/cms";
import { MASSAGE } from "@/lib/home-verbatim";

export type OfficeHoursRow = { day: string; hours: string };

export { PARIS_HOURS_DEFAULT_TEXT } from "@/lib/cms-registry";

function parseLine(line: string): OfficeHoursRow | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const pipe = trimmed.split("|");
  if (pipe.length >= 2) {
    return { day: pipe[0]!.trim(), hours: pipe.slice(1).join("|").trim() };
  }

  const colon = trimmed.match(/^([^:]+):\s*(.+)$/);
  if (colon) return { day: colon[1]!.trim(), hours: colon[2]!.trim() };

  const dash = trimmed.match(/^(.+?)\s+[–-]\s+(.+)$/);
  if (dash) return { day: dash[1]!.trim(), hours: dash[2]!.trim() };

  return { day: trimmed, hours: "" };
}

/** Parse Site content hours text into day / time rows (Paris table or SS summary lines). */
export function parseOfficeHoursCms(text: string | undefined, fallback: OfficeHoursRow[]): OfficeHoursRow[] {
  const raw = text?.trim();
  if (!raw) return fallback;

  const rows = raw
    .split(/\n/)
    .map(parseLine)
    .filter((r): r is OfficeHoursRow => r !== null);

  return rows.length > 0 ? rows : fallback;
}

export async function getParisOfficeHours(): Promise<OfficeHoursRow[]> {
  const c = await getContentMany(["paris_hours"]);
  return parseOfficeHoursCms(c.paris_hours, [...MASSAGE.hours]);
}

export async function getSulphurOfficeHours(): Promise<OfficeHoursRow[]> {
  const c = await getContentMany(["ss_hours"]);
  const fallback: OfficeHoursRow[] = [
    { day: "Monday – Friday", hours: "9:00 AM – 5:00 PM" },
    { day: "Saturday – Sunday", hours: "Closed" },
  ];
  return parseOfficeHoursCms(c.ss_hours, fallback);
}
