import Image from "next/image";
import Link from "next/link";
import { LOCATIONS } from "@/lib/constants";
import { IMAGES } from "@/lib/home-images";
import { CHIRO, MASSAGE, TEAM } from "@/lib/home-verbatim";

export default function Home() {
  return (
    <div className="bg-[#f4f2ea]">
      <section className="relative min-h-[440px] overflow-hidden bg-[#0f5f5c]">
        <Image
          src={IMAGES.massageHeroBanner}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c3937]/90 via-[#0c3937]/55 to-transparent" />
        <div className="relative mx-auto flex min-h-[440px] max-w-6xl flex-col justify-center px-4 py-16 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#f2d25d]">
            {CHIRO.spineHeadline}
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-black leading-tight drop-shadow sm:text-5xl">
            {MASSAGE.heroTitle}
          </h1>
          <p className="mt-4 max-w-xl text-xl font-semibold text-white/95">{CHIRO.spineSub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/book"
              className="bg-[#f2d25d] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#173f3b] shadow hover:bg-[#e6c13d]"
            >
              Book Online
            </Link>
            <a
              className="border-2 border-white px-6 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white hover:text-[#173f3b]"
              href="tel:9037399959"
            >
              Call 903-739-9959
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-12">
        <section className="grid gap-4 md:grid-cols-4">
          {[
            {
              label: "DEEP TISSUE MASSAGE",
              href: "/#the-rub-club",
              img: IMAGES.serviceDeepTissue,
            },
            {
              label: "PRE-NATAL MASSAGE",
              href: "/#the-rub-club",
              img: IMAGES.servicePrenatal,
            },
            {
              label: "CHIROPRACTIC CARE",
              href: "/#chiropractic-associates",
              img: IMAGES.massageChiroTile,
            },
            {
              label: "SPORTS MASSAGE",
              href: "/#the-rub-club",
              img: IMAGES.serviceSports,
            },
          ].map((tile) => (
            <Link
              key={tile.label}
              href={tile.href}
              className="group relative flex min-h-[220px] flex-col justify-end overflow-hidden bg-[#173f3b] p-5 text-white shadow-lg"
            >
              <Image
                src={tile.img}
                alt=""
                fill
                className="object-cover transition duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <span className="relative text-base font-black tracking-wide">{tile.label}</span>
              <span className="relative mt-1 text-xs font-black uppercase tracking-wide text-[#f2d25d] group-hover:underline">
                LEARN MORE
              </span>
            </Link>
          ))}
        </section>

        <section
          id="the-rub-club"
          className="scroll-mt-32 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10"
        >
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="space-y-5">
              <h2 className="text-3xl font-black text-[#173f3b]">{MASSAGE.stressTitle}</h2>
              {MASSAGE.stressParas.map((p) => (
                <p key={p} className="leading-relaxed text-stone-700">
                  {p}
                </p>
              ))}
            </div>
            <div className="relative aspect-[4/3] overflow-hidden shadow-md lg:aspect-auto lg:min-h-[360px]">
              <Image
                src={IMAGES.massagePatient}
                alt="patient receiving treatment"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          <div className="mt-10 grid gap-10 border-t border-stone-200 pt-8 lg:grid-cols-2">
            <div>
              <h3 className="text-xl font-black text-[#173f3b]">{MASSAGE.whenTitle}</h3>
              <p className="mt-4 leading-relaxed text-stone-700">{MASSAGE.whenBody}</p>
            </div>
            <div>
              <h3 className="text-xl font-black text-[#173f3b]">{MASSAGE.treatmentsTitle}</h3>
              <p className="mt-4 leading-relaxed text-stone-700">{MASSAGE.treatmentsIntro}</p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-stone-700">
                {MASSAGE.treatmentsList.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 bg-[#f2efe3] p-6">
            <h3 className="text-2xl font-black text-[#173f3b]">{MASSAGE.closingTitle}</h3>
            {MASSAGE.closingParas.map((p) => (
              <p key={p} className="mt-4 leading-relaxed text-stone-700">
                {p}
              </p>
            ))}
          </div>
        </section>

        <section
          id="chiropractic-associates"
          className="scroll-mt-32 space-y-10 border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-5">
              <h2 className="text-3xl font-black text-[#173f3b]">{CHIRO.chooseTitle}</h2>
              <p className="leading-relaxed text-stone-700">{CHIRO.chooseLead}</p>
              <p className="leading-relaxed text-stone-700">{CHIRO.chooseP2}</p>
              <p className="leading-relaxed text-stone-700">{CHIRO.chooseP3}</p>
              <ul className="list-disc space-y-2 pl-6 text-stone-700">
                {CHIRO.conditions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <p className="font-bold text-stone-700">{CHIRO.treatmentsIntro}</p>
              <ul className="list-disc space-y-2 pl-6 text-stone-700">
                {CHIRO.treatments.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p className="leading-relaxed text-stone-700">{CHIRO.awards}</p>
            </div>
            <div className="relative aspect-[3/2] overflow-hidden shadow-lg lg:min-h-[320px]">
              <Image
                src={IMAGES.chiroBg}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          <div className="bg-[#173f3b] px-6 py-8 text-white shadow-inner sm:px-10">
            <h3 className="text-2xl font-black">{CHIRO.contactUsTitle}</h3>
            <p className="mt-4 leading-relaxed text-white/90">{CHIRO.mission}</p>
            <p className="mt-4 leading-relaxed text-white/90">{CHIRO.bookCta}</p>
          </div>

          <div className="border border-[#d8c061] bg-[#fff7d7] p-6 text-center shadow-sm">
            <p className="font-bold text-[#5a4a15]">{CHIRO.stretchP1}</p>
            <p className="mt-2 text-[#5a4a15]">{CHIRO.stretchP2}</p>
            <p className="mt-4 text-lg font-black uppercase tracking-wide text-[#0f5f5c]">
              <strong>{CHIRO.stretchCallPart1}</strong> <strong>{CHIRO.stretchCallPart2}</strong>
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { title: "Chiropractic Care" },
              { title: "Prenatal Care" },
              { title: "Pediatric Care" },
            ].map((card) => (
              <Link
                key={card.title}
                href="/#chiropractic-associates"
                className="flex flex-col items-center justify-center bg-[#0f5f5c] px-4 py-10 text-center text-lg font-black text-white shadow-md hover:bg-[#0f817b]"
              >
                {card.title}
              </Link>
            ))}
          </div>

          <div>
            <h3 className="text-2xl font-black text-[#173f3b]">{CHIRO.betterTitle}</h3>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div className="bg-stone-50 p-6 ring-1 ring-stone-200">
                <h4 className="text-lg font-black text-[#173f3b]">{CHIRO.teamHelpTitle}</h4>
                <p className="mt-3 leading-relaxed text-stone-700">{CHIRO.teamHelpBody}</p>
              </div>
              <div className="bg-stone-50 p-6 ring-1 ring-stone-200">
                <h4 className="text-lg font-black text-[#173f3b]">{CHIRO.qualityTitle}</h4>
                <p className="mt-3 leading-relaxed text-stone-700">{CHIRO.qualityBody}</p>
              </div>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="bg-white p-6 shadow ring-1 ring-[#0f5f5c]/15">
                <h4 className="text-base font-black uppercase tracking-wide text-[#173f3b]">
                  {CHIRO.mainOfficeTitle}
                </h4>
                <p className="mt-3 leading-relaxed text-stone-700">{CHIRO.mainOfficeBody}</p>
              </div>
              <div className="bg-white p-6 shadow ring-1 ring-[#0f5f5c]/15">
                <h4 className="text-base font-black uppercase tracking-wide text-[#173f3b]">
                  {CHIRO.secondLocationTitle}
                </h4>
                <p className="mt-3 leading-relaxed text-stone-700">{CHIRO.secondLocationBody}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <h2 className="text-center text-3xl font-black text-[#173f3b]">Meet the Team</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((member) => (
              <article
                key={member.name}
                className="flex flex-col overflow-hidden border border-stone-200 bg-stone-50 shadow-sm"
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
                  <h3 className="text-lg font-black text-[#173f3b]">{member.name}</h3>
                  {"role" in member ? <p className="text-sm font-bold text-stone-600">{member.role}</p> : null}
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-700">{member.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 overflow-hidden border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md lg:grid-cols-2 lg:items-center sm:p-10">
          <div>
            <h3 className="text-2xl font-black text-[#173f3b]">{MASSAGE.spineTitle}</h3>
            <p className="mt-4 leading-relaxed text-stone-700">{MASSAGE.spineBody}</p>
            <Link
              href={MASSAGE.spineHref}
              className="mt-6 inline-flex bg-[#0f5f5c] px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow hover:bg-[#0f817b]"
            >
              {MASSAGE.spineCta}
            </Link>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <Image
              src={IMAGES.spine3d}
              alt="3D Spine Simulator"
              fill
              className="object-cover shadow-md ring-1 ring-black/10"
              sizes="(max-width: 1024px) 100vw, 400px"
            />
          </div>
        </section>

        <section id="locations" className="scroll-mt-32 space-y-8 bg-[#173f3b] p-6 text-white shadow-xl sm:p-10">
          <h2 className="text-2xl font-black">{MASSAGE.contactTitle}</h2>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-black text-[#f2d25d]">{MASSAGE.hoursTitle}</h3>
              <p className="mt-1 text-sm text-white/80">{MASSAGE.hoursSubtitle}</p>
              <dl className="mt-4 space-y-2 text-sm">
                {MASSAGE.hours.map((row) => (
                  <div key={row.day} className="flex justify-between gap-4 border-b border-white/10 py-2">
                    <dt className="font-bold">{row.day}</dt>
                    <dd>{row.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="text-lg font-black text-[#f2d25d]">{MASSAGE.locationTitle}</h3>
              <p className="mt-4 text-xl font-black">{MASSAGE.rubClubAddressTitle}</p>
              <p className="mt-2 text-teal-50">
                <span className="block font-bold">Address</span>
                {MASSAGE.rubClubAddressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <p className="mt-4">
                <span className="block text-sm font-bold text-[#f2d25d]">Contact Information</span>
                <a className="text-lg font-black hover:underline" href="tel:9037399959">
                  903-739-9959
                </a>
              </p>
              <div className="mt-8 space-y-4 border-t border-white/15 pt-6 text-sm text-white/80">
                {Object.entries(LOCATIONS).map(([id, loc]) => (
                  <div key={id}>
                    <p className="font-black text-white">{loc.name}</p>
                    <p className="mt-1">
                      {loc.addressLines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </p>
                    <a
                      className="mt-1 inline-block font-bold text-[#f2d25d] hover:underline"
                      href={`tel:${loc.phonePrimary.replaceAll("-", "")}`}
                    >
                      {loc.phonePrimary}
                    </a>
                    {loc.phoneSecondary ? (
                      <p className="mt-1">
                        Massage desk:{" "}
                        <a
                          className="font-bold text-[#f2d25d] hover:underline"
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
              className="bg-[#f2d25d] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#173f3b] shadow hover:bg-[#e6c13d]"
            >
              Book online
            </Link>
          </div>
        </section>

        <footer className="border-t border-stone-300 pt-10 text-sm text-stone-600">
          <p>
            Online booking on this site collects only your contact details and preferred visit time so the office can
            confirm your appointment.
          </p>
          <p className="mt-2 text-stone-500">
            Practice photography, logos, and editorial content are used with written permission from the owners.
          </p>
        </footer>
      </div>
    </div>
  );
}
