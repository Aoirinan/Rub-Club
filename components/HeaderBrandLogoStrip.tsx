"use client";

import { usePathname } from "next/navigation";
import { BrandLogoStrip } from "@/components/BrandLogoStrip";
import { useHeaderCompact } from "@/components/SiteHeaderLogoRow";
import { brandVariantFromPathname } from "@/lib/brand-header-variant";
import type { HeaderBrandContent } from "@/lib/brand-logos";
import type { LocationInfo } from "@/lib/constants";

export function HeaderBrandLogoStrip({
  paris,
  sulphur,
  branding,
}: {
  paris: LocationInfo;
  sulphur: LocationInfo;
  branding?: HeaderBrandContent;
}) {
  const pathname = usePathname() ?? "/";
  const variant = brandVariantFromPathname(pathname);
  const compact = useHeaderCompact();

  return (
    <BrandLogoStrip
      variant={variant}
      paris={paris}
      sulphur={sulphur}
      branding={branding}
      compact={compact}
    />
  );
}
