import type { ContentFieldMeta, ContentPageKey } from "@/lib/cms-registry";

/**
 * Browser-title + search-description fields for a public page. Each page owns
 * a stable `key` (e.g. "about", "ss_contact"); the fields sit in that page's
 * editor scope under a "Search & browser title" section.
 */
export const PAGE_META_SECTION = "Search & browser title";

export function pageMetaTitleId(key: string): string {
  return `page_${key}_meta_title`;
}

export function pageMetaDescriptionId(key: string): string {
  return `page_${key}_meta_description`;
}

export function pageMetaFields(
  key: string,
  pageLabel: ContentPageKey,
  sectionLabel: string = PAGE_META_SECTION,
): ContentFieldMeta[] {
  return [
    {
      id: pageMetaTitleId(key),
      pageLabel,
      sectionLabel,
      fieldLabel: "Browser tab / search result title",
      type: "text",
    },
    {
      id: pageMetaDescriptionId(key),
      pageLabel,
      sectionLabel,
      fieldLabel: "Search result description",
      type: "text",
    },
  ];
}

export function pageMetaDefaults(
  key: string,
  defaults: { title: string; description: string },
): Record<string, string> {
  return {
    [pageMetaTitleId(key)]: defaults.title,
    [pageMetaDescriptionId(key)]: defaults.description,
  };
}
