"use client";

import { usePathname } from "next/navigation";
import { BrandLogoStrip } from "@/components/BrandLogoStrip";
import { brandVariantFromPathname } from "@/lib/brand-header-variant";
import type { LocationInfo } from "@/lib/constants";
import type { HeaderBrandingHeights } from "@/lib/header-branding-cms";

export function HeaderBrandLogoStrip({
  paris,
  sulphur,
  headerHeights,
}: {
  paris: LocationInfo;
  sulphur: LocationInfo;
  headerHeights?: HeaderBrandingHeights;
}) {
  const pathname = usePathname() ?? "/";
  const variant = brandVariantFromPathname(pathname);
  return (
    <BrandLogoStrip
      variant={variant}
      paris={paris}
      sulphur={sulphur}
      headerHeights={headerHeights}
    />
  );
}
