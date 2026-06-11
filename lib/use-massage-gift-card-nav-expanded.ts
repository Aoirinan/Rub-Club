"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TOP_THRESHOLD_PX = 8;

function readScrollY(): number {
  if (typeof window === "undefined") return 0;
  return Math.max(
    window.scrollY,
    document.documentElement.scrollTop,
    document.body.scrollTop,
  );
}

/** True on any page once it is scrolled away from the top. */
export function useMassageGiftCardNavExpanded(): boolean {
  const pathname = usePathname() ?? "";
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const update = () => {
      setExpanded(readScrollY() > TOP_THRESHOLD_PX);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    document.addEventListener("scroll", update, { passive: true, capture: true });
    return () => {
      window.removeEventListener("scroll", update);
      document.removeEventListener("scroll", update, { capture: true });
    };
  }, [pathname]);

  return expanded;
}
