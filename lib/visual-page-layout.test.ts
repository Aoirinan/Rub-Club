import { describe, expect, it } from "vitest";
import { normalizeVisualPageLayout, newLayerId } from "@/lib/visual-page-layout";
import { buildDefaultVisualLayoutForScope, blockOrderFromVisual } from "@/lib/visual-page-migrations";

describe("visual-page-layout", () => {
  it("normalizes layer boxes", () => {
    const layout = normalizeVisualPageLayout({
      version: 1,
      frameHeight: 400,
      layers: [
        {
          id: "a",
          type: "text",
          box: { x: -5, y: 0, w: 200, h: 2 },
          zIndex: 0,
          content: "hi",
        },
      ],
    });
    expect(layout.layers[0]!.box.x).toBeGreaterThanOrEqual(0);
    expect(layout.layers[0]!.box.w).toBeLessThanOrEqual(98);
  });

  it("builds massage default with blocks", () => {
    const layout = buildDefaultVisualLayoutForScope("massage");
    expect(layout.layers.length).toBeGreaterThan(3);
    const order = blockOrderFromVisual(layout, "massage");
    expect(order).toContain("intro");
  });

  it("generates unique layer ids", () => {
    expect(newLayerId()).not.toBe(newLayerId());
  });
});
