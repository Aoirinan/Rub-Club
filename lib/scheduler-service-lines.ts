import type { ServiceLine } from "./constants";
import type { SchedulerServiceRow } from "./scheduler-service-types";

/** Map a catalog row to massage / chiropractic / stretch for public booking filters. */
export function schedulerServiceMatchesLine(
  service: SchedulerServiceRow,
  line: ServiceLine,
): boolean {
  if (service.serviceLines?.length) {
    return service.serviceLines.includes(line);
  }
  const n = service.name.toLowerCase();
  if (line === "chiropractic") {
    return /\bdr\b/.test(n) || n.includes("taping") || n.includes("chiro");
  }
  if (line === "stretch") {
    return n.includes("stretch");
  }
  return (
    n.includes("massage") ||
    n.includes("promo") ||
    n.includes("hot stone") ||
    (!/\bdr\b/.test(n) && !n.includes("taping"))
  );
}

export function isCustomerVisibleService(service: SchedulerServiceRow): boolean {
  if (!service.active) return false;
  return service.visibility === "both" || service.visibility === "customer_only";
}
