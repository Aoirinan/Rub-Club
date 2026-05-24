"use client";

import { usePathname } from "next/navigation";
import { SalesBannerBar, type SalesBannerPayload } from "@/components/SalesBannerBar";

/** Renders the owner sales banner only on the homepage (honors showOnHomepage). */
export function HomepageSalesBanner({ payload }: { payload: SalesBannerPayload }) {
  const pathname = usePathname() ?? "";
  if (pathname !== "/") return null;
  return <SalesBannerBar payload={payload} />;
}
