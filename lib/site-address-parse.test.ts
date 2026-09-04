import { describe, expect, it } from "vitest";
import { LOCATIONS } from "@/lib/constants";
import { mergedDisplayLocations } from "@/lib/site-display-overrides";

/**
 * The edited address line feeds both the visible street line and the
 * search-engine listing. Splitting it from the left once published
 * "Suite A" as the city, so these cases pin the parse down.
 */
function paris(line: string) {
  return mergedDisplayLocations(undefined, { footer_paris_address: line }).paris;
}

describe("address line parsing", () => {
  it("reads city/state/ZIP from the end, past a suite segment", () => {
    const p = paris("3305 NE Loop 286, Suite A, Paris, TX 75460");
    expect(p.addressLocality).toBe("Paris");
    expect(p.addressRegion).toBe("TX");
    expect(p.postalCode).toBe("75460");
  });

  it("handles an address with no suite segment", () => {
    const p = paris("207 Jefferson St. E, Sulphur Springs, TX 75482");
    expect(p.addressLocality).toBe("Sulphur Springs");
    expect(p.postalCode).toBe("75482");
  });

  it("keeps the visible street line exactly as typed", () => {
    const line = "3305 NE Loop 286, Suite A, Paris, TX 75460";
    const p = paris(line);
    expect(p.addressLines).toEqual([line]);
    // Rendered on the Paris location heading, the footer and the massage page.
    expect(p.streetAddress).toBe("3305 NE Loop 286");
  });

  it("leaves the constants alone when the line has no state or ZIP", () => {
    const p = paris("3305 NE Loop 286");
    expect(p.addressLocality).toBe(LOCATIONS.paris.addressLocality);
    expect(p.addressRegion).toBe(LOCATIONS.paris.addressRegion);
    expect(p.postalCode).toBe(LOCATIONS.paris.postalCode);
  });

  it("ignores a blank edit", () => {
    const p = paris("   ");
    expect(p.addressLines).toEqual(LOCATIONS.paris.addressLines);
    expect(p.addressLocality).toBe(LOCATIONS.paris.addressLocality);
  });
});
