import { describe, expect, it } from "vitest";
import { reorderedFaqSlots } from "./site-faqs-reorder";

function apply(
  current: Record<string, number>,
  orderedIds: string[],
): Record<string, number> {
  const next = { ...current };
  for (const { id, order } of reorderedFaqSlots(orderedIds, new Map(Object.entries(current)))) {
    next[id] = order;
  }
  return next;
}

/** Ids sorted the way the public pages sort them: by order, then document id. */
function publicOrder(values: Record<string, number>, ids: string[]): string[] {
  return [...ids].sort((a, b) => values[a]! - values[b]! || a.localeCompare(b));
}

describe("reorderedFaqSlots", () => {
  it("swaps two neighbours and touches nothing else", () => {
    const current = { a: 0, b: 1, c: 2, d: 3 };
    expect(reorderedFaqSlots(["a", "c", "b", "d"], new Map(Object.entries(current)))).toEqual([
      { id: "c", order: 1 },
      { id: "b", order: 2 },
    ]);
  });

  it("moving a FAQ down never sends it to the top when the list mixes categories", () => {
    // Paris panel: general FAQs plus a stray category, while the Sulphur
    // Springs FAQs (not listed) share the same low order values.
    const current = { g1: 0, g2: 1, stray: 2, g3: 3, ss1: 0, ss2: 1 };
    const next = apply(current, ["g1", "g2", "g3", "stray"]);
    expect(publicOrder(next, ["g1", "g2", "stray", "g3"])).toEqual(["g1", "g2", "g3", "stray"]);
    // Unlisted FAQs keep their values.
    expect(next.ss1).toBe(0);
    expect(next.ss2).toBe(1);
    // The FAQ moved down lands one place lower, not first.
    expect(next.stray).toBeGreaterThan(next.g3!);
    expect(next.g3).toBeGreaterThan(next.g2!);
  });

  it("makes tied values strictly increasing so the move sticks", () => {
    const current = { a: 0, b: 0, c: 1 };
    const next = apply(current, ["a", "c", "b"]);
    expect(publicOrder(next, ["a", "b", "c"])).toEqual(["a", "c", "b"]);
  });

  it("returns no changes when the order is unchanged", () => {
    const current = { a: 2, b: 5, c: 9 };
    expect(reorderedFaqSlots(["a", "b", "c"], new Map(Object.entries(current)))).toEqual([]);
  });
});
