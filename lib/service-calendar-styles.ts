import { providerCalendarStyle, type ProviderCalendarStyle } from "./provider-colors";
import type { SchedulerServiceRow } from "./scheduler-service-types";

export function buildServiceStylesMap(
  services: SchedulerServiceRow[],
): Map<string, ProviderCalendarStyle> {
  const m = new Map<string, ProviderCalendarStyle>();
  for (const s of services) {
    m.set(
      s.id,
      providerCalendarStyle({
        id: s.id,
        displayName: s.name,
        textColor: s.textColor,
        bgColor: s.bgColor,
      }),
    );
  }
  return m;
}
