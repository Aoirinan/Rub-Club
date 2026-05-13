import Link from "next/link";
import { LOCATION_LIST, telHref } from "@/lib/constants";
import { MASSAGE } from "@/lib/home-verbatim";
import { siteShortName } from "@/lib/site-content";

export function SiteFooter() {
  const label = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t-4 border-[#0f5f5c] bg-[#23312e] text-white/85">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-base font-black tracking-tight text-white">{siteShortName}</p>
          <p className="mt-2 text-sm text-white/70">
            Family-owned wellness in Northeast Texas. Two practices, one address in Paris — plus
            chiropractic care in Sulphur Springs.
          </p>
        </div>
        <div className="space-y-4 text-sm">
          {LOCATION_LIST.map((loc) => (
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
              {loc.phoneSecondary ? (
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
              <Link className="hover:underline" href="/reviews">
                Patient reviews
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/patient-forms">
                Patient forms
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/contact">
                Contact
              </Link>
            </li>
          </ul>
        </nav>
        <div className="text-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2d25d]">Hours</p>
          <dl className="mt-3 space-y-1">
            {MASSAGE.hours.map((row) => (
              <div key={row.day} className="flex justify-between gap-3 border-b border-white/10 py-1">
                <dt className="font-bold text-white">{row.day}</dt>
                <dd className="text-white/80">{row.hours}</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/book"
            className="focus-ring mt-4 inline-flex bg-[#f2d25d] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#173f3b] hover:bg-[#e6c13d]"
          >
            Book online
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        <p>
          © {year} {siteShortName}. All rights reserved. ·{" "}
          <Link className="hover:underline" href="/admin/login">
            Staff
          </Link>
        </p>
        <p className="mt-1">Build {label}</p>
      </div>
    </footer>
  );
}
