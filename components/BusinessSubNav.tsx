"use client";

import type { ReactNode } from "react";
import type { NavItem } from "@/components/DesktopNav";
import { DesktopNav } from "@/components/DesktopNav";
import type { SiteBusinessContext } from "@/lib/site-business-context";

/** Dropdown navigation bar; pass `centerSlot` for the Backpro centered-logo layout. */
export function BusinessSubNav({
  items,
  showBookCta = false,
  centerSlot,
  businessContext = "default",
}: {
  items: readonly NavItem[];
  showBookCta?: boolean;
  centerSlot?: ReactNode;
  businessContext?: SiteBusinessContext;
}) {
  if (items.length === 0) return null;
  return (
    <DesktopNav
      items={items}
      showBookCta={showBookCta}
      centerSlot={centerSlot}
      businessContext={businessContext}
    />
  );
}
