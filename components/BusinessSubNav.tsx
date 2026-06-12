"use client";

import type { ReactNode } from "react";
import type { NavItem } from "@/components/DesktopNav";
import { DesktopNav } from "@/components/DesktopNav";

/** Dropdown navigation bar; pass `centerSlot` for the Backpro centered-logo layout. */
export function BusinessSubNav({
  items,
  showBookCta = false,
  centerSlot,
}: {
  items: readonly NavItem[];
  showBookCta?: boolean;
  centerSlot?: ReactNode;
}) {
  if (items.length === 0) return null;
  return <DesktopNav items={items} showBookCta={showBookCta} centerSlot={centerSlot} />;
}
