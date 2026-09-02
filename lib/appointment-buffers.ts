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
  const before = Math.max(0, spec.bufferBeforeMinutes);
  const after = Math.max(0, spec.bufferAfterMinutes);
  const blockStart = z.minus({ minutes: before });
  // Bucket ids live on the 30-minute slot grid. A buffer that is not a multiple
  // of 30 must be snapped DOWN to the grid (and the span rounded UP) so every
  // grid slot the appointment + buffers touch is blocked.
  const alignedStart = blockStart.set({
    minute: Math.floor(blockStart.minute / 30) * 30,
    second: 0,
    millisecond: 0,
  });
  const blockEnd = z.plus({ minutes: spec.durationMinutes + after });
  const spanMin = Math.max(0, blockEnd.diff(alignedStart, "minutes").minutes);
  return enumerateThirtyMinuteStarts(alignedStart, spanMin);
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
