import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";

const PDF_PATH = "/the-rub-club-new-client-form-1.pdf";

export const metadata: Metadata = {
  title: "Patient Forms",
  description:
    "Download The Rub Club new-client intake form before your first massage appointment in Paris, TX.",
  alternates: { canonical: "/patient-forms" },
  openGraph: {
    title: "Patient Forms — The Rub Club",
    description: "New-client intake form for The Rub Club massage in Paris, TX.",
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
        lede="Save time at your first visit by downloading the intake form ahead of time."
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#0f5f5c] bg-white p-8 text-center shadow-md sm:p-12">
          <p className="text-sm font-bold uppercase tracking-wide text-stone-600">
            For new massage clients
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#173f3b]">The Rub Club intake form</h2>
          <p className="mt-3 text-stone-700">
            Print, fill out, and bring it to your first appointment — or fill it out in the office.
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
