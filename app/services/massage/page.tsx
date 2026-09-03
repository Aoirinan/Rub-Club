import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { JsonLd } from "@/components/JsonLd";
import { getContentMany } from "@/lib/cms";
import { getMassageTeamForMarketing } from "@/lib/massage-team";
import { serviceBreadcrumbs } from "@/lib/service-breadcrumbs";
import {
  getPublicBookingConfig,
  isPublicBookingEnabled,
  scheduleMetaPhrase,
} from "@/lib/public-booking-settings";
import { massageJsonLd, serviceJsonLd } from "@/lib/structured-data";
import { siteUrl } from "@/lib/site-content";
import { pageKeywords } from "@/lib/seo-keywords";
import { getDisplayLocations, getScopeVisualLayout } from "@/lib/cms-display";
import { getPageBlockOrder } from "@/lib/page-layout-db";
import { ServicePageVisualSection } from "@/components/ServicePageVisualSection";
import { MassageReviews } from "@/components/marketing/MassageReviews";
import { getMassageReviews } from "@/lib/massage-reviews";
import { getSitePhotos } from "@/lib/site-photos-server";
import { getPageMeta } from "@/lib/page-meta";
import { getUiText } from "@/lib/ui-text";
import {
  MASSAGE_META_SCHEDULE_TOKEN,
  MASSAGE_PAGE_TEXT_IDS,
  MASSAGE_SERVICE_PAGES_IDS,
  resolveMassagePageText,
} from "@/lib/massage-page-cms";
import { MassagePageBlock } from "./MassagePageBlocks";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [booking, meta, text] = await Promise.all([
    getPublicBookingConfig(),
    getPageMeta("massage", { title: "", description: "" }),
    getContentMany(["massage_page_og_description"]),
  ]);
  const phrase = scheduleMetaPhrase(isPublicBookingEnabled(booking));
  const t = resolveMassagePageText(text);
  return buildPageMetadata({
    title: meta.title,
    description: meta.description.replace(MASSAGE_META_SCHEDULE_TOKEN, phrase.toLowerCase()),
    path: "/services/massage",
    keywords: pageKeywords(["Paris TX massage", "The Rub Club"]),
    ogDescription: t.massage_page_og_description,
  });
}

export default async function MassageServicePage() {
  const c = await getContentMany([
    "massage_hero_heading",
    "massage_hero_subheading",
    "massage_intro_body",
    ...MASSAGE_PAGE_TEXT_IDS,
    ...MASSAGE_SERVICE_PAGES_IDS,
  ]);
  const [massageTeam, blockOrder, visual, displayLocs, photos, massageReviews, ui] =
    await Promise.all([
      getMassageTeamForMarketing(),
      getPageBlockOrder("massage"),
      getScopeVisualLayout("massage"),
      getDisplayLocations(),
      getSitePhotos(),
      getMassageReviews(),
      getUiText(),
    ]);
  const paris = displayLocs.paris;
  const text = resolveMassagePageText(c);
  const introParagraphs = (c.massage_intro_body ?? "").split(/\n\n+/).filter(Boolean);
  const blockData = { introParagraphs, massageTeam, paris, photos, cms: c, text, ui };
  const cmsMap = c as Record<string, string>;

  return (
    <>
      <JsonLd
        data={[
          massageJsonLd(paris),
          serviceJsonLd({
            name: "Massage Therapy",
            description:
              "Deep tissue, prenatal, sports, lymphatic, and trigger-point massage at The Rub Club in Paris, TX.",
            url: siteUrl("/services/massage"),
            serviceType: "Massage Therapy",
            location: paris,
          }),
        ]}
      />
      <Breadcrumbs
        items={serviceBreadcrumbs({ name: text.massage_subpage_breadcrumb, url: "/services/massage" })}
      />
      <PageHero
        eyebrow={text.massage_page_eyebrow}
        title={c.massage_hero_heading}
        lede={c.massage_hero_subheading}
      />
      {visual ? (
        <ServicePageVisualSection
          pageId="massage"
          visual={visual}
          cms={cmsMap}
          renderBlock={(id) => <MassagePageBlock id={id} data={blockData} />}
        />
      ) : (
        <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16">
          {blockOrder.map((id) => (
            <MassagePageBlock key={id} id={id} data={blockData} />
          ))}
        </div>
      )}
      {/* CURSOR_PROMPT §6b: massage reviews with 5-star display. */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <MassageReviews reviews={massageReviews} />
      </div>
    </>
  );
}
