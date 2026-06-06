/** Expand only when nearly at the top of the page. */
export const COMPACT_EXIT_Y = 16;

/**
 * Enter compact only after scrolling far enough that shrinking the header
 * (~40–60px) cannot push scrollY back below COMPACT_EXIT_Y.
 */
export const COMPACT_ENTER_Y = 112;

export function resolveHeaderCompact(prev: boolean, scrollY: number): boolean {
  return prev ? scrollY > COMPACT_EXIT_Y : scrollY >= COMPACT_ENTER_Y;
}
