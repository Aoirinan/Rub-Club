import type { Metadata } from "next";
import { Breadcrumbs, CtaCard, PageHero } from "@/components/PageChrome";
import { SS_PATIENT_RESOURCES } from "@/lib/sulphur-springs-content";
import { telHref } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Patient Resources — Sulphur Springs Chiropractic",
  description:
    "Chiropractic patient resources, helpful links, and educational topics from Chiropractic Associates of Sulphur Springs.",
  alternates: { canonical: "/sulphur-springs/patient-resources" },
  openGraph: {
    title: "Patient Resources — Sulphur Springs, TX",
    description:
      "Chiropractic patient resources, helpful links, and educational topics from Chiropractic Associates of Sulphur Springs.",
    url: "/sulphur-springs/patient-resources",
  },
};

export default function PatientResourcesPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Sulphur Springs", url: "/sulphur-springs" },
          { name: "Patient Resources", url: "/sulphur-springs/patient-resources" },
        ]}
      />
      <PageHero
        eyebrow="Chiropractic Associates · Sulphur Springs"
        title="Patient Resources"
      />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <div className="prose prose-stone max-w-none">
            <p className="leading-relaxed text-stone-700">
              {SS_PATIENT_RESOURCES.intro}
            </p>

            <h2 className="mt-8 text-xl font-black text-[#173f3b]">
              About Chiropractic
            </h2>
            <ul className="list-disc space-y-1 pl-6 text-stone-700">
              {SS_PATIENT_RESOURCES.aboutChiroTopics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>

            <h2 className="mt-8 text-xl font-black text-[#173f3b]">
              Helpful Links
            </h2>
            <ul className="list-disc space-y-2 pl-6">
              {SS_PATIENT_RESOURCES.links.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#0f5f5c] underline hover:text-[#173f3b]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <CtaCard
          title="Have questions?"
          body="Contact our Sulphur Springs office — we're happy to help."
          primary={{ label: "Book online", href: "/book" }}
          secondary={{ label: "Call 903-919-5020", href: telHref("903-919-5020") }}
        />
      </div>
    </>
  );
}
