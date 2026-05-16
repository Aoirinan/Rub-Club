import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumbs, CtaCard, PageHero } from "@/components/PageChrome";
import { telHref, LOCATIONS } from "@/lib/constants";
import { publicBookingHref } from "@/lib/public-booking";
import { SS_STAFF, type SSStaffMember } from "@/lib/sulphur-springs-content";

const ss = LOCATIONS.sulphur_springs;
const [featured, ...rest] = SS_STAFF;

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

function StaffPhoto({ member, className }: { member: SSStaffMember; className?: string }) {
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
    <div className={`aspect-[3/4] w-full bg-stone-200 flex items-center justify-center ${className ?? ""}`}>
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

export default function SulphurSpringsStaffPage() {
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
        title="Meet the Sulphur Springs Team"
      />

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16">
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_2fr]">
            <StaffPhoto member={featured} />
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black text-[#173f3b]">
                  {featured.name}
                </h2>
                <p className="text-sm font-bold text-stone-600">
                  {featured.role}
                </p>
              </div>
              <div className="space-y-4 leading-relaxed text-stone-700">
                {featured.bio.split("\n\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">Our Team</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((member) => (
              <article
                key={member.name}
                className="flex flex-col overflow-hidden border border-stone-200 bg-stone-50 shadow-sm"
              >
                <StaffPhoto member={member} />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-black text-[#173f3b]">
                    {member.name}
                  </h3>
                  <p className="text-sm font-bold text-stone-600">
                    {member.role}
                  </p>
                  {member.bio ? (
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-700">
                      {member.bio}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <CtaCard
          title="Ready for relief?"
          body="Book an appointment online or give us a call — we're here to help you feel better and move better."
          primary={{ label: "Book online", href: publicBookingHref() }}
          secondary={{
            label: "Call 903-919-5020",
            href: telHref(ss.phonePrimary),
          }}
        />
      </div>
    </>
  );
}
