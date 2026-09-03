"use client";

import { createContext, useContext, type ReactNode } from "react";
import { NAV_TEXT_DEFAULTS, type NavText } from "@/lib/nav-cms";
import { UI_TEXT_DEFAULTS } from "@/lib/ui-text-cms";

/**
 * Editable header/footer chrome strings for client components. Provided by
 * SiteHeaderClient (server-resolved values); the defaults below keep every
 * label identical when a consumer renders outside the provider.
 */
export type NavChrome = {
  nav: NavText;
  /** Shared site-text labels the header and footer use. */
  bookNow: string;
  getDirections: string;
  faxLabel: string;
};

export const DEFAULT_NAV_CHROME: NavChrome = {
  nav: { ...NAV_TEXT_DEFAULTS },
  bookNow: UI_TEXT_DEFAULTS.ui_book_now,
  getDirections: UI_TEXT_DEFAULTS.ui_get_directions,
  faxLabel: UI_TEXT_DEFAULTS.ui_fax_label,
};

const NavChromeContext = createContext<NavChrome>(DEFAULT_NAV_CHROME);

export function NavChromeProvider({
  value,
  children,
}: {
  value: NavChrome;
  children: ReactNode;
}) {
  return <NavChromeContext.Provider value={value}>{children}</NavChromeContext.Provider>;
}

export function useNavChrome(): NavChrome {
  return useContext(NavChromeContext);
}
