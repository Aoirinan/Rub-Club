"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const MASSAGE_PATH_PREFIX = "/services/massage";
const TOP_THRESHOLD_PX = 8;

/** True on /services/massage when the page is scrolled away from the top. */
export function useMassageGiftCardNavExpanded(): boolean {
  const pathname = usePathname() ?? "";
  const onMassagePage = pathname.startsWith(MASSAGE_PATH_PREFIX);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!onMassagePage) {
      setExpanded(false);
      return;
    }

    const update = () => {
      setExpanded(window.scrollY > TOP_THRESHOLD_PX);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [onMassagePage]);

  return onMassagePage && expanded;
}

export const GIFT_CARD_NAV_EXPAND_CLASSES =
  "relative z-10 origin-center scale-150 transition-transform duration-300 ease-out motion-reduce:scale-100";
