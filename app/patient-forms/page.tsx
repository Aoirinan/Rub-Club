import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getPageMeta } from "@/lib/page-meta";
import { getContentMany } from "@/lib/cms";
import { pageOgDescriptionId, pageOgTitleId, parisText } from "@/lib/paris-pages-cms";
import { getUiText } from "@/lib/ui-text";
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
import { getPatientFormsContent } from "@/lib/static-pages-content";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [meta, og] = await Promise.all([
    getPageMeta("patient_forms", {
      title: "Patient Forms",
      description:
        "Download chiropractic new patient and personal injury intake paperwork and massage new-client forms for your visit in Paris or Sulphur Springs, TX.",
    }),
    getContentMany([pageOgTitleId("patient_forms"), pageOgDescriptionId("patient_forms")]),
  ]);
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: "/patient-forms",
    ogTitle: parisText(og, pageOgTitleId("patient_forms")),
    ogDescription: parisText(og, pageOgDescriptionId("patient_forms")),
  });
}

const PATIENT_FORMS_COPY_IDS = [
  "patient_forms_online_heading",
  "patient_forms_online_body",
  "patient_forms_online_button",
  "patient_forms_chiro_pdf_label",
  "patient_forms_chiro_pdf_url",
  "patient_forms_massage_pdf_label",
  "patient_forms_massage_pdf_url",
  "patient_forms_wellness_prefix",
  "patient_forms_wellness_link_label",
] as const;

export default async function PatientFormsPage() {
  const [c, displayLocs, brand, showOnlineForms, copy, ui] = await Promise.all([
    getPatientFormsContent(),
    getDisplayLocations(),
    getPageBrand(),
    isOnlineFormsPubliclyAvailable(),
    getContentMany([...PATIENT_FORMS_COPY_IDS]),
    getUiText(),
  ]);
  const t = (id: string) => parisText(copy, id);

  const ssFirst = isSulphurSpringsBrand(brand);
  const locationCards = ssFirst
    ? [displayLocs.sulphur_springs, displayLocs.paris]
    : [displayLocs.paris, displayLocs.sulphur_springs];

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
            <h2 className="text-xl font-black">{t("patient_forms_online_heading")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/90">
              {t("patient_forms_online_body")}
            </p>
            <Link
              href="/online-forms"
              className="focus-ring mt-5 inline-flex bg-[#f19f1f] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#3a2a06] hover:bg-[#d98c12]"
            >
              {t("patient_forms_online_button")}
            </Link>
          </section>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 md:items-start">
          <section className="border-t-4 border-black bg-white p-6 shadow-md sm:p-8">
            <h2 className="text-xl font-black text-[var(--pp-heading)]">{c.chiroHeading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">{c.chiroIntro}</p>
            {c.chiroBullets.trim() ? <MarkdownBulletList text={c.chiroBullets} /> : null}
            <a
              href={t("patient_forms_chiro_pdf_url")}
              download="chiropractic-new-patient-packet.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring mt-6 inline-flex bg-black px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-stone-800"
            >
              {t("patient_forms_chiro_pdf_label")}
            </a>
          </section>

          <section className="border-t-4 border-black bg-white p-6 shadow-md sm:p-8">
            <h2 className="text-xl font-black text-[var(--pp-heading)]">{c.massageHeading}</h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-700">{c.massageBody}</p>
            <a
              href={t("patient_forms_massage_pdf_url")}
              download="rub-club-new-client-form.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring mt-6 inline-flex bg-black px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-stone-800"
            >
              {t("patient_forms_massage_pdf_label")}
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
              <div key={loc.id} className="rounded border border-stone-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-600">
                  {loc.shortName}
                </p>
                <a
                  href={loc.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring mt-2 block text-sm text-stone-700 hover:underline"
                >
                  {loc.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </a>
                <a
                  href={telHref(loc.phonePrimary)}
                  className="mt-2 block text-lg font-black text-[var(--pp-heading)] hover:underline"
                >
                  {loc.phonePrimary}
                </a>
                {loc.fax?.trim() ? (
                  <p className="mt-1 text-sm text-stone-600">{ui.ui_fax_label} {loc.fax}</p>
                ) : null}
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-stone-600">
            {t("patient_forms_wellness_prefix")}{" "}
            <Link
              href={wellnessPlansPathForBrand(brand)}
              className="font-bold text-[var(--pp-accent)] underline hover:text-[var(--pp-heading)]"
            >
              {t("patient_forms_wellness_link_label")}
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
