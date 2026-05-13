import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { IntakeForm } from "@/components/IntakeForm";

const PDF_PATH = "/the-rub-club-new-client-form-1.pdf";

export const metadata: Metadata = {
  title: "Patient Forms",
  description:
    "Complete your new-client intake form online before your first massage or chiropractic appointment in Paris or Sulphur Springs, TX.",
  alternates: { canonical: "/patient-forms" },
  openGraph: {
    title: "Patient Forms — The Rub Club & Chiropractic Associates",
    description: "Complete your intake form online or download the PDF.",
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
        lede="Save time at your first visit by filling out the intake form online — or download the PDF to bring with you."
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
        <IntakeForm />

        <section className="border-t-4 border-[#0f5f5c] bg-white p-8 text-center shadow-md sm:p-12">
          <p className="text-sm font-bold uppercase tracking-wide text-stone-600">
            Prefer paper?
          </p>
          <h2 className="mt-2 text-xl font-black text-[#173f3b]">Download the PDF form</h2>
          <p className="mt-3 text-stone-700">
            Print it out, fill it in by hand, and bring it to your first appointment.
          </p>
          <a
            href={PDF_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring mt-6 inline-flex bg-[#0f5f5c] px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[#0f817b]"
          >
            Download new-client form (PDF)
          </a>
        </section>
        <section className="rounded border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
          <p>
            For chiropractic intake, paperwork is completed at the office. Please arrive 10–15
            minutes early on your first visit, or{" "}
            <Link className="font-bold text-[#0f5f5c] underline" href="/contact">
              contact us
            </Link>{" "}
            if you need accommodations.
          </p>
        </section>
      </div>
    </>
  );
}
