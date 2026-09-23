import { describe, expect, it } from "vitest";
import {
  buildPageMetadata,
  CANONICAL_OVERRIDES,
  canonicalPathFor,
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
    expect(meta.openGraph?.url).toBe("/services/massage/swedish-massage");
  });

  it("uses the page's own path as canonical and og:url by default", () => {
    const meta = buildPageMetadata({ title: "About Us", description: "d", path: "/about" });
    expect(meta.alternates?.canonical).toBe("/about");
    expect(meta.openGraph?.url).toBe("/about");
  });

  it("points a known imported copy at the newer page without being told", () => {
    const meta = buildPageMetadata({
      title: "Stretch & Flex Rehab",
      description: "d",
      path: "/services/chiropractic/stretch---flex-rehab",
    });
    expect(meta.alternates?.canonical).toBe("/services/chiropractic/stretch-and-flex-rehab");
    expect(meta.openGraph?.url).toBe("/services/chiropractic/stretch-and-flex-rehab");
  });

  it("lets an explicit canonical win over the override table", () => {
    const meta = buildPageMetadata({
      title: "Massage Prices",
      description: "d",
      path: "/services/massage/massage-prices",
      canonical: "/services/massage",
    });
    expect(meta.alternates?.canonical).toBe("/services/massage");
    expect(meta.openGraph?.url).toBe("/services/massage");
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

describe("canonicalPathFor", () => {
  it("maps the imported duplicates the sitemap must leave out", () => {
    const duplicates = [
      ...["swedish", "thai", "hot-stone", "deep-tissue", "prenatal", "sports"].map(
        (m) => `/services/chiropractic/${m}-massage`,
      ),
      "/services/massage/massage-prices",
      "/services/massage/chiropractic-care",
      "/services/chiropractic/stretch---flex-rehab",
      "/services/chiropractic/electrical-muscle-stimulation",
      "/services/chiropractic/ice-pack-cryotherapy",
    ];
    for (const path of duplicates) expect(canonicalPathFor(path)).not.toBe(path);
    expect(Object.keys(CANONICAL_OVERRIDES).sort()).toEqual([...duplicates].sort());
  });

  it("never points a duplicate at another duplicate", () => {
    for (const target of Object.values(CANONICAL_OVERRIDES)) {
      expect(canonicalPathFor(target)).toBe(target);
    }
  });

  it("leaves every other page as its own canonical", () => {
    expect(canonicalPathFor("/services/massage/swedish-massage")).toBe(
      "/services/massage/swedish-massage",
    );
    expect(canonicalPathFor("/sulphur-springs/electrical-muscle-stimulation")).toBe(
      "/sulphur-springs/electrical-muscle-stimulation",
    );
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
