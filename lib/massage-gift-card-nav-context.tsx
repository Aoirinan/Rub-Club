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

/** Desktop blue nav — ~50% larger + gold highlight when expanded on massage page. */
export const GIFT_CARD_DESKTOP_EXPANDED =
  "relative z-20 rounded bg-[#f2d25d] !px-6 !py-3 !text-sm !font-black !text-[#173f3b] shadow-md ring-2 ring-white/50 transition-all duration-300 ease-out xl:!px-8 xl:!text-base motion-reduce:transition-none";

/** Mobile drawer gift card link — same treatment. */
export const GIFT_CARD_MOBILE_EXPANDED =
  "relative z-20 !border-[#f2d25d] !bg-[#f2d25d] !px-6 !py-4 !text-base !text-[#173f3b] shadow-md ring-2 ring-[#0f5f5c]/20 transition-all duration-300 ease-out motion-reduce:transition-none";
