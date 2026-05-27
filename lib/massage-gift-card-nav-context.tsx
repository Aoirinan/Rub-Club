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

/** Layout-sized growth (~50%) so flex reflows — gold in-bar, no transform overlap. */
export const GIFT_CARD_DESKTOP_EXPANDED =
  "bg-[#f2d25d] px-7 py-2 text-sm text-[#0c2d3a] shadow-sm hover:bg-[#e6c13d] xl:px-9 xl:text-base";

export const GIFT_CARD_MOBILE_EXPANDED =
  "!border-[#f2d25d] !bg-[#f2d25d] !px-6 !py-4 !text-base !text-[#173f3b] shadow-sm";
