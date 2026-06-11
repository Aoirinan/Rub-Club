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
import { MassagePageBlock } from "./MassagePageBlocks";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const booking = await getPublicBookingConfig();
  const phrase = scheduleMetaPhrase(isPublicBookingEnabled(booking));
  return buildPageMetadata({
    title: "Massage Therapy in Paris, TX — The Rub Club",
    description: `Licensed massage therapists offering deep tissue, prenatal, sports, and trigger-point therapy in Paris, TX. Same-week openings; call 903-739-9959 or ${phrase.toLowerCase()}.`,
    path: "/services/massage",
    keywords: pageKeywords(["Paris TX massage", "The Rub Club"]),
    ogDescription:
      "Deep tissue, prenatal, sports, and trigger-point massage at The Rub Club in Paris, TX.",
  });
}

export default async function MassageServicePage() {
  const c = await getContentMany([
    "massage_hero_heading",
    "massage_hero_subheading",
    "massage_intro_body",
    "massage_services_list",
    "massage_cta_heading",
  ]);
  const [massageTeam, blockOrder, visual, displayLocs] = await Promise.all([
    getMassageTeamForMarketing(),
    getPageBlockOrder("massage"),
    getScopeVisualLayout("massage"),
    getDisplayLocations(),
  ]);
  const paris = displayLocs.paris;
  const introParagraphs = (c.massage_intro_body ?? "").split(/\n\n+/).filter(Boolean);
  const serviceLines = (c.massage_services_list ?? "").split(/\n\n+/).filter(Boolean);
  const blockData = { introParagraphs, serviceLines, massageTeam, paris };
  const cmsMap = c as Record<string, string>;

  return (
    <>
      <JsonLd
        data={[
          massageJsonLd(),
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
      <Breadcrumbs items={serviceBreadcrumbs({ name: "Massage", url: "/services/massage" })} />
      <PageHero
        eyebrow="The Rub Club · Paris, TX"
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
    </>
  );
}
