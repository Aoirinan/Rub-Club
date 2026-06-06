"use client";

import Link from "next/link";
import {
  GIFT_CARD_ORDER_URL,
  LOCATION_LIST,
  WELLNESS_CARE_PLANS_PATH,
  telHref,
  type LocationInfo,
} from "@/lib/constants";
import type { DomainContextValue } from "@/lib/domain-context";
import type { OfficeHoursRow } from "@/lib/office-hours";
import {
  PRIVACY_PRACTICES_PATH,
  TERMS_PATH,
  WEBSITE_PRIVACY_PATH,
} from "@/lib/legal";
import { siteShortName } from "@/lib/site-content";
import { FooterHoursPanel } from "@/components/FooterHoursPanel";
import { useSiteBusinessContext } from "@/lib/use-site-business-context";
import type { SiteBusinessContext } from "@/lib/site-business-context";

const PARIS_CHIRO_TAGLINE =
  "Chiropractic Associates in Paris, TX — family-owned care since 1998.";
const SS_TAGLINE =
  "Chiropractic Associates of Sulphur Springs — your spine health specialists in Northeast Texas.";

export function SiteFooterClient({
  locations = LOCATION_LIST,
  giftCardHref = GIFT_CARD_ORDER_URL,
  footerBlurbHtml,
  footerTagline,
  footerCopyright,
  parisHours,
  sulphurHours,
  initialDomainCtx,
  initialBusinessContext = "default",
}: {
  locations?: readonly LocationInfo[];
  giftCardHref?: string;
  footerBlurbHtml?: string | null;
  footerTagline?: string | null;
  footerCopyright?: string | null;
  parisHours: readonly OfficeHoursRow[];
  sulphurHours: readonly OfficeHoursRow[];
  initialDomainCtx: DomainContextValue;
  initialBusinessContext?: SiteBusinessContext;
}) {
  const businessContext = useSiteBusinessContext(initialBusinessContext);
  const isParisChiro = businessContext === "paris_chiro";
  const isSulphur = businessContext === "sulphur_springs";
  const isBusinessScoped = isParisChiro || isSulphur;

  const filteredLocations = isParisChiro
    ? locations.filter((l) => l.id === "paris")
    : isSulphur
      ? locations.filter((l) => l.id === "sulphur_springs")
      : locations;

  const label = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
  const year = new Date().getFullYear();
  const defaultTagline = isParisChiro
    ? PARIS_CHIRO_TAGLINE
    : isSulphur
      ? SS_TAGLINE
      : "Family-owned wellness in Northeast Texas. Two practices, one address in Paris — plus chiropractic care in Sulphur Springs.";
  const tagline = footerTagline?.trim() || defaultTagline;
  const copyrightLine =
    footerCopyright?.trim() || `© ${year} ${siteShortName}. All rights reserved.`;

  return (
    <footer className="mt-12 border-t-4 border-[#0f5f5c] bg-[#23312e] text-white/85">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-base font-black tracking-tight text-white">{siteShortName}</p>
          {footerBlurbHtml?.trim() && !isBusinessScoped ? (
            <div
              className="prose prose-invert prose-sm mt-2 max-w-none text-white/80 prose-a:text-[#f2d25d] prose-a:font-bold prose-p:my-1"
              dangerouslySetInnerHTML={{ __html: footerBlurbHtml }}
            />
          ) : (
            <p className="mt-2 text-sm text-white/70">{tagline}</p>
          )}
          {isBusinessScoped ? (
            <Link
              href="/"
              className="mt-3 inline-block text-xs font-bold uppercase tracking-wide text-[#f2d25d] hover:underline"
            >
              All practices →
            </Link>
          ) : null}
        </div>
        <div className="space-y-4 text-sm">
          {filteredLocations.map((loc) => (
            <div key={loc.id}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2d25d]">
                {loc.shortName}
              </p>
              <p className="mt-1 text-white">{loc.streetAddress}</p>
              <p className="text-white/70">
                {loc.addressLocality}, {loc.addressRegion} {loc.postalCode}
              </p>
              <a
                className="mt-1 inline-block font-bold text-[#f2d25d] hover:underline"
                href={telHref(loc.phonePrimary)}
              >
                {loc.phonePrimary}
              </a>
              {loc.phoneSecondary && !isBusinessScoped ? (
                <p className="text-xs text-white/60">
                  Massage desk:{" "}
                  <a
                    className="font-bold text-[#f2d25d] hover:underline"
                    href={telHref(loc.phoneSecondary)}
                  >
                    {loc.phoneSecondary}
                  </a>
                </p>
              ) : null}
            </div>
          ))}
        </div>
        <nav aria-label="Footer quick links" className="text-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2d25d]">Explore</p>
          <ul className="mt-3 space-y-1.5">
            {isParisChiro ? (
              <>
                <li>
                  <Link className="hover:underline" href="/services/chiropractic">
                    Chiropractic care
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" href={WELLNESS_CARE_PLANS_PATH}>
                    Wellness care plans
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" href="/locations/paris/staff">
                    Meet the staff
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" href="/locations/paris">
                    Office &amp; hours
                  </Link>
                </li>
              </>
            ) : isSulphur ? (
              <>
                <li>
                  <Link className="hover:underline" href="/sulphur-springs">
                    Home
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" href="/sulphur-springs/staff">
                    Meet the staff
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" href="/sulphur-springs/patient-resources">
                    About chiropractic
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" href="/sulphur-springs/q-and-a">
                    Q &amp; A
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link className="hover:underline" href="/services/massage">
                    Massage therapy
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" href="/services/chiropractic">
                    Chiropractic care
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" href={WELLNESS_CARE_PLANS_PATH}>
                    Chiropractic wellness care plans
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" href="/locations/paris">
                    Paris office
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" href="/locations/sulphur-springs">
                    Sulphur Springs office
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" href="/sulphur-springs">
                    Sulphur Springs services
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" href="/sulphur-springs/staff">
                    Sulphur Springs staff
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" href="/about">
                    About us
                  </Link>
                </li>
              </>
            )}
            <li>
              <a
                className="hover:underline"
                href={giftCardHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                Gift cards (Square)
              </a>
            </li>
            <li>
              <Link className="hover:underline" href="/faq">
                FAQ
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/insurance">
                Insurance &amp; billing
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/patient-forms">
                Patient forms
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href={PRIVACY_PRACTICES_PATH}>
                Privacy practices
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href={WEBSITE_PRIVACY_PATH}>
                Website privacy
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href={TERMS_PATH}>
                Terms of use
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/contact">
                Contact
              </Link>
            </li>
          </ul>
        </nav>
        <FooterHoursPanel
          parisHours={parisHours}
          sulphurHours={sulphurHours}
          initialDomainCtx={initialDomainCtx}
          initialBusinessContext={initialBusinessContext}
        />
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>{copyrightLine}</span>
          <span aria-hidden className="text-white/30">
            ·
          </span>
          <Link className="hover:underline" href={PRIVACY_PRACTICES_PATH}>
            Privacy practices
          </Link>
          <span aria-hidden className="text-white/30">
            ·
          </span>
          <Link className="hover:underline" href={WEBSITE_PRIVACY_PATH}>
            Website privacy
          </Link>
          <span aria-hidden className="text-white/30">
            ·
          </span>
          <Link className="hover:underline" href={TERMS_PATH}>
            Terms
          </Link>
          <span aria-hidden className="text-white/30">
            ·
          </span>
          <Link className="hover:underline" href="/admin/login">
            Staff
          </Link>
        </p>
        <p className="mt-1 tabular-nums text-white/45">v{label}</p>
      </div>
    </footer>
  );
}
