import type { FilterState } from "./types";

const WINDOW_NAME = "wellness-chiro-scheduler";

/** Open (or focus) the chiropractic day-board for a second monitor. */
export function openChiroSchedulerWindow(filters?: Pick<FilterState, "date" | "locationId">) {
  const params = new URLSearchParams();
  if (filters?.date) params.set("date", filters.date);
  if (filters?.locationId && filters.locationId !== "all") {
    params.set("loc", filters.locationId);
  }
  const qs = params.toString();
  const url = qs ? `/admin/chiro?${qs}` : "/admin/chiro";
  const features = [
    "popup=yes",
    "width=1280",
    "height=900",
    "menubar=no",
    "toolbar=no",
    "location=yes",
    "resizable=yes",
    "scrollbars=yes",
  ].join(",");
  return window.open(url, WINDOW_NAME, features);
}
