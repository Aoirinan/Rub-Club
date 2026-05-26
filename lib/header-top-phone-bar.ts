/** CMS field id for the dark phone strip above header logos (Footer scope in site editor). */
export const HEADER_SHOW_TOP_PHONE_BAR_FIELD = "header_show_top_phone_bar" as const;

/** CMS stores "true"/"false"; enabled unless explicitly false or "no". */
export function parseHeaderShowTopPhoneBar(value: string | undefined): boolean {
  const v = value?.trim().toLowerCase();
  return v !== "false" && v !== "no";
}
