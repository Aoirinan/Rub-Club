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

/** Gold highlight + scale — transform only so Book Now and nav bar height stay unchanged. */
export const GIFT_CARD_DESKTOP_EXPANDED =
  "relative z-20 origin-center scale-150 rounded bg-[#f2d25d] !text-[#173f3b] shadow-md ring-2 ring-white/50 transition-[transform,background-color,color,box-shadow] duration-300 ease-out hover:!bg-[#e6c13d] motion-reduce:scale-100";

export const GIFT_CARD_MOBILE_EXPANDED =
  "relative z-20 origin-center scale-150 !border-[#f2d25d] !bg-[#f2d25d] !text-[#173f3b] shadow-md transition-[transform,background-color,color] duration-300 ease-out motion-reduce:scale-100";
