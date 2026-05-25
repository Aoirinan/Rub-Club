"use client";

import { usePathname } from "next/navigation";
import { BrandLogoStrip } from "@/components/BrandLogoStrip";
import { brandVariantFromPathname } from "@/lib/brand-header-variant";
import type { LocationInfo } from "@/lib/constants";
import type { HeaderBrandingLayout } from "@/lib/header-branding-cms";

export function HeaderBrandLogoStrip({
  paris,
  sulphur,
  headerLayout,
}: {
  paris: LocationInfo;
  sulphur: LocationInfo;
  headerLayout?: HeaderBrandingLayout;
}) {
  const pathname = usePathname() ?? "/";
  const variant = brandVariantFromPathname(pathname);
  return (
    <BrandLogoStrip
      variant={variant}
      paris={paris}
      sulphur={sulphur}
      headerLayout={headerLayout}
    />
  );
}
