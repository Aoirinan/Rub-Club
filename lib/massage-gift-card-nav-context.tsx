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

/** Floated above the nav bar — no overlap with FAQ / Patient forms. */
export const GIFT_CARD_DESKTOP_EXPANDED =
  "absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#f2d25d] px-5 py-2.5 text-sm font-black text-[#173f3b] shadow-lg ring-2 ring-white/60 transition-[transform,opacity,box-shadow] duration-300 ease-out hover:bg-[#e6c13d] motion-reduce:transition-none";

/** In-drawer: gold + one step larger text, no scale (avoids overlapping menu items). */
export const GIFT_CARD_MOBILE_EXPANDED =
  "!border-[#f2d25d] !bg-[#f2d25d] !px-5 !py-3.5 !text-base !text-[#173f3b] shadow-md transition-all duration-300 ease-out motion-reduce:transition-none";
