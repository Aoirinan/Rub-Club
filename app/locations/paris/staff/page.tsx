import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { telHref, LOCATIONS } from "@/lib/constants";
import { getParisOfficeStaffForDisplay } from "@/lib/paris-staff-cms";
import type { ParisOfficeStaffMember } from "@/lib/paris-office-staff";

const paris = LOCATIONS.paris;

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Meet the Staff — Paris, TX Office",
  description:
    "Meet the Chiropractic Associates Paris office team — insurance, personal injury case management, front desk, therapy tech, rehab coaching, and marketing.",
  alternates: { canonical: "/locations/paris/staff" },
  openGraph: {
    title: "Meet the Staff — Paris, TX",
    description:
      "Insurance coordinators, case managers, front desk, and support staff at our Paris main office.",
    url: "/locations/paris/staff",
  },
};

function StaffPhoto({ member, className }: { member: ParisOfficeStaffMember; className?: string }) {
  if (member.image) {
    return (
      <div className={`relative aspect-[3/4] w-full overflow-hidden bg-stone-200 ${className ?? ""}`}>
        <Image
          src={member.image}
          alt={`Portrait of ${member.name}, ${member.role}`}
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
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}

export default async function ParisOfficeStaffPage() {
  const staff = await getParisOfficeStaffForDisplay();

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
        eyebrow="Chiropractic Associates · Paris, TX"
        title="Meet Our Paris Office Team"
        lede="Insurance, personal injury, front desk, therapy, and marketing — the people who keep our Paris office running smoothly. Licensed massage therapists are listed separately at The Rub Club."
      />

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16">
        <p className="text-center text-sm text-stone-600">
          Looking for massage therapists?{" "}
          <Link href="/services/massage" className="font-bold text-[#0f5f5c] underline">
            Meet The Rub Club team
          </Link>
          .
        </p>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">Our Team</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {staff.map((member) => (
              <article
                key={member.name}
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
          title="Questions about insurance or billing?"
          body="Call our Paris office and our team will help verify benefits or walk you through personal injury and auto-injury paperwork."
          secondary={{
            label: "Call 903-785-5551",
            href: telHref(paris.phonePrimary),
          }}
        />
      </div>
    </>
  );
}
