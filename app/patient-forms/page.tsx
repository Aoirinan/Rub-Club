import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { LOCATIONS, WELLNESS_CARE_PLANS_PATH } from "@/lib/constants";

import {
  CHIRO_INTAKE_PACKET_PDF,
  MASSAGE_NEW_CLIENT_PDF,
} from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Patient Forms",
  description:
    "Download chiropractic new patient and personal injury intake paperwork, massage new-client forms, or complete our online intake before your visit in Paris or Sulphur Springs, TX.",
  alternates: { canonical: "/patient-forms" },
  openGraph: {
    title: "Patient Forms — Chiropractic Associates",
    description:
      "Chiropractic and massage intake forms for Paris and Sulphur Springs — online or printable PDF.",
    url: "/patient-forms",
  },
};

export default function PatientFormsPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Patient Forms", url: "/patient-forms" },
        ]}
      />
      <PageHero
        eyebrow="Welcome to our practice"
        title="Patient forms"
        lede="Download our 9-page chiropractic intake packet or the massage new-client PDF, print and complete it at home, and bring it to your visit in Paris or Sulphur Springs."
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-8">
          <h2 className="text-xl font-black text-[#173f3b]">Chiropractic: new patient &amp; personal injury</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-700">
            This is the same <strong>9-page</strong> printable packet we use in office for new
            chiropractic patients. Print it, complete every page that applies to your visit, and bring
            it with you (or arrive a few minutes early to fill it out here).
          </p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-stone-700">
            <li>
              <span className="font-bold text-[#173f3b]">Pages 1–4</span> — patient and insurance
              information, health history, and symptom checklist.
            </li>
            <li>
              <span className="font-bold text-[#173f3b]">Pages 5–8</span> — insurance acknowledgment,
              informed consent, assignment of benefits, and Notice of Privacy Practices (HIPAA).
            </li>
            <li>
              <span className="font-bold text-[#173f3b]">Page 9</span> — CMS-1500 (if your visit
              requires it; the front desk can help).
            </li>
            <li>
              <span className="font-bold text-[#173f3b]">Personal injury / auto accident</span> — use
              this same packet; answer accident and case questions where prompted and bring insurance
              or claim information to your appointment.
            </li>
          </ul>
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
          <h2 className="mt-2 text-xl font-black text-[#173f3b]">New client form (PDF)</h2>
          <p className="mt-3 text-stone-700">
            Print this form, fill it in by hand, and bring it to your first massage appointment.
          </p>
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
          <h2 className="text-lg font-black text-amber-950">Bringing your forms in person</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-amber-950">
            <li>
              Complete your forms at home and bring the printed pages with you. If you can&rsquo;t
              print, arrive <strong>10&ndash;15 minutes early</strong> and we&rsquo;ll have paper
              copies at the front desk.
            </li>
            <li>
              Bring your <strong>insurance card</strong> and a <strong>photo ID</strong> with you
              &mdash; we&rsquo;ll scan them at the front desk. Please do not email or text card
              photos.
            </li>
            <li>
              For questions about which pages apply to your visit, attorney letters of protection,
              or accommodations, call the office below or{" "}
              <Link className="font-bold underline" href="/contact">
                send us a message
              </Link>
              .
            </li>
          </ul>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded border border-amber-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-900">
                Paris, TX
              </p>
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
