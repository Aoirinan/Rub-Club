"use client";

import { usePathname } from "next/navigation";
import { BrandLogoStrip } from "@/components/BrandLogoStrip";
import { brandVariantFromPathname } from "@/lib/brand-header-variant";
import type { LocationInfo } from "@/lib/constants";

export function HeaderBrandLogoStrip({
  paris,
  sulphur,
}: {
  paris: LocationInfo;
  sulphur: LocationInfo;
}) {
  const pathname = usePathname() ?? "/";
  const variant = brandVariantFromPathname(pathname);
  return <BrandLogoStrip variant={variant} paris={paris} sulphur={sulphur} />;
}
