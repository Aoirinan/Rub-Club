import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { Open_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/JsonLd";
import { Analytics } from "@/components/Analytics";
import { DomainSpecialsPopup } from "@/components/DomainSpecialsPopup";
import { HomepageSalesBanner } from "@/components/HomepageSalesBanner";
import type { SalesBannerPayload } from "@/components/SalesBannerBar";
import { getSiteOrigin, isCanonicalHost, siteOgImage } from "@/lib/site-content";
import { getContentMany } from "@/lib/cms";
import { resolveSiteMeta, SITE_META_CMS_IDS } from "@/lib/site-meta-cms";
import { getJsonLdStrings } from "@/lib/structured-data-strings";
import { getDisplayChrome } from "@/lib/display-locations";
import { getUiText } from "@/lib/ui-text";
import { SiteChromeProvider } from "@/components/SiteChromeProvider";
import {
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/structured-data";
import { getSiteOwnerConfig, bannerIsActivePublic, bannerDismissKey } from "@/lib/site-owner-config";
import { mergeHeaderColors } from "@/lib/header-colors";
import {
  getLayoutCmsContent,
  headerBrandContentFromCms,
  parseHeaderShowTopPhoneBar,
} from "@/lib/cms-display";
import { effectiveGiftCardSticky } from "@/lib/site-display-overrides";
import { PublicBookingProvider } from "@/components/PublicBookingProvider";
import { ConditionalMarketingChrome } from "@/components/ConditionalMarketingChrome";
import {
  getPublicBookingConfig,
  isPublicBookingEnabled,
} from "@/lib/public-booking-settings";
import { parseCmsToggle } from "@/lib/sticky-call-bar";
import {
  DOMAIN_CTX_COOKIE,
  parseDomainContextValue,
} from "@/lib/domain-context";
import {
  BUSINESS_CTX_COOKIE,
  parseBusinessContextValue,
} from "@/lib/site-business-context";
import { getParisChiroOfficeHours, getParisOfficeHours, getSulphurOfficeHours } from "@/lib/office-hours";
import { getBrandThemeStyle } from "@/lib/brand-theme";

export const revalidate = 60;

const openSans = Open_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const origin = getSiteOrigin();

/**
 * Site-wide title/description/keywords are editable under Site settings →
 * "Search & social"; the lib/site-content.ts constants remain the defaults.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [site, headerList] = await Promise.all([
    getContentMany([...SITE_META_CMS_IDS]).then(resolveSiteMeta),
    headers(),
  ]);
  // Preview/deploy hosts must not be indexed while the canonical domain still
  // serves the old site; see isCanonicalHost().
  const indexable = isCanonicalHost(
    headerList.get("host") ?? headerList.get("x-forwarded-host"),
  );
  return {
    metadataBase: new URL(origin),
    title: { default: site.title, template: site.titleTemplate },
    description: site.description,
    applicationName: site.shortName,
    keywords: site.keywords,
    authors: [{ name: site.shortName }],
    creator: site.shortName,
    publisher: site.shortName,
    formatDetection: { telephone: true, email: true, address: true },
    openGraph: {
      type: "website",
      siteName: site.shortName,
      locale: "en_US",
      url: origin,
      title: site.title,
      description: site.description,
      images: [{ url: siteOgImage, width: 1200, height: 630, alt: site.shortName }],
    },
    twitter: {
      card: "summary_large_image",
      title: site.title,
      description: site.description,
      images: [siteOgImage],
    },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    category: "health",
  };
}

export const viewport: Viewport = {
  themeColor: "#d64535",
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let salesBanner: SalesBannerPayload | null = null;
  const cookieStore = await cookies();
  const initialDomainCtx = parseDomainContextValue(
    cookieStore.get(DOMAIN_CTX_COOKIE)?.value,
  );
  const initialBusinessContext = parseBusinessContextValue(
    cookieStore.get(BUSINESS_CTX_COOKIE)?.value,
  );

  const [
    cms,
    bookingConfig,
    parisChiroHours,
    parisMassageHours,
    sulphurHours,
    brandThemeStyle,
    displayChrome,
    uiText,
    jsonLdStrings,
  ] = await Promise.all([
    getLayoutCmsContent(),
    getPublicBookingConfig(),
    getParisChiroOfficeHours(),
    getParisOfficeHours(),
    getSulphurOfficeHours(),
    getBrandThemeStyle(),
    getDisplayChrome(),
    getUiText(),
    getJsonLdStrings(),
  ]);
  const onlineBookingEnabled = isPublicBookingEnabled(bookingConfig);
  // Offices with every override applied (CMS address/phone/name/fax → owner config → constants).
  const displayLocs = displayChrome.locations;
  let giftCardSticky = effectiveGiftCardSticky(undefined, cms);
  let footerBlurbHtml: string | null = null;
  let headerColors = mergeHeaderColors(undefined);
  try {
    const cfg = await getSiteOwnerConfig();
    headerColors = cfg.headerColors;
    giftCardSticky = effectiveGiftCardSticky(cfg.editableCopy, cms);
    const fb = cfg.editableCopy.footerBlurbHtml.trim();
    footerBlurbHtml = fb.length > 0 ? fb : null;
    if (bannerIsActivePublic(cfg.banner) && cfg.banner.showOnHomepage && cfg.banner.html.trim()) {
      salesBanner = {
        html: cfg.banner.html,
        dismissKey: bannerDismissKey(cfg.banner),
      };
    }
  } catch {
    salesBanner = null;
  }

  const schemaLocations = [displayLocs.paris, displayLocs.sulphur_springs];
  const showTopPhoneBar = parseHeaderShowTopPhoneBar(cms.header_show_top_phone_bar);
  const headerBranding = headerBrandContentFromCms(cms);
  const stickyCallBar = {
    paris: displayLocs.paris,
    sulphur: displayLocs.sulphur_springs,
    enabledParis: parseCmsToggle(cms.sticky_call_bar_paris),
    enabledSS: parseCmsToggle(cms.sticky_call_bar_ss),
    initialBusinessContext,
  };
  const accessibilityPanelEnabled = parseCmsToggle(cms.accessibility_panel_enabled);
  const footerLinks = {
    default: cms.footer_links_default,
    paris_chiro: cms.footer_links_paris,
    sulphur_springs: cms.footer_links_ss,
  };

  return (
    <html lang="en">
      <body
        className={`${openSans.variable} ${geistMono.variable} min-h-screen bg-[#f5f3ee] text-stone-900 antialiased`}
        style={brandThemeStyle}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-[#4a1515] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        >
          Skip to content
        </a>
        <JsonLd
          data={[
            organizationJsonLd(schemaLocations, jsonLdStrings),
            websiteJsonLd(jsonLdStrings),
          ]}
        />
        <SiteChromeProvider
          value={{ uiText, locations: displayLocs, bookUrl: displayChrome.bookUrl }}
        >
        <PublicBookingProvider enabled={onlineBookingEnabled}>
          <ConditionalMarketingChrome
            giftCardSticky={giftCardSticky}
            stickyCallBar={stickyCallBar}
            accessibilityPanelEnabled={accessibilityPanelEnabled}
            socialBarLabel={cms.social_bar_label}
            socialFacebookUrl={cms.social_facebook_url}
            socialInstagramUrl={cms.social_instagram_url}
            header={
              <>
                <SiteHeader
                  paris={displayLocs.paris}
                  sulphur={displayLocs.sulphur_springs}
                  giftCardHref={giftCardSticky.href}
                  showTopPhoneBar={showTopPhoneBar}
                  headerBranding={headerBranding}
                  headerColors={headerColors}
                  initialBusinessContext={initialBusinessContext}
                />
                {salesBanner ? <HomepageSalesBanner payload={salesBanner} /> : null}
              </>
            }
            footer={
              <>
                <SiteFooter
                  locations={schemaLocations}
                  giftCardHref={giftCardSticky.href}
                  footerBlurbHtml={footerBlurbHtml}
                  footerTagline={cms.footer_tagline}
                  footerCopyright={cms.footer_copyright}
                  footerLinks={footerLinks}
                  parisChiroHours={parisChiroHours}
                  parisMassageHours={parisMassageHours}
                  sulphurHours={sulphurHours}
                  initialDomainCtx={initialDomainCtx}
                  initialBusinessContext={initialBusinessContext}
                />
                <DomainSpecialsPopup />
              </>
            }
          >
            <main id="main" tabIndex={-1} className="outline-none">
              {children}
            </main>
          </ConditionalMarketingChrome>
        </PublicBookingProvider>
        </SiteChromeProvider>
        <Analytics />
      </body>
    </html>
  );
}
