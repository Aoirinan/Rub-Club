import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getPageMeta } from "@/lib/page-meta";
import { getContentMany } from "@/lib/cms";
import { parisText } from "@/lib/paris-pages-cms";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { practiceThemeStyle } from "@/components/practice/theme";
import { listFormConfigs, getGlobalConfig } from "@/lib/intakeForms/config-db";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getPageMeta("online_forms", {
    title: "Online Patient Forms",
    description:
      "Complete your chiropractic, massage, pediatric, or accident intake paperwork online before your visit to Chiropractic Associates in Paris or Sulphur Springs, TX.",
  });
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: "/online-forms",
  });
}

const ONLINE_FORMS_COPY_IDS = [
  "online_forms_eyebrow",
  "online_forms_title",
  "online_forms_lede",
  "online_forms_unavailable_prefix",
  "online_forms_unavailable_link_label",
  "online_forms_unavailable_suffix",
  "online_forms_start_label",
] as const;

export default async function OnlineFormsIndex() {
  const [configs, globalConfig, copy] = await Promise.all([
    listFormConfigs(),
    getGlobalConfig(),
    getContentMany([...ONLINE_FORMS_COPY_IDS]),
  ]);
  const t = (id: string) => parisText(copy, id);
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
        eyebrow={t("online_forms_eyebrow")}
        title={t("online_forms_title")}
        lede={t("online_forms_lede")}
        variant="paris"
      />
      <div className="mx-auto max-w-3xl px-4 pb-16">
        {enabledForms.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-white p-8 text-center text-stone-700 shadow-sm">
            <p>
              {t("online_forms_unavailable_prefix")}{" "}
              <Link href="/patient-forms" className="font-bold text-[var(--pp-accent)] underline">
                {t("online_forms_unavailable_link_label")}
              </Link>{" "}
              {t("online_forms_unavailable_suffix")}
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
                    {t("online_forms_start_label")}
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
