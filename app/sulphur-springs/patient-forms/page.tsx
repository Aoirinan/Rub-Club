import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { MarkdownBulletList } from "@/components/SsMarkdownBody";
import { practiceThemeStyle } from "@/components/practice/theme";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { getContentMany } from "@/lib/cms";
import { isOnlineFormsPubliclyAvailable } from "@/lib/intakeForms/config-db";
import { getPageMeta } from "@/lib/page-meta";
import { getPatientFormsContent } from "@/lib/static-pages-content";
import { SS_PAGES_CMS_DEFAULTS, ssPageFieldIds } from "@/lib/ss-pages-cms";
import { SS_WELLNESS_PUBLIC_PATH } from "@/lib/ss-wellness-care-plans-content";
import { getUiText } from "@/lib/ui-text";

export const revalidate = 60;

const IDS = [...ssPageFieldIds("ss_patient_forms_"), "page_ss_patient_forms_og_description"];

async function copy(): Promise<Record<string, string>> {
  const cms = await getContentMany(IDS);
  return Object.fromEntries(IDS.map((id) => [id, cms[id]?.trim() || SS_PAGES_CMS_DEFAULTS[id] || ""]));
}

export async function generateMetadata(): Promise<Metadata> {
  const [meta, x] = await Promise.all([
    getPageMeta("ss_patient_forms", {
      title: "Patient Forms — Sulphur Springs",
      description:
        "Download chiropractic new patient and personal injury intake paperwork and massage new-client forms for your visit in Sulphur Springs, TX.",
    }),
    copy(),
  ]);
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: "/sulphur-springs/patient-forms",
    ogTitle: meta.title,
    ogDescription: x.page_ss_patient_forms_og_description,
  });
}

export default async function SulphurSpringsPatientFormsPage() {
  const [c, x, displayLocs, showOnlineForms, ui] = await Promise.all([
    getPatientFormsContent("ss_"),
    copy(),
    getDisplayLocations(),
    isOnlineFormsPubliclyAvailable(),
    getUiText(),
  ]);
  const ss = displayLocs.sulphur_springs;

  return (
    <div style={practiceThemeStyle("sulphur-springs")}>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Sulphur Springs", url: "/sulphur-springs" },
          { name: "Patient Forms", url: "/sulphur-springs/patient-forms" },
        ]}
      />
      <PageHero
        eyebrow={c.heroEyebrow}
        title={c.heroTitle}
        lede={c.heroLede}
        variant="sulphur"
      />
      <div className="mx-auto max-w-5xl space-y-6 px-4 pb-16">
        {showOnlineForms ? (
          <section className="border-t-4 border-black bg-[var(--pp-heading)] p-6 text-white shadow-md sm:p-8">
            <h2 className="text-xl font-black">{x.ss_patient_forms_online_heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/90">
              {x.ss_patient_forms_online_body}
            </p>
            <Link
              href="/online-forms"
              className="focus-ring mt-5 inline-flex bg-[#f19f1f] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#3a2a06] hover:bg-[#d98c12]"
            >
              {x.ss_patient_forms_online_button}
            </Link>
          </section>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 md:items-start">
          <section className="border-t-4 border-black bg-white p-6 shadow-md sm:p-8">
            <h2 className="text-xl font-black text-[var(--pp-heading)]">{c.chiroHeading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">{c.chiroIntro}</p>
            {c.chiroBullets.trim() ? <MarkdownBulletList text={c.chiroBullets} /> : null}
            <a
              href={x.ss_patient_forms_chiro_pdf_url}
              download="chiropractic-new-patient-packet.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring mt-6 inline-flex bg-black px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-stone-800"
            >
              {x.ss_patient_forms_chiro_pdf_label}
            </a>
          </section>

          <section className="border-t-4 border-black bg-white p-6 shadow-md sm:p-8">
            <h2 className="text-xl font-black text-[var(--pp-heading)]">{c.massageHeading}</h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-700">{c.massageBody}</p>
            <a
              href={x.ss_patient_forms_massage_pdf_url}
              download="rub-club-new-client-form.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring mt-6 inline-flex bg-black px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-stone-800"
            >
              {x.ss_patient_forms_massage_pdf_label}
            </a>
          </section>
        </div>

        <section className="border-t-4 border-black bg-stone-50 p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-black text-[var(--pp-heading)]">{c.inpersonHeading}</h2>
          <div className="mt-3 text-sm leading-relaxed text-stone-700">
            <MarkdownBulletList text={c.inpersonBullets} />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded border border-stone-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-600">
                {ss.shortName}
              </p>
              <a
                href={ss.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring mt-2 block text-sm text-stone-700 hover:underline"
              >
                {ss.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </a>
              <a
                href={telHref(ss.phonePrimary)}
                className="mt-2 block text-lg font-black text-[var(--pp-heading)] hover:underline"
              >
                {ss.phonePrimary}
              </a>
              {ss.fax?.trim() ? (
                <p className="mt-1 text-sm text-stone-600">
                  {ui.ui_fax_label} {ss.fax}
                </p>
              ) : null}
            </div>
          </div>
          <p className="mt-6 text-sm text-stone-600">
            {x.ss_patient_forms_wellness_prefix}{" "}
            <Link
              href={SS_WELLNESS_PUBLIC_PATH}
              className="font-bold text-[var(--pp-accent)] underline hover:text-[var(--pp-heading)]"
            >
              {x.ss_patient_forms_wellness_link_label}
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
