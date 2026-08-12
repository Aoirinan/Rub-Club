import { getContentMany } from "@/lib/cms";
import { CHIRO, MASSAGE } from "@/lib/home-verbatim";

export type OfficeHoursRow = { day: string; hours: string };

import { SS_HOURS_DEFAULT_TEXT } from "@/lib/cms-registry";

export {
  PARIS_HOURS_DEFAULT_TEXT,
  PARIS_CHIRO_HOURS_DEFAULT_TEXT,
  SS_HOURS_DEFAULT_TEXT,
} from "@/lib/cms-registry";

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

/**
 * Split a day's hours into its separate shifts so a split schedule can be
 * stacked one range per line instead of wrapping mid-range in narrow columns.
 * "8:00 AM – 1:00 PM, 2:00 PM – 5:00 PM" -> ["8:00 AM – 1:00 PM", "2:00 PM – 5:00 PM"]
 */
export function hoursShifts(hours: string): string[] {
  return hours
    .split(",")
    .map((shift) => shift.trim())
    .filter(Boolean);
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

/** The Rub Club (massage) office hours for the Paris location. */
export async function getParisOfficeHours(): Promise<OfficeHoursRow[]> {
  const c = await getContentMany(["paris_hours"]);
  return parseOfficeHoursCms(c.paris_hours, [...MASSAGE.hours]);
}

/** Chiropractic Associates office hours for the Paris location — a separate business from The Rub Club, kept on its own schedule. */
export async function getParisChiroOfficeHours(): Promise<OfficeHoursRow[]> {
  const c = await getContentMany(["paris_chiro_hours"]);
  return parseOfficeHoursCms(c.paris_chiro_hours, [...CHIRO.hours]);
}

const SS_HOURS_FALLBACK: OfficeHoursRow[] = parseOfficeHoursCms(SS_HOURS_DEFAULT_TEXT, []);

export async function getSulphurOfficeHours(): Promise<OfficeHoursRow[]> {
  const c = await getContentMany(["ss_hours"]);
  return parseOfficeHoursCms(c.ss_hours, SS_HOURS_FALLBACK);
}
