import Link from "next/link";
import type { CSSProperties } from "react";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { practiceThemeStyle } from "@/components/practice/theme";
import { listFormConfigs, getGlobalConfig } from "@/lib/intakeForms/config-db";

export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Online Patient Forms",
  description:
    "Complete your chiropractic, massage, pediatric, or accident intake paperwork online before your visit to Chiropractic Associates in Paris or Sulphur Springs, TX.",
  path: "/online-forms",
});

export default async function OnlineFormsIndex() {
  const [configs, globalConfig] = await Promise.all([listFormConfigs(), getGlobalConfig()]);
  const enabledForms = globalConfig.enabled ? configs.filter((c) => c.enabled) : [];
  const themeStyle = practiceThemeStyle("paris-home") as CSSProperties;

  return (
    <div style={themeStyle}>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Patient Forms", url: "/patient-forms" },
          { name: "Online Forms", url: "/online-forms" },
        ]}
      />
      <PageHero
        eyebrow="Before Your Visit"
        title="ONLINE PATIENT FORMS"
        lede="Save time at your appointment by completing your paperwork online."
        variant="paris"
      />
      <div className="mx-auto max-w-3xl px-4 pb-16">
        {enabledForms.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-white p-8 text-center text-stone-700 shadow-sm">
            <p>
              Our online forms are temporarily unavailable. Please{" "}
              <Link href="/patient-forms" className="font-bold text-[var(--pp-accent)] underline">
                download the printable patient forms
              </Link>{" "}
              or call our office and we&apos;ll be glad to help.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {enabledForms.map((form) => (
              <li key={form.slug}>
                <Link
                  href={`/online-forms/${form.slug}`}
                  className="focus-ring flex items-center justify-between gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:border-[var(--pp-accent)] hover:shadow-md"
                >
                  <span className="text-lg font-black text-[var(--pp-heading)]">{form.title}</span>
                  <span className="text-sm font-bold uppercase tracking-wide text-[var(--pp-accent)]">
                    Start →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
