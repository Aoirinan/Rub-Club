import Image from "next/image";
import Link from "next/link";
import { LOCATIONS } from "@/lib/constants";
import { IMAGES } from "@/lib/home-images";
import { CHIRO, MASSAGE, TEAM } from "@/lib/home-verbatim";

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-emerald-50/80 via-stone-50 to-amber-50/40">
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 px-4 py-2 text-center text-sm font-semibold text-white shadow-md">
        <span className="inline-block">( Main Office ) Paris, TX 903-785-5551</span>
        <span className="mx-3 hidden text-emerald-200/80 sm:inline" aria-hidden>
          |
        </span>
        <span className="mt-1 inline-block sm:mt-0">Sulphur Springs, TX 903-919-5020</span>
        <span className="mx-3 hidden text-emerald-200/80 md:inline" aria-hidden>
          |
        </span>
        <a className="mt-1 block font-bold text-amber-200 hover:underline md:mt-0 md:inline" href="tel:9037399959">
          The Rub Club: 903-739-9959
        </a>
      </div>

      <div className="mx-auto max-w-6xl space-y-0 px-4 pb-16 pt-8">
        <section className="grid gap-6 overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5 md:grid-cols-2">
          <div className="relative min-h-[280px] bg-slate-900 md:min-h-[320px]">
            <Image
              src={IMAGES.chiroBlade}
              alt=""
              fill
              priority
              className="object-cover opacity-90"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />
            <div className="relative flex h-full min-h-[280px] flex-col justify-end p-8 text-white md:min-h-[320px]">
              <p className="text-sm font-bold uppercase tracking-widest text-teal-200">
                {CHIRO.spineHeadline}
              </p>
              <p className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">{CHIRO.spineSub}</p>
              <p className="mt-4 text-sm text-teal-100">
                <a
                  className="font-semibold underline decoration-teal-300/80 hover:text-white"
                  href="https://www.chiropracticparistexas.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Wellness Care Plans
                </a>
              </p>
            </div>
          </div>
          <div className="relative min-h-[280px] bg-teal-950 md:min-h-[320px]">
            <Image
              src={IMAGES.massageHeroBanner}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-teal-950/85 to-transparent" />
            <div className="relative flex min-h-[280px] flex-col justify-center p-8 text-white md:min-h-[320px]">
              <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{MASSAGE.heroTitle}</h1>
            </div>
          </div>
        </section>

        <section id="the-rub-club" className="mt-14 scroll-mt-24 space-y-10 rounded-3xl bg-white/90 p-8 shadow-lg ring-1 ring-teal-900/10 sm:p-10">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="space-y-5">
              <h2 className="text-3xl font-bold text-teal-900">{MASSAGE.stressTitle}</h2>
              {MASSAGE.stressParas.map((p) => (
                <p key={p} className="leading-relaxed text-stone-800">
                  {p}
                </p>
              ))}
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md ring-1 ring-black/10 lg:aspect-auto lg:min-h-[360px]">
              <Image
                src={IMAGES.massagePatient}
                alt="patient receiving treatment"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "DEEP TISSUE MASSAGE",
                href: "https://www.massageparistexas.com/deep-tissue-massage",
                img: IMAGES.serviceDeepTissue,
              },
              {
                label: "PRE-NATAL MASSAGE",
                href: "https://www.massageparistexas.com/prenatal-massage",
                img: IMAGES.servicePrenatal,
              },
              {
                label: "CHIROPRACTIC CARE",
                href: "https://www.massageparistexas.com/chiropractic-care",
                img: IMAGES.massageChiroTile,
              },
              {
                label: "SPORTS MASSAGE",
                href: "https://www.massageparistexas.com/sports-massage",
                img: IMAGES.serviceSports,
              },
            ].map((tile) => (
              <a
                key={tile.label}
                href={tile.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-2xl bg-slate-900 p-4 text-white shadow-md ring-1 ring-black/10"
              >
                <Image
                  src={tile.img}
                  alt=""
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="relative text-sm font-bold tracking-wide">{tile.label}</span>
                <span className="relative mt-1 text-xs font-semibold uppercase text-amber-200 group-hover:underline">
                  LEARN MORE
                </span>
              </a>
            ))}
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold text-teal-900">{MASSAGE.whenTitle}</h3>
              <p className="mt-4 leading-relaxed text-stone-800">{MASSAGE.whenBody}</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-teal-900">{MASSAGE.treatmentsTitle}</h3>
              <p className="mt-4 leading-relaxed text-stone-800">{MASSAGE.treatmentsIntro}</p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-stone-800">
                {MASSAGE.treatmentsList.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-amber-50/60 p-8 ring-1 ring-teal-800/10">
            <h3 className="text-2xl font-bold text-teal-900">{MASSAGE.closingTitle}</h3>
            {MASSAGE.closingParas.map((p) => (
              <p key={p} className="mt-4 leading-relaxed text-stone-800">
                {p}
              </p>
            ))}
          </div>
        </section>

        <section
          id="chiropractic-associates"
          className="scroll-mt-24 space-y-10 rounded-3xl bg-white/90 p-8 shadow-lg ring-1 ring-emerald-900/10 sm:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-5">
              <h2 className="text-3xl font-bold text-emerald-900">{CHIRO.chooseTitle}</h2>
              <p className="leading-relaxed text-stone-800">{CHIRO.chooseLead}</p>
              <p className="leading-relaxed text-stone-800">{CHIRO.chooseP2}</p>
              <p className="leading-relaxed text-stone-800">{CHIRO.chooseP3}</p>
              <ul className="list-disc space-y-2 pl-6 text-stone-800">
                {CHIRO.conditions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <p className="font-medium text-stone-800">{CHIRO.treatmentsIntro}</p>
              <ul className="list-disc space-y-2 pl-6 text-stone-800">
                {CHIRO.treatments.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p className="leading-relaxed text-stone-800">{CHIRO.awards}</p>
            </div>
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/10 lg:min-h-[320px]">
              <Image
                src={IMAGES.chiroBg}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-emerald-900 px-6 py-8 text-white shadow-inner sm:px-10">
            <h3 className="text-2xl font-bold">{CHIRO.contactUsTitle}</h3>
            <p className="mt-4 leading-relaxed text-emerald-50">{CHIRO.mission}</p>
            <p className="mt-4 leading-relaxed text-emerald-50">{CHIRO.bookCta}</p>
          </div>

          <div className="rounded-2xl border border-amber-300/60 bg-amber-50 p-6 text-center shadow-sm">
            <p className="font-semibold text-amber-950">{CHIRO.stretchP1}</p>
            <p className="mt-2 text-amber-950">{CHIRO.stretchP2}</p>
            <p className="mt-4 text-lg font-black uppercase tracking-wide text-teal-800">
              <strong>{CHIRO.stretchCallPart1}</strong> <strong>{CHIRO.stretchCallPart2}</strong>
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Chiropractic Care",
                href: "https://www.chiropracticparistexas.com/adjustments-and-manipulation",
              },
              {
                title: "Prenatal Care",
                href: "https://www.chiropracticparistexas.com/prenatal-chiropractic",
              },
              {
                title: "Pediatric Care",
                href: "https://www.chiropracticparistexas.com/pediatric-care",
              },
            ].map((card) => (
              <a
                key={card.title}
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-emerald-800 to-teal-900 px-4 py-10 text-center text-lg font-bold text-white shadow-md ring-1 ring-black/10 hover:from-emerald-700 hover:to-teal-800"
              >
                {card.title}
              </a>
            ))}
          </div>

          <div>
            <h3 className="text-2xl font-bold text-emerald-900">{CHIRO.betterTitle}</h3>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div className="rounded-2xl bg-stone-50 p-6 ring-1 ring-stone-200">
                <h4 className="text-lg font-bold text-emerald-900">{CHIRO.teamHelpTitle}</h4>
                <p className="mt-3 leading-relaxed text-stone-800">{CHIRO.teamHelpBody}</p>
              </div>
              <div className="rounded-2xl bg-stone-50 p-6 ring-1 ring-stone-200">
                <h4 className="text-lg font-bold text-emerald-900">{CHIRO.qualityTitle}</h4>
                <p className="mt-3 leading-relaxed text-stone-800">{CHIRO.qualityBody}</p>
              </div>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow ring-1 ring-emerald-900/10">
                <h4 className="text-base font-bold uppercase tracking-wide text-emerald-900">
                  {CHIRO.mainOfficeTitle}
                </h4>
                <p className="mt-3 leading-relaxed text-stone-800">{CHIRO.mainOfficeBody}</p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow ring-1 ring-emerald-900/10">
                <h4 className="text-base font-bold uppercase tracking-wide text-emerald-900">
                  {CHIRO.secondLocationTitle}
                </h4>
                <p className="mt-3 leading-relaxed text-stone-800">{CHIRO.secondLocationBody}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white/90 p-8 shadow-lg ring-1 ring-teal-900/10 sm:p-10">
          <h2 className="text-center text-3xl font-bold text-teal-900">Meet the Team</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((member) => (
              <article
                key={member.name}
                className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-stone-50/80 shadow-sm"
              >
                <div className="relative aspect-[3/4] w-full bg-stone-200">
                  <Image
                    src={IMAGES[member.imageKey]}
                    alt={member.name}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-bold text-teal-900">{member.name}</h3>
                  {"role" in member ? (
                    <p className="text-sm font-semibold text-stone-600">{member.role}</p>
                  ) : null}
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-800">{member.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 overflow-hidden rounded-3xl bg-white/95 p-8 shadow-lg ring-1 ring-teal-900/10 lg:grid-cols-2 lg:items-center sm:p-10">
          <div>
            <h3 className="text-2xl font-bold text-teal-900">{MASSAGE.spineTitle}</h3>
            <p className="mt-4 leading-relaxed text-stone-800">{MASSAGE.spineBody}</p>
            <a
              href={MASSAGE.spineHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex rounded-full bg-teal-700 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow hover:bg-teal-800"
            >
              {MASSAGE.spineCta}
            </a>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <Image
              src={IMAGES.spine3d}
              alt="3D Spine Simulator"
              fill
              className="rounded-2xl object-cover shadow-md ring-1 ring-black/10"
              sizes="(max-width: 1024px) 100vw, 400px"
            />
          </div>
        </section>

        <section id="locations" className="scroll-mt-24 space-y-8 rounded-3xl bg-gradient-to-br from-teal-900 to-emerald-950 p-8 text-white shadow-xl sm:p-10">
          <h2 className="text-2xl font-bold">{MASSAGE.contactTitle}</h2>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-bold text-teal-200">{MASSAGE.hoursTitle}</h3>
              <p className="mt-1 text-sm text-teal-100/90">{MASSAGE.hoursSubtitle}</p>
              <dl className="mt-4 space-y-2 text-sm">
                {MASSAGE.hours.map((row) => (
                  <div key={row.day} className="flex justify-between gap-4 border-b border-white/10 py-2">
                    <dt className="font-semibold">{row.day}</dt>
                    <dd>{row.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="text-lg font-bold text-teal-200">{MASSAGE.locationTitle}</h3>
              <p className="mt-4 text-xl font-bold">{MASSAGE.rubClubAddressTitle}</p>
              <p className="mt-2 text-teal-50">
                <span className="block font-semibold">Address</span>
                {MASSAGE.rubClubAddressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <p className="mt-4">
                <span className="block text-sm font-semibold text-teal-200">Contact Information</span>
                <a className="text-lg font-bold hover:underline" href="tel:9037399959">
                  903-739-9959
                </a>
              </p>
              <div className="mt-8 space-y-4 border-t border-white/15 pt-6 text-sm text-teal-100">
                {Object.entries(LOCATIONS).map(([id, loc]) => (
                  <div key={id}>
                    <p className="font-bold text-white">{loc.name}</p>
                    <p className="mt-1">
                      {loc.addressLines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </p>
                    <a
                      className="mt-1 inline-block font-semibold text-amber-200 hover:underline"
                      href={`tel:${loc.phonePrimary.replaceAll("-", "")}`}
                    >
                      {loc.phonePrimary}
                    </a>
                    {loc.phoneSecondary ? (
                      <p className="mt-1">
                        Massage desk:{" "}
                        <a
                          className="font-semibold text-amber-200 hover:underline"
                          href={`tel:${loc.phoneSecondary.replaceAll("-", "")}`}
                        >
                          {loc.phoneSecondary}
                        </a>
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-white/15 pt-6">
            <Link
              href="/book"
              className="rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-emerald-950 shadow hover:bg-amber-300"
            >
              Book online
            </Link>
            <a
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              href="https://www.massageparistexas.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.massageparistexas.com
            </a>
            <a
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              href="https://www.chiropracticparistexas.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.chiropracticparistexas.com
            </a>
          </div>
        </section>

        <footer className="border-t border-stone-200 pt-10 text-sm text-stone-600">
          <p>
            Online scheduling on this app collects only contact details and your preferred time so the office can
            confirm your visit.
          </p>
          <p className="mt-2">
            Copy on this page is taken from the practices’ public websites:{" "}
            <a
              className="font-medium text-teal-800 underline hover:text-teal-950"
              href="https://www.massageparistexas.com/"
            >
              massageparistexas.com
            </a>{" "}
            and{" "}
            <a
              className="font-medium text-teal-800 underline hover:text-teal-950"
              href="https://www.chiropracticparistexas.com/"
            >
              chiropracticparistexas.com
            </a>
            .
          </p>
          <p className="mt-2 text-stone-500">
            Photography and logos on this site are used with the practice&apos;s permission.
          </p>
        </footer>
      </div>
    </div>
  );
}
