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
};

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

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wellness Paris TX//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
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
    "STATUS:TENTATIVE",
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
