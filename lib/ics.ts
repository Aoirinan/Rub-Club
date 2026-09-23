import { DateTime } from "luxon";

type IcsEvent = {
  uid: string;
  startUtc: DateTime;
  durationMinutes: number;
  summary: string;
  description: string;
  location: string;
  organizerEmail?: string;
  organizerName?: string;
  url?: string;
  /** RFC 5545 calendar method — use REQUEST when updating an existing invite. */
  method?: "PUBLISH" | "REQUEST";
  /**
   * Booking status. Pending requests are marked TENTATIVE; every current caller
   * only attaches an invite once the visit is confirmed, so that is the default.
   */
  status?: "confirmed" | "pending";
  /**
   * RFC 5545 SEQUENCE. Calendar apps only replace an event with the same UID
   * when the SEQUENCE is higher, so it must grow each time the invite is
   * regenerated (e.g. after a reschedule). Defaults to icsSequenceNow().
   */
  sequence?: number;
};

/** Seconds since 2025-01-01 UTC: increases on every regeneration and stays well inside RFC 5545's 32-bit INTEGER. */
const ICS_SEQUENCE_EPOCH_MS = Date.UTC(2025, 0, 1);

export function icsSequenceNow(nowMs: number = Date.now()): number {
  return Math.max(0, Math.floor((nowMs - ICS_SEQUENCE_EPOCH_MS) / 1000));
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toIcsUtc(dt: DateTime): string {
  const u = dt.toUTC();
  return (
    `${u.year}${pad(u.month)}${pad(u.day)}T` +
    `${pad(u.hour)}${pad(u.minute)}${pad(u.second)}Z`
  );
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldLine(line: string): string {
  if (line.length <= 73) return line;
  const parts: string[] = [];
  let i = 0;
  while (i < line.length) {
    const chunk = line.slice(i, i + 73);
    parts.push(i === 0 ? chunk : ` ${chunk}`);
    i += 73;
  }
  return parts.join("\r\n");
}

/** Build an RFC 5545 .ics document for a single appointment. */
export function buildIcs(event: IcsEvent): string {
  const dtStart = toIcsUtc(event.startUtc);
  const dtEnd = toIcsUtc(event.startUtc.plus({ minutes: event.durationMinutes }));
  const dtStamp = toIcsUtc(DateTime.utc());
  const sequence =
    typeof event.sequence === "number" && Number.isInteger(event.sequence) && event.sequence >= 0
      ? event.sequence
      : icsSequenceNow();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wellness Paris TX//Booking//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${event.method ?? "PUBLISH"}`,
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `SEQUENCE:${sequence}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeText(event.summary)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    event.url ? `URL:${escapeText(event.url)}` : "",
    event.organizerEmail
      ? `ORGANIZER;CN=${escapeText(event.organizerName ?? event.organizerEmail)}:mailto:${event.organizerEmail}`
      : "",
    `STATUS:${event.status === "pending" ? "TENTATIVE" : "CONFIRMED"}`,
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-PT2H",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.map(foldLine).join("\r\n");
}
