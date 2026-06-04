import { buildPageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { MarkdownBulletList } from "@/components/SsMarkdownBody";
import { LOCATIONS, WELLNESS_CARE_PLANS_PATH } from "@/lib/constants";
import { CHIRO_INTAKE_PACKET_PDF, MASSAGE_NEW_CLIENT_PDF } from "@/lib/privacy";
import { getPatientFormsContent } from "@/lib/static-pages-content";

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: "Patient Forms",
  description:
    "Download chiropractic new patient and personal injury intake paperwork, massage new-client forms, or complete our online intake before your visit in Paris or Sulphur Springs, TX.",
  path: "/patient-forms",
  ogTitle: "Patient Forms — Chiropractic Associates",
  ogDescription:
    "Chiropractic and massage intake forms for Paris and Sulphur Springs — online or printable PDF.",
});

export default async function PatientFormsPage() {
  const c = await getPatientFormsContent();

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Patient Forms", url: "/patient-forms" },
        ]}
      />
      <PageHero eyebrow={c.heroEyebrow} title={c.heroTitle} lede={c.heroLede} />
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-8">
          <h2 className="text-xl font-black text-[#173f3b]">{c.chiroHeading}</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-700">{c.chiroIntro}</p>
          <MarkdownBulletList text={c.chiroBullets} />
          <a
            href={CHIRO_INTAKE_PACKET_PDF}
            download="chiropractic-new-patient-packet.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring mt-6 inline-flex bg-[#0f5f5c] px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[#0f817b]"
          >
            Download 9-page chiropractic intake packet (PDF)
          </a>
          <p className="mt-6 border-t border-stone-200 pt-6 text-sm leading-relaxed text-stone-700">
            Interested in ongoing chiropractic wellness options? See our{" "}
            <Link
              href={WELLNESS_CARE_PLANS_PATH}
              className="font-bold text-[#0f5f5c] underline hover:text-[#173f3b]"
            >
              wellness care plans overview
            </Link>
            .
          </p>
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-8 text-center shadow-md sm:p-12">
          <p className="text-sm font-bold uppercase tracking-wide text-stone-600">
            Massage (The Rub Club)
          </p>
          <h2 className="mt-2 text-xl font-black text-[#173f3b]">{c.massageHeading}</h2>
          <p className="mt-3 text-stone-700">{c.massageBody}</p>
          <a
            href={MASSAGE_NEW_CLIENT_PDF}
            download="rub-club-new-client-form.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring mt-6 inline-flex bg-[#0f5f5c] px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[#0f817b]"
          >
            Download massage new-client form (PDF)
          </a>
        </section>

        <section className="border-t-4 border-amber-500 bg-amber-50 p-6 shadow-md sm:p-8">
          <h2 className="text-lg font-black text-amber-950">{c.inpersonHeading}</h2>
          <div className="mt-3 text-sm leading-relaxed text-amber-950">
            <MarkdownBulletList text={c.inpersonBullets} />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded border border-amber-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Paris, TX</p>
              <a
                href={`tel:${LOCATIONS.paris.phonePrimary.replace(/\D/g, "")}`}
                className="mt-1 block text-lg font-black text-[#173f3b] hover:underline"
              >
                {LOCATIONS.paris.phonePrimary}
              </a>
            </div>
            <div className="rounded border border-amber-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-900">
                Sulphur Springs, TX
              </p>
              <a
                href={`tel:${LOCATIONS.sulphur_springs.phonePrimary.replace(/\D/g, "")}`}
                className="mt-1 block text-lg font-black text-[#173f3b] hover:underline"
              >
                {LOCATIONS.sulphur_springs.phonePrimary}
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
