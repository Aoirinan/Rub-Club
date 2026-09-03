"use client";

import { createContext, useContext, type ReactNode } from "react";
import { LOCATIONS, type LocationId, type LocationInfo } from "@/lib/constants";
import { UI_TEXT_DEFAULTS, type UiText } from "@/lib/ui-text-cms";

/**
 * Per-request site chrome shared with client components: editable button
 * labels, the CMS-resolved office details (name, address, phones, fax), and
 * the optional "Book Now" link. Filled once in app/layout.tsx.
 */
export type SiteChrome = {
  uiText: UiText;
  locations: Record<LocationId, LocationInfo>;
  /** When set, Book Now buttons link here instead of opening the call popup. */
  bookUrl: string | null;
};

const DEFAULT_CHROME: SiteChrome = {
  uiText: { ...UI_TEXT_DEFAULTS },
  locations: LOCATIONS,
  bookUrl: null,
};

const SiteChromeContext = createContext<SiteChrome>(DEFAULT_CHROME);

export function SiteChromeProvider({
  value,
  children,
}: {
  value: SiteChrome;
  children: ReactNode;
}) {
  return <SiteChromeContext.Provider value={value}>{children}</SiteChromeContext.Provider>;
}

export function useSiteChrome(): SiteChrome {
  return useContext(SiteChromeContext);
}

export function useUiText(): UiText {
  return useContext(SiteChromeContext).uiText;
}
