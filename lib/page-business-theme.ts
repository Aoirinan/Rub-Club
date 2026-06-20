import "server-only";
import { cookies } from "next/headers";
import type { BrandVariant } from "@/components/PageChrome";
import type { PracticeLocationId } from "@/lib/practice-pages-shared";
import { WELLNESS_CARE_PLANS_PATH } from "@/lib/constants";
import { SS_WELLNESS_PUBLIC_PATH } from "@/lib/ss-wellness-care-plans-content";
import type { BreadcrumbItem } from "@/lib/service-breadcrumbs";
import {
  BUSINESS_CTX_COOKIE,
  parseBusinessContextValue,
} from "@/lib/site-business-context";

export type PageBrand = {
  /** "paris" | "sulphur" — for PageHero / ScheduleCtaCard / ContactForm. */
  variant: BrandVariant;
  /** Practice theme id — feeds practiceThemeStyle() for the --pp-* vars. */
  loc: PracticeLocationId;
};

export function isSulphurSpringsBrand(brand: PageBrand): boolean {
  return brand.loc === "sulphur-springs";
}

/** Breadcrumbs for shared pages (patient forms, reviews, …) that keep site context. */
export function sharedPageBreadcrumbs(
  brand: PageBrand,
  current: BreadcrumbItem,
): readonly BreadcrumbItem[] {
  if (isSulphurSpringsBrand(brand)) {
    return [
      { name: "Home", url: "/" },
      { name: "Sulphur Springs", url: "/sulphur-springs" },
      current,
    ];
  }
  return [{ name: "Home", url: "/" }, current];
}

export function wellnessPlansPathForBrand(brand: PageBrand): string {
  return isSulphurSpringsBrand(brand) ? SS_WELLNESS_PUBLIC_PATH : WELLNESS_CARE_PLANS_PATH;
}

/**
 * Resolve the brand for a shared page (Locations, Patient Forms, Wellness
 * Plan, Massage Prices) from the visitor's business-context cookie. These
 * pages have a single URL but should keep the color of the site the visitor
 * came from — blue when arriving from Sulphur Springs, red otherwise.
 */
export async function getPageBrand(): Promise<PageBrand> {
  const ctx = parseBusinessContextValue(
    (await cookies()).get(BUSINESS_CTX_COOKIE)?.value,
  );
  if (ctx === "sulphur_springs") {
    return { variant: "sulphur", loc: "sulphur-springs" };
  }
  return { variant: "paris", loc: "paris-home" };
}
