"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useMassageGiftCardNavExpanded } from "@/lib/use-massage-gift-card-nav-expanded";

const MassageGiftCardNavContext = createContext(false);

export function MassageGiftCardNavProvider({ children }: { children: ReactNode }) {
  const expanded = useMassageGiftCardNavExpanded();
  return (
    <MassageGiftCardNavContext.Provider value={expanded}>
      {children}
    </MassageGiftCardNavContext.Provider>
  );
}

export function useMassageGiftCardNavExpandedContext(): boolean {
  return useContext(MassageGiftCardNavContext);
}

/** In-bar gold pill — same height as Book Now, no float or scale. */
export const GIFT_CARD_DESKTOP_EXPANDED =
  "bg-[#f2d25d] text-[#0c2d3a] shadow-sm hover:bg-[#e6c13d]";

export const GIFT_CARD_MOBILE_EXPANDED =
  "!border-[#f2d25d] !bg-[#f2d25d] !text-[#173f3b] shadow-sm";
