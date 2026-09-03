import { getContentMany } from "@/lib/cms";
import { pageMetaDescriptionId, pageMetaTitleId } from "@/lib/page-meta-cms";

/** Server-side: resolve a page's editable title/description with code fallbacks. */
export async function getPageMeta(
  key: string,
  fallback: { title: string; description: string },
): Promise<{ title: string; description: string }> {
  const tId = pageMetaTitleId(key);
  const dId = pageMetaDescriptionId(key);
  const cms = await getContentMany([tId, dId]);
  return {
    title: cms[tId]?.trim() || fallback.title,
    description: cms[dId]?.trim() || fallback.description,
  };
}
