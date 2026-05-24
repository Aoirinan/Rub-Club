/** Provider calendar color palette (admin-configurable per provider). */

export const PROVIDER_TEXT_COLOR_IDS = [
  "black",
  "blue",
  "green",
  "light_blue",
  "white",
] as const;

export const PROVIDER_BG_COLOR_IDS = [
  "bright_red",
  "light_purple",
  "turquoise",
  "light_gray",
  "royal_blue",
  "bright_yellow",
  "green",
  "orange",
] as const;

export type ProviderTextColorId = (typeof PROVIDER_TEXT_COLOR_IDS)[number];
export type ProviderBgColorId = (typeof PROVIDER_BG_COLOR_IDS)[number];

export const PROVIDER_TEXT_COLOR_OPTIONS: { id: ProviderTextColorId; label: string; hex: string }[] = [
  { id: "black", label: "Black", hex: "#0f172a" },
  { id: "blue", label: "Blue", hex: "#1d4ed8" },
  { id: "green", label: "Green", hex: "#15803d" },
  { id: "light_blue", label: "Light Blue", hex: "#38bdf8" },
  { id: "white", label: "White", hex: "#ffffff" },
];

export const PROVIDER_BG_COLOR_OPTIONS: { id: ProviderBgColorId; label: string; hex: string }[] = [
  { id: "bright_red", label: "Bright Red", hex: "#ef4444" },
  { id: "light_purple", label: "Light Purple", hex: "#c4b5fd" },
  { id: "turquoise", label: "Turquoise", hex: "#2dd4bf" },
  { id: "light_gray", label: "Light Gray", hex: "#d1d5db" },
  { id: "royal_blue", label: "Royal Blue", hex: "#2563eb" },
  { id: "bright_yellow", label: "Bright Yellow", hex: "#facc15" },
  { id: "green", label: "Green", hex: "#4ade80" },
  { id: "orange", label: "Orange", hex: "#fb923c" },
];

const TEXT_HEX = Object.fromEntries(
  PROVIDER_TEXT_COLOR_OPTIONS.map((o) => [o.id, o.hex]),
) as Record<ProviderTextColorId, string>;

const BG_HEX = Object.fromEntries(
  PROVIDER_BG_COLOR_OPTIONS.map((o) => [o.id, o.hex]),
) as Record<ProviderBgColorId, string>;

export function isProviderTextColorId(v: unknown): v is ProviderTextColorId {
  return typeof v === "string" && (PROVIDER_TEXT_COLOR_IDS as readonly string[]).includes(v);
}

export function isProviderBgColorId(v: unknown): v is ProviderBgColorId {
  return typeof v === "string" && (PROVIDER_BG_COLOR_IDS as readonly string[]).includes(v);
}

/** Default scheme by first name (seed until admin customizes). */
const DEFAULT_BY_FIRST_NAME: Record<
  string,
  { textColor: ProviderTextColorId; bgColor: ProviderBgColorId }
> = {
  channety: { textColor: "black", bgColor: "turquoise" },
  brandi: { textColor: "black", bgColor: "bright_red" },
  brandy: { textColor: "black", bgColor: "bright_red" },
  tara: { textColor: "black", bgColor: "light_purple" },
  kera: { textColor: "black", bgColor: "royal_blue" },
  sean: { textColor: "black", bgColor: "light_gray" },
  greg: { textColor: "black", bgColor: "green" },
};

export function defaultProviderColorsForName(displayName: string): {
  textColor: ProviderTextColorId;
  bgColor: ProviderBgColorId;
} {
  const first = displayName.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  return DEFAULT_BY_FIRST_NAME[first] ?? { textColor: "black", bgColor: "light_gray" };
}

export function resolveProviderColors(provider: {
  displayName: string;
  textColor?: ProviderTextColorId | null;
  bgColor?: ProviderBgColorId | null;
}): { textColor: ProviderTextColorId; bgColor: ProviderBgColorId; textHex: string; bgHex: string } {
  const fallback = defaultProviderColorsForName(provider.displayName);
  const textColor =
    provider.textColor && isProviderTextColorId(provider.textColor)
      ? provider.textColor
      : fallback.textColor;
  const bgColor =
    provider.bgColor && isProviderBgColorId(provider.bgColor) ? provider.bgColor : fallback.bgColor;
  return {
    textColor,
    bgColor,
    textHex: TEXT_HEX[textColor],
    bgHex: BG_HEX[bgColor],
  };
}

export type ProviderCalendarStyle = {
  textColor: ProviderTextColorId;
  bgColor: ProviderBgColorId;
  style: { backgroundColor: string; color: string };
};

export function providerCalendarStyle(provider: {
  id: string;
  displayName: string;
  textColor?: ProviderTextColorId | null;
  bgColor?: ProviderBgColorId | null;
}): ProviderCalendarStyle {
  const c = resolveProviderColors(provider);
  return {
    textColor: c.textColor,
    bgColor: c.bgColor,
    style: { backgroundColor: c.bgHex, color: c.textHex },
  };
}

export function buildProviderStylesMap(
  providers: Array<{
    id: string;
    displayName: string;
    textColor?: ProviderTextColorId | null;
    bgColor?: ProviderBgColorId | null;
  }>,
): Map<string, ProviderCalendarStyle> {
  const m = new Map<string, ProviderCalendarStyle>();
  for (const p of providers) {
    m.set(p.id, providerCalendarStyle(p));
  }
  return m;
}
