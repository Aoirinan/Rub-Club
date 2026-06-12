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
  showContact = true,
}: {
  paris: LocationInfo;
  sulphur: LocationInfo;
  branding?: HeaderBrandContent;
  /** Hide the phone + label rows (logo-only, e.g. centered inside the nav bar). */
  showContact?: boolean;
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
      showContact={showContact}
    />
  );
}
