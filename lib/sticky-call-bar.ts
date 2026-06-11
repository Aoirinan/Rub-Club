/** CMS field ids for the mobile sticky Call/Book bottom bar (per location). */
export const STICKY_CALL_BAR_PARIS_FIELD = "sticky_call_bar_paris" as const;
export const STICKY_CALL_BAR_SS_FIELD = "sticky_call_bar_ss" as const;

/** CMS field id for the floating accessibility-options button. */
export const ACCESSIBILITY_PANEL_FIELD = "accessibility_panel_enabled" as const;

/** CMS stores "true"/"false"; enabled unless explicitly false or "no". */
export function parseCmsToggle(value: string | undefined): boolean {
  const v = value?.trim().toLowerCase();
  return v !== "false" && v !== "no";
}
