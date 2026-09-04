import { describe, expect, it } from "vitest";
import {
  buildPageMetadata,
  descriptionFromBlocks,
  stripTrailingBrand,
  titleAlreadyBranded,
} from "@/lib/page-metadata";

describe("stripTrailingBrand", () => {
  it("removes a trailing brand from an imported title", () => {
    expect(
      stripTrailingBrand("Chiropractor in Paris | Swedish Massage in Paris | Chiropractic Associates"),
    ).toBe("Chiropractor in Paris | Swedish Massage in Paris");
    expect(stripTrailingBrand("Deep Tissue Massage | The Rub Club")).toBe("Deep Tissue Massage");
    expect(stripTrailingBrand("Massage Prices — The Rub Club")).toBe("Massage Prices");
  });

  it("leaves a title that is only the brand", () => {
    expect(stripTrailingBrand("Chiropractic Associates")).toBe("Chiropractic Associates");
  });

  it("leaves an unbranded title alone", () => {
    expect(stripTrailingBrand("Acupuncture")).toBe("Acupuncture");
  });
});

describe("buildPageMetadata", () => {
  it("does not let the title template repeat a brand the title already has", () => {
    const meta = buildPageMetadata({
      title: "Contact — Chiropractic Associates, Paris, TX",
      description: "d",
      path: "/contact",
    });
    expect(meta.title).toEqual({ absolute: "Contact — Chiropractic Associates, Paris, TX" });
  });

  it("lets the template add the brand when the title has none", () => {
    const meta = buildPageMetadata({ title: "About Us", description: "d", path: "/about" });
    expect(meta.title).toBe("About Us");
    expect(titleAlreadyBranded("About Us")).toBe(false);
  });

  it("points a duplicate page at the canonical one", () => {
    const meta = buildPageMetadata({
      title: "Swedish Massage",
      description: "d",
      path: "/services/chiropractic/swedish-massage",
      canonical: "/services/massage/swedish-massage",
    });
    expect(meta.alternates?.canonical).toBe("/services/massage/swedish-massage");
  });

  it("keeps a page out of search when asked", () => {
    const meta = buildPageMetadata({
      title: "Online Patient Forms",
      description: "d",
      path: "/online-forms",
      noindex: true,
    });
    expect(meta.robots).toEqual({ index: false, follow: true });
  });
});

describe("descriptionFromBlocks", () => {
  it("uses the first real paragraph", () => {
    expect(
      descriptionFromBlocks([
        { tag: "h1", text: "Heading" },
        { tag: "p", text: "Too short." },
        { tag: "p", text: "A full sentence about the treatment that runs past the length cutoff." },
      ]),
    ).toBe("A full sentence about the treatment that runs past the length cutoff.");
  });

  it("trims at a word boundary", () => {
    const long = `${"word ".repeat(60)}end`;
    const out = descriptionFromBlocks([{ tag: "p", text: long }]);
    expect(out.length).toBeLessThanOrEqual(156);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toContain("  ");
  });

  it("returns an empty string when there is no usable paragraph", () => {
    expect(descriptionFromBlocks([{ tag: "h2", text: "Only a heading" }])).toBe("");
  });
});
