import type { PageLayoutBlockDef, PageLayoutId } from "@/lib/page-layout";

export type PagePreviewData = {
  cms: Record<string, string>;
  teamNames: string[];
  doctorNames: string[];
};

export type PageBuilderPageMeta = {
  id: PageLayoutId;
  label: string;
  path: string;
  blocks: PageLayoutBlockDef[];
};

export function excerpt(text: string, max = 120): string {
  const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return "";
  return plain.length <= max ? plain : `${plain.slice(0, max)}…`;
}

export function cmsExcerpt(cms: Record<string, string>, fieldIds: string[] | undefined): string {
  for (const id of fieldIds ?? []) {
    const v = cms[id]?.trim();
    if (v) return excerpt(v);
  }
  return "";
}
