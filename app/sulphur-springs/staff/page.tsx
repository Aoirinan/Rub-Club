import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { telHref, LOCATIONS } from "@/lib/constants";
import { renderRichText } from "@/lib/cms";
import { getSSStaffPageContent } from "@/lib/ss-cms-content";
import {
  resolveSiteStaffForBrand,
  splitFeaturedAndGrid,
  type SiteStaffDisplayMember,
} from "@/lib/site-staff";

const ss = LOCATIONS.sulphur_springs;

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Meet the Staff — Sulphur Springs Chiropractic",
  description:
    "Meet Dr. Conner Collins and the care team at Chiropractic Associates of Sulphur Springs. Chiropractor, massage therapists, rehab therapy, and front-desk staff serving Hopkins County, TX.",
  alternates: { canonical: "/sulphur-springs/staff" },
  openGraph: {
    title: "Meet the Staff — Sulphur Springs Chiropractic",
    description:
      "Dr. Conner Collins leads a dedicated team of massage therapists, rehab specialists, and support staff in Sulphur Springs, TX.",
    url: "/sulphur-springs/staff",
  },
};

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
    <div className={`flex aspect-[3/4] w-full items-center justify-center bg-stone-200 ${className ?? ""}`}>
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

export default async function SulphurSpringsStaffPage() {
  const [allStaff, page] = await Promise.all([
    resolveSiteStaffForBrand("sulphur"),
    getSSStaffPageContent(),
  ]);
  const { featured, grid: rest } = splitFeaturedAndGrid(allStaff);

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Sulphur Springs", url: "/sulphur-springs" },
          { name: "Meet the Staff", url: "/sulphur-springs/staff" },
        ]}
      />
      <PageHero
        eyebrow="Chiropractic Associates · Sulphur Springs"
        title={page.heroTitle}
        lede={page.heroLede || undefined}
      />

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16">
        {featured ? (
          <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_2fr]">
              <StaffPhoto member={featured} />
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black text-[#173f3b]">{featured.name}</h2>
                  <p className="text-sm font-bold text-stone-600">{featured.role}</p>
                </div>
                <BioBlock bio={featured.bio} />
              </div>
            </div>
          </section>
        ) : null}

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">{page.sectionHeading}</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((member) => (
              <article
                key={member.id}
                className="flex flex-col overflow-hidden border border-stone-200 bg-stone-50 shadow-sm"
              >
                <StaffPhoto member={member} />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-black text-[#173f3b]">{member.name}</h3>
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
            label: "Call 903-919-5020",
            href: telHref(ss.phonePrimary),
          }}
        />
      </div>
    </>
  );
}
