import { buildPageMetadata } from "@/lib/page-metadata";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { telHref } from "@/lib/constants";
import { getDisplayLocations } from "@/lib/cms-display";
import { getParisStaffPageContent } from "@/lib/paris-staff-cms";
import { renderRichText } from "@/lib/cms";
import { resolveSiteStaffForBrand, type SiteStaffDisplayMember } from "@/lib/site-staff";

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: "Meet the Staff â€” Paris, TX Office",
  description:
    "Meet the Chiropractic Associates Paris office team â€” insurance, personal injury case management, front desk, therapy tech, rehab coaching, and marketing.",
  path: "/locations/paris/staff",
  ogTitle: "Meet the Staff â€” Paris, TX",
  ogDescription:
    "Insurance coordinators, case managers, front desk, and support staff at our Paris main office.",
});

function StaffPhoto({ member, className }: { member: SiteStaffDisplayMember; className?: string }) {
  if (member.image) {
    return (
      <div className={`relative aspect-[3/4] w-full overflow-hidden bg-stone-200 ${className ?? ""}`}>
        <Image
          src={member.image}
          alt={`Portrait of ${member.name}, ${member.role}`}
          unoptimized={member.image ? /^https?:\/\//i.test(member.image) : false}
          fill
          className="object-cover object-top"
          sizes="(max-width: 640px) 100vw, 33vw"
        />
      </div>
    );
  }
  return (
    <div
      className={`flex aspect-[3/4] w-full items-center justify-center bg-stone-200 ${className ?? ""}`}
    >
      <svg
        className="h-16 w-16 text-stone-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
        />
      </svg>
    </div>
  );
}

function BioBlock({ bio }: { bio: string }) {
  if (!bio.trim()) return null;
  return (
    <div className="space-y-4 leading-relaxed text-stone-700">
      {bio.split("\n\n").map((paragraph, i) => (
        <p
          key={i}
          dangerouslySetInnerHTML={{ __html: renderRichText(paragraph) }}
        />
      ))}
    </div>
  );
}

export default async function ParisOfficeStaffPage() {
  const [staff, page, displayLocs] = await Promise.all([
    resolveSiteStaffForBrand("paris"),
    getParisStaffPageContent(),
    getDisplayLocations(),
  ]);
  const paris = displayLocs.paris;

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Locations", url: "/locations/paris" },
          { name: "Paris, TX", url: "/locations/paris" },
          { name: "Meet the Staff", url: "/locations/paris/staff" },
        ]}
      />
      <PageHero
        eyebrow="Chiropractic Associates Â· Paris, TX"
        title={page.heroTitle}
        lede={page.heroLede}
      />

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16">
        <p className="text-center text-sm text-stone-600">
          Looking for massage therapists?{" "}
          <Link href="/services/massage" className="font-bold text-[#c0392b] underline">
            Meet The Rub Club team
          </Link>
          .
        </p>

        <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#4a1515]">{page.sectionHeading}</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {staff.map((member) => (
              <article
                key={member.id}
                className="flex flex-col overflow-hidden border border-stone-200 bg-stone-50 shadow-sm"
              >
                <StaffPhoto member={member} />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-black text-[#4a1515]">{member.name}</h3>
                  <p className="text-sm font-bold text-stone-600">{member.role}</p>
                  <BioBlock bio={member.bio} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <ScheduleCtaCard
          title={page.ctaTitle}
          body={page.ctaBody}
          secondary={{
            label: `Call ${paris.phonePrimary}`,
            href: telHref(paris.phonePrimary),
          }}
        />
      </div>
    </>
  );
}
