import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { LOCATIONS } from "@/lib/constants";
import { LegalRelatedLinks } from "@/components/LegalRelatedLinks";
import { PRIVACY_PRACTICES_PATH } from "@/lib/legal";
import { getNppDownloadLink } from "@/lib/privacy";
import { siteLegalName } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Privacy Practices",
  description: `Notice of Privacy Practices and how ${siteLegalName} uses and protects patient information.`,
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
        lede="This page summarizes what information we collect through this website and how we protect health information collected during your in-office visits."
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-black text-[#173f3b]">What this website is used for</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-700">
            <li>
              This website is used for <strong>scheduling and general information</strong>. We use
              it to take appointment requests, share office details, and answer general questions.
            </li>
            <li>
              <strong className="text-[#173f3b]">Do not submit health information online.</strong>{" "}
              Please bring your printable patient forms, insurance card, and photo ID with you to
              your appointment. Do not email or text card photos.
            </li>
            <li>
              When you request an appointment, the website only collects your{" "}
              <strong>name, phone, email, preferred time, and any scheduling notes you choose to add</strong>{" "}
              &mdash; the same information the front desk would write down over the phone.
            </li>
            <li>
              <strong className="text-[#173f3b]">Not for emergencies.</strong> If you have a
              medical emergency, call 911 or go to the nearest emergency room.
            </li>
          </ul>
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-black text-[#173f3b]">How we protect information in the office</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-700">
            <li>
              Health and insurance information that you provide in person is kept in our clinical
              and billing systems and is used to prepare for your visit, coordinate care, and bill
              insurance when applicable.
            </li>
            <li>
              We do not share your health information with anyone other than as permitted by law and
              as described in the Notice of Privacy Practices below.
            </li>
            <li>
              Access is limited to authorized clinic staff who need the information to do their job.
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
          <h2 className="text-lg font-black text-[#173f3b]">Website, contact forms &amp; cookies</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-700">
            For how we handle contact form messages, booking requests, cookies, and general website
            usage data, see our{" "}
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
