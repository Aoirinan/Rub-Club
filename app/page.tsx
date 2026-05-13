import Link from "next/link";
import { LOCATIONS } from "@/lib/constants";
import { chiro, hero, rubClub, siteTitle } from "@/lib/site-content";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl space-y-16 px-4 py-14">
      <section className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Paris &amp; Sulphur Springs, Texas
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          {hero.headline}
        </h1>
        <p className="max-w-3xl text-lg text-slate-600">{hero.sub}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/book"
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Book online
          </Link>
          <a
            href={`tel:${LOCATIONS.paris.phonePrimary.replaceAll("-", "")}`}
            className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:border-slate-400"
          >
            Call Paris: {LOCATIONS.paris.phonePrimary}
          </a>
        </div>
      </section>

      <section id="services" className="grid gap-8 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">{rubClub.name}</h2>
          <p className="mt-3 text-slate-600">{rubClub.blurb}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {rubClub.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">{chiro.name}</h2>
          <p className="mt-3 text-slate-600">{chiro.blurb}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {chiro.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </article>
      </section>

      <section id="locations" className="space-y-6">
        <h2 className="text-2xl font-semibold text-slate-900">Locations &amp; phones</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(LOCATIONS).map(([id, loc]) => (
            <div key={id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{loc.name}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {loc.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <p className="mt-3 text-sm font-medium text-slate-900">
                <a className="hover:underline" href={`tel:${loc.phonePrimary.replaceAll("-", "")}`}>
                  {loc.phonePrimary}
                </a>
              </p>
              {loc.phoneSecondary ? (
                <p className="mt-1 text-sm text-slate-700">
                  Massage desk:{" "}
                  <a
                    className="font-medium hover:underline"
                    href={`tel:${loc.phoneSecondary.replaceAll("-", "")}`}
                  >
                    {loc.phoneSecondary}
                  </a>
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 pt-8 text-sm text-slate-600">
        <p>{siteTitle}</p>
        <p className="mt-2">
          Online scheduling collects only contact details and your preferred time so the office can
          confirm your visit. Square payments can be added later.
        </p>
        <p className="mt-2 text-slate-500">
          Photography and logos on this site are used with the practice&apos;s permission.
        </p>
      </footer>
    </div>
  );
}
