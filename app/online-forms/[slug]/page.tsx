import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { buildPageMetadata } from "@/lib/page-metadata";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { practiceThemeStyle } from "@/components/practice/theme";
import { getFormDefinition, flattenFields } from "@/lib/intakeForms/definitions";
import { getFormConfig, getGlobalConfig, getLegalTextMany } from "@/lib/intakeForms/config-db";
import { IntakeForm } from "@/components/online-forms/IntakeForm";
import { FormBranding } from "@/components/online-forms/FormBranding";
import type { Metadata } from "next";

// Reflect enable/disable toggles instantly (no redeploy, no caching).
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const def = getFormDefinition(slug);
  const title = def?.title ?? "Online Form";
  return buildPageMetadata({
    title,
    description: `Complete the ${title} online before your visit to Chiropractic Associates in Paris or Sulphur Springs, TX.`,
    path: `/online-forms/${slug}`,
  });
}

export default async function OnlineFormPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const previewMode = preview === "1" || preview === "true";
  const definition = getFormDefinition(slug);
  if (!definition) notFound();

  const [config, globalConfig] = await Promise.all([
    getFormConfig(slug),
    getGlobalConfig(),
  ]);
  if (!config) notFound();

  const legalKeys = Array.from(
    new Set(
      flattenFields(definition)
        .filter((f) => f.type === "legal-text" && f.cmsKey)
        .map((f) => f.cmsKey as string),
    ),
  );
  const legalText = await getLegalTextMany(legalKeys);

  const enabled = globalConfig.enabled && config.enabled;
  const themeStyle = practiceThemeStyle("paris-home") as CSSProperties;

  return (
    <div style={themeStyle}>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Patient Forms", url: "/patient-forms" },
          { name: config.title, url: `/online-forms/${slug}` },
        ]}
      />
      <PageHero
        eyebrow="Online Patient Forms"
        title={config.title.toUpperCase()}
        variant="paris"
      />
      <div className="mx-auto max-w-3xl px-4 pb-16">
        {previewMode && !enabled ? (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            Staff preview — this form is currently turned OFF for the public. You can click through
            it, but submissions are disabled until the form is enabled in Admin → Online forms.
          </div>
        ) : null}
        {!enabled && !previewMode ? (
          <div className="mx-auto max-w-xl rounded-lg border border-stone-200 bg-white p-8 text-center text-stone-700 shadow-sm">
            <p className="whitespace-pre-wrap">{config.disabledMessage}</p>
          </div>
        ) : (
          <IntakeForm
            config={config}
            definition={definition}
            legalText={legalText}
            preview={previewMode && !enabled}
          />
        )}
        <FormBranding brand={definition.brand} />
      </div>
    </div>
  );
}
