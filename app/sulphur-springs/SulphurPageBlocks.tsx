import Image from "next/image";
import Link from "next/link";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { OfficeHoursTable } from "@/components/OfficeHoursTable";
import { renderRichText } from "@/lib/cms";
import { SS_SERVICE_NAV, SS_INJURY_NAV } from "@/lib/sulphur-springs-content";
import type { OfficeHoursRow } from "@/lib/office-hours";
import { telHref, type LocationInfo } from "@/lib/constants";

export type SulphurDoctor = {
  name: string;
  role: string;
  image: string;
  bio: string;
};

export type SulphurPageData = {
  heroHeading: string;
  introParagraphs: string[];
  ss: LocationInfo;
  ssOfficeHours: OfficeHoursRow[];
  doctor: SulphurDoctor;
};

export function SulphurPageBlock({ id, data }: { id: string; data: SulphurPageData }) {
  switch (id) {
    case "featured_services":
      return (
        <section aria-label="Featured services" className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Pain Relief", href: "/sulphur-springs/common-chiropractic-conditions", desc: "Chiropractic care can help you manage your pain." },
            { label: "Adjustments", href: "/sulphur-springs/adjustments-and-manipulation", desc: "Keep the body functioning at its highest level." },
            { label: "Sports Injury", href: "/sulphur-springs/sports-injury", desc: "Reach an optimum level of achievement." },
            { label: "Auto Injury", href: "/sulphur-springs/auto-injury", desc: "No underlying injuries after a car accident." },
          ].map((tile) => (
            <Link
              key={tile.label}
              href={tile.href}
              className="group border-t-4 border-[#2980b9] bg-white p-5 shadow-md transition hover:shadow-lg"
            >
              <h2 className="text-base font-black text-[#173f3b] group-hover:text-[#2980b9]">{tile.label}</h2>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">{tile.desc}</p>
              <span className="mt-3 inline-block text-xs font-black uppercase tracking-wide text-[#2980b9]">Click Here</span>
            </Link>
          ))}
        </section>
      );
    case "intro":
      return (
        <section className="grid gap-10 border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-[#173f3b]">{data.heroHeading}</h2>
            {data.introParagraphs.map((p) => (
              <p
                key={p.slice(0, 40)}
                className="leading-relaxed text-stone-700"
                dangerouslySetInnerHTML={{ __html: renderRichText(p) }}
              />
            ))}
            <p className="leading-relaxed text-stone-700">
              Upon your initial examination, we will discuss with you our findings and what they mean. We will create a custom treatment plan to get you to where you want to be, whether that means less pain, better performance, or just better overall health.
            </p>
            <p className="leading-relaxed text-stone-700">
              Through our expert care, our advanced office, and our caring staff, we will help you not only get back on your feet, but understand how spine health affects your overall quality of life.
            </p>
          </div>
          <aside className="space-y-6 border-t border-stone-200 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide text-[#2980b9]">Our Location</h3>
              <p className="mt-2 font-bold text-[#173f3b]">{data.ss.addressLines.join(", ")}</p>
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide text-[#2980b9]">Office Hours</h3>
              <OfficeHoursTable
                rows={data.ssOfficeHours}
                dayClassName="font-medium text-stone-800"
                rowClassName="flex justify-between gap-3 border-b border-stone-100 py-1 text-sm text-stone-700"
              />
            </div>
            <a href={telHref(data.ss.phonePrimary)} className="inline-block text-lg font-black text-[#2980b9] hover:underline">
              (903) 919-5020
            </a>
          </aside>
        </section>
      );
    case "doctor":
      return (
        <section className="grid gap-8 border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10 lg:grid-cols-[minmax(0,1fr)_2fr]">
          {data.doctor.image ? (
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-200">
              <Image
                src={data.doctor.image}
                alt={`Portrait of ${data.doctor.name}, ${data.doctor.role}`}
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
            </div>
          ) : null}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-[#173f3b]">{data.doctor.name}</h2>
              <p className="text-sm font-bold text-stone-600">{data.doctor.role}</p>
            </div>
            <p className="leading-relaxed text-stone-700">{data.doctor.bio.split("\n\n")[0]}</p>
            <Link
              href="/sulphur-springs/staff"
              className="focus-ring inline-flex bg-[#2980b9] px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-[#1a6da3]"
            >
              Meet the full team
            </Link>
          </div>
        </section>
      );
    case "all_services":
      return (
        <section className="border-t-4 border-[#2980b9] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-2xl font-black text-[#173f3b]">Our Services</h2>
          <p className="mt-2 text-stone-600">
            We offer a variety of services to treat common conditions and injuries. Call (903) 919-5020 for more information.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SS_SERVICE_NAV.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group flex items-center gap-3 rounded border border-stone-200 bg-stone-50 px-4 py-3 transition hover:border-[#2980b9]/30 hover:bg-[#2980b9]/5"
              >
                <span className="text-sm font-bold text-[#173f3b] group-hover:text-[#2980b9]">{s.label}</span>
                <span className="ml-auto text-stone-400 group-hover:text-[#2980b9]" aria-hidden>&rarr;</span>
              </Link>
            ))}
          </div>
          <h3 className="mt-10 text-lg font-black text-[#173f3b]">Injuries</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SS_INJURY_NAV.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className="group flex items-center gap-3 rounded border border-stone-200 bg-stone-50 px-4 py-3 transition hover:border-[#2980b9]/30 hover:bg-[#2980b9]/5"
              >
                <span className="text-sm font-bold text-[#173f3b] group-hover:text-[#2980b9]">{i.label}</span>
                <span className="ml-auto text-stone-400 group-hover:text-[#2980b9]" aria-hidden>&rarr;</span>
              </Link>
            ))}
          </div>
        </section>
      );
    case "quick_links":
      return (
        <section className="grid gap-6 sm:grid-cols-2">
          <Link
            href="/sulphur-springs/patient-resources"
            className="group border-t-4 border-[#2980b9] bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
          >
            <h2 className="text-xl font-black text-[#173f3b] group-hover:underline">Patient Resources</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Helpful links and information about chiropractic care.
            </p>
          </Link>
          <Link
            href="/sulphur-springs/q-and-a"
            className="group border-t-4 border-[#2980b9] bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
          >
            <h2 className="text-xl font-black text-[#173f3b] group-hover:underline">Questions &amp; Answers</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Common questions about chiropractic treatment answered.
            </p>
          </Link>
        </section>
      );
    case "schedule_cta":
      return (
        <ScheduleCtaCard
          title="Ready for relief?"
          body="Book an appointment online or give us a call — we're here to help you feel better and move better."
          bookLabel="Request appointment"
          secondary={{ label: "Call (903) 919-5020", href: telHref(data.ss.phonePrimary) }}
        />
      );
    default:
      return null;
  }
}
