import { cache } from "react";
import { getContentMany } from "@/lib/cms";
import { UI_TEXT_KEYS, resolveUiText, type UiText } from "@/lib/ui-text-cms";

export type { UiText, UiTextKey } from "@/lib/ui-text-cms";

/**
 * Server-side: the site-wide button labels / chrome strings with CMS overrides
 * applied. Cached per request so every component that needs a label shares
 * one Firestore read.
 */
export const getUiText = cache(async function getUiText(): Promise<UiText> {
  const cms = await getContentMany([...UI_TEXT_KEYS]);
  return resolveUiText(cms);
});
