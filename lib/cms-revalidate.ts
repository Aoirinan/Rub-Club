import { revalidatePath } from "next/cache";
import { CMS_REVALIDATE_DYNAMIC_PAGES, CMS_REVALIDATE_PATHS } from "@/lib/cms";

/**
 * Re-render the public pages after a `site_content` write.
 *
 * Callers still call `revalidateTag(SITE_CONTENT_TAG)` themselves first (every
 * site_content writer does, by rule). This refreshes the shared root layout —
 * header, footer, nav and office info appear on every page — plus each page
 * and dynamic route that reads site content. Today the root layout's
 * `cookies()` call already renders every page per request, so this is a
 * safety net for when a page becomes statically cached again.
 */
export function revalidateSiteContentPaths(): void {
  revalidatePath("/", "layout");
  for (const p of CMS_REVALIDATE_PATHS) revalidatePath(p);
  for (const p of CMS_REVALIDATE_DYNAMIC_PAGES) revalidatePath(p, "page");
}
