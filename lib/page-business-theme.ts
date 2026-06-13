import "server-only";
import { cookies } from "next/headers";
import type { BrandVariant } from "@/components/PageChrome";
import type { PracticeLocationId } from "@/lib/practice-pages-shared";
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
