import { getContentMany } from "@/lib/cms";
import {
  SS_INJURIES,
  SS_PATIENT_RESOURCES,
  SS_SERVICES,
  type SSInjury,
  type SSService,
} from "@/lib/sulphur-springs-content";
import { ssPageBodyId, ssPageMetaId } from "@/lib/ss-cms-registry";

export { getSSStaffPageContent } from "@/lib/ss-staff-cms";

export type SSPageContent = {
  slug: string;
  title: string;
  metaDescription: string;
  body: string;
  kind: "service" | "injury";
};

function pickPage(slug: string): (SSService | SSInjury) | null {
  return SS_SERVICES.find((s) => s.slug === slug) ?? SS_INJURIES.find((i) => i.slug === slug) ?? null;
}

export async function getSSPageContent(slug: string): Promise<SSPageContent | null> {
  const base = pickPage(slug);
  if (!base) return null;

  const bodyId = ssPageBodyId(slug);
  const metaId = ssPageMetaId(slug);
  const cms = await getContentMany([bodyId, metaId]);
  const kind = SS_SERVICES.some((s) => s.slug === slug) ? "service" : "injury";

  return {
    slug,
    title: base.title,
    metaDescription: cms[metaId]?.trim() || base.metaDescription,
    body: cms[bodyId]?.trim() || base.body,
    kind,
  };
}

export async function getSSPatientResourcesIntro(): Promise<string> {
  const cms = await getContentMany(["ss_patient_resources_intro"]);
  return cms.ss_patient_resources_intro?.trim() || SS_PATIENT_RESOURCES.intro;
}

export function allSSPageSlugs(): string[] {
  return [...SS_SERVICES.map((s) => s.slug), ...SS_INJURIES.map((i) => i.slug)];
}
