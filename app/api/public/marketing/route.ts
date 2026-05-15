import { NextResponse } from "next/server";
import { bannerIsActivePublic, getSiteOwnerConfig } from "@/lib/site-owner-config";
import { effectiveGiftCardUrl, mergedDisplayLocations } from "@/lib/site-display-overrides";

export const runtime = "nodejs";

/** Public read-only marketing payload for banner bar + specials modal + testimonial videos. */
export async function GET() {
  try {
    const c = await getSiteOwnerConfig();
    const bannerActive = bannerIsActivePublic(c.banner);
    const displayLocations = mergedDisplayLocations(c.editableCopy);
    return NextResponse.json(
      {
        banner: {
          show: bannerActive && c.banner.showOnHomepage,
          html: c.banner.html,
          dismissKey: `${c.banner.html.length}_${c.banner.expiresAt ?? "x"}`,
        },
        specials: c.specials,
        testimonialVideos: c.testimonialVideos,
        doctorMedia: [...c.doctorMedia].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)),
        giftCardHref: effectiveGiftCardUrl(c.editableCopy),
        displayLocations,
        awardsStripHtml: c.editableCopy.awardsStripHtml,
        footerBlurbHtml: c.editableCopy.footerBlurbHtml,
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
