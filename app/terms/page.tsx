import { buildPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { LegalRelatedLinks } from "@/components/LegalRelatedLinks";
import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_PRACTICE_NAME,
  PRIVACY_PRACTICES_PATH,
  TERMS_PATH,
  WEBSITE_PRIVACY_PATH,
} from "@/lib/legal";
import { siteLegalName } from "@/lib/site-content";

export const metadata = buildPageMetadata({
  title: "Terms of Use",
  description: `Terms of use for the ${siteLegalName} website, including booking, content, and limitations.`,
  path: TERMS_PATH,
});

export default function TermsPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Terms of use", url: TERMS_PATH },
        ]}
      />
      <PageHero
        eyebrow="Using this site"
        title="Website terms of use"
        lede={`By using this website operated by ${LEGAL_PRACTICE_NAME}, you agree to these terms. If you do not agree, please do not use the site.`}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
        <p className="text-xs text-stone-600">Effective {LEGAL_EFFECTIVE_DATE}</p>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-black text-[#173f3b]">Not medical advice or emergency care</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-700">
            <li>
              Content on this website is for general information only and is not a substitute for
              professional medical advice, diagnosis, or treatment.
            </li>
            <li>
              <strong className="text-[#173f3b]">Do not use this site for emergencies.</strong> Call
              911 or go to the nearest emergency room.
            </li>
            <li>Always seek the advice of your physician or qualified provider with questions about a medical condition.</li>
          </ul>
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-black text-[#173f3b]">Online booking and forms</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-700">
            <li>
              Appointment requests are subject to availability and confirmation by our office. We may
              contact you to verify details or reschedule.
            </li>
            <li>
              You agree to provide accurate contact information. Missed appointments or late
              cancellations may be subject to our office policies, which we will explain when you
              book or visit.
            </li>
            <li>
              Online intake and patient forms are described in our{" "}
              <Link className="font-bold text-[#0f5f5c] underline" href={PRIVACY_PRACTICES_PATH}>
                Notice of Privacy Practices
              </Link>{" "}
              and{" "}
              <Link className="font-bold text-[#0f5f5c] underline" href={WEBSITE_PRIVACY_PATH}>
                website privacy policy
              </Link>
              .
            </li>
          </ul>
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-black text-[#173f3b]">Acceptable use</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-700">
            You may not use this website to transmit unlawful, harmful, or abusive material; attempt
            to gain unauthorized access to our systems; interfere with the site&apos;s operation; or
            scrape or automate access in a way that burdens our services.
          </p>
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-black text-[#173f3b]">Intellectual property</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-700">
            Text, images, logos, and design on this site are owned by or licensed to{" "}
            {LEGAL_PRACTICE_NAME} unless otherwise noted. You may view and print pages for personal,
            non-commercial use. You may not copy, modify, or distribute site content for commercial
            purposes without our written permission.
          </p>
        </section>

        <section className="border-t-4 border-stone-300 bg-stone-50 p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-black text-[#173f3b]">Disclaimer of warranties</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-700">
            This website is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; To the fullest
            extent permitted by law, we disclaim warranties of merchantability, fitness for a
            particular purpose, and non-infringement. We do not warrant that the site will be
            uninterrupted, error-free, or free of harmful components.
          </p>
        </section>

        <section className="border-t-4 border-stone-300 bg-stone-50 p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-black text-[#173f3b]">Limitation of liability</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-700">
            To the fullest extent permitted by Texas law, {LEGAL_PRACTICE_NAME} and its owners,
            employees, and agents will not be liable for any indirect, incidental, special, or
            consequential damages arising from your use of this website. Our total liability for
            claims related to the site shall not exceed one hundred U.S. dollars ($100), except where
            liability cannot be limited by law.
          </p>
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-black text-[#173f3b]">Links to other sites</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-700">
            Links to third-party websites (for example, gift cards, maps, or social media) are
            provided for convenience. We do not control and are not responsible for those sites or
            their content.
          </p>
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-black text-[#173f3b]">Governing law</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-700">
            These terms are governed by the laws of the State of Texas, without regard to conflict-of-law
            rules. Exclusive venue for disputes relating to this website shall be in Lamar County,
            Texas, unless otherwise required by law.
          </p>
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-black text-[#173f3b]">Changes</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-700">
            We may revise these terms by posting an updated effective date. Your continued use of the
            website after changes constitutes acceptance of the revised terms.
          </p>
        </section>

        <section className="rounded border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
          <p>
            Questions?{" "}
            <Link className="font-bold text-[#0f5f5c] underline" href="/contact">
              Contact us
            </Link>
            .
          </p>
        </section>

        <LegalRelatedLinks currentPath={TERMS_PATH} />
      </div>
    </>
  );
}
