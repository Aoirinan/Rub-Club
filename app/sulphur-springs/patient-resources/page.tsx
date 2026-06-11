import Link from "next/link";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { LocationHoursSection } from "@/components/LocationHoursSection";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { getSSPatientResourcesIntro } from "@/lib/ss-cms-content";
import { SS_PATIENT_RESOURCES, SS_RESOURCE_ARTICLES } from "@/lib/sulphur-springs-content";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { getSulphurOfficeHours } from "@/lib/office-hours";

export const metadata = buildPageMetadata({
  title: "Patient Resources â€” Sulphur Springs Chiropractic",
  description:
    "Chiropractic patient resources, helpful links, and educational topics from Chiropractic Associates of Sulphur Springs.",
  path: "/sulphur-springs/patient-resources",
  ogTitle: "Patient Resources â€” Sulphur Springs, TX",
});

export const revalidate = 60;

export default async function PatientResourcesPage() {
  const [intro, ssHours, displayLocs] = await Promise.all([
    getSSPatientResourcesIntro(),
    getSulphurOfficeHours(),
    getDisplayLocations(),
  ]);
  const ss = displayLocs.sulphur_springs;
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
        eyebrow="Chiropractic Associates Â· Sulphur Springs"
        title="Patient Resources"
      />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#015949] bg-white p-6 shadow-md sm:p-10">
          <div className="prose prose-stone max-w-none">
            <p className="leading-relaxed text-stone-700">{intro}</p>

            <h2 className="mt-8 text-xl font-black text-[#013a30]">
              About Chiropractic
            </h2>
            <p className="leading-relaxed text-stone-700">
              Learn more about how chiropractic works and why it helps:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              {SS_RESOURCE_ARTICLES.map((article) => (
                <li key={article.slug}>
                  <Link
                    href={`/sulphur-springs/${article.slug}`}
                    className="font-bold text-[#015949] underline hover:text-[#013a30]"
                  >
                    {article.title}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="mt-8 text-xl font-black text-[#013a30]">
              Helpful Links
            </h2>
            <ul className="list-disc space-y-2 pl-6">
              {SS_PATIENT_RESOURCES.links.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#015949] underline hover:text-[#013a30]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <LocationHoursSection location={ss} hours={ssHours} accent="#015949" />
        <ScheduleCtaCard
          title="Have questions?"
          body="Contact our Sulphur Springs office â€” we're happy to help."
          secondary={{ label: `Call ${ss.phonePrimary}`, href: telHref(ss.phonePrimary) }}
        />
      </div>
    </>
  );
}
