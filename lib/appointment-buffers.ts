import { DateTime } from "luxon";
import { TIME_ZONE } from "./constants";
import { enumerateThirtyMinuteStarts } from "./slots-luxon";

export type BufferSpec = {
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
};

/** Slot starts blocked for provider availability (appointment + buffers). */
export function blockedSlotStartsForAppointment(
  start: DateTime,
  spec: BufferSpec,
): DateTime[] {
  const z = start.setZone(TIME_ZONE).startOf("minute");
  const blockStart = z.minus({ minutes: Math.max(0, spec.bufferBeforeMinutes) });
  const totalMin =
    spec.durationMinutes +
    Math.max(0, spec.bufferBeforeMinutes) +
    Math.max(0, spec.bufferAfterMinutes);
  return enumerateThirtyMinuteStarts(blockStart, totalMin);
}

/** Calendar-only intervals for buffer zones (not the appointment itself). */
export function bufferOnlyIntervals(
  startMs: number,
  spec: BufferSpec,
): { startMs: number; endMs: number }[] {
  const start = DateTime.fromMillis(startMs).setZone(TIME_ZONE);
  const apptEnd = start.plus({ minutes: spec.durationMinutes });
  const out: { startMs: number; endMs: number }[] = [];
  const before = Math.max(0, spec.bufferBeforeMinutes);
  const after = Math.max(0, spec.bufferAfterMinutes);
  if (before > 0) {
    out.push({
      startMs: start.minus({ minutes: before }).toMillis(),
      endMs: start.toMillis(),
    });
  }
  if (after > 0) {
    out.push({
      startMs: apptEnd.toMillis(),
      endMs: apptEnd.plus({ minutes: after }).toMillis(),
    });
  }
  return out;
}
