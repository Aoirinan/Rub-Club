import { buildPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { MarkdownBulletList } from "@/components/SsMarkdownBody";
import { practiceThemeStyle } from "@/components/practice/theme";
import {
  getPageBrand,
  isSulphurSpringsBrand,
  sharedPageBreadcrumbs,
  wellnessPlansPathForBrand,
} from "@/lib/page-business-theme";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { isOnlineFormsPubliclyAvailable } from "@/lib/intakeForms/config-db";
import { CHIRO_INTAKE_PACKET_PDF, MASSAGE_NEW_CLIENT_PDF } from "@/lib/privacy";
import { getPatientFormsContent } from "@/lib/static-pages-content";

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: "Patient Forms",
  description:
    "Download chiropractic new patient and personal injury intake paperwork and massage new-client forms for your visit in Paris or Sulphur Springs, TX.",
  path: "/patient-forms",
  ogTitle: "Patient Forms — Chiropractic Associates",
  ogDescription:
    "Chiropractic and massage intake forms for Paris and Sulphur Springs — printable PDF downloads.",
});

export default async function PatientFormsPage() {
  const [c, displayLocs, brand, showOnlineForms] = await Promise.all([
    getPatientFormsContent(),
    getDisplayLocations(),
    getPageBrand(),
    isOnlineFormsPubliclyAvailable(),
  ]);

  const ssFirst = isSulphurSpringsBrand(brand);
  const locationCards = ssFirst
    ? [
        { key: "ss", label: "Sulphur Springs, TX", phone: displayLocs.sulphur_springs.phonePrimary },
        { key: "paris", label: "Paris, TX", phone: displayLocs.paris.phonePrimary },
      ]
    : [
        { key: "paris", label: "Paris, TX", phone: displayLocs.paris.phonePrimary },
        { key: "ss", label: "Sulphur Springs, TX", phone: displayLocs.sulphur_springs.phonePrimary },
      ];

  return (
    <div style={practiceThemeStyle(brand.loc)}>
      <Breadcrumbs
        items={sharedPageBreadcrumbs(brand, {
          name: "Patient Forms",
          url: "/patient-forms",
        })}
      />
      <PageHero
        eyebrow={c.heroEyebrow}
        title={c.heroTitle}
        lede={c.heroLede}
        variant={brand.variant}
      />
      <div className="mx-auto max-w-5xl space-y-6 px-4 pb-16">
        {showOnlineForms ? (
          <section className="border-t-4 border-black bg-[var(--pp-heading)] p-6 text-white shadow-md sm:p-8">
            <h2 className="text-xl font-black">Complete your forms online</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/90">
              Prefer to fill everything out from your phone or computer? Complete your intake and
              consent forms online before your visit — no printing required.
            </p>
            <Link
              href="/online-forms"
              className="focus-ring mt-5 inline-flex bg-[#f19f1f] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#3a2a06] hover:bg-[#d98c12]"
            >
              Go to online patient forms
            </Link>
          </section>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 md:items-start">
          <section className="border-t-4 border-black bg-white p-6 shadow-md sm:p-8">
            <h2 className="text-xl font-black text-[var(--pp-heading)]">{c.chiroHeading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">{c.chiroIntro}</p>
            {c.chiroBullets.trim() ? <MarkdownBulletList text={c.chiroBullets} /> : null}
            <a
              href={CHIRO_INTAKE_PACKET_PDF}
              download="chiropractic-new-patient-packet.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring mt-6 inline-flex bg-black px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-stone-800"
            >
              Download chiropractic intake packet (PDF)
            </a>
          </section>

          <section className="border-t-4 border-black bg-white p-6 shadow-md sm:p-8">
            <h2 className="text-xl font-black text-[var(--pp-heading)]">{c.massageHeading}</h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-700">{c.massageBody}</p>
            <a
              href={MASSAGE_NEW_CLIENT_PDF}
              download="rub-club-new-client-form.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring mt-6 inline-flex bg-black px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-stone-800"
            >
              Download massage new-client form (PDF)
            </a>
          </section>
        </div>

        <section className="border-t-4 border-black bg-stone-50 p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-black text-[var(--pp-heading)]">{c.inpersonHeading}</h2>
          <div className="mt-3 text-sm leading-relaxed text-stone-700">
            <MarkdownBulletList text={c.inpersonBullets} />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {locationCards.map((loc) => (
              <div key={loc.key} className="rounded border border-stone-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-600">
                  {loc.label}
                </p>
                <a
                  href={telHref(loc.phone)}
                  className="mt-1 block text-lg font-black text-[var(--pp-heading)] hover:underline"
                >
                  {loc.phone}
                </a>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-stone-600">
            Interested in ongoing chiropractic wellness options? See our{" "}
            <Link
              href={wellnessPlansPathForBrand(brand)}
              className="font-bold text-[var(--pp-accent)] underline hover:text-[var(--pp-heading)]"
            >
              wellness care plans overview
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
