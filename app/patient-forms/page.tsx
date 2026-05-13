import type { Metadata } from "next";
import Link from "next/link";

const PDF_PATH = "/the-rub-club-new-client-form-1.pdf";

export const metadata: Metadata = {
  title: "Patient Forms | The Rub Club",
  description: "New client form for The Rub Club massage therapy in Paris, TX.",
};

export default function PatientFormsPage() {
  return (
    <div className="min-h-[60vh] bg-stone-200">
      <div className="bg-[#0f5f5c] px-4 py-6 text-white sm:px-8 sm:py-8">
        <p className="text-sm text-white/85">
          <Link href="/" className="hover:underline">
            Welcome To Our Practice
          </Link>
          <span className="mx-2 text-white/50">/</span>
          <span className="font-semibold">Patient Forms</span>
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Patient Forms</h1>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <div className="flex min-h-[280px] items-center justify-center rounded-sm bg-stone-700 shadow-inner">
          <a
            href={PDF_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-bold uppercase tracking-wide text-white underline decoration-2 underline-offset-4 transition hover:text-[#f2d25d]"
          >
            NEW CLIENT FORM
          </a>
        </div>
      </div>

      <p className="mx-auto max-w-5xl px-4 pb-12 text-center text-sm text-stone-600 sm:px-8">
        Opens the same new client questionnaire as a PDF (
        <a href={PDF_PATH} className="font-medium text-[#0f5f5c] underline hover:text-[#0f817b]">
          download / print
        </a>
        ). Hosted on this site.
      </p>
    </div>
  );
}
