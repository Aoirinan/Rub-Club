"use client";

import type { NavItem } from "@/components/DesktopNav";
import { DesktopNav } from "@/components/DesktopNav";

/** Blue dropdown navigation bar for a scoped business site. */
export function BusinessSubNav({
  items,
  showBookCta = false,
}: {
  items: readonly NavItem[];
  showBookCta?: boolean;
}) {
  if (items.length === 0) return null;
  return <DesktopNav items={items} showBookCta={showBookCta} />;
}
