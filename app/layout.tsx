import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/JsonLd";
import { Analytics } from "@/components/Analytics";
import { DomainSpecialsPopup } from "@/components/DomainSpecialsPopup";
import { HomepageSalesBanner } from "@/components/HomepageSalesBanner";
import type { SalesBannerPayload } from "@/components/SalesBannerBar";
import {
  getSiteOrigin,
  siteDescription,
  siteKeywords,
  siteOgImage,
  siteTitle,
  siteTitleTemplate,
  siteShortName,
} from "@/lib/site-content";
import {
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/structured-data";
import { getSiteOwnerConfig, bannerIsActivePublic } from "@/lib/site-owner-config";
import { getLayoutCmsContent, parseHeaderShowTopPhoneBar } from "@/lib/cms-display";
import {
  effectiveGiftCardSticky,
  mergedDisplayLocations,
} from "@/lib/site-display-overrides";
import { PublicBookingProvider } from "@/components/PublicBookingProvider";
import { ConditionalMarketingChrome } from "@/components/ConditionalMarketingChrome";
import {
  getPublicBookingConfig,
  isPublicBookingEnabled,
} from "@/lib/public-booking-settings";
import { getParisOfficeHours } from "@/lib/office-hours";

export const revalidate = 60;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const origin = getSiteOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: { default: siteTitle, template: siteTitleTemplate },
  description: siteDescription,
  applicationName: siteShortName,
  keywords: siteKeywords,
  authors: [{ name: siteShortName }],
  creator: siteShortName,
  publisher: siteShortName,
  formatDetection: { telephone: true, email: true, address: true },
  openGraph: {
    type: "website",
    siteName: siteShortName,
    locale: "en_US",
    url: origin,
    title: siteTitle,
    description: siteDescription,
    images: [{ url: siteOgImage, width: 1200, height: 630, alt: siteShortName }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [siteOgImage],
  },
  robots: { index: true, follow: true },
  category: "health",
};

export const viewport: Viewport = {
  themeColor: "#0f5f5c",
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let salesBanner: SalesBannerPayload | null = null;
  const [cms, bookingConfig, parisHours] = await Promise.all([
    getLayoutCmsContent(),
    getPublicBookingConfig(),
    getParisOfficeHours(),
  ]);
  const onlineBookingEnabled = isPublicBookingEnabled(bookingConfig);
  let displayLocs = mergedDisplayLocations(undefined, cms);
  let giftCardSticky = effectiveGiftCardSticky(undefined, cms);
  let footerBlurbHtml: string | null = null;
  try {
    const cfg = await getSiteOwnerConfig();
    displayLocs = mergedDisplayLocations(cfg.editableCopy, cms);
    giftCardSticky = effectiveGiftCardSticky(cfg.editableCopy, cms);
    const fb = cfg.editableCopy.footerBlurbHtml.trim();
    footerBlurbHtml = fb.length > 0 ? fb : null;
    if (bannerIsActivePublic(cfg.banner) && cfg.banner.showOnHomepage && cfg.banner.html.trim()) {
      salesBanner = {
        html: cfg.banner.html,
        dismissKey: `${cfg.banner.html.length}_${cfg.banner.expiresAt ?? "x"}`,
      };
    }
  } catch {
    salesBanner = null;
  }

  const schemaLocations = [displayLocs.paris, displayLocs.sulphur_springs];
  const showTopPhoneBar = parseHeaderShowTopPhoneBar(cms.header_show_top_phone_bar);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#f4f2ea] text-stone-900 antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-[#173f3b] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        >
          Skip to content
        </a>
        <JsonLd data={[organizationJsonLd(schemaLocations), websiteJsonLd()]} />
        <PublicBookingProvider enabled={onlineBookingEnabled}>
          <ConditionalMarketingChrome
            giftCardSticky={giftCardSticky}
            header={
              <>
                <SiteHeader
                  paris={displayLocs.paris}
                  sulphur={displayLocs.sulphur_springs}
                  giftCardHref={giftCardSticky.href}
                  showTopPhoneBar={showTopPhoneBar}
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
                  parisHours={parisHours}
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
        <Analytics />
      </body>
    </html>
  );
}
