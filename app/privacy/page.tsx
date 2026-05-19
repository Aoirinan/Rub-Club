import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { LOCATIONS } from "@/lib/constants";
import { LegalRelatedLinks } from "@/components/LegalRelatedLinks";
import { PRIVACY_PRACTICES_PATH } from "@/lib/legal";
import { getNppDownloadLink } from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Privacy Practices",
  description:
    "Notice of Privacy Practices and how The Rub Club & Chiropractic Associates uses and protects patient information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const nppDownload = getNppDownloadLink();
  const paris = LOCATIONS.paris;

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Privacy Practices", url: "/privacy" },
        ]}
      />
      <PageHero
        eyebrow="Your privacy"
        title="Notice of Privacy Practices"
        lede="We use health and insurance information to prepare for your visit, coordinate care, and bill insurance when applicable. This page summarizes how we handle information submitted online and in the office."
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-black text-[#173f3b]">Online intake &amp; uploads</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-700">
            <li>
              Information you submit on our{" "}
              <Link href="/patient-forms" className="font-bold text-[#0f5f5c] underline">
                patient forms
              </Link>{" "}
              page (including optional insurance card or ID images) is stored securely and used for
              appointment preparation and care operations.
            </li>
            <li>Only authorized clinic staff may view intake records; access is logged.</li>
            <li>
              <strong className="text-[#173f3b]">Not for emergencies.</strong> If you have a
              medical emergency, call 911 or go to the nearest emergency room.
            </li>
            <li>
              Insurance verification and billing are also completed in the office when you visit, in
              addition to any information you send online.
            </li>
          </ul>
        </section>

        <section className="border-t-4 border-amber-500 bg-amber-50 p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-black text-amber-950">Official Notice of Privacy Practices</h2>
          <p className="mt-3 text-sm leading-relaxed text-amber-950">
            Federal law requires us to maintain a Notice of Privacy Practices (NPP) that describes
            how we may use and disclose protected health information and your rights. A printed copy
            is available at the front desk at each office.
          </p>
          <a
            href={nppDownload.href}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring mt-4 inline-flex bg-[#0f5f5c] px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[#0f817b]"
          >
            {nppDownload.label}
          </a>
          {nppDownload.note ? (
            <p className="mt-3 text-sm leading-relaxed text-amber-950">{nppDownload.note}</p>
          ) : null}
          <p className="mt-3 text-sm text-amber-950">
            Prefer paper in office? A printed copy is at the front desk, or call{" "}
            <a className="font-bold underline" href={`tel:${paris.phonePrimary.replace(/\D/g, "")}`}>
              {paris.phonePrimary}
            </a>
            . All printable forms are on our{" "}
            <Link className="font-bold underline" href="/patient-forms">
              patient forms
            </Link>{" "}
            page.
          </p>
        </section>

        <section className="border-t-4 border-stone-300 bg-stone-50 p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-black text-[#173f3b]">Website &amp; cookies</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-700">
            For how we handle contact forms, booking, cookies, and general website data (separate
            from PHI), see our{" "}
            <Link className="font-bold text-[#0f5f5c] underline" href="/website-privacy">
              website privacy policy
            </Link>{" "}
            and{" "}
            <Link className="font-bold text-[#0f5f5c] underline" href="/terms">
              terms of use
            </Link>
            .
          </p>
        </section>

        <section className="rounded border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
          <p>
            Questions about privacy or a request to access or amend your records?{" "}
            <Link className="font-bold text-[#0f5f5c] underline" href="/contact">
              Contact us
            </Link>{" "}
            or call the office you plan to visit.
          </p>
        </section>

        <LegalRelatedLinks currentPath={PRIVACY_PRACTICES_PATH} />
      </div>
    </>
  );
}
