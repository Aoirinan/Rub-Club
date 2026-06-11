import { buildPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { LegalRelatedLinks } from "@/components/LegalRelatedLinks";
import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_PRACTICE_NAME,
  PRIVACY_PRACTICES_PATH,
  WEBSITE_PRIVACY_PATH,
} from "@/lib/legal";
import { siteLegalName } from "@/lib/site-content";

export const metadata = buildPageMetadata({
  title: "Website Privacy",
  description: `How ${siteLegalName} collects and uses information on this website (cookies, contact forms, and booking).`,
  path: WEBSITE_PRIVACY_PATH,
});

function Section({
  title,
  children,
  variant = "default",
}: {
  title: string;
  children: React.ReactNode;
  variant?: "default" | "muted";
}) {
  const border = variant === "muted" ? "border-stone-300" : "border-[#0f5f5c]";
  const bg = variant === "muted" ? "bg-stone-50" : "bg-white";
  return (
    <section className={`border-t-4 ${border} ${bg} p-6 shadow-md sm:p-8`}>
      <h2 className="text-lg font-black text-[#173f3b]">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-stone-700">{children}</div>
    </section>
  );
}

export default function WebsitePrivacyPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Website privacy", url: WEBSITE_PRIVACY_PATH },
        ]}
      />
      <PageHero
        eyebrow="This website"
        title="Website privacy policy"
        lede={`This policy describes how ${LEGAL_PRACTICE_NAME} collects and uses information when you browse or use this website. It does not replace our Notice of Privacy Practices for protected health information (PHI).`}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
        <p className="text-xs text-stone-600">Effective {LEGAL_EFFECTIVE_DATE}</p>

        <Section title="Scope">
          <p>
            This policy applies to visitors and patients using our public website (scheduling,
            contact forms, and general pages). Information you submit for clinical care — including
            online intake — is also governed by our{" "}
            <Link className="font-bold text-[#0f5f5c] underline" href={PRIVACY_PRACTICES_PATH}>
              Notice of Privacy Practices
            </Link>
            .
          </p>
        </Section>

        <Section title="Information we may collect">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-[#173f3b]">Contact and scheduling:</strong> name, phone number,
              email address, appointment preferences, and messages you send through our contact
              form.
            </li>
            <li>
              <strong className="text-[#173f3b]">Technical data:</strong> browser type, device
              information, pages viewed, and approximate location derived from IP address when
              analytics tools are enabled.
            </li>
            <li>
              <strong className="text-[#173f3b]">Patient forms:</strong> health and insurance
              information you choose to submit on our patient forms page — handled under stricter
              safeguards described on our privacy practices page.
            </li>
          </ul>
        </Section>

        <Section title="How we use website information">
          <ul className="list-disc space-y-2 pl-5">
            <li>Respond to questions and schedule or confirm appointments.</li>
            <li>Operate, secure, and improve this website.</li>
            <li>
              Send service-related messages about your appointment (for example, confirmations or
              reminders), when applicable.
            </li>
            <li>
              With your consent or as permitted by law, send occasional practice news or offers. You
              may opt out at any time by contacting us.
            </li>
          </ul>
          <p className="mt-3 font-bold text-[#173f3b]">We do not sell your personal information.</p>
        </Section>

        <Section title="Cookies and similar technologies" variant="muted">
          <p>
            We use small files stored in your browser to make the site work and, when configured, to
            understand how visitors use our pages.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-[#173f3b]">rub_domain_ctx</strong> — remembers whether you
              arrived from massage- or chiropractic-focused content so we can show relevant
              information. Not used for advertising.
            </li>
            <li>
              <strong className="text-[#173f3b]">Staff sign-in</strong> — a session cookie used only
              for authorized clinic staff on admin pages; not set for typical patient browsing.
            </li>
            <li>
              <strong className="text-[#173f3b]">Analytics (optional)</strong> — if enabled, Google
              Analytics or Google Tag Manager may collect usage statistics. We configure IP
              anonymization where supported.
            </li>
          </ul>
          <p className="mt-3">
            You can control cookies through your browser settings. Blocking cookies may limit some
            features (for example, personalized service highlights).
          </p>
        </Section>

        <Section title="Third-party services">
          <p>Some links and tools open or run on other companies&apos; websites, including:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Google Maps (directions and office listings)</li>
            <li>Square (gift card purchases linked from our site)</li>
            <li>Social media profiles such as Facebook</li>
          </ul>
          <p className="mt-3">
            Those services have their own privacy policies. We are not responsible for information
            you provide directly to them.
          </p>
        </Section>

        <Section title="Security">
          <p>
            We use administrative, technical, and physical safeguards appropriate to the type of
            information collected. No website can guarantee perfect security; please use the contact
            form for general inquiries only — not detailed clinical information.
          </p>
        </Section>

        <Section title="Your choices">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Opt out of marketing emails or texts by replying STOP (where applicable) or{" "}
              <Link className="font-bold text-[#0f5f5c] underline" href="/contact">
                contacting us
              </Link>
              .
            </li>
            <li>
              For rights regarding health records (access, amendment, accounting of disclosures),
              see our{" "}
              <Link className="font-bold text-[#0f5f5c] underline" href={PRIVACY_PRACTICES_PATH}>
                Notice of Privacy Practices
              </Link>
              .
            </li>
            <li>
              Texas residents may have additional rights under applicable state privacy laws; contact
              us to submit a request.
            </li>
          </ul>
        </Section>

        <Section title="Children">
          <p>
            This website is not directed at children under 13. We do not knowingly collect personal
            information from children through the site without parental involvement.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update this policy by posting a new effective date on this page. Continued use of
            the website after changes means you accept the updated policy.
          </p>
        </Section>

        <Section title="Contact" variant="muted">
          <p>
            Questions about this website privacy policy?{" "}
            <Link className="font-bold text-[#0f5f5c] underline" href="/contact">
              Contact us
            </Link>{" "}
            or call the office you plan to visit.
          </p>
        </Section>

        <LegalRelatedLinks currentPath={WEBSITE_PRIVACY_PATH} />
      </div>
    </>
  );
}
