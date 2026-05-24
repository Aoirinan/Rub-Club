import { describe, expect, it } from "vitest";
import { defaultProviderColorsForName, resolveProviderColors } from "./provider-colors";

describe("provider-colors", () => {
  it("seeds Brandi with bright red background", () => {
    const c = defaultProviderColorsForName("Brandi Collins");
    expect(c.bgColor).toBe("bright_red");
    expect(c.textColor).toBe("black");
  });

  it("uses stored colors when set", () => {
    const c = resolveProviderColors({
      displayName: "Brandi",
      textColor: "white",
      bgColor: "royal_blue",
    });
    expect(c.textColor).toBe("white");
    expect(c.bgColor).toBe("royal_blue");
  });
});
