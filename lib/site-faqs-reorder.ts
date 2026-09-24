/**
 * Pure helper for the FAQ reorder route (no firebase imports, so it is unit
 * tested in lib/site-faqs-reorder.test.ts).
 */

/**
 * New `order` values after staff reorder the FAQs an editor panel shows.
 *
 * The listed FAQs trade among the order values they already hold (smallest
 * value to the first id, and so on), so every FAQ that is not listed keeps its
 * value — and therefore its place on /faq and /sulphur-springs/q-and-a — and
 * every listed FAQ keeps its category. Tied values are nudged up just enough to
 * make the listed sequence strictly increasing, otherwise a move between two
 * FAQs sharing a value would not stick.
 *
 * Returns only the FAQs whose value changes.
 */
export function reorderedFaqSlots(
  orderedIds: readonly string[],
  currentOrder: ReadonlyMap<string, number>,
): Array<{ id: string; order: number }> {
  const slots = orderedIds.map((id) => currentOrder.get(id) ?? 0).sort((a, b) => a - b);
  const changes: Array<{ id: string; order: number }> = [];
  let previous = Number.NEGATIVE_INFINITY;
  orderedIds.forEach((id, i) => {
    let order = slots[i]!;
    if (order <= previous) order = previous + 1;
    previous = order;
    if (currentOrder.get(id) !== order) changes.push({ id, order });
  });
  return changes;
}
